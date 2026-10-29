export const REVIEW_INTERVALS = [
  0,
  10 * 60 * 1000,
  24 * 60 * 60 * 1000,
  3 * 24 * 60 * 60 * 1000,
  7 * 24 * 60 * 60 * 1000,
  14 * 24 * 60 * 60 * 1000,
  30 * 24 * 60 * 60 * 1000,
  90 * 24 * 60 * 60 * 1000,
  180 * 24 * 60 * 60 * 1000,
] as const;

export const FULLY_LEARNED_STAGE = REVIEW_INTERVALS.length - 1;

export type MemoryCard = {
  phraseId: number;
  stage: number;
  dueAt: string;
  lastReviewedAt: string;
  correctStreak: number;
  lapses: number;
};

export function reviewCard(
  previous: MemoryCard | undefined,
  phraseId: number,
  correct: boolean,
  now = new Date(),
): MemoryCard {
  const oldStage = previous?.stage ?? 0;
  const stage = correct ? Math.min(oldStage + 1, FULLY_LEARNED_STAGE) : 1;
  const dueAt = new Date(now.getTime() + REVIEW_INTERVALS[stage]).toISOString();

  return {
    phraseId,
    stage,
    dueAt,
    lastReviewedAt: now.toISOString(),
    correctStreak: correct ? (previous?.correctStreak ?? 0) + 1 : 0,
    lapses: (previous?.lapses ?? 0) + (correct ? 0 : 1),
  };
}

export function isDue(card: MemoryCard, now = new Date()) {
  return new Date(card.dueAt).getTime() <= now.getTime();
}

export function intervalLabel(stage: number) {
  return ["new", "10 min", "1 day", "3 days", "7 days", "14 days", "30 days", "90 days", "180 days"][stage] ?? "180 days";
}
