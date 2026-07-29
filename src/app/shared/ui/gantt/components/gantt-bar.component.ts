import {
  Component,
  inject,
  input,
  output,
  signal,
  computed,
  ElementRef,
  viewChild,
  NgZone,
} from '@angular/core';
import { GanttService } from '../gantt.service';
import {
  GanttBarLayout,
  GanttTaskClickPayload,
  GanttTaskDropPayload,
  GanttTaskResizePayload,
  GanttTaskProgressChangePayload,
  TASK_COLOR_MAP,
} from '../gantt.models';
import { GanttTaskPopoverComponent } from './gantt-task-popover.component';
import { Overlay, OverlayRef } from '@angular/cdk/overlay';
import { ComponentPortal } from '@angular/cdk/portal';

@Component({
  selector: 'app-gantt-bar',
  imports: [],
  host: {
    class: 'block',
    style: 'position: relative; height: 100%;',
  },
  template: `
    <div
      #barEl
      class="gb"
      [class.gb--milestone]="layout().task.milestone"
      [class.gb--dragging]="isDragging()"
      [class.gb--readonly]="svc.readonly()"
      [style.left.px]="currentLeft()"
      [style.width.px]="currentWidth()"
      [style.top.px]="layout().top"
      [style.height.px]="layout().height"
      [style.--gb-color]="taskColor()"
      [attr.aria-label]="layout().task.title + ', ' + progressLabel()"
      [attr.aria-valuenow]="layout().task.progress ?? 0"
      aria-valuemin="0"
      aria-valuemax="100"
      role="slider"
      tabindex="0"
      [attr.aria-orientation]="'horizontal'"
      (click)="onClick($event)"
      (mouseenter)="onMouseEnter($event)"
      (mouseleave)="onMouseLeave()"
      (mousedown)="onBarMouseDown($event)"
      (keydown)="onKeyDown($event)"
    >
      <!-- Progress fill -->
      <div
        class="gb__progress"
        [style.width.%]="currentProgress()"
        aria-hidden="true"
      ></div>

      <!-- Label -->
      @if (!layout().task.milestone && currentWidth() > 40) {
        <span class="gb__label" aria-hidden="true">{{ layout().task.title }}</span>
      }

      <!-- Milestone diamond — hide resize handles -->
      @if (layout().task.milestone) {
        <span class="gb__milestone-diamond" aria-hidden="true">◆</span>
      }

      <!-- Resize handles (hidden in readonly/milestone mode) -->
      @if (!svc.readonly() && !layout().task.milestone) {
        <div
          class="gb__handle gb__handle--start"
          aria-label="Drag to change start date"
          (mousedown)="onResizeMouseDown($event, 'start')"
        ></div>
        <div
          class="gb__handle gb__handle--end"
          aria-label="Drag to change end date"
          (mousedown)="onResizeMouseDown($event, 'end')"
        ></div>
      }

      <!-- Progress drag handle (shown on hover, hidden in readonly/milestone mode) -->
      @if (!svc.readonly() && !layout().task.milestone && currentProgress() > 0) {
        <div
          class="gb__progress-handle"
          [style.left.%]="currentProgress()"
          aria-label="Drag to adjust progress"
          title="Drag to adjust progress"
          (mousedown)="onProgressMouseDown($event)"
        ></div>
      }
    </div>
  `,
  styles: `
    :host {
      position: relative;
      display: block;
      height: 100%;
    }

    .gb {
      position: absolute;
      border-radius: var(--radius-full);
      background: color-mix(in oklch, var(--gb-color) 85%, white);
      box-shadow: var(--shadow-sm), 0 0 0 1px color-mix(in oklch, var(--gb-color) 40%, transparent);
      cursor: grab;
      overflow: hidden;
      display: flex;
      align-items: center;
      transition:
        box-shadow var(--duration-fast) var(--ease-default),
        transform var(--duration-fast) var(--ease-spring),
        opacity var(--duration-fast) var(--ease-default);
      will-change: transform;
      user-select: none;
    }

    .gb:hover:not(.gb--dragging):not(.gb--readonly) {
      box-shadow: var(--shadow-md), 0 0 0 2px var(--gb-color);
      transform: scaleY(1.05);
    }

    .gb:focus-visible {
      outline: 2px solid var(--gb-color);
      outline-offset: 2px;
      box-shadow: var(--shadow-md), 0 0 0 4px color-mix(in oklch, var(--gb-color) 25%, transparent);
    }

    .gb--dragging {
      cursor: grabbing;
      box-shadow: var(--shadow-lg), 0 0 0 2px var(--gb-color);
      transform: scaleY(1.08) translateY(-1px);
      opacity: 0.9;
      z-index: 10;
    }

    .gb--readonly {
      cursor: default;
    }

    .gb--milestone {
      border-radius: 0;
      background: transparent !important;
      box-shadow: none !important;
      overflow: visible;
      cursor: default;
    }

    /* Progress fill */
    .gb__progress {
      position: absolute;
      left: 0;
      top: 0;
      bottom: 0;
      background: color-mix(in oklch, var(--gb-color) 45%, white);
      border-radius: inherit;
      pointer-events: none;
      transition: width var(--duration-normal) var(--ease-default);
    }

    /* Task label */
    .gb__label {
      position: relative;
      z-index: 1;
      font: var(--type-caption-2);
      font-weight: 600;
      color: color-mix(in oklch, var(--gb-color) 20%, black);
      padding: 0 10px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      pointer-events: none;
    }

    /* Milestone diamond */
    .gb__milestone-diamond {
      font-size: 18px;
      color: var(--gb-color);
      line-height: 1;
      filter: drop-shadow(0 1px 2px oklch(0% 0 0 / 0.2));
    }

    /* Resize handles */
    .gb__handle {
      position: absolute;
      top: 0;
      bottom: 0;
      width: 8px;
      z-index: 2;
      cursor: ew-resize;
      display: flex;
      align-items: center;
      justify-content: center;
      opacity: 0;
      transition: opacity var(--duration-fast) var(--ease-default);
    }

    .gb:hover .gb__handle,
    .gb--dragging .gb__handle {
      opacity: 1;
    }

    .gb__handle--start { left: 0; border-radius: var(--radius-full) 0 0 var(--radius-full); }
    .gb__handle--end   { right: 0; border-radius: 0 var(--radius-full) var(--radius-full) 0; }

    .gb__handle::after {
      content: '';
      width: 2px;
      height: 60%;
      background: color-mix(in oklch, var(--gb-color) 30%, white);
      border-radius: 1px;
    }

    /* Progress drag handle */
    .gb__progress-handle {
      position: absolute;
      top: 50%;
      transform: translate(-50%, -50%);
      width: 10px;
      height: 10px;
      border-radius: 50%;
      background: white;
      border: 2px solid var(--gb-color);
      box-shadow: var(--shadow-sm);
      z-index: 3;
      cursor: col-resize;
      opacity: 0;
      transition: opacity var(--duration-fast) var(--ease-default),
                  transform var(--duration-fast) var(--ease-spring);
      pointer-events: all;
    }

    .gb:hover .gb__progress-handle {
      opacity: 1;
    }

    .gb__progress-handle:hover {
      transform: translate(-50%, -50%) scale(1.3);
    }
  `,
})
export class GanttBarComponent {
  protected readonly svc = inject(GanttService);
  private readonly overlay = inject(Overlay);
  private readonly ngZone = inject(NgZone);
  private readonly hostRef = inject(ElementRef<HTMLElement>);

  readonly layout = input.required<GanttBarLayout>();
  readonly taskClick = output<GanttTaskClickPayload>();
  readonly taskDrop = output<GanttTaskDropPayload>();
  readonly taskResize = output<GanttTaskResizePayload>();
  readonly taskProgressChange = output<GanttTaskProgressChangePayload>();

  readonly barEl = viewChild.required<ElementRef<HTMLElement>>('barEl');

  // ── Drag state ─────────────────────────────────────────────────────────────
  protected isDragging = signal(false);
  protected currentLeft = computed(() => this.layout().left);
  protected currentWidth = computed(() => this.layout().width);
  protected currentProgress = computed(() => this.layout().task.progress ?? 0);

  private _dragLeft = signal(0);
  private _dragWidth = signal(0);
  private _dragStartX = 0;
  private _resizeEdge: 'start' | 'end' | null = null;
  private _isDraggingActive = false;
  private _overlayRef: OverlayRef | null = null;

  // ── Color ─────────────────────────────────────────────────────────────────
  protected taskColor = computed(() => {
    const color = this.layout().task.color ?? 'blue';
    return TASK_COLOR_MAP[color];
  });

  protected progressLabel = computed(() => {
    const p = this.layout().task.progress ?? 0;
    return `${p}% complete`;
  });

  // ── Click ─────────────────────────────────────────────────────────────────
  protected onClick(event: MouseEvent): void {
    if (this._isDraggingActive) return;
    this.taskClick.emit({ task: this.layout().task, nativeEvent: event });
  }

  // ── Keyboard ──────────────────────────────────────────────────────────────
  protected onKeyDown(event: KeyboardEvent): void {
    if (this.svc.readonly()) return;
    const task = this.layout().task;

    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
      event.preventDefault();
      const direction = event.key === 'ArrowLeft' ? -1 : 1;
      const newStart = new Date(task.start);
      newStart.setDate(newStart.getDate() + direction);
      const duration = Math.round(
        (task.end.getTime() - task.start.getTime()) / (1000 * 60 * 60 * 24),
      );
      const newEnd = new Date(newStart);
      newEnd.setDate(newEnd.getDate() + duration);
      this.taskDrop.emit({
        task,
        newStart,
        newEnd,
        previousStart: task.start,
        previousEnd: task.end,
      });
    } else if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      this.taskClick.emit({ task, nativeEvent: event as unknown as MouseEvent });
    }
  }

  // ── Hover / Popover ───────────────────────────────────────────────────────
  private _hoverTimeout: ReturnType<typeof setTimeout> | null = null;

  protected onMouseEnter(event: MouseEvent): void {
    this._hoverTimeout = setTimeout(() => {
      this.openPopover(event);
    }, 400);
  }

  protected onMouseLeave(): void {
    if (this._hoverTimeout) {
      clearTimeout(this._hoverTimeout);
      this._hoverTimeout = null;
    }
    this.closePopover();
  }

  private openPopover(event: MouseEvent): void {
    if (this._overlayRef) return;
    const positionStrategy = this.overlay
      .position()
      .flexibleConnectedTo({ x: event.clientX, y: event.clientY })
      .withPositions([
        { originX: 'center', originY: 'bottom', overlayX: 'center', overlayY: 'top', offsetY: 8 },
        { originX: 'center', originY: 'top', overlayX: 'center', overlayY: 'bottom', offsetY: -8 },
      ])
      .withPush(true);

    this._overlayRef = this.overlay.create({
      positionStrategy,
      scrollStrategy: this.overlay.scrollStrategies.reposition(),
      panelClass: 'gantt-popover-panel',
      hasBackdrop: false,
    });

    const portal = new ComponentPortal(GanttTaskPopoverComponent);
    const ref = this._overlayRef.attach(portal);
    ref.setInput('task', this.layout().task);
    this.svc.activePopoverTaskId.set(this.layout().task.id);
  }

  private closePopover(): void {
    if (this._overlayRef) {
      this._overlayRef.dispose();
      this._overlayRef = null;
      this.svc.activePopoverTaskId.set(null);
    }
  }

  // ── Drag to reschedule ────────────────────────────────────────────────────
  protected onBarMouseDown(event: MouseEvent): void {
    if (this.svc.readonly()) return;
    if ((event.target as HTMLElement).classList.contains('gb__handle')) return;
    if ((event.target as HTMLElement).classList.contains('gb__progress-handle')) return;

    event.preventDefault();
    this._resizeEdge = null;
    this._isDraggingActive = false;
    this._dragLeft.set(this.layout().left);
    this._dragWidth.set(this.layout().width);
    this._dragStartX = event.clientX;

    const originalLeft = this.layout().left;

    const onMouseMove = (e: MouseEvent): void => {
      const delta = e.clientX - this._dragStartX;
      if (Math.abs(delta) > 4) {
        this._isDraggingActive = true;
        this.isDragging.set(true);
      }
      if (!this._isDraggingActive) return;

      const snapped = this._snapToCell(originalLeft + delta);
      this._dragLeft.set(snapped);
      this.barEl().nativeElement.style.left = `${snapped}px`;
    };

    const onMouseUp = (): void => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
      this.isDragging.set(false);

      if (!this._isDraggingActive) return;

      const newLeft = this._dragLeft();
      const newStart = this.svc.pixelToDate(newLeft);
      const duration = Math.round(
        (this.layout().task.end.getTime() - this.layout().task.start.getTime()) /
          (1000 * 60 * 60 * 24),
      );
      const newEnd = new Date(newStart);
      newEnd.setDate(newEnd.getDate() + duration);

      this.taskDrop.emit({
        task: this.layout().task,
        newStart,
        newEnd,
        previousStart: this.layout().task.start,
        previousEnd: this.layout().task.end,
      });
    };

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  }

  // ── Resize ────────────────────────────────────────────────────────────────
  protected onResizeMouseDown(event: MouseEvent, edge: 'start' | 'end'): void {
    event.stopPropagation();
    event.preventDefault();
    if (this.svc.readonly()) return;

    this._resizeEdge = edge;
    this._dragStartX = event.clientX;
    const originalLeft = this.layout().left;
    const originalWidth = this.layout().width;
    let newLeft = originalLeft;
    let newWidth = originalWidth;

    const onMouseMove = (e: MouseEvent): void => {
      const delta = e.clientX - this._dragStartX;
      if (edge === 'start') {
        const snappedDelta = this._snapDelta(delta);
        newLeft = Math.min(originalLeft + snappedDelta, originalLeft + originalWidth - 24);
        newWidth = originalWidth - (newLeft - originalLeft);
      } else {
        const snappedWidth = this._snapToCell(originalWidth + delta);
        newWidth = Math.max(24, snappedWidth);
      }
      this.barEl().nativeElement.style.left = `${newLeft}px`;
      this.barEl().nativeElement.style.width = `${newWidth}px`;
      this.isDragging.set(true);
    };

    const onMouseUp = (): void => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
      this.isDragging.set(false);

      const newStart = this.svc.pixelToDate(newLeft);
      const newEnd = this.svc.pixelToDate(newLeft + newWidth);

      this.taskResize.emit({
        task: this.layout().task,
        edge,
        newStart,
        newEnd,
        previousStart: this.layout().task.start,
        previousEnd: this.layout().task.end,
      });
    };

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  }

  private _snapToCell(px: number): number {
    const cw = this.svc.cellWidth();
    return Math.round(px / cw) * cw;
  }

  private _snapDelta(delta: number): number {
    const cw = this.svc.cellWidth();
    return Math.round(delta / cw) * cw;
  }

  // ── Progress drag ─────────────────────────────────────────────────────────
  protected onProgressMouseDown(event: MouseEvent): void {
    event.stopPropagation();
    event.preventDefault();
    if (this.svc.readonly()) return;

    const previousProgress = this.layout().task.progress ?? 0;
    const barRect = this.barEl().nativeElement.getBoundingClientRect();

    const onMouseMove = (e: MouseEvent): void => {
      const relativeX = e.clientX - barRect.left;
      const rawProgress = (relativeX / barRect.width) * 100;
      const clamped = Math.max(0, Math.min(100, Math.round(rawProgress)));
      const fill = this.barEl().nativeElement.querySelector('.gb__progress') as HTMLElement | null;
      if (fill) fill.style.width = `${clamped}%`;
      const handle = this.barEl().nativeElement.querySelector('.gb__progress-handle') as HTMLElement | null;
      if (handle) handle.style.left = `${clamped}%`;
    };

    const onMouseUp = (e: MouseEvent): void => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);

      const relativeX = e.clientX - barRect.left;
      const rawProgress = (relativeX / barRect.width) * 100;
      const newProgress = Math.max(0, Math.min(100, Math.round(rawProgress)));

      this.svc.updateProgress(this.layout().task.id, newProgress);
      this.taskProgressChange.emit({
        task: this.layout().task,
        newProgress,
        previousProgress,
      });
    };

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  }
}
