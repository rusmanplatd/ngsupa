import { Component, input, effect, inject, untracked } from '@angular/core';
import { LiveAnnouncer } from '@angular/cdk/a11y';

@Component({
  selector: 'app-spinner',
  host: {
    role: 'status',
    class: 'inline-flex items-center justify-center',
  },
  template: `
    <svg
      [attr.width]="sizeMap[size()]"
      [attr.height]="sizeMap[size()]"
      viewBox="0 0 24 24"
      fill="none"
      class="animate-spin"
    >
      <circle
        cx="12" cy="12" r="10"
        stroke="currentColor"
        stroke-width="3"
        opacity="0.2"
      />
      <path
        d="M12 2a10 10 0 0 1 10 10"
        stroke="currentColor"
        stroke-width="3"
        stroke-linecap="round"
      />
    </svg>
    <span class="sr-only">{{ loading() ? (loadingLabel() || 'Loading…') : '' }}</span>
  `,
  styles: `
    :host {
      color: var(--text-tertiary);
    }
    .sr-only {
      position: absolute;
      width: 1px;
      height: 1px;
      padding: 0;
      margin: -1px;
      overflow: hidden;
      clip: rect(0 0 0 0);
      white-space: nowrap;
      border-width: 0;
    }
  `,
})
export class SpinnerComponent {
  readonly size = input<'sm' | 'md' | 'lg'>('md');

  /** Whether the spinner is actively loading. When set to false after being true, doneMessage is announced. */
  readonly loading = input(true);

  /** Text announced via screen reader while spinner is active. */
  readonly loadingLabel = input<string | null>(null);

  /** Message announced to screen readers when loading completes (i.e. loading goes from true to false). */
  readonly doneMessage = input<string | null>(null);

  protected readonly sizeMap: Record<string, number> = {
    sm: 16,
    md: 24,
    lg: 36,
  };

  private readonly liveAnnouncer = inject(LiveAnnouncer);
  private previousLoading = true;

  constructor() {
    // Detect transition from loading → done and announce to screen readers.
    // untracked() breaks the reactive cycle caused by liveAnnouncer triggering CD.
    effect(() => {
      const isLoading = this.loading();
      untracked(() => {
        if (this.previousLoading && !isLoading) {
          const msg = this.doneMessage();
          if (msg) {
            this.liveAnnouncer.announce(msg, 'polite');
          }
        }
        this.previousLoading = isLoading;
      });
    });
  }
}
