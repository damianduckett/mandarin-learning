import { createEmptyCard, fsrs, Rating, type Card } from "ts-fsrs";

export const MIN_REVIEW_INTERVAL = 24 * 60 * 60 * 1000;
export const FULLY_LEARNED_STAGE = 8;
export type MemoryCard = { phraseId: number; stage: number; dueAt: string; lastReviewedAt: string; correctStreak: number; lapses: number; stability?: number; difficulty?: number; reps?: number; state?: number; fsrs?: Card };
const scheduler = fsrs({ request_retention: 0.9 });
const labels = ["new", "1 day", "3 days", "7 days", "14 days", "30 days", "90 days", "180 days", "365 days"];
export function reviewCard(previous: MemoryCard | undefined, phraseId: number, correct: boolean, now = new Date()): MemoryCard {
 const base = previous?.fsrs ? previous.fsrs : createEmptyCard(now);
 const result = scheduler.next(base, now, correct ? Rating.Good : Rating.Again);
 const fsrsCard = { ...result.card, due: new Date(Math.max(new Date(result.card.due).getTime(), now.getTime() + MIN_REVIEW_INTERVAL)) };
 const stage = Math.min(FULLY_LEARNED_STAGE, previous ? (correct ? previous.stage + 1 : Math.max(1, previous.stage - 1)) : correct ? 2 : 1);
 return { phraseId, stage, dueAt: fsrsCard.due.toISOString(), lastReviewedAt: now.toISOString(), correctStreak: correct ? (previous?.correctStreak ?? 0) + 1 : 0, lapses: (previous?.lapses ?? 0) + (correct ? 0 : 1), stability: fsrsCard.stability, difficulty: fsrsCard.difficulty, reps: fsrsCard.reps, state: fsrsCard.state, fsrs: fsrsCard };
}
export function isDue(card: MemoryCard, now = new Date()) { return new Date(card.dueAt).getTime() <= now.getTime(); }
export function intervalLabel(stage: number) { return labels[Math.max(0, Math.min(FULLY_LEARNED_STAGE, stage))] ?? "365 days"; }
