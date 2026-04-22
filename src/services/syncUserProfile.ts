import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { collections } from '../config/firestorePaths';
import { getFirestoreDb } from '../config/firebase';

/**
 * Keeps `users/{uid}` in sync. Never overwrites `role` once set (admins promote via Console).
 * New docs default to `role: 'viewer'` so Firestore rules can allow read / restrict writes.
 */
export async function syncUserProfileToFirestore(
  uid: string,
  email: string | null,
  isAnonymous: boolean
): Promise<void> {
  const db = getFirestoreDb();
  if (!db) {
    return;
  }
  const ref = doc(db, collections.users, uid);
  const snap = await getDoc(ref);
  if (!snap.exists()) {
    await setDoc(ref, {
      email: email ?? null,
      role: 'viewer',
      isAnonymous,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return;
  }
  await setDoc(
    ref,
    {
      email: email ?? null,
      isAnonymous,
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );
}
