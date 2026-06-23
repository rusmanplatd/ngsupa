import { Component, input, output, computed } from '@angular/core';
import { LucideDynamicIcon } from '@lucide/angular';

export type ChipVariant = 'filled' | 'outlined';

@Component({
  selector: 'app-chip',
  imports: [LucideDynamicIcon],
  host: {
    '[class]': 'hostClasses()',
    '[attr.aria-selected]': 'selected()',
    '[attr.aria-disabled]': 'disabled()',
    '(click)': 'onChipClick()',
    '(keydown.enter)': 'onChipClick()',
    '(keydown.space)': '$event.preventDefault(); onChipClick()',
    '[attr.tabindex]': 'disabled() ? -1 : 0',
    role: 'option',
  },
  template: `
    @if (leadingIcon()) {
      <svg [lucideIcon]="leadingIcon()!" [size]="14" class="shrink-0" />
    }
    <span class="truncate"><ng-content /></span>
    @if (removable()) {
      <button
        type="button"
        tabindex="-1"
        class="shrink-0 -mr-1 flex h-4 w-4 items-center justify-center rounded-full hover:bg-[var(--fill-secondary)] transition-colors"
        [attr.aria-label]="'Remove'"
        (click)="onRemove($event)"
      >
        <svg lucideIcon="x" [size]="10" />
      </button>
    }
  `,
  styles: `
    :host {
      display: inline-flex;
      align-items: center;
      gap: 0.375rem;
      padding: 0.375rem 0.75rem;
      border-radius: 9999px;
      font-size: 0.8125rem;
      font-weight: 500;
      line-height: 1;
      cursor: pointer;
      user-select: none;
      white-space: nowrap;
      transition-property: background-color, color, border-color, box-shadow, transform;
      transition-duration: var(--duration-fast);
      transition-timing-function: cubic-bezier(0.2, 0, 0, 1);
    }

    :host(:active:not([aria-disabled='true'])) {
      transform: scale(0.95);
    }

    :host([aria-disabled='true']) {
      opacity: 0.4;
      cursor: not-allowed;
      pointer-events: none;
    }
  `,
})
export class ChipComponent {
  readonly variant = input<ChipVariant>('filled');
  readonly selected = input(false);
  readonly disabled = input(false);
  readonly removable = input(false);
  readonly leadingIcon = input<string | null>(null);

  readonly chipClick = output<void>();
  readonly removed = output<void>();

  protected readonly hostClasses = computed(() => {
    const v = this.variant();
    const sel = this.selected();

    if (sel) {
      return 'bg-system-blue text-white border border-system-blue';
    }

    if (v === 'outlined') {
      return 'bg-transparent text-[var(--text-primary)] border border-[var(--border-opaque)] hover:border-[var(--border-default)] hover:bg-[var(--fill-primary)]';
    }

    // filled (default, not selected)
    return 'bg-[var(--fill-secondary)] text-[var(--text-primary)] border border-transparent hover:bg-[var(--fill-primary)]';
  });

  protected onChipClick(): void {
    if (this.disabled()) return;
    this.chipClick.emit();
  }

  protected onRemove(event: Event): void {
    event.stopPropagation();
    if (this.disabled()) return;
    this.removed.emit();
  }
}
