import type { RootState } from './index';

/**
 * Guests use Firebase anonymous auth (read-only in rules). Staff use email/password (or any
 * non-anonymous provider) so they can add/edit/delete matches, teams, and players.
 */
export function selectCanManageAppData(state: RootState): boolean {
  const u = state.auth.user;
  return Boolean(u && u.isAnonymous === false);
}
