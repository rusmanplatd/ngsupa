import { Component, model, input, computed } from '@angular/core';

@Component({
  selector: 'app-toggle',
  host: {
    class: 'inline-flex items-center gap-3 cursor-pointer select-none',
    '(click)': 'toggle()',
    '(keydown.space)': '$event.preventDefault(); toggle()',
    '(keydown.enter)': 'toggle()',
    '[attr.tabindex]': 'disabled() ? -1 : 0',
    role: 'switch',
    '[attr.aria-checked]': 'checked()',
    '[attr.aria-disabled]': 'disabled()',
    '[attr.aria-label]': 'ariaLabel() || label()',
  },
  template: `
    <span
      class="toggle-track relative inline-flex shrink-0 rounded-full transition-all duration-normal"
      [class]="trackClasses()"
      [style.box-shadow]="trackShadow()"
    >
      <span
        class="toggle-thumb inline-block rounded-full bg-white transition-all duration-normal"
        [class]="thumbClasses()"
        [style.box-shadow]="'0 1px 3px oklch(0% 0 0 / 0.15), 0 1px 2px oklch(0% 0 0 / 0.06), 0 0 0 0.5px oklch(0% 0 0 / 0.04)'"
      ></span>
    </span>
    @if (label()) {
      <span class="text-sm text-[var(--text-primary)]">{{ label() }}</span>
    }
  `,
  styles: `
    :host([aria-disabled='true']) {
      opacity: 0.4;
      cursor: not-allowed;
      pointer-events: none;
    }

    :host:active .toggle-track {
      /* Squish effect: make track slightly wider during press */
      transform: scaleX(1.04) scaleY(0.96);
    }

    :host:active .toggle-thumb {
      /* Thumb gets wider during drag (Apple's squish effect) */
      width: 30px !important;
    }

    .toggle-track {
      transition-timing-function: var(--ease-spring);
    }

    .toggle-thumb {
      transition-timing-function: var(--ease-spring);
    }
  `,
})
export class ToggleComponent {
  readonly checked = model(false);
  readonly label = input('');
  readonly disabled = input(false);
  readonly ariaLabel = input<string | null>(null);

  protected readonly trackClasses = computed(() => {
    const on = this.checked();
    return on
      ? 'bg-system-blue w-[51px] h-[31px] p-[2px]'
      : 'bg-[var(--fill-secondary)] w-[51px] h-[31px] p-[2px]';
  });

  protected readonly trackShadow = computed(() => {
    return this.checked()
      ? 'none'
      : 'var(--form-toggle-inset)';
  });

  protected readonly thumbClasses = computed(() => {
    const on = this.checked();
    return on
      ? 'w-[27px] h-[27px] translate-x-[20px]'
      : 'w-[27px] h-[27px] translate-x-0';
  });

  protected toggle(): void {
    if (this.disabled()) return;
    this.checked.update((v) => !v);
  }
}
