import { z } from "zod";
import {
  AGE_OPTIONS,
  HUB_ADDONS,
  CHARGING_FREQUENCY_OPTIONS,
  PHOTO_OPTIONS,
  PRIMARY_USE_OPTIONS,
  VEHICLE_OPTIONS,
  VEMO_MONTH_OPTIONS,
} from "@/lib/vemo-config";

const ageOptions = [...AGE_OPTIONS] as [string, ...string[]];
const vehicleOptions = VEHICLE_OPTIONS.map((item) => item.value) as [string, ...string[]];
const useOptions = PRIMARY_USE_OPTIONS.map((item) => item.value) as [string, ...string[]];
const chargingOptions = CHARGING_FREQUENCY_OPTIONS.map((item) => item.value) as [string, ...string[]];
const monthOptions = VEMO_MONTH_OPTIONS.map((item) => item.value) as [string, ...string[]];
const photoIds = PHOTO_OPTIONS.map((item) => item.id) as [string, ...string[]];
const hubAddonIds = HUB_ADDONS.map((item) => item.id) as [string, ...string[]];

export const participantProfileSchema = z.object({
  alias: z.string().trim().max(80).default(""),
  wattsMail: z.string().trim().email("Ingresá un email válido para acreditar los $100."),
  edadRango: z.enum(ageOptions),
  tipoVehiculo: z.enum(vehicleOptions),
  empresa: z.string().trim().max(120).optional(),
  usoPrincipal: z.enum(useOptions),
  frecuenciaCarga: z.enum(chargingOptions),
  mesesEnVemo: z.enum(monthOptions),
  ciudad: z.string().trim().max(120).optional(),
  linkSource: z.string().trim().max(120).optional(),
}).superRefine((data, ctx) => {
  const requiresCompany =
    data.tipoVehiculo === "own_ev_credit" || data.tipoVehiculo === "leased_ev" || data.tipoVehiculo === "fleet_ev";
  if (requiresCompany && (!data.empresa || data.empresa.trim().length < 2)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["empresa"],
      message: "Decinos a qué empresa pertenecés.",
    });
  }
});

export const submissionIdSchema = z.object({
  submissionId: z.string().uuid(),
});

export const activationFeeSchema = z.object({
  submissionId: z.string().uuid(),
  ticketAObservation: z.string().trim().max(5000).optional(),
  ticketBObservation: z.string().trim().max(5000).optional(),
  clearerChoice: z.enum(["A", "B"]).optional(),
  fairerChoice: z.enum(["A", "B"]).optional(),
  payChoice: z.enum(["A", "B"]).optional(),
  comparisonReason: z.string().trim().max(5000).optional(),
  permanentChoice: z.enum(["A", "B", "equal"]).optional(),
  permanentReason: z.string().trim().max(5000).optional(),
});

export const cardSortItemSchema = z.object({
  id: z.string().min(1).max(100),
  label: z.string().min(1).max(200),
  hint: z.string().min(1).max(300),
});

export const cardSortSchema = z.object({
  submissionId: z.string().uuid(),
  orderedItems: z.array(cardSortItemSchema).length(13),
  confirmed: z.boolean().optional(),
});

export const photoGroupingDetailSchema = z.object({
  groupId: z.string().min(1).max(100),
  name: z.string().trim().min(1, "Nombra el grupo").max(80),
  reason: z.string().trim().min(1, "Explica el agrupamiento").max(5000),
  photoIds: z.array(z.enum(photoIds)).min(1).max(6),
});

export const photoGroupingSchema = z.object({
  submissionId: z.string().uuid(),
  groupAssignments: z.record(z.enum(photoIds), z.string().min(1).max(100)),
  groupDetails: z.array(photoGroupingDetailSchema).max(5).optional(),
  favoritePhotoId: z.enum(photoIds).optional(),
  favoriteReason: z.string().trim().max(5000).optional(),
});

export const hubBuilderSchema = z.object({
  submissionId: z.string().uuid(),
  selectedAddons: z.array(z.enum(hubAddonIds)),
  finalPrice: z.number().min(0),
  deltaVsBase: z.number().min(0),
  fairness: z.enum(["si", "mas_o_menos", "no"]),
  wouldUse: z.enum(["siempre", "a_veces", "no"]),
  reason: z.string().trim().max(5000),
  worthIt: z.string().trim().max(5000),
  notWorthIt: z.string().trim().max(5000),
});

export const completionSchema = z.object({
  submissionId: z.string().uuid(),
  emailOptIn: z.string().trim().email().optional().or(z.literal("")),
});

export const moderatorPinSchema = z.object({
  pin: z.string().regex(/^\d{4}$/, "El PIN debe tener 4 dígitos"),
});

export const moderatorFilterSchema = z.object({
  segment: z.enum(["ride_hailing", "b2c"]).optional(),
  status: z.enum(["started", "in_progress", "completed", "abandoned"]).optional(),
  aliasQuery: z.string().trim().max(80).optional(),
});

export type ParticipantProfileInput = z.infer<typeof participantProfileSchema>;
export type ActivationFeeInput = z.infer<typeof activationFeeSchema>;
export type CardSortInput = z.infer<typeof cardSortSchema>;
export type PhotoGroupingInput = z.infer<typeof photoGroupingSchema>;
export type HubBuilderInput = z.infer<typeof hubBuilderSchema>;
export type ModeratorFilterInput = z.infer<typeof moderatorFilterSchema>;
export type PhotoGroupingDetailInput = z.infer<typeof photoGroupingDetailSchema>;
