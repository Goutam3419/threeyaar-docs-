import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  sendPasswordResetEmail,
  confirmPasswordReset,
  verifyPasswordResetCode,
  sendEmailVerification,
  updateProfile,
  onAuthStateChanged,
  setPersistence,
  browserLocalPersistence,
  type User,
  type Unsubscribe,
} from 'firebase/auth';
import { auth } from './firebase';

const googleProvider = new GoogleAuthProvider();

/**
 * Ensures the auth session survives page reloads / browser restarts.
 * Call once, early (done in AuthContext on mount).
 */
export async function initAuthPersistence(): Promise<void> {
  await setPersistence(auth, browserLocalPersistence);
}

export async function signUpWithEmail(
  email: string,
  password: string,
  name: string
): Promise<User> {
  const credential = await createUserWithEmailAndPassword(auth, email, password);
  if (name) {
    await updateProfile(credential.user, { displayName: name });
  }
  await sendEmailVerification(credential.user);
  return credential.user;
}

export async function signInWithEmail(email: string, password: string): Promise<User> {
  const credential = await signInWithEmailAndPassword(auth, email, password);
  return credential.user;
}

export async function signInWithGoogle(): Promise<{ user: User; isNewUser: boolean }> {
  const result = await signInWithPopup(auth, googleProvider);
  const isNewUser =
    result.user.metadata.creationTime === result.user.metadata.lastSignInTime;
  return { user: result.user, isNewUser };
}

export async function logOut(): Promise<void> {
  await signOut(auth);
}

export async function requestPasswordReset(email: string): Promise<void> {
  await sendPasswordResetEmail(auth, email);
}

/**
 * Validates the `oobCode` Firebase puts in the password-reset email link,
 * then sets the new password. Used on the /auth/reset-password page.
 */
export async function verifyResetCode(oobCode: string): Promise<string> {
  // Returns the account email if the code is valid; throws otherwise.
  return verifyPasswordResetCode(auth, oobCode);
}

export async function confirmNewPassword(oobCode: string, newPassword: string): Promise<void> {
  await confirmPasswordReset(auth, oobCode, newPassword);
}

export async function resendVerificationEmail(user: User): Promise<void> {
  await sendEmailVerification(user);
}

export function subscribeToAuthChanges(callback: (user: User | null) => void): Unsubscribe {
  return onAuthStateChanged(auth, callback);
}
