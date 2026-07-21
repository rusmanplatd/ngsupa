import { Component, inject, input, output, DOCUMENT, Injectable, computed, Service } from '@angular/core';
import { Dialog, DialogRef } from '@angular/cdk/dialog';
import { A11yModule } from '@angular/cdk/a11y';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { LucideDynamicIcon } from '@lucide/angular';
import { trigger, style, animate, transition } from '@angular/animations';

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
  imports: [LucideDynamicIcon, A11yModule, DragDropModule],
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
  styles: `
    .modal-container {
      position: relative;
      display: flex;
      flex-direction: column;
      max-height: 85vh;
      overflow: hidden;
      border-radius: var(--radius-2xl, 1rem);
      background: var(--surface-elevated);
      box-shadow: 0 20px 60px -10px oklch(0% 0 0 / 0.4), 0 0 0 1px var(--glass-border);
    }

    .modal-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-bottom: 1px solid var(--separator);
      padding: 16px 24px;
      flex-shrink: 0;
    }

    .modal-header--draggable {
      cursor: grab;
      user-select: none;
    }

    .modal-header--draggable:active {
      cursor: grabbing;
    }

    .modal-body {
      flex: 1;
      overflow-y: auto;
      padding: 20px 24px;
    }

    /* ── Resize handles ── */
    .resize-handle {
      position: absolute;
      z-index: 10;
    }

    /* Corner handles */
    .resize-handle--se {
      bottom: 0;
      right: 0;
      width: 20px;
      height: 20px;
      cursor: se-resize;
    }

    .resize-handle--sw {
      bottom: 0;
      left: 0;
      width: 20px;
      height: 20px;
      cursor: sw-resize;
    }

    .resize-handle--ne {
      top: 0;
      right: 0;
      width: 20px;
      height: 20px;
      cursor: ne-resize;
    }

    .resize-handle--nw {
      top: 0;
      left: 0;
      width: 20px;
      height: 20px;
      cursor: nw-resize;
    }

    /* Edge handles */
    .resize-handle--e {
      right: 0;
      top: 20px;
      bottom: 20px;
      width: 6px;
      cursor: e-resize;
    }

    .resize-handle--w {
      left: 0;
      top: 20px;
      bottom: 20px;
      width: 6px;
      cursor: w-resize;
    }

    .resize-handle--s {
      bottom: 0;
      left: 20px;
      right: 20px;
      height: 6px;
      cursor: s-resize;
    }

    /* SE corner grip icon */
    .resize-grip {
      position: absolute;
      bottom: 4px;
      right: 4px;
      width: 12px;
      height: 12px;
      color: var(--text-quaternary);
      pointer-events: none;
    }

    .cdk-drag-preview {
      box-shadow: 0 20px 60px -10px oklch(0% 0 0 / 0.5);
    }

    .cdk-drag-placeholder {
      opacity: 0;
    }
  `,
  template: `
    <div
      @modalAnim
      cdkTrapFocus
      cdkTrapFocusAutoCapture
      class="modal-container"
      [cdkDragDisabled]="!draggable()"
      cdkDrag
      cdkDragBoundary=".cdk-overlay-container"
      [style.width]="containerWidth()"
      [style.min-width]="'320px'"
      [style.min-height]="'200px'"
      #modalContainer
    >
      <!-- Header -->
      <div
        class="modal-header"
        [class.modal-header--draggable]="draggable()"
        cdkDragHandle
        [attr.title]="draggable() ? 'Drag to move' : null"
      >
        <h2 class="text-lg font-semibold text-[var(--text-primary)]" [id]="titleId()">
          {{ title() }}
        </h2>
        <div class="flex items-center gap-2">
          @if (draggable()) {
            <span aria-hidden="true" class="text-[var(--text-quaternary)] select-none text-xs hidden sm:block">
              ⠿ drag
            </span>
          }
          <button
            type="button"
            class="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--fill-secondary)] text-[var(--text-secondary)] hover:bg-[var(--fill-primary)] transition-colors duration-fast focus-visible:outline-2 focus-visible:outline-[var(--focus-ring)]"
            aria-label="Close"
            (click)="closed.emit()"
          >
            <svg lucideIcon="x" [size]="16" />
          </button>
        </div>
      </div>

      <!-- Body -->
      <div class="modal-body">
        <ng-content />
      </div>

      <!-- Footer -->
      <ng-content select="[modal-footer]" />

      <!-- Resize handles -->
      @if (resizable()) {
        <div class="resize-handle resize-handle--se" (mousedown)="onResizeStart($event, 'se')" aria-hidden="true"></div>
        <div class="resize-handle resize-handle--sw" (mousedown)="onResizeStart($event, 'sw')" aria-hidden="true"></div>
        <div class="resize-handle resize-handle--ne" (mousedown)="onResizeStart($event, 'ne')" aria-hidden="true"></div>
        <div class="resize-handle resize-handle--nw" (mousedown)="onResizeStart($event, 'nw')" aria-hidden="true"></div>
        <div class="resize-handle resize-handle--e" (mousedown)="onResizeStart($event, 'e')" aria-hidden="true"></div>
        <div class="resize-handle resize-handle--w" (mousedown)="onResizeStart($event, 'w')" aria-hidden="true"></div>
        <div class="resize-handle resize-handle--s" (mousedown)="onResizeStart($event, 's')" aria-hidden="true"></div>
        <!-- SE corner grip icon -->
        <svg class="resize-grip" viewBox="0 0 12 12" fill="currentColor" aria-hidden="true">
          <circle cx="10" cy="10" r="1.5"/>
          <circle cx="6" cy="10" r="1.5"/>
          <circle cx="10" cy="6" r="1.5"/>
        </svg>
      }
    </div>
  `,
})
export class ModalComponent {
  readonly title = input.required<string>();
  readonly titleId = input('modal-title-' + Math.random().toString(36).slice(2, 9));
  readonly closed = output<void>();
  /** Allow dragging the modal by its header. */
  readonly draggable = input(false);
  /** Allow resizing the modal via edge/corner handles. */
  readonly resizable = input(false);
  /** Initial width of the modal container (CSS value). */
  readonly width = input<string | null>(null);

  private readonly document = inject(DOCUMENT);

  // Container dimensions (managed by resize logic)
  private containerEl: HTMLElement | null = null;
  private resizeStartX = 0;
  private resizeStartY = 0;
  private resizeStartW = 0;
  private resizeStartH = 0;
  private resizeDirection: string = '';

  protected readonly containerWidth = computed(() => this.width() ?? 'auto');

  private readonly mouseMoveHandler = (e: MouseEvent) => this.onResizeMove(e);
  private readonly mouseUpHandler = () => this.onResizeEnd();

  protected onResizeStart(event: MouseEvent, direction: string): void {
    event.preventDefault();
    event.stopPropagation();

    this.containerEl = (event.target as HTMLElement).closest('.modal-container') as HTMLElement;
    if (!this.containerEl) return;

    const rect = this.containerEl.getBoundingClientRect();
    this.resizeStartX = event.clientX;
    this.resizeStartY = event.clientY;
    this.resizeStartW = rect.width;
    this.resizeStartH = rect.height;
    this.resizeDirection = direction;

    this.document.addEventListener('mousemove', this.mouseMoveHandler);
    this.document.addEventListener('mouseup', this.mouseUpHandler);
    this.document.body.style.userSelect = 'none';
    this.document.body.style.cursor = this.getCursorForDirection(direction);
  }

  private onResizeMove(event: MouseEvent): void {
    if (!this.containerEl) return;
    const dx = event.clientX - this.resizeStartX;
    const dy = event.clientY - this.resizeStartY;
    const dir = this.resizeDirection;
    const minW = 320;
    const minH = 200;

    if (dir.includes('e')) {
      this.containerEl.style.width = Math.max(minW, this.resizeStartW + dx) + 'px';
    }
    if (dir.includes('w')) {
      this.containerEl.style.width = Math.max(minW, this.resizeStartW - dx) + 'px';
    }
    if (dir.includes('s')) {
      this.containerEl.style.maxHeight = 'none';
      this.containerEl.style.height = Math.max(minH, this.resizeStartH + dy) + 'px';
    }
    if (dir.includes('n')) {
      this.containerEl.style.maxHeight = 'none';
      this.containerEl.style.height = Math.max(minH, this.resizeStartH - dy) + 'px';
    }
  }

  private onResizeEnd(): void {
    this.containerEl = null;
    this.resizeDirection = '';
    this.document.removeEventListener('mousemove', this.mouseMoveHandler);
    this.document.removeEventListener('mouseup', this.mouseUpHandler);
    this.document.body.style.userSelect = '';
    this.document.body.style.cursor = '';
  }

  private getCursorForDirection(dir: string): string {
    const map: Record<string, string> = {
      se: 'se-resize', sw: 'sw-resize', ne: 'ne-resize', nw: 'nw-resize',
      e: 'e-resize', w: 'w-resize', s: 's-resize', n: 'n-resize',
    };
    return map[dir] ?? 'default';
  }
}
