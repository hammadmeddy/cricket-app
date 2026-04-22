import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  writeBatch,
} from 'firebase/firestore';
import type { DocumentData } from 'firebase/firestore';
import { getFirestoreDb } from '../config/firebase';
import { collections } from '../config/firestorePaths';
import type { DoubleWicketMatchResult } from '../types/models';

const SUB = 'doubleWicketResults';

function mapDwDoc(id: string, data: DocumentData): DoubleWicketMatchResult {
  const place = typeof data.place === 'number' ? data.place : parseInt(String(data.place), 10) || 0;
  return {
    id,
    seriesId: typeof data.seriesId === 'string' ? data.seriesId : '',
    place: Number.isFinite(place) ? place : 0,
    player1Name: typeof data.player1Name === 'string' ? data.player1Name : '',
    player2Name: typeof data.player2Name === 'string' ? data.player2Name : '',
    dateLabel: typeof data.dateLabel === 'string' ? data.dateLabel : '',
    notes: typeof data.notes === 'string' ? data.notes : undefined,
  };
}

export function subscribeDoubleWicketResults(
  seriesId: string,
  onNext: (rows: DoubleWicketMatchResult[]) => void,
  onError: (err: Error) => void
): () => void {
  const db = getFirestoreDb();
  if (!db) {
    onNext([]);
    return () => {};
  }
  const q = query(
    collection(db, collections.series, seriesId, SUB),
    orderBy('place', 'asc')
  );
  return onSnapshot(
    q,
    (snap) => {
      const rows = snap.docs.map((d) => ({
        ...mapDwDoc(d.id, d.data()),
        seriesId,
      }));
      onNext(rows);
    },
    (e) => onError(e)
  );
}

export async function addDoubleWicketResult(input: {
  seriesId: string;
  place: number;
  player1Name: string;
  player2Name: string;
  dateLabel: string;
  notes?: string;
}): Promise<void> {
  const db = getFirestoreDb();
  if (!db) {
    throw new Error('Firestore is not available.');
  }
  await addDoc(collection(db, collections.series, input.seriesId, SUB), {
    seriesId: input.seriesId,
    place: input.place,
    player1Name: input.player1Name.trim(),
    player2Name: input.player2Name.trim(),
    dateLabel: input.dateLabel.trim(),
    notes: input.notes?.trim() || null,
    createdAt: serverTimestamp(),
  });
}

export async function deleteDoubleWicketResult(seriesId: string, resultId: string): Promise<void> {
  const db = getFirestoreDb();
  if (!db) {
    throw new Error('Firestore is not available.');
  }
  await deleteDoc(doc(db, collections.series, seriesId, SUB, resultId));
}

export async function deleteAllDoubleWicketResultsForSeries(seriesId: string): Promise<void> {
  const db = getFirestoreDb();
  if (!db) {
    return;
  }
  const snap = await getDocs(collection(db, collections.series, seriesId, SUB));
  const BATCH = 450;
  for (let i = 0; i < snap.docs.length; i += BATCH) {
    const batch = writeBatch(db);
    snap.docs.slice(i, i + BATCH).forEach((d) => batch.delete(d.ref));
    await batch.commit();
  }
}
