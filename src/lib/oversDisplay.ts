/** Convert legal balls (0–max) to overs string e.g. 2.3 for 2 overs 3 balls. */
export function ballsToOversString(legalBalls: number): string {
  const o = Math.floor(legalBalls / 6);
  const b = legalBalls % 6;
  return `${o}.${b}`;
}

/** 1–6 = nth legal ball of this over; 0 = no ball bowled yet this innings. */
export function ballIndexInCurrentOver(legalBallsInInnings: number): number {
  if (legalBallsInInnings <= 0) {
    return 0;
  }
  const m = legalBallsInInnings % 6;
  return m === 0 ? 6 : m;
}
