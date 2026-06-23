import { Component, model, input, computed } from '@angular/core';

@Component({
  selector: 'app-checkbox',
  host: {
    class: 'inline-flex items-start gap-3 cursor-pointer select-none',
    '(click)': 'toggle()',
    '(keydown.space)': '$event.preventDefault(); toggle()',
    '[attr.tabindex]': 'disabled() ? -1 : 0',
    role: 'checkbox',
    '[attr.aria-checked]': 'indeterminate() ? "mixed" : checked()',
    '[attr.aria-disabled]': 'disabled()',
    '[attr.aria-label]': 'ariaLabel() || label()',
  },
  template: `
    <span
      class="checkbox-box relative mt-0.5 inline-flex shrink-0 items-center justify-center transition-all duration-normal"
      [class]="boxClasses()"
      [style.box-shadow]="boxShadow()"
    >
      <!-- Check mark SVG -->
      @if (checked() && !indeterminate()) {
        <svg viewBox="0 0 12 12" fill="none" class="h-3.5 w-3.5 text-white" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M2.5 6L5 8.5L9.5 3.5" class="animate-check" />
        </svg>
      }
      @if (indeterminate()) {
        <svg viewBox="0 0 12 12" fill="none" class="h-3.5 w-3.5 text-white" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
          <path d="M3 6H9" />
        </svg>
      }
    </span>
    @if (label() || description()) {
      <div class="min-w-0">
        @if (label()) {
          <span class="block text-sm font-medium text-[var(--text-primary)]">{{ label() }}</span>
        }
        @if (description()) {
          <span class="block text-xs text-[var(--text-tertiary)] mt-0.5 leading-relaxed">{{ description() }}</span>
        }
      </div>
    }
  `,
  styles: `
    :host([aria-disabled='true']) {
      opacity: 0.4;
      cursor: not-allowed;
      pointer-events: none;
    }

    :host:hover .checkbox-box {
      transform: scale(1.05);
    }

    :host:active .checkbox-box {
      animation: spring-scale 0.35s ease-out;
    }

    @keyframes check-draw {
      from { stroke-dashoffset: 14; }
      to   { stroke-dashoffset: 0; }
    }
    .animate-check {
      stroke-dasharray: 14;
      animation: check-draw 0.25s cubic-bezier(0.4, 0, 0.2, 1) forwards;
    }
  `,
})
export class CheckboxComponent {
  readonly checked = model(false);
  readonly indeterminate = input(false);
  readonly label = input('');
  readonly description = input<string | null>(null);
  readonly disabled = input(false);
  readonly ariaLabel = input<string | null>(null);

  protected readonly boxClasses = computed(() => {
    const on = this.checked() || this.indeterminate();
    const base = 'w-[22px] h-[22px] rounded-md';
    return on
      ? `${base} bg-system-blue border-2 border-system-blue`
      : `${base} border-2 border-[var(--border-opaque)] bg-transparent hover:border-system-blue hover:bg-[var(--interactive-tint)]`;
  });

  protected readonly boxShadow = computed(() => {
    const on = this.checked() || this.indeterminate();
    return on ? 'var(--form-control-glow)' : 'none';
  });

  protected toggle(): void {
    if (this.disabled()) return;
    this.checked.update((v) => !v);
  }
}
