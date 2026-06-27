import { Component, inject, viewChild } from '@angular/core';
import { Router } from '@angular/router';
import { AuthState } from '../../../core/state/auth.state';
import { AuthService } from '../../../core/services/auth.service';
import { UiState } from '../../../core/state/ui.state';
import { AvatarComponent } from '../../../shared/ui/avatar/avatar';
import { LucideDynamicIcon } from '@lucide/angular';
import {
  SidenavComponent,
  SidenavItemComponent,
  SidenavGroupComponent,
} from '../../../shared/ui/sidenav/sidenav';

interface NavItem {
  icon: string;
  label: string;
  route: string;
  badge?: string | number;
}

@Component({
  selector: 'app-sidebar',
  imports: [
    AvatarComponent,
    LucideDynamicIcon,
    SidenavComponent,
    SidenavItemComponent,
    SidenavGroupComponent,
  ],
  template: `
    <app-sidenav
      #sidenav
      [(collapsed)]="uiState.sidebarCollapsed"
      variant="glass"
      ariaLabel="Dashboard navigation"
    >
      <!-- Header: Logo -->
      <div sidenav-header class="flex items-center gap-3 min-w-0">
        <div
          class="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-system-blue shadow-sm"
        >
          <span class="text-sm font-bold text-white">N</span>
        </div>
        @if (!uiState.sidebarCollapsed()) {
          <span
            class="text-base font-semibold text-[var(--text-primary)] whitespace-nowrap overflow-hidden"
          >
            NgSupa
          </span>
        }
      </div>

      <!-- Main nav group -->
      <app-sidenav-group>
        @for (item of mainNavItems; track item.route) {
          <app-sidenav-item
            [icon]="item.icon"
            [label]="item.label"
            [active]="isActive(item.route)"
            [collapsed]="uiState.sidebarCollapsed()"
            [badge]="item.badge"
            (itemClick)="navigate(item.route)"
          />
        }
      </app-sidenav-group>

      <!-- Tools group -->
      <app-sidenav-group label="Tools" [collapsed]="uiState.sidebarCollapsed()">
        @for (item of toolNavItems; track item.route) {
          <app-sidenav-item
            [icon]="item.icon"
            [label]="item.label"
            [active]="isActive(item.route)"
            [collapsed]="uiState.sidebarCollapsed()"
            [badge]="item.badge"
            (itemClick)="navigate(item.route)"
          />
        }
      </app-sidenav-group>

      <!-- Footer: User profile -->
      <div sidenav-footer>
        @if (!uiState.sidebarCollapsed()) {
          <div class="flex items-center gap-3">
            <app-avatar
              size="sm"
              [name]="authState.displayName()"
              [src]="authState.avatarUrl()"
            />
            <div class="flex-1 min-w-0">
              <p class="text-sm font-medium text-[var(--text-primary)] truncate">
                {{ authState.displayName() }}
              </p>
              <p class="text-xs text-[var(--text-tertiary)] truncate">
                {{ authState.email() }}
              </p>
            </div>
            <button
              type="button"
              class="rounded-md p-1.5 text-[var(--text-tertiary)] hover:bg-[var(--fill-primary)] hover:text-[var(--text-secondary)] transition-colors"
              aria-label="Sign out"
              (click)="onSignOut()"
            >
              <svg lucideIcon="log-out" [size]="18" />
            </button>
          </div>
        } @else {
          <div class="flex flex-col items-center gap-2">
            <app-avatar
              size="sm"
              [name]="authState.displayName()"
              [src]="authState.avatarUrl()"
            />
            <button
              type="button"
              class="rounded-md p-1.5 text-[var(--text-tertiary)] hover:bg-[var(--fill-primary)] hover:text-[var(--text-secondary)] transition-colors"
              aria-label="Sign out"
              (click)="onSignOut()"
            >
              <svg lucideIcon="log-out" [size]="18" />
            </button>
          </div>
        }
      </div>
    </app-sidenav>
  `,
})
export class SidebarComponent {
  protected readonly authState = inject(AuthState);
  protected readonly uiState = inject(UiState);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  readonly sidenav = viewChild.required<SidenavComponent>('sidenav');

  protected readonly mainNavItems: NavItem[] = [
    { icon: 'home', label: 'Dashboard', route: '/dashboard' },
    { icon: 'user', label: 'Profile', route: '/profile' },
  ];

  protected readonly toolNavItems: NavItem[] = [
    { icon: 'settings', label: 'Settings', route: '/settings' },
    { icon: 'layout-dashboard', label: 'Showcase', route: '/showcase' },
  ];

  protected isActive(route: string): boolean {
    return this.router.url.startsWith(route);
  }

  protected navigate(route: string): void {
    this.router.navigate([route]);
    // Close mobile overlay after navigation
    this.sidenav().closeMobile();
  }

  protected async onSignOut(): Promise<void> {
    await this.authService.signOut();
    this.router.navigate(['/auth']);
  }

  /** Exposed so the parent dashboard can open the mobile drawer */
  openMobile(): void {
    this.sidenav().openMobile();
  }
}
