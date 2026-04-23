import groupingPhoto1 from "@/assets/grouping-photo-1.png";
import groupingPhoto2 from "@/assets/grouping-photo-2.png";
import groupingPhoto3 from "@/assets/grouping-photo-3.png";
import groupingPhoto4 from "@/assets/grouping-photo-4.png";
import groupingPhoto5 from "@/assets/grouping-photo-5.png";
import groupingPhoto6 from "@/assets/grouping-photo-6.png";

export type ExerciseCode = "ticket_ab" | "card_sort" | "photos" | "hub_builder";
export type SegmentCode = "ride_hailing" | "b2c";
export type SubmissionStatus = "started" | "in_progress" | "completed" | "abandoned";

export type RankingItem = { id: string; label: string; hint: string };
export type PhotoOption = { id: string; label: string; alt: string; src: string };

export const APP_NAME = "Vemo Research Hub";
export const PARTICIPANT_STORAGE_KEY = "vemo-participant-profile";

export const AGE_OPTIONS = ["18–25", "26–35", "36–45", "46–55", "56+"] as const;
export const CITY_OPTIONS = ["CDMX", "Monterrey"] as const;
export const VEHICLE_OPTIONS = [
  { value: "own_ev_credit", label: "Propio pero pagando un crédito" },
  { value: "leased_ev", label: "Alquilado" },
  { value: "fleet_ev", label: "De una flota de empresa" },
  { value: "own_ev", label: "Propio" },
] as const;
export const PRIMARY_USE_OPTIONS = [
  { value: "ride_hailing", label: "Trabajo en aplicaciones" },
  { value: "personal", label: "Personal" },
] as const;
export const CHARGING_FREQUENCY_OPTIONS = [
  { value: "first_time", label: "Primera vez" },
  { value: "1_2_month", label: "Mas o menos 1 a 2 veces al mes" },
  { value: "1_2_week", label: "Mas o menos 1 a 2 veces por semana" },
  { value: "daily", label: "Diaria" },
  { value: "never_vemo", label: "Nunca cargué en Vemo" },
] as const;
export const VEMO_MONTH_OPTIONS = [
  { value: "lt_3", label: "Menos de 3 meses" },
  { value: "3_6", label: "Entre 3 y 6 meses" },
  { value: "6_12", label: "Entre 6 y 12 meses" },
  { value: "gt_12", label: "Mas de 12 meses" },
  { value: "never", label: "Nunca" },
] as const;

export const EXERCISE_LABELS: Record<ExerciseCode, string> = {
  ticket_ab: "Ticket de recarga",
  card_sort: "Ordenar por importancia",
  photos: "Agrupar fotos",
  hub_builder: "Armá tu hub ideal",
};
export const STATUS_LABELS: Record<SubmissionStatus, string> = {
  started: "Iniciado",
  in_progress: "En curso",
  completed: "Completado",
  abandoned: "Abandonado",
};
export const SEGMENT_LABELS: Record<SegmentCode, string> = {
  ride_hailing: "Ride-hailing",
  b2c: "B2C",
};

export const FLOW_EXERCISES: ExerciseCode[] = ["ticket_ab", "card_sort", "photos", "hub_builder"];

export const CARD_SORT_ITEMS: RankingItem[] = [
  { id: "1", label: "Cercanía a mi origen o destino del viaje", hint: "Qué tan cómodo queda el hub dentro de tu recorrido." },
  { id: "2", label: "Seguridad de la zona (día / noche)", hint: "Percepción de seguridad general alrededor del hub." },
  { id: "3", label: "Facilidad de entrar y salir (tráfico, semáforos)", hint: "Qué tan simple es acceder y retomar el camino." },
  { id: "4", label: "Cantidad de cargadores disponibles", hint: "Disponibilidad de puntos de carga en el hub." },
  { id: "5", label: "Velocidad de carga (kW)", hint: "Qué tan rápido carga el vehículo en ese lugar." },
  { id: "6", label: "Baños limpios", hint: "Disponibilidad y calidad de sanitarios." },
  { id: "7", label: "Sombra o techo", hint: "Cobertura y resguardo climático durante la espera." },
  { id: "8", label: "Comida o café cerca", hint: "Acceso a comida, bebidas o una pausa útil." },
  { id: "9", label: "Iluminación de noche", hint: "Qué tan bien iluminado se percibe el lugar." },
  { id: "10", label: "Marca Vemo visible (señalética, uniformes)", hint: "Claridad de la marca y señales en sitio." },
  { id: "11", label: "Precio claro antes de empezar", hint: "Comprensión del costo antes de iniciar la carga." },
  { id: "12", label: "Wifi o sala de espera", hint: "Comodidades adicionales para esperar mientras carga." },
  { id: "13", label: "Apoyo humano in-situ", hint: "Presencia de ayuda o soporte humano en el lugar." },
];

export const PHOTO_OPTIONS: PhotoOption[] = [
  { id: "photo-1", label: "Foto 1", alt: "Hub Vemo junto a Liverpool durante el día", src: groupingPhoto1 },
  { id: "photo-2", label: "Foto 2", alt: "Hub Vemo iluminado de noche con autos cargando", src: groupingPhoto2 },
  { id: "photo-3", label: "Foto 3", alt: "Hub Vemo con área de mesas y sombrilla", src: groupingPhoto3 },
  { id: "photo-4", label: "Foto 4", alt: "Estación amplia de carga Vemo con varias filas de autos", src: groupingPhoto4 },
  { id: "photo-5", label: "Foto 5", alt: "Fila de autos Uber cargando en un estacionamiento abierto", src: groupingPhoto5 },
  { id: "photo-6", label: "Foto 6", alt: "Cargadores Vemo sobre una calle arbolada", src: groupingPhoto6 },
];

export const HUB_ADDONS = [
  { id: "fast_chargers", label: "Cargadores rápidos", delta: 0.5 },
  { id: "shade", label: "Sombra o techo", delta: 0.5 },
  { id: "coffee", label: "Café o snack cerca", delta: 0.4 },
  { id: "bathrooms", label: "Baños limpios", delta: 0.3 },
  { id: "waiting_room", label: "Sala de espera", delta: 0.3 },
  { id: "security", label: "Seguridad aparente", delta: 0.3 },
  { id: "access", label: "Cercanía a avenida principal", delta: 0.2 },
  { id: "night_light", label: "Iluminación de noche", delta: 0.2 },
  { id: "human_help", label: "Apoyo humano in-situ", delta: 0.2 },
  { id: "wifi", label: "Wifi", delta: 0.1 },
] as const;

export const BASE_PRICE_PER_KWH = 7;
export const PHOTO_PLACEHOLDER_HELPER = "Agrupa las 6 fotos reales según lo que percibas que tienen en común.";
export const TICKET_EXPLANATION =
  "Vas a ver dos versiones del mismo ticket. El total final es idéntico; cambia solo la manera de comunicarlo.";
/** Mensaje ético uniforme para toda la experiencia no moderada */
export const RESEARCH_HONESTY_MESSAGE =
  "No hay respuestas incorrectas, queremos tu verdad.";

export function getSegmentFromPrimaryUse(useValue: string): SegmentCode {
  return useValue === "ride_hailing" ? "ride_hailing" : "b2c";
}

export function shuffleItems<T>(items: T[]) {
  const clone = [...items];
  for (let index = clone.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [clone[index], clone[swapIndex]] = [clone[swapIndex], clone[index]];
  }
  return clone;
}
