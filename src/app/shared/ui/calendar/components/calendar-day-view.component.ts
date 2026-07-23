import {
  Component,
  inject,
  output,
  signal,
  OnInit,
  OnDestroy,
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
import { CalendarService, formatEventTime, isSameDay } from '../calendar.service';
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
    <div class="cal-day-scroll-area">
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
          [attr.aria-label]="calendar.currentDate().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })"
          (click)="onColClick($event)"
        >
          @for (slot of calendar.timeSlots(); track slot.hour) {
            <div class="cal-hour-line" [style.top.px]="slot.hour * cellHeight" aria-hidden="true"></div>
            <div class="cal-half-hour-line" [style.top.px]="slot.hour * cellHeight + cellHeight / 2" aria-hidden="true"></div>
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
      cursor: pointer;
      background: color-mix(in oklch, var(--color-primary) 2%, transparent);
      transition: background var(--duration-fast);
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

    /* ── Drag preview block ── */
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
export class CalendarDayViewComponent implements OnInit, OnDestroy {
  protected readonly calendar = inject(CalendarService);
  private readonly zone = inject(NgZone);

  readonly eventClick = output<EventClickPayload>();
  readonly dateClick = output<DateClickPayload>();
  readonly eventDrop = output<EventDropPayload>();

  protected readonly cellHeight = TIME_GRID_HEIGHT_PER_HOUR;
  protected readonly gridHeight = HOURS_IN_DAY * TIME_GRID_HEIGHT_PER_HOUR;

  protected readonly currentTimeTop = signal(0);
  protected readonly showCurrentTimeLine = signal(false);
  protected readonly dropActive = signal(false);

  private isDragging = false;
  private timerId: ReturnType<typeof setInterval> | null = null;

  @ViewChild('dayColEl') private dayColEl!: ElementRef<HTMLDivElement>;

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
    this.currentTimeTop.set((minutesFromMidnight / totalMinutes) * this.gridHeight);
    this.showCurrentTimeLine.set(isSameDay(this.calendar.currentDate(), now));
  }

  protected formatTime(d: Date): string {
    return formatEventTime(d);
  }

  protected onEventClick(nativeEvent: MouseEvent, event: CalendarEvent): void {
    nativeEvent.stopPropagation();
    if (this.isDragging) return;
    this.eventClick.emit({ event, nativeEvent });
  }

  protected onColClick(nativeEvent: MouseEvent): void {
    if (this.isDragging) return;
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
}
