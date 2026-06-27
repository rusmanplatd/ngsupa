import { Component, inject, viewChild } from '@angular/core';
import { Router } from '@angular/router';
import { AuthState } from '../../../core/state/auth.state';
import { UiState } from '../../../core/state/ui.state';
import { NavBarComponent } from '../../../shared/ui/nav-bar/nav-bar';
import { TabBarComponent, Tab } from '../../../shared/ui/tab-bar/tab-bar';
import { CardComponent } from '../../../shared/ui/card/card';
import { AvatarComponent } from '../../../shared/ui/avatar/avatar';
import { LucideDynamicIcon } from '@lucide/angular';
import { SidebarComponent } from '../components/sidebar';

@Component({
  selector: 'app-dashboard',
  imports: [
    NavBarComponent,
    TabBarComponent,
    CardComponent,
    AvatarComponent,
    LucideDynamicIcon,
    SidebarComponent,
  ],
  template: `
    <div class="flex min-h-dvh bg-[var(--surface-grouped)]">
      <!-- Sidebar: always in DOM so viewChild is available; SidenavComponent handles its own mobile overlay -->
      <app-sidebar
        #sidebarRef
        class="contents"
      />

      <!-- Main content area -->
      <div class="flex-1 flex flex-col min-w-0">
        <app-nav-bar title="Dashboard">
          @if (uiState.isMobile()) {
            <button nav-leading
              type="button"
              class="rounded-md p-1 text-system-blue"
              aria-label="Open navigation menu"
              (click)="sidebar().openMobile()"
            >
              <svg lucideIcon="menu" [size]="22" />
            </button>
          }
          <div nav-trailing>
            <app-avatar
              size="sm"
              [name]="authState.displayName()"
              [src]="authState.avatarUrl()"
            />
          </div>
        </app-nav-bar>

        <main class="flex-1 px-5 pb-24 md:pb-8 space-y-4">

          <!-- MFA setup banner — shown only when 2FA is NOT enrolled -->
          @if (!authState.hasMfa()) {
            <button
              type="button"
              class="w-full text-left rounded-2xl border border-system-orange/30 bg-system-orange-light p-4 flex items-center gap-4 hover:border-system-orange/60 transition-colors group"
              (click)="router.navigate(['/settings'])"
              aria-label="Set up two-factor authentication"
            >
              <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-system-orange/15">
                <svg lucideIcon="shield-alert" [size]="20" class="text-system-orange" />
              </div>
              <div class="flex-1 min-w-0">
                <p class="text-sm font-semibold text-system-orange">Secure your account with 2FA</p>
                <p class="text-xs text-system-orange/80 mt-0.5">
                  Two-factor authentication is not enabled. Go to Settings → Security to set it up.
                </p>
              </div>
              <svg lucideIcon="chevron-right" [size]="18" class="text-system-orange/60 shrink-0 group-hover:translate-x-0.5 transition-transform" />
            </button>
          }

          <!-- Widgets Grid -->
          <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4">

            <!-- Welcome Card -->
            <app-card class="sm:col-span-2">
              <div class="flex items-center gap-4">
                <app-avatar
                  size="lg"
                  [name]="authState.displayName()"
                  [src]="authState.avatarUrl()"
                  status="online"
                />
                <div>
                  <h2 class="text-lg font-semibold text-[var(--text-primary)]">
                    Welcome back, {{ authState.displayName() }}
                  </h2>
                  <p class="text-sm text-[var(--text-secondary)]">
                    Here's what's happening with your account today.
                  </p>
                </div>
              </div>
            </app-card>

            <!-- Quick Stats -->
            <app-card variant="elevated">
              <div class="flex items-center gap-3">
                <div class="flex h-10 w-10 items-center justify-center rounded-xl bg-system-blue-light">
                  <svg lucideIcon="bar-chart" [size]="20" class="text-system-blue" />
                </div>
                <div>
                  <p class="text-2xl font-bold text-[var(--text-primary)]">128</p>
                  <p class="text-xs text-[var(--text-secondary)]">Total Actions</p>
                </div>
              </div>
            </app-card>

            <!-- Active Sessions -->
            <app-card variant="elevated">
              <div class="flex items-center gap-3">
                <div class="flex h-10 w-10 items-center justify-center rounded-xl bg-system-green-light">
                  <svg lucideIcon="activity" [size]="20" class="text-system-green" />
                </div>
                <div>
                  <p class="text-2xl font-bold text-[var(--text-primary)]">3</p>
                  <p class="text-xs text-[var(--text-secondary)]">Active Sessions</p>
                </div>
              </div>
            </app-card>

            <!-- Recent Activity -->
            <app-card>
              <h3 class="mb-3 text-sm font-semibold text-[var(--text-primary)]">Recent Activity</h3>
              <div class="space-y-3">
                @for (item of recentActivity; track item.time) {
                  <div class="flex items-center gap-3">
                    <div class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[var(--fill-secondary)]">
                      <svg [lucideIcon]="item.icon" [size]="14" class="text-[var(--text-secondary)]" />
                    </div>
                    <div class="flex-1 min-w-0">
                      <p class="text-sm text-[var(--text-primary)] truncate">{{ item.text }}</p>
                      <p class="text-xs text-[var(--text-tertiary)]">{{ item.time }}</p>
                    </div>
                  </div>
                }
              </div>
            </app-card>

            <!-- Notifications Card -->
            <app-card>
              <h3 class="mb-3 text-sm font-semibold text-[var(--text-primary)]">Notifications</h3>
              <div class="flex items-center gap-3">
                <div class="flex h-10 w-10 items-center justify-center rounded-xl bg-system-orange-light">
                  <svg lucideIcon="bell" [size]="20" class="text-system-orange" />
                </div>
                <div>
                  <p class="text-sm text-[var(--text-primary)]">Push notifications</p>
                  <p class="text-xs text-[var(--text-tertiary)]">Manage in Settings</p>
                </div>
              </div>
            </app-card>

            <!-- Security Status — clickable, navigates to Settings -->
            <button
              type="button"
              class="text-left"
              (click)="router.navigate(['/settings'])"
              aria-label="Go to security settings"
            >
              <app-card>
                <h3 class="mb-3 text-sm font-semibold text-[var(--text-primary)]">Security</h3>
                <div class="flex items-center gap-3">
                  <div class="flex h-10 w-10 items-center justify-center rounded-xl"
                    [class]="authState.hasMfa()
                      ? 'bg-system-green-light'
                      : 'bg-system-orange-light'"
                  >
                    <svg [lucideIcon]="authState.hasMfa() ? 'shield-check' : 'shield-alert'" [size]="20"
                      [class]="authState.hasMfa()
                        ? 'text-system-green'
                        : 'text-system-orange'"
                    />
                  </div>
                  <div>
                    <p class="text-sm text-[var(--text-primary)]">
                      {{ authState.hasMfa() ? 'MFA Enabled' : 'MFA Not Set Up' }}
                    </p>
                    <p class="text-xs"
                      [class]="authState.hasMfa() ? 'text-[var(--text-tertiary)]' : 'text-system-orange'"
                    >
                      {{ authState.hasMfa() ? 'Your account is protected' : 'Tap to set up 2FA →' }}
                    </p>
                  </div>
                </div>
              </app-card>
            </button>

          </div>
        </main>

      </div>
    </div>

    <!-- Tab Bar (mobile) -->
    @if (uiState.showTabBar()) {
      <app-tab-bar
        [tabs]="tabs"
        [(activeTab)]="activeTab"
        (tabPressed)="onTabPress($event)"
      />
    }
  `,
})
export class DashboardComponent {
  protected readonly authState = inject(AuthState);
  protected readonly uiState = inject(UiState);
  protected readonly router = inject(Router);

  protected readonly sidebar = viewChild.required<SidebarComponent>('sidebarRef');

  protected activeTab = 'dashboard';

  protected readonly tabs: Tab[] = [
    { id: 'dashboard', label: 'Home', icon: 'home', route: '/dashboard' },
    { id: 'profile', label: 'Profile', icon: 'user', route: '/profile' },
    { id: 'settings', label: 'Settings', icon: 'settings', route: '/settings' },
  ];

  protected readonly recentActivity = [
    { icon: 'lock', text: 'Password changed', time: '2 hours ago' },
    { icon: 'mail', text: 'Email verified', time: '1 day ago' },
    { icon: 'user', text: 'Profile updated', time: '3 days ago' },
  ];

  protected onTabPress(tab: Tab): void {
    if (tab.route) {
      this.router.navigate([tab.route]);
    }
  }
}
