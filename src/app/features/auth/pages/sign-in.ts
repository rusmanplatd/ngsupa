import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { AuthState } from '../../../core/state/auth.state';
import { InputComponent } from '../../../shared/ui/input/input';
import { ButtonComponent } from '../../../shared/ui/button/button';
import { SsoButtonsComponent } from '../components/sso-buttons';
import { MfaChallengeComponent } from '../components/mfa-challenge';
import { LucideDynamicIcon } from '@lucide/angular';

@Component({
  selector: 'app-sign-in',
  imports: [
    RouterLink,
    InputComponent,
    ButtonComponent,
    SsoButtonsComponent,
    MfaChallengeComponent,
    LucideDynamicIcon,
  ],
  template: `
    @if (authState.needsMfa()) {
      <app-mfa-challenge />
    } @else {
      <div class="space-y-6">
        <div class="text-center">
          <h1 class="text-2xl font-bold text-[var(--text-primary)]">Welcome Back</h1>
          <p class="mt-1 text-sm text-[var(--text-secondary)]">Sign in to your account</p>
        </div>

        <!-- SSO Buttons -->
        <app-sso-buttons />

        <!-- Divider -->
        <div class="flex items-center gap-4">
          <div class="h-px flex-1 bg-[var(--separator)]"></div>
          <span class="text-xs font-medium text-[var(--text-tertiary)]">or continue with email</span>
          <div class="h-px flex-1 bg-[var(--separator)]"></div>
        </div>

        <!-- Email/Password Form -->
        <form (submit)="$event.preventDefault(); onSignIn()" class="space-y-4">
          <app-input
            label="Email"
            type="email"
            leadingIcon="mail"
            autocomplete="email"
            [inputId]="'signin-email'"
            [value]="email()"
            (valueChange)="email.set($event)"
          />
          <app-input
            label="Password"
            type="password"
            leadingIcon="lock"
            autocomplete="current-password"
            [inputId]="'signin-password'"
            [value]="password()"
            (valueChange)="password.set($event)"
          />

          @if (authState.error(); as err) {
            <div class="rounded-lg bg-system-red-light p-3 text-sm text-system-red" role="alert">
              {{ err.message }}
            </div>
          }

          <button
            appButton
            variant="filled"
            size="lg"
            type="submit"
            class="w-full"
            [loading]="authState.loading()"
            [disabled]="!email() || !password()"
          >
            Sign In
          </button>
        </form>

        <!-- Passkey -->
        <button
          appButton
          variant="tinted"
          class="w-full"
          (click)="onPasskeySignIn()"
        >
          <svg lucideIcon="fingerprint" [size]="18" />
          Sign in with Passkey
        </button>

        <!-- Links -->
        <div class="flex items-center justify-between text-sm">
          <a routerLink="/auth/forgot-password" class="text-system-blue hover:underline">
            Forgot password?
          </a>
          <a routerLink="/auth/sign-up" class="text-system-blue hover:underline">
            Create account
          </a>
        </div>
      </div>
    }
  `,
})
export class SignInComponent {
  protected readonly authService = inject(AuthService);
  protected readonly authState = inject(AuthState);
  private readonly router = inject(Router);

  protected readonly email = signal('');
  protected readonly password = signal('');

  protected async onSignIn(): Promise<void> {
    const result = await this.authService.signIn(this.email(), this.password());
    if (result === 'success') {
      this.router.navigate(['/dashboard']);
    }
    // 'mfa_required' is handled by the template via authState.needsMfa()
  }

  protected async onPasskeySignIn(): Promise<void> {
    const success = await this.authService.signInWithPasskey();
    if (success) {
      this.router.navigate(['/dashboard']);
    }
  }
}
