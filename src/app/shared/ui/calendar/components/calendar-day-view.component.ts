import {
  Component,
  inject,
  output,
  signal,
  OnInit,
  OnDestroy,
  AfterViewInit,
  NgZone,
  ViewChild,
  ElementRef,
} from '@angular/core';
import {
  CdkDrag,
  CdkDropList,
  CdkDragDrop,
  CdkDragPreview,
} from '@angular/cdk/drag-drop';
import { CalendarService, formatEventTime, isSameDay, startOfDay } from '../calendar.service';
import {
  CalendarEvent,
  EventClickPayload,
  DateClickPayload,
  EventDropPayload,
  EventResizePayload,
  TimeRangeSelectPayload,
  PositionedEvent,
  TIME_GRID_HEIGHT_PER_HOUR,
  HOURS_IN_DAY,
} from '../calendar.models';

// Internal state for drag-to-create selection
interface DragSelection {
  startMin: number; // minutes from midnight
  endMin: number;   // minutes from midnight
}

@Component({
  selector: 'app-calendar-day-view',
  imports: [CdkDrag, CdkDropList, CdkDragPreview],
  host: { class: 'flex flex-col overflow-hidden' },
  template: `
    <!-- All-day events -->
    @if (calendar.dayAllDayEvents().length > 0) {
      <div class="cal-day-allday-row">
        <div class="cal-time-gutter-spacer" aria-hidden="true"></div>
        <div class="cal-day-allday-events">
          @for (evt of calendar.dayAllDayEvents(); track evt.id) {
            <button
              type="button"
              class="cal-week-allday-pill"
              [class]="'cal-event--' + (evt.color ?? 'primary')"
              [attr.aria-label]="evt.title + ', all day'"
              (click)="onEventClick($event, evt)"
            >
              {{ evt.title }}
            </button>
          }
        </div>
      </div>
    }

    <!-- Scrollable time grid -->
    <div class="cal-day-scroll-area" #scrollArea>
      <div class="cal-day-time-grid" [style.height.px]="gridHeight">

        <!-- Time gutter -->
        <div class="cal-time-gutter" aria-hidden="true">
          @for (slot of calendar.timeSlots(); track slot.hour) {
            <div class="cal-time-label" [style.top.px]="slot.hour * cellHeight">
              {{ slot.label }}
            </div>
          }
        </div>

        <!-- Single day column -->
        <div
          #dayColEl
          cdkDropList
          [cdkDropListData]="calendar.currentDate()"
          (cdkDropListDropped)="onTimedEventDrop($event)"
          (cdkDropListEntered)="dropActive.set(true)"
          (cdkDropListExited)="dropActive.set(false)"
          class="cal-day-col"
          [class.cal-day-col--drop-active]="dropActive()"
          role="region"
          [attr.aria-label]="formatDayFull(calendar.currentDate())"
          (pointerdown)="onColMouseDown($event)"
          (click)="onColClick($event)"
        >
          @for (slot of calendar.timeSlots(); track slot.hour) {
            <div class="cal-hour-line" [style.top.px]="slot.hour * cellHeight" aria-hidden="true"></div>
            <div class="cal-half-hour-line" [style.top.px]="slot.hour * cellHeight + cellHeight / 2" aria-hidden="true"></div>
          }

          <!-- Drag-to-create selection ghost -->
          @if (dragSel()) {
            <div
              class="cal-selection-ghost"
              aria-hidden="true"
              [style.top.%]="selTop()"
              [style.height.%]="selHeight()"
            >
              <span class="cal-selection-time-label">{{ selTimeLabel() }}</span>
            </div>
          }

          @for (pe of calendar.dayPositionedEvents(); track pe.event.id) {
            <button
              type="button"
              cdkDrag
              [cdkDragData]="pe"
              (cdkDragStarted)="onDragStart()"
              (cdkDragEnded)="onDragEnd()"
              class="cal-timed-event"
              [class]="'cal-event--' + (pe.event.color ?? 'primary')"
              [style.top.%]="pe.top"
              [style.height.%]="pe.height"
              [style.left.%]="pe.left + 0.5"
              [style.width.%]="pe.width - 1"
              [attr.aria-label]="pe.event.title + ', ' + formatTime(pe.event.start) + (pe.event.end ? ' to ' + formatTime(pe.event.end) : '') + (pe.overflowCount > 0 ? ', and ' + pe.overflowCount + ' more events' : '')"
              (click)="onEventClick($event, pe.event)"
            >
              <div class="cal-timed-event-inner">
                <span class="cal-timed-event-title">{{ pe.event.title }}</span>
                @if (pe.event.subtitle) {
                  <span class="cal-timed-event-subtitle">{{ pe.event.subtitle }}</span>
                }
                <span class="cal-timed-event-time">
                  {{ formatTime(pe.event.start) }}
                  @if (pe.event.end) { — {{ formatTime(pe.event.end) }} }
                </span>
              </div>

              <!-- Overflow badge -->
              @if (pe.overflowCount > 0) {
                <span class="cal-overflow-badge" aria-hidden="true">+{{ pe.overflowCount }}</span>
              }

              <!-- Resize handle -->
              <span
                class="cal-resize-handle"
                aria-hidden="true"
                (mousedown)="onResizeStart($event, pe)"
              ></span>

              <!-- Drag preview -->
              <ng-template cdkDragPreview>
                <div class="cal-drag-preview-block" [class]="'cal-event--' + (pe.event.color ?? 'primary')">
                  <span class="cal-timed-event-title">{{ pe.event.title }}</span>
                  <span class="cal-timed-event-time">{{ formatTime(pe.event.start) }}</span>
                </div>
              </ng-template>
            </button>
          }
        </div>

        <!-- Current time indicator -->
        @if (showCurrentTimeLine()) {
          <div class="cal-current-time-line" [style.top.px]="currentTimeTop()" aria-hidden="true">
            <span class="cal-current-time-dot"></span>
          </div>
        }
      </div>
    </div>
  `,
  styles: `
    :host {
      display: flex;
      flex-direction: column;
      flex: 1;
      min-height: 0;
    }

    /* All-day row */
    .cal-day-allday-row {
      display: flex;
      border-bottom: 1px solid var(--border-default);
      background: var(--surface-secondary);
      min-height: 36px;
    }

    .cal-time-gutter-spacer {
      width: 72px;
      flex-shrink: 0;
      border-right: 1px solid var(--border-default);
    }

    .cal-day-allday-events {
      flex: 1;
      padding: 4px 8px;
      display: flex;
      flex-direction: column;
      gap: 3px;
    }

    .cal-week-allday-pill {
      display: block;
      padding: 3px 8px;
      border-radius: var(--radius-xs);
      font: var(--type-caption-1);
      font-weight: var(--font-weight-medium);
      border: none;
      cursor: pointer;
      text-align: left;
      transition: opacity var(--duration-fast);
    }

    .cal-week-allday-pill:hover { opacity: 0.8; }

    .cal-week-allday-pill:focus-visible {
      outline: 2px solid var(--color-primary);
      outline-offset: 1px;
    }

    /* Scroll area */
    .cal-day-scroll-area {
      flex: 1;
      overflow-y: auto;
      overflow-x: hidden;
      scrollbar-width: thin;
      scrollbar-gutter: stable;
    }

    .cal-day-time-grid {
      display: flex;
      position: relative;
    }

    /* Time gutter */
    .cal-time-gutter {
      width: 72px;
      flex-shrink: 0;
      position: relative;
      border-right: 1px solid var(--border-default);
    }

    .cal-time-label {
      position: absolute;
      right: 10px;
      transform: translateY(-50%);
      font: var(--type-caption-1);
      color: var(--text-tertiary);
      white-space: nowrap;
      pointer-events: none;
      user-select: none;
    }

    /* Day column */
    .cal-day-col {
      flex: 1;
      position: relative;
      cursor: crosshair;
      background: color-mix(in oklch, var(--color-primary) 2%, transparent);
      transition: background var(--duration-fast);
      user-select: none;
    }

    .cal-day-col--drop-active {
      background: color-mix(in oklch, var(--color-primary) 8%, transparent);
    }

    .cal-hour-line {
      position: absolute;
      left: 0;
      right: 0;
      height: 1px;
      background: var(--border-default);
      pointer-events: none;
    }

    .cal-half-hour-line {
      position: absolute;
      left: 0;
      right: 0;
      height: 1px;
      background: var(--separator);
      pointer-events: none;
    }

    /* ── Drag-to-create selection ghost ── */
    .cal-selection-ghost {
      position: absolute;
      left: 2px;
      right: 2px;
      border-radius: var(--radius-sm);
      background: color-mix(in oklch, var(--color-primary) 18%, transparent);
      border: 2px dashed var(--color-primary);
      pointer-events: none;
      z-index: 2;
      display: flex;
      align-items: flex-start;
      padding: 4px 8px;
    }

    .cal-selection-time-label {
      font: var(--type-caption-1);
      font-weight: var(--font-weight-semibold);
      color: var(--color-primary);
      white-space: nowrap;
    }

    /* Timed event block */
    .cal-timed-event {
      position: absolute;
      border-radius: var(--radius-md);
      padding: 6px 10px;
      border: none;
      cursor: grab;
      text-align: left;
      overflow: hidden;
      border-left: 4px solid currentColor;
      transition: opacity var(--duration-fast),
                  transform var(--duration-fast) var(--ease-spring),
                  box-shadow var(--duration-fast);
      min-height: 24px;
    }

    .cal-timed-event:active {
      cursor: grabbing;
    }

    .cal-timed-event:hover {
      opacity: 0.88;
      transform: scale(1.005);
      box-shadow: var(--shadow-md);
    }

    .cal-timed-event:focus-visible {
      outline: 2px solid var(--color-primary);
      outline-offset: 2px;
    }

    .cal-timed-event-inner {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .cal-timed-event-title {
      font: var(--type-footnote);
      font-weight: var(--font-weight-semibold);
      color: inherit;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .cal-timed-event-subtitle {
      font: var(--type-caption-2);
      color: inherit;
      opacity: 0.7;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .cal-timed-event-time {
      font: var(--type-caption-2);
      color: inherit;
      opacity: 0.75;
    }

    /* ── Resize handle ── */
    .cal-resize-handle {
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      height: 10px;
      cursor: ns-resize;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .cal-resize-handle::after {
      content: '';
      display: block;
      width: 28px;
      height: 2px;
      border-radius: 1px;
      background: currentColor;
      opacity: 0.35;
    }

    .cal-timed-event:hover .cal-resize-handle::after {
      opacity: 0.65;
    }

    /* Event color variants */
    .cal-event--primary { background: var(--color-primary-container); color: var(--color-primary); }
    .cal-event--success { background: var(--color-success-container); color: var(--color-success); }
    .cal-event--warning { background: var(--color-warning-container); color: var(--color-warning); }
    .cal-event--error   { background: var(--color-error-container);   color: var(--color-error); }
    .cal-event--info    { background: var(--color-info-container);     color: var(--color-info); }
    .cal-event--purple  { background: var(--color-system-purple-light); color: var(--color-system-purple); }
    .cal-event--pink    { background: var(--color-system-pink-light);   color: var(--color-system-pink); }
    .cal-event--teal    { background: var(--color-system-teal-light);   color: var(--color-system-teal); }

    /* ── CDK drag states ── */
    .cdk-drag-placeholder {
      opacity: 0.2;
      border: 2px dashed currentColor !important;
      border-radius: var(--radius-md);
      background: var(--fill-secondary) !important;
    }

    .cdk-drag-animating {
      transition: transform 200ms var(--ease-spring);
    }

    /* ── Overflow badge ── */
    .cal-overflow-badge {
      position: absolute;
      bottom: 4px;
      right: 6px;
      background: oklch(from currentColor l c h / 0.18);
      color: inherit;
      border-radius: var(--radius-full);
      font-size: 0.6rem;
      font-weight: var(--font-weight-semibold);
      padding: 1px 5px;
      line-height: 1.4;
      letter-spacing: 0.02em;
      pointer-events: none;
      white-space: nowrap;
    }

    .cal-drag-preview-block {
      display: flex;
      flex-direction: column;
      gap: 2px;
      padding: 6px 10px;
      border-radius: var(--radius-md);
      border-left: 4px solid currentColor;
      box-shadow: var(--shadow-xl);
      opacity: 0.92;
      min-width: 120px;
      pointer-events: none;
    }

    /* Current time indicator */
    .cal-current-time-line {
      position: absolute;
      left: 72px;
      right: 0;
      height: 2px;
      background: var(--color-error);
      pointer-events: none;
      z-index: 3;
    }

    .cal-current-time-dot {
      position: absolute;
      left: -5px;
      top: 50%;
      transform: translateY(-50%);
      width: 10px;
      height: 10px;
      border-radius: var(--radius-full);
      background: var(--color-error);
    }
  `,
})
export class CalendarDayViewComponent implements OnInit, AfterViewInit, OnDestroy {
  protected readonly calendar = inject(CalendarService);
  private readonly zone = inject(NgZone);

  readonly eventClick = output<EventClickPayload>();
  readonly dateClick = output<DateClickPayload>();
  readonly eventDrop = output<EventDropPayload>();
  readonly eventResize = output<EventResizePayload>();
  readonly timeRangeSelect = output<TimeRangeSelectPayload>();

  protected readonly cellHeight = TIME_GRID_HEIGHT_PER_HOUR;
  protected readonly gridHeight = HOURS_IN_DAY * TIME_GRID_HEIGHT_PER_HOUR;

  protected readonly currentTimeTop = signal(0);
  protected readonly showCurrentTimeLine = signal(false);
  protected readonly dropActive = signal(false);

  // ── Drag-to-create state ──────────────────────────────────────────────────
  protected readonly dragSel = signal<DragSelection | null>(null);

  protected readonly selTop = () => {
    const s = this.dragSel();
    if (!s) return 0;
    const min = Math.min(s.startMin, s.endMin);
    return (min / (HOURS_IN_DAY * 60)) * 100;
  };

  protected readonly selHeight = () => {
    const s = this.dragSel();
    if (!s) return 0;
    const duration = Math.abs(s.endMin - s.startMin);
    return (duration / (HOURS_IN_DAY * 60)) * 100;
  };

  protected readonly selTimeLabel = () => {
    const s = this.dragSel();
    if (!s) return '';
    const startMin = Math.min(s.startMin, s.endMin);
    const endMin = Math.max(s.startMin, s.endMin);
    return `${this.minToTimeLabel(startMin)} – ${this.minToTimeLabel(endMin)}`;
  };

  // ── Resize state ──────────────────────────────────────────────────────────
  private resizingEvent: PositionedEvent | null = null;
  private resizeStartY = 0;
  private resizeOriginalEndMin = 0;

  private isDragging = false;
  private isSelecting = false;
  private isResizing = false;
  private timerId: ReturnType<typeof setInterval> | null = null;

  private selMoveListener: ((e: MouseEvent) => void) | null = null;
  private selUpListener: ((e: MouseEvent) => void) | null = null;
  private resizeMoveListener: ((e: MouseEvent) => void) | null = null;
  private resizeUpListener: ((e: MouseEvent) => void) | null = null;

  @ViewChild('dayColEl') private dayColEl!: ElementRef<HTMLDivElement>;
  @ViewChild('scrollArea') private scrollAreaEl!: ElementRef<HTMLDivElement>;

  ngOnInit(): void {
    this.updateCurrentTime();
    this.zone.runOutsideAngular(() => {
      this.timerId = setInterval(() => {
        this.zone.run(() => this.updateCurrentTime());
      }, 60000);
    });
  }

  ngAfterViewInit(): void {
    // Feature 5: Auto-scroll to current time
    this.scrollToCurrentTime();
  }

  ngOnDestroy(): void {
    if (this.timerId !== null) clearInterval(this.timerId);
    this.cleanupSelectionListeners();
    this.cleanupResizeListeners();
  }

  private scrollToCurrentTime(): void {
    const el = this.scrollAreaEl?.nativeElement;
    if (!el) return;
    const top = this.currentTimeTop() - el.clientHeight / 2 + 60;
    el.scrollTop = Math.max(0, top);
  }

  private updateCurrentTime(): void {
    const now = new Date();
    const minutesFromMidnight = now.getHours() * 60 + now.getMinutes();
    const totalMinutes = HOURS_IN_DAY * 60;
    this.currentTimeTop.set((minutesFromMidnight / totalMinutes) * this.gridHeight);
    this.showCurrentTimeLine.set(isSameDay(this.calendar.currentDate(), now));
  }

  protected formatDayFull(day: Date): string {
    return day.toLocaleDateString(this.calendar.locale(), {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
    });
  }

  protected formatTime(d: Date): string {
    return formatEventTime(d, this.calendar.locale());
  }

  protected onEventClick(nativeEvent: MouseEvent, event: CalendarEvent): void {
    nativeEvent.stopPropagation();
    if (this.isDragging || this.isSelecting || this.isResizing) return;
    this.eventClick.emit({ event, nativeEvent });
  }

  protected onColClick(nativeEvent: MouseEvent): void {
    if (this.isDragging || this.isSelecting || this.isResizing) return;
    const target = nativeEvent.currentTarget as HTMLElement;
    const rect = target.getBoundingClientRect();
    const relY = nativeEvent.clientY - rect.top;
    const minutesFromMidnight = (relY / this.gridHeight) * HOURS_IN_DAY * 60;
    const hours = Math.floor(minutesFromMidnight / 60);
    const minutes = Math.round((minutesFromMidnight % 60) / 15) * 15;
    const clickedDate = new Date(this.calendar.currentDate());
    clickedDate.setHours(hours, minutes, 0, 0);
    this.dateClick.emit({ date: clickedDate, allDay: false, nativeEvent });
  }

  // ── Drag-to-create ────────────────────────────────────────────────────────

  protected onColMouseDown(nativeEvent: PointerEvent): void {
    if (nativeEvent.button !== 0) return;
    // Ignore if mousedown landed on a timed event or its resize handle
    const target = nativeEvent.target as HTMLElement;
    if (target.closest('.cal-timed-event')) return;

    const colEl = this.dayColEl?.nativeElement;
    if (!colEl) return;

    nativeEvent.preventDefault();

    const rect = colEl.getBoundingClientRect();
    const startMin = this.snapMinutes(
      Math.max(0, ((nativeEvent.clientY - rect.top) / this.gridHeight) * HOURS_IN_DAY * 60),
    );

    this.isSelecting = true;
    this.dragSel.set({ startMin, endMin: startMin + 30 });

    const currentDate = this.calendar.currentDate();

    // Use pointer capture so pointerup is guaranteed to reach us even if the
    // pointer leaves the element or CDK intercepts document-level events.
    colEl.setPointerCapture(nativeEvent.pointerId);

    const onPointerMove = (e: PointerEvent) => {
      const currentRect = colEl.getBoundingClientRect();
      const endMin = this.snapMinutes(
        Math.min(
          HOURS_IN_DAY * 60,
          Math.max(0, ((e.clientY - currentRect.top) / this.gridHeight) * HOURS_IN_DAY * 60),
        ),
      );
      this.zone.run(() => {
        this.dragSel.update((s) => (s ? { ...s, endMin: Math.max(endMin, startMin + 15) } : s));
      });
    };

    const onPointerUp = () => {
      colEl.releasePointerCapture(nativeEvent.pointerId);
      colEl.removeEventListener('pointermove', onPointerMove);
      colEl.removeEventListener('pointerup', onPointerUp);
      colEl.removeEventListener('pointercancel', onPointerUp);

      this.zone.run(() => {
        const sel = this.dragSel();
        if (sel) {
          const startMinFinal = Math.min(sel.startMin, sel.endMin);
          const endMinFinal = Math.max(sel.startMin, sel.endMin);
          const selStart = new Date(currentDate);
          selStart.setHours(Math.floor(startMinFinal / 60), startMinFinal % 60, 0, 0);
          const selEnd = new Date(currentDate);
          selEnd.setHours(Math.floor(endMinFinal / 60), endMinFinal % 60, 0, 0);

          if (endMinFinal - startMinFinal >= 15) {
            this.timeRangeSelect.emit({ start: selStart, end: selEnd, allDay: false });
          }
        }
        this.dragSel.set(null);
        setTimeout(() => { this.isSelecting = false; }, 0);
      });
    };

    colEl.addEventListener('pointermove', onPointerMove);
    colEl.addEventListener('pointerup', onPointerUp, { once: true });
    colEl.addEventListener('pointercancel', onPointerUp, { once: true });
  }

  private cleanupSelectionListeners(): void {
    if (this.selMoveListener) {
      document.removeEventListener('mousemove', this.selMoveListener);
      this.selMoveListener = null;
    }
    if (this.selUpListener) {
      document.removeEventListener('mouseup', this.selUpListener);
      this.selUpListener = null;
    }
  }


  // ── Event Resizing ────────────────────────────────────────────────────────

  protected onResizeStart(nativeEvent: MouseEvent, pe: PositionedEvent): void {
    nativeEvent.stopPropagation();
    nativeEvent.preventDefault();
    if (nativeEvent.button !== 0) return;

    const colEl = this.dayColEl?.nativeElement;
    if (!colEl) return;

    this.isResizing = true;
    this.resizingEvent = pe;
    this.resizeStartY = nativeEvent.clientY;
    const dayStart = startOfDay(pe.event.start);
    const currentEnd = pe.event.end ?? new Date(pe.event.start.getTime() + 60 * 60 * 1000);
    this.resizeOriginalEndMin = (currentEnd.getTime() - dayStart.getTime()) / 60000;

    this.resizeMoveListener = (_e: MouseEvent) => {
      // Visual-only: Angular CD will handle re-render on mouseup
    };

    this.resizeUpListener = (e: MouseEvent) => {
      if (!this.resizingEvent) return;
      const deltaY = e.clientY - this.resizeStartY;
      const deltaMin = (deltaY / this.gridHeight) * HOURS_IN_DAY * 60;
      const minStartMin = (pe.event.start.getTime() - dayStart.getTime()) / 60000;
      const newEndMin = this.snapMinutes(
        Math.min(HOURS_IN_DAY * 60, Math.max(minStartMin + 15, this.resizeOriginalEndMin + deltaMin)),
      );

      const currentDate = this.calendar.currentDate();
      const newEnd = new Date(currentDate);
      newEnd.setHours(Math.floor(newEndMin / 60), newEndMin % 60, 0, 0);

      this.zone.run(() => {
        this.eventResize.emit({
          event: pe.event,
          newStart: pe.event.start,
          newEnd,
          previousEnd: pe.event.end,
        });
        this.isResizing = false;
        this.resizingEvent = null;
      });
      this.cleanupResizeListeners();
    };

    document.addEventListener('mousemove', this.resizeMoveListener);
    document.addEventListener('mouseup', this.resizeUpListener, { once: true });
  }

  private cleanupResizeListeners(): void {
    if (this.resizeMoveListener) {
      document.removeEventListener('mousemove', this.resizeMoveListener);
      this.resizeMoveListener = null;
    }
    if (this.resizeUpListener) {
      document.removeEventListener('mouseup', this.resizeUpListener);
      this.resizeUpListener = null;
    }
  }

  // ── Drag & Drop ──────────────────────────────────────────────────────────
  protected onDragStart(): void {
    this.isDragging = true;
  }

  protected onDragEnd(): void {
    setTimeout(() => {
      this.isDragging = false;
      this.dropActive.set(false);
    }, 0);
  }

  protected onTimedEventDrop(drop: CdkDragDrop<Date>): void {
    const pe: PositionedEvent = drop.item.data;

    const colEl = this.dayColEl?.nativeElement ?? drop.container.element.nativeElement;
    const colRect = colEl.getBoundingClientRect();

    const pointerY = drop.dropPoint.y - colRect.top;
    const rawMinutes = Math.max(0, (pointerY / this.gridHeight) * HOURS_IN_DAY * 60);
    const snappedMinutes = Math.round(rawMinutes / 15) * 15;
    const clampedMinutes = Math.min(snappedMinutes, HOURS_IN_DAY * 60 - 15);

    const newStart = new Date(this.calendar.currentDate());
    newStart.setHours(
      Math.floor(clampedMinutes / 60),
      clampedMinutes % 60,
      0,
      0,
    );

    const duration = pe.event.end
      ? pe.event.end.getTime() - pe.event.start.getTime()
      : 60 * 60 * 1000;

    const newEnd = new Date(newStart.getTime() + duration);

    this.eventDrop.emit({
      event: pe.event,
      newStart,
      newEnd,
      newAllDay: false,
      previousStart: pe.event.start,
    });
  }

  // ── Helpers ───────────────────────────────────────────────────────────────
  private snapMinutes(minutes: number): number {
    return Math.round(minutes / 15) * 15;
  }

  private minToTimeLabel(minutes: number): string {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    const period = h < 12 ? 'AM' : 'PM';
    const displayH = h === 0 ? 12 : h > 12 ? h - 12 : h;
    return `${displayH}:${String(m).padStart(2, '0')} ${period}`;
  }
}
