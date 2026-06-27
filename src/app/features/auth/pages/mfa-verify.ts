import { Component, inject, signal, computed, ElementRef, viewChildren } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { AuthState } from '../../../core/state/auth.state';
import { ButtonComponent } from '../../../shared/ui/button/button';
import { LucideDynamicIcon } from '@lucide/angular';

@Component({
  selector: 'app-mfa-verify',
  imports: [ButtonComponent, LucideDynamicIcon],
  template: `
    <div class="flex min-h-dvh items-center justify-center bg-[var(--surface-grouped)] px-4">
      <div class="w-full max-w-sm">

        <!-- Card -->
        <div class="rounded-2xl bg-[var(--surface-primary)] border border-[var(--border-default)] shadow-lg p-8 space-y-6">

          <!-- Icon + heading -->
          <div class="text-center space-y-3">
            <div class="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-system-blue-light ring-4 ring-[var(--focus-ring)]">
              <svg lucideIcon="shield-check" [size]="28" class="text-system-blue" />
            </div>
            <div>
              <h1 class="text-xl font-bold text-[var(--text-primary)]">Two-Factor Authentication</h1>
              <p class="mt-1 text-sm text-[var(--text-secondary)]">
                Enter the 6-digit code from your authenticator app to continue
              </p>
            </div>
          </div>

          <!-- OTP digit inputs -->
          <div class="flex justify-center gap-2" role="group" aria-label="One-time password">
            @for (i of [0,1,2,3,4,5]; track i) {
              <input
                #digitInput
                type="text"
                inputmode="numeric"
                maxlength="1"
                autocomplete="one-time-code"
                class="h-14 w-12 rounded-xl border border-[var(--border-default)] bg-[var(--surface-primary)] text-center text-xl font-bold text-[var(--text-primary)] outline-none transition-all duration-fast focus:border-system-blue focus:ring-2 focus:ring-[var(--focus-ring)] caret-transparent"
                [class]="digits()[i] ? 'border-system-blue bg-system-blue-light' : ''"
                [attr.aria-label]="'Digit ' + (i + 1) + ' of 6'"
                [value]="digits()[i] || ''"
                (input)="onDigitInput($event, i)"
                (keydown)="onKeyDown($event, i)"
                (paste)="onPaste($event)"
              />
            }
          </div>

          <!-- Error -->
          @if (authState.error(); as err) {
            <div class="rounded-xl bg-system-red-light p-3 text-center text-sm text-system-red" role="alert">
              <svg lucideIcon="alert-circle" [size]="14" class="inline mr-1.5 -mt-0.5" />
              {{ err.message }}
            </div>
          }

          <!-- Verify button -->
          <button
            appButton
            variant="filled"
            size="lg"
            class="w-full"
            [loading]="authState.loading()"
            [disabled]="code().length !== 6"
            (click)="onVerify()"
          >
            Verify &amp; Continue
          </button>

          <!-- Sign-out link -->
          <div class="text-center">
            <button
              type="button"
              class="text-sm text-[var(--text-tertiary)] hover:text-system-red transition-colors"
              (click)="onSignOut()"
            >
              Sign out and try again
            </button>
          </div>
        </div>

      </div>
    </div>
  `,
})
export class MfaVerifyComponent {
  protected readonly authService = inject(AuthService);
  protected readonly authState = inject(AuthState);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  private readonly digitInputs = viewChildren<ElementRef<HTMLInputElement>>('digitInput');
  protected readonly digits = signal<string[]>([]);
  protected readonly code = computed(() => this.digits().join(''));

  constructor() {
    // Ensure factors are loaded when navigating directly to this page
    // (e.g. user arrives via mfaGuard redirect from /dashboard without sign-in flow)
    if (this.authState.mfaFactors().length === 0) {
      this.authService.listMfaFactors();
    }
  }

  protected onDigitInput(event: Event, index: number): void {
    const input = event.target as HTMLInputElement;
    const val = input.value.replace(/\D/g, '');

    const newDigits = [...this.digits()];
    newDigits[index] = val.slice(0, 1);
    this.digits.set(newDigits);

    if (val && index < 5) {
      this.digitInputs()[index + 1]?.nativeElement.focus();
    }
    if (this.code().length === 6) {
      this.onVerify();
    }
  }

  protected onKeyDown(event: KeyboardEvent, index: number): void {
    if (event.key === 'Backspace' && !this.digits()[index] && index > 0) {
      const inputs = this.digitInputs();
      inputs[index - 1]?.nativeElement.focus();
      const newDigits = [...this.digits()];
      newDigits[index - 1] = '';
      this.digits.set(newDigits);
    }
  }

  protected onPaste(event: ClipboardEvent): void {
    event.preventDefault();
    const pasted = event.clipboardData?.getData('text')?.replace(/\D/g, '').slice(0, 6);
    if (!pasted) return;

    const newDigits = pasted.split('');
    while (newDigits.length < 6) newDigits.push('');
    this.digits.set(newDigits);

    const inputs = this.digitInputs();
    const focusIdx = Math.min(pasted.length, 5);
    inputs[focusIdx]?.nativeElement.focus();

    if (pasted.length === 6) this.onVerify();
  }

  protected async onVerify(): Promise<void> {
    if (this.code().length !== 6) return;

    // Prefer the factor stored from the sign-in flow; fall back to the first
    // verified TOTP factor from the loaded list (covers direct navigation).
    const pendingId = this.authState.pendingMfaFactorId();
    const factors = this.authState.mfaFactors();
    const factor = pendingId
      ? (factors.find((f) => f.id === pendingId) ?? factors.find((f) => f.status === 'verified') ?? factors[0])
      : (factors.find((f) => f.status === 'verified') ?? factors[0]);

    if (!factor) return;

    const challenge = await this.authService.challengeMfa(factor.id);
    if (!challenge) return;

    const success = await this.authService.verifyMfa(
      challenge.factorId,
      challenge.challengeId,
      this.code()
    );

    if (success) {
      const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl') ?? '/dashboard';
      this.router.navigateByUrl(returnUrl);
    } else {
      this.digits.set([]);
      this.digitInputs()[0]?.nativeElement.focus();
    }
  }

  protected async onSignOut(): Promise<void> {
    await this.authService.signOut();
    this.router.navigate(['/auth']);
  }
}
