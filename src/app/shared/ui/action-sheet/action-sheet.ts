import {
  Component,
  Service,
  inject,
  signal,
  output,
} from '@angular/core';
import { Overlay, OverlayRef } from '@angular/cdk/overlay';
import { ComponentPortal } from '@angular/cdk/portal';
import { A11yModule } from '@angular/cdk/a11y';
import { LucideDynamicIcon } from '@lucide/angular';

export interface ActionSheetAction {
  id: string;
  label: string;
  icon?: string;
  destructive?: boolean;
  disabled?: boolean;
}

export interface ActionSheetConfig {
  title?: string;
  message?: string;
  actions: ActionSheetAction[];
  cancelLabel?: string;
}

@Service()
export class ActionSheetService {
  private readonly overlay = inject(Overlay);
  private overlayRef: OverlayRef | null = null;

  open(config: ActionSheetConfig): Promise<string | null> {
    this.close();

    return new Promise<string | null>((resolve) => {
      const positionStrategy = this.overlay
        .position()
        .global()
        .centerHorizontally()
        .bottom('0');

      this.overlayRef = this.overlay.create({
        positionStrategy,
        scrollStrategy: this.overlay.scrollStrategies.block(),
        hasBackdrop: true,
        backdropClass: 'app-bottom-sheet-backdrop',
        width: '100%',
        maxWidth: '480px',
      });

      this.overlayRef.backdropClick().subscribe(() => {
        this.close();
        resolve(null);
      });

      this.overlayRef.keydownEvents().subscribe((event) => {
        if (event.key === 'Escape') {
          this.close();
          resolve(null);
        }
      });

      const portal = new ComponentPortal(ActionSheetPanelComponent);
      const ref = this.overlayRef.attach(portal);
      ref.instance.config.set(config);
      ref.instance.selected.subscribe((id: string | null) => {
        this.close();
        resolve(id);
      });
    });
  }

  close(): void {
    this.overlayRef?.detach();
    this.overlayRef?.dispose();
    this.overlayRef = null;
  }
}

@Component({
  selector: 'app-action-sheet-panel',
  imports: [LucideDynamicIcon, A11yModule],
  host: {
    class: 'block p-2',
    role: 'dialog',
    'aria-modal': 'true',
  },
  template: `
    <div
      class="action-sheet-content rounded-2xl bg-[var(--glass-bg-thick)] backdrop-blur-xl border border-[var(--glass-border)] overflow-hidden"
      cdkTrapFocus
      cdkTrapFocusAutoCapture="true"
    >
      <!-- Header -->
      @if (config().title || config().message) {
        <div class="px-4 py-3 text-center border-b border-[var(--separator)]">
          @if (config().title) {
            <p class="text-sm font-semibold text-[var(--text-primary)]">{{ config().title }}</p>
          }
          @if (config().message) {
            <p class="text-xs text-[var(--text-secondary)] mt-0.5">{{ config().message }}</p>
          }
        </div>
      }

      <!-- Actions -->
      <div class="py-1">
        @for (action of config().actions; track action.id) {
          <button
            type="button"
            [disabled]="action.disabled"
            class="flex w-full items-center justify-center gap-3 px-4 py-3 text-center transition-colors duration-fast"
            [class]="actionClasses(action)"
            (click)="select(action.id)"
          >
            @if (action.icon) {
              <svg [lucideIcon]="action.icon" [size]="18" class="shrink-0" />
            }
            <span class="text-base">{{ action.label }}</span>
          </button>
          <div class="h-px bg-[var(--separator)] mx-2 last:hidden"></div>
        }
      </div>
    </div>

    <!-- Cancel button -->
    <div class="mt-2">
      <button
        type="button"
        class="w-full rounded-2xl bg-[var(--glass-bg-thick)] backdrop-blur-xl border border-[var(--glass-border)] px-4 py-3.5 text-center text-base font-semibold text-system-blue transition-colors duration-fast hover:bg-[var(--fill-primary)] active:bg-[var(--fill-secondary)]"
        (click)="select(null)"
      >
        {{ config().cancelLabel || 'Cancel' }}
      </button>
    </div>
  `,
  styles: `
    :host {
      animation: sheet-up 0.35s cubic-bezier(0.2, 0, 0, 1);
    }

    @keyframes sheet-up {
      from {
        opacity: 0;
        transform: translateY(100%);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
  `,
})
export class ActionSheetPanelComponent {
  readonly config = signal<ActionSheetConfig>({
    actions: [],
  });
  readonly selected = output<string | null>();

  protected actionClasses(action: ActionSheetAction): string {
    if (action.disabled) {
      return 'opacity-40 cursor-not-allowed';
    }
    if (action.destructive) {
      return 'text-system-red font-medium hover:bg-system-red/10 cursor-pointer';
    }
    return 'text-system-blue font-medium hover:bg-[var(--fill-primary)] cursor-pointer';
  }

  protected select(id: string | null): void {
    this.selected.emit(id);
  }
}
