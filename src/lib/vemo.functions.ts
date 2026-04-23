import { createServerFn } from "@tanstack/react-start";
import { useSession } from "@tanstack/react-start/server";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { getSegmentFromPrimaryUse } from "@/lib/vemo-config";
import {
  activationFeeSchema,
  cardSortSchema,
  completionSchema,
  hubBuilderSchema,
  moderatorFilterSchema,
  moderatorPinSchema,
  participantProfileSchema,
  photoGroupingSchema,
  submissionIdSchema,
} from "@/lib/vemo-schemas";

const moderatorSessionConfig = {
  password: process.env.SUPABASE_SERVICE_ROLE_KEY ?? "vemo-fallback-session-password",
  name: "vemo-moderator-session",
  maxAge: 60 * 60 * 24,
  cookie: {
    httpOnly: true,
    path: "/",
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
  },
};

function ensure<T>(value: T | null, message: string) {
  if (value == null) {
    throw new Error(message);
  }
  return value;
}

function normalizeChildRecord<T>(value: T | T[] | null | undefined) {
  if (Array.isArray(value)) return value[0] ?? null;
  return value ?? null;
}

function buildSubmissionQuery() {
  return supabaseAdmin
    .from("test_submissions")
    .select(
      "*, ex1_activation_fee(*), ex2_card_sort(*), ex3_photo_grouping(*), ex4_hub_builder(*)",
    )
    .order("started_at", { ascending: false });
}

function serializeSubmission(row: any) {
  return {
    ...row,
    ex1_activation_fee: normalizeChildRecord(row.ex1_activation_fee),
    ex2_card_sort: normalizeChildRecord(row.ex2_card_sort),
    ex3_photo_grouping: normalizeChildRecord(row.ex3_photo_grouping),
    ex4_hub_builder: normalizeChildRecord(row.ex4_hub_builder),
  };
}

async function safeProgressUpdate(
  submissionId: string,
  status: "started" | "in_progress" | "completed" | "abandoned",
  exercise: "ticket_ab" | "card_sort" | "photos" | "hub_builder",
  extra: Record<string, any> = {},
) {
  const payload = {
    status,
    current_exercise: exercise,
    last_screen_at: new Date().toISOString(),
    ...extra,
  };

  let { error } = await supabaseAdmin
    .from("test_submissions")
    .update(payload as any)
    .eq("id", submissionId);

  // Legacy compatibility: old projects don't have current_exercise / last_screen_at.
  if (error && /current_exercise|last_screen_at/.test(String(error.message))) {
    ({ error } = await supabaseAdmin
      .from("test_submissions")
      .update({
        status,
        exercise_code: exercise,
        ...extra,
      } as any)
      .eq("id", submissionId));
  }

  if (error) throw new Error("No se pudo actualizar el progreso de la sesión.");
}

export const createSubmission = createServerFn({ method: "POST" })
  .inputValidator(participantProfileSchema)
  .handler(async ({ data }) => {
    const normalizedAlias = data.alias.trim() || `Participante ${new Date().toISOString().slice(11, 19)}`;
    const segment = getSegmentFromPrimaryUse(data.usoPrincipal);

    const basePayload = {
      alias: normalizedAlias,
      watts_mail: data.wattsMail.trim().toLowerCase(),
      edad_rango: data.edadRango,
      tipo_vehiculo: data.tipoVehiculo,
      empresa: data.empresa?.trim() || null,
      uso_principal: data.usoPrincipal,
      frecuencia_carga: data.frecuenciaCarga,
      meses_en_vemo: data.mesesEnVemo,
      ciudad: data.ciudad?.trim() || null,
      link_source: data.linkSource?.trim() || null,
      segmento: segment,
      current_exercise: "ticket_ab",
      last_screen_at: new Date().toISOString(),
      status: "started",
    };

    let { data: submission, error } = await supabaseAdmin
      .from("test_submissions")
      .insert(basePayload as any)
      .select("*")
      .single();

    // Backward compatibility: some projects still enforce moderated legacy columns.
    if (error && /session_label|focus_group|exercise_code/.test(String(error.message))) {
      ({ data: submission, error } = await supabaseAdmin
        .from("test_submissions")
        .insert({
          ...basePayload,
          session_label: "Activation Fee - B2C",
          focus_group: "no_moderado",
          exercise_code: "ticket_ab",
        } as any)
        .select("*")
        .single());
    }

    // Legacy compatibility: some projects don't have the latest columns/checks yet.
    // Fall back to the closest supported payload so participants can still continue the flow.
    if (error && /watts_mail|empresa|current_exercise|last_screen_at|tipo_vehiculo|uso_principal/.test(String(error.message))) {
      const fallbackVehicle = data.tipoVehiculo === "own_ev_credit" ? "own_ev" : data.tipoVehiculo;
      ({ data: submission, error } = await supabaseAdmin
        .from("test_submissions")
        .insert({
          alias: normalizedAlias,
          edad_rango: data.edadRango,
          tipo_vehiculo: fallbackVehicle,
          uso_principal: data.usoPrincipal,
          frecuencia_carga: data.frecuenciaCarga,
          meses_en_vemo: data.mesesEnVemo,
          ciudad: data.ciudad?.trim() || null,
          link_source: data.linkSource?.trim() || null,
          segmento: segment,
          status: "started",
          session_label: "Activation Fee - B2C",
          focus_group: "no_moderado",
          exercise_code: "ticket_ab",
        } as any)
        .select("*")
        .single());
    }

    if (error) {
      throw new Error("No se pudo iniciar el ejercicio.");
    }

    const submissionId = ensure(submission, "No se creó la sesión de prueba.").id;

    const [{ error: activationError }, { error: cardSortError }, { error: photosError }, { error: hubBuilderError }] = await Promise.all([
      supabaseAdmin.from("ex1_activation_fee").insert({ submission_id: submissionId }),
      supabaseAdmin.from("ex2_card_sort").insert({ submission_id: submissionId, ordered_items: [] }),
      supabaseAdmin.from("ex3_photo_grouping").insert({ submission_id: submissionId, group_assignments: {}, group_details: [] }),
      (supabaseAdmin as any).from("ex4_hub_builder").insert({ submission_id: submissionId, selected_addons: [], final_price: 7, delta_vs_base: 0 }),
    ]);

    if (activationError) throw new Error("No se pudo preparar el ejercicio Ticket A/B.");
    if (cardSortError) throw new Error("No se pudo preparar el ejercicio Card sort.");
    if (photosError) throw new Error("No se pudo preparar el ejercicio Photos.");
    if (hubBuilderError && !String(hubBuilderError.message).includes("ex4_hub_builder")) {
      throw new Error("No se pudo preparar el ejercicio Hub ideal.");
    }

    return { submissionId };
  });

export const saveActivationFee = createServerFn({ method: "POST" })
  .inputValidator(activationFeeSchema)
  .handler(async ({ data }) => {
    const { error } = await supabaseAdmin.from("ex1_activation_fee").upsert(
      {
        submission_id: data.submissionId,
        ticket_a_observation: data.ticketAObservation,
        ticket_b_observation: data.ticketBObservation,
        clearer_choice: data.clearerChoice,
        fairer_choice: data.fairerChoice,
        pay_choice: data.payChoice,
        comparison_reason: data.comparisonReason,
        permanent_choice: data.permanentChoice,
        permanent_reason: data.permanentReason,
      },
      { onConflict: "submission_id" },
    );

    if (error) throw new Error("No se pudieron guardar las respuestas del ejercicio.");

    await safeProgressUpdate(data.submissionId, "in_progress", "ticket_ab");

    return { ok: true };
  });

export const saveCardSort = createServerFn({ method: "POST" })
  .inputValidator(cardSortSchema)
  .handler(async ({ data }) => {
    const { error } = await supabaseAdmin.from("ex2_card_sort").upsert(
      {
        submission_id: data.submissionId,
        ordered_items: data.orderedItems,
        confirmed_at: data.confirmed ? new Date().toISOString() : null,
      },
      { onConflict: "submission_id" },
    );

    if (error) throw new Error("No se pudo guardar el ranking.");

    await safeProgressUpdate(data.submissionId, data.confirmed ? "in_progress" : "started", "card_sort");

    return { ok: true };
  });

export const savePhotoGrouping = createServerFn({ method: "POST" })
  .inputValidator(photoGroupingSchema)
  .handler(async ({ data }) => {
    const { error } = await supabaseAdmin.from("ex3_photo_grouping").upsert(
      {
        submission_id: data.submissionId,
        group_assignments: data.groupAssignments,
        group_details: data.groupDetails ?? [],
        favorite_photo_id: data.favoritePhotoId,
        favorite_reason: data.favoriteReason,
      },
      { onConflict: "submission_id" },
    );

    if (error) throw new Error("No se pudo guardar el agrupamiento de fotos.");

    await safeProgressUpdate(data.submissionId, "in_progress", "photos");

    return { ok: true };
  });

export const saveHubBuilder = createServerFn({ method: "POST" })
  .inputValidator(hubBuilderSchema)
  .handler(async ({ data }) => {
    const { error } = await (supabaseAdmin as any).from("ex4_hub_builder").upsert(
      {
        submission_id: data.submissionId,
        selected_addons: data.selectedAddons,
        final_price: data.finalPrice,
        delta_vs_base: data.deltaVsBase,
        fairness: data.fairness,
        would_use: data.wouldUse,
        reason: data.reason,
        worth_it: data.worthIt,
        not_worth_it: data.notWorthIt,
      },
      { onConflict: "submission_id" },
    );

    if (error) {
      throw new Error("No se pudo guardar el hub ideal.");
    }

    await safeProgressUpdate(data.submissionId, "in_progress", "hub_builder");

    return { ok: true };
  });

export const completeSubmission = createServerFn({ method: "POST" })
  .inputValidator(completionSchema)
  .handler(async ({ data }) => {
    await safeProgressUpdate(data.submissionId, "completed", "hub_builder", {
      completed_at: new Date().toISOString(),
      abandoned_at: null,
      email_opt_in: data.emailOptIn?.trim() || null,
    });

    return { ok: true };
  });

export const abandonSubmission = createServerFn({ method: "POST" })
  .inputValidator(submissionIdSchema)
  .handler(async ({ data }) => {
    await safeProgressUpdate(data.submissionId, "abandoned", "hub_builder", {
      abandoned_at: new Date().toISOString(),
    });

    return { ok: true };
  });

export const verifyModeratorPin = createServerFn({ method: "POST" })
  .inputValidator(moderatorPinSchema)
  .handler(async ({ data }) => {
    const configuredPin = process.env.MODERATOR_PIN;
    if (!configuredPin) {
      throw new Error("Falta configurar el PIN del moderador.");
    }

    if (data.pin !== configuredPin) {
      throw new Error("PIN inválido.");
    }

    const session = await useSession<{ verified?: boolean; verifiedAt?: string }>(moderatorSessionConfig);
    await session.update({ verified: true, verifiedAt: new Date().toISOString() });

    return { verified: true };
  });

export const getModeratorSession = createServerFn({ method: "GET" }).handler(async () => {
  const session = await useSession<{ verified?: boolean; verifiedAt?: string }>(moderatorSessionConfig);
  return { verified: Boolean(session.data?.verified) };
});

export const clearModeratorSession = createServerFn({ method: "POST" }).handler(async () => {
  const session = await useSession<{ verified?: boolean; verifiedAt?: string }>(moderatorSessionConfig);
  await session.clear();
  return { ok: true };
});

export const getModeratorOverview = createServerFn({ method: "POST" })
  .inputValidator(moderatorFilterSchema)
  .handler(async ({ data }) => {
    const session = await useSession<{ verified?: boolean }>(moderatorSessionConfig);
    if (!session.data?.verified) {
      throw new Error("Acceso no autorizado al panel moderador.");
    }

    let query = buildSubmissionQuery();

    if (data.segment) query = query.eq("segmento", data.segment);
    if (data.status) query = query.eq("status", data.status);
    if (data.aliasQuery) query = query.ilike("alias", `%${data.aliasQuery}%`);

    const { data: submissions, error } = await query;
    if (error) throw new Error("No se pudieron cargar las pruebas.");

    const { data: counterRows, error: counterError } = await supabaseAdmin
      .from("test_submissions")
      .select("segmento,status");

    if (counterError) throw new Error("No se pudieron cargar los contadores.");

    const counters = [
      {
        sessionLabel: "Ride-hailing",
        completed: (counterRows ?? []).filter((row) => row.segmento === "ride_hailing" && row.status === "completed").length,
      },
      {
        sessionLabel: "B2C",
        completed: (counterRows ?? []).filter((row) => row.segmento === "b2c" && row.status === "completed").length,
      },
    ];

    return {
      counters,
      submissions: (submissions ?? []).map(serializeSubmission),
      exportedAt: new Date().toISOString(),
    };
  });

export const getStudyProgress = createServerFn({ method: "GET" }).handler(async () => {
  const total = 10;

  const { data: rows, error } = await supabaseAdmin.from("test_submissions").select("status");

  if (error) {
    throw new Error("No se pudo cargar el progreso del estudio.");
  }

  const completed = (rows ?? []).filter((row) => row.status === "completed").length;

  return {
    completed,
    remaining: Math.max(total - completed, 0),
    total,
  };
});
