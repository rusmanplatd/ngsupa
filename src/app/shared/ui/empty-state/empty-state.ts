import { Component, input, output } from '@angular/core';
import { LucideDynamicIcon } from '@lucide/angular';
import { ButtonComponent } from '../button/button';

@Component({
  selector: 'app-empty-state',
  imports: [LucideDynamicIcon, ButtonComponent],
  host: {
    class: 'flex flex-col items-center justify-center px-6 py-12 text-center',
  },
  template: `
    @if (icon()) {
      <div class="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--fill-secondary)]">
        <svg [lucideIcon]="icon()!" [size]="28" class="text-[var(--text-tertiary)]" />
      </div>
    }
    <h3 class="text-lg font-semibold text-[var(--text-primary)]">{{ title() }}</h3>
    @if (description()) {
      <p class="mt-1.5 max-w-sm text-sm text-[var(--text-secondary)]">{{ description() }}</p>
    }
    @if (actionLabel()) {
      <button
        appButton
        variant="tinted"
        class="mt-5"
        (click)="actionClick.emit()"
      >
        {{ actionLabel() }}
      </button>
    }
    <ng-content />
  `,
})
export class EmptyStateComponent {
  readonly icon = input<string | null>(null);
  readonly title = input.required<string>();
  readonly description = input<string | null>(null);
  readonly actionLabel = input<string | null>(null);
  readonly actionClick = output<void>();
}
