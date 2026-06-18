import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthState } from '../../../core/state/auth.state';
import { SpinnerComponent } from '../../../shared/ui/spinner/spinner';

@Component({
  selector: 'app-auth-callback',
  imports: [SpinnerComponent],
  template: `
    <div class="flex flex-col items-center justify-center gap-4 py-12">
      <app-spinner size="lg" />
      <p class="text-sm text-[var(--text-secondary)]">Completing sign in…</p>
    </div>
  `,
})
export class AuthCallbackComponent {
  private readonly router = inject(Router);
  private readonly authState = inject(AuthState);

  constructor() {
    // Supabase handles the OAuth callback via onAuthStateChange
    // We just wait for the auth state to be populated, then redirect
    const checkAuth = setInterval(() => {
      if (this.authState.isAuthenticated()) {
        clearInterval(checkAuth);
        this.router.navigate(['/dashboard']);
      }
    }, 200);

    // Timeout after 10 seconds
    setTimeout(() => {
      clearInterval(checkAuth);
      if (!this.authState.isAuthenticated()) {
        this.router.navigate(['/auth/sign-in']);
      }
    }, 10000);
  }
}
