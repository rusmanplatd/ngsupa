import { Component, inject, signal, computed, Service } from '@angular/core';
import { LucideDynamicIcon } from '@lucide/angular';
import {
  trigger,
  style,
  animate,
  transition,
  query,
  stagger,
} from '@angular/animations';

export type ToastVariant = 'info' | 'success' | 'warning' | 'error';

export interface Toast {
  id: string;
  message: string;
  variant: ToastVariant;
  duration: number;
}

@Service()
export class ToastService {
  private readonly _queue = signal<Toast[]>([]);
  readonly queue = this._queue.asReadonly();
  readonly current = computed(() => this._queue()[0] ?? null);

  show(message: string, variant: ToastVariant = 'info', duration = 4000): void {
    const id = Math.random().toString(36).slice(2, 9);
    this._queue.update((q) => [...q, { id, message, variant, duration }]);

    if (duration > 0) {
      setTimeout(() => this.dismiss(id), duration);
    }
  }

  dismiss(id: string): void {
    this._queue.update((q) => q.filter((t) => t.id !== id));
  }

  success(message: string, duration?: number): void {
    this.show(message, 'success', duration);
  }

  error(message: string, duration?: number): void {
    this.show(message, 'error', duration ?? 6000);
  }

  warning(message: string, duration?: number): void {
    this.show(message, 'warning', duration);
  }

  info(message: string, duration?: number): void {
    this.show(message, 'info', duration);
  }
}

@Component({
  selector: 'app-toast-container',
  imports: [LucideDynamicIcon],
  host: {
    class: 'fixed top-4 left-1/2 -translate-x-1/2 z-[9999] flex flex-col gap-2 pointer-events-none',
    'aria-live': 'polite',
    'aria-atomic': 'false',
  },
  animations: [
    trigger('toastAnim', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(-12px) scale(0.96)' }),
        animate(
          '250ms cubic-bezier(0.2, 0, 0, 1)',
          style({ opacity: 1, transform: 'translateY(0) scale(1)' })
        ),
      ]),
      transition(':leave', [
        animate(
          '200ms cubic-bezier(0.4, 0, 1, 1)',
          style({ opacity: 0, transform: 'translateY(-8px) scale(0.96)' })
        ),
      ]),
    ]),
  ],
  template: `
    @for (toast of toastService.queue(); track toast.id) {
      <div
        @toastAnim
        class="pointer-events-auto flex items-center gap-3 rounded-xl px-5 py-3 shadow-lg backdrop-blur-xl border min-w-[320px] max-w-[480px]"
        [class]="variantClasses(toast.variant)"
        role="alert"
        [attr.aria-label]="variantLabel(toast.variant) + ': ' + toast.message"
      >
        <svg [lucideIcon]="variantIcon(toast.variant)" [size]="18" class="shrink-0" aria-hidden="true" />
        <span class="flex-1 text-sm font-medium">{{ toast.message }}</span>
        <button
          type="button"
          class="shrink-0 rounded-md p-0.5 opacity-60 hover:opacity-100 transition-opacity"
          aria-label="Dismiss notification"
          (click)="toastService.dismiss(toast.id)"
        >
          <svg lucideIcon="x" [size]="14" />
        </button>
      </div>
    }
  `,
})
export class ToastContainerComponent {
  protected readonly toastService = inject(ToastService);

  protected variantClasses(variant: ToastVariant): string {
    switch (variant) {
      case 'success':
        return 'bg-[var(--glass-bg-thick)] border-system-green/30 text-system-green';
      case 'error':
        return 'bg-[var(--glass-bg-thick)] border-system-red/30 text-system-red';
      case 'warning':
        return 'bg-[var(--glass-bg-thick)] border-system-orange/30 text-system-orange';
      default:
        return 'bg-[var(--glass-bg-thick)] border-system-blue/30 text-system-blue';
    }
  }

  protected variantIcon(variant: ToastVariant): string {
    switch (variant) {
      case 'success': return 'check-circle';
      case 'error': return 'x-circle';
      case 'warning': return 'alert-triangle';
      default: return 'info';
    }
  }

  protected variantLabel(variant: ToastVariant): string {
    switch (variant) {
      case 'success': return 'Success';
      case 'error': return 'Error';
      case 'warning': return 'Warning';
      default: return 'Info';
    }
  }
}
