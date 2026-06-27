import { Component, inject, signal, computed, effect, ElementRef, viewChildren } from '@angular/core';
import { Router } from '@angular/router';
import { TitleCasePipe } from '@angular/common';
import { AuthState } from '../../../core/state/auth.state';
import { AuthService } from '../../../core/services/auth.service';
import { ThemeState, ThemePreference } from '../../../core/state/theme.state';
import { UiState } from '../../../core/state/ui.state';
import { PushNotificationService } from '../../../core/services/push-notification.service';
import { NavBarComponent } from '../../../shared/ui/nav-bar/nav-bar';
import { ListComponent, ListItemComponent } from '../../../shared/ui/list/list';
import { SegmentedControlComponent, SegmentOption } from '../../../shared/ui/segmented-control/segmented-control';
import { ToggleComponent } from '../../../shared/ui/toggle/toggle';
import { ButtonComponent } from '../../../shared/ui/button/button';
import { InputComponent } from '../../../shared/ui/input/input';
import { CardComponent } from '../../../shared/ui/card/card';
import { LucideDynamicIcon } from '@lucide/angular';
import { SidebarComponent } from '../../dashboard/components/sidebar';
import { TabBarComponent, Tab } from '../../../shared/ui/tab-bar/tab-bar';
import { ToastService } from '../../../shared/ui/toast/toast';
import type { MfaEnrollment } from '../../../core/models/auth.models';

@Component({
  selector: 'app-settings',
  imports: [
    NavBarComponent,
    ListComponent,
    ListItemComponent,
    SegmentedControlComponent,
    ToggleComponent,
    ButtonComponent,
    InputComponent,
    CardComponent,
    LucideDynamicIcon,
    SidebarComponent,
    TabBarComponent,
    TitleCasePipe,
  ],
  template: `
    <div class="flex min-h-dvh bg-[var(--surface-grouped)]">
      <app-sidebar class="contents" />

      <div class="flex-1 flex flex-col min-w-0">
        <app-nav-bar title="Settings">
          @if (uiState.isMobile()) {
            <button nav-leading type="button" class="rounded-md p-1 text-system-blue" aria-label="Back" (click)="router.navigate(['/dashboard'])">
              <svg lucideIcon="arrow-left" [size]="22" />
            </button>
          }
        </app-nav-bar>

        <main class="flex-1 px-5 pb-24 md:pb-8 mx-auto w-full max-w-2xl space-y-6">

          <!-- Security / MFA — shown FIRST so it's always immediately visible -->

          <div class="space-y-3">
            <h2 class="px-1 text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">Security</h2>

            @switch (mfaViewState()) {

              <!-- ── State: Not enrolled ── -->
              @case ('idle') {
                <app-card variant="outlined">
                  <div class="flex items-start gap-4">
                    <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-system-indigo-light">
                      <svg lucideIcon="shield" [size]="20" class="text-system-indigo" />
                    </div>
                    <div class="flex-1 min-w-0">
                      <p class="text-sm font-semibold text-[var(--text-primary)]">Two-Factor Authentication</p>
                      <p class="mt-0.5 text-xs text-[var(--text-tertiary)] leading-relaxed">
                        Add an extra layer of security by requiring a code from your authenticator app at sign in.
                      </p>
                      <button
                        appButton
                        variant="tinted"
                        size="sm"
                        class="mt-3"
                        [loading]="mfaLoading()"
                        (click)="onStartEnroll()"
                      >
                        <svg lucideIcon="plus" [size]="14" />
                        Enable 2FA
                      </button>
                    </div>
                  </div>
                </app-card>
              }

              <!-- ── State: Enrolling (QR + verify) ── -->
              @case ('enrolling') {
                <app-card variant="outlined" padding="lg">
                  <div class="space-y-5">

                    <!-- Header -->
                    <div class="flex items-center gap-3">
                      <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-system-indigo-light">
                        <svg lucideIcon="scan-qr-code" [size]="20" class="text-system-indigo" />
                      </div>
                      <div>
                        <p class="text-sm font-semibold text-[var(--text-primary)]">Set up Authenticator App</p>
                        <p class="text-xs text-[var(--text-tertiary)]">Scan the QR code or enter the key manually</p>
                      </div>
                    </div>

                    <!-- Steps panel -->
                    <div class="rounded-xl border border-[var(--border-default)] divide-y divide-[var(--separator)] overflow-hidden">

                      <!-- Step 1: QR Code -->
                      <div class="bg-[var(--surface-primary)] p-4 space-y-3">
                        <p class="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">Step 1 — Scan QR Code</p>
                        <div class="flex flex-col sm:flex-row items-center gap-4">
                          @if (enrollment()?.qrCode) {
                            <div class="flex-shrink-0 rounded-xl overflow-hidden border border-[var(--border-default)] p-2 bg-white">
                              <img
                                [src]="enrollment()!.qrCode"
                                alt="MFA QR Code — scan with your authenticator app"
                                width="140"
                                height="140"
                                class="block"
                              />
                            </div>
                          }
                          <div class="flex-1 space-y-2 w-full">
                            <p class="text-xs text-[var(--text-secondary)]">
                              Open your authenticator app (Google Authenticator, Authy, 1Password, etc.) and scan this QR code.
                            </p>
                            @if (enrollment()?.secret) {
                              <div>
                                <p class="text-2xs font-medium text-[var(--text-tertiary)] uppercase tracking-wider mb-1">Manual entry key</p>
                                <div class="flex items-center gap-2 rounded-lg bg-[var(--fill-primary)] border border-[var(--border-default)] px-3 py-2">
                                  <code class="flex-1 text-xs font-mono text-[var(--text-primary)] break-all select-all">{{ enrollment()!.secret }}</code>
                                  <button
                                    type="button"
                                    class="shrink-0 rounded-md p-1 text-[var(--text-tertiary)] hover:text-system-blue hover:bg-[var(--fill-secondary)] transition-colors"
                                    aria-label="Copy secret key"
                                    (click)="onCopySecret()"
                                  >
                                    <svg [lucideIcon]="secretCopied() ? 'check' : 'copy'" [size]="14" [class]="secretCopied() ? 'text-system-green' : ''" />
                                  </button>
                                </div>
                              </div>
                            }
                          </div>
                        </div>
                      </div>

                      <!-- Step 2: Verify -->
                      <div class="bg-[var(--surface-primary)] p-4 space-y-3">
                        <p class="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">Step 2 — Enter Verification Code</p>
                        <p class="text-xs text-[var(--text-tertiary)]">Enter the 6-digit code shown in your authenticator app to confirm setup.</p>

                        <!-- OTP digit inputs -->
                        <div class="flex gap-2" role="group" aria-label="Verification code">
                          @for (i of [0,1,2,3,4,5]; track i) {
                            <input
                              #enrollDigit
                              type="text"
                              inputmode="numeric"
                              maxlength="1"
                              autocomplete="one-time-code"
                              class="h-12 w-10 rounded-xl border border-[var(--border-default)] bg-[var(--surface-primary)] text-center text-lg font-bold text-[var(--text-primary)] outline-none transition-all duration-fast focus:border-system-blue focus:ring-2 focus:ring-[var(--focus-ring)] caret-transparent"
                              [class]="enrollDigits()[i] ? 'border-system-blue bg-system-blue-light' : ''"
                              [attr.aria-label]="'Digit ' + (i + 1) + ' of 6'"
                              [value]="enrollDigits()[i] || ''"
                              (input)="onEnrollDigitInput($event, i)"
                              (keydown)="onEnrollKeyDown($event, i)"
                              (paste)="onEnrollPaste($event)"
                            />
                          }
                        </div>

                        @if (mfaError()) {
                          <div class="rounded-lg bg-system-red-light p-2.5 text-xs text-system-red flex items-center gap-2" role="alert">
                            <svg lucideIcon="alert-circle" [size]="13" class="shrink-0" />
                            {{ mfaError() }}
                          </div>
                        }
                      </div>
                    </div>

                    <!-- Actions -->
                    <div class="flex gap-2">
                      <button
                        appButton
                        variant="filled"
                        [loading]="mfaLoading()"
                        [disabled]="enrollCode().length !== 6"
                        (click)="onVerifyEnroll()"
                      >
                        <svg lucideIcon="shield-check" [size]="15" />
                        Verify &amp; Enable
                      </button>
                      <button appButton variant="plain" [disabled]="mfaLoading()" (click)="onCancelEnroll()">
                        Cancel
                      </button>
                    </div>

                  </div>
                </app-card>
              }

              <!-- ── State: Enrolled & active ── -->
              @case ('enrolled') {
                <app-card variant="outlined">
                  <div class="flex items-start gap-4">
                    <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-system-green-light">
                      <svg lucideIcon="shield-check" [size]="20" class="text-system-green" />
                    </div>
                    <div class="flex-1 min-w-0">
                      <div class="flex items-center gap-2 flex-wrap">
                        <p class="text-sm font-semibold text-[var(--text-primary)]">Two-Factor Authentication</p>
                        <span class="inline-flex items-center gap-1 rounded-full bg-system-green-light px-2 py-0.5 text-2xs font-semibold text-system-green ring-1 ring-system-green/20">
                          <svg lucideIcon="check" [size]="10" />
                          Active
                        </span>
                      </div>
                      <p class="mt-0.5 text-xs text-[var(--text-tertiary)]">
                        Your account is protected with an authenticator app.
                      </p>

                      <!-- Unenroll confirmation -->
                      @if (confirmingRemove()) {
                        <div class="mt-3 rounded-xl border border-system-red/30 bg-system-red-light p-3 space-y-2">
                          <p class="text-xs font-medium text-system-red">Remove 2FA protection?</p>
                          <p class="text-xs text-system-red/80">Your account will be less secure without two-factor authentication.</p>
                          <div class="flex gap-2 mt-1">
                            <button appButton variant="destructive" size="sm" [loading]="mfaLoading()" (click)="onConfirmRemove()">
                              Remove
                            </button>
                            <button appButton variant="plain" size="sm" [disabled]="mfaLoading()" (click)="confirmingRemove.set(false)">
                              Keep 2FA
                            </button>
                          </div>
                        </div>
                      } @else {
                        <button
                          appButton
                          variant="plain"
                          size="sm"
                          class="mt-3 text-system-red hover:bg-system-red-light"
                          (click)="confirmingRemove.set(true)"
                        >
                          <svg lucideIcon="trash-2" [size]="13" />
                          Remove 2FA
                        </button>
                      }
                    </div>
                  </div>
                </app-card>
              }
            }
          </div>

          <!-- Appearance -->
          <div class="space-y-3">
            <h2 class="px-1 text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">Appearance</h2>
            <app-card variant="outlined">
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-3">
                  <div class="flex h-10 w-10 items-center justify-center rounded-xl bg-system-purple-light">
                    <svg [lucideIcon]="themeState.isDark() ? 'moon' : 'sun'" [size]="20" class="text-system-purple" />
                  </div>
                  <div>
                    <p class="text-sm font-medium text-[var(--text-primary)]">Theme</p>
                    <p class="text-xs text-[var(--text-tertiary)]">{{ themeState.resolvedTheme() | titlecase }} mode active</p>
                  </div>
                </div>
                <app-segmented-control
                  [options]="themeOptions"
                  [(value)]="themeValue"
                  ariaLabel="Theme preference"
                />
              </div>
            </app-card>
          </div>

          <!-- Notifications -->
          <div class="space-y-3">
            <h2 class="px-1 text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">Notifications</h2>
            <app-card variant="outlined">
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-3">
                  <div class="flex h-10 w-10 items-center justify-center rounded-xl bg-system-orange-light">
                    <svg lucideIcon="bell" [size]="20" class="text-system-orange" />
                  </div>
                  <div>
                    <p class="text-sm font-medium text-[var(--text-primary)]">Push Notifications</p>
                    <p class="text-xs text-[var(--text-tertiary)]">
                      {{ pushService.permissionGranted() ? 'Enabled' : 'Disabled' }}
                    </p>
                  </div>
                </div>
                <app-toggle
                  [(checked)]="pushEnabled"
                  ariaLabel="Toggle push notifications"
                />
              </div>
            </app-card>
          </div>

          <!-- Account -->
          <div class="space-y-3">
            <h2 class="px-1 text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">Account</h2>


            <!-- Change Password -->
            @if (!changingPassword()) {
              <app-list>
                <app-list-item
                  label="Change Password"
                  leadingIcon="lock"
                  [showChevron]="true"
                  (pressed)="changingPassword.set(true)"
                />
                <app-list-item
                  label="Sign Out"
                  leadingIcon="log-out"
                  (pressed)="onSignOut()"
                />
                <app-list-item
                  label="Delete Account"
                  leadingIcon="trash"
                  [destructive]="true"
                  [last]="true"
                  (pressed)="onDeleteAccount()"
                />
              </app-list>
            } @else {
              <app-card variant="outlined">
                <div class="space-y-4">
                  <h3 class="text-base font-semibold text-[var(--text-primary)]">Change Password</h3>
                  <app-input
                    label="New password"
                    type="password"
                    [inputId]="'new-password'"
                    [value]="newPassword()"
                    (valueChange)="newPassword.set($event)"
                    hint="At least 8 characters"
                  />
                  <app-input
                    label="Confirm new password"
                    type="password"
                    [inputId]="'confirm-new-password'"
                    [value]="confirmNewPassword()"
                    (valueChange)="confirmNewPassword.set($event)"
                    [error]="newPassword() && confirmNewPassword() && newPassword() !== confirmNewPassword() ? 'Passwords do not match' : null"
                  />
                  @if (authState.error(); as err) {
                    <p class="text-sm text-system-red" role="alert">{{ err.message }}</p>
                  }
                  <div class="flex gap-2">
                    <button appButton variant="filled" [loading]="authState.loading()" [disabled]="!canChangePassword()" (click)="onChangePassword()">
                      Update Password
                    </button>
                    <button appButton variant="plain" (click)="changingPassword.set(false)">Cancel</button>
                  </div>
                </div>
              </app-card>
            }
          </div>

        </main>
      </div>
    </div>

    @if (uiState.showTabBar()) {
      <app-tab-bar [tabs]="tabs" [(activeTab)]="activeTab" (tabPressed)="onTabPress($event)" />
    }
  `,
})
export class SettingsComponent {
  protected readonly authState = inject(AuthState);
  protected readonly authService = inject(AuthService);
  protected readonly themeState = inject(ThemeState);
  protected readonly uiState = inject(UiState);
  protected readonly pushService = inject(PushNotificationService);
  protected readonly router = inject(Router);
  private readonly toastService = inject(ToastService);

  // ── Password change ──────────────────────────────────────
  protected readonly changingPassword = signal(false);
  protected readonly newPassword = signal('');
  protected readonly confirmNewPassword = signal('');

  // ── Push notifications ───────────────────────────────────
  protected pushEnabled = signal(false);

  // ── Theme ────────────────────────────────────────────────
  protected readonly themeOptions: SegmentOption[] = [
    { value: 'light', label: '☀️' },
    { value: 'system', label: '💻' },
    { value: 'dark', label: '🌙' },
  ];
  protected themeValue = signal<string>(this.themeState.preference());

  // ── Tab bar ──────────────────────────────────────────────
  protected activeTab = 'settings';
  protected readonly tabs: Tab[] = [
    { id: 'dashboard', label: 'Home', icon: 'home', route: '/dashboard' },
    { id: 'profile', label: 'Profile', icon: 'user', route: '/profile' },
    { id: 'settings', label: 'Settings', icon: 'settings', route: '/settings' },
  ];

  // ── MFA state ────────────────────────────────────────────
  protected readonly enrollment = signal<MfaEnrollment | null>(null);
  protected readonly mfaLoading = signal(false);
  protected readonly mfaError = signal<string | null>(null);
  protected readonly confirmingRemove = signal(false);
  protected readonly secretCopied = signal(false);

  /** Derived view state: 'idle' | 'enrolling' | 'enrolled' */
  protected readonly mfaViewState = computed<'idle' | 'enrolling' | 'enrolled'>(() => {
    if (this.enrollment()) return 'enrolling';
    if (this.authState.hasMfa()) return 'enrolled';
    return 'idle';
  });

  // OTP digit inputs for enrollment
  private readonly enrollDigitInputs = viewChildren<ElementRef<HTMLInputElement>>('enrollDigit');
  protected readonly enrollDigits = signal<string[]>([]);
  protected readonly enrollCode = computed(() => this.enrollDigits().join(''));

  constructor() {
    this.pushEnabled.set(this.pushService.permissionGranted());

    // Sync theme segmented control to ThemeState
    effect(() => {
      const val = this.themeValue() as ThemePreference;
      this.themeState.setTheme(val);
    });
  }

  // ── Password ─────────────────────────────────────────────

  protected canChangePassword(): boolean {
    return (
      !!this.newPassword() &&
      this.newPassword().length >= 8 &&
      this.newPassword() === this.confirmNewPassword()
    );
  }

  protected async onChangePassword(): Promise<void> {
    const success = await this.authService.updatePassword(this.newPassword());
    if (success) {
      this.changingPassword.set(false);
      this.newPassword.set('');
      this.confirmNewPassword.set('');
      this.toastService.success('Password updated successfully');
    }
  }

  protected async onSignOut(): Promise<void> {
    await this.pushService.unregisterToken();
    await this.authService.signOut();
    this.router.navigate(['/auth']);
  }

  protected onDeleteAccount(): void {
    this.toastService.warning('Account deletion requires server-side implementation via Edge Functions.');
  }

  protected async onTogglePush(): Promise<void> {
    if (this.pushEnabled()) {
      const granted = await this.pushService.requestPermission();
      if (granted) {
        const userId = this.authState.user()?.id;
        if (userId) await this.pushService.registerToken(userId);
        this.toastService.success('Push notifications enabled');
      } else {
        this.pushEnabled.set(false);
        this.toastService.error('Notification permission denied');
      }
    } else {
      await this.pushService.unregisterToken();
      this.toastService.info('Push notifications disabled');
    }
  }

  protected onTabPress(tab: Tab): void {
    if (tab.route) this.router.navigate([tab.route]);
  }

  // ── MFA Enrollment ───────────────────────────────────────

  protected async onStartEnroll(): Promise<void> {
    this.mfaError.set(null);
    this.mfaLoading.set(true);
    try {
      // Supabase enforces name uniqueness across ALL factor types.
      // Use listAllMfaFactors (data.all) to find and remove any stale
      // unverified factors — not just TOTP — before starting fresh.
      const allFactors = await this.authService.listAllMfaFactors();
      const staleFactors = allFactors.filter((f) => f.status !== 'verified');
      for (const stale of staleFactors) {
        await this.authService.unenrollMfa(stale.id);
      }

      // Use a unique name to guarantee no name conflict on re-enrollment.
      const uniqueName = `Authenticator App ${Date.now()}`;
      const result = await this.authService.enrollMfa(uniqueName);
      if (result) {
        this.enrollment.set(result);
        this.enrollDigits.set([]);
      } else {
        this.mfaError.set('Failed to start 2FA setup. Please try again.');
      }
    } finally {
      this.mfaLoading.set(false);
    }
  }

  protected async onVerifyEnroll(): Promise<void> {
    const enroll = this.enrollment();
    if (!enroll || this.enrollCode().length !== 6) return;

    this.mfaError.set(null);
    this.mfaLoading.set(true);
    try {
      const challenge = await this.authService.challengeMfa(enroll.factorId);
      if (!challenge) {
        this.mfaError.set('Failed to create challenge. Please try again.');
        return;
      }

      const success = await this.authService.verifyMfa(
        challenge.factorId,
        challenge.challengeId,
        this.enrollCode()
      );

      if (success) {
        this.enrollment.set(null);
        this.enrollDigits.set([]);
        this.toastService.success('Two-factor authentication enabled');
      } else {
        this.mfaError.set('Invalid code. Please check your authenticator app and try again.');
        this.enrollDigits.set([]);
        this.enrollDigitInputs()[0]?.nativeElement.focus();
      }
    } finally {
      this.mfaLoading.set(false);
    }
  }

  protected async onCancelEnroll(): Promise<void> {
    // Clean up the unverified factor from Supabase
    const enroll = this.enrollment();
    if (enroll) await this.authService.unenrollMfa(enroll.factorId);
    this.enrollment.set(null);
    this.enrollDigits.set([]);
    this.mfaError.set(null);
  }

  protected async onCopySecret(): Promise<void> {
    const secret = this.enrollment()?.secret;
    if (!secret) return;
    try {
      await navigator.clipboard.writeText(secret);
      this.secretCopied.set(true);
      setTimeout(() => this.secretCopied.set(false), 2000);
    } catch {
      this.toastService.error('Could not copy to clipboard');
    }
  }

  // ── MFA Unenroll ─────────────────────────────────────────

  protected async onConfirmRemove(): Promise<void> {
    const factor = this.authState.mfaFactors().find((f) => f.status === 'verified');
    if (!factor) return;

    this.mfaLoading.set(true);
    try {
      const success = await this.authService.unenrollMfa(factor.id);
      if (success) {
        this.confirmingRemove.set(false);
        this.toastService.success('Two-factor authentication removed');
      } else {
        this.toastService.error('Failed to remove 2FA. Please try again.');
      }
    } finally {
      this.mfaLoading.set(false);
    }
  }

  // ── OTP digit input helpers (enrollment) ─────────────────

  protected onEnrollDigitInput(event: Event, index: number): void {
    const input = event.target as HTMLInputElement;
    const val = input.value.replace(/\D/g, '');

    const newDigits = [...this.enrollDigits()];
    newDigits[index] = val.slice(0, 1);
    this.enrollDigits.set(newDigits);

    if (val && index < 5) {
      this.enrollDigitInputs()[index + 1]?.nativeElement.focus();
    }
  }

  protected onEnrollKeyDown(event: KeyboardEvent, index: number): void {
    if (event.key === 'Backspace' && !this.enrollDigits()[index] && index > 0) {
      const inputs = this.enrollDigitInputs();
      inputs[index - 1]?.nativeElement.focus();
      const newDigits = [...this.enrollDigits()];
      newDigits[index - 1] = '';
      this.enrollDigits.set(newDigits);
    }
  }

  protected onEnrollPaste(event: ClipboardEvent): void {
    event.preventDefault();
    const pasted = event.clipboardData?.getData('text')?.replace(/\D/g, '').slice(0, 6);
    if (!pasted) return;
    const newDigits = pasted.split('');
    while (newDigits.length < 6) newDigits.push('');
    this.enrollDigits.set(newDigits);
    const inputs = this.enrollDigitInputs();
    inputs[Math.min(pasted.length, 5)]?.nativeElement.focus();
  }
}
