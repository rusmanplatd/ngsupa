// ─────────────────────────────────────────────────────────────────────────────
// Calendar Models
// ─────────────────────────────────────────────────────────────────────────────

export type CalendarView = 'month' | 'week' | 'day' | 'schedule';

export type CalendarEventColor =
  | 'primary'
  | 'success'
  | 'warning'
  | 'error'
  | 'info'
  | 'purple'
  | 'pink'
  | 'teal';

export interface CalendarEvent {
  id: string | number;
  title: string;
  start: Date;
  end?: Date;
  /** If true, the event spans the full day and renders in the all-day banner */
  allDay?: boolean;
  color?: CalendarEventColor;
  /** Optional subtitle / location shown in week/day detail */
  subtitle?: string;
  /** Arbitrary consumer data passed through to click outputs */
  data?: unknown;
}

/** Internal computed day cell used in month/week views */
export interface CalendarDay {
  date: Date;
  /** Day-of-month number */
  day: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  isWeekend: boolean;
  events: CalendarEvent[];
  /** Events beyond MAX_VISIBLE_EVENTS — shown as "+N more" */
  overflowEvents: CalendarEvent[];
}

/** Internal time-slot used in week/day views */
export interface TimeSlot {
  hour: number;
  label: string; // e.g. "9 AM"
}

/** Positioned event block for the time-grid (week/day) */
export interface PositionedEvent {
  event: CalendarEvent;
  /** top offset as percent of total grid height */
  top: number;
  /** height as percent of total grid height */
  height: number;
  /** left offset as percent of available column width (for overlap layout) */
  left: number;
  /** width as percent of available column width */
  width: number;
  /** column index in the day column (for overlap grouping) */
  columnIndex: number;
  /** total visible concurrent columns in the overlap group (capped at MAX_CONCURRENT_EVENTS) */
  totalColumns: number;
  /** Number of events hidden from view due to the column cap; non-zero only on the last visible event of a group */
  overflowCount: number;
}

/** Payload emitted when the user clicks an event */
export interface EventClickPayload {
  event: CalendarEvent;
  /** Native mouse event for positioning (e.g. popover) */
  nativeEvent: MouseEvent;
}

/** Payload emitted when the user clicks an empty date/time cell */
export interface DateClickPayload {
  date: Date;
  allDay: boolean;
  nativeEvent: MouseEvent;
}

/** Payload emitted when the active view or period changes */
export interface ViewChangePayload {
  view: CalendarView;
  start: Date;
  end: Date;
}

/** Payload emitted when the user drags an event to a new time/date */
export interface EventDropPayload {
  event: CalendarEvent;
  newStart: Date;
  newEnd: Date | undefined;
  newAllDay: boolean;
  previousStart: Date;
}

/** Payload emitted when the user drags the bottom handle of an event to resize it */
export interface EventResizePayload {
  event: CalendarEvent;
  newStart: Date;
  newEnd: Date;
  previousEnd: Date | undefined;
}

/** Payload emitted when the user drag-selects an empty time range */
export interface TimeRangeSelectPayload {
  start: Date;
  end: Date;
  allDay: boolean;
}

export const MAX_VISIBLE_EVENTS_MONTH = 3;
/** Maximum number of overlapping timed events shown side-by-side in week/day grids */
export const MAX_CONCURRENT_EVENTS = 3;
export const HOURS_IN_DAY = 24;
export const DAY_START_HOUR = 0;
export const TIME_GRID_HEIGHT_PER_HOUR = 64; // px per hour in week/day view
