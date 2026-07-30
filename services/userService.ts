import { getUserProfileDoc, updateUserProfileDoc, touchLastLogin } from '@/lib/firebase/firestore';
import { uploadProfilePhoto } from '@/lib/firebase/storage';
import type { UserProfile } from '@/types/user';

export async function fetchUserProfile(uid: string): Promise<UserProfile | null> {
  return getUserProfileDoc(uid);
}

export async function updateUserProfile(
  uid: string,
  updates: Partial<UserProfile>
): Promise<void> {
  await updateUserProfileDoc(uid, updates);
}

export async function recordLogin(uid: string): Promise<void> {
  await touchLastLogin(uid);
}

export async function changeProfilePhoto(uid: string, file: File): Promise<string> {
  const url = await uploadProfilePhoto(uid, file);
  await updateUserProfileDoc(uid, { photoURL: url });
  return url;
}
