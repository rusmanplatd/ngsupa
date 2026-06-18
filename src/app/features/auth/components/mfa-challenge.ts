import { Component, inject, signal, computed, ElementRef, viewChildren } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { AuthState } from '../../../core/state/auth.state';
import { ButtonComponent } from '../../../shared/ui/button/button';
import { IconComponent } from '../../../shared/ui/icon/icon';

@Component({
  selector: 'app-mfa-challenge',
  imports: [ButtonComponent, IconComponent],
  template: `
    <div class="space-y-6">
      <div class="text-center">
        <div class="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-system-blue-light">
          <app-icon name="shield" [size]="24" class="text-system-blue" />
        </div>
        <h2 class="mt-4 text-xl font-bold text-[var(--text-primary)]">Two-Factor Authentication</h2>
        <p class="mt-1 text-sm text-[var(--text-secondary)]">
          Enter the 6-digit code from your authenticator app
        </p>
      </div>

      <!-- 6-digit code input -->
      <div class="flex justify-center gap-2">
        @for (i of [0,1,2,3,4,5]; track i) {
          <input
            #digitInput
            type="text"
            inputmode="numeric"
            maxlength="1"
            class="h-14 w-12 rounded-xl border border-[var(--border-default)] bg-[var(--surface-primary)] text-center text-xl font-bold text-[var(--text-primary)] outline-none transition-all duration-fast focus:border-system-blue focus:ring-2 focus:ring-[var(--focus-ring)]"
            [attr.aria-label]="'Digit ' + (i + 1) + ' of 6'"
            [value]="digits()[i] || ''"
            (input)="onDigitInput($event, i)"
            (keydown)="onKeyDown($event, i)"
            (paste)="onPaste($event)"
          />
        }
      </div>

      @if (authState.error(); as err) {
        <div class="rounded-lg bg-system-red-light p-3 text-center text-sm text-system-red" role="alert">
          {{ err.message }}
        </div>
      }

      <button
        appButton
        variant="filled"
        size="lg"
        class="w-full"
        [loading]="authState.loading()"
        [disabled]="code().length !== 6"
        (click)="onVerify()"
      >
        Verify
      </button>

      <button
        appButton
        variant="plain"
        class="w-full"
        (click)="onCancel()"
      >
        Cancel
      </button>
    </div>
  `,
})
export class MfaChallengeComponent {
  protected readonly authService = inject(AuthService);
  protected readonly authState = inject(AuthState);
  private readonly router = inject(Router);

  private readonly digitInputs = viewChildren<ElementRef<HTMLInputElement>>('digitInput');
  protected readonly digits = signal<string[]>([]);
  protected readonly code = computed(() => this.digits().join(''));

  protected onDigitInput(event: Event, index: number): void {
    const input = event.target as HTMLInputElement;
    const val = input.value.replace(/\D/g, '');

    const newDigits = [...this.digits()];
    newDigits[index] = val.slice(0, 1);
    this.digits.set(newDigits);

    // Auto-advance to next input
    if (val && index < 5) {
      const inputs = this.digitInputs();
      inputs[index + 1]?.nativeElement.focus();
    }

    // Auto-submit when all 6 digits entered
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

    if (pasted.length === 6) {
      this.onVerify();
    }
  }

  protected async onVerify(): Promise<void> {
    const factorId = this.authState.pendingMfaFactorId();
    if (!factorId || this.code().length !== 6) return;

    const challenge = await this.authService.challengeMfa(factorId);
    if (!challenge) return;

    const success = await this.authService.verifyMfa(
      challenge.factorId,
      challenge.challengeId,
      this.code()
    );

    if (success) {
      this.router.navigate(['/dashboard']);
    } else {
      // Clear digits on error
      this.digits.set([]);
      const inputs = this.digitInputs();
      inputs[0]?.nativeElement.focus();
    }
  }

  protected onCancel(): void {
    this.authState.setPendingMfaFactorId(null);
    this.authService.signOut();
  }
}
