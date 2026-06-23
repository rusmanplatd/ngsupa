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
        return 'bg-system-green-light text-system-green border-l-system-green';
      case 'warning':
        return 'bg-system-orange-light text-system-orange border-l-system-orange';
      case 'error':
        return 'bg-system-red-light text-system-red border-l-system-red';
      default:
        return 'bg-system-blue-light text-system-blue border-l-system-blue';
    }
  });

  protected dismiss(): void {
    this.dismissed.set(true);
    this.close.emit();
  }
}
