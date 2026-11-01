export type PhraseMastery = { recognition: number; recall: number; points: number; attempts: number };
export const TARGET = 3;
export function isComplete(value?: PhraseMastery) { return (value?.recognition ?? 0) >= TARGET && (value?.recall ?? 0) >= TARGET; }
export function recommendedMode(value?: PhraseMastery): "choice" | "write" { return (value?.recognition ?? 0) >= TARGET ? "write" : "choice"; }
export function masteryLabel(value?: PhraseMastery) {
  if (isComplete(value)) return "Complete · Keep growing";
  return recommendedMode(value) === "write" ? `Recall · ${Math.min(TARGET, value?.recall ?? 0)}/${TARGET}` : `Recognise · ${Math.min(TARGET, value?.recognition ?? 0)}/${TARGET}`;
}
export function masteryPercent(value?: PhraseMastery) { return Math.round((Math.min(TARGET, value?.recognition ?? 0) + Math.min(TARGET, value?.recall ?? 0)) / (TARGET * 2) * 100); }
export function recordRecall(previous: PhraseMastery | undefined, mode: "choice" | "write", correct: boolean, hinted: boolean): PhraseMastery {
  const value = previous ?? { recognition: 0, recall: 0, points: 0, attempts: 0 };
  const earned = correct && !hinted;
  return { recognition: value.recognition + (earned && mode === "choice" ? 1 : 0), recall: value.recall + (earned && mode === "write" && value.recognition >= TARGET ? 1 : 0), points: value.points + (earned ? mode === "write" ? 2 : 1 : 0), attempts: value.attempts + 1 };
}
