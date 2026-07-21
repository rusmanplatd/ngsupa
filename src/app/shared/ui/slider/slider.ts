import { Component, input, model, computed, signal, viewChild, ElementRef, effect, untracked, forwardRef } from '@angular/core';
import {
  ControlValueAccessor,
  NG_VALUE_ACCESSOR,
} from '@angular/forms';

@Component({
  selector: 'app-slider',
  host: {
    class: 'block',
    '[attr.aria-label]': 'label() || ariaLabel()',
  },
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => SliderComponent),
      multi: true,
    },
  ],
  template: `
    @if (label() || showValue()) {
      <div class="flex items-center justify-between mb-2">
        @if (label()) {
          <label [for]="inputId()" class="text-sm font-medium text-[var(--text-primary)]">
            {{ label() }}
          </label>
        }
        @if (showValue()) {
          <span class="text-sm font-semibold tabular-nums text-[var(--slider-value-color)] min-w-[3ch] text-right">
            {{ displayValue() }}
          </span>
        }
      </div>
    }

    <div class="relative flex items-center gap-3">
      @if (minLabel()) {
        <span class="shrink-0 text-xs text-[var(--text-tertiary)]">{{ minLabel() }}</span>
      }
      <div class="relative flex-1">
        <input
          #sliderEl
          type="range"
          [id]="inputId()"
          [min]="min()"
          [max]="max()"
          [step]="step()"
          [value]="internalValue()"
          [disabled]="isDisabled()"
          (input)="onInput($event)"
          (blur)="onBlur()"
          class="slider-input w-full"
          [attr.aria-valuemin]="min()"
          [attr.aria-valuemax]="max()"
          [attr.aria-valuenow]="internalValue()"
          [attr.aria-valuetext]="displayValue()"
        />
      </div>
      @if (maxLabel()) {
        <span class="shrink-0 text-xs text-[var(--text-tertiary)]">{{ maxLabel() }}</span>
      }
    </div>
  `,
  styles: `
    .slider-input {
      -webkit-appearance: none;
      appearance: none;
      height: 6px;
      border-radius: 9999px;
      outline: none;
      cursor: pointer;
      background: linear-gradient(
        to right,
        var(--slider-track-fill) 0%,
        var(--slider-track-fill) var(--fill-pct, 0%),
        var(--fill-secondary, oklch(0% 0 0 / 0.06)) var(--fill-pct, 0%),
        var(--fill-secondary, oklch(0% 0 0 / 0.06)) 100%
      );
      transition: opacity var(--duration-fast);
    }

    .slider-input:disabled {
      opacity: 0.4;
      cursor: not-allowed;
    }

    /* Webkit thumb */
    .slider-input::-webkit-slider-thumb {
      -webkit-appearance: none;
      appearance: none;
      width: 26px;
      height: 26px;
      border-radius: 50%;
      background: linear-gradient(180deg, #ffffff 0%, #f8f8f8 100%);
      box-shadow:
        0 1px 4px oklch(0% 0 0 / 0.18),
        0 1px 2px oklch(0% 0 0 / 0.08),
        inset 0 1px 0 oklch(100% 0 0 / 0.5);
      border: 0.5px solid oklch(0% 0 0 / 0.04);
      cursor: pointer;
      transition:
        transform var(--duration-fast) var(--ease-spring),
        box-shadow var(--duration-fast);
    }

    .slider-input::-webkit-slider-thumb:hover {
      transform: scale(1.1);
      box-shadow:
        0 2px 8px oklch(0% 0 0 / 0.22),
        0 1px 3px oklch(0% 0 0 / 0.1),
        inset 0 1px 0 oklch(100% 0 0 / 0.5);
    }

    .slider-input::-webkit-slider-thumb:active {
      transform: scale(0.95);
      box-shadow:
        0 1px 4px oklch(0% 0 0 / 0.18),
        0 1px 2px oklch(0% 0 0 / 0.08),
        0 0 0 4px oklch(59% 0.24 264 / 0.15),
        inset 0 1px 0 oklch(100% 0 0 / 0.5);
    }

    /* Firefox thumb */
    .slider-input::-moz-range-thumb {
      width: 26px;
      height: 26px;
      border-radius: 50%;
      background: linear-gradient(180deg, #ffffff 0%, #f8f8f8 100%);
      box-shadow:
        0 1px 4px oklch(0% 0 0 / 0.18),
        0 1px 2px oklch(0% 0 0 / 0.08),
        inset 0 1px 0 oklch(100% 0 0 / 0.5);
      border: 0.5px solid oklch(0% 0 0 / 0.04);
      cursor: pointer;
    }

    .slider-input::-moz-range-track {
      height: 6px;
      border-radius: 9999px;
      background: transparent;
    }

    /* Unfilled track styling */
    .slider-input::-moz-range-progress {
      height: 6px;
      border-radius: 9999px;
      background: var(--slider-track-fill);
    }
  `,
})
export class SliderComponent implements ControlValueAccessor {
  readonly value = model(0);
  readonly min = input(0);
  readonly max = input(100);
  readonly step = input(1);
  readonly label = input<string | null>(null);
  readonly ariaLabel = input<string | null>(null);
  readonly minLabel = input<string | null>(null);
  readonly maxLabel = input<string | null>(null);
  readonly showValue = input(false);
  readonly disabled = input(false);
  readonly suffix = input('');
  readonly inputId = input('slider-' + Math.random().toString(36).slice(2, 9));

  private readonly sliderElRef = viewChild<ElementRef<HTMLInputElement>>('sliderEl');

  /** Internal value — single source of truth for both model() and CVA. */
  protected readonly internalValue = signal(0);
  private readonly isDisabledCva = signal(false);

  protected readonly isDisabled = computed(
    () => this.disabled() || this.isDisabledCva()
  );

  protected readonly displayValue = computed(() => {
    const v = this.internalValue();
    return this.suffix() ? `${v}${this.suffix()}` : `${v}`;
  });

  // ── ControlValueAccessor ────────────────────────────────────
  private onChange: (val: number) => void = () => { };
  private onTouchedFn: () => void = () => { };

  writeValue(value: number): void {
    const v = value ?? 0;
    this.internalValue.set(v);
    this.value.set(v);
  }

  registerOnChange(fn: (val: number) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouchedFn = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.isDisabledCva.set(isDisabled);
  }

  constructor() {
    // Keep the CSS --fill-pct custom property in sync with the slider value.
    // effect() tracks the reactive signals; untracked() writes to the DOM style
    // property (a pure side-effect) without creating a new reactive dependency.
    effect(() => {
      const val = this.internalValue();
      const min = this.min();
      const max = this.max();
      untracked(() => {
        const el = this.sliderElRef()?.nativeElement;
        if (!el) return;
        const pct = ((val - min) / (max - min)) * 100;
        el.style.setProperty('--fill-pct', `${pct}%`);
      });
    });
  }

  protected onInput(event: Event): void {
    const val = Number((event.target as HTMLInputElement).value);
    this.internalValue.set(val);
    this.value.set(val);
    this.onChange(val);
    this.updateFillPercentage();
  }

  protected onBlur(): void {
    this.onTouchedFn();
  }

  private updateFillPercentage(): void {
    const el = this.sliderElRef()?.nativeElement;
    if (!el) return;
    const pct = ((this.internalValue() - this.min()) / (this.max() - this.min())) * 100;
    el.style.setProperty('--fill-pct', `${pct}%`);
  }
}
