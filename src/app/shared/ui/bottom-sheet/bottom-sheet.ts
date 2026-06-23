import {
  Component,
  Service,
  inject,
  signal,
  input,
  output,
  ElementRef,
  viewChild,
  afterRenderEffect,
  OnDestroy,
} from '@angular/core';
import { Dialog, DialogRef } from '@angular/cdk/dialog';
import { LucideDynamicIcon } from '@lucide/angular';

export interface BottomSheetAction {
  id: string;
  label: string;
  icon?: string;
  destructive?: boolean;
  disabled?: boolean;
}

export interface BottomSheetConfig {
  title?: string;
  message?: string;
  actions?: BottomSheetAction[];
  cancelLabel?: string;
  showDragHandle?: boolean;
  snapPoints?: number[];
  component?: any;
}

@Service()
export class BottomSheetService {
  private readonly dialog = inject(Dialog);

  open(config: BottomSheetConfig): DialogRef<string | null> {
    return this.dialog.open<string | null>(BottomSheetPanelComponent, {
      data: config,
      panelClass: 'app-bottom-sheet-panel',
      backdropClass: 'app-bottom-sheet-backdrop',
      hasBackdrop: true,
      disableClose: false,
      autoFocus: 'first-tabbable',
    });
  }
}

@Component({
  selector: 'app-bottom-sheet-panel',
  imports: [LucideDynamicIcon],
  host: {
    class: 'block',
    '(touchstart)': 'onTouchStart($event)',
    '(touchmove)': 'onTouchMove($event)',
    '(touchend)': 'onTouchEnd($event)',
  },
  template: `
    <div
      #sheetEl
      class="rounded-t-3xl bg-[var(--surface-elevated)] shadow-xl overflow-hidden"
      [style.transform]="'translateY(' + dragOffset() + 'px)'"
      [style.transition]="isDragging() ? 'none' : 'transform 0.35s cubic-bezier(0.2, 0, 0, 1)'"
    >
      <!-- Drag Handle -->
      @if (config.showDragHandle !== false) {
        <div class="flex justify-center py-3" aria-hidden="true">
          <div class="h-1 w-9 rounded-full bg-[var(--fill-secondary)]"></div>
        </div>
      }

      <!-- Title & Message -->
      @if (config.title || config.message) {
        <div class="px-5 pb-4" [class.pt-2]="config.showDragHandle !== false" [class.pt-5]="config.showDragHandle === false">
          @if (config.title) {
            <h2 class="text-lg font-semibold text-[var(--text-primary)] text-center">{{ config.title }}</h2>
          }
          @if (config.message) {
            <p class="mt-1 text-sm text-[var(--text-secondary)] text-center">{{ config.message }}</p>
          }
        </div>
      }

      <!-- Custom content projection -->
      <ng-content />

      <!-- Actions -->
      @if (config.actions?.length) {
        <div class="mx-3 mb-2 overflow-hidden rounded-2xl bg-[var(--surface-primary)]">
          @for (action of config.actions; track action.id; let last = $last) {
            <button
              type="button"
              [disabled]="action.disabled"
              class="flex w-full items-center justify-center gap-3 px-5 py-3.5 text-lg font-normal transition-colors"
              [class]="actionClasses(action, last)"
              (click)="selectAction(action.id)"
            >
              @if (action.icon) {
                <svg [lucideIcon]="action.icon" [size]="20" />
              }
              {{ action.label }}
            </button>
          }
        </div>
      }

      <!-- Cancel -->
      <div class="mx-3 mb-3 mt-1">
        <button
          type="button"
          class="flex w-full items-center justify-center rounded-2xl bg-[var(--surface-primary)] px-5 py-3.5 text-lg font-semibold text-system-blue transition-colors hover:bg-[var(--fill-primary)]"
          (click)="close(null)"
        >
          {{ config.cancelLabel || 'Cancel' }}
        </button>
      </div>

      <!-- Safe area padding -->
      <div class="h-[env(safe-area-inset-bottom)]"></div>
    </div>
  `,
  styles: `
    :host {
      display: block;
      touch-action: none;
    }
  `,
})
export class BottomSheetPanelComponent implements OnDestroy {
  readonly config: BottomSheetConfig;
  private readonly dialogRef: DialogRef<string | null>;

  protected readonly dragOffset = signal(0);
  protected readonly isDragging = signal(false);
  private dragStartY = 0;
  private currentDrag = 0;
  private readonly sheetElRef = viewChild<ElementRef<HTMLDivElement>>('sheetEl');

  constructor() {
    const dialogRef = inject(DialogRef<string | null>);
    this.dialogRef = dialogRef;
    this.config = (dialogRef as any).config?.data ?? {};
  }

  protected actionClasses(action: BottomSheetAction, last: boolean): string {
    const base = action.disabled ? 'opacity-40 cursor-not-allowed' : 'hover:bg-[var(--fill-primary)]';
    const color = action.destructive ? 'text-system-red' : 'text-system-blue';
    const border = last ? '' : 'border-b border-[var(--separator)]';
    return `${base} ${color} ${border}`;
  }

  protected selectAction(id: string): void {
    this.close(id);
  }

  protected close(result: string | null): void {
    this.dialogRef.close(result);
  }

  // ── Drag-to-dismiss ──────────────────────────────────────
  protected onTouchStart(event: TouchEvent): void {
    this.dragStartY = event.touches[0].clientY;
    this.isDragging.set(true);
    this.currentDrag = 0;
  }

  protected onTouchMove(event: TouchEvent): void {
    if (!this.isDragging()) return;
    const delta = event.touches[0].clientY - this.dragStartY;
    // Only allow downward drag
    this.currentDrag = Math.max(0, delta);
    this.dragOffset.set(this.currentDrag);
  }

  protected onTouchEnd(event: TouchEvent): void {
    this.isDragging.set(false);
    const threshold = 120;
    if (this.currentDrag > threshold) {
      // Dismiss — animate out
      this.dragOffset.set(window.innerHeight);
      setTimeout(() => this.close(null), 350);
    } else {
      // Snap back
      this.dragOffset.set(0);
    }
    this.currentDrag = 0;
  }

  ngOnDestroy(): void {
    // Cleanup if needed
  }
}
