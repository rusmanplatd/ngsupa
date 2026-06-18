import { inject } from '@angular/core';
import { Router, type CanActivateFn } from '@angular/router';
import { AuthState } from '../state/auth.state';

export const authGuard: CanActivateFn = () => {
  const authState = inject(AuthState);
  const router = inject(Router);

  if (authState.isAuthenticated()) {
    return true;
  }

  return router.createUrlTree(['/auth']);
};
