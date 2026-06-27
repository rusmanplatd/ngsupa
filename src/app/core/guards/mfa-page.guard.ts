import { inject } from '@angular/core';
import { Router, type CanActivateFn } from '@angular/router';
import { AuthState } from '../state/auth.state';
import { SupabaseService } from '../services/supabase.service';

/**
 * Guard for the /auth/mfa route.
 *
 * - Unauthenticated users → /auth (they shouldn't be here at all)
 * - Already at AAL2 → returnUrl or /dashboard (challenge already done this session)
 * - At AAL1 with a verified factor → allow through to complete MFA
 */
export const mfaPageGuard: CanActivateFn = async (route) => {
  const authState = inject(AuthState);
  const supabase = inject(SupabaseService);
  const router = inject(Router);

  // Must be authenticated first
  if (!authState.isAuthenticated()) {
    return router.createUrlTree(['/auth']);
  }

  const { data } = await supabase.client.auth.mfa.getAuthenticatorAssuranceLevel();

  // If the user is already at AAL2, the challenge is complete — send them on
  if (data?.currentLevel === 'aal2') {
    const returnUrl = route.queryParamMap.get('returnUrl') ?? '/dashboard';
    return router.parseUrl(returnUrl);
  }

  return true;
};
