import { inject } from '@angular/core';
import { Router, type CanActivateFn } from '@angular/router';
import { AuthState } from '../state/auth.state';
import { SupabaseService } from '../services/supabase.service';

/**
 * Ensures the authenticated user has completed MFA (AAL2) when they have
 * a verified TOTP factor enrolled. If they are at AAL1 only, they are
 * redirected to the /auth/mfa challenge page.
 *
 * Short-circuits to `true` when:
 * - The user has no verified TOTP factor (not yet enrolled — don't force MFA)
 * - The user is already at AAL2 (challenge already completed this session)
 */
export const mfaGuard: CanActivateFn = async (route) => {
  const authState = inject(AuthState);
  const supabase = inject(SupabaseService);
  const router = inject(Router);

  // Must be authenticated first
  if (!authState.isAuthenticated()) {
    return router.createUrlTree(['/auth']);
  }

  // If the user has no verified TOTP factor, MFA is not required yet
  const hasVerifiedFactor = authState.mfaFactors().some((f) => f.status === 'verified');
  if (!hasVerifiedFactor) {
    return true;
  }

  const { data } = await supabase.client.auth.mfa.getAuthenticatorAssuranceLevel();

  // If next required level is aal2 but current is only aal1, redirect to MFA
  if (data?.nextLevel === 'aal2' && data?.currentLevel === 'aal1') {
    // Preserve intended destination so we can redirect after MFA succeeds
    const returnUrl = route.url.map((s) => s.path).join('/') || '/';
    return router.createUrlTree(['/auth/mfa'], {
      queryParams: { returnUrl: '/' + returnUrl },
    });
  }

  return true;
};
