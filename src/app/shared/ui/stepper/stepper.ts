import { Component, input, model, computed } from '@angular/core';
import { LucideDynamicIcon } from '@lucide/angular';

@Component({
  selector: 'app-stepper',
  imports: [LucideDynamicIcon],
  host: {
    class: 'inline-flex items-center',
    role: 'group',
    '[attr.aria-label]': 'label() || ariaLabel() || "Stepper"',
  },
  template: `
    @if (label()) {
      <span class="mr-3 text-sm font-medium text-[var(--text-primary)]">{{ label() }}</span>
    }
    <div
      class="stepper-container inline-flex items-center rounded-xl border border-[var(--border-default)] overflow-hidden backdrop-blur-sm transition-all duration-fast"
      [class.opacity-40]="disabled()"
      [style.background]="'var(--form-field-glass)'"
      [style.box-shadow]="'var(--form-field-shadow)'"
    >
      <!-- Decrement -->
      <button
        type="button"
        class="stepper-btn flex h-11 w-11 items-center justify-center text-system-blue transition-all duration-fast hover:bg-[var(--fill-primary)] active:bg-[var(--fill-secondary)] active:scale-90 disabled:opacity-40 disabled:cursor-not-allowed"
        [disabled]="disabled() || atMin()"
        [attr.aria-label]="'Decrease ' + (label() || 'value')"
        (click)="decrement()"
      >
        <svg lucideIcon="minus" [size]="16" />
      </button>

      <!-- Separator -->
      <div class="w-px h-6 bg-[var(--separator)]"></div>

      <!-- Value display -->
      <span
        class="stepper-value inline-flex h-11 min-w-[3.5rem] items-center justify-center px-3 text-sm font-semibold tabular-nums text-[var(--text-primary)]"
        aria-live="polite"
      >
        {{ value() }}
      </span>

      <!-- Separator -->
      <div class="w-px h-6 bg-[var(--separator)]"></div>

      <!-- Increment -->
      <button
        type="button"
        class="stepper-btn flex h-11 w-11 items-center justify-center text-system-blue transition-all duration-fast hover:bg-[var(--fill-primary)] active:bg-[var(--fill-secondary)] active:scale-90 disabled:opacity-40 disabled:cursor-not-allowed"
        [disabled]="disabled() || atMax()"
        [attr.aria-label]="'Increase ' + (label() || 'value')"
        (click)="increment()"
      >
        <svg lucideIcon="plus" [size]="16" />
      </button>
    </div>
  `,
  styles: `
    .stepper-btn {
      transition-timing-function: var(--ease-spring);
    }

    .stepper-value {
      animation: slide-up-value 0.15s var(--ease-default);
    }
  `,
})
export class StepperComponent {
  readonly value = model(0);
  readonly min = input<number | null>(null);
  readonly max = input<number | null>(null);
  readonly step = input(1);
  readonly label = input<string | null>(null);
  readonly ariaLabel = input<string | null>(null);
  readonly disabled = input(false);

  protected readonly atMin = computed(() => {
    const m = this.min();
    return m !== null && this.value() <= m;
  });

  protected readonly atMax = computed(() => {
    const m = this.max();
    return m !== null && this.value() >= m;
  });

  protected increment(): void {
    if (this.disabled()) return;
    const next = this.value() + this.step();
    const m = this.max();
    this.value.set(m !== null ? Math.min(next, m) : next);
  }

  protected decrement(): void {
    if (this.disabled()) return;
    const next = this.value() - this.step();
    const m = this.min();
    this.value.set(m !== null ? Math.max(next, m) : next);
  }
}
