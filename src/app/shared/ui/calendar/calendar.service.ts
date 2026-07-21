import { Injectable, signal, computed } from '@angular/core';
import {
  CalendarView,
  CalendarEvent,
  CalendarDay,
  TimeSlot,
  PositionedEvent,
  MAX_VISIBLE_EVENTS_MONTH,
  TIME_GRID_HEIGHT_PER_HOUR,
  HOURS_IN_DAY,
} from './calendar.models';

@Injectable()
export class CalendarService {
  // ── State Signals ─────────────────────────────────────────────────────────
  readonly currentDate = signal<Date>(new Date());
  readonly view = signal<CalendarView>('month');
  readonly events = signal<CalendarEvent[]>([]);
  readonly firstDayOfWeek = signal<0 | 1>(1); // 0=Sunday, 1=Monday

  // ── Derived: Range of visible period ─────────────────────────────────────
  readonly periodStart = computed<Date>(() => {
    const d = this.currentDate();
    const v = this.view();
    if (v === 'month') return startOfMonth(d);
    if (v === 'week') return startOfWeek(d, this.firstDayOfWeek());
    if (v === 'day') return startOfDay(d);
    // schedule: next 30 days
    return startOfDay(d);
  });

  readonly periodEnd = computed<Date>(() => {
    const d = this.currentDate();
    const v = this.view();
    if (v === 'month') return endOfMonth(d);
    if (v === 'week') return endOfWeek(d, this.firstDayOfWeek());
    if (v === 'day') return endOfDay(d);
    return addDays(startOfDay(d), 30);
  });

  // ── Derived: Title label ──────────────────────────────────────────────────
  readonly periodTitle = computed<string>(() => {
    const d = this.currentDate();
    const v = this.view();
    const locale = 'en-US';

    if (v === 'month') {
      return d.toLocaleDateString(locale, { month: 'long', year: 'numeric' });
    }
    if (v === 'day') {
      return d.toLocaleDateString(locale, {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      });
    }
    if (v === 'week') {
      const start = startOfWeek(d, this.firstDayOfWeek());
      const end = endOfWeek(d, this.firstDayOfWeek());
      if (start.getMonth() === end.getMonth()) {
        return `${start.toLocaleDateString(locale, { month: 'long' })} ${start.getDate()}–${end.getDate()}, ${start.getFullYear()}`;
      }
      return `${start.toLocaleDateString(locale, { month: 'short', day: 'numeric' })} – ${end.toLocaleDateString(locale, { month: 'short', day: 'numeric', year: 'numeric' })}`;
    }
    // schedule
    return `Schedule — ${d.toLocaleDateString(locale, { month: 'long', year: 'numeric' })}`;
  });

  // ── Derived: Month Grid ───────────────────────────────────────────────────
  readonly monthGrid = computed<CalendarDay[][]>(() => {
    const d = this.currentDate();
    const evts = this.events();
    const fdw = this.firstDayOfWeek();

    const monthStart = startOfMonth(d);
    const monthEnd = endOfMonth(d);
    const gridStart = startOfWeek(monthStart, fdw);

    // Build 6 weeks × 7 days
    const today = startOfDay(new Date());
    const grid: CalendarDay[][] = [];
    let current = new Date(gridStart);

    for (let week = 0; week < 6; week++) {
      const row: CalendarDay[] = [];
      for (let dayIdx = 0; dayIdx < 7; dayIdx++) {
        const cell = new Date(current);
        const cellStart = startOfDay(cell);
        const cellEnd = endOfDay(cell);

        const dayEvents = evts
          .filter((e) => eventOverlapsDay(e, cellStart, cellEnd))
          .sort((a, b) => a.start.getTime() - b.start.getTime());

        const visibleEvents = dayEvents.slice(0, MAX_VISIBLE_EVENTS_MONTH);
        const overflowEvents = dayEvents.slice(MAX_VISIBLE_EVENTS_MONTH);

        row.push({
          date: cell,
          day: cell.getDate(),
          isCurrentMonth: cell.getMonth() === d.getMonth(),
          isToday: isSameDay(cell, today),
          isWeekend: cell.getDay() === 0 || cell.getDay() === 6,
          events: visibleEvents,
          overflowEvents,
        });

        current = addDays(current, 1);
      }
      grid.push(row);
    }

    return grid;
  });

  // ── Derived: Week Day Columns ─────────────────────────────────────────────
  readonly weekDays = computed<Date[]>(() => {
    const start = startOfWeek(this.currentDate(), this.firstDayOfWeek());
    return Array.from({ length: 7 }, (_, i) => addDays(start, i));
  });

  // ── Derived: Time Slots ───────────────────────────────────────────────────
  readonly timeSlots = computed<TimeSlot[]>(() =>
    Array.from({ length: HOURS_IN_DAY }, (_, i) => ({
      hour: i,
      label: formatHour(i),
    })),
  );

  // ── Derived: Positioned Events for Week View ──────────────────────────────
  readonly weekPositionedEvents = computed<Map<number, PositionedEvent[]>>(() => {
    const days = this.weekDays();
    const evts = this.events();
    const map = new Map<number, PositionedEvent[]>();

    days.forEach((day, dayIdx) => {
      const dayStart = startOfDay(day);
      const dayEnd = endOfDay(day);
      const dayEvents = evts
        .filter((e) => !e.allDay && eventOverlapsDay(e, dayStart, dayEnd))
        .sort((a, b) => a.start.getTime() - b.start.getTime());

      map.set(dayIdx, layoutPositionedEvents(dayEvents, dayStart));
    });

    return map;
  });

  // ── Derived: Positioned Events for Day View ───────────────────────────────
  readonly dayPositionedEvents = computed<PositionedEvent[]>(() => {
    const d = this.currentDate();
    const dayStart = startOfDay(d);
    const dayEnd = endOfDay(d);
    const evts = this.events().filter(
      (e) => !e.allDay && eventOverlapsDay(e, dayStart, dayEnd),
    );
    return layoutPositionedEvents(evts, dayStart);
  });

  // ── Derived: All-day events for Day View ─────────────────────────────────
  readonly dayAllDayEvents = computed<CalendarEvent[]>(() => {
    const d = this.currentDate();
    const dayStart = startOfDay(d);
    const dayEnd = endOfDay(d);
    return this.events().filter((e) => e.allDay && eventOverlapsDay(e, dayStart, dayEnd));
  });

  // ── Derived: All-day events per week day ─────────────────────────────────
  readonly weekAllDayEvents = computed<Map<number, CalendarEvent[]>>(() => {
    const days = this.weekDays();
    const evts = this.events();
    const map = new Map<number, CalendarEvent[]>();
    days.forEach((day, idx) => {
      const dayStart = startOfDay(day);
      const dayEnd = endOfDay(day);
      map.set(
        idx,
        evts.filter((e) => e.allDay && eventOverlapsDay(e, dayStart, dayEnd)),
      );
    });
    return map;
  });

  // ── Derived: Schedule Groups ──────────────────────────────────────────────
  readonly scheduleGroups = computed<{ date: Date; events: CalendarEvent[] }[]>(() => {
    const start = startOfDay(this.currentDate());
    const evts = this.events();
    const groups: { date: Date; events: CalendarEvent[] }[] = [];

    for (let i = 0; i < 60; i++) {
      const day = addDays(start, i);
      const dayStart = startOfDay(day);
      const dayEnd = endOfDay(day);
      const dayEvents = evts
        .filter((e) => eventOverlapsDay(e, dayStart, dayEnd))
        .sort((a, b) => (a.allDay ? -1 : b.allDay ? 1 : a.start.getTime() - b.start.getTime()));
      if (dayEvents.length > 0) {
        groups.push({ date: day, events: dayEvents });
      }
    }
    return groups;
  });

  // ── Navigation Actions ────────────────────────────────────────────────────
  navigatePrev(): void {
    this.currentDate.update((d) => {
      switch (this.view()) {
        case 'month': return subtractMonths(d, 1);
        case 'week': return addDays(d, -7);
        case 'day': return addDays(d, -1);
        default: return addDays(d, -30);
      }
    });
  }

  navigateNext(): void {
    this.currentDate.update((d) => {
      switch (this.view()) {
        case 'month': return addMonths(d, 1);
        case 'week': return addDays(d, 7);
        case 'day': return addDays(d, 1);
        default: return addDays(d, 30);
      }
    });
  }

  navigateToday(): void {
    this.currentDate.set(new Date());
  }

  navigateToDate(date: Date): void {
    this.currentDate.set(date);
  }

  setView(view: CalendarView): void {
    this.view.set(view);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Pure date helpers (no external lib dependency)
// ─────────────────────────────────────────────────────────────────────────────

export function startOfDay(d: Date): Date {
  const n = new Date(d);
  n.setHours(0, 0, 0, 0);
  return n;
}

export function endOfDay(d: Date): Date {
  const n = new Date(d);
  n.setHours(23, 59, 59, 999);
  return n;
}

export function startOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1, 0, 0, 0, 0);
}

export function endOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999);
}

export function startOfWeek(d: Date, firstDay: 0 | 1 = 1): Date {
  const n = new Date(d);
  const day = n.getDay();
  const diff = (day - firstDay + 7) % 7;
  n.setDate(n.getDate() - diff);
  n.setHours(0, 0, 0, 0);
  return n;
}

export function endOfWeek(d: Date, firstDay: 0 | 1 = 1): Date {
  const start = startOfWeek(d, firstDay);
  const n = addDays(start, 6);
  n.setHours(23, 59, 59, 999);
  return n;
}

export function addDays(d: Date, days: number): Date {
  const n = new Date(d);
  n.setDate(n.getDate() + days);
  return n;
}

export function addMonths(d: Date, months: number): Date {
  const n = new Date(d);
  const targetMonth = n.getMonth() + months;
  n.setMonth(targetMonth);
  // Handle month overflow (e.g., Jan 31 + 1 month = Feb 28)
  const daysInTarget = new Date(n.getFullYear(), n.getMonth() + 1, 0).getDate();
  if (n.getDate() > daysInTarget) n.setDate(daysInTarget);
  return n;
}

export function subtractMonths(d: Date, months: number): Date {
  return addMonths(d, -months);
}

export function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export function eventOverlapsDay(event: CalendarEvent, dayStart: Date, dayEnd: Date): boolean {
  const evStart = event.start.getTime();
  const evEnd = event.end ? event.end.getTime() : evStart;
  return evStart <= dayEnd.getTime() && evEnd >= dayStart.getTime();
}

export function formatHour(hour: number): string {
  if (hour === 0) return '12 AM';
  if (hour < 12) return `${hour} AM`;
  if (hour === 12) return '12 PM';
  return `${hour - 12} PM`;
}

export function formatEventTime(d: Date): string {
  return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
}

/**
 * Layout overlapping timed events into columns using a greedy algorithm.
 * Returns PositionedEvent[] with top/height/left/width in percentages relative
 * to a 24-hour grid.
 */
function layoutPositionedEvents(
  events: CalendarEvent[],
  dayStart: Date,
): PositionedEvent[] {
  if (events.length === 0) return [];

  const totalMinutes = HOURS_IN_DAY * 60;
  const dayStartMs = dayStart.getTime();

  // Build groups of overlapping events
  const columns: CalendarEvent[][] = [];

  for (const event of events) {
    const evStart = Math.max(0, (event.start.getTime() - dayStartMs) / 60000);
    const evEnd = event.end
      ? Math.min(totalMinutes, (event.end.getTime() - dayStartMs) / 60000)
      : evStart + 60;

    let placed = false;
    for (const col of columns) {
      const lastInCol = col[col.length - 1]!;
      const lastEnd = lastInCol.end
        ? (lastInCol.end.getTime() - dayStartMs) / 60000
        : (lastInCol.start.getTime() - dayStartMs) / 60000 + 60;
      if (evStart >= lastEnd) {
        col.push(event);
        placed = true;
        break;
      }
    }
    if (!placed) columns.push([event]);
  }

  // Assign position info
  const result: PositionedEvent[] = [];
  const totalColumns = columns.length;

  columns.forEach((col, colIdx) => {
    col.forEach((event) => {
      const evStartMin = Math.max(0, (event.start.getTime() - dayStartMs) / 60000);
      const evEndMin = event.end
        ? Math.min(totalMinutes, (event.end.getTime() - dayStartMs) / 60000)
        : evStartMin + 60;
      const durationMin = Math.max(30, evEndMin - evStartMin);

      result.push({
        event,
        top: (evStartMin / totalMinutes) * 100,
        height: (durationMin / totalMinutes) * 100,
        left: (colIdx / totalColumns) * 100,
        width: (1 / totalColumns) * 100,
        columnIndex: colIdx,
        totalColumns,
      });
    });
  });

  return result;
}
