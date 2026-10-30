export type LessonPractice = { completions: number; masteryPoints: number; bestScore: number };

// A completed ten-phrase lesson earns one mastery point per unaided recall.
// These lifetime counters are independent of the spaced-review stage ceiling.
export function completeLesson(previous: LessonPractice | undefined, score: number): LessonPractice {
  const points = Math.max(0, Math.min(10, Math.floor(score)));
  return {
    completions: (previous?.completions ?? 0) + 1,
    masteryPoints: (previous?.masteryPoints ?? 0) + points,
    bestScore: Math.max(previous?.bestScore ?? 0, points),
  };
}
