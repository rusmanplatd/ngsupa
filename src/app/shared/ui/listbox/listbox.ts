import {
  Component,
  input,
  output,
  computed,
  inject,
} from '@angular/core';
import { CdkListbox, CdkOption } from '@angular/cdk/listbox';
import { LucideDynamicIcon } from '@lucide/angular';

// ── Listbox Option ────────────────────────────────────────────

@Component({
  selector: 'app-listbox-option',
  imports: [LucideDynamicIcon],
  hostDirectives: [
    {
      directive: CdkOption,
      inputs: ['cdkOption: value', 'cdkOptionDisabled: disabled'],
    },
  ],
  host: {
    class:
      'listbox-option group relative flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left outline-none transition-all duration-fast select-none cursor-pointer',
    '[class]': 'optionClasses()',
  },
  template: `
    <!-- Leading icon -->
    @if (icon()) {
      <span
        class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-colors duration-fast"
        [class]="iconContainerClasses()"
      >
        <svg [lucideIcon]="icon()!" [size]="18" />
      </span>
    }

    <!-- Content -->
    <span class="flex-1 min-w-0">
      <span
        class="block text-sm font-medium truncate transition-colors duration-fast"
        [class]="labelClasses()"
      >
        <ng-content />
      </span>
      @if (description()) {
        <span class="block text-xs text-[var(--text-tertiary)] truncate mt-0.5 leading-relaxed">
          {{ description() }}
        </span>
      }
    </span>

    <!-- Trailing text -->
    @if (trailing()) {
      <span class="shrink-0 text-xs text-[var(--text-tertiary)] font-medium tabular-nums">
        {{ trailing() }}
      </span>
    }

    <!-- Selection indicator (checkmark) -->
    <span
      class="checkmark-container shrink-0 flex items-center justify-center w-5 h-5 transition-all duration-fast"
      [class]="selected() ? 'opacity-100 scale-100' : 'opacity-0 scale-75'"
    >
      <svg
        viewBox="0 0 16 16"
        fill="none"
        class="h-4 w-4 text-system-blue"
        stroke="currentColor"
        stroke-width="2.5"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <path d="M3 8L6.5 11.5L13 4.5" [class]="selected() ? 'animate-check' : ''" />
      </svg>
    </span>
  `,
  styles: `
    /* Active (keyboard navigated) */
    :host.cdk-option-active {
      background-color: var(--fill-secondary);
    }

    :host:not(.cdk-option-disabled):not(.cdk-option-active):hover {
      background-color: var(--fill-primary);
    }

    :host:not(.cdk-option-disabled):active {
      transform: scale(0.985);
      transition: transform 0.1s var(--ease-spring);
    }

    :host.cdk-option-disabled {
      opacity: 0.4;
      cursor: not-allowed;
    }

    /* Focus visible handled by CDK active descendant — remove default outline */
    :host:focus-visible {
      outline: none;
    }

    @keyframes check-draw {
      from { stroke-dashoffset: 20; }
      to   { stroke-dashoffset: 0; }
    }
    .animate-check {
      stroke-dasharray: 20;
      animation: check-draw 0.25s cubic-bezier(0.4, 0, 0.2, 1) forwards;
    }
  `,
})
export class ListboxOptionComponent {
  /** The value this option represents */
  readonly value = input.required<unknown>();

  /** Optional icon name (lucide) */
  readonly icon = input<string | null>(null);

  /** Optional description text below the label */
  readonly description = input<string | null>(null);

  /** Optional trailing text (e.g. count, shortcut) */
  readonly trailing = input<string | null>(null);

  /** Whether this option is disabled */
  readonly disabled = input(false);

  /** Whether this option is currently selected (set by parent) */
  readonly selected = input(false);

  protected readonly optionClasses = computed(() => {
    if (this.selected()) {
      return 'bg-[var(--interactive-tint)]';
    }
    return '';
  });

  protected readonly iconContainerClasses = computed(() => {
    if (this.selected()) {
      return 'bg-system-blue-light text-system-blue';
    }
    return 'bg-[var(--fill-secondary)] text-[var(--text-secondary)] group-hover:bg-[var(--fill-tertiary)]';
  });

  protected readonly labelClasses = computed(() => {
    if (this.disabled()) {
      return 'text-[var(--text-quaternary)]';
    }
    return 'text-[var(--text-primary)]';
  });
}

// ── Listbox Container ─────────────────────────────────────────

@Component({
  selector: 'app-listbox',
  hostDirectives: [
    {
      directive: CdkListbox,
      inputs: [
        'cdkListboxValue: value',
        'cdkListboxMultiple: multiple',
        'cdkListboxDisabled: disabled',
        'cdkListboxOrientation: orientation',
        'cdkListboxNavigationWrapDisabled: navigationWrapDisabled',
        'cdkListboxUseActiveDescendant: useActiveDescendant',
        'cdkListboxCompareWith: compareWith',
      ],
      outputs: ['cdkListboxValueChange: valueChange'],
    },
  ],
  host: {
    class:
      'listbox-container block rounded-2xl border border-[var(--border-default)] bg-[var(--surface-primary)] overflow-hidden outline-none transition-all duration-normal',
    '[class]': 'containerClasses()',
    '[style.box-shadow]': 'containerShadow()',
  },
  template: `
    @if (header()) {
      <div class="listbox-header px-4 pt-3 pb-1.5 text-xs font-semibold uppercase tracking-wider text-[var(--text-tertiary)] select-none">
        {{ header() }}
      </div>
    }

    <div
      class="listbox-options-scroll overflow-y-auto overscroll-contain p-1.5"
      [style.max-height]="maxHeight()"
    >
      <ng-content />
    </div>

    @if (footer()) {
      <div class="listbox-footer px-4 pt-2 pb-3 text-xs text-[var(--text-tertiary)]">
        {{ footer() }}
      </div>
    }
  `,
  styles: `
    :host:focus-within {
      border-color: var(--color-system-blue);
      box-shadow: var(--form-control-glow) !important;
    }

    .listbox-options-scroll {
      scrollbar-width: thin;
      scrollbar-color: light-dark(oklch(75% 0 0 / 0.3), oklch(50% 0 0 / 0.3)) transparent;
    }

    /* Staggered entry animation for options */
    :host ::ng-deep app-listbox-option {
      animation: listbox-option-in 0.2s var(--ease-default) backwards;
    }
    :host ::ng-deep app-listbox-option:nth-child(1) { animation-delay: 0ms; }
    :host ::ng-deep app-listbox-option:nth-child(2) { animation-delay: 25ms; }
    :host ::ng-deep app-listbox-option:nth-child(3) { animation-delay: 50ms; }
    :host ::ng-deep app-listbox-option:nth-child(4) { animation-delay: 75ms; }
    :host ::ng-deep app-listbox-option:nth-child(5) { animation-delay: 100ms; }
    :host ::ng-deep app-listbox-option:nth-child(6) { animation-delay: 125ms; }
    :host ::ng-deep app-listbox-option:nth-child(7) { animation-delay: 150ms; }
    :host ::ng-deep app-listbox-option:nth-child(8) { animation-delay: 175ms; }

    @keyframes listbox-option-in {
      from {
        opacity: 0;
        transform: translateY(4px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
  `,
})
export class ListboxComponent {
  /** Header label above the listbox */
  readonly header = input<string | null>(null);

  /** Footer text below the listbox */
  readonly footer = input<string | null>(null);

  /** Max height for the scrollable area */
  readonly maxHeight = input('320px');

  /** Visual variant */
  readonly variant = input<'default' | 'card'>('default');

  // ── Computed styles ──────────────────────────────────────────

  protected readonly containerClasses = computed(() => {
    if (this.variant() === 'card') {
      return 'shadow-md backdrop-blur-sm bg-[var(--glass-bg-thick)]';
    }
    return '';
  });

  protected readonly containerShadow = computed(() => {
    if (this.variant() === 'card') {
      return 'var(--shadow-md)';
    }
    return 'var(--shadow-xs)';
  });
}
