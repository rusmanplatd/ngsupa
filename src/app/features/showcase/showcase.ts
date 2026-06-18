import { Component, inject, signal } from '@angular/core';
import { ButtonComponent } from '../../shared/ui/button/button';
import { InputComponent } from '../../shared/ui/input/input';
import { ToggleComponent } from '../../shared/ui/toggle/toggle';
import {
  SegmentedControlComponent,
  SegmentOption,
} from '../../shared/ui/segmented-control/segmented-control';
import { CardComponent } from '../../shared/ui/card/card';
import { AvatarComponent } from '../../shared/ui/avatar/avatar';
import { ListComponent, ListItemComponent } from '../../shared/ui/list/list';
import { SpinnerComponent } from '../../shared/ui/spinner/spinner';
import { DividerComponent } from '../../shared/ui/divider/divider';
import { IconComponent } from '../../shared/ui/icon/icon';
import { NavBarComponent } from '../../shared/ui/nav-bar/nav-bar';
import { ToastService, ToastContainerComponent } from '../../shared/ui/toast/toast';

@Component({
  selector: 'app-showcase',
  imports: [
    ButtonComponent,
    InputComponent,
    ToggleComponent,
    SegmentedControlComponent,
    CardComponent,
    AvatarComponent,
    ListComponent,
    ListItemComponent,
    SpinnerComponent,
    DividerComponent,
    IconComponent,
    NavBarComponent,
    ToastContainerComponent,
  ],
  template: `
    <app-toast-container />
    <app-nav-bar title="Design System">
      <span nav-leading class="text-sm font-medium text-system-blue">NgSupa</span>
    </app-nav-bar>

    <main class="mx-auto max-w-3xl px-5 pb-24 space-y-12">

      <!-- ═══════════ Buttons ═══════════ -->
      <section>
        <h2 class="text-xl font-bold text-[var(--text-primary)] mb-4">Buttons</h2>
        <div class="space-y-4">
          <div class="flex flex-wrap items-center gap-3">
            <button appButton variant="filled">Filled</button>
            <button appButton variant="tinted">Tinted</button>
            <button appButton variant="plain">Plain</button>
            <button appButton variant="destructive">Destructive</button>
          </div>
          <div class="flex flex-wrap items-center gap-3">
            <button appButton variant="filled" size="sm">Small</button>
            <button appButton variant="filled" size="md">Medium</button>
            <button appButton variant="filled" size="lg">Large</button>
          </div>
          <div class="flex flex-wrap items-center gap-3">
            <button appButton variant="filled" [loading]="true">Loading</button>
            <button appButton variant="filled" [disabled]="true">Disabled</button>
          </div>
        </div>
      </section>

      <app-divider />

      <!-- ═══════════ Inputs ═══════════ -->
      <section>
        <h2 class="text-xl font-bold text-[var(--text-primary)] mb-4">Inputs</h2>
        <div class="space-y-4 max-w-md">
          <app-input
            label="Email address"
            type="email"
            leadingIcon="mail"
            autocomplete="email"
            [value]="emailVal()"
            (valueChange)="emailVal.set($event)"
          />
          <app-input
            label="Password"
            type="password"
            leadingIcon="lock"
            autocomplete="current-password"
          />
          <app-input
            label="With error"
            error="This field is required"
            [value]="''"
          />
          <app-input
            label="With hint"
            hint="Enter your full name"
            leadingIcon="user"
          />
        </div>
      </section>

      <app-divider />

      <!-- ═══════════ Toggle ═══════════ -->
      <section>
        <h2 class="text-xl font-bold text-[var(--text-primary)] mb-4">Toggle / Switch</h2>
        <div class="space-y-4">
          <app-toggle label="Notifications" [(checked)]="toggleA" />
          <app-toggle label="Dark Mode" [(checked)]="toggleB" />
          <app-toggle label="Disabled" [disabled]="true" />
        </div>
      </section>

      <app-divider />

      <!-- ═══════════ Segmented Control ═══════════ -->
      <section>
        <h2 class="text-xl font-bold text-[var(--text-primary)] mb-4">Segmented Control</h2>
        <app-segmented-control
          [options]="segmentOptions"
          [(value)]="segmentValue"
          ariaLabel="View mode"
        />
        <p class="mt-2 text-sm text-[var(--text-secondary)]">
          Selected: {{ segmentValue() }}
        </p>
      </section>

      <app-divider />

      <!-- ═══════════ Cards ═══════════ -->
      <section>
        <h2 class="text-xl font-bold text-[var(--text-primary)] mb-4">Cards</h2>
        <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <app-card>
            <p class="text-sm font-medium text-[var(--text-primary)]">Default (Glass)</p>
            <p class="mt-1 text-xs text-[var(--text-secondary)]">Frosted glass with backdrop blur</p>
          </app-card>
          <app-card variant="elevated">
            <p class="text-sm font-medium text-[var(--text-primary)]">Elevated</p>
            <p class="mt-1 text-xs text-[var(--text-secondary)]">Raised with shadow</p>
          </app-card>
          <app-card variant="outlined">
            <p class="text-sm font-medium text-[var(--text-primary)]">Outlined</p>
            <p class="mt-1 text-xs text-[var(--text-secondary)]">Subtle border</p>
          </app-card>
        </div>
      </section>

      <app-divider />

      <!-- ═══════════ Avatars ═══════════ -->
      <section>
        <h2 class="text-xl font-bold text-[var(--text-primary)] mb-4">Avatars</h2>
        <div class="flex items-end gap-4">
          <app-avatar size="xs" name="Alice Blue" />
          <app-avatar size="sm" name="Bob Green" status="online" />
          <app-avatar size="md" name="Charlie Red" status="away" />
          <app-avatar size="lg" name="Diana Purple" status="offline" />
          <app-avatar size="xl" name="Eve Orange" />
        </div>
      </section>

      <app-divider />

      <!-- ═══════════ List ═══════════ -->
      <section>
        <h2 class="text-xl font-bold text-[var(--text-primary)] mb-4">Lists</h2>
        <div class="max-w-md space-y-4">
          <app-list header="General">
            <app-list-item label="Profile" leadingIcon="user" [showChevron]="true" />
            <app-list-item label="Notifications" leadingIcon="bell" trailing="On" [showChevron]="true" />
            <app-list-item label="Security" leadingIcon="shield" [showChevron]="true" [last]="true" />
          </app-list>
          <app-list header="Danger Zone">
            <app-list-item
              label="Delete Account"
              leadingIcon="trash"
              [destructive]="true"
              [last]="true"
              (pressed)="toastService.error('This is a destructive action')"
            />
          </app-list>
        </div>
      </section>

      <app-divider />

      <!-- ═══════════ Spinners ═══════════ -->
      <section>
        <h2 class="text-xl font-bold text-[var(--text-primary)] mb-4">Spinners</h2>
        <div class="flex items-center gap-6">
          <app-spinner size="sm" />
          <app-spinner size="md" />
          <app-spinner size="lg" />
        </div>
      </section>

      <app-divider />

      <!-- ═══════════ Icons ═══════════ -->
      <section>
        <h2 class="text-xl font-bold text-[var(--text-primary)] mb-4">Icons</h2>
        <div class="flex flex-wrap items-center gap-4 text-[var(--text-secondary)]">
          @for (icon of iconNames; track icon) {
            <div class="flex flex-col items-center gap-1">
              <app-icon [name]="icon" [size]="22" />
              <span class="text-[10px] text-[var(--text-tertiary)]">{{ icon }}</span>
            </div>
          }
        </div>
      </section>

      <app-divider />

      <!-- ═══════════ Toasts ═══════════ -->
      <section>
        <h2 class="text-xl font-bold text-[var(--text-primary)] mb-4">Toasts</h2>
        <div class="flex flex-wrap gap-3">
          <button appButton variant="tinted" (click)="toastService.info('This is an info toast')">Info Toast</button>
          <button appButton variant="tinted" (click)="toastService.success('Operation successful!')">Success Toast</button>
          <button appButton variant="tinted" (click)="toastService.warning('Please be careful')">Warning Toast</button>
          <button appButton variant="tinted" (click)="toastService.error('Something went wrong')">Error Toast</button>
        </div>
      </section>

    </main>
  `,
})
export class ShowcaseComponent {
  protected readonly toastService = inject(ToastService);

  protected readonly emailVal = signal('');
  protected toggleA = signal(true);
  protected toggleB = signal(false);

  protected readonly segmentOptions: SegmentOption[] = [
    { value: 'all', label: 'All' },
    { value: 'active', label: 'Active' },
    { value: 'completed', label: 'Completed' },
  ];
  protected readonly segmentValue = signal('all');

  protected readonly iconNames = [
    'home', 'user', 'settings', 'bell', 'mail', 'lock', 'key',
    'shield', 'fingerprint', 'eye', 'eye-off', 'sun', 'moon',
    'monitor', 'plus', 'trash', 'edit', 'link', 'check', 'x',
    'chevron-right', 'arrow-left', 'menu', 'log-out', 'info',
    'alert-triangle', 'activity', 'bar-chart', 'smartphone', 'camera',
  ];
}
