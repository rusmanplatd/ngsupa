import {
  Component,
  inject,
  output,
  signal,
  OnInit,
  OnDestroy,
  NgZone,
} from '@angular/core';
import { CalendarService, formatEventTime, isSameDay } from '../calendar.service';
import { CalendarEvent, EventClickPayload, DateClickPayload, PositionedEvent, TIME_GRID_HEIGHT_PER_HOUR, HOURS_IN_DAY } from '../calendar.models';

@Component({
  selector: 'app-calendar-day-view',
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
          class="cal-day-col"
          (click)="onColClick($event)"
          [attr.aria-label]="calendar.currentDate().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })"
        >
          @for (slot of calendar.timeSlots(); track slot.hour) {
            <div class="cal-hour-line" [style.top.px]="slot.hour * cellHeight" aria-hidden="true"></div>
            <div class="cal-half-hour-line" [style.top.px]="slot.hour * cellHeight + cellHeight / 2" aria-hidden="true"></div>
          }

          @for (pe of calendar.dayPositionedEvents(); track pe.event.id) {
            <button
              type="button"
              class="cal-timed-event"
              [class]="'cal-event--' + (pe.event.color ?? 'primary')"
              [style.top.%]="pe.top"
              [style.height.%]="pe.height"
              [style.left.%]="pe.left + 0.5"
              [style.width.%]="pe.width - 1"
              [attr.aria-label]="pe.event.title + ', ' + formatTime(pe.event.start)"
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
      cursor: pointer;
      text-align: left;
      overflow: hidden;
      border-left: 4px solid currentColor;
      transition: opacity var(--duration-fast),
                  transform var(--duration-fast) var(--ease-spring),
                  box-shadow var(--duration-fast);
      min-height: 24px;
    }

    .cal-timed-event:hover {
      opacity: 0.88;
      transform: scale(1.005);
      box-shadow: var(--shadow-md);
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

  protected readonly cellHeight = TIME_GRID_HEIGHT_PER_HOUR;
  protected readonly gridHeight = HOURS_IN_DAY * TIME_GRID_HEIGHT_PER_HOUR;

  protected readonly currentTimeTop = signal(0);
  protected readonly showCurrentTimeLine = signal(false);

  private timerId: ReturnType<typeof setInterval> | null = null;

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
    this.eventClick.emit({ event, nativeEvent });
  }

  protected onColClick(nativeEvent: MouseEvent): void {
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
}
