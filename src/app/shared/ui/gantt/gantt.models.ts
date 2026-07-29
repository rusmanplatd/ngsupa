// ─────────────────────────────────────────────────────────────────────────────
// Gantt Chart Models
// ─────────────────────────────────────────────────────────────────────────────

// ── View Modes ────────────────────────────────────────────────────────────────

/** Timeline zoom / grouping granularity */
export type GanttViewMode = 'day' | 'week' | 'month';

// ── Task Colors ───────────────────────────────────────────────────────────────

/** Maps to Apple system color tokens defined in styles.css */
export type GanttTaskColor =
  | 'blue'
  | 'green'
  | 'orange'
  | 'red'
  | 'purple'
  | 'teal'
  | 'pink'
  | 'indigo'
  | 'yellow';

// ── Core Data Interfaces ──────────────────────────────────────────────────────

/**
 * A single Gantt task. `T` is the consumer's arbitrary payload type,
 * defaulting to `unknown` so the component works without generics.
 */
export interface GanttTask<T = unknown> {
  /** Unique identifier */
  id: string | number;
  /** Display label shown in the sidebar and on the bar */
  title: string;
  /** Task start (time component is ignored in week/month view) */
  start: Date;
  /** Task end (inclusive) */
  end: Date;
  /** Completion percentage 0–100 */
  progress?: number;
  /** Preset color from the Apple system palette */
  color?: GanttTaskColor;
  /** IDs of tasks this task depends on (predecessors) */
  dependencies?: (string | number)[];
  /** Optional group / phase label — tasks sharing the same value are grouped */
  group?: string;
  /** When true the task row is hidden (group is collapsed) */
  collapsed?: boolean;
  /** Whether the task is a milestone (zero-duration diamond marker) */
  milestone?: boolean;
  /** Arbitrary consumer payload — passed through to all output events */
  data?: T;
}

/** Represents a group/phase header row */
export interface GanttGroup {
  id: string;
  title: string;
  collapsed: boolean;
  tasks: GanttTask[];
  color?: GanttTaskColor;
}

// ── Special Date Overrides ────────────────────────────────────────────────────

/**
 * A single calendar-date override that marks a day as a holiday (non-working)
 * or as a forced workday (overrides default weekend shading).
 */
export interface GanttSpecialDate {
  /**
   * The date to mark. Accepts a `Date` object or an ISO string `"YYYY-MM-DD"`.
   * The time component is ignored — only the calendar day matters.
   */
  date: Date | string;
  /**
   * `'holiday'`  → non-working day (red/orange tint, indicator dot).
   * `'workday'`  → force-working day; strips the weekend tint so the column
   *                looks like a normal weekday.
   */
  type: 'holiday' | 'workday';
  /** Optional human-readable label shown as a tooltip or legend (e.g. "Independence Day") */
  label?: string;
}

// ── Configuration ─────────────────────────────────────────────────────────────

export interface GanttConfig {
  /** Initial view mode */
  viewMode: GanttViewMode;
  /** Height of each task row in pixels */
  rowHeight: number;
  /** Width of the task-list sidebar in pixels */
  sidebarWidth: number;
  /** Whether to render dependency arrows */
  showDependencies: boolean;
  /** Disable all interactive drag/resize */
  readonly: boolean;
  /** Locale string for date formatting (e.g. 'en-US') */
  locale: string;
  /** Calendar-date overrides — mark days as holidays or force-working days */
  specialDates: GanttSpecialDate[];
}

export const DEFAULT_GANTT_CONFIG: GanttConfig = {
  viewMode: 'week',
  rowHeight: 44,
  sidebarWidth: 240,
  showDependencies: true,
  readonly: false,
  locale: 'en-US',
  specialDates: [],
};

// ── Internal Computed Models ───────────────────────────────────────────────────

/** A single column in the timeline header */
export interface GanttTimeColumn {
  /** ISO date string used as a key */
  key: string;
  date: Date;
  /** Primary label (e.g. "Mon 28" in week mode, "28" in day mode) */
  label: string;
  /** Secondary label — shown in a super-row (e.g. "July 2026") */
  superLabel?: string;
  /** Emit a super-row boundary (render the super label above this column) */
  isSuperStart?: boolean;
  isToday: boolean;
  isWeekend: boolean;
  /** True when the date is explicitly marked as a holiday */
  isHoliday: boolean;
  /** True when a weekend day is explicitly forced to be a workday */
  isWorkday: boolean;
  /** Optional label from the matching GanttSpecialDate (e.g. "Independence Day") */
  specialLabel?: string;
  /** Pixel offset from timeline origin */
  offsetPx: number;
  /** Column width in pixels */
  widthPx: number;
}

/** Positioned task bar for rendering on the grid */
export interface GanttBarLayout {
  task: GanttTask;
  /** Left offset from timeline origin (px) */
  left: number;
  /** Bar width (px) */
  width: number;
  /** Top offset within the row track (px) */
  top: number;
  /** Bar height (px) */
  height: number;
  /** Row index (0-based) */
  rowIndex: number;
}

/** SVG path data for a dependency arrow */
export interface GanttDependencyArrow {
  fromTaskId: string | number;
  toTaskId: string | number;
  /** SVG path `d` attribute */
  path: string;
}

/**
 * A unified row entry for rendering — used by both the sidebar and the timeline
 * so they always iterate the exact same list and stay pixel-aligned.
 */
export type GanttRowItem =
  | { type: 'group'; group: GanttGroup }
  | { type: 'task'; task: GanttTask; visualIndex: number };

// ── Output Event Payloads ─────────────────────────────────────────────────────

export interface GanttTaskClickPayload<T = unknown> {
  task: GanttTask<T>;
  nativeEvent: MouseEvent;
}

export interface GanttTaskDropPayload<T = unknown> {
  task: GanttTask<T>;
  newStart: Date;
  newEnd: Date;
  previousStart: Date;
  previousEnd: Date;
}

export interface GanttTaskResizePayload<T = unknown> {
  task: GanttTask<T>;
  edge: 'start' | 'end';
  newStart: Date;
  newEnd: Date;
  previousStart: Date;
  previousEnd: Date;
}

export interface GanttViewModeChangePayload {
  previous: GanttViewMode;
  current: GanttViewMode;
}

/** Emitted when a task's progress is changed via the progress drag handle */
export interface GanttTaskProgressChangePayload<T = unknown> {
  task: GanttTask<T>;
  newProgress: number;
  previousProgress: number;
}

/** Emitted when a task's title is renamed via inline editing */
export interface GanttTaskRenamePayload<T = unknown> {
  task: GanttTask<T>;
  newTitle: string;
  previousTitle: string;
}

/** Emitted when tasks are reordered via drag-and-drop in the sidebar */
export interface GanttTaskReorderPayload {
  /** ID of the task that was moved */
  taskId: string | number;
  /** New 0-based index within the flat visible task list */
  newIndex: number;
  previousIndex: number;
}

// ── Constants ─────────────────────────────────────────────────────────────────

/** Cell width in pixels per view mode */
export const CELL_WIDTH: Record<GanttViewMode, number> = {
  day: 64,
  week: 48,
  month: 28,
};

/** Minimum bar width so milestones and tiny tasks remain clickable */
export const MIN_BAR_WIDTH_PX = 8;

/** Bar height as fraction of rowHeight */
export const BAR_HEIGHT_RATIO = 0.6;

/** Color CSS variable map */
export const TASK_COLOR_MAP: Record<GanttTaskColor, string> = {
  blue: 'var(--color-system-blue)',
  green: 'var(--color-system-green)',
  orange: 'var(--color-system-orange)',
  red: 'var(--color-system-red)',
  purple: 'var(--color-system-purple)',
  teal: 'var(--color-system-teal)',
  pink: 'var(--color-system-pink)',
  indigo: 'var(--color-system-indigo)',
  yellow: 'var(--color-system-yellow)',
};
