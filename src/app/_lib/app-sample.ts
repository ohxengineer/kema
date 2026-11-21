import type { Locale } from "@/app/_lib/i18n";

/**
 * Sample data for designing the app, until there is a real backend. The
 * goals echo the landing's photos: running, reading, swimming, piano.
 */

export type GoalKind = "physical" | "mental";
/** An OKR objective: where you want to get, and by when. Its key results are the goals. */
export type Objective = {
  id: string;
  title: string;
  kind: GoalKind;
  /** The deadline, as an ISO date (YYYY-MM-DD). */
  deadline?: string;
};
/** A key result: the measurable step you tick off each day. */
export type Goal = {
  id: string;
  /** The objective this key result moves forward. */
  objective: string;
  title: string;
  /** A one-line summary shown under the title, e.g. "5 km · Entre semana". */
  target: string;
  kind: GoalKind;
  /** The quantitative part: how much, in what unit (5 km, 20 páginas). */
  amount?: number;
  unit?: string;
  /** The days it repeats on, 0 = Monday … 6 = Sunday, like an alarm. */
  days?: number[];
  /** Share of the goal met so far this week, 0–1. */
  week: number;
  doneToday: boolean;
};
export type Mood = "great" | "good" | "meh" | "hard";
export type JournalEntry = { id: string; date: string; mood: Mood; text: string };

const objectives: Record<Locale, Objective[]> = {
  es: [
    { id: "10k", title: "Correr 10 km en menos de 50 minutos antes de junio.", kind: "physical", deadline: "2027-05-31" },
    { id: "mind", title: "Cultivar una mente más tranquila y curiosa.", kind: "mental", deadline: "2026-12-31" },
    { id: "piano", title: "Tocar una pieza completa al piano.", kind: "mental", deadline: "2027-03-31" },
  ],
  en: [
    { id: "10k", title: "Run a 10K in under 50 minutes by June.", kind: "physical", deadline: "2027-05-31" },
    { id: "mind", title: "Grow a calmer, more curious mind.", kind: "mental", deadline: "2026-12-31" },
    { id: "piano", title: "Play a full piece on the piano.", kind: "mental", deadline: "2027-03-31" },
  ],
};

const goals: Record<Locale, Goal[]> = {
  es: [
    { id: "run", objective: "10k", title: "Correr 5 km", target: "3 veces por semana", amount: 5, unit: "km", days: [0, 2, 4], kind: "physical", week: 0.6, doneToday: true },
    { id: "swim", objective: "10k", title: "Nadar 30 min", target: "Para ganar resistencia", amount: 30, unit: "min", days: [1, 3], kind: "physical", week: 0.4, doneToday: false },
    { id: "read", objective: "mind", title: "Leer 20 páginas", target: "Cada día", amount: 20, unit: "páginas", days: [0, 1, 2, 3, 4, 5, 6], kind: "mental", week: 0.85, doneToday: true },
    { id: "meditate", objective: "mind", title: "Meditar 10 min", target: "Al despertar", amount: 10, unit: "min", days: [0, 1, 2, 3, 4, 5, 6], kind: "mental", week: 1, doneToday: false },
    { id: "piano", objective: "piano", title: "Practicar piano 30 min", target: "Una sección nueva por semana", amount: 30, unit: "min", days: [0, 1, 2, 3, 4], kind: "mental", week: 0.7, doneToday: false },
  ],
  en: [
    { id: "run", objective: "10k", title: "Run 5 km", target: "3 times a week", amount: 5, unit: "km", days: [0, 2, 4], kind: "physical", week: 0.6, doneToday: true },
    { id: "swim", objective: "10k", title: "Swim 30 min", target: "To build endurance", amount: 30, unit: "min", days: [1, 3], kind: "physical", week: 0.4, doneToday: false },
    { id: "read", objective: "mind", title: "Read 20 pages", target: "Every day", amount: 20, unit: "pages", days: [0, 1, 2, 3, 4, 5, 6], kind: "mental", week: 0.85, doneToday: true },
    { id: "meditate", objective: "mind", title: "Meditate 10 min", target: "On waking up", amount: 10, unit: "min", days: [0, 1, 2, 3, 4, 5, 6], kind: "mental", week: 1, doneToday: false },
    { id: "piano", objective: "piano", title: "Practice piano 30 min", target: "A new section each week", amount: 30, unit: "min", days: [0, 1, 2, 3, 4], kind: "mental", week: 0.7, doneToday: false },
  ],
};

const journal: Record<Locale, JournalEntry[]> = {
  es: [
    { id: "3", date: "2026-11-14", mood: "great", text: "Primera vez que corro 5 km sin parar. Las piernas pesaban al final, pero la cabeza estaba ligera." },
    { id: "2", date: "2026-11-13", mood: "meh", text: "No nadé: llegué tarde del trabajo. Mañana temprano, antes de abrir el correo." },
    { id: "1", date: "2026-11-12", mood: "good", text: "Terminé el capítulo que tenía pendiente y practiqué la escala nueva en el piano." },
  ],
  en: [
    { id: "3", date: "2026-11-14", mood: "great", text: "First time running 5 km without stopping. Heavy legs at the end, light head." },
    { id: "2", date: "2026-11-13", mood: "meh", text: "Skipped the swim: got home late. Tomorrow early, before opening email." },
    { id: "1", date: "2026-11-12", mood: "good", text: "Finished the chapter I owed myself and practiced the new scale on the piano." },
  ],
};

export const sample = (locale: Locale) => ({
  objectives: objectives[locale],
  goals: goals[locale],
  journal: journal[locale],
  streak: 12,
  bestStreak: 21,
  /** Share of goals met each day this week, Monday first; null is still ahead. */
  week: [0.8, 1, 0.6, 0.4, 1, 0.4, null] as (number | null)[],
});

/**
 * Sample history: which goals were done on a past day. Deterministic per
 * date and goal, so a day always shows the same rings; about two in three
 * goals get done.
 */
export function sampleDoneOn(goals: Goal[], date: Date): Set<string> {
  const day = date.toISOString().slice(0, 10);
  return new Set(
    goals
      .filter((goal) => {
        let h = 2166136261;
        for (const ch of `${day}:${goal.id}`) h = Math.imul(h ^ ch.charCodeAt(0), 16777619);
        return (h >>> 0) % 100 < 65;
      })
      .map((goal) => goal.id),
  );
}
