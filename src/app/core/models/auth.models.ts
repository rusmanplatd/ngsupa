import type { User, Session, Factor } from '@supabase/supabase-js';

/** OAuth providers supported by the app */
export type OAuthProvider = 'google' | 'azure' | 'facebook' | 'apple';

/** Typed auth error categories */
export type AuthErrorCode =
  | 'invalid_credentials'
  | 'email_not_verified'
  | 'mfa_required'
  | 'rate_limited'
  | 'weak_password'
  | 'user_exists'
  | 'passkey_not_supported'
  | 'invalid_mfa_code'
  | 'network_error'
  | 'unknown';

export interface AuthError {
  code: AuthErrorCode;
  message: string;
}

export interface MfaEnrollment {
  factorId: string;
  qrCode: string;
  secret: string;
  uri: string;
}

export interface MfaChallenge {
  factorId: string;
  challengeId: string;
}

export interface Passkey {
  id: string;
  friendlyName?: string;
  createdAt: string;
}

/** Re-export Supabase types for convenience */
export type { User, Session, Factor };
