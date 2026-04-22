import {
  addDoc,
  collection,
  deleteDoc,
  type DocumentData,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
  writeBatch,
} from 'firebase/firestore';
import { getFirestoreDb } from '../config/firebase';
import { collections } from '../config/firestorePaths';
import type { Team } from '../types/models';

function mapTeamDoc(id: string, data: DocumentData): Team {
  return {
    id,
    name: typeof data.name === 'string' ? data.name : 'Unnamed',
    shortCode: typeof data.shortCode === 'string' ? data.shortCode : '',
    createdAt: data.createdAt ?? null,
  };
}

export function subscribeTeams(
  onNext: (teams: Team[]) => void,
  onError: (err: Error) => void
): () => void {
  const db = getFirestoreDb();
  if (!db) {
    onNext([]);
    return () => {};
  }
  const q = query(collection(db, collections.teams), orderBy('name'));
  return onSnapshot(
    q,
    (snap) => {
      onNext(snap.docs.map((d) => mapTeamDoc(d.id, d.data())));
    },
    (e) => onError(e)
  );
}

export async function createTeamRecord(name: string, shortCode: string): Promise<void> {
  const db = getFirestoreDb();
  if (!db) {
    throw new Error('Firestore is not available.');
  }
  const trimmed = name.trim();
  if (!trimmed) {
    throw new Error('Team name is required.');
  }
  await addDoc(collection(db, collections.teams), {
    name: trimmed,
    shortCode: shortCode.trim().toUpperCase().slice(0, 6),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

export async function getTeamById(teamId: string): Promise<Team | null> {
  const db = getFirestoreDb();
  if (!db) {
    return null;
  }
  const snap = await getDoc(doc(db, collections.teams, teamId));
  if (!snap.exists()) {
    return null;
  }
  return mapTeamDoc(snap.id, snap.data());
}

export async function updateTeamRecord(
  teamId: string,
  name: string,
  shortCode: string
): Promise<void> {
  const db = getFirestoreDb();
  if (!db) {
    throw new Error('Firestore is not available.');
  }
  const trimmed = name.trim();
  if (!trimmed) {
    throw new Error('Team name is required.');
  }
  await updateDoc(doc(db, collections.teams, teamId), {
    name: trimmed,
    shortCode: shortCode.trim().toUpperCase().slice(0, 6),
    updatedAt: serverTimestamp(),
  });
}

/** Deletes all players for the team, then the team document (batched deletes). */
export async function deleteTeamAndPlayers(teamId: string): Promise<void> {
  const db = getFirestoreDb();
  if (!db) {
    throw new Error('Firestore is not available.');
  }
  const pq = query(collection(db, collections.players), where('teamId', '==', teamId));
  const snap = await getDocs(pq);
  const refs = snap.docs.map((d) => d.ref);
  const BATCH = 450;
  for (let i = 0; i < refs.length; i += BATCH) {
    const batch = writeBatch(db);
    refs.slice(i, i + BATCH).forEach((r) => batch.delete(r));
    await batch.commit();
  }
  await deleteDoc(doc(db, collections.teams, teamId));
}
