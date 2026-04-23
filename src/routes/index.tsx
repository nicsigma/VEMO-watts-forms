import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import logoVemo from "@/assets/logo-vemo.png";
import ticketAWithActivation from "@/assets/ticket-a-with-activation.png";
import ticketBWithoutActivation from "@/assets/ticket-b-without-activation.png";
import { PhotoGroupingBoard } from "@/components/vemo/photo-grouping-board";
import { SortableRanking } from "@/components/vemo/sortable-ranking";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import {
  AGE_OPTIONS,
  BASE_PRICE_PER_KWH,
  CARD_SORT_ITEMS,
  CHARGING_FREQUENCY_OPTIONS,
  CITY_OPTIONS,
  RESEARCH_HONESTY_MESSAGE,
  EXERCISE_LABELS,
  FLOW_EXERCISES,
  HUB_ADDONS,
  PHOTO_OPTIONS,
  PRIMARY_USE_OPTIONS,
  TICKET_EXPLANATION,
  VEHICLE_OPTIONS,
  VEMO_MONTH_OPTIONS,
  shuffleItems,
  type ExerciseCode,
  type RankingItem,
} from "@/lib/vemo-config";
import {
  completeSubmission,
  createSubmission,
  saveActivationFee,
  saveCardSort,
  saveHubBuilder,
  savePhotoGrouping,
} from "@/lib/vemo.functions";
import { participantProfileSchema, type ParticipantProfileInput } from "@/lib/vemo-schemas";

export const Route = createFileRoute("/")({
  component: IndexPage,
});

type AppStage = "welcome" | "profile" | "consent" | "exercise_intro" | "exercise" | "transition" | "final" | "thanks";
type ParticipantProfileDraft = {
  alias: string;
  wattsMail: string;
  edadRango: (typeof AGE_OPTIONS)[number] | "";
  tipoVehiculo: (typeof VEHICLE_OPTIONS)[number]["value"] | "";
  empresa: string;
  usoPrincipal: (typeof PRIMARY_USE_OPTIONS)[number]["value"] | "";
  frecuenciaCarga: (typeof CHARGING_FREQUENCY_OPTIONS)[number]["value"] | "";
  mesesEnVemo: (typeof VEMO_MONTH_OPTIONS)[number]["value"] | "";
  ciudad: string;
  linkSource: string;
};

function IndexPage() {
  const createSubmissionFn = useServerFn(createSubmission);
  const saveActivationFeeFn = useServerFn(saveActivationFee);
  const saveCardSortFn = useServerFn(saveCardSort);
  const savePhotoGroupingFn = useServerFn(savePhotoGrouping);
  const saveHubBuilderFn = useServerFn(saveHubBuilder);
  const completeSubmissionFn = useServerFn(completeSubmission);

  const [stage, setStage] = useState<AppStage>("welcome");
  const [submissionId, setSubmissionId] = useState<string | null>(null);
  const [exerciseIdx, setExerciseIdx] = useState(0);
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const [profile, setProfile] = useState<ParticipantProfileDraft>({
    alias: "",
    wattsMail: "",
    edadRango: "",
    tipoVehiculo: "",
    empresa: "",
    usoPrincipal: "",
    frecuenciaCarga: "",
    mesesEnVemo: "",
    ciudad: "",
    linkSource: "",
  });

  const [e1Step, setE1Step] = useState(0);
  const [e1State, setE1State] = useState({
    bDesc: "",
    aDesc: "",
    clearer: "" as "" | "A" | "B",
    fairer: "" as "" | "A" | "B",
    pay: "" as "" | "A" | "B",
    compareWhy: "",
    permanent: "" as "" | "A" | "B" | "equal",
    permanentWhy: "",
  });

  const [rankingItems, setRankingItems] = useState<RankingItem[]>(() => shuffleItems(CARD_SORT_ITEMS));
  const [groupIds, setGroupIds] = useState<string[]>(["group-1", "group-2"]);
  const [groupAssignments, setGroupAssignments] = useState<Record<string, string>>({});
  const [groupDetails, setGroupDetails] = useState<Array<{ groupId: string; name: string; reason: string }>>([
    { groupId: "group-1", name: "", reason: "" },
    { groupId: "group-2", name: "", reason: "" },
  ]);
  const [favoritePhotoId, setFavoritePhotoId] = useState<string>("");
  const [favoriteReason, setFavoriteReason] = useState("");

  const [selectedAddons, setSelectedAddons] = useState<string[]>([]);
  const [hubFairness, setHubFairness] = useState<"si" | "mas_o_menos" | "no" | "">("");
  const [hubWouldUse, setHubWouldUse] = useState<"siempre" | "a_veces" | "no" | "">("");
  const [hubWhy, setHubWhy] = useState("");
  const [hubWorth, setHubWorth] = useState("");
  const [hubNotWorth, setHubNotWorth] = useState("");
  const [emailOptIn, setEmailOptIn] = useState("");

  const currentExercise = FLOW_EXERCISES[exerciseIdx];
  const progressValue = ((exerciseIdx + 1) / FLOW_EXERCISES.length) * 100;
  const finalPrice = useMemo(
    () => BASE_PRICE_PER_KWH + selectedAddons.reduce((acc, id) => acc + (HUB_ADDONS.find((item) => item.id === id)?.delta ?? 0), 0),
    [selectedAddons],
  );

  useEffect(() => {
    if (typeof window === "undefined") return;
    const source = new URLSearchParams(window.location.search).get("source");
    if (!source) return;
    setProfile((prev) => ({ ...prev, linkSource: source }));
  }, []);

  const goNextExercise = () => {
    setFieldErrors({});
    if (exerciseIdx === FLOW_EXERCISES.length - 1) {
      setStage("final");
      return;
    }
    setExerciseIdx((prev) => prev + 1);
    setStage("transition");
  };

  const createSession = async () => {
    const requiredErrors: Record<string, string> = {};
    if (!profile.edadRango) requiredErrors.edadRango = "Selecciona una opcion.";
    if (!profile.tipoVehiculo) requiredErrors.tipoVehiculo = "Selecciona una opcion.";
    if (!profile.usoPrincipal) requiredErrors.usoPrincipal = "Selecciona una opcion.";
    if (!profile.frecuenciaCarga) requiredErrors.frecuenciaCarga = "Selecciona una opcion.";
    if (!profile.mesesEnVemo) requiredErrors.mesesEnVemo = "Selecciona una opcion.";
    if (Object.keys(requiredErrors).length > 0) {
      setFieldErrors(requiredErrors);
      setErrorMessage("Revisa los campos marcados.");
      return;
    }
    const parsed = participantProfileSchema.safeParse(profile);
    if (!parsed.success) {
      const nextErrors: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const key = String(issue.path[0] ?? "form");
        if (!nextErrors[key]) nextErrors[key] = issue.message;
      }
      setFieldErrors(nextErrors);
      setErrorMessage("Revisá los campos marcados.");
      return;
    }
    setSaving(true);
    setErrorMessage(null);
    setFieldErrors({});
    try {
      const result = await createSubmissionFn({ data: parsed.data as ParticipantProfileInput });
      setSubmissionId(result.submissionId);
      setStage("consent");
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "No se pudo iniciar el estudio.");
    } finally {
      setSaving(false);
    }
  };

  const saveExercise = async () => {
    if (!submissionId) return;
    setSaving(true);
    setErrorMessage(null);
    try {
      if (currentExercise === "ticket_ab") {
        const nextErrors: Record<string, string> = {};
        if (e1Step < 2) {
          if (e1Step === 0 && e1State.bDesc.trim().length < 5) {
            nextErrors.e1_bDesc = "Escribí al menos 5 caracteres.";
          }
          if (e1Step === 1 && e1State.aDesc.trim().length < 5) {
            nextErrors.e1_aDesc = "Escribí al menos 5 caracteres.";
          }
          if (Object.keys(nextErrors).length > 0) {
            setFieldErrors(nextErrors);
            throw new Error("Revisá los campos marcados para continuar.");
          }
          setFieldErrors({});
          setE1Step((prev) => prev + 1);
          return;
        }

        if (!e1State.clearer) nextErrors.e1_clearer = "Elegí una opción.";
        if (!e1State.fairer) nextErrors.e1_fairer = "Elegí una opción.";
        if (!e1State.pay) nextErrors.e1_pay = "Elegí una opción.";
        if (e1State.compareWhy.trim().length < 10) nextErrors.e1_compareWhy = "Contanos un poco más (mínimo 10 caracteres).";
        if (!e1State.permanent) nextErrors.e1_permanent = "Elegí una opción.";
        if (e1State.permanentWhy.trim().length < 10) nextErrors.e1_permanentWhy = "Contanos un poco más (mínimo 10 caracteres).";
        if (Object.keys(nextErrors).length > 0) {
          setFieldErrors(nextErrors);
          throw new Error("Revisá los campos marcados para continuar.");
        }
        setFieldErrors({});
        await saveActivationFeeFn({
          data: {
            submissionId,
            ticketBObservation: e1State.bDesc,
            ticketAObservation: e1State.aDesc,
            clearerChoice: e1State.clearer || undefined,
            fairerChoice: e1State.fairer || undefined,
            payChoice: e1State.pay || undefined,
            comparisonReason: e1State.compareWhy,
            permanentChoice: e1State.permanent || undefined,
            permanentReason: e1State.permanentWhy,
          },
        });
      }
      if (currentExercise === "card_sort") {
        await saveCardSortFn({ data: { submissionId, orderedItems: rankingItems, confirmed: true } });
      }
      if (currentExercise === "photos") {
        const allGrouped = PHOTO_OPTIONS.every((photo) => Boolean(groupAssignments[photo.id]));
        if (!allGrouped) {
          setFieldErrors({ photo_grouping: "Antes de seguir, agrupá las 6 fotos." });
          throw new Error("Antes de seguir, agrupá las 6 fotos.");
        }
        const detailed = groupIds
          .map((groupId) => ({
            groupId,
            name: groupDetails.find((item) => item.groupId === groupId)?.name || `Grupo ${groupId}`,
            reason: groupDetails.find((item) => item.groupId === groupId)?.reason || "",
            photoIds: PHOTO_OPTIONS.filter((photo) => groupAssignments[photo.id] === groupId).map((photo) => photo.id),
          }))
          .filter((group) => group.photoIds.length > 0);
        await savePhotoGroupingFn({
          data: {
            submissionId,
            groupAssignments: groupAssignments as Record<"photo-1" | "photo-2" | "photo-3" | "photo-4" | "photo-5" | "photo-6", string>,
            groupDetails: detailed as any,
            favoritePhotoId: (favoritePhotoId || undefined) as any,
            favoriteReason,
          },
        });
        if (!favoritePhotoId || favoriteReason.trim().length < 8) {
          setFieldErrors({
            photo_favorite: !favoritePhotoId ? "Elegí una foto favorita." : "",
            photo_reason: favoriteReason.trim().length < 8 ? "Contanos un poco más (mínimo 8 caracteres)." : "",
          });
          throw new Error("Elegí tu foto favorita y explicá por qué.");
        }
        setFieldErrors({});
      }
      if (currentExercise === "hub_builder") {
        const nextErrors: Record<string, string> = {};
        if (!hubFairness) nextErrors.hub_fairness = "Elegí una opción.";
        if (!hubWouldUse) nextErrors.hub_wouldUse = "Elegí una opción.";
        if (!hubWhy.trim()) nextErrors.hub_why = "Contanos por qué.";
        if (Object.keys(nextErrors).length > 0) {
          setFieldErrors(nextErrors);
          throw new Error("Completa las preguntas finales del hub ideal.");
        }
        setFieldErrors({});
        await saveHubBuilderFn({
          data: {
            submissionId,
            selectedAddons: selectedAddons as any,
            finalPrice,
            deltaVsBase: finalPrice - BASE_PRICE_PER_KWH,
            fairness: hubFairness,
            wouldUse: hubWouldUse,
            reason: hubWhy.trim(),
            worthIt: hubWorth,
            notWorthIt: hubNotWorth,
          },
        });
      }
      goNextExercise();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "No se pudo guardar.");
    } finally {
      setSaving(false);
    }
  };

  const completeStudy = async () => {
    if (!submissionId) return;
    setSaving(true);
    setErrorMessage(null);
    try {
      await completeSubmissionFn({ data: { submissionId, emailOptIn } });
      setStage("thanks");
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "No se pudo terminar.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="vemo-shell">
      <div className="vemo-stack space-y-1">
        {stage !== "welcome" && stage !== "profile" && stage !== "consent" && stage !== "final" && stage !== "thanks" ? (
          <Card className="vemo-card">
            <CardContent className="space-y-2 pt-6">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">Ejercicio {exerciseIdx + 1} de 4 · {EXERCISE_LABELS[currentExercise]}</p>
                <Badge variant="secondary" className="bg-accent/25 text-accent-foreground">Guardado automático</Badge>
              </div>
              <Progress value={progressValue} />
            </CardContent>
          </Card>
        ) : null}

        {errorMessage ? <Card className="vemo-card"><CardContent className="pt-6 text-sm text-destructive">{errorMessage}</CardContent></Card> : null}

        {stage === "welcome" ? (
          <Card className="vemo-card">
            <CardHeader>
              <LogoVemo />
              <CardTitle className="pt-1 text-3xl leading-tight">Tu opinion vale y te premia</CardTitle>
              <CardDescription>
                Ayudanos a disenar una mejor experiencia de carga para personas conductoras de apps como tu.
              </CardDescription>
              <div className="rounded-2xl border border-accent/40 bg-gradient-to-br from-accent/35 to-accent/15 px-4 py-4 text-base text-accent-foreground">
                <p className="mb-1 text-xs font-semibold uppercase tracking-[0.14em] opacity-80">Incentivo por participar</p>
                <p>
                  Completa los 4 ejercicios y te acreditamos <strong>$100 MXN en carga</strong> en tu billetera.
                </p>
              </div>
              <div className="grid gap-3 py-1 text-sm text-card-foreground/90">
                <p className="flex items-center gap-2">
                  <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">1</span>
                  Respondes desde tu celular, sin complicaciones.
                </p>
                <p className="flex items-center gap-2">
                  <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">2</span>
                  {RESEARCH_HONESTY_MESSAGE}
                </p>
                <p className="flex items-center gap-2">
                  <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">3</span>
                  Tu progreso se guarda automaticamente.
                </p>
              </div>
              <p className="rounded-xl border border-border/70 bg-white/90 px-3 py-3 text-base font-semibold text-primary">
                Duracion estimada: 10 a 15 minutos.
              </p>
            </CardHeader>
            <CardContent>
              <Button size="lg" className="vemo-cta sm:w-auto sm:px-8" onClick={() => setStage("profile")}>
                Empezar
              </Button>
            </CardContent>
          </Card>
        ) : null}

        {stage === "profile" ? (
          <Card className="vemo-card">
            <CardHeader><CardTitle>Datos del participante</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Esta es la pantalla 0 del estudio. Guardamos estos datos una sola vez y luego seguís por los 4 ejercicios en orden.
              </p>
              <Input
                className={fieldErrors.alias ? "border-destructive" : ""}
                placeholder="Nombre opcional"
                value={profile.alias}
                onChange={(e) => {
                  setProfile((p) => ({ ...p, alias: e.target.value }));
                  setFieldErrors((prev) => ({ ...prev, alias: "" }));
                }}
              />
              {fieldErrors.alias ? <p className="text-xs text-destructive">{fieldErrors.alias}</p> : null}
              <label className="grid gap-1.5">
                <span className="text-sm font-semibold tracking-tight">Mail de Watts *</span>
                <Input
                className={fieldErrors.wattsMail ? "border-destructive" : ""}
                placeholder="Mail de Watts"
                type="email"
                value={profile.wattsMail}
                onChange={(e) => {
                  setProfile((p) => ({ ...p, wattsMail: e.target.value }));
                  setFieldErrors((prev) => ({ ...prev, wattsMail: "" }));
                }}
                />
              </label>
              {fieldErrors.wattsMail ? <p className="text-xs text-destructive">{fieldErrors.wattsMail}</p> : null}
              <p className="-mt-2 text-xs text-muted-foreground">A esta cuenta se acreditaran los $100 MXN en carga.</p>
              <SelectLine label="Ciudad" value={profile.ciudad} options={CITY_OPTIONS} placeholder="Selecciona una opcion" error={fieldErrors.ciudad} onChange={(value) => { setProfile((p) => ({ ...p, ciudad: value })); setFieldErrors((prev) => ({ ...prev, ciudad: "" })); }} />
              {fieldErrors.ciudad ? <p className="text-xs text-destructive">{fieldErrors.ciudad}</p> : null}
              <SelectLine required label="Edad" value={profile.edadRango} options={AGE_OPTIONS} placeholder="Selecciona una opcion" error={fieldErrors.edadRango} onChange={(value) => { setProfile((p) => ({ ...p, edadRango: value })); setFieldErrors((prev) => ({ ...prev, edadRango: "" })); }} />
              <SelectLine required label="Tipo de vehiculo" value={profile.tipoVehiculo} options={VEHICLE_OPTIONS.map((v) => v.value)} placeholder="Selecciona una opcion" labels={Object.fromEntries(VEHICLE_OPTIONS.map((v) => [v.value, v.label]))} error={fieldErrors.tipoVehiculo} onChange={(value) => { setProfile((p) => ({ ...p, tipoVehiculo: value })); setFieldErrors((prev) => ({ ...prev, tipoVehiculo: "" })); }} />
              {(profile.tipoVehiculo === "own_ev_credit" || profile.tipoVehiculo === "leased_ev" || profile.tipoVehiculo === "fleet_ev") ? (
                <>
                  <label className="grid gap-1.5">
                    <span className="text-sm font-semibold tracking-tight">Empresa *</span>
                    <Input
                    className={fieldErrors.empresa ? "border-destructive" : ""}
                    placeholder="De que empresa es"
                    value={profile.empresa || ""}
                    onChange={(e) => {
                      setProfile((p) => ({ ...p, empresa: e.target.value }));
                      setFieldErrors((prev) => ({ ...prev, empresa: "" }));
                    }}
                    />
                  </label>
                  {fieldErrors.empresa ? <p className="text-xs text-destructive">{fieldErrors.empresa}</p> : null}
                </>
              ) : null}
              <SelectLine required label="Uso principal" value={profile.usoPrincipal} options={PRIMARY_USE_OPTIONS.map((v) => v.value)} placeholder="Selecciona una opcion" labels={Object.fromEntries(PRIMARY_USE_OPTIONS.map((v) => [v.value, v.label]))} error={fieldErrors.usoPrincipal} onChange={(value) => { setProfile((p) => ({ ...p, usoPrincipal: value })); setFieldErrors((prev) => ({ ...prev, usoPrincipal: "" })); }} />
              <SelectLine required label="Frecuencia de carga en Vemo" value={profile.frecuenciaCarga} options={CHARGING_FREQUENCY_OPTIONS.map((v) => v.value)} placeholder="Selecciona una opcion" labels={Object.fromEntries(CHARGING_FREQUENCY_OPTIONS.map((v) => [v.value, v.label]))} error={fieldErrors.frecuenciaCarga} onChange={(value) => { setProfile((p) => ({ ...p, frecuenciaCarga: value })); setFieldErrors((prev) => ({ ...prev, frecuenciaCarga: "" })); }} />
              <SelectLine required label="Meses usando Vemo" value={profile.mesesEnVemo} options={VEMO_MONTH_OPTIONS.map((v) => v.value)} placeholder="Selecciona una opcion" labels={Object.fromEntries(VEMO_MONTH_OPTIONS.map((v) => [v.value, v.label]))} error={fieldErrors.mesesEnVemo} onChange={(value) => { setProfile((p) => ({ ...p, mesesEnVemo: value })); setFieldErrors((prev) => ({ ...prev, mesesEnVemo: "" })); }} />
              <div className="flex gap-2">
                <Button variant="outline" className="vemo-cta sm:w-auto sm:px-6" onClick={() => setStage("welcome")} disabled={saving}>Volver</Button>
                <Button className="vemo-cta sm:w-auto sm:px-8" onClick={createSession} disabled={saving}>{saving ? "Guardando..." : "Continuar"}</Button>
              </div>
            </CardContent>
          </Card>
        ) : null}

        {stage === "consent" ? (
          <Card className="vemo-card">
            <CardHeader><CardTitle>Antes de empezar</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              <p>1) {RESEARCH_HONESTY_MESSAGE}</p>
              <p>2) Tus respuestas se guardan solas.</p>
              <p>3) Si algo no aplica, igual contanos.</p>
              <div className="mt-2 flex gap-2">
                <Button variant="outline" className="vemo-cta sm:w-auto sm:px-6" onClick={() => setStage("profile")}>Volver</Button>
                <Button className="vemo-cta sm:w-auto sm:px-8" onClick={() => setStage("exercise_intro")}>Arrancar con el ejercicio 1</Button>
              </div>
            </CardContent>
          </Card>
        ) : null}

        {stage === "exercise_intro" ? (
          <Card className="vemo-card">
            <CardHeader><CardTitle>{EXERCISE_LABELS[currentExercise]}</CardTitle></CardHeader>
            <CardContent>
              <p className="mb-2 text-sm font-medium text-card-foreground">{RESEARCH_HONESTY_MESSAGE}</p>
              {currentExercise === "ticket_ab" ? (
                <p className="mb-3 rounded-xl border border-border/70 bg-muted/35 p-3 text-sm text-card-foreground">
                  {TICKET_EXPLANATION}
                </p>
              ) : null}
              <p className="mb-4 text-sm text-muted-foreground">
                Leé con calma y respondé como lo explicarías en voz alta. Si algo no aplica, igual contalo.
              </p>
              <div className="flex gap-2">
                <Button variant="outline" className="vemo-cta sm:w-auto sm:px-6" onClick={() => setStage("consent")}>Volver</Button>
                <Button className="vemo-cta sm:w-auto sm:px-8" onClick={() => setStage("exercise")}>Comenzar</Button>
              </div>
            </CardContent>
          </Card>
        ) : null}

        {stage === "exercise" && currentExercise === "ticket_ab" ? (
          <Card className="vemo-card">
            <CardHeader><CardTitle>Ejercicio 1 · Ticket de recarga</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <Button
                variant="outline"
                className="w-full sm:w-auto"
                onClick={() => {
                  if (e1Step > 0) {
                    setE1Step((prev) => prev - 1);
                    return;
                  }
                  setStage("exercise_intro");
                }}
              >
                Volver
              </Button>
              <div className="rounded-xl border border-primary/30 bg-gradient-to-br from-white to-accent/15 p-4 text-sm shadow-sm">
                <p className="font-semibold text-primary">Contexto del ejercicio</p>
                <p className="mt-1 text-card-foreground/95">{TICKET_EXPLANATION}</p>
                <p className="mt-2 font-medium text-card-foreground">{RESEARCH_HONESTY_MESSAGE}</p>
              </div>
              {e1Step === 0 ? (
                <>
                  <PhoneFrameImage src={ticketBWithoutActivation} alt="Ticket B" />
                  <div className="rounded-2xl border-2 border-primary/35 bg-white p-4 shadow-sm">
                    <label className="mb-1 block text-sm font-semibold" htmlFor="e1-b-desc">
                      Tu respuesta *
                    </label>
                    <p className="mb-2 text-xs text-muted-foreground">
                      Describí lo que ves en este ticket y cómo lo interpretás.
                    </p>
                    <Textarea
                      id="e1-b-desc"
                      className={`min-h-[120px] ${fieldErrors.e1_bDesc ? "border-destructive" : ""}`}
                      value={e1State.bDesc}
                      onChange={(e) => {
                        setE1State((s) => ({ ...s, bDesc: e.target.value }));
                        setFieldErrors((prev) => ({ ...prev, e1_bDesc: "" }));
                      }}
                      placeholder=""
                    />
                    {fieldErrors.e1_bDesc ? <p className="mt-1 text-xs text-destructive">{fieldErrors.e1_bDesc}</p> : null}
                  </div>
                </>
              ) : null}
              {e1Step === 1 ? (
                <>
                  <PhoneFrameImage src={ticketAWithActivation} alt="Ticket A" />
                  <div className="rounded-2xl border-2 border-primary/35 bg-white p-4 shadow-sm">
                    <label className="mb-1 block text-sm font-semibold" htmlFor="e1-a-desc">
                      Tu respuesta *
                    </label>
                    <p className="mb-2 text-xs text-muted-foreground">
                      Describí lo que ves en este ticket y cómo lo interpretás.
                    </p>
                    <Textarea
                      id="e1-a-desc"
                      className={`min-h-[120px] ${fieldErrors.e1_aDesc ? "border-destructive" : ""}`}
                      value={e1State.aDesc}
                      onChange={(e) => {
                        setE1State((s) => ({ ...s, aDesc: e.target.value }));
                        setFieldErrors((prev) => ({ ...prev, e1_aDesc: "" }));
                      }}
                      placeholder=""
                    />
                    {fieldErrors.e1_aDesc ? <p className="mt-1 text-xs text-destructive">{fieldErrors.e1_aDesc}</p> : null}
                  </div>
                </>
              ) : null}
              {e1Step === 2 ? (
                <>
                  <p className="text-sm text-muted-foreground">
                    Los dos tickets muestran el mismo total. Miralos de nuevo y respondé con tu primera impresión.
                  </p>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="rounded-md border p-2">
                      <p className="mb-2 text-xs font-semibold text-muted-foreground">Opción A</p>
                      <PhoneFrameImage src={ticketAWithActivation} alt="Ticket A" />
                    </div>
                    <div className="rounded-md border p-2">
                      <p className="mb-2 text-xs font-semibold text-muted-foreground">Opción B</p>
                      <PhoneFrameImage src={ticketBWithoutActivation} alt="Ticket B" />
                    </div>
                  </div>
                  <RadioLine required label="¿Cuál te parece más claro?" value={e1State.clearer} options={["A", "B"]} error={fieldErrors.e1_clearer} onChange={(v) => { setE1State((s) => ({ ...s, clearer: v as "A" | "B" })); setFieldErrors((prev) => ({ ...prev, e1_clearer: "" })); }} />
                  <RadioLine required label="¿Cuál te parece más justo?" value={e1State.fairer} options={["A", "B"]} error={fieldErrors.e1_fairer} onChange={(v) => { setE1State((s) => ({ ...s, fairer: v as "A" | "B" })); setFieldErrors((prev) => ({ ...prev, e1_fairer: "" })); }} />
                  <RadioLine required label="¿Cuál preferís para pagar?" value={e1State.pay} options={["A", "B"]} error={fieldErrors.e1_pay} onChange={(v) => { setE1State((s) => ({ ...s, pay: v as "A" | "B" })); setFieldErrors((prev) => ({ ...prev, e1_pay: "" })); }} />
                  <div className="rounded-2xl border-2 border-primary/35 bg-white p-4 shadow-sm">
                    <label className="mb-1 block text-sm font-semibold" htmlFor="e1-compare-why">
                      ¿Por qué? *
                    </label>
                    <p className="mb-2 text-xs text-muted-foreground">
                      Explicá el criterio con el que comparaste A y B en las tres preguntas anteriores.
                    </p>
                    <Textarea
                      id="e1-compare-why"
                      className={`min-h-[120px] ${fieldErrors.e1_compareWhy ? "border-destructive" : ""}`}
                      value={e1State.compareWhy}
                      onChange={(e) => {
                        setE1State((s) => ({ ...s, compareWhy: e.target.value }));
                        setFieldErrors((prev) => ({ ...prev, e1_compareWhy: "" }));
                      }}
                      placeholder=""
                    />
                    {fieldErrors.e1_compareWhy ? <p className="mt-1 text-xs text-destructive">{fieldErrors.e1_compareWhy}</p> : null}
                  </div>
                  <RadioLine required label="Si Vemo te deja elegir un modelo para siempre..." value={e1State.permanent} options={["A", "B", "equal"]} labels={{ equal: "Me da lo mismo" }} error={fieldErrors.e1_permanent} onChange={(v) => { setE1State((s) => ({ ...s, permanent: v as "A" | "B" | "equal" })); setFieldErrors((prev) => ({ ...prev, e1_permanent: "" })); }} />
                  <div className="rounded-2xl border-2 border-primary/35 bg-white p-4 shadow-sm">
                    <label className="mb-1 block text-sm font-semibold" htmlFor="e1-permanent-why">
                      ¿Por qué? *
                    </label>
                    <p className="mb-2 text-xs text-muted-foreground">
                      Contanos por qué te quedarías con esa opción (o por qué te da lo mismo).
                    </p>
                    <Textarea
                      id="e1-permanent-why"
                      className={`min-h-[100px] ${fieldErrors.e1_permanentWhy ? "border-destructive" : ""}`}
                      value={e1State.permanentWhy}
                      onChange={(e) => {
                        setE1State((s) => ({ ...s, permanentWhy: e.target.value }));
                        setFieldErrors((prev) => ({ ...prev, e1_permanentWhy: "" }));
                      }}
                      placeholder=""
                    />
                    {fieldErrors.e1_permanentWhy ? <p className="mt-1 text-xs text-destructive">{fieldErrors.e1_permanentWhy}</p> : null}
                  </div>
                </>
              ) : null}
              <ActionFooterButton disabled={saving} onClick={saveExercise}>
                {saving ? "Guardando..." : e1Step < 2 ? "Siguiente" : "Terminar ejercicio"}
              </ActionFooterButton>
            </CardContent>
          </Card>
        ) : null}

        {stage === "exercise" && currentExercise === "card_sort" ? (
          <Card className="vemo-card">
            <CardHeader><CardTitle>Ejercicio 2 · Ordenar por importancia</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <Button variant="outline" className="w-full sm:w-auto" onClick={() => setStage("exercise_intro")}>Volver</Button>
              <p className="text-sm text-muted-foreground">Arrastrá las tarjetas: arriba lo más importante para vos.</p>
              <SortableRanking items={rankingItems} onChange={setRankingItems} />
              <ActionFooterButton onClick={saveExercise} disabled={saving}>{saving ? "Guardando..." : "Guardar orden"}</ActionFooterButton>
            </CardContent>
          </Card>
        ) : null}

        {stage === "exercise" && currentExercise === "photos" ? (
          <Card className="vemo-card">
            <CardHeader><CardTitle>Ejercicio 3 · Agrupar fotos</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <Button variant="outline" className="w-full sm:w-auto" onClick={() => setStage("exercise_intro")}>Volver</Button>
              <PhotoGroupingBoard
                photos={PHOTO_OPTIONS}
                groupIds={groupIds}
                assignments={groupAssignments}
                onMove={(photoId, groupId) => {
                  setGroupAssignments((prev) => {
                    const next = { ...prev };
                    if (groupId) next[photoId] = groupId;
                    else delete next[photoId];
                    return next;
                  });
                }}
                onRemoveGroup={(groupId) => {
                  setGroupIds((prev) => prev.filter((id) => id !== groupId));
                  setGroupDetails((prev) => prev.filter((item) => item.groupId !== groupId));
                }}
              />
              {fieldErrors.photo_grouping ? <p className="text-xs text-destructive">{fieldErrors.photo_grouping}</p> : null}
              <Button variant="outline" className="w-full sm:w-auto" onClick={() => {
                const id = `group-${Date.now()}`;
                setGroupIds((prev) => [...prev, id]);
                setGroupDetails((prev) => [...prev, { groupId: id, name: "", reason: "" }]);
              }}>+ Agregar grupo</Button>
              {groupIds.map((groupId, idx) => (
                <div key={groupId} className="space-y-2 rounded-md border p-3">
                  <p className="text-sm font-medium">Grupo {idx + 1}</p>
                  <Input placeholder="Nombre del grupo" value={groupDetails.find((item) => item.groupId === groupId)?.name || ""} onChange={(e) => setGroupDetails((prev) => prev.map((item) => item.groupId === groupId ? { ...item, name: e.target.value } : item))} />
                  <Textarea placeholder="¿Por qué agrupaste estas fotos?" value={groupDetails.find((item) => item.groupId === groupId)?.reason || ""} onChange={(e) => setGroupDetails((prev) => prev.map((item) => item.groupId === groupId ? { ...item, reason: e.target.value } : item))} />
                </div>
              ))}
              <RadioLine required label="¿Cuál preferirías para cargar?" value={favoritePhotoId} options={PHOTO_OPTIONS.map((photo) => photo.id)} labels={Object.fromEntries(PHOTO_OPTIONS.map((photo) => [photo.id, photo.label]))} error={fieldErrors.photo_favorite} onChange={(v) => { setFavoritePhotoId(v); setFieldErrors((prev) => ({ ...prev, photo_favorite: "" })); }} />
              <div className="rounded-2xl border-2 border-primary/35 bg-white p-4 shadow-sm">
                <label className="mb-1 block text-sm font-semibold" htmlFor="photo-favorite-reason">
                  ¿Por qué elegiste esa opción? *
                </label>
                <p className="mb-2 text-xs text-muted-foreground">
                  Contanos qué te llevó a elegir esa foto para cargar.
                </p>
                <Textarea
                  id="photo-favorite-reason"
                  className={`min-h-[120px] ${fieldErrors.photo_reason ? "border-destructive" : ""}`}
                  placeholder=""
                  value={favoriteReason}
                  onChange={(e) => {
                    setFavoriteReason(e.target.value);
                    setFieldErrors((prev) => ({ ...prev, photo_reason: "" }));
                  }}
                />
                {fieldErrors.photo_reason ? <p className="mt-1 text-xs text-destructive">{fieldErrors.photo_reason}</p> : null}
              </div>
              <ActionFooterButton onClick={saveExercise} disabled={saving}>{saving ? "Guardando..." : "Terminar ejercicio"}</ActionFooterButton>
            </CardContent>
          </Card>
        ) : null}

        {stage === "exercise" && currentExercise === "hub_builder" ? (
          <Card className="vemo-card">
            <CardHeader><CardTitle>Ejercicio 4 · Armá tu hub ideal</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <Button variant="outline" className="w-full sm:w-auto" onClick={() => setStage("exercise_intro")}>Volver</Button>
              <p className="text-sm text-muted-foreground">
                Queremos entender mejor qué valorás del precio que pagás y qué te hace sentir que el cobro es transparente.
                Elegí los atributos que más te importan y contanos cómo impactan en tu percepción del precio final.
              </p>
              <div className="grid gap-2">
                {HUB_ADDONS.map((addon) => (
                  <label key={addon.id} className="flex items-center justify-between rounded-md border p-3">
                    <span>{addon.label}</span>
                    <span className="text-sm text-muted-foreground">+${addon.delta.toFixed(2)}</span>
                    <input
                      type="checkbox"
                      checked={selectedAddons.includes(addon.id)}
                      onChange={(e) =>
                        setSelectedAddons((prev) => (e.target.checked ? [...prev, addon.id] : prev.filter((id) => id !== addon.id)))
                      }
                    />
                  </label>
                ))}
              </div>
              <Card className="bg-muted/40">
                <CardContent className="pt-4 text-sm">
                  <p>Precio base: ${BASE_PRICE_PER_KWH.toFixed(2)}/kWh</p>
                  <p>Tu hub: ${finalPrice.toFixed(2)}/kWh</p>
                  <p>Diferencia: +${(finalPrice - BASE_PRICE_PER_KWH).toFixed(2)}</p>
                </CardContent>
              </Card>
              <RadioLine required label="¿Ese precio te parece justo?" value={hubFairness} options={["si", "mas_o_menos", "no"]} labels={{ si: "Sí", mas_o_menos: "Más o menos", no: "No" }} error={fieldErrors.hub_fairness} onChange={(v) => { setHubFairness(v as "si" | "mas_o_menos" | "no"); setFieldErrors((prev) => ({ ...prev, hub_fairness: "" })); }} />
              <RadioLine required label="¿Lo usarías?" value={hubWouldUse} options={["siempre", "a_veces", "no"]} labels={{ siempre: "Sí, siempre", a_veces: "Sí, a veces", no: "No" }} error={fieldErrors.hub_wouldUse} onChange={(v) => { setHubWouldUse(v as "siempre" | "a_veces" | "no"); setFieldErrors((prev) => ({ ...prev, hub_wouldUse: "" })); }} />
              <Textarea className={fieldErrors.hub_why ? "border-destructive" : ""} value={hubWhy} onChange={(e) => { setHubWhy(e.target.value); setFieldErrors((prev) => ({ ...prev, hub_why: "" })); }} placeholder="" />
              {fieldErrors.hub_why ? <p className="text-xs text-destructive">{fieldErrors.hub_why}</p> : null}
              <Input value={hubWorth} onChange={(e) => setHubWorth(e.target.value)} placeholder="Lo que sí vale la pena pagar" />
              <Input value={hubNotWorth} onChange={(e) => setHubNotWorth(e.target.value)} placeholder="Lo que no vale la pena pagar" />
              <ActionFooterButton onClick={saveExercise} disabled={saving}>{saving ? "Guardando..." : "Terminar ejercicio"}</ActionFooterButton>
            </CardContent>
          </Card>
        ) : null}

        {stage === "transition" ? (
          <Card className="vemo-card">
            <CardHeader><CardTitle>Perfecto, guardado</CardTitle></CardHeader>
            <CardContent>
              <p className="mb-4 text-sm text-muted-foreground">Quedan {FLOW_EXERCISES.length - exerciseIdx} ejercicios.</p>
              <Button className="vemo-cta sm:w-auto sm:px-8" onClick={() => setStage("exercise_intro")}>Continuar</Button>
            </CardContent>
          </Card>
        ) : null}

        {stage === "final" ? (
          <Card className="vemo-card">
            <CardHeader>
              <CardTitle>¡Terminaste los 4 ejercicios!</CardTitle>
              <CardDescription>¿Querés que te mandemos un email cuando salgan los resultados?</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input placeholder="Email (opcional)" value={emailOptIn} onChange={(e) => setEmailOptIn(e.target.value)} />
              <Button className="vemo-cta sm:w-auto sm:px-8" onClick={completeStudy} disabled={saving}>{saving ? "Cerrando..." : "Terminar"}</Button>
            </CardContent>
          </Card>
        ) : null}

        {stage === "thanks" ? (
          <Card className="vemo-card">
            <CardHeader><CardTitle>Gracias por participar</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <p>Tu respuesta ya está guardada. Podés cerrar esta ventana cuando quieras.</p>
              <div className="rounded-xl border border-accent/40 bg-accent/20 px-4 py-3 text-sm text-accent-foreground">
                Confirmamos tu participación completa para la acreditación de <strong>$100 MXN en carga</strong>.
              </div>
            </CardContent>
          </Card>
        ) : null}
      </div>
    </main>
  );
}

function LogoVemo() {
  return (
    <div className="mb-4 flex items-center gap-3 rounded-2xl bg-primary px-4 py-3 shadow-[0_8px_20px_rgb(2_53_44/25%)]">
      <img src={logoVemo} alt="Vemo" className="h-11 w-auto" />
    </div>
  );
}

function PhoneFrameImage({ src, alt }: { src: string; alt: string }) {
  return (
    <div className="vemo-image-frame">
      <div className="vemo-image-screen">
        <img src={src} alt={alt} className="w-full rounded-2xl border border-black/10" />
      </div>
    </div>
  );
}

function ActionFooterButton({
  children,
  onClick,
  disabled,
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <div className="sticky bottom-2 rounded-2xl bg-background/80 p-2 backdrop-blur-sm">
      <Button className="vemo-cta sm:w-auto sm:px-8" disabled={disabled} onClick={onClick}>
        {children}
      </Button>
    </div>
  );
}

function SelectLine({
  label,
  value,
  options,
  placeholder,
  labels,
  error,
  required,
  onChange,
}: {
  label: string;
  value: string;
  options: readonly string[];
  placeholder?: string;
  labels?: Record<string, string>;
  error?: string;
  required?: boolean;
  onChange: (value: any) => void;
}) {
  return (
    <label className="grid gap-1.5">
      <span className="text-sm font-semibold tracking-tight">{label}{required ? " *" : ""}</span>
      <select className={`vemo-input h-12 border px-3 text-sm ${error ? "border-destructive" : ""}`} value={value} onChange={(e) => onChange(e.target.value)}>
        {placeholder ? <option value="">{placeholder}</option> : null}
        {options.map((option) => (
          <option key={option} value={option}>{labels?.[option] ?? option}</option>
        ))}
      </select>
      {error ? <span className="text-xs text-destructive">{error}</span> : null}
    </label>
  );
}

function RadioLine({
  label,
  value,
  options,
  labels,
  error,
  required,
  onChange,
}: {
  label: string;
  value: string;
  options: string[];
  labels?: Record<string, string>;
  error?: string;
  required?: boolean;
  onChange: (value: string) => void;
}) {
  return (
    <div className="space-y-2">
      <p className="text-sm font-semibold tracking-tight">{label}{required ? " *" : ""}</p>
      <div className={`flex flex-wrap gap-3 rounded-md ${error ? "ring-1 ring-destructive/40 p-2" : ""}`}>
        {options.map((option) => (
          <label key={option} className="flex items-center gap-2 rounded-xl border bg-white/80 px-3 py-2 text-sm shadow-[0_2px_8px_rgb(5_28_22/8%)]">
            <input type="radio" checked={value === option} onChange={() => onChange(option)} />
            <span>{labels?.[option] ?? option}</span>
          </label>
        ))}
      </div>
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </div>
  );
}
