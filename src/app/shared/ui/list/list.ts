import { Component, input, output } from '@angular/core';
import { LucideDynamicIcon } from '@lucide/angular';

@Component({
  selector: 'app-list',
  host: {
    class: 'block rounded-xl bg-[var(--surface-primary)] overflow-hidden',
    role: 'list',
  },
  template: `
    @if (header()) {
      <div class="px-5 pt-4 pb-2 text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
        {{ header() }}
      </div>
    }
    <ng-content />
    @if (footer()) {
      <div class="px-5 pt-2 pb-3 text-xs text-[var(--text-tertiary)]">
        {{ footer() }}
      </div>
    }
  `,
})
export class ListComponent {
  readonly header = input<string | null>(null);
  readonly footer = input<string | null>(null);
}

@Component({
  selector: 'app-list-item',
  imports: [LucideDynamicIcon],
  host: {
    class: 'block',
    role: 'listitem',
  },
  template: `
    <button
      type="button"
      class="flex w-full items-center gap-3 px-5 py-3 text-left transition-colors duration-fast hover:bg-[var(--fill-primary)] active:bg-[var(--fill-secondary)]"
      [class]="destructive() ? 'text-[var(--color-error)]' : 'text-[var(--text-primary)]'"
      [disabled]="disabled()"
      (click)="pressed.emit()"
    >
      @if (leadingIcon()) {
        <span
          class="flex h-8 w-8 shrink-0 items-center justify-center rounded-md"
          [class]="destructive()
            ? 'bg-[var(--color-error-container)] text-[var(--color-error)]'
            : 'bg-[var(--fill-secondary)] text-[var(--text-secondary)]'"
        >
          <svg [lucideIcon]="leadingIcon()!" [size]="18" />
        </span>
      }
      <span class="flex-1 min-w-0">
        <span class="block text-sm font-medium truncate">{{ label() }}</span>
        @if (subtitle()) {
          <span class="block text-xs text-[var(--text-tertiary)] truncate">{{ subtitle() }}</span>
        }
      </span>
      @if (trailing()) {
        <span class="shrink-0 text-sm text-[var(--text-tertiary)]">{{ trailing() }}</span>
      }
      @if (showChevron()) {
        <svg lucideIcon="chevron-right" [size]="16" class="shrink-0 text-[var(--text-quaternary)]" />
      }
      <ng-content />
    </button>
    @if (!last()) {
      <div class="ml-5 h-px bg-[var(--separator)]"></div>
    }
  `,
  styles: `
    button:disabled {
      opacity: 0.4;
      pointer-events: none;
    }
  `,
})
export class ListItemComponent {
  readonly label = input.required<string>();
  readonly subtitle = input<string | null>(null);
  readonly leadingIcon = input<string | null>(null);
  readonly trailing = input<string | null>(null);
  readonly showChevron = input(false);
  readonly destructive = input(false);
  readonly disabled = input(false);
  readonly last = input(false);

  readonly pressed = output<void>();
}
