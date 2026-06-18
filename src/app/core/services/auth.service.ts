import { Service, inject } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { AuthState } from '../state/auth.state';
import type {
  OAuthProvider,
  AuthError,
  AuthErrorCode,
  MfaEnrollment,
  MfaChallenge,
  Passkey,
} from '../models/auth.models';
import type { AuthError as SupabaseAuthError } from '@supabase/supabase-js';

@Service()
export class AuthService {
  private readonly supabase = inject(SupabaseService);
  private readonly authState = inject(AuthState);

  constructor() {
    this.setupAuthListener();
  }

  // ═══════════════════════════════════════════════════════════
  // Initialization
  // ═══════════════════════════════════════════════════════════

  /** Restore session on app startup */
  async initialize(): Promise<void> {
    try {
      const { data, error } = await this.supabase.client.auth.getSession();
      if (error) throw error;
      if (data.session) {
        this.authState.setSession(data.session);
        this.authState.setUser(data.session.user);
        await this.loadMfaFactors();
      }
    } catch {
      // Silent failure on init — user just isn't logged in
    } finally {
      this.authState.setInitialized(true);
    }
  }

  /** Listen for auth state changes (OAuth callbacks, token refresh, etc.) */
  private setupAuthListener(): void {
    this.supabase.client.auth.onAuthStateChange(async (event, session) => {
      this.authState.setSession(session);
      this.authState.setUser(session?.user ?? null);

      if (event === 'SIGNED_IN' && session) {
        await this.loadMfaFactors();
      }

      if (event === 'SIGNED_OUT') {
        this.authState.clearAuth();
      }
    });
  }

  // ═══════════════════════════════════════════════════════════
  // Email / Password
  // ═══════════════════════════════════════════════════════════

  async signUp(email: string, password: string, metadata?: Record<string, unknown>): Promise<boolean> {
    this.authState.setLoading(true);
    this.authState.setError(null);

    try {
      const { data, error } = await this.supabase.client.auth.signUp({
        email,
        password,
        options: { data: metadata },
      });

      if (error) {
        this.authState.setError(this.mapError(error));
        return false;
      }

      // If email confirmation is required, user won't have a session yet
      if (data.user && !data.session) {
        // Email verification pending
        return true;
      }

      return true;
    } catch (e) {
      this.authState.setError({ code: 'unknown', message: 'An unexpected error occurred' });
      return false;
    } finally {
      this.authState.setLoading(false);
    }
  }

  async signIn(email: string, password: string): Promise<'success' | 'mfa_required' | 'error'> {
    this.authState.setLoading(true);
    this.authState.setError(null);

    try {
      const { data, error } = await this.supabase.client.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        // Check if MFA is required
        if (error.message?.includes('MFA') || (error as any).status === 403) {
          // For MFA, we need to check assurance level
          const { data: aalData } = await this.supabase.client.auth.mfa.getAuthenticatorAssuranceLevel();
          if (aalData?.nextLevel === 'aal2' && aalData?.currentLevel === 'aal1') {
            const factors = aalData.currentAuthenticationMethods as any[];
            const totpFactor = factors.find((f) => f.method === 'totp');
            if (totpFactor) {
              this.authState.setPendingMfaFactorId(totpFactor.method as string);
            }
            return 'mfa_required';
          }
        }
        this.authState.setError(this.mapError(error));
        return 'error';
      }

      // Check if MFA is needed after successful password auth
      const { data: aalData } = await this.supabase.client.auth.mfa.getAuthenticatorAssuranceLevel();
      if (aalData?.nextLevel === 'aal2' && aalData?.currentLevel === 'aal1') {
        const factors = await this.listMfaFactors();
        const verifiedFactor = factors.find((f) => f.status === 'verified');
        if (verifiedFactor) {
          this.authState.setPendingMfaFactorId(verifiedFactor.id);
          return 'mfa_required';
        }
      }

      return 'success';
    } catch {
      this.authState.setError({ code: 'unknown', message: 'An unexpected error occurred' });
      return 'error';
    } finally {
      this.authState.setLoading(false);
    }
  }

  async signOut(): Promise<void> {
    this.authState.setLoading(true);
    try {
      await this.supabase.client.auth.signOut();
      this.authState.clearAuth();
    } finally {
      this.authState.setLoading(false);
    }
  }

  async resetPassword(email: string): Promise<boolean> {
    this.authState.setLoading(true);
    this.authState.setError(null);

    try {
      const { error } = await this.supabase.client.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/callback`,
      });

      if (error) {
        this.authState.setError(this.mapError(error));
        return false;
      }
      return true;
    } finally {
      this.authState.setLoading(false);
    }
  }

  async updatePassword(newPassword: string): Promise<boolean> {
    this.authState.setLoading(true);
    this.authState.setError(null);

    try {
      const { error } = await this.supabase.client.auth.updateUser({
        password: newPassword,
      });

      if (error) {
        this.authState.setError(this.mapError(error));
        return false;
      }
      return true;
    } finally {
      this.authState.setLoading(false);
    }
  }

  // ═══════════════════════════════════════════════════════════
  // OAuth / SSO
  // ═══════════════════════════════════════════════════════════

  async signInWithOAuth(provider: OAuthProvider): Promise<void> {
    this.authState.setLoading(true);
    this.authState.setError(null);

    try {
      const supabaseProvider = provider === 'azure' ? 'azure' : provider;
      const { error } = await this.supabase.client.auth.signInWithOAuth({
        provider: supabaseProvider as any,
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          ...(provider === 'azure' ? { scopes: 'openid profile email' } : {}),
        },
      });

      if (error) {
        this.authState.setError(this.mapError(error));
      }
    } finally {
      this.authState.setLoading(false);
    }
  }

  // ═══════════════════════════════════════════════════════════
  // MFA (TOTP)
  // ═══════════════════════════════════════════════════════════

  async enrollMfa(friendlyName?: string): Promise<MfaEnrollment | null> {
    this.authState.setError(null);

    try {
      const { data, error } = await this.supabase.client.auth.mfa.enroll({
        factorType: 'totp',
        friendlyName,
      });

      if (error) {
        this.authState.setError(this.mapError(error));
        return null;
      }

      return {
        factorId: data.id,
        qrCode: data.totp.qr_code,
        secret: data.totp.secret,
        uri: data.totp.uri,
      };
    } catch {
      this.authState.setError({ code: 'unknown', message: 'Failed to enroll MFA' });
      return null;
    }
  }

  async challengeMfa(factorId: string): Promise<MfaChallenge | null> {
    try {
      const { data, error } = await this.supabase.client.auth.mfa.challenge({
        factorId,
      });

      if (error) {
        this.authState.setError(this.mapError(error));
        return null;
      }

      return { factorId, challengeId: data.id };
    } catch {
      return null;
    }
  }

  async verifyMfa(factorId: string, challengeId: string, code: string): Promise<boolean> {
    this.authState.setLoading(true);
    this.authState.setError(null);

    try {
      const { error } = await this.supabase.client.auth.mfa.verify({
        factorId,
        challengeId,
        code,
      });

      if (error) {
        this.authState.setError({
          code: 'invalid_mfa_code',
          message: 'Invalid verification code. Please try again.',
        });
        return false;
      }

      this.authState.setPendingMfaFactorId(null);
      await this.loadMfaFactors();
      return true;
    } finally {
      this.authState.setLoading(false);
    }
  }

  async unenrollMfa(factorId: string): Promise<boolean> {
    try {
      const { error } = await this.supabase.client.auth.mfa.unenroll({
        factorId,
      });

      if (error) {
        this.authState.setError(this.mapError(error));
        return false;
      }

      await this.loadMfaFactors();
      return true;
    } catch {
      return false;
    }
  }

  async listMfaFactors() {
    const { data, error } = await this.supabase.client.auth.mfa.listFactors();
    if (error || !data) return [];
    const factors = data.totp || [];
    this.authState.setMfaFactors(factors);
    return factors;
  }

  private async loadMfaFactors(): Promise<void> {
    await this.listMfaFactors();
  }

  // ═══════════════════════════════════════════════════════════
  // Passkeys (WebAuthn) — Experimental
  // ═══════════════════════════════════════════════════════════

  async registerPasskey(): Promise<Passkey | null> {
    this.authState.setError(null);

    try {
      const client = this.supabase.client as any;
      if (!client.auth.registerPasskey) {
        this.authState.setError({
          code: 'passkey_not_supported',
          message: 'Passkey registration is not available. Please update the Supabase SDK.',
        });
        return null;
      }

      const { data, error } = await client.auth.registerPasskey();
      if (error) {
        this.authState.setError(this.mapError(error));
        return null;
      }

      const passkey: Passkey = {
        id: data.id,
        friendlyName: data.friendly_name,
        createdAt: data.created_at,
      };

      await this.loadPasskeys();
      return passkey;
    } catch {
      this.authState.setError({ code: 'passkey_not_supported', message: 'Passkey registration failed' });
      return null;
    }
  }

  async signInWithPasskey(): Promise<boolean> {
    this.authState.setLoading(true);
    this.authState.setError(null);

    try {
      const client = this.supabase.client as any;
      if (!client.auth.signInWithPasskey) {
        this.authState.setError({
          code: 'passkey_not_supported',
          message: 'Passkey sign-in is not available.',
        });
        return false;
      }

      const { error } = await client.auth.signInWithPasskey();
      if (error) {
        this.authState.setError(this.mapError(error));
        return false;
      }

      return true;
    } catch {
      this.authState.setError({ code: 'passkey_not_supported', message: 'Passkey sign-in failed' });
      return false;
    } finally {
      this.authState.setLoading(false);
    }
  }

  async listPasskeys(): Promise<Passkey[]> {
    try {
      const client = this.supabase.client as any;
      if (!client.auth.passkey?.list) return [];

      const { data, error } = await client.auth.passkey.list();
      if (error || !data) return [];

      const passkeys: Passkey[] = data.map((p: any) => ({
        id: p.id,
        friendlyName: p.friendly_name,
        createdAt: p.created_at,
      }));

      this.authState.setPasskeys(passkeys);
      return passkeys;
    } catch {
      return [];
    }
  }

  async deletePasskey(passkeyId: string): Promise<boolean> {
    try {
      const client = this.supabase.client as any;
      if (!client.auth.passkey?.delete) return false;

      const { error } = await client.auth.passkey.delete({ passkeyId });
      if (error) return false;

      await this.loadPasskeys();
      return true;
    } catch {
      return false;
    }
  }

  private async loadPasskeys(): Promise<void> {
    await this.listPasskeys();
  }

  // ═══════════════════════════════════════════════════════════
  // Error mapping
  // ═══════════════════════════════════════════════════════════

  private mapError(error: SupabaseAuthError | any): AuthError {
    const message = error?.message || 'An unknown error occurred';
    const status = error?.status;

    if (message.includes('Invalid login credentials') || message.includes('invalid_credentials')) {
      return { code: 'invalid_credentials', message: 'Invalid email or password.' };
    }
    if (message.includes('Email not confirmed') || message.includes('not confirmed')) {
      return { code: 'email_not_verified', message: 'Please verify your email address.' };
    }
    if (message.includes('already registered') || message.includes('already exists')) {
      return { code: 'user_exists', message: 'An account with this email already exists.' };
    }
    if (message.includes('weak_password') || message.includes('too short')) {
      return { code: 'weak_password', message: 'Password is too weak. Use at least 8 characters.' };
    }
    if (status === 429 || message.includes('rate_limit')) {
      return { code: 'rate_limited', message: 'Too many attempts. Please wait before trying again.' };
    }
    if (message.includes('MFA') || message.includes('mfa')) {
      return { code: 'mfa_required', message: 'Multi-factor authentication is required.' };
    }
    if (message.includes('network') || message.includes('fetch')) {
      return { code: 'network_error', message: 'Network error. Please check your connection.' };
    }

    return { code: 'unknown', message };
  }
}
