import type { User } from 'firebase/auth';
import {
  signUpWithEmail,
  signInWithEmail,
  signInWithGoogle,
  logOut,
  requestPasswordReset,
  verifyResetCode,
  confirmNewPassword,
  resendVerificationEmail,
} from '@/lib/firebase/auth';
import {
  createUserProfileDoc,
  getUserProfileDoc,
  createWorkspaceDoc,
} from '@/lib/firebase/firestore';
import { buildNewUserProfile } from '@/models/userModel';
import { buildNewWorkspace } from '@/models/workspaceModel';
import type { UserProfile } from '@/types/user';

export interface RegisterInput {
  name: string;
  email: string;
  password: string;
}

/**
 * Full sign-up flow: creates the Firebase Auth account, sends the
 * verification email, then creates the matching Firestore `users` and
 * `workspaces` documents. If the Firestore writes fail, the auth account
 * still exists — the profile will be created on next login via
 * `ensureUserProfileExists` below, so no one gets stuck without a document.
 */
export async function registerUser({ name, email, password }: RegisterInput): Promise<{
  user: User;
  profile: UserProfile;
}> {
  const user = await signUpWithEmail(email, password, name);
  const profile = buildNewUserProfile(
    { uid: user.uid, email: user.email, displayName: name, photoURL: user.photoURL },
    { workspaceId: user.uid }
  );
  await createUserProfileDoc(profile);
  await createWorkspaceDoc(buildNewWorkspace(user.uid, `${name}'s Workspace`));
  return { user, profile };
}

export async function loginUser(email: string, password: string): Promise<User> {
  return signInWithEmail(email, password);
}

/**
 * Google sign-in. If this is the person's first time (no Firestore profile
 * yet), a `users` + `workspaces` document is created automatically, same as
 * the email/password flow.
 */
export async function loginWithGoogle(): Promise<{ user: User; profile: UserProfile }> {
  const { user } = await signInWithGoogle();
  const profile = await ensureUserProfileExists(user);
  return { user, profile };
}

/**
 * Guarantees a Firestore profile exists for a given Firebase Auth user.
 * Safe to call on every login — it's a no-op if the profile is already there.
 */
export async function ensureUserProfileExists(user: User): Promise<UserProfile> {
  const existing = await getUserProfileDoc(user.uid);
  if (existing) return existing;

  const profile = buildNewUserProfile({
    uid: user.uid,
    email: user.email,
    displayName: user.displayName,
    photoURL: user.photoURL,
  });
  await createUserProfileDoc(profile);
  await createWorkspaceDoc(buildNewWorkspace(user.uid, `${profile.name || 'My'}'s Workspace`));
  return profile;
}

export async function logoutUser(): Promise<void> {
  await logOut();
}

export async function sendPasswordResetEmail(email: string): Promise<void> {
  await requestPasswordReset(email);
}

export async function checkResetCode(oobCode: string): Promise<string> {
  return verifyResetCode(oobCode);
}

export async function resetPassword(oobCode: string, newPassword: string): Promise<void> {
  await confirmNewPassword(oobCode, newPassword);
}

export async function resendVerification(user: User): Promise<void> {
  await resendVerificationEmail(user);
}
