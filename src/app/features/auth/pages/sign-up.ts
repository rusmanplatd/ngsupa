import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { AuthState } from '../../../core/state/auth.state';
import { InputComponent } from '../../../shared/ui/input/input';
import { ButtonComponent } from '../../../shared/ui/button/button';
import { SsoButtonsComponent } from '../components/sso-buttons';
import { IconComponent } from '../../../shared/ui/icon/icon';

@Component({
  selector: 'app-sign-up',
  imports: [RouterLink, InputComponent, ButtonComponent, SsoButtonsComponent, IconComponent],
  template: `
    @if (signUpComplete()) {
      <!-- Email Verification Notice -->
      <div class="space-y-6 text-center">
        <div class="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-system-green-light">
          <app-icon name="mail" [size]="28" class="text-system-green" />
        </div>
        <div>
          <h2 class="text-xl font-bold text-[var(--text-primary)]">Check Your Email</h2>
          <p class="mt-2 text-sm text-[var(--text-secondary)]">
            We've sent a verification link to <strong>{{ email() }}</strong>.
            Please check your inbox and click the link to verify your account.
          </p>
        </div>
        <a routerLink="/auth/sign-in" appButton variant="tinted" class="inline-flex">
          Back to Sign In
        </a>
      </div>
    } @else {
      <div class="space-y-6">
        <div class="text-center">
          <h1 class="text-2xl font-bold text-[var(--text-primary)]">Create Account</h1>
          <p class="mt-1 text-sm text-[var(--text-secondary)]">Get started with your free account</p>
        </div>

        <app-sso-buttons />

        <div class="flex items-center gap-4">
          <div class="h-px flex-1 bg-[var(--separator)]"></div>
          <span class="text-xs font-medium text-[var(--text-tertiary)]">or continue with email</span>
          <div class="h-px flex-1 bg-[var(--separator)]"></div>
        </div>

        <form (submit)="$event.preventDefault(); onSignUp()" class="space-y-4">
          <app-input
            label="Full name"
            type="text"
            leadingIcon="user"
            autocomplete="name"
            [inputId]="'signup-name'"
            [value]="fullName()"
            (valueChange)="fullName.set($event)"
          />
          <app-input
            label="Email"
            type="email"
            leadingIcon="mail"
            autocomplete="email"
            [inputId]="'signup-email'"
            [value]="email()"
            (valueChange)="email.set($event)"
          />
          <app-input
            label="Password"
            type="password"
            leadingIcon="lock"
            autocomplete="new-password"
            [inputId]="'signup-password'"
            [value]="password()"
            (valueChange)="password.set($event)"
            [hint]="'At least 8 characters'"
          />
          <app-input
            label="Confirm password"
            type="password"
            leadingIcon="lock"
            autocomplete="new-password"
            [inputId]="'signup-confirm'"
            [value]="confirmPassword()"
            (valueChange)="confirmPassword.set($event)"
            [error]="passwordMismatch()"
          />

          <!-- Password strength indicator -->
          @if (password()) {
            <div class="space-y-1">
              <div class="flex gap-1">
                @for (i of [0,1,2,3]; track i) {
                  <div
                    class="h-1 flex-1 rounded-full transition-colors duration-fast"
                    [class]="i < passwordStrength()
                      ? strengthColors[passwordStrength() - 1]
                      : 'bg-[var(--fill-secondary)]'"
                  ></div>
                }
              </div>
              <p class="text-xs text-[var(--text-tertiary)]">{{ strengthLabels[passwordStrength()] }}</p>
            </div>
          }

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
            [disabled]="!canSubmit()"
          >
            Create Account
          </button>
        </form>

        <p class="text-center text-sm text-[var(--text-secondary)]">
          Already have an account?
          <a routerLink="/auth/sign-in" class="text-system-blue hover:underline">Sign in</a>
        </p>
      </div>
    }
  `,
})
export class SignUpComponent {
  protected readonly authService = inject(AuthService);
  protected readonly authState = inject(AuthState);

  protected readonly fullName = signal('');
  protected readonly email = signal('');
  protected readonly password = signal('');
  protected readonly confirmPassword = signal('');
  protected readonly signUpComplete = signal(false);

  protected readonly strengthColors = ['bg-system-red', 'bg-system-orange', 'bg-system-yellow', 'bg-system-green'];
  protected readonly strengthLabels: Record<number, string> = {
    0: '',
    1: 'Weak',
    2: 'Fair',
    3: 'Good',
    4: 'Strong',
  };

  protected passwordStrength(): number {
    const p = this.password();
    if (!p) return 0;
    let score = 0;
    if (p.length >= 8) score++;
    if (/[a-z]/.test(p) && /[A-Z]/.test(p)) score++;
    if (/\d/.test(p)) score++;
    if (/[^a-zA-Z\d]/.test(p)) score++;
    return score;
  }

  protected passwordMismatch(): string | null {
    const cp = this.confirmPassword();
    if (!cp) return null;
    return cp !== this.password() ? 'Passwords do not match' : null;
  }

  protected canSubmit(): boolean {
    return (
      !!this.email() &&
      !!this.password() &&
      this.password().length >= 8 &&
      this.password() === this.confirmPassword()
    );
  }

  protected async onSignUp(): Promise<void> {
    if (!this.canSubmit()) return;

    const success = await this.authService.signUp(this.email(), this.password(), {
      full_name: this.fullName(),
    });

    if (success) {
      this.signUpComplete.set(true);
    }
  }
}
