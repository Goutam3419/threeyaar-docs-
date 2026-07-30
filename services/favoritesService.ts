import {
  collection,
  doc,
  getDocs,
  setDoc,
  deleteDoc,
  query,
  where,
  onSnapshot,
  type Unsubscribe,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/firebase';
import { COLLECTIONS, type FavoriteDoc } from '@/types/firestore';

const FAVORITES_COL = COLLECTIONS.FAVORITES;

function favoriteDocId(userId: string, agentId: string): string {
  return `${userId}_${agentId}`;
}

export async function addFavorite(userId: string, agentId: string): Promise<void> {
  const id = favoriteDocId(userId, agentId);
  const record: FavoriteDoc = { id, userId, agentId, createdAt: new Date().toISOString() };
  await setDoc(doc(db, FAVORITES_COL, id), record);
}

export async function removeFavorite(userId: string, agentId: string): Promise<void> {
  await deleteDoc(doc(db, FAVORITES_COL, favoriteDocId(userId, agentId)));
}

export async function isFavorited(userId: string, agentId: string): Promise<boolean> {
  const q = query(
    collection(db, FAVORITES_COL),
    where('userId', '==', userId),
    where('agentId', '==', agentId)
  );
  const snap = await getDocs(q);
  return !snap.empty;
}

export function subscribeToFavorites(
  userId: string,
  callback: (favorites: FavoriteDoc[]) => void,
  onError: (err: Error) => void
): Unsubscribe {
  const q = query(collection(db, FAVORITES_COL), where('userId', '==', userId));
  return onSnapshot(
    q,
    (snap) => callback(snap.docs.map((d) => d.data() as FavoriteDoc)),
    (err) => onError(err as Error)
  );
}
