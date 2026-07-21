import { Component, inject, output, signal } from '@angular/core';
import { LucideDynamicIcon } from '@lucide/angular';
import { CalendarService, isSameDay } from '../calendar.service';
import { CalendarDay, CalendarEvent, EventClickPayload, DateClickPayload } from '../calendar.models';

@Component({
  selector: 'app-calendar-month-view',
  imports: [LucideDynamicIcon],
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
    <div class="cal-month-grid" role="grid" aria-label="Month calendar">
      @for (week of calendar.monthGrid(); track week[0]?.date.toISOString(); let wi = $index) {
        <div class="cal-week-row" role="row">
          @for (cell of week; track cell.date.toISOString(); let di = $index) {
            <div
              class="cal-day-cell"
              role="gridcell"
              [class.cal-day-cell--other-month]="!cell.isCurrentMonth"
              [class.cal-day-cell--today]="cell.isToday"
              [class.cal-day-cell--weekend]="cell.isWeekend"
              [attr.aria-label]="cell.date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })"
              [attr.aria-current]="cell.isToday ? 'date' : null"
              (click)="onDateClick($event, cell)"
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
                    class="cal-event-pill"
                    [class]="'cal-event-pill--' + (evt.color ?? 'primary')"
                    [attr.aria-label]="evt.title + (evt.allDay ? ', all day' : '')"
                    (click)="onEventClick($event, evt)"
                  >
                    @if (!evt.allDay) {
                      <span class="cal-event-dot" aria-hidden="true"></span>
                    }
                    <span class="cal-event-pill-label">{{ evt.title }}</span>
                  </button>
                }

                @if (cell.overflowEvents.length > 0) {
                  <button
                    type="button"
                    class="cal-overflow-btn"
                    [attr.aria-label]="cell.overflowEvents.length + ' more events on this day'"
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
      <div
        class="cal-overflow-popover"
        role="dialog"
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
            aria-label="Close"
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
    }

    .cal-day-cell:last-child {
      border-right: none;
    }

    .cal-day-cell:hover {
      background: var(--fill-primary);
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
      cursor: pointer;
      text-align: left;
      transition: opacity var(--duration-fast) var(--ease-default),
                  transform var(--duration-fast) var(--ease-spring);
      overflow: hidden;
    }

    .cal-event-pill:hover {
      opacity: 0.85;
      transform: scaleX(0.98);
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
export class CalendarMonthViewComponent {
  protected readonly calendar = inject(CalendarService);

  readonly eventClick = output<EventClickPayload>();
  readonly dateClick = output<DateClickPayload>();

  protected readonly overflowCell = signal<CalendarDay | null>(null);
  protected readonly allCellEvents = signal<CalendarEvent[]>([]);

  readonly dowLabels = this.buildDowLabels();

  private buildDowLabels(): string[] {
    const fdw = this.calendar.firstDayOfWeek();
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const ordered = [...days.slice(fdw), ...days.slice(0, fdw)];
    return ordered;
  }

  protected onEventClick(nativeEvent: MouseEvent, event: CalendarEvent): void {
    nativeEvent.stopPropagation();
    this.eventClick.emit({ event, nativeEvent });
  }

  protected onDateClick(nativeEvent: MouseEvent, cell: CalendarDay): void {
    this.closeOverflow();
    this.dateClick.emit({ date: cell.date, allDay: true, nativeEvent });
  }

  protected onOverflowClick(nativeEvent: MouseEvent, cell: CalendarDay): void {
    nativeEvent.stopPropagation();
    this.overflowCell.set(cell);
    this.allCellEvents.set([...cell.events, ...cell.overflowEvents]);
  }

  protected closeOverflow(): void {
    this.overflowCell.set(null);
  }
}
