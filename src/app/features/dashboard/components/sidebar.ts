import { Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AuthState } from '../../../core/state/auth.state';
import { AuthService } from '../../../core/services/auth.service';
import { UiState } from '../../../core/state/ui.state';
import { AvatarComponent } from '../../../shared/ui/avatar/avatar';
import { IconComponent } from '../../../shared/ui/icon/icon';

interface NavItem {
  icon: string;
  label: string;
  route: string;
}

@Component({
  selector: 'app-sidebar',
  imports: [RouterLink, AvatarComponent, IconComponent],
  template: `
    <aside class="flex h-full w-64 flex-col bg-[var(--glass-bg-thick)] backdrop-blur-xl border-r border-[var(--separator)]">
      <!-- Logo -->
      <div class="flex items-center gap-3 px-5 py-5">
        <div class="flex h-9 w-9 items-center justify-center rounded-lg bg-system-blue shadow-sm">
          <span class="text-sm font-bold text-white">N</span>
        </div>
        <span class="text-base font-semibold text-[var(--text-primary)]">NgSupa</span>
      </div>

      <!-- Navigation -->
      <nav class="flex-1 space-y-0.5 px-3 py-2" aria-label="Main navigation">
        @for (item of navItems; track item.route) {
          <a
            [routerLink]="item.route"
            class="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors duration-fast"
            [class]="isActive(item.route)
              ? 'bg-[var(--interactive-tint)] text-system-blue'
              : 'text-[var(--text-secondary)] hover:bg-[var(--fill-primary)] hover:text-[var(--text-primary)]'"
          >
            <app-icon [name]="item.icon" [size]="20" />
            {{ item.label }}
          </a>
        }
      </nav>

      <!-- User section -->
      <div class="border-t border-[var(--separator)] p-4">
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
            <app-icon name="log-out" [size]="18" />
          </button>
        </div>
      </div>
    </aside>
  `,
})
export class SidebarComponent {
  protected readonly authState = inject(AuthState);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  protected readonly navItems: NavItem[] = [
    { icon: 'home', label: 'Dashboard', route: '/dashboard' },
    { icon: 'user', label: 'Profile', route: '/profile' },
    { icon: 'settings', label: 'Settings', route: '/settings' },
  ];

  protected isActive(route: string): boolean {
    return this.router.url.startsWith(route);
  }

  protected async onSignOut(): Promise<void> {
    await this.authService.signOut();
    this.router.navigate(['/auth']);
  }
}
