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
      class="relative inline-flex shrink-0 rounded-full transition-colors duration-normal ease-out"
      [class]="trackClasses()"
    >
      <span
        class="inline-block rounded-full bg-white shadow-sm transition-transform duration-normal ease-out"
        [class]="thumbClasses()"
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
