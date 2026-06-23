import { Component, Service, inject, input, signal, computed } from '@angular/core';
import { Dialog, DialogRef, DIALOG_DATA } from '@angular/cdk/dialog';
import { Observable, Subject } from 'rxjs';
import { ButtonComponent } from '../button/button';
import { LucideDynamicIcon } from '@lucide/angular';

export interface ConfirmDialogConfig {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  icon?: string;
}

@Service()
export class ConfirmDialogService {
  private readonly dialog = inject(Dialog);

  confirm(config: ConfirmDialogConfig): Observable<boolean> {
    const result$ = new Subject<boolean>();

    const ref = this.dialog.open<boolean>(ConfirmDialogPanelComponent, {
      data: config,
      width: '340px',
      maxWidth: '90vw',
      panelClass: 'app-modal-panel',
      backdropClass: 'app-modal-backdrop',
      hasBackdrop: true,
      disableClose: true,
      autoFocus: 'first-tabbable',
    });

    ref.closed.subscribe((val) => {
      result$.next(!!val);
      result$.complete();
    });

    return result$.asObservable();
  }
}

@Component({
  selector: 'app-confirm-dialog-panel',
  imports: [LucideDynamicIcon],
  host: {
    class: 'block',
    role: 'alertdialog',
    'aria-modal': 'true',
  },
  template: `
    <div class="rounded-2xl bg-[var(--surface-elevated)] shadow-xl overflow-hidden">
      <div class="px-6 pt-6 pb-4 text-center">
        @if (config.icon) {
          <div class="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full"
            [class]="config.destructive ? 'bg-system-red-light' : 'bg-system-blue-light'"
          >
            <svg
              [lucideIcon]="config.icon"
              [size]="22"
              [class]="config.destructive ? 'text-system-red' : 'text-system-blue'"
            />
          </div>
        }
        <h2 class="text-base font-semibold text-[var(--text-primary)]">
          {{ config.title }}
        </h2>
        <p class="mt-1.5 text-sm text-[var(--text-secondary)]">
          {{ config.message }}
        </p>
      </div>

      <!-- Actions -->
      <div class="border-t border-[var(--separator)] flex">
        <button
          type="button"
          class="flex-1 py-3 text-center text-base font-medium text-system-blue transition-colors hover:bg-[var(--fill-primary)] active:bg-[var(--fill-secondary)] border-r border-[var(--separator)]"
          (click)="cancel()"
        >
          {{ config.cancelLabel || 'Cancel' }}
        </button>
        <button
          type="button"
          class="flex-1 py-3 text-center text-base font-semibold transition-colors hover:bg-[var(--fill-primary)] active:bg-[var(--fill-secondary)]"
          [class]="config.destructive ? 'text-system-red' : 'text-system-blue'"
          (click)="confirmAction()"
        >
          {{ config.confirmLabel || 'Confirm' }}
        </button>
      </div>
    </div>
  `,
})
export class ConfirmDialogPanelComponent {
  readonly config: ConfirmDialogConfig;
  private readonly dialogRef: DialogRef<boolean>;

  constructor() {
    this.dialogRef = inject(DialogRef<boolean>);
    this.config = inject(DIALOG_DATA);
  }

  protected cancel(): void {
    this.dialogRef.close(false);
  }

  protected confirmAction(): void {
    this.dialogRef.close(true);
  }
}
