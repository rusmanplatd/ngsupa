import { Component, inject, input, output, signal, effect } from '@angular/core';
import { Dialog, DialogRef, DialogModule } from '@angular/cdk/dialog';
import { A11yModule, LiveAnnouncer } from '@angular/cdk/a11y';
import { Service } from '@angular/core';
import { LucideDynamicIcon } from '@lucide/angular';
import {
  trigger,
  style,
  animate,
  transition,
} from '@angular/animations';

@Service()
export class ModalService {
  private readonly dialog = inject(Dialog);

  open<T>(component: any, config?: { data?: T; width?: string }): DialogRef {
    return this.dialog.open(component, {
      data: config?.data,
      width: config?.width || '480px',
      maxWidth: '95vw',
      panelClass: 'app-modal-panel',
      backdropClass: 'app-modal-backdrop',
      hasBackdrop: true,
      disableClose: false,
    });
  }

  closeAll(): void {
    this.dialog.closeAll();
  }
}

@Component({
  selector: 'app-modal',
  imports: [LucideDynamicIcon, A11yModule],
  host: {
    class: 'block',
    role: 'dialog',
    'aria-modal': 'true',
    '[attr.aria-labelledby]': 'titleId()',
  },
  animations: [
    trigger('modalAnim', [
      transition(':enter', [
        style({ opacity: 0, transform: 'scale(0.95) translateY(-8px)' }),
        animate(
          '250ms cubic-bezier(0.2, 0, 0, 1)',
          style({ opacity: 1, transform: 'scale(1) translateY(0)' })
        ),
      ]),
      transition(':leave', [
        animate(
          '200ms cubic-bezier(0.4, 0, 1, 1)',
          style({ opacity: 0, transform: 'scale(0.96) translateY(-4px)' })
        ),
      ]),
    ]),
  ],
  template: `
    <div
      @modalAnim
      cdkTrapFocus
      cdkTrapFocusAutoCapture
      class="rounded-2xl bg-[var(--surface-elevated)] shadow-xl overflow-hidden max-h-[85vh] flex flex-col"
    >
      <!-- Header -->
      <div class="flex items-center justify-between border-b border-[var(--separator)] px-6 py-4">
        <h2 class="text-lg font-semibold text-[var(--text-primary)]" [id]="titleId()">
          {{ title() }}
        </h2>
        <button
          type="button"
          class="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--fill-secondary)] text-[var(--text-secondary)] hover:bg-[var(--fill-primary)] transition-colors duration-fast"
          aria-label="Close"
          (click)="closed.emit()"
        >
          <svg lucideIcon="x" [size]="16" />
        </button>
      </div>

      <!-- Body -->
      <div class="flex-1 overflow-y-auto px-6 py-5">
        <ng-content />
      </div>

      <!-- Footer -->
      <ng-content select="[modal-footer]" />
    </div>
  `,
})
export class ModalComponent {
  readonly title = input.required<string>();
  readonly titleId = input('modal-title-' + Math.random().toString(36).slice(2, 9));
  readonly closed = output<void>();
}
