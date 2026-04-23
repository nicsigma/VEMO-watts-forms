import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import {
  Download,
  Eye,
  LogOut,
  RefreshCw,
  Search,
  Shield,
  SlidersHorizontal,
  TableProperties,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  APP_NAME,
  SEGMENT_LABELS,
  STATUS_LABELS,
  type SegmentCode,
  type SubmissionStatus,
} from "@/lib/vemo-config";
import {
  abandonSubmission,
  clearModeratorSession,
  getModeratorOverview,
  getModeratorSession,
  verifyModeratorPin,
} from "@/lib/vemo.functions";
import { PHOTO_OPTIONS } from "@/lib/vemo-config";

type ModeratorFilters = {
  segment: string;
  status: string;
  aliasQuery: string;
};

type ModeratorOverview = Awaited<ReturnType<ReturnType<typeof useServerFn<typeof getModeratorOverview>>>>;

type SubmissionRecord = {
  id: string;
  alias: string;
  watts_mail?: string | null;
  edad_rango: string;
  tipo_vehiculo: string;
  empresa?: string | null;
  uso_principal: string;
  frecuencia_carga: string;
  meses_en_vemo: string;
  ciudad?: string | null;
  email_opt_in?: string | null;
  link_source?: string | null;
  segmento: SegmentCode;
  current_exercise: string;
  started_at: string;
  last_screen_at?: string;
  completed_at: string | null;
  abandoned_at?: string | null;
  status: SubmissionStatus;
  ex1_activation_fee?: any;
  ex2_card_sort?: any;
  ex3_photo_grouping?: any;
  ex4_hub_builder?: any;
};

export const Route = createFileRoute("/moderator")({
  head: () => ({
    meta: [
      { title: "Vemo Focus Groups — Moderador" },
      {
        name: "description",
        content: "Dashboard de moderación con respuestas en vivo, filtros y exportación.",
      },
      { property: "og:title", content: "Vemo Focus Groups — Moderador" },
      {
        property: "og:description",
        content: "Panel protegido por PIN para revisar envíos de focus groups de Vemo.",
      },
    ],
  }),
  component: ModeratorPage,
});

const defaultFilters: ModeratorFilters = {
  segment: "",
  status: "",
  aliasQuery: "",
};

function ModeratorPage() {
  const verifyModeratorPinFn = useServerFn(verifyModeratorPin);
  const getModeratorSessionFn = useServerFn(getModeratorSession);
  const getModeratorOverviewFn = useServerFn(getModeratorOverview);
  const clearModeratorSessionFn = useServerFn(clearModeratorSession);
  const abandonSubmissionFn = useServerFn(abandonSubmission);

  const [pin, setPin] = useState("");
  const [authorized, setAuthorized] = useState<boolean | null>(null);
  const [filters, setFilters] = useState<ModeratorFilters>(defaultFilters);
  const [overview, setOverview] = useState<{ counters: Array<{ sessionLabel: string; completed: number }>; submissions: SubmissionRecord[]; exportedAt: string; } | null>(null);
  const [selectedSubmission, setSelectedSubmission] = useState<SubmissionRecord | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadOverview = async (activeFilters: ModeratorFilters) => {
    setLoading(true);
    try {
      const data = await getModeratorOverviewFn({
        data: {
          segment: (activeFilters.segment || undefined) as SegmentCode | undefined,
          status: (activeFilters.status || undefined) as SubmissionStatus | undefined,
          aliasQuery: activeFilters.aliasQuery || undefined,
        },
      });
      setOverview(data);
      if (selectedSubmission) {
        setSelectedSubmission(data.submissions.find((item) => item.id === selectedSubmission.id) ?? null);
      }
      setErrorMessage(null);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "No se pudo cargar el panel.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let mounted = true;
    getModeratorSessionFn()
      .then((response) => {
        if (!mounted) return;
        setAuthorized(response.verified);
        if (response.verified) {
          void loadOverview(defaultFilters);
        }
      })
      .catch(() => {
        if (mounted) setAuthorized(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!authorized) return;
    const timer = window.setInterval(() => {
      void loadOverview(filters);
    }, 10000);
    return () => window.clearInterval(timer);
  }, [authorized, filters]);

  const exportRows = useMemo(() => {
    if (!overview) return [];
    return overview.submissions.map((submission) => ({
      id: submission.id,
      alias: submission.alias,
      watts_mail: submission.watts_mail,
      segmento: submission.segmento,
      status: submission.status,
      completed_at: submission.completed_at,
      edad_rango: submission.edad_rango,
      tipo_vehiculo: submission.tipo_vehiculo,
      empresa: submission.empresa,
      uso_principal: submission.uso_principal,
      frecuencia_carga: submission.frecuencia_carga,
      meses_en_vemo: submission.meses_en_vemo,
      started_at: submission.started_at,
      ex1_activation_fee: submission.ex1_activation_fee ?? null,
      ex2_card_sort: submission.ex2_card_sort ?? null,
      ex3_photo_grouping: submission.ex3_photo_grouping ?? null,
      ex4_hub_builder: submission.ex4_hub_builder ?? null,
    }));
  }, [overview]);

  const downloadJson = () => {
    const blob = new Blob([JSON.stringify(exportRows, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `vemo-export-${new Date().toISOString()}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const downloadCsv = () => {
    const rows = exportRows.map((item) => ({
      ...item,
      ex1_activation_fee: JSON.stringify(item.ex1_activation_fee ?? {}),
      ex2_card_sort: JSON.stringify(item.ex2_card_sort ?? {}),
      ex3_photo_grouping: JSON.stringify(item.ex3_photo_grouping ?? {}),
      ex4_hub_builder: JSON.stringify(item.ex4_hub_builder ?? {}),
    }));
    const headers = Object.keys(rows[0] ?? {});
    const csv = [
      headers.join(","),
      ...rows.map((row) =>
        headers
          .map((header) => {
            const value = row[header as keyof typeof row];
            return `"${String(value ?? "").replaceAll('"', '""')}"`;
          })
          .join(","),
      ),
    ].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `vemo-export-${new Date().toISOString()}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  if (authorized === null) {
    return <LoadingState label="Verificando acceso moderador…" />;
  }

  if (!authorized) {
    return (
      <main className="min-h-screen bg-background px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-md">
          <Card className="border-border shadow-sm">
            <CardHeader>
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <Shield className="h-5 w-5" />
              </div>
              <CardTitle>Acceso moderador</CardTitle>
              <CardDescription>Ingresa el PIN de 4 dígitos. El acceso se recordará hasta el final del día.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <label className="space-y-2">
                <span className="text-sm font-medium text-foreground">PIN</span>
                <input
                  value={pin}
                  onChange={(event) => setPin(event.target.value.replace(/\D/g, "").slice(0, 4))}
                  inputMode="numeric"
                  maxLength={4}
                  className="h-12 w-full rounded-lg border border-input bg-background px-3 text-center text-xl tracking-[0.35em] outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  placeholder="0000"
                />
              </label>
              {errorMessage && <InlineError message={errorMessage} />}
              <Button
                size="lg"
                className="h-12 w-full text-base"
                disabled={pin.length !== 4 || loading}
                onClick={async () => {
                  setLoading(true);
                  try {
                    const result = await verifyModeratorPinFn({ data: { pin } });
                    setAuthorized(result.verified);
                    setErrorMessage(null);

                    if (!result.verified) {
                      throw new Error("No se pudo confirmar el acceso moderador.");
                    }

                    await loadOverview(defaultFilters);
                  } catch (error) {
                    setAuthorized(false);
                    setErrorMessage(error instanceof Error ? error.message : "PIN inválido.");
                  } finally {
                    setLoading(false);
                  }
                }}
              >
                Entrar al panel
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="flex flex-col gap-4 rounded-lg border border-border bg-card px-6 py-5 shadow-sm lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm font-medium text-primary">Panel moderador</p>
            <h1 className="text-2xl font-semibold text-foreground">{APP_NAME}</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Dashboard de respuestas no moderadas con filtros y exportación.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button variant="outline" className="h-10" onClick={() => void loadOverview(filters)} disabled={loading}>
              <RefreshCw className="h-4 w-4" />
              Actualizar
            </Button>
            <Button variant="outline" className="h-10" onClick={downloadCsv} disabled={!exportRows.length}>
              <Download className="h-4 w-4" />
              Export CSV
            </Button>
            <Button variant="outline" className="h-10" onClick={downloadJson} disabled={!exportRows.length}>
              <Download className="h-4 w-4" />
              Export JSON
            </Button>
            <Button
              variant="outline"
              className="h-10"
              onClick={async () => {
                await clearModeratorSessionFn();
                setAuthorized(false);
                setSelectedSubmission(null);
              }}
            >
              <LogOut className="h-4 w-4" />
              Salir
            </Button>
          </div>
        </header>

        <section className="grid gap-4 lg:grid-cols-4">
          {overview?.counters.map((counter) => (
            <Card key={counter.sessionLabel} className="border-border shadow-sm">
              <CardHeader className="pb-3">
                <CardDescription>{counter.sessionLabel}</CardDescription>
                <CardTitle className="text-3xl">{counter.completed}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">tests completados</p>
              </CardContent>
            </Card>
          ))}
        </section>

        <Card className="border-border shadow-sm">
          <CardHeader>
            <div className="flex items-center gap-2">
              <SlidersHorizontal className="h-4 w-4 text-primary" />
              <CardTitle>Filtros</CardTitle>
            </div>
            <CardDescription>La tabla y las exportaciones respetan el filtro activo.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 lg:grid-cols-3">
            <label className="space-y-2">
              <span className="text-sm font-medium text-foreground">Segmento</span>
              <select
                value={filters.segment}
                onChange={(event) => setFilters((current) => ({ ...current, segment: event.target.value }))}
                className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="">Todos</option>
                {Object.entries(SEGMENT_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
            <label className="space-y-2">
              <span className="text-sm font-medium text-foreground">Estado</span>
              <select
                value={filters.status}
                onChange={(event) => setFilters((current) => ({ ...current, status: event.target.value }))}
                className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="">Todos</option>
                {Object.entries(STATUS_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
            <label className="space-y-2">
              <span className="text-sm font-medium text-foreground">Alias</span>
              <div className="flex h-10 items-center rounded-lg border border-input bg-background px-3">
                <Search className="mr-2 h-4 w-4 text-muted-foreground" />
                <input
                  value={filters.aliasQuery}
                  onChange={(event) => setFilters((current) => ({ ...current, aliasQuery: event.target.value }))}
                  className="w-full bg-transparent text-sm outline-none"
                  placeholder="Buscar alias"
                />
              </div>
            </label>
            <div className="lg:col-span-3">
              <Button size="sm" onClick={() => void loadOverview(filters)} disabled={loading}>
                Aplicar filtros
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border shadow-sm">
          <CardHeader>
            <div className="flex items-center gap-2">
              <TableProperties className="h-4 w-4 text-primary" />
              <CardTitle>Tests registrados</CardTitle>
            </div>
            <CardDescription>
              {overview?.submissions.length ?? 0} resultados visibles · última exportación preparada {overview?.exportedAt ? new Date(overview.exportedAt).toLocaleTimeString("es-MX") : "—"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {errorMessage && <InlineError message={errorMessage} />}
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Alias</TableHead>
                  <TableHead>Segmento</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Completado</TableHead>
                  <TableHead>Acción</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(overview?.submissions ?? []).map((submission) => (
                  <TableRow key={submission.id}>
                    <TableCell className="font-medium text-foreground">{submission.alias}</TableCell>
                    <TableCell>{SEGMENT_LABELS[submission.segmento]}</TableCell>
                    <TableCell>
                      <span className="rounded-full bg-secondary px-3 py-1 text-xs font-medium text-secondary-foreground">
                        {STATUS_LABELS[submission.status]}
                      </span>
                    </TableCell>
                    <TableCell>
                      {submission.completed_at
                        ? new Date(submission.completed_at).toLocaleString("es-MX")
                        : "Pendiente"}
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm" onClick={() => setSelectedSubmission(submission)}>
                        <Eye className="h-4 w-4" />
                        Ver detalle
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {selectedSubmission && (
        <DetailDrawer
          submission={selectedSubmission}
          onClose={() => setSelectedSubmission(null)}
          onAbandon={async (submissionId) => {
            setLoading(true);
            try {
              await abandonSubmissionFn({ data: { submissionId } });
              await loadOverview(filters);
            } catch (error) {
              setErrorMessage(error instanceof Error ? error.message : "No se pudo marcar como abandonado.");
            } finally {
              setLoading(false);
            }
          }}
        />
      )}
    </main>
  );
}

function DetailDrawer({
  submission,
  onClose,
  onAbandon,
}: {
  submission: SubmissionRecord;
  onClose: () => void;
  onAbandon: (submissionId: string) => Promise<void>;
}) {
  const ranking = Array.isArray(submission.ex2_card_sort?.ordered_items)
    ? submission.ex2_card_sort.ordered_items
    : [];
  const groupDetails = Array.isArray(submission.ex3_photo_grouping?.group_details)
    ? submission.ex3_photo_grouping.group_details
    : [];
  const groupAssignments = submission.ex3_photo_grouping?.group_assignments && typeof submission.ex3_photo_grouping.group_assignments === "object"
    ? submission.ex3_photo_grouping.group_assignments
    : {};
  const favoritePhoto = PHOTO_OPTIONS.find((photo) => photo.id === submission.ex3_photo_grouping?.favorite_photo_id);
  const durationLabel = formatDuration(submission.started_at, submission.completed_at ?? submission.abandoned_at ?? null);
  const contextualChoices = Object.entries(groupAssignments)
    .map(([photoId, groupId]) => {
      const photo = PHOTO_OPTIONS.find((item) => item.id === photoId);
      const group = groupDetails.find((item: any) => item.groupId === groupId);
      return photo
        ? `${photo.label} → ${group?.name || groupId}`
        : null;
    })
    .filter(Boolean) as string[];

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-foreground/15 backdrop-blur-sm">
      <button type="button" className="flex-1" aria-label="Cerrar detalle" onClick={onClose} />
      <aside className="h-full w-full max-w-2xl overflow-y-auto border-l border-border bg-background shadow-2xl">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-background px-6 py-4">
          <div>
            <p className="text-sm font-medium text-primary">Detalle de prueba</p>
            <h2 className="text-xl font-semibold text-foreground">{submission.alias}</h2>
          </div>
          <Button variant="outline" onClick={onClose}>Cerrar</Button>
        </div>

        <div className="space-y-6 px-6 py-6">
          <section className="grid gap-4 rounded-lg border border-border bg-card p-5 shadow-sm md:grid-cols-2">
            <InfoItem label="Ejercicio actual" value={submission.current_exercise} />
            <InfoItem label="Segmento" value={SEGMENT_LABELS[submission.segmento]} />
            <InfoItem label="Estado" value={STATUS_LABELS[submission.status]} />
            <InfoItem label="Edad" value={submission.edad_rango} />
            <InfoItem label="Vehículo" value={submission.tipo_vehiculo} />
            <InfoItem label="Empresa" value={submission.empresa || "—"} />
            <InfoItem label="Mail de Watts" value={submission.watts_mail || "—"} />
            <InfoItem label="Uso" value={submission.uso_principal} />
            <InfoItem label="Frecuencia" value={submission.frecuencia_carga} />
            <InfoItem label="Meses en Vemo" value={submission.meses_en_vemo} />
            <InfoItem label="Ciudad" value={submission.ciudad || "—"} />
            <InfoItem label="Email opt-in" value={submission.email_opt_in || "—"} />
            <InfoItem label="Link source" value={submission.link_source || "—"} />
          </section>

          <section className="grid gap-4 rounded-lg border border-border bg-card p-5 shadow-sm md:grid-cols-2">
            <InfoItem label="Submission ID" value={submission.id} />
            <InfoItem label="Duración del ejercicio" value={durationLabel} />
            <InfoItem label="Inicio" value={formatDateTime(submission.started_at)} />
            <InfoItem label="Última pantalla" value={formatDateTime(submission.last_screen_at ?? null)} />
            <InfoItem label="Completado" value={formatDateTime(submission.completed_at)} />
            <InfoItem label="Abandonado" value={formatDateTime(submission.abandoned_at ?? null)} />
            <div className="rounded-lg border border-border bg-background p-4">
              <p className="text-xs font-medium uppercase text-muted-foreground">Acciones</p>
              <div className="mt-3">
                <Button
                  variant="outline"
                  disabled={submission.status === "completed" || submission.status === "abandoned"}
                  onClick={() => void onAbandon(submission.id)}
                >
                  Marcar como abandoned
                </Button>
              </div>
            </div>
          </section>

          {submission.ex1_activation_fee && (
            <section className="space-y-4">
              <h3 className="text-lg font-semibold text-foreground">Ticket A/B</h3>
              <div className="grid gap-4 md:grid-cols-2">
                <ResponseBlock title="Ticket A">{submission.ex1_activation_fee.ticket_a_observation || "—"}</ResponseBlock>
                <ResponseBlock title="Ticket B">{submission.ex1_activation_fee.ticket_b_observation || "—"}</ResponseBlock>
              </div>
              <div className="grid gap-4 md:grid-cols-3">
                <InfoItem label="Más claro" value={submission.ex1_activation_fee.clearer_choice || "—"} />
                <InfoItem label="Más justo" value={submission.ex1_activation_fee.fairer_choice || "—"} />
                <InfoItem label="Pagaría" value={submission.ex1_activation_fee.pay_choice || "—"} />
              </div>
              <ResponseBlock title="Motivo de comparación">{submission.ex1_activation_fee.comparison_reason || "—"}</ResponseBlock>
              <InfoItem label="Modelo permanente" value={submission.ex1_activation_fee.permanent_choice || "—"} />
              <ResponseBlock title="Motivo final">{submission.ex1_activation_fee.permanent_reason || "—"}</ResponseBlock>
            </section>
          )}

          {ranking.length > 0 && (
            <section className="space-y-4">
              <h3 className="text-lg font-semibold text-foreground">Card sort</h3>
              <div className="space-y-3">
                {ranking.map((item: any, index: number) => (
                  <div
                    key={item.id ?? index}
                    className={[
                      "flex items-center justify-between rounded-lg border px-4 py-3",
                      index < 3
                        ? "border-primary/30 bg-primary/10"
                        : index >= ranking.length - 3
                          ? "border-border bg-muted"
                          : "border-border bg-card",
                    ].join(" ")}
                  >
                    <div>
                      <p className="font-medium text-foreground">{item.label}</p>
                      <p className="text-sm text-muted-foreground">{item.hint}</p>
                    </div>
                    <span className="rounded-full bg-background px-3 py-1 text-sm font-medium text-foreground">#{index + 1}</span>
                  </div>
                ))}
              </div>
            </section>
          )}

          {submission.ex3_photo_grouping && (
            <section className="space-y-4">
              <h3 className="text-lg font-semibold text-foreground">Photos</h3>
              <div className="space-y-4">
                {groupDetails.map((group: any, index: number) => (
                  <div key={group.groupId} className="rounded-lg border border-border bg-card p-4 shadow-sm">
                    <div className="mb-3">
                      <p className="font-medium text-foreground">Grupo {index + 1}: {group.name}</p>
                      <p className="text-sm text-muted-foreground">{group.reason}</p>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-3">
                      {(group.photoIds ?? []).map((photoId: string) => (
                        <div key={photoId} className="rounded-md border border-border bg-background p-3">
                          <div className="mb-2 flex aspect-[4/3] items-center justify-center rounded-md border border-dashed border-border bg-secondary text-secondary-foreground">
                            <Eye className="h-5 w-5" />
                          </div>
                          <p className="text-center text-sm font-medium text-foreground">{PHOTO_OPTIONS.find((photo) => photo.id === photoId)?.label || photoId}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              <div className="rounded-lg border border-border bg-card p-4 shadow-sm">
                <p className="mb-3 text-sm font-medium text-foreground">Foto favorita</p>
                <div className="rounded-md border border-border bg-background p-4">
                  <div className="mb-3 flex aspect-[16/10] items-center justify-center rounded-md border border-dashed border-border bg-secondary text-secondary-foreground">
                    <Eye className="h-8 w-8" />
                  </div>
                  <p className="font-medium text-foreground">{favoritePhoto?.label || submission.ex3_photo_grouping.favorite_photo_id || "—"}</p>
                </div>
              </div>
              <ResponseBlock title="Motivo">{submission.ex3_photo_grouping.favorite_reason || "—"}</ResponseBlock>
              <ResponseBlock title="Elecciones contextuales">{contextualChoices.length ? contextualChoices.join(" · ") : "No registradas."}</ResponseBlock>
            </section>
          )}

          {submission.ex4_hub_builder && (
            <section className="space-y-4">
              <h3 className="text-lg font-semibold text-foreground">Hub ideal</h3>
              <div className="grid gap-4 md:grid-cols-2">
                <InfoItem label="Precio final" value={String(submission.ex4_hub_builder.final_price ?? "—")} />
                <InfoItem label="Delta vs base" value={String(submission.ex4_hub_builder.delta_vs_base ?? "—")} />
                <InfoItem label="¿Es justo?" value={submission.ex4_hub_builder.fairness || "—"} />
                <InfoItem label="¿Lo usaría?" value={submission.ex4_hub_builder.would_use || "—"} />
              </div>
              <ResponseBlock title="Extras elegidos">
                {Array.isArray(submission.ex4_hub_builder.selected_addons)
                  ? submission.ex4_hub_builder.selected_addons.join(" · ")
                  : "—"}
              </ResponseBlock>
              <ResponseBlock title="Motivo">{submission.ex4_hub_builder.reason || "—"}</ResponseBlock>
              <ResponseBlock title="Sí vale la pena">{submission.ex4_hub_builder.worth_it || "—"}</ResponseBlock>
              <ResponseBlock title="No vale la pena">{submission.ex4_hub_builder.not_worth_it || "—"}</ResponseBlock>
            </section>
          )}
        </div>
      </aside>
    </div>
  );
}

function LoadingState({ label }: { label: string }) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="rounded-lg border border-border bg-card px-6 py-5 text-sm text-muted-foreground shadow-sm">
        {label}
      </div>
    </main>
  );
}

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-background p-4">
      <p className="text-xs font-medium uppercase text-muted-foreground">{label}</p>
      <p className="mt-2 text-sm font-medium text-foreground">{value}</p>
    </div>
  );
}

function formatDateTime(value: string | null | undefined) {
  if (!value) return "—";
  return new Date(value).toLocaleString("es-MX");
}

function formatDuration(startedAt: string, endedAt: string | null) {
  if (!endedAt) return "En curso";
  const diffMs = new Date(endedAt).getTime() - new Date(startedAt).getTime();
  if (Number.isNaN(diffMs) || diffMs < 0) return "—";
  const totalMinutes = Math.floor(diffMs / 60000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes} min`;
}

function ResponseBlock({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-border bg-card p-4 shadow-sm">
      <p className="mb-2 text-sm font-medium text-foreground">{title}</p>
      <p className="text-sm leading-6 text-muted-foreground">{children}</p>
    </div>
  );
}

function InlineError({ message }: { message: string }) {
  return <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">{message}</div>;
}
