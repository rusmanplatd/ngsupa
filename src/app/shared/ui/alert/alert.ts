import { Component, input, output, signal, computed } from '@angular/core';
import { LucideDynamicIcon } from '@lucide/angular';

export type AlertVariant = 'info' | 'success' | 'warning' | 'error';

@Component({
  selector: 'app-alert',
  imports: [LucideDynamicIcon],
  host: {
    role: 'alert',
    '[attr.aria-live]': 'variant() === "error" ? "assertive" : "polite"',
    '[class]': 'hostClasses()',
  },
  template: `
    @if (!dismissed()) {
      <div class="flex gap-3 px-4 py-3.5">
        <svg [lucideIcon]="iconName()" [size]="18" class="mt-0.5 shrink-0" />
        <div class="flex-1 min-w-0">
          @if (title()) {
            <p class="text-sm font-semibold">{{ title() }}</p>
          }
          @if (message()) {
            <p class="text-sm" [class.mt-0.5]="title()">{{ message() }}</p>
          }
          <ng-content />
        </div>
        @if (dismissible()) {
          <button
            type="button"
            class="shrink-0 self-start rounded-md p-0.5 opacity-60 hover:opacity-100 transition-opacity"
            aria-label="Dismiss alert"
            (click)="dismiss()"
          >
            <svg lucideIcon="x" [size]="14" />
          </button>
        }
      </div>
    }
  `,
  styles: `
    :host {
      display: block;
      border-radius: var(--radius-lg);
      border-left: 3px solid;
      overflow: hidden;
      animation: scale-in 0.25s var(--ease-default);
    }
  `,
})
export class AlertComponent {
  readonly variant = input<AlertVariant>('info');
  readonly title = input<string | null>(null);
  readonly message = input<string | null>(null);
  readonly dismissible = input(false);
  readonly icon = input<string | null>(null);

  readonly dismissed = signal(false);
  readonly close = output<void>();

  protected readonly iconName = computed(() => {
    if (this.icon()) return this.icon()!;
    switch (this.variant()) {
      case 'success': return 'check';
      case 'warning': return 'alert-triangle';
      case 'error': return 'x';
      default: return 'info';
    }
  });

  protected readonly hostClasses = computed(() => {
    if (this.dismissed()) return 'hidden';
    switch (this.variant()) {
      case 'success':
        return 'bg-[var(--alert-success-bg)] text-[var(--alert-success-color)] border-l-[var(--alert-success-border)]';
      case 'warning':
        return 'bg-[var(--alert-warning-bg)] text-[var(--alert-warning-color)] border-l-[var(--alert-warning-border)]';
      case 'error':
        return 'bg-[var(--alert-error-bg)] text-[var(--alert-error-color)] border-l-[var(--alert-error-border)]';
      default:
        return 'bg-[var(--alert-info-bg)] text-[var(--alert-info-color)] border-l-[var(--alert-info-border)]';
    }
  });

  protected dismiss(): void {
    this.dismissed.set(true);
    this.close.emit();
  }
}
