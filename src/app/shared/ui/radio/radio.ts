import { Component, model, input, computed, output, viewChildren, ElementRef } from '@angular/core';

export interface RadioOption {
  value: string;
  label: string;
  description?: string;
  disabled?: boolean;
}

@Component({
  selector: 'app-radio-group',
  host: {
    role: 'radiogroup',
    '[attr.aria-label]': 'ariaLabel()',
    class: 'block',
  },
  template: `
    <div [class]="layoutClasses()">
      @for (option of options(); track option.value; let i = $index) {
        <button
          #radioBtn
          type="button"
          role="radio"
          [attr.aria-checked]="value() === option.value"
          [attr.aria-disabled]="option.disabled || disabled()"
          [disabled]="option.disabled || disabled()"
          class="flex items-start gap-3 text-left transition-all duration-fast"
          [class]="itemClasses(option)"
          (click)="select(option.value)"
          (keydown.arrowDown)="focusNext(i)"
          (keydown.arrowUp)="focusPrev(i)"
          (keydown.arrowRight)="focusNext(i)"
          (keydown.arrowLeft)="focusPrev(i)"
        >
          <!-- Radio circle -->
          <span
            class="radio-circle relative mt-0.5 inline-flex shrink-0 items-center justify-center rounded-full border-2 transition-all duration-normal"
            [class]="circleClasses(option)"
            [style.box-shadow]="value() === option.value ? 'var(--form-control-glow)' : 'none'"
          >
            @if (value() === option.value) {
              <span class="block w-3 h-3 rounded-full bg-system-blue animate-radio-fill"></span>
            }
          </span>
          <div class="min-w-0">
            <span class="block text-sm font-medium text-[var(--text-primary)]">{{ option.label }}</span>
            @if (option.description) {
              <span class="block text-xs text-[var(--text-tertiary)] mt-0.5 leading-relaxed">{{ option.description }}</span>
            }
          </div>
        </button>
      }
    </div>
  `,
  styles: `
    @keyframes radio-fill-in {
      0%   { transform: scale(0); }
      50%  { transform: scale(1.2); }
      100% { transform: scale(1); }
    }
    .animate-radio-fill {
      animation: radio-fill-in 0.25s var(--ease-spring);
    }

    button:not(:disabled):hover .radio-circle {
      transform: scale(1.08);
    }

    button:not(:disabled):active .radio-circle {
      animation: spring-scale-sm 0.25s ease-out;
    }
  `,
})
export class RadioGroupComponent {
  readonly options = input.required<RadioOption[]>();
  readonly value = model.required<string>();
  readonly orientation = input<'vertical' | 'horizontal'>('vertical');
  readonly variant = input<'default' | 'card'>('default');
  readonly disabled = input(false);
  readonly ariaLabel = input('');

  private readonly radioBtns = viewChildren<ElementRef<HTMLButtonElement>>('radioBtn');

  protected readonly layoutClasses = computed(() => {
    if (this.orientation() === 'horizontal') {
      return 'flex flex-wrap gap-4';
    }
    if (this.variant() === 'card') {
      return 'space-y-2';
    }
    return 'space-y-2';
  });

  protected itemClasses(option: RadioOption): string {
    const isDisabled = option.disabled || this.disabled();
    const isSelected = this.value() === option.value;

    if (isDisabled) {
      return 'opacity-40 cursor-not-allowed';
    }

    if (this.variant() === 'card') {
      const base = 'w-full rounded-xl px-4 py-3 border transition-all duration-normal';
      if (isSelected) {
        return `${base} border-system-blue bg-[var(--interactive-tint)] cursor-pointer`;
      }
      return `${base} border-[var(--border-default)] bg-[var(--fill-primary)] hover:border-[var(--border-opaque)] hover:bg-[var(--fill-secondary)] cursor-pointer`;
    }

    return 'cursor-pointer';
  }

  protected circleClasses(option: RadioOption): string {
    const isSelected = this.value() === option.value;
    const base = 'w-[22px] h-[22px]';
    return isSelected
      ? `${base} border-system-blue`
      : `${base} border-[var(--border-opaque)] hover:border-system-blue`;
  }

  protected select(val: string): void {
    this.value.set(val);
  }

  protected focusNext(current: number): void {
    const opts = this.options();
    let next = (current + 1) % opts.length;
    while (opts[next].disabled && next !== current) {
      next = (next + 1) % opts.length;
    }
    this.value.set(opts[next].value);
    this.radioBtns()[next]?.nativeElement.focus();
  }

  protected focusPrev(current: number): void {
    const opts = this.options();
    let prev = (current - 1 + opts.length) % opts.length;
    while (opts[prev].disabled && prev !== current) {
      prev = (prev - 1 + opts.length) % opts.length;
    }
    this.value.set(opts[prev].value);
    this.radioBtns()[prev]?.nativeElement.focus();
  }
}
