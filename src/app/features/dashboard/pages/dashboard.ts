import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthState } from '../../../core/state/auth.state';
import { UiState } from '../../../core/state/ui.state';
import { NavBarComponent } from '../../../shared/ui/nav-bar/nav-bar';
import { TabBarComponent, Tab } from '../../../shared/ui/tab-bar/tab-bar';
import { CardComponent } from '../../../shared/ui/card/card';
import { AvatarComponent } from '../../../shared/ui/avatar/avatar';
import { IconComponent } from '../../../shared/ui/icon/icon';
import { SidebarComponent } from '../components/sidebar';

@Component({
  selector: 'app-dashboard',
  imports: [
    NavBarComponent,
    TabBarComponent,
    CardComponent,
    AvatarComponent,
    IconComponent,
    SidebarComponent,
  ],
  template: `
    <div class="flex min-h-dvh bg-[var(--surface-grouped)]">
      <!-- Sidebar (desktop) -->
      @if (uiState.showSidebar()) {
        <app-sidebar />
      }

      <!-- Main content area -->
      <div class="flex-1 flex flex-col min-w-0">
        <app-nav-bar title="Dashboard">
          @if (uiState.isMobile()) {
            <button nav-leading
              type="button"
              class="rounded-md p-1 text-system-blue"
              aria-label="Menu"
            >
              <app-icon name="menu" [size]="22" />
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

        <main class="flex-1 px-5 pb-24 md:pb-8">
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
                  <app-icon name="bar-chart" [size]="20" class="text-system-blue" />
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
                  <app-icon name="activity" [size]="20" class="text-system-green" />
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
                      <app-icon [name]="item.icon" [size]="14" class="text-[var(--text-secondary)]" />
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
                  <app-icon name="bell" [size]="20" class="text-system-orange" />
                </div>
                <div>
                  <p class="text-sm text-[var(--text-primary)]">Push notifications</p>
                  <p class="text-xs text-[var(--text-tertiary)]">Manage in Settings</p>
                </div>
              </div>
            </app-card>

            <!-- Security Status -->
            <app-card>
              <h3 class="mb-3 text-sm font-semibold text-[var(--text-primary)]">Security</h3>
              <div class="flex items-center gap-3">
                <div class="flex h-10 w-10 items-center justify-center rounded-xl"
                  [class]="authState.hasMfa()
                    ? 'bg-system-green-light'
                    : 'bg-system-orange-light'"
                >
                  <app-icon name="shield" [size]="20"
                    [class]="authState.hasMfa()
                      ? 'text-system-green'
                      : 'text-system-orange'"
                  />
                </div>
                <div>
                  <p class="text-sm text-[var(--text-primary)]">
                    {{ authState.hasMfa() ? 'MFA Enabled' : 'MFA Not Set Up' }}
                  </p>
                  <p class="text-xs text-[var(--text-tertiary)]">
                    {{ authState.hasMfa() ? 'Your account is protected' : 'Add extra security' }}
                  </p>
                </div>
              </div>
            </app-card>

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
  private readonly router = inject(Router);

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
