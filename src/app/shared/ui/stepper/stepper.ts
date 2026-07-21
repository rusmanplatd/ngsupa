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
      role="spinbutton"
      [attr.aria-valuenow]="value()"
      [attr.aria-valuemin]="min() ?? undefined"
      [attr.aria-valuemax]="max() ?? undefined"
      [attr.aria-label]="label() || ariaLabel() || 'Stepper'"
      [attr.aria-disabled]="disabled() || null"
      tabindex="0"
      (keydown)="onKeydown($event)"
    >
      <!-- Decrement -->
      <button
        type="button"
        class="stepper-btn flex h-11 w-11 items-center justify-center text-[var(--stepper-accent)] transition-all duration-fast hover:bg-[var(--fill-primary)] active:bg-[var(--fill-secondary)] active:scale-90 disabled:opacity-40 disabled:cursor-not-allowed"
        [disabled]="disabled() || atMin()"
        [attr.aria-label]="'Decrease ' + (label() || 'value')"
        (click)="decrement()"
        tabindex="-1"
      >
        <svg lucideIcon="minus" [size]="16" />
      </button>

      <!-- Separator -->
      <div class="w-px h-6 bg-[var(--separator)]"></div>

      <!-- Value display -->
      <span
        class="stepper-value inline-flex h-11 min-w-[3.5rem] items-center justify-center px-3 text-sm font-semibold tabular-nums text-[var(--text-primary)]"
        aria-hidden="true"
      >
        {{ value() }}
      </span>

      <!-- Separator -->
      <div class="w-px h-6 bg-[var(--separator)]"></div>

      <!-- Increment -->
      <button
        type="button"
        class="stepper-btn flex h-11 w-11 items-center justify-center text-[var(--stepper-accent)] transition-all duration-fast hover:bg-[var(--fill-primary)] active:bg-[var(--fill-secondary)] active:scale-90 disabled:opacity-40 disabled:cursor-not-allowed"
        [disabled]="disabled() || atMax()"
        [attr.aria-label]="'Increase ' + (label() || 'value')"
        (click)="increment()"
        tabindex="-1"
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

    /* Focus ring on the spinbutton container */
    .stepper-container:focus-visible {
      outline: 2px solid var(--focus-ring);
      outline-offset: 2px;
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

  /** Large step for PageUp/PageDown: 10× step or at least 10. */
  private readonly largeStep = computed(() => Math.max(this.step() * 10, 10));

  protected readonly atMin = computed(() => {
    const m = this.min();
    return m !== null && this.value() <= m;
  });

  protected readonly atMax = computed(() => {
    const m = this.max();
    return m !== null && this.value() >= m;
  });

  /** Keyboard bindings per ARIA spinbutton pattern. */
  protected onKeydown(event: KeyboardEvent): void {
    if (this.disabled()) return;

    switch (event.key) {
      case 'ArrowUp':
        event.preventDefault();
        this.increment();
        break;
      case 'ArrowDown':
        event.preventDefault();
        this.decrement();
        break;
      case 'PageUp':
        event.preventDefault();
        this.incrementBy(this.largeStep());
        break;
      case 'PageDown':
        event.preventDefault();
        this.decrementBy(this.largeStep());
        break;
      case 'Home': {
        event.preventDefault();
        const minVal = this.min();
        if (minVal !== null) this.value.set(minVal);
        break;
      }
      case 'End': {
        event.preventDefault();
        const maxVal = this.max();
        if (maxVal !== null) this.value.set(maxVal);
        break;
      }
    }
  }

  protected increment(): void {
    this.incrementBy(this.step());
  }

  protected decrement(): void {
    this.decrementBy(this.step());
  }

  private incrementBy(amount: number): void {
    if (this.disabled()) return;
    const next = this.value() + amount;
    const m = this.max();
    this.value.set(m !== null ? Math.min(next, m) : next);
  }

  private decrementBy(amount: number): void {
    if (this.disabled()) return;
    const next = this.value() - amount;
    const m = this.min();
    this.value.set(m !== null ? Math.max(next, m) : next);
  }
}
