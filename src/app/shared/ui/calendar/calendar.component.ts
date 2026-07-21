import {
  Component,
  input,
  output,
  effect,
  OnInit,
  inject,
  Injector,
} from '@angular/core';
import { CalendarService } from './calendar.service';
import { CalendarHeaderComponent } from './components/calendar-header.component';
import { CalendarMonthViewComponent } from './components/calendar-month-view.component';
import { CalendarWeekViewComponent } from './components/calendar-week-view.component';
import { CalendarDayViewComponent } from './components/calendar-day-view.component';
import { CalendarScheduleViewComponent } from './components/calendar-schedule-view.component';
import {
  CalendarEvent,
  CalendarView,
  EventClickPayload,
  DateClickPayload,
  ViewChangePayload,
} from './calendar.models';

@Component({
  selector: 'app-calendar',
  imports: [
    CalendarHeaderComponent,
    CalendarMonthViewComponent,
    CalendarWeekViewComponent,
    CalendarDayViewComponent,
    CalendarScheduleViewComponent,
  ],
  providers: [CalendarService],
  host: {
    class: 'block',
    role: 'application',
    'aria-label': 'Calendar',
  },
  template: `
    <div class="cal-root">
      <!-- Header toolbar -->
      <app-calendar-header />

      <!-- View content -->
      <div class="cal-body" [attr.aria-label]="svc.periodTitle() + ' calendar'">
        @switch (svc.view()) {
          @case ('month') {
            <div class="cal-view-layer">
              <app-calendar-month-view
                (eventClick)="eventClick.emit($event)"
                (dateClick)="dateClick.emit($event)"
              />
            </div>
          }
          @case ('week') {
            <div class="cal-view-layer">
              <app-calendar-week-view
                (eventClick)="eventClick.emit($event)"
                (dateClick)="dateClick.emit($event)"
              />
            </div>
          }
          @case ('day') {
            <div class="cal-view-layer">
              <app-calendar-day-view
                (eventClick)="eventClick.emit($event)"
                (dateClick)="dateClick.emit($event)"
              />
            </div>
          }
          @case ('schedule') {
            <div class="cal-view-layer">
              <app-calendar-schedule-view
                (eventClick)="eventClick.emit($event)"
                (dateClick)="dateClick.emit($event)"
              />
            </div>
          }
        }
      </div>
    </div>
  `,
  styles: `
    :host {
      display: block;
      height: 100%;
    }

    .cal-root {
      display: flex;
      flex-direction: column;
      background: var(--surface-primary);
      border-radius: var(--radius-xl);
      border: 1px solid var(--border-default);
      box-shadow: var(--shadow-lg);
      overflow: hidden;
      height: 100%;
      min-height: 480px;
    }

    .cal-body {
      display: flex;
      flex-direction: column;
      flex: 1;
      min-height: 0;
      overflow: hidden;
    }

    /* Month view expands naturally */
    .cal-view-layer {
      flex: 1;
      display: flex;
      flex-direction: column;
      min-height: 0;
      animation: cal-view-in 0.22s var(--ease-default);
    }

    @keyframes cal-view-in {
      from { opacity: 0; transform: translateY(4px) scale(0.995); }
      to   { opacity: 1; transform: translateY(0) scale(1); }
    }
  `,
})
export class CalendarComponent implements OnInit {
  private readonly injector = inject(Injector);
  protected readonly svc = inject(CalendarService);

  // ── Inputs ───────────────────────────────────────────────────────────────
  readonly events = input<CalendarEvent[]>([]);
  readonly initialView = input<CalendarView>('month');
  readonly initialDate = input<Date | null>(null);
  readonly firstDayOfWeek = input<0 | 1>(1);

  // ── Outputs ──────────────────────────────────────────────────────────────
  readonly eventClick = output<EventClickPayload>();
  readonly dateClick = output<DateClickPayload>();
  readonly viewChange = output<ViewChangePayload>();

  ngOnInit(): void {
    // Apply initial config
    this.svc.view.set(this.initialView());
    this.svc.firstDayOfWeek.set(this.firstDayOfWeek());
    if (this.initialDate()) {
      this.svc.currentDate.set(this.initialDate()!);
    }
    this.svc.events.set(this.events());

    // Sync events input → service whenever it changes
    effect(
      () => {
        this.svc.events.set(this.events());
      },
      { injector: this.injector },
    );

    // Emit viewChange when view or currentDate changes
    effect(
      () => {
        const view = this.svc.view();
        const start = this.svc.periodStart();
        const end = this.svc.periodEnd();
        this.viewChange.emit({ view, start, end });
      },
      { injector: this.injector },
    );
  }
}
