/**
 * Fair toss coin: uses Web Crypto / global crypto when available (unbiased bit),
 * otherwise falls back to Math.random (tests may stub crypto).
 */
export type TossCoinFace = 'heads' | 'tails';

type CryptoGetRandom = { getRandomValues<T extends ArrayBufferView>(array: T): T };

function getCrypto(): CryptoGetRandom | undefined {
  const c = globalThis.crypto;
  if (c && typeof c.getRandomValues === 'function') {
    return c as CryptoGetRandom;
  }
  return undefined;
}

/** Uniform integer in [0, maxExclusive). */
export function fairIntBelow(maxExclusive: number): number {
  if (maxExclusive <= 1) {
    return 0;
  }
  const crypto = getCrypto();
  if (crypto) {
    const buf = new Uint32Array(1);
    crypto.getRandomValues(buf);
    return buf[0]! % maxExclusive;
  }
  return Math.floor(Math.random() * maxExclusive);
}

/** Fair heads/tails — independent of the captain's call (XOR of two bytes avoids weak low-bit bias). */
export function fairCoinFace(): TossCoinFace {
  const crypto = getCrypto();
  if (crypto) {
    const buf = new Uint8Array(2);
    crypto.getRandomValues(buf);
    const bit = (buf[0]! ^ buf[1]!) & 1;
    return bit === 0 ? 'heads' : 'tails';
  }
  return Math.random() < 0.5 ? 'heads' : 'tails';
}

/** Extra full 360° spins for the coin animation (6 or 7). */
export function fairSpinExtraFullTurns(): number {
  return 6 + fairIntBelow(2);
}

/**
 * Standard cricket rule: if the coin matches the call, the caller wins the toss.
 * Here the caller is always side A (Team A names the call).
 */
export function tossWinnerFromCallAndOutcome(
  callFace: TossCoinFace,
  outcome: TossCoinFace,
  callerSide: 'A' | 'B'
): 'A' | 'B' {
  if (outcome === callFace) {
    return callerSide;
  }
  return callerSide === 'A' ? 'B' : 'A';
}
