import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { AuthState } from '../../../core/state/auth.state';
import { AuthService } from '../../../core/services/auth.service';
import { SupabaseService } from '../../../core/services/supabase.service';
import { UiState } from '../../../core/state/ui.state';
import { NavBarComponent } from '../../../shared/ui/nav-bar/nav-bar';
import { CardComponent } from '../../../shared/ui/card/card';
import { AvatarComponent } from '../../../shared/ui/avatar/avatar';
import { ButtonComponent } from '../../../shared/ui/button/button';
import { InputComponent } from '../../../shared/ui/input/input';
import { ListComponent, ListItemComponent } from '../../../shared/ui/list/list';
import { IconComponent } from '../../../shared/ui/icon/icon';
import { SidebarComponent } from '../../dashboard/components/sidebar';
import { TabBarComponent, Tab } from '../../../shared/ui/tab-bar/tab-bar';
import { ToastService } from '../../../shared/ui/toast/toast';
import type { MfaEnrollment } from '../../../core/models/auth.models';

@Component({
  selector: 'app-profile',
  imports: [
    NavBarComponent,
    CardComponent,
    AvatarComponent,
    ButtonComponent,
    InputComponent,
    ListComponent,
    ListItemComponent,
    IconComponent,
    SidebarComponent,
    TabBarComponent,
  ],
  template: `
    <div class="flex min-h-dvh bg-[var(--surface-grouped)]">
      @if (uiState.showSidebar()) {
        <app-sidebar />
      }

      <div class="flex-1 flex flex-col min-w-0">
        <app-nav-bar title="Profile">
          @if (uiState.isMobile()) {
            <button nav-leading type="button" class="rounded-md p-1 text-system-blue" aria-label="Back" (click)="router.navigate(['/dashboard'])">
              <app-icon name="arrow-left" [size]="22" />
            </button>
          }
        </app-nav-bar>

        <main class="flex-1 px-5 pb-24 md:pb-8 mx-auto w-full max-w-2xl space-y-6">

          <!-- User Info Card -->
          <app-card variant="elevated">
            <div class="flex flex-col items-center gap-4 py-4">
              <app-avatar
                size="xl"
                [name]="authState.displayName()"
                [src]="authState.avatarUrl()"
              />
              @if (!editing()) {
                <div class="text-center">
                  <h2 class="text-xl font-bold text-[var(--text-primary)]">{{ authState.displayName() }}</h2>
                  <p class="text-sm text-[var(--text-secondary)]">{{ authState.email() }}</p>
                </div>
                <button appButton variant="tinted" (click)="startEditing()">
                  <app-icon name="edit" [size]="16" />
                  Edit Profile
                </button>
              } @else {
                <div class="w-full max-w-sm space-y-3">
                  <app-input
                    label="Full name"
                    [value]="editName()"
                    (valueChange)="editName.set($event)"
                    [inputId]="'profile-name'"
                  />
                  <div class="flex gap-2 justify-center">
                    <button appButton variant="filled" (click)="saveProfile()">Save</button>
                    <button appButton variant="plain" (click)="editing.set(false)">Cancel</button>
                  </div>
                </div>
              }
            </div>
          </app-card>

          <!-- MFA Management -->
          <app-list header="Two-Factor Authentication">
            @if (authState.mfaFactors().length === 0) {
              <app-list-item
                label="Add Authenticator"
                subtitle="Protect your account with TOTP"
                leadingIcon="shield"
                [showChevron]="true"
                [last]="true"
                (pressed)="onEnrollMfa()"
              />
            } @else {
              @for (factor of authState.mfaFactors(); track factor.id; let last = $last) {
                <app-list-item
                  [label]="factor.friendly_name || 'Authenticator'"
                  [subtitle]="'Status: ' + factor.status"
                  leadingIcon="shield"
                  [last]="last && authState.mfaFactors().length > 0"
                >
                  @if (factor.status === 'verified') {
                    <button
                      type="button"
                      class="shrink-0 text-xs text-system-red hover:underline"
                      (click)="$event.stopPropagation(); onUnenrollMfa(factor.id)"
                    >
                      Remove
                    </button>
                  }
                </app-list-item>
              }
              <app-list-item
                label="Add Another"
                leadingIcon="plus"
                [last]="true"
                (pressed)="onEnrollMfa()"
              />
            }
          </app-list>

          <!-- MFA Enrollment QR -->
          @if (mfaEnrollment()) {
            <app-card variant="elevated">
              <div class="space-y-4 text-center">
                <h3 class="text-lg font-semibold text-[var(--text-primary)]">Scan QR Code</h3>
                <p class="text-sm text-[var(--text-secondary)]">
                  Scan this QR code with your authenticator app
                </p>
                <div class="mx-auto w-48 h-48 bg-white rounded-xl p-2 flex items-center justify-center">
                  <img [src]="mfaEnrollment()!.qrCode" alt="MFA QR Code" class="w-full h-full" />
                </div>
                <div class="space-y-1">
                  <p class="text-xs text-[var(--text-tertiary)]">Or enter this key manually:</p>
                  <code class="block rounded-lg bg-[var(--fill-secondary)] px-3 py-2 text-xs font-mono text-[var(--text-primary)] break-all">
                    {{ mfaEnrollment()!.secret }}
                  </code>
                </div>
                <div class="flex justify-center gap-2">
                  <button appButton variant="filled" (click)="onVerifyMfaEnrollment()">
                    I've scanned it
                  </button>
                  <button appButton variant="plain" (click)="mfaEnrollment.set(null)">
                    Cancel
                  </button>
                </div>
              </div>
            </app-card>
          }

          <!-- MFA Verify Code -->
          @if (verifyingMfa()) {
            <app-card variant="elevated">
              <div class="space-y-4">
                <h3 class="text-lg font-semibold text-[var(--text-primary)] text-center">Enter Verification Code</h3>
                <app-input
                  label="6-digit code"
                  type="text"
                  [inputId]="'mfa-verify-code'"
                  [value]="mfaCode()"
                  (valueChange)="mfaCode.set($event)"
                />
                @if (authState.error(); as err) {
                  <p class="text-sm text-system-red text-center" role="alert">{{ err.message }}</p>
                }
                <div class="flex justify-center gap-2">
                  <button appButton variant="filled" [loading]="authState.loading()" (click)="onConfirmMfa()">
                    Verify
                  </button>
                  <button appButton variant="plain" (click)="cancelMfaVerify()">Cancel</button>
                </div>
              </div>
            </app-card>
          }

          <!-- Passkeys Management -->
          <app-list header="Passkeys">
            @if (authState.passkeys().length === 0) {
              <app-list-item
                label="Add Passkey"
                subtitle="Sign in with biometrics or security key"
                leadingIcon="fingerprint"
                [showChevron]="true"
                [last]="true"
                (pressed)="onRegisterPasskey()"
              />
            } @else {
              @for (pk of authState.passkeys(); track pk.id; let last = $last) {
                <app-list-item
                  [label]="pk.friendlyName || 'Passkey'"
                  [subtitle]="'Added ' + pk.createdAt"
                  leadingIcon="fingerprint"
                  [last]="last && authState.passkeys().length > 0"
                >
                  <button
                    type="button"
                    class="shrink-0 text-xs text-system-red hover:underline"
                    (click)="$event.stopPropagation(); onDeletePasskey(pk.id)"
                  >
                    Remove
                  </button>
                </app-list-item>
              }
              <app-list-item
                label="Add Another Passkey"
                leadingIcon="plus"
                [last]="true"
                (pressed)="onRegisterPasskey()"
              />
            }
          </app-list>

        </main>
      </div>
    </div>

    @if (uiState.showTabBar()) {
      <app-tab-bar [tabs]="tabs" [(activeTab)]="activeTab" (tabPressed)="onTabPress($event)" />
    }
  `,
})
export class ProfileComponent {
  protected readonly authState = inject(AuthState);
  protected readonly authService = inject(AuthService);
  private readonly supabase = inject(SupabaseService);
  protected readonly uiState = inject(UiState);
  protected readonly router = inject(Router);
  private readonly toastService = inject(ToastService);

  protected readonly editing = signal(false);
  protected readonly editName = signal('');
  protected readonly mfaEnrollment = signal<MfaEnrollment | null>(null);
  protected readonly verifyingMfa = signal(false);
  protected readonly mfaCode = signal('');
  protected readonly pendingFactorId = signal<string | null>(null);

  protected activeTab = 'profile';
  protected readonly tabs: Tab[] = [
    { id: 'dashboard', label: 'Home', icon: 'home', route: '/dashboard' },
    { id: 'profile', label: 'Profile', icon: 'user', route: '/profile' },
    { id: 'settings', label: 'Settings', icon: 'settings', route: '/settings' },
  ];

  protected startEditing(): void {
    this.editName.set(this.authState.displayName());
    this.editing.set(true);
  }

  protected async saveProfile(): Promise<void> {
    try {
      const { error } = await this.supabase.client.auth.updateUser({
        data: { full_name: this.editName() },
      });
      if (error) {
        this.toastService.error(error.message);
        return;
      }
      this.editing.set(false);
      this.toastService.success('Profile updated');
    } catch {
      this.toastService.error('Failed to update profile');
    }
  }

  protected async onEnrollMfa(): Promise<void> {
    const enrollment = await this.authService.enrollMfa('My Authenticator');
    if (enrollment) {
      this.mfaEnrollment.set(enrollment);
    }
  }

  protected onVerifyMfaEnrollment(): void {
    if (this.mfaEnrollment()) {
      this.pendingFactorId.set(this.mfaEnrollment()!.factorId);
      this.mfaEnrollment.set(null);
      this.verifyingMfa.set(true);
    }
  }

  protected async onConfirmMfa(): Promise<void> {
    const factorId = this.pendingFactorId();
    if (!factorId || this.mfaCode().length !== 6) return;

    const challenge = await this.authService.challengeMfa(factorId);
    if (!challenge) return;

    const success = await this.authService.verifyMfa(
      challenge.factorId,
      challenge.challengeId,
      this.mfaCode()
    );

    if (success) {
      this.verifyingMfa.set(false);
      this.mfaCode.set('');
      this.pendingFactorId.set(null);
      this.toastService.success('Two-factor authentication enabled');
    }
  }

  protected cancelMfaVerify(): void {
    this.verifyingMfa.set(false);
    this.mfaCode.set('');
    this.pendingFactorId.set(null);
  }

  protected async onUnenrollMfa(factorId: string): Promise<void> {
    const success = await this.authService.unenrollMfa(factorId);
    if (success) {
      this.toastService.success('Authenticator removed');
    }
  }

  protected async onRegisterPasskey(): Promise<void> {
    const passkey = await this.authService.registerPasskey();
    if (passkey) {
      this.toastService.success('Passkey registered');
    }
  }

  protected async onDeletePasskey(passkeyId: string): Promise<void> {
    const success = await this.authService.deletePasskey(passkeyId);
    if (success) {
      this.toastService.success('Passkey removed');
    }
  }

  protected onTabPress(tab: Tab): void {
    if (tab.route) {
      this.router.navigate([tab.route]);
    }
  }
}
