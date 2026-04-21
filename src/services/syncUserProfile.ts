import { doc, serverTimestamp, setDoc } from 'firebase/firestore';
import { collections } from '../config/firestorePaths';
import { getFirestoreDb } from '../config/firebase';

export async function syncUserProfileToFirestore(
  uid: string,
  email: string | null
): Promise<void> {
  const db = getFirestoreDb();
  if (!db) {
    return;
  }
  await setDoc(
    doc(db, collections.users, uid),
    {
      email,
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );
}
