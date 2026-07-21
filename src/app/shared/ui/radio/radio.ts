import { Component, model, input, computed, output, viewChildren, ElementRef, forwardRef, signal } from '@angular/core';
import {
  ControlValueAccessor,
  NG_VALUE_ACCESSOR,
} from '@angular/forms';

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
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => RadioGroupComponent),
      multi: true,
    },
  ],
  template: `
    <div [class]="layoutClasses()">
      @for (option of options(); track option.value; let i = $index) {
        <button
          #radioBtn
          type="button"
          role="radio"
          [attr.aria-checked]="internalValue() === option.value"
          [attr.aria-disabled]="option.disabled || isDisabled()"
          [disabled]="option.disabled || isDisabled()"
          class="flex items-start gap-3 text-left transition-all duration-fast"
          [class]="itemClasses(option)"
          (click)="select(option.value)"
          (blur)="onBlur()"
          (keydown.arrowDown)="focusNext(i)"
          (keydown.arrowUp)="focusPrev(i)"
          (keydown.arrowRight)="focusNext(i)"
          (keydown.arrowLeft)="focusPrev(i)"
        >
          <!-- Radio circle -->
          <span
            class="radio-circle relative mt-0.5 inline-flex shrink-0 items-center justify-center rounded-full border-2 transition-all duration-normal"
            [class]="circleClasses(option)"
            [style.box-shadow]="internalValue() === option.value ? 'var(--form-control-glow)' : 'none'"
          >
            @if (internalValue() === option.value) {
              <span class="block w-3 h-3 rounded-full bg-[var(--radio-checked-fill)] animate-radio-fill"></span>
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
export class RadioGroupComponent implements ControlValueAccessor {
  readonly options = input.required<RadioOption[]>();
  readonly value = model.required<string>();
  readonly orientation = input<'vertical' | 'horizontal'>('vertical');
  readonly variant = input<'default' | 'card'>('default');
  readonly disabled = input(false);
  readonly ariaLabel = input('');

  /** Internal value signal — single source of truth for both model() and CVA. */
  protected readonly internalValue = signal('');
  private readonly isDisabledCva = signal(false);

  private readonly radioBtns = viewChildren<ElementRef<HTMLButtonElement>>('radioBtn');

  protected readonly isDisabled = computed(
    () => this.disabled() || this.isDisabledCva()
  );

  // ── ControlValueAccessor ────────────────────────────────────
  private onChange: (val: string) => void = () => {};
  private onTouchedFn: () => void = () => {};

  writeValue(value: string): void {
    const v = value ?? '';
    this.internalValue.set(v);
    this.value.set(v);
  }

  registerOnChange(fn: (val: string) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouchedFn = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.isDisabledCva.set(isDisabled);
  }

  protected onBlur(): void {
    this.onTouchedFn();
  }

  // ── Layout & styling ────────────────────────────────────────

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
    const isItemDisabled = option.disabled || this.isDisabled();
    const isSelected = this.internalValue() === option.value;

    if (isItemDisabled) {
      return 'opacity-40 cursor-not-allowed';
    }

    if (this.variant() === 'card') {
      const base = 'w-full rounded-xl px-4 py-3 border transition-all duration-normal';
      if (isSelected) {
        return `${base} border-[var(--radio-checked-border)] bg-[var(--radio-container-checked)] cursor-pointer`;
      }
      return `${base} border-[var(--border-default)] bg-[var(--fill-primary)] hover:border-[var(--border-opaque)] hover:bg-[var(--fill-secondary)] cursor-pointer`;
    }

    return 'cursor-pointer';
  }

  protected circleClasses(option: RadioOption): string {
    const isSelected = this.internalValue() === option.value;
    const base = 'w-[22px] h-[22px]';
    return isSelected
      ? `${base} border-[var(--radio-checked-border)]`
      : `${base} border-[var(--border-opaque)] hover:border-[var(--radio-unchecked-border-hover)]`;
  }

  protected select(val: string): void {
    this.internalValue.set(val);
    this.value.set(val);
    this.onChange(val);
    this.onTouchedFn();
  }

  protected focusNext(current: number): void {
    const opts = this.options();
    let next = (current + 1) % opts.length;
    while (opts[next].disabled && next !== current) {
      next = (next + 1) % opts.length;
    }
    this.select(opts[next].value);
    this.radioBtns()[next]?.nativeElement.focus();
  }

  protected focusPrev(current: number): void {
    const opts = this.options();
    let prev = (current - 1 + opts.length) % opts.length;
    while (opts[prev].disabled && prev !== current) {
      prev = (prev - 1 + opts.length) % opts.length;
    }
    this.select(opts[prev].value);
    this.radioBtns()[prev]?.nativeElement.focus();
  }
}
