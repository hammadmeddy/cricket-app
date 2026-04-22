/** Legal balls per over is always six in this scorer; overs per innings is flexible. */
export const LEGAL_BALLS_PER_OVER = 6;

export const OVERS_PER_INNINGS_MIN = 2;
export const OVERS_PER_INNINGS_MAX = 50;

export function clampOversPerInnings(n: number): number {
  const x = Math.floor(Number(n));
  if (!Number.isFinite(x)) {
    return 6;
  }
  return Math.min(OVERS_PER_INNINGS_MAX, Math.max(OVERS_PER_INNINGS_MIN, x));
}

export function maxBallsForOvers(oversPerInnings: number): number {
  return clampOversPerInnings(oversPerInnings) * LEGAL_BALLS_PER_OVER;
}
