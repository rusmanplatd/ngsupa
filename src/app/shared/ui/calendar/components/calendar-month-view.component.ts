import {
  Component,
  inject,
  output,
  signal,
  computed,
  ViewChildren,
  QueryList,
  ElementRef,
  AfterViewInit,
  OnDestroy,
} from '@angular/core';
import { LucideDynamicIcon } from '@lucide/angular';
import {
  CdkDrag,
  CdkDropList,
  CdkDragDrop,
  CdkDragPreview,
  CdkDropListGroup,
} from '@angular/cdk/drag-drop';
import { A11yModule } from '@angular/cdk/a11y';
import { CalendarService, isSameDay, addDays, startOfDay } from '../calendar.service';
import {
  CalendarDay,
  CalendarEvent,
  EventClickPayload,
  DateClickPayload,
  EventDropPayload,
} from '../calendar.models';

@Component({
  selector: 'app-calendar-month-view',
  imports: [LucideDynamicIcon, CdkDrag, CdkDropList, CdkDragPreview, CdkDropListGroup, A11yModule],
  host: { class: 'flex flex-col overflow-hidden' },
  template: `
    <!-- Day-of-week header row -->
    <div class="cal-month-dow-row" role="row">
      @for (label of dowLabels; track label) {
        <div class="cal-dow-cell" role="columnheader" [attr.aria-label]="label">
          {{ label.slice(0, 3) }}
        </div>
      }
    </div>

    <!-- Week rows -->
    <div
      cdkDropListGroup
      class="cal-month-grid"
      role="grid"
      aria-label="Month calendar"
      aria-multiselectable="false"
      (keydown)="onGridKeydown($event)"
    >
      @for (week of calendar.monthGrid(); track week[0]?.date.toISOString(); let wi = $index) {
        <div class="cal-week-row" role="row">
          @for (cell of week; track cell.date.toISOString(); let di = $index) {
            <div
              #dayCellEl
              cdkDropList
              [cdkDropListData]="cell"
              (cdkDropListDropped)="onEventDrop($event)"
              class="cal-day-cell"
              role="gridcell"
              [class.cal-day-cell--other-month]="!cell.isCurrentMonth"
              [class.cal-day-cell--today]="cell.isToday"
              [class.cal-day-cell--weekend]="cell.isWeekend"
              [class.cal-day-cell--focused]="isFocusedDate(cell.date)"
              [attr.aria-label]="cell.date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })"
              [attr.aria-current]="cell.isToday ? 'date' : null"
              [attr.tabindex]="isFocusedDate(cell.date) ? 0 : -1"
              [attr.data-date]="cell.date.toISOString()"
              (click)="onDateClick($event, cell)"
              (focus)="focusedDate.set(cell.date)"
            >
              <!-- Day number -->
              <div class="cal-day-number-wrap">
                <span class="cal-day-number" [class.cal-day-number--today]="cell.isToday">
                  {{ cell.day }}
                </span>
              </div>

              <!-- Events -->
              <div class="cal-day-events">
                @for (evt of cell.events; track evt.id) {
                  <button
                    type="button"
                    cdkDrag
                    [cdkDragData]="evt"
                    (cdkDragStarted)="onDragStart()"
                    (cdkDragEnded)="onDragEnd()"
                    class="cal-event-pill"
                    [class]="'cal-event-pill--' + (evt.color ?? 'primary')"
                    [attr.aria-label]="evt.title + (evt.allDay ? ', all day' : '')"
                    (click)="onEventClick($event, evt)"
                  >
                    @if (!evt.allDay) {
                      <span class="cal-event-dot" aria-hidden="true"></span>
                    }
                    <span class="cal-event-pill-label">{{ evt.title }}</span>

                    <!-- Drag preview -->
                    <ng-template cdkDragPreview>
                      <div class="cal-drag-preview" [class]="'cal-drag-preview--' + (evt.color ?? 'primary')">
                        <span class="cal-event-dot" aria-hidden="true"></span>
                        <span>{{ evt.title }}</span>
                      </div>
                    </ng-template>
                  </button>
                }

                @if (cell.overflowEvents.length > 0) {
                  <button
                    type="button"
                    class="cal-overflow-btn"
                    [attr.aria-label]="cell.overflowEvents.length + ' more events on this day, click to view'"
                    (click)="onOverflowClick($event, cell)"
                  >
                    +{{ cell.overflowEvents.length }} more
                  </button>
                }
              </div>
            </div>
          }
        </div>
      }
    </div>

    <!-- Overflow Popover -->
    @if (overflowCell()) {
      <!-- Backdrop -->
      <div
        class="cal-overflow-backdrop"
        aria-hidden="true"
        (click)="closeOverflow()"
      ></div>
      <div
        cdkTrapFocus
        cdkTrapFocusAutoCapture
        class="cal-overflow-popover"
        role="dialog"
        aria-modal="true"
        [attr.aria-label]="overflowCell()!.date.toLocaleDateString('en-US', { month: 'long', day: 'numeric' }) + ' events'"
        (keydown.escape)="closeOverflow()"
      >
        <div class="cal-overflow-popover-header">
          <span class="cal-overflow-popover-date">
            {{ overflowCell()!.date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }) }}
          </span>
          <button
            type="button"
            class="cal-overflow-close-btn"
            aria-label="Close events popover"
            (click)="closeOverflow()"
          >
            <svg lucideIcon="x" [size]="14" aria-hidden="true"></svg>
          </button>
        </div>
        <div class="cal-overflow-popover-events">
          @for (evt of allCellEvents(); track evt.id) {
            <button
              type="button"
              class="cal-overflow-event-row"
              [class]="'cal-overflow-event-row--' + (evt.color ?? 'primary')"
              [attr.aria-label]="evt.title + ', ' + (evt.allDay ? 'all day' : evt.start.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }))"
              (click)="onEventClick($event, evt)"
            >
              <span class="cal-overflow-event-dot" aria-hidden="true"></span>
              <div class="cal-overflow-event-info">
                <span class="cal-overflow-event-title">{{ evt.title }}</span>
                @if (!evt.allDay && evt.start) {
                  <span class="cal-overflow-event-time">
                    {{ evt.start.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }) }}
                  </span>
                }
              </div>
            </button>
          }
        </div>
      </div>
    }
  `,
  styles: `
    :host {
      flex: 1;
      min-height: 0;
    }

    /* ── Day-of-week header ── */
    .cal-month-dow-row {
      display: grid;
      grid-template-columns: repeat(7, 1fr);
      border-bottom: 1px solid var(--border-default);
      background: var(--surface-secondary);
    }

    .cal-dow-cell {
      padding: 6px 8px;
      font: var(--type-caption-1);
      font-weight: var(--font-weight-semibold);
      color: var(--text-tertiary);
      text-align: center;
      letter-spacing: var(--tracking-wide);
      text-transform: uppercase;
    }

    /* ── Month grid ── */
    .cal-month-grid {
      display: flex;
      flex-direction: column;
      flex: 1;
    }

    .cal-week-row {
      display: grid;
      grid-template-columns: repeat(7, 1fr);
      flex: 1;
      min-height: 110px;
    }

    .cal-week-row:not(:last-child) {
      border-bottom: 1px solid var(--border-default);
    }

    /* ── Day cell ── */
    .cal-day-cell {
      position: relative;
      padding: 6px 8px 8px;
      border-right: 1px solid var(--border-default);
      cursor: pointer;
      transition: background var(--duration-fast) var(--ease-default);
      overflow: hidden;
      outline: none;
    }

    .cal-day-cell:last-child {
      border-right: none;
    }

    .cal-day-cell:hover {
      background: var(--fill-primary);
    }

    .cal-day-cell:focus-visible,
    .cal-day-cell--focused:focus-visible {
      outline: 2px solid var(--color-primary);
      outline-offset: -2px;
      z-index: 1;
    }

    .cal-day-cell--other-month {
      background: var(--surface-secondary);
    }

    .cal-day-cell--other-month .cal-day-number {
      color: var(--text-quaternary);
    }

    .cal-day-cell--today {
      background: var(--interactive-tint);
    }

    /* CDK drop-list active feedback */
    .cal-day-cell.cdk-drop-list-dragging {
      background: color-mix(in oklch, var(--color-primary) 8%, transparent);
    }

    /* ── Day number ── */
    .cal-day-number-wrap {
      display: flex;
      justify-content: center;
      margin-bottom: 4px;
    }

    .cal-day-number {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 26px;
      height: 26px;
      border-radius: var(--radius-full);
      font: var(--type-caption-1);
      font-weight: var(--font-weight-medium);
      color: var(--text-secondary);
      transition: background var(--duration-fast) var(--ease-default);
    }

    .cal-day-number--today {
      background: var(--color-primary);
      color: #ffffff;
      font-weight: var(--font-weight-semibold);
    }

    /* ── Event pill ── */
    .cal-day-events {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .cal-event-pill {
      display: flex;
      align-items: center;
      gap: 4px;
      width: 100%;
      padding: 2px 5px;
      border-radius: var(--radius-xs);
      font: var(--type-caption-2);
      font-weight: var(--font-weight-medium);
      border: none;
      cursor: grab;
      text-align: left;
      transition: opacity var(--duration-fast) var(--ease-default),
                  transform var(--duration-fast) var(--ease-spring);
      overflow: hidden;
    }

    .cal-event-pill:hover {
      opacity: 0.85;
      transform: scaleX(0.98);
    }

    .cal-event-pill:focus-visible {
      outline: 2px solid var(--color-primary);
      outline-offset: 1px;
    }

    .cal-event-pill:active {
      cursor: grabbing;
    }

    .cal-event-dot {
      width: 6px;
      height: 6px;
      border-radius: var(--radius-full);
      flex-shrink: 0;
      background: currentColor;
      opacity: 0.7;
    }

    .cal-event-pill-label {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      flex: 1;
    }

    /* Event color variants */
    .cal-event-pill--primary { background: var(--color-primary-container); color: var(--color-primary); }
    .cal-event-pill--success { background: var(--color-success-container); color: var(--color-success); }
    .cal-event-pill--warning { background: var(--color-warning-container); color: var(--color-warning); }
    .cal-event-pill--error   { background: var(--color-error-container);   color: var(--color-error); }
    .cal-event-pill--info    { background: var(--color-info-container);     color: var(--color-info); }
    .cal-event-pill--purple  { background: var(--color-system-purple-light); color: var(--color-system-purple); }
    .cal-event-pill--pink    { background: var(--color-system-pink-light);   color: var(--color-system-pink); }
    .cal-event-pill--teal    { background: var(--color-system-teal-light);   color: var(--color-system-teal); }

    /* ── CDK drag global styles ── */
    .cdk-drag-placeholder {
      opacity: 0.25;
      background: var(--fill-secondary) !important;
      border: 2px dashed var(--border-default) !important;
      border-radius: var(--radius-xs);
    }

    .cdk-drag-animating {
      transition: transform 200ms var(--ease-spring);
    }

    /* ── Drag preview ── */
    .cal-drag-preview {
      display: flex;
      align-items: center;
      gap: 4px;
      padding: 3px 8px;
      border-radius: var(--radius-sm);
      font: var(--type-caption-2);
      font-weight: var(--font-weight-medium);
      box-shadow: var(--shadow-xl);
      opacity: 0.92;
      pointer-events: none;
    }

    .cal-drag-preview--primary { background: var(--color-primary-container); color: var(--color-primary); }
    .cal-drag-preview--success { background: var(--color-success-container); color: var(--color-success); }
    .cal-drag-preview--warning { background: var(--color-warning-container); color: var(--color-warning); }
    .cal-drag-preview--error   { background: var(--color-error-container);   color: var(--color-error); }
    .cal-drag-preview--info    { background: var(--color-info-container);     color: var(--color-info); }
    .cal-drag-preview--purple  { background: var(--color-system-purple-light); color: var(--color-system-purple); }
    .cal-drag-preview--pink    { background: var(--color-system-pink-light);   color: var(--color-system-pink); }
    .cal-drag-preview--teal    { background: var(--color-system-teal-light);   color: var(--color-system-teal); }

    /* Overflow */
    .cal-overflow-btn {
      font: var(--type-caption-2);
      font-weight: var(--font-weight-medium);
      color: var(--text-secondary);
      background: none;
      border: none;
      padding: 1px 4px;
      cursor: pointer;
      border-radius: var(--radius-xs);
      text-align: left;
      transition: color var(--duration-fast);
    }

    .cal-overflow-btn:hover {
      color: var(--color-primary);
    }

    .cal-overflow-btn:focus-visible {
      outline: 2px solid var(--color-primary);
      outline-offset: 1px;
    }

    /* ── Overflow backdrop ── */
    .cal-overflow-backdrop {
      position: fixed;
      inset: 0;
      z-index: calc(var(--z-modal) - 1);
    }

    /* ── Overflow popover ── */
    .cal-overflow-popover {
      position: fixed;
      z-index: var(--z-modal);
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      min-width: 220px;
      max-width: 300px;
      background: var(--surface-elevated);
      border: 1px solid var(--border-default);
      border-radius: var(--radius-lg);
      box-shadow: var(--shadow-xl);
      animation: scale-in 0.2s var(--ease-spring);
    }

    .cal-overflow-popover-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 10px 12px 8px;
      border-bottom: 1px solid var(--separator);
    }

    .cal-overflow-popover-date {
      font: var(--type-footnote);
      font-weight: var(--font-weight-semibold);
      color: var(--text-primary);
    }

    .cal-overflow-close-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 22px;
      height: 22px;
      border-radius: var(--radius-full);
      background: var(--fill-secondary);
      border: none;
      color: var(--text-secondary);
      cursor: pointer;
      transition: background var(--duration-fast);
    }

    .cal-overflow-close-btn:hover {
      background: var(--fill-primary);
    }

    .cal-overflow-close-btn:focus-visible {
      outline: 2px solid var(--color-primary);
      outline-offset: 2px;
    }

    .cal-overflow-popover-events {
      display: flex;
      flex-direction: column;
      padding: 6px;
      gap: 2px;
    }

    .cal-overflow-event-row {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 7px 8px;
      border-radius: var(--radius-sm);
      border: none;
      background: transparent;
      cursor: pointer;
      text-align: left;
      transition: background var(--duration-fast);
      width: 100%;
    }

    .cal-overflow-event-row:hover {
      background: var(--fill-primary);
    }

    .cal-overflow-event-row:focus-visible {
      outline: 2px solid var(--color-primary);
      outline-offset: 1px;
    }

    .cal-overflow-event-dot {
      width: 8px;
      height: 8px;
      border-radius: var(--radius-full);
      flex-shrink: 0;
    }

    .cal-overflow-event-row--primary .cal-overflow-event-dot  { background: var(--color-primary); }
    .cal-overflow-event-row--success .cal-overflow-event-dot  { background: var(--color-success); }
    .cal-overflow-event-row--warning .cal-overflow-event-dot  { background: var(--color-warning); }
    .cal-overflow-event-row--error   .cal-overflow-event-dot  { background: var(--color-error); }
    .cal-overflow-event-row--info    .cal-overflow-event-dot  { background: var(--color-info); }
    .cal-overflow-event-row--purple  .cal-overflow-event-dot  { background: var(--color-system-purple); }
    .cal-overflow-event-row--pink    .cal-overflow-event-dot  { background: var(--color-system-pink); }
    .cal-overflow-event-row--teal    .cal-overflow-event-dot  { background: var(--color-system-teal); }

    .cal-overflow-event-info {
      display: flex;
      flex-direction: column;
      gap: 1px;
      overflow: hidden;
    }

    .cal-overflow-event-title {
      font: var(--type-caption-1);
      font-weight: var(--font-weight-medium);
      color: var(--text-primary);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .cal-overflow-event-time {
      font: var(--type-caption-2);
      color: var(--text-secondary);
    }
  `,
})
export class CalendarMonthViewComponent implements AfterViewInit, OnDestroy {
  protected readonly calendar = inject(CalendarService);

  readonly eventClick = output<EventClickPayload>();
  readonly dateClick = output<DateClickPayload>();
  readonly eventDrop = output<EventDropPayload>();

  protected readonly overflowCell = signal<CalendarDay | null>(null);
  protected readonly allCellEvents = signal<CalendarEvent[]>([]);
  protected readonly focusedDate = signal<Date>(new Date());
  private isDragging = false;
  private overflowTriggerEl: HTMLElement | null = null;

  @ViewChildren('dayCellEl') private dayCells!: QueryList<ElementRef<HTMLDivElement>>;

  readonly dowLabels = this.buildDowLabels();

  ngAfterViewInit(): void {
    // Ensure focused date is valid when view first renders
    const grid = this.calendar.monthGrid();
    if (grid.length > 0 && grid[0].length > 0) {
      const today = new Date();
      // Try to focus today if visible
      const flatCells = grid.flat();
      const todayCell = flatCells.find((c) => isSameDay(c.date, today) && c.isCurrentMonth);
      if (todayCell) this.focusedDate.set(todayCell.date);
      else this.focusedDate.set(flatCells.find((c) => c.isCurrentMonth)?.date ?? today);
    }
  }

  ngOnDestroy(): void {
    this.overflowTriggerEl = null;
  }

  private buildDowLabels(): string[] {
    const fdw = this.calendar.firstDayOfWeek();
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return [...days.slice(fdw), ...days.slice(0, fdw)];
  }

  protected isFocusedDate(date: Date): boolean {
    return isSameDay(date, this.focusedDate());
  }

  // ── Keyboard navigation (roving tabindex) ─────────────────────────────────
  protected onGridKeydown(event: KeyboardEvent): void {
    const current = this.focusedDate();
    let next: Date | null = null;

    switch (event.key) {
      case 'ArrowRight':
        next = addDays(current, 1);
        break;
      case 'ArrowLeft':
        next = addDays(current, -1);
        break;
      case 'ArrowDown':
        next = addDays(current, 7);
        break;
      case 'ArrowUp':
        next = addDays(current, -7);
        break;
      case 'PageDown':
        event.preventDefault();
        this.calendar.navigateNext();
        return;
      case 'PageUp':
        event.preventDefault();
        this.calendar.navigatePrev();
        return;
      case 'Home':
        // Go to first day of current month
        next = startOfDay(new Date(current.getFullYear(), current.getMonth(), 1));
        break;
      case 'End':
        // Go to last day of current month
        next = startOfDay(new Date(current.getFullYear(), current.getMonth() + 1, 0));
        break;
      case 'Enter':
      case ' ': {
        event.preventDefault();
        const flatCells = this.calendar.monthGrid().flat();
        const cell = flatCells.find((c) => isSameDay(c.date, current));
        if (cell) this.dateClick.emit({ date: cell.date, allDay: true, nativeEvent: event as unknown as MouseEvent });
        return;
      }
      default:
        return;
    }

    if (next) {
      event.preventDefault();
      this.focusedDate.set(next);
      // If the next date is outside the current grid, navigate the month
      const grid = this.calendar.monthGrid();
      const flatDates = grid.flat().map((c) => c.date);
      const isVisible = flatDates.some((d) => isSameDay(d, next!));
      if (!isVisible) {
        if (next > flatDates[flatDates.length - 1]) this.calendar.navigateNext();
        else this.calendar.navigatePrev();
      }
      // Focus the DOM element after Angular renders
      setTimeout(() => this.focusCellForDate(next!), 0);
    }
  }

  private focusCellForDate(date: Date): void {
    const el = this.dayCells.find(
      (ref) => !!ref.nativeElement.dataset['date'] &&
               isSameDay(new Date(ref.nativeElement.dataset['date']!), date)
    );
    el?.nativeElement.focus();
  }

  // ── Events ────────────────────────────────────────────────────────────────
  protected onEventClick(nativeEvent: MouseEvent, event: CalendarEvent): void {
    nativeEvent.stopPropagation();
    if (this.isDragging) return;
    this.eventClick.emit({ event, nativeEvent });
  }

  protected onDateClick(nativeEvent: MouseEvent, cell: CalendarDay): void {
    if (this.isDragging) return;
    this.closeOverflow();
    this.focusedDate.set(cell.date);
    this.dateClick.emit({ date: cell.date, allDay: true, nativeEvent });
  }

  protected onOverflowClick(nativeEvent: MouseEvent, cell: CalendarDay): void {
    nativeEvent.stopPropagation();
    this.overflowTriggerEl = nativeEvent.currentTarget as HTMLElement;
    this.overflowCell.set(cell);
    this.allCellEvents.set([...cell.events, ...cell.overflowEvents]);
  }

  protected closeOverflow(): void {
    this.overflowCell.set(null);
    this.overflowTriggerEl?.focus();
    this.overflowTriggerEl = null;
  }

  // ── Drag & Drop ──────────────────────────────────────────────────────────
  protected onDragStart(): void {
    this.isDragging = true;
  }

  protected onDragEnd(): void {
    // Reset after a tick so click event fired on drop doesn't trigger
    setTimeout(() => { this.isDragging = false; }, 0);
  }

  protected onEventDrop(drop: CdkDragDrop<CalendarDay>): void {
    const event: CalendarEvent = drop.item.data;
    const targetCell: CalendarDay = drop.container.data;

    // Preserve the original time, only change the date
    const srcDate = event.start;
    const tgt = targetCell.date;
    const newStart = new Date(tgt);
    newStart.setHours(srcDate.getHours(), srcDate.getMinutes(), srcDate.getSeconds(), 0);

    const newEnd = event.end
      ? (() => {
          const duration = event.end.getTime() - event.start.getTime();
          return new Date(newStart.getTime() + duration);
        })()
      : undefined;

    // Skip if dropped on same day
    if (isSameDay(event.start, newStart)) return;

    this.eventDrop.emit({
      event,
      newStart,
      newEnd,
      newAllDay: event.allDay ?? false,
      previousStart: event.start,
    });
  }
}
