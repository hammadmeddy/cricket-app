import {
  addDoc,
  collection,
  deleteDoc,
  type DocumentData,
  doc,
  onSnapshot,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from 'firebase/firestore';
import { getFirestoreDb } from '../config/firebase';
import { collections } from '../config/firestorePaths';
import type { Player, PlayerRole } from '../types/models';

function mapPlayerDoc(id: string, data: DocumentData): Player {
  const role = data.role;
  const validRole: PlayerRole =
    role === 'bowler' || role === 'all-rounder' ? role : 'batsman';
  return {
    id,
    teamId: typeof data.teamId === 'string' ? data.teamId : '',
    name: typeof data.name === 'string' ? data.name : 'Unknown',
    role: validRole,
    createdAt: data.createdAt ?? null,
  };
}

export function subscribeAllPlayers(
  onNext: (players: Player[]) => void,
  onError: (err: Error) => void
): () => void {
  const db = getFirestoreDb();
  if (!db) {
    onNext([]);
    return () => {};
  }
  return onSnapshot(
    query(collection(db, collections.players)),
    (snap) => {
      const list = snap.docs.map((d) => mapPlayerDoc(d.id, d.data()));
      list.sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }));
      onNext(list);
    },
    (e) => onError(e)
  );
}

export function subscribePlayersByTeam(
  teamId: string,
  onNext: (players: Player[]) => void,
  onError: (err: Error) => void
): () => void {
  const db = getFirestoreDb();
  if (!db) {
    onNext([]);
    return () => {};
  }
  const q = query(
    collection(db, collections.players),
    where('teamId', '==', teamId)
  );
  return onSnapshot(
    q,
    (snap) => {
      const list = snap.docs.map((d) => mapPlayerDoc(d.id, d.data()));
      list.sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }));
      onNext(list);
    },
    (e) => onError(e)
  );
}

export async function createPlayerRecord(
  teamId: string,
  name: string,
  role: PlayerRole
): Promise<void> {
  const db = getFirestoreDb();
  if (!db) {
    throw new Error('Firestore is not available.');
  }
  const trimmed = name.trim();
  if (!trimmed) {
    throw new Error('Player name is required.');
  }
  await addDoc(collection(db, collections.players), {
    teamId,
    name: trimmed,
    role,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

export async function updatePlayerRecord(
  playerId: string,
  name: string,
  role: PlayerRole
): Promise<void> {
  const db = getFirestoreDb();
  if (!db) {
    throw new Error('Firestore is not available.');
  }
  const trimmed = name.trim();
  if (!trimmed) {
    throw new Error('Player name is required.');
  }
  await updateDoc(doc(db, collections.players, playerId), {
    name: trimmed,
    role,
    updatedAt: serverTimestamp(),
  });
}

export async function deletePlayerRecord(playerId: string): Promise<void> {
  const db = getFirestoreDb();
  if (!db) {
    throw new Error('Firestore is not available.');
  }
  await deleteDoc(doc(db, collections.players, playerId));
}
