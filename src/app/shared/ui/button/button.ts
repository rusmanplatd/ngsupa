import { Component, input, computed } from '@angular/core';
import { SpinnerComponent } from '../spinner/spinner';

export type ButtonVariant = 'filled' | 'tinted' | 'plain' | 'destructive' | 'ghost' | 'gray';
export type ButtonSize = 'sm' | 'md' | 'lg' | 'icon';

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
      transition-property: background-color, color, transform, box-shadow, opacity, border-color;
      transition-duration: var(--duration-fast);
      transition-timing-function: cubic-bezier(0.2, 0, 0, 1);
      text-decoration: none;
      white-space: nowrap;
      font-family: inherit;
      line-height: 1;
    }

    :host(:active:not([disabled])) {
      transform: scale(0.96);
      transition-duration: 50ms;
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
  readonly rounded = input(false);

  protected readonly isDisabled = computed(() => this.disabled() || this.loading());

  protected readonly hostClasses = computed(() => {
    const v = this.variant();
    const s = this.size();
    const pill = this.rounded();

    const sizeClasses: Record<ButtonSize, string> = {
      sm: `px-3 py-1.5 text-sm ${pill ? 'rounded-full' : 'rounded-lg'}`,
      md: `px-5 py-2.5 text-sm ${pill ? 'rounded-full' : 'rounded-xl'}`,
      lg: `px-6 py-3 text-base ${pill ? 'rounded-full' : 'rounded-xl'}`,
      icon: `p-2.5 ${pill ? 'rounded-full' : 'rounded-xl'}`,
    };

    const variantClasses: Record<ButtonVariant, string> = {
      filled:
        'bg-system-blue text-white hover:bg-system-blue-hover active:bg-system-blue-active shadow-xs',
      tinted:
        'bg-[var(--interactive-tint)] text-system-blue hover:bg-[var(--interactive-tint-hover)]',
      plain:
        'bg-transparent text-system-blue hover:bg-[var(--fill-primary)]',
      destructive:
        'bg-system-red text-white hover:bg-system-red-hover active:bg-system-red-active shadow-xs',
      ghost:
        'bg-transparent text-[var(--text-secondary)] border border-transparent hover:border-[var(--border-default)] hover:bg-[var(--fill-primary)]',
      gray:
        'bg-[var(--fill-secondary)] text-[var(--text-primary)] hover:bg-[var(--fill-primary)] active:bg-[var(--fill-tertiary)]',
    };

    return `${sizeClasses[s]} ${variantClasses[v]}`;
  });
}
