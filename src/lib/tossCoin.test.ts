import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  fairCoinFace,
  fairIntBelow,
  fairSpinExtraFullTurns,
  tossWinnerFromCallAndOutcome,
} from './tossCoin';

describe('tossWinnerFromCallAndOutcome', () => {
  it('caller wins when the coin matches the call (Team A calls)', () => {
    expect(tossWinnerFromCallAndOutcome('heads', 'heads', 'A')).toBe('A');
    expect(tossWinnerFromCallAndOutcome('tails', 'tails', 'A')).toBe('A');
  });

  it('non-caller wins when the coin does not match (Team A calls)', () => {
    expect(tossWinnerFromCallAndOutcome('heads', 'tails', 'A')).toBe('B');
    expect(tossWinnerFromCallAndOutcome('tails', 'heads', 'A')).toBe('B');
  });

  it('caller B wins on match; A wins on mismatch when B called', () => {
    expect(tossWinnerFromCallAndOutcome('heads', 'heads', 'B')).toBe('B');
    expect(tossWinnerFromCallAndOutcome('heads', 'tails', 'B')).toBe('A');
    expect(tossWinnerFromCallAndOutcome('tails', 'heads', 'B')).toBe('A');
  });
});

describe('fairCoinFace', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('returns only heads or tails', () => {
    for (let i = 0; i < 50; i++) {
      const v = fairCoinFace();
      expect(v === 'heads' || v === 'tails').toBe(true);
    }
  });

  it('maps XOR of two stubbed bytes to heads/tails deterministically', () => {
    const getRandomValues = vi.fn((arr: Uint8Array) => {
      arr[0] = 0;
      arr[1] = 0;
      return arr;
    });
    vi.stubGlobal('crypto', { getRandomValues });

    expect(fairCoinFace()).toBe('heads');

    getRandomValues.mockImplementation((arr: Uint8Array) => {
      arr[0] = 1;
      arr[1] = 0;
      return arr;
    });
    expect(fairCoinFace()).toBe('tails');

    getRandomValues.mockImplementation((arr: Uint8Array) => {
      arr[0] = 5;
      arr[1] = 3;
      return arr;
    });
    expect(fairCoinFace()).toBe('heads');

    vi.unstubAllGlobals();
  });

  it('distribution is roughly 50/50 over many flips (uses real crypto in Node)', () => {
    let heads = 0;
    const n = 6000;
    for (let i = 0; i < n; i++) {
      if (fairCoinFace() === 'heads') {
        heads++;
      }
    }
    expect(heads).toBeGreaterThan(n * 0.46);
    expect(heads).toBeLessThan(n * 0.54);
  });
});

describe('fairIntBelow', () => {
  it('returns 0 when maxExclusive is 1', () => {
    expect(fairIntBelow(1)).toBe(0);
  });

  it('returns only 0 or 1 for maxExclusive 2 with stubbed crypto', () => {
    let i = 0;
    const getRandomValues = vi.fn((arr: Uint32Array) => {
      arr[0] = i++;
      return arr;
    });
    vi.stubGlobal('crypto', { getRandomValues });
    for (let k = 0; k < 20; k++) {
      const v = fairIntBelow(2);
      expect(v === 0 || v === 1).toBe(true);
    }
    vi.unstubAllGlobals();
  });
});

describe('fairSpinExtraFullTurns', () => {
  it('is always 6 or 7', () => {
    for (let i = 0; i < 40; i++) {
      const s = fairSpinExtraFullTurns();
      expect(s === 6 || s === 7).toBe(true);
    }
  });
});
