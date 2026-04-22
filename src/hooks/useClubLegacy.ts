import { useMemo } from 'react';
import { DEFAULT_CLUB_LEGACY } from '../data/defaultClubLegacy';
import type { ClubLegacySnapshot } from '../types/clubLegacy';

/** Club-wide manual summary; defaults ship in app (edit `src/data/defaultClubLegacy.ts`). */
export function useClubLegacy(): ClubLegacySnapshot {
  return useMemo(() => DEFAULT_CLUB_LEGACY, []);
}
