export type UserRole = 'admin' | 'user';
export type SubscriptionTier = 'free' | 'starter' | 'growth' | 'enterprise';
export type AccountStatus = 'active' | 'suspended' | 'deleted';

/**
 * Shape of a document in the Firestore `users` collection.
 * Created automatically right after sign up (email/password or Google).
 */
export interface UserProfile {
  uid: string;
  name: string;
  email: string;
  photoURL: string;
  role: UserRole;
  company: string;
  createdAt: string; // ISO timestamp
  updatedAt: string; // ISO timestamp
  lastLogin: string; // ISO timestamp
  subscription: SubscriptionTier;
  workspaceId: string;
  status: AccountStatus;
}

export const DEFAULT_USER_PROFILE_FIELDS: Pick<
  UserProfile,
  'role' | 'subscription' | 'status' | 'company' | 'photoURL'
> = {
  role: 'user',
  subscription: 'free',
  status: 'active',
  company: '',
  photoURL: '',
};
