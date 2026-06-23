import { Component, inject, signal, effect } from '@angular/core';
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
      @if (uiState.showSidebar()) {
        <app-sidebar />
      }

      <div class="flex-1 flex flex-col min-w-0">
        <app-nav-bar title="Settings">
          @if (uiState.isMobile()) {
            <button nav-leading type="button" class="rounded-md p-1 text-system-blue" aria-label="Back" (click)="router.navigate(['/dashboard'])">
              <svg lucideIcon="arrow-left" [size]="22" />
            </button>
          }
        </app-nav-bar>

        <main class="flex-1 px-5 pb-24 md:pb-8 mx-auto w-full max-w-2xl space-y-6">

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

  protected readonly changingPassword = signal(false);
  protected readonly newPassword = signal('');
  protected readonly confirmNewPassword = signal('');

  protected pushEnabled = signal(false);

  protected readonly themeOptions: SegmentOption[] = [
    { value: 'light', label: '☀️' },
    { value: 'system', label: '💻' },
    { value: 'dark', label: '🌙' },
  ];

  protected themeValue = signal<string>(this.themeState.preference());

  protected activeTab = 'settings';
  protected readonly tabs: Tab[] = [
    { id: 'dashboard', label: 'Home', icon: 'home', route: '/dashboard' },
    { id: 'profile', label: 'Profile', icon: 'user', route: '/profile' },
    { id: 'settings', label: 'Settings', icon: 'settings', route: '/settings' },
  ];

  constructor() {
    this.pushEnabled.set(this.pushService.permissionGranted());

    // Sync theme segmented control to ThemeState
    effect(() => {
      const val = this.themeValue() as ThemePreference;
      this.themeState.setTheme(val);
    });
  }

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
    // Show confirmation — in a real app this would use a modal
    this.toastService.warning('Account deletion requires server-side implementation via Edge Functions.');
  }

  protected async onTogglePush(): Promise<void> {
    if (this.pushEnabled()) {
      const granted = await this.pushService.requestPermission();
      if (granted) {
        const userId = this.authState.user()?.id;
        if (userId) {
          await this.pushService.registerToken(userId);
        }
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
}
