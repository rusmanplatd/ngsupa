import { Component, inject, output } from '@angular/core';
import { CalendarService, formatEventTime, isSameDay } from '../calendar.service';
import { CalendarEvent, EventClickPayload, DateClickPayload } from '../calendar.models';

@Component({
  selector: 'app-calendar-schedule-view',
  host: { class: 'block overflow-y-auto' },
  template: `
    <div class="cal-schedule-container">
      @if (calendar.scheduleGroups().length === 0) {
        <!-- Empty state -->
        <div class="cal-schedule-empty">
          <div class="cal-schedule-empty-icon" aria-hidden="true">📅</div>
          <p class="cal-schedule-empty-title">No upcoming events</p>
          <p class="cal-schedule-empty-sub">Events you add will appear here.</p>
        </div>
      } @else {
        @for (group of calendar.scheduleGroups(); track group.date.toISOString()) {
          <div class="cal-schedule-group">
            <!-- Date header -->
            <div
              class="cal-schedule-date-header"
              [class.cal-schedule-date-header--today]="isToday(group.date)"
            >
              <div class="cal-schedule-date-info">
                <span class="cal-schedule-dow">
                  {{ group.date.toLocaleDateString('en-US', { weekday: 'short' }) }}
                </span>
                <span
                  class="cal-schedule-day-num"
                  [class.cal-schedule-day-num--today]="isToday(group.date)"
                >
                  {{ group.date.getDate() }}
                </span>
              </div>
              <span class="cal-schedule-month-year">
                {{ group.date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) }}
              </span>
            </div>

            <!-- Events in this group -->
            <div class="cal-schedule-events">
              @for (evt of group.events; track evt.id) {
                <button
                  type="button"
                  class="cal-schedule-event-row"
                  [class]="'cal-schedule-event-row--' + (evt.color ?? 'primary')"
                  [attr.aria-label]="evt.title + ', ' + (evt.allDay ? 'all day' : formatTime(evt.start))"
                  (click)="onEventClick($event, evt)"
                >
                  <!-- Color accent bar -->
                  <div class="cal-schedule-accent" aria-hidden="true"></div>

                  <!-- Event content -->
                  <div class="cal-schedule-event-content">
                    <div class="cal-schedule-event-header">
                      <span class="cal-schedule-event-title">{{ evt.title }}</span>
                      @if (evt.allDay) {
                        <span class="cal-schedule-all-day-badge">All day</span>
                      }
                    </div>

                    @if (!evt.allDay) {
                      <div class="cal-schedule-event-time">
                        <span>{{ formatTime(evt.start) }}</span>
                        @if (evt.end) {
                          <span> — {{ formatTime(evt.end) }}</span>
                        }
                      </div>
                    }

                    @if (evt.subtitle) {
                      <div class="cal-schedule-event-subtitle">{{ evt.subtitle }}</div>
                    }
                  </div>

                  <!-- Chevron -->
                  <svg
                    class="cal-schedule-chevron"
                    viewBox="0 0 16 16"
                    fill="none"
                    aria-hidden="true"
                  >
                    <path d="M6 4l4 4-4 4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                  </svg>
                </button>
              }
            </div>
          </div>
        }
      }
    </div>
  `,
  styles: `
    :host {
      display: block;
      flex: 1;
      overflow-y: auto;
      scrollbar-width: thin;
    }

    .cal-schedule-container {
      display: flex;
      flex-direction: column;
      gap: 0;
    }

    /* ── Empty state ── */
    .cal-schedule-empty {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 64px 24px;
      gap: 8px;
    }

    .cal-schedule-empty-icon {
      font-size: 3rem;
      margin-bottom: 8px;
    }

    .cal-schedule-empty-title {
      font: var(--type-headline);
      color: var(--text-primary);
      margin: 0;
    }

    .cal-schedule-empty-sub {
      font: var(--type-subheadline);
      color: var(--text-secondary);
      margin: 0;
    }

    /* ── Group ── */
    .cal-schedule-group {
      display: flex;
      flex-direction: column;
    }

    /* ── Date header ── */
    .cal-schedule-date-header {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 10px 16px 8px;
      background: var(--surface-secondary);
      border-bottom: 1px solid var(--separator);
      position: sticky;
      top: 0;
      z-index: 2;
    }

    .cal-schedule-date-header--today {
      background: color-mix(in oklch, var(--color-primary) 6%, var(--surface-secondary));
    }

    .cal-schedule-date-info {
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .cal-schedule-dow {
      font: var(--type-caption-2);
      font-weight: var(--font-weight-semibold);
      color: var(--text-tertiary);
      text-transform: uppercase;
      letter-spacing: var(--tracking-wide);
      min-width: 28px;
    }

    .cal-schedule-day-num {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 28px;
      height: 28px;
      border-radius: var(--radius-full);
      font: var(--type-subheadline);
      font-weight: var(--font-weight-medium);
      color: var(--text-secondary);
    }

    .cal-schedule-day-num--today {
      background: var(--color-primary);
      color: #ffffff;
      font-weight: var(--font-weight-semibold);
    }

    .cal-schedule-month-year {
      font: var(--type-caption-1);
      color: var(--text-tertiary);
      margin-left: auto;
    }

    /* ── Events list ── */
    .cal-schedule-events {
      display: flex;
      flex-direction: column;
      padding: 6px 12px 6px;
      gap: 3px;
      border-bottom: 1px solid var(--border-default);
    }

    /* ── Event row ── */
    .cal-schedule-event-row {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 10px 12px;
      border-radius: var(--radius-md);
      border: none;
      background: var(--surface-elevated);
      cursor: pointer;
      text-align: left;
      transition: background var(--duration-fast) var(--ease-default),
                  transform var(--duration-fast) var(--ease-spring),
                  box-shadow var(--duration-fast) var(--ease-default);
      box-shadow: var(--shadow-xs);
    }

    .cal-schedule-event-row:hover {
      background: var(--fill-primary);
      transform: translateX(2px);
      box-shadow: var(--shadow-sm);
    }

    /* Color accent bar */
    .cal-schedule-accent {
      width: 3px;
      height: 36px;
      border-radius: var(--radius-full);
      flex-shrink: 0;
    }

    .cal-schedule-event-row--primary .cal-schedule-accent  { background: var(--color-primary); }
    .cal-schedule-event-row--success .cal-schedule-accent  { background: var(--color-success); }
    .cal-schedule-event-row--warning .cal-schedule-accent  { background: var(--color-warning); }
    .cal-schedule-event-row--error   .cal-schedule-accent  { background: var(--color-error); }
    .cal-schedule-event-row--info    .cal-schedule-accent  { background: var(--color-info); }
    .cal-schedule-event-row--purple  .cal-schedule-accent  { background: var(--color-system-purple); }
    .cal-schedule-event-row--pink    .cal-schedule-accent  { background: var(--color-system-pink); }
    .cal-schedule-event-row--teal    .cal-schedule-accent  { background: var(--color-system-teal); }

    /* Content */
    .cal-schedule-event-content {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 2px;
      min-width: 0;
    }

    .cal-schedule-event-header {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .cal-schedule-event-title {
      font: var(--type-subheadline);
      font-weight: var(--font-weight-medium);
      color: var(--text-primary);
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .cal-schedule-all-day-badge {
      flex-shrink: 0;
      padding: 1px 6px;
      border-radius: var(--radius-full);
      font: var(--type-caption-2);
      font-weight: var(--font-weight-medium);
      background: var(--fill-secondary);
      color: var(--text-secondary);
    }

    .cal-schedule-event-time {
      font: var(--type-caption-1);
      color: var(--text-secondary);
    }

    .cal-schedule-event-subtitle {
      font: var(--type-caption-2);
      color: var(--text-tertiary);
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    /* Chevron */
    .cal-schedule-chevron {
      width: 16px;
      height: 16px;
      color: var(--text-quaternary);
      flex-shrink: 0;
      transition: color var(--duration-fast), transform var(--duration-fast);
    }

    .cal-schedule-event-row:hover .cal-schedule-chevron {
      color: var(--text-secondary);
      transform: translateX(2px);
    }
  `,
})
export class CalendarScheduleViewComponent {
  protected readonly calendar = inject(CalendarService);

  readonly eventClick = output<EventClickPayload>();
  readonly dateClick = output<DateClickPayload>();

  protected isToday(date: Date): boolean {
    return isSameDay(date, new Date());
  }

  protected formatTime(d: Date): string {
    return formatEventTime(d);
  }

  protected onEventClick(nativeEvent: MouseEvent, event: CalendarEvent): void {
    nativeEvent.stopPropagation();
    this.eventClick.emit({ event, nativeEvent });
  }
}
