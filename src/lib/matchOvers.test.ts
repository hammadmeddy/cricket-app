import { describe, expect, it } from 'vitest';
import {
  LEGAL_BALLS_PER_OVER,
  OVERS_PER_INNINGS_MAX,
  OVERS_PER_INNINGS_MIN,
  clampOversPerInnings,
  maxBallsForOvers,
} from './matchOvers';

describe('clampOversPerInnings', () => {
  it('clamps to configured range', () => {
    expect(clampOversPerInnings(1)).toBe(OVERS_PER_INNINGS_MIN);
    expect(clampOversPerInnings(5)).toBe(5);
    expect(clampOversPerInnings(6)).toBe(6);
    expect(clampOversPerInnings(20)).toBe(20);
    expect(clampOversPerInnings(99)).toBe(OVERS_PER_INNINGS_MAX);
  });

  it('floors non-integers', () => {
    expect(clampOversPerInnings(5.9)).toBe(5);
  });
});

describe('maxBallsForOvers', () => {
  it('is overs times legal balls per over', () => {
    expect(maxBallsForOvers(5)).toBe(5 * LEGAL_BALLS_PER_OVER);
    expect(maxBallsForOvers(20)).toBe(20 * LEGAL_BALLS_PER_OVER);
  });
});
