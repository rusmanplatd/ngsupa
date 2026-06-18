import { Service, signal, computed } from '@angular/core';
import type { User, Session, Factor } from '../../core/models/auth.models';
import type { AuthError, Passkey } from '../../core/models/auth.models';

@Service()
export class AuthState {
  // ── Private mutable signals ────────────────────────────────
  private readonly _user = signal<User | null>(null);
  private readonly _session = signal<Session | null>(null);
  private readonly _mfaFactors = signal<Factor[]>([]);
  private readonly _passkeys = signal<Passkey[]>([]);
  private readonly _loading = signal(false);
  private readonly _initialized = signal(false);
  private readonly _error = signal<AuthError | null>(null);
  private readonly _pendingMfaFactorId = signal<string | null>(null);

  // ── Public readonly signals ────────────────────────────────
  readonly user = this._user.asReadonly();
  readonly session = this._session.asReadonly();
  readonly mfaFactors = this._mfaFactors.asReadonly();
  readonly passkeys = this._passkeys.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly initialized = this._initialized.asReadonly();
  readonly error = this._error.asReadonly();
  readonly pendingMfaFactorId = this._pendingMfaFactorId.asReadonly();

  // ── Computed derived state ─────────────────────────────────
  readonly isAuthenticated = computed(() => !!this._session() && !!this._user());
  readonly displayName = computed(() => {
    const u = this._user();
    if (!u) return '';
    return (
      u.user_metadata?.['full_name'] ||
      u.user_metadata?.['name'] ||
      u.email?.split('@')[0] ||
      'User'
    );
  });
  readonly avatarUrl = computed(() => {
    const u = this._user();
    return u?.user_metadata?.['avatar_url'] || u?.user_metadata?.['picture'] || null;
  });
  readonly email = computed(() => this._user()?.email || '');
  readonly hasMfa = computed(() => this._mfaFactors().some((f) => f.status === 'verified'));
  readonly needsMfa = computed(() => !!this._pendingMfaFactorId());

  // ── Mutation methods ───────────────────────────────────────
  setUser(user: User | null): void {
    this._user.set(user);
  }

  setSession(session: Session | null): void {
    this._session.set(session);
  }

  setMfaFactors(factors: Factor[]): void {
    this._mfaFactors.set(factors);
  }

  setPasskeys(passkeys: Passkey[]): void {
    this._passkeys.set(passkeys);
  }

  setLoading(loading: boolean): void {
    this._loading.set(loading);
  }

  setInitialized(initialized: boolean): void {
    this._initialized.set(initialized);
  }

  setError(error: AuthError | null): void {
    this._error.set(error);
  }

  setPendingMfaFactorId(factorId: string | null): void {
    this._pendingMfaFactorId.set(factorId);
  }

  clearAuth(): void {
    this._user.set(null);
    this._session.set(null);
    this._mfaFactors.set([]);
    this._passkeys.set([]);
    this._error.set(null);
    this._pendingMfaFactorId.set(null);
  }
}
