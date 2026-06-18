import { Component, input, computed } from '@angular/core';
import { SpinnerComponent } from '../spinner/spinner';

export type ButtonVariant = 'filled' | 'tinted' | 'plain' | 'destructive';
export type ButtonSize = 'sm' | 'md' | 'lg';

@Component({
  selector: 'button[appButton], a[appButton]',
  imports: [SpinnerComponent],
  host: {
    '[class]': 'hostClasses()',
    '[attr.disabled]': 'isDisabled() || null',
    '[attr.aria-busy]': 'loading()',
  },
  template: `
    @if (loading()) {
      <app-spinner size="sm" />
    }
    <span class="inline-flex items-center gap-1.5" [class.opacity-0]="loading()">
      <ng-content />
    </span>
  `,
  styles: `
    :host {
      position: relative;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 0.375rem;
      font-weight: 600;
      border: none;
      cursor: pointer;
      user-select: none;
      transition-property: background-color, color, transform, box-shadow, opacity;
      transition-duration: var(--duration-fast);
      transition-timing-function: ease-out;
      text-decoration: none;
      white-space: nowrap;
      font-family: inherit;
      line-height: 1;
    }

    :host(:active:not([disabled])) {
      transform: scale(0.97);
    }

    :host([disabled]) {
      opacity: 0.4;
      cursor: not-allowed;
      pointer-events: none;
    }

    app-spinner {
      position: absolute;
    }
  `,
})
export class ButtonComponent {
  readonly variant = input<ButtonVariant>('filled');
  readonly size = input<ButtonSize>('md');
  readonly loading = input(false);
  readonly disabled = input(false);

  protected readonly isDisabled = computed(() => this.disabled() || this.loading());

  protected readonly hostClasses = computed(() => {
    const v = this.variant();
    const s = this.size();

    const sizeClasses: Record<ButtonSize, string> = {
      sm: 'px-3 py-1.5 text-sm rounded-lg',
      md: 'px-5 py-2.5 text-sm rounded-xl',
      lg: 'px-6 py-3 text-base rounded-xl',
    };

    const variantClasses: Record<ButtonVariant, string> = {
      filled:
        'bg-system-blue text-white hover:bg-system-blue-hover shadow-xs',
      tinted:
        'bg-[var(--interactive-tint)] text-system-blue hover:bg-[var(--interactive-tint-hover)]',
      plain:
        'bg-transparent text-system-blue hover:bg-[var(--fill-primary)]',
      destructive:
        'bg-system-red text-white hover:bg-system-red-hover shadow-xs',
    };

    return `${sizeClasses[s]} ${variantClasses[v]}`;
  });
}
