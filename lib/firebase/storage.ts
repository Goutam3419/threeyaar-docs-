import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { storage } from './firebase';

function profilePhotoPath(uid: string, fileName: string): string {
  return `users/${uid}/profile/${fileName}`;
}

export async function uploadProfilePhoto(uid: string, file: File): Promise<string> {
  const path = profilePhotoPath(uid, `avatar-${Date.now()}-${file.name}`);
  const storageRef = ref(storage, path);
  await uploadBytes(storageRef, file);
  return getDownloadURL(storageRef);
}

export async function deleteProfilePhoto(photoPath: string): Promise<void> {
  const storageRef = ref(storage, photoPath);
  await deleteObject(storageRef);
}

// ---------- Agent marketplace assets (admin-only uploads) ----------

function agentAssetPath(agentId: string, kind: string, fileName: string): string {
  return `agents/${agentId}/${kind}/${Date.now()}-${fileName}`;
}

export async function uploadAgentIcon(agentId: string, file: File): Promise<string> {
  const storageRef = ref(storage, agentAssetPath(agentId, 'icon', file.name));
  await uploadBytes(storageRef, file);
  return getDownloadURL(storageRef);
}

export async function uploadAgentCoverImage(agentId: string, file: File): Promise<string> {
  const storageRef = ref(storage, agentAssetPath(agentId, 'cover', file.name));
  await uploadBytes(storageRef, file);
  return getDownloadURL(storageRef);
}

export async function uploadAgentScreenshot(agentId: string, file: File): Promise<string> {
  const storageRef = ref(storage, agentAssetPath(agentId, 'screenshots', file.name));
  await uploadBytes(storageRef, file);
  return getDownloadURL(storageRef);
}
