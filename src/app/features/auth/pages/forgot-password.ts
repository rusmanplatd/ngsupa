import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { AuthState } from '../../../core/state/auth.state';
import { InputComponent } from '../../../shared/ui/input/input';
import { ButtonComponent } from '../../../shared/ui/button/button';
import { IconComponent } from '../../../shared/ui/icon/icon';

@Component({
  selector: 'app-forgot-password',
  imports: [RouterLink, InputComponent, ButtonComponent, IconComponent],
  template: `
    @if (sent()) {
      <div class="space-y-6 text-center">
        <div class="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-system-blue-light">
          <app-icon name="mail" [size]="28" class="text-system-blue" />
        </div>
        <div>
          <h2 class="text-xl font-bold text-[var(--text-primary)]">Check Your Email</h2>
          <p class="mt-2 text-sm text-[var(--text-secondary)]">
            If an account exists for <strong>{{ email() }}</strong>, we've sent a password reset link.
          </p>
        </div>
        <a routerLink="/auth/sign-in" appButton variant="tinted" class="inline-flex">
          Back to Sign In
        </a>
      </div>
    } @else {
      <div class="space-y-6">
        <div class="text-center">
          <h1 class="text-2xl font-bold text-[var(--text-primary)]">Reset Password</h1>
          <p class="mt-1 text-sm text-[var(--text-secondary)]">
            Enter your email and we'll send you a reset link
          </p>
        </div>

        <form (submit)="$event.preventDefault(); onReset()" class="space-y-4">
          <app-input
            label="Email"
            type="email"
            leadingIcon="mail"
            autocomplete="email"
            [inputId]="'forgot-email'"
            [value]="email()"
            (valueChange)="email.set($event)"
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
            [disabled]="!email()"
          >
            Send Reset Link
          </button>
        </form>

        <p class="text-center text-sm text-[var(--text-secondary)]">
          Remember your password?
          <a routerLink="/auth/sign-in" class="text-system-blue hover:underline">Sign in</a>
        </p>
      </div>
    }
  `,
})
export class ForgotPasswordComponent {
  protected readonly authService = inject(AuthService);
  protected readonly authState = inject(AuthState);

  protected readonly email = signal('');
  protected readonly sent = signal(false);

  protected async onReset(): Promise<void> {
    const success = await this.authService.resetPassword(this.email());
    if (success) {
      this.sent.set(true);
    }
  }
}
