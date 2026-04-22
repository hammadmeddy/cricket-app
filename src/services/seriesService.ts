import {
  addDoc,
  collection,
  deleteDoc,
  type DocumentData,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  serverTimestamp,
  where,
  writeBatch,
} from 'firebase/firestore';
import { getFirestoreDb } from '../config/firebase';
import { collections } from '../config/firestorePaths';
import { clampOversPerInnings } from '../lib/matchOvers';
import type { Series, SeriesFormat } from '../types/models';
import { deleteAllDoubleWicketResultsForSeries } from './doubleWicketService';

function mapSeriesDoc(id: string, data: DocumentData): Series {
  const format = data.format;
  const validFormat: SeriesFormat =
    format === 'best-of-5' ||
    format === 'best-of-7' ||
    format === 'test' ||
    format === 'double-wicket'
      ? format
      : 'best-of-3';
  const overs = typeof data.oversPerInnings === 'number' ? data.oversPerInnings : 6;
  return {
    id,
    name: typeof data.name === 'string' ? data.name : 'Series',
    format: validFormat,
    teamAId: typeof data.teamAId === 'string' ? data.teamAId : '',
    teamBId: typeof data.teamBId === 'string' ? data.teamBId : '',
    teamAName: typeof data.teamAName === 'string' ? data.teamAName : '',
    teamBName: typeof data.teamBName === 'string' ? data.teamBName : '',
    oversPerInnings: clampOversPerInnings(overs),
    createdAt: data.createdAt ?? null,
  };
}

export function subscribeSeries(
  onNext: (rows: Series[]) => void,
  onError: (err: Error) => void
): () => void {
  const db = getFirestoreDb();
  if (!db) {
    onNext([]);
    return () => {};
  }
  const q = query(collection(db, collections.series));
  return onSnapshot(
    q,
    (snap) => {
      const list = snap.docs.map((d) => mapSeriesDoc(d.id, d.data()));
      list.sort(
        (a, b) => (b.createdAt?.toMillis() ?? 0) - (a.createdAt?.toMillis() ?? 0)
      );
      onNext(list);
    },
    (e) => onError(e)
  );
}

export async function getSeriesById(seriesId: string): Promise<Series | null> {
  const db = getFirestoreDb();
  if (!db) {
    return null;
  }
  const snap = await getDoc(doc(db, collections.series, seriesId));
  if (!snap.exists()) {
    return null;
  }
  return mapSeriesDoc(snap.id, snap.data());
}

export async function createSeriesRecord(input: {
  name: string;
  format: SeriesFormat;
  teamAId: string;
  teamBId: string;
  teamAName: string;
  teamBName: string;
  oversPerInnings: number;
}): Promise<void> {
  const db = getFirestoreDb();
  if (!db) {
    throw new Error('Firestore is not available.');
  }
  if (input.teamAId === input.teamBId) {
    throw new Error('Choose two different teams.');
  }
  const name = input.name.trim() || 'Series';
  await addDoc(collection(db, collections.series), {
    name,
    format: input.format,
    teamAId: input.teamAId,
    teamBId: input.teamBId,
    teamAName: input.teamAName,
    teamBName: input.teamBName,
    oversPerInnings: clampOversPerInnings(input.oversPerInnings),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

export async function deleteSeriesCascade(seriesId: string): Promise<void> {
  const db = getFirestoreDb();
  if (!db) {
    throw new Error('Firestore is not available.');
  }
  const mq = query(collection(db, collections.matches), where('seriesId', '==', seriesId));
  const snap = await getDocs(mq);
  const refs = snap.docs.map((d) => d.ref);
  const BATCH = 450;
  for (let i = 0; i < refs.length; i += BATCH) {
    const batch = writeBatch(db);
    refs.slice(i, i + BATCH).forEach((r) => batch.delete(r));
    await batch.commit();
  }
  await deleteAllDoubleWicketResultsForSeries(seriesId);
  await deleteDoc(doc(db, collections.series, seriesId));
}
