import {
  Component,
  inject,
  output,
  computed,
  signal,
  OnInit,
  OnDestroy,
  NgZone,
  ViewChildren,
  QueryList,
  ElementRef,
} from '@angular/core';
import {
  CdkDrag,
  CdkDropList,
  CdkDragDrop,
  CdkDragPreview,
  CdkDropListGroup,
} from '@angular/cdk/drag-drop';
import {
  CalendarService,
  formatHour,
  formatEventTime,
  startOfDay,
  isSameDay,
} from '../calendar.service';
import {
  CalendarEvent,
  EventClickPayload,
  DateClickPayload,
  EventDropPayload,
  PositionedEvent,
  TIME_GRID_HEIGHT_PER_HOUR,
  HOURS_IN_DAY,
} from '../calendar.models';

@Component({
  selector: 'app-calendar-week-view',
  imports: [CdkDrag, CdkDropList, CdkDragPreview, CdkDropListGroup],
  host: { class: 'flex flex-col overflow-hidden' },
  template: `
    <!-- Single scroll container: all rows share the same width so columns align perfectly -->
    <div class="cal-week-scroll-area" #scrollArea>

      <!-- Day column headers (sticky at very top) -->
      <div class="cal-week-day-headers" role="row" aria-label="Days of the week">
        <div class="cal-time-gutter-spacer" aria-hidden="true"></div>
        @for (day of calendar.weekDays(); track day.toISOString(); let di = $index) {
          <div
            class="cal-week-day-header"
            role="columnheader"
            [class.cal-week-day-header--today]="isToday(day)"
            [attr.aria-label]="day.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })"
          >
            <span class="cal-week-dow">{{ day.toLocaleDateString('en-US', { weekday: 'short' }) }}</span>
            <span
              class="cal-week-day-num"
              [class.cal-week-day-num--today]="isToday(day)"
            >{{ day.getDate() }}</span>
          </div>
        }
      </div>

      <!-- All-day banner (sticky just below day headers) -->
      <div class="cal-week-allday-row" role="row" aria-label="All day events">
        <div class="cal-time-gutter-spacer" aria-hidden="true"></div>

        @for (day of calendar.weekDays(); track day.toISOString(); let i = $index) {
          <div
            class="cal-week-allday-cell"
            [class.cal-week-allday-cell--today]="isToday(day)"
            role="gridcell"
            [attr.aria-label]="day.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' }) + ' all day events'"
          >
            @for (evt of getWeekAllDay(i); track evt.id) {
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
        }
      </div>

      <!-- Time grid -->
      <div cdkDropListGroup class="cal-week-time-grid" [style.height.px]="gridHeight">

        <!-- Time gutter -->
        <div class="cal-time-gutter" aria-hidden="true">
          @for (slot of calendar.timeSlots(); track slot.hour) {
            <div class="cal-time-label" [style.top.px]="slot.hour * cellHeight">
              {{ slot.label }}
            </div>
          }
        </div>

        <!-- Day columns -->
        @for (day of calendar.weekDays(); track day.toISOString(); let di = $index) {
          <div
            #dayColEl
            cdkDropList
            [cdkDropListData]="day"
            (cdkDropListDropped)="onTimedEventDrop($event)"
            (cdkDropListEntered)="activeColIndex.set(di)"
            (cdkDropListExited)="activeColIndex.set(-1)"
            class="cal-week-day-col"
            role="region"
            [class.cal-week-day-col--today]="isToday(day)"
            [class.cal-week-day-col--drop-active]="activeColIndex() === di"
            [attr.aria-label]="day.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })"
            (click)="onColClick($event, day, di)"
          >
            <!-- Hour grid lines -->
            @for (slot of calendar.timeSlots(); track slot.hour) {
              <div
                class="cal-hour-line"
                [style.top.px]="slot.hour * cellHeight"
                aria-hidden="true"
              ></div>
            }

            <!-- Half-hour grid lines -->
            @for (slot of calendar.timeSlots(); track slot.hour) {
              <div
                class="cal-half-hour-line"
                [style.top.px]="slot.hour * cellHeight + cellHeight / 2"
                aria-hidden="true"
              ></div>
            }

            <!-- Positioned events -->
            @for (pe of getWeekEvents(di); track pe.event.id) {
              <button
                type="button"
                cdkDrag
                [cdkDragData]="pe"
                cdkDragBoundary=".cal-week-time-grid"
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
                <span class="cal-timed-event-title">{{ pe.event.title }}</span>
                @if (pe.event.subtitle) {
                  <span class="cal-timed-event-subtitle">{{ pe.event.subtitle }}</span>
                }
                <span class="cal-timed-event-time">{{ formatTime(pe.event.start) }}</span>

                <!-- Overflow badge -->
                @if (pe.overflowCount > 0) {
                  <span class="cal-overflow-badge" aria-hidden="true">+{{ pe.overflowCount }}</span>
                }

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
        }

        <!-- Current time indicator -->
        @if (showCurrentTimeLine()) {
          <div
            class="cal-current-time-line"
            [style.top.px]="currentTimeTop()"
            aria-hidden="true"
          >
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

    /* ── Single scroll container ── */
    .cal-week-scroll-area {
      flex: 1;
      overflow-y: auto;
      overflow-x: hidden;
      scrollbar-width: thin;
    }

    /* ── Day column headers (sticky at very top) ── */
    .cal-week-day-headers {
      display: flex;
      border-bottom: 1px solid var(--border-default);
      background: var(--surface-primary);
      position: sticky;
      top: 0;
      z-index: 3;
    }

    /* ── All-day banner (sticky just below day headers ≈52px) ── */
    .cal-week-allday-row {
      display: flex;
      border-bottom: 1px solid var(--border-default);
      min-height: 36px;
      background: var(--surface-secondary);
      position: sticky;
      top: 52px;
      z-index: 2;
    }

    /* Shared gutter spacer used by both header row and all-day row */
    .cal-time-gutter-spacer {
      width: 56px;
      flex-shrink: 0;
      border-right: 1px solid var(--border-default);
    }

    /* ── Day header cells ── */
    .cal-week-day-header {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 6px 4px;
      border-right: 1px solid var(--border-default);
      gap: 2px;
    }

    .cal-week-day-header:last-child { border-right: none; }

    .cal-week-dow {
      font: var(--type-caption-2);
      color: var(--text-tertiary);
      font-weight: var(--font-weight-semibold);
      text-transform: uppercase;
      letter-spacing: var(--tracking-wide);
    }

    .cal-week-day-num {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 28px;
      height: 28px;
      border-radius: var(--radius-full);
      font: var(--type-subheadline);
      font-weight: var(--font-weight-medium);
      color: var(--text-secondary);
      transition: background var(--duration-fast);
    }

    .cal-week-day-num--today {
      background: var(--color-primary);
      color: #ffffff;
      font-weight: var(--font-weight-semibold);
    }

    /* ── All-day cells ── */
    .cal-week-allday-cell {
      flex: 1;
      padding: 3px 4px;
      display: flex;
      flex-direction: column;
      gap: 2px;
      border-right: 1px solid var(--border-default);
      min-width: 0;
    }

    .cal-week-allday-cell:last-child { border-right: none; }

    .cal-week-allday-cell--today {
      background: var(--interactive-tint);
    }

    .cal-week-allday-pill {
      display: block;
      width: 100%;
      padding: 2px 6px;
      border-radius: var(--radius-xs);
      font: var(--type-caption-2);
      font-weight: var(--font-weight-medium);
      border: none;
      cursor: pointer;
      text-align: left;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      transition: opacity var(--duration-fast);
    }

    .cal-week-allday-pill:hover { opacity: 0.8; }

    .cal-week-allday-pill:focus-visible {
      outline: 2px solid var(--color-primary);
      outline-offset: 1px;
    }

    /* ── Time grid ── */
    .cal-week-time-grid {
      display: flex;
      position: relative;
    }

    /* ── Time gutter ── */
    .cal-time-gutter {
      width: 56px;
      flex-shrink: 0;
      position: relative;
      border-right: 1px solid var(--border-default);
    }

    .cal-time-label {
      position: absolute;
      right: 8px;
      transform: translateY(-50%);
      font: var(--type-caption-2);
      color: var(--text-tertiary);
      white-space: nowrap;
      pointer-events: none;
      user-select: none;
    }

    /* ── Day columns ── */
    .cal-week-day-col {
      flex: 1;
      position: relative;
      border-right: 1px solid var(--border-default);
      cursor: pointer;
      transition: background var(--duration-fast);
    }

    .cal-week-day-col:last-child { border-right: none; }

    .cal-week-day-col--today {
      background: color-mix(in oklch, var(--color-primary) 3%, transparent);
    }

    .cal-week-day-col--drop-active {
      background: color-mix(in oklch, var(--color-primary) 8%, transparent);
    }

    /* Prevent click events propagating during CDK drag */
    .cal-week-day-col.cdk-drop-list-dragging {
      cursor: grabbing;
    }

    /* ── Grid lines ── */
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

    /* ── Timed event block ── */
    .cal-timed-event {
      position: absolute;
      border-radius: var(--radius-sm);
      padding: 3px 6px;
      font-size: 0.6875rem;
      border: none;
      cursor: grab;
      text-align: left;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      gap: 1px;
      border-left: 3px solid currentColor;
      transition: opacity var(--duration-fast) var(--ease-default),
                  transform var(--duration-fast) var(--ease-spring),
                  box-shadow var(--duration-fast) var(--ease-default);
      min-height: 20px;
    }

    .cal-timed-event:active {
      cursor: grabbing;
    }

    .cal-timed-event:hover {
      opacity: 0.88;
      transform: scale(1.01);
      box-shadow: var(--shadow-sm);
    }

    .cal-timed-event:focus-visible {
      outline: 2px solid var(--color-primary);
      outline-offset: 2px;
    }

    .cal-timed-event-title {
      font-weight: var(--font-weight-semibold);
      color: inherit;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      line-height: 1.2;
    }

    .cal-timed-event-subtitle {
      font-size: 0.625rem;
      color: inherit;
      opacity: 0.7;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .cal-timed-event-time {
      font-size: 0.625rem;
      color: inherit;
      opacity: 0.75;
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
      border-radius: var(--radius-sm);
      background: var(--fill-secondary) !important;
    }

    .cdk-drag-animating {
      transition: transform 200ms var(--ease-spring);
    }

    /* ── Drag preview block ── */
    /* ── Overflow badge ── */
    .cal-overflow-badge {
      position: absolute;
      bottom: 3px;
      right: 4px;
      background: oklch(from currentColor l c h / 0.18);
      color: inherit;
      border-radius: var(--radius-full);
      font-size: 0.55rem;
      font-weight: var(--font-weight-semibold);
      padding: 1px 4px;
      line-height: 1.4;
      letter-spacing: 0.02em;
      pointer-events: none;
      white-space: nowrap;
    }

    .cal-drag-preview-block {
      display: flex;
      flex-direction: column;
      gap: 2px;
      padding: 4px 8px;
      border-radius: var(--radius-sm);
      border-left: 3px solid currentColor;
      font-size: 0.6875rem;
      box-shadow: var(--shadow-xl);
      opacity: 0.92;
      min-width: 80px;
      pointer-events: none;
    }

    /* ── Current time indicator ── */
    .cal-current-time-line {
      position: absolute;
      left: 56px;
      right: 0;
      height: 2px;
      background: var(--color-error);
      pointer-events: none;
      z-index: 3;
    }

    .cal-current-time-dot {
      position: absolute;
      left: -4px;
      top: 50%;
      transform: translateY(-50%);
      width: 8px;
      height: 8px;
      border-radius: var(--radius-full);
      background: var(--color-error);
    }
  `,
})
export class CalendarWeekViewComponent implements OnInit, OnDestroy {
  protected readonly calendar = inject(CalendarService);
  private readonly zone = inject(NgZone);

  readonly eventClick = output<EventClickPayload>();
  readonly dateClick = output<DateClickPayload>();
  readonly eventDrop = output<EventDropPayload>();

  protected readonly cellHeight = TIME_GRID_HEIGHT_PER_HOUR;
  protected readonly gridHeight = HOURS_IN_DAY * TIME_GRID_HEIGHT_PER_HOUR;

  protected readonly currentTimeTop = signal(0);
  protected readonly showCurrentTimeLine = signal(false);
  protected readonly activeColIndex = signal(-1);

  private isDragging = false;
  private timerId: ReturnType<typeof setInterval> | null = null;

  @ViewChildren('dayColEl') private dayCols!: QueryList<ElementRef<HTMLDivElement>>;

  ngOnInit(): void {
    this.updateCurrentTime();
    this.zone.runOutsideAngular(() => {
      this.timerId = setInterval(() => {
        this.zone.run(() => this.updateCurrentTime());
      }, 60000);
    });
  }

  ngOnDestroy(): void {
    if (this.timerId !== null) clearInterval(this.timerId);
  }

  private updateCurrentTime(): void {
    const now = new Date();
    const minutesFromMidnight = now.getHours() * 60 + now.getMinutes();
    const totalMinutes = HOURS_IN_DAY * 60;
    const top = (minutesFromMidnight / totalMinutes) * this.gridHeight;
    this.currentTimeTop.set(top);

    const today = now;
    const days = this.calendar.weekDays();
    this.showCurrentTimeLine.set(days.some((d) => isSameDay(d, today)));
  }

  protected isToday(day: Date): boolean {
    return isSameDay(day, new Date());
  }

  protected getWeekEvents(dayIndex: number): PositionedEvent[] {
    return this.calendar.weekPositionedEvents().get(dayIndex) ?? [];
  }

  protected getWeekAllDay(dayIndex: number): CalendarEvent[] {
    return this.calendar.weekAllDayEvents().get(dayIndex) ?? [];
  }

  protected formatTime(d: Date): string {
    return formatEventTime(d);
  }

  protected onEventClick(nativeEvent: MouseEvent, event: CalendarEvent): void {
    nativeEvent.stopPropagation();
    if (this.isDragging) return;
    this.eventClick.emit({ event, nativeEvent });
  }

  protected onColClick(nativeEvent: MouseEvent, day: Date, _di: number): void {
    if (this.isDragging) return;
    const target = nativeEvent.currentTarget as HTMLElement;
    const rect = target.getBoundingClientRect();
    const relY = nativeEvent.clientY - rect.top;
    const minutesFromMidnight = (relY / this.gridHeight) * HOURS_IN_DAY * 60;
    const hours = Math.floor(minutesFromMidnight / 60);
    const minutes = Math.round((minutesFromMidnight % 60) / 15) * 15;
    const clickedDate = new Date(day);
    clickedDate.setHours(hours, minutes, 0, 0);
    this.dateClick.emit({ date: clickedDate, allDay: false, nativeEvent });
  }

  // ── Drag & Drop ──────────────────────────────────────────────────────────
  protected onDragStart(): void {
    this.isDragging = true;
  }

  protected onDragEnd(): void {
    setTimeout(() => {
      this.isDragging = false;
      this.activeColIndex.set(-1);
    }, 0);
  }

  protected onTimedEventDrop(drop: CdkDragDrop<Date>): void {
    const pe: PositionedEvent = drop.item.data;
    const targetDay: Date = drop.container.data;

    // Find the column element to compute pointer-relative Y
    const colIndex = this.calendar.weekDays().findIndex((d) => isSameDay(d, targetDay));
    const colEls = this.dayCols.toArray();
    const colEl = colEls[colIndex]?.nativeElement ?? drop.container.element.nativeElement;
    const colRect = colEl.getBoundingClientRect();

    const pointerY = drop.dropPoint.y - colRect.top;
    const rawMinutes = Math.max(0, (pointerY / this.gridHeight) * HOURS_IN_DAY * 60);
    const snappedMinutes = Math.round(rawMinutes / 15) * 15;
    const clampedMinutes = Math.min(snappedMinutes, HOURS_IN_DAY * 60 - 15);

    const newStart = new Date(targetDay);
    newStart.setHours(
      Math.floor(clampedMinutes / 60),
      clampedMinutes % 60,
      0,
      0,
    );

    const duration = pe.event.end
      ? pe.event.end.getTime() - pe.event.start.getTime()
      : 60 * 60 * 1000; // default 1 hour

    const newEnd = new Date(newStart.getTime() + duration);

    this.eventDrop.emit({
      event: pe.event,
      newStart,
      newEnd,
      newAllDay: false,
      previousStart: pe.event.start,
    });
  }
}
