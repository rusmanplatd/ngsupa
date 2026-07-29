import { Injectable, signal, computed } from '@angular/core';
import {
  GanttTask,
  GanttViewMode,
  GanttGroup,
  GanttRowItem,
  GanttTimeColumn,
  GanttBarLayout,
  GanttDependencyArrow,
  GanttConfig,
  GanttSpecialDate,
  DEFAULT_GANTT_CONFIG,
  CELL_WIDTH,
  BAR_HEIGHT_RATIO,
  MIN_BAR_WIDTH_PX,
} from './gantt.models';

@Injectable()
export class GanttService {
  // ── Writable Signals ────────────────────────────────────────────────────────

  readonly tasks = signal<GanttTask[]>([]);
  readonly viewMode = signal<GanttViewMode>(DEFAULT_GANTT_CONFIG.viewMode);
  readonly rowHeight = signal<number>(DEFAULT_GANTT_CONFIG.rowHeight);
  readonly sidebarWidth = signal<number>(DEFAULT_GANTT_CONFIG.sidebarWidth);
  readonly showDependencies = signal<boolean>(DEFAULT_GANTT_CONFIG.showDependencies);
  readonly readonly = signal<boolean>(DEFAULT_GANTT_CONFIG.readonly);
  readonly locale = signal<string>(DEFAULT_GANTT_CONFIG.locale);
  /** Calendar-date overrides (holidays / forced workdays) */
  readonly specialDates = signal<GanttSpecialDate[]>(DEFAULT_GANTT_CONFIG.specialDates);

  /** Manual zoom override for cell width (null = use CELL_WIDTH default) */
  readonly _zoomOverride = signal<number | null>(null);

  /** Collapsed group IDs */
  readonly collapsedGroups = signal<Set<string>>(new Set());
  /** Hovered row index for synchronized highlight */
  readonly hoveredRowIndex = signal<number | null>(null);
  /** Task ID with the active popover */
  readonly activePopoverTaskId = signal<string | number | null>(null);
  /** Task ID currently focused (keyboard navigation) */
  readonly focusedTaskId = signal<string | number | null>(null);

  // ── Derived: cell width based on view mode ────────────────────────────────────────

  readonly cellWidth = computed(() => this._zoomOverride() ?? CELL_WIDTH[this.viewMode()]);

  // ── Derived: special-date lookup sets ──────────────────────────────────────────

  /** Set of ISO date keys ("YYYY-MM-DD") for quick O(1) holiday lookup */
  private readonly _holidayMap = computed<Map<string, string | undefined>>(() => {
    const m = new Map<string, string | undefined>();
    for (const sd of this.specialDates()) {
      if (sd.type === 'holiday') {
        m.set(this._toIsoKey(sd.date), sd.label);
      }
    }
    return m;
  });

  /** Set of ISO date keys ("YYYY-MM-DD") for quick O(1) workday lookup */
  private readonly _workdayKeys = computed<Set<string>>(() => {
    const s = new Set<string>();
    for (const sd of this.specialDates()) {
      if (sd.type === 'workday') s.add(this._toIsoKey(sd.date));
    }
    return s;
  });

  // ── Derived: Viewport date range ────────────────────────────────────────────

  /**
   * The earliest start date across all tasks, padded by a buffer so the
   * first bar is never flush against the timeline origin.
   */
  readonly viewportStart = computed<Date>(() => {
    const tasks = this.tasks();
    if (tasks.length === 0) return this._startOfDay(new Date());
    const earliest = tasks.reduce(
      (min, t) => (t.start < min ? t.start : min),
      tasks[0].start,
    );
    return this._addDays(this._startOfDay(earliest), -this._bufferDays());
  });

  /**
   * The latest end date across all tasks, padded by a buffer so the last
   * bar is not flush against the right edge.
   */
  readonly viewportEnd = computed<Date>(() => {
    const tasks = this.tasks();
    if (tasks.length === 0) {
      return this._addDays(new Date(), 30);
    }
    const latest = tasks.reduce(
      (max, t) => (t.end > max ? t.end : max),
      tasks[0].end,
    );
    return this._addDays(this._startOfDay(latest), this._bufferDays() + 1);
  });

  /** Total number of day columns between viewportStart and viewportEnd */
  readonly totalDays = computed<number>(() => {
    const diff =
      this.viewportEnd().getTime() - this.viewportStart().getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  });

  /** Total timeline width in pixels */
  readonly totalTimelineWidth = computed<number>(() => {
    return this.totalDays() * this.cellWidth();
  });

  // ── Derived: Time column headers ────────────────────────────────────────────

  readonly timeColumns = computed<GanttTimeColumn[]>(() => {
    const mode = this.viewMode();
    const start = this.viewportStart();
    const days = this.totalDays();
    const cw = this.cellWidth();
    const locale = this.locale();
    const today = this._startOfDay(new Date());
    const columns: GanttTimeColumn[] = [];

    const holidayMap = this._holidayMap();
    const workdayKeys = this._workdayKeys();

    for (let i = 0; i < days; i++) {
      const date = this._addDays(start, i);
      const key = date.toISOString().split('T')[0];
      const isToday = date.getTime() === today.getTime();
      const isWeekend = date.getDay() === 0 || date.getDay() === 6;
      const isHoliday = holidayMap.has(key);
      const isWorkday = !isHoliday && workdayKeys.has(key);

      let label = '';
      let superLabel: string | undefined;
      let isSuperStart = false;

      if (mode === 'day') {
        label = date.toLocaleDateString(locale, { weekday: 'short' }).charAt(0);
        superLabel = date.toLocaleDateString(locale, {
          month: 'short',
          day: 'numeric',
        });
        isSuperStart = true; // every column gets a label in day mode
      } else if (mode === 'week') {
        label = date.toLocaleDateString(locale, { weekday: 'short', day: 'numeric' });
        // Show month/year label at start of each week (Monday) or first column
        if (date.getDay() === 1 || i === 0) {
          superLabel = date.toLocaleDateString(locale, { month: 'long', year: 'numeric' });
          isSuperStart = true;
        }
      } else {
        // month mode — each column is 1 day, but only day number shown
        label = String(date.getDate());
        if (date.getDate() === 1 || i === 0) {
          superLabel = date.toLocaleDateString(locale, { month: 'long', year: 'numeric' });
          isSuperStart = true;
        }
      }

      columns.push({
        key,
        date,
        label,
        superLabel,
        isSuperStart,
        isToday,
        isWeekend,
        isHoliday,
        isWorkday,
        specialLabel: holidayMap.get(key),
        offsetPx: i * cw,
        widthPx: cw,
      });
    }

    return columns;
  });

  // ── Derived: Grouped tasks ──────────────────────────────────────────────────

  readonly groups = computed<GanttGroup[]>(() => {
    const tasks = this.tasks();
    const collapsedSet = this.collapsedGroups();
    const groupMap = new Map<string, GanttTask[]>();

    for (const task of tasks) {
      const key = task.group ?? '__ungrouped__';
      if (!groupMap.has(key)) groupMap.set(key, []);
      groupMap.get(key)!.push(task);
    }

    return Array.from(groupMap.entries()).map(([id, groupTasks]) => ({
      id,
      title: id === '__ungrouped__' ? '' : id,
      collapsed: collapsedSet.has(id),
      tasks: groupTasks,
      color: groupTasks[0]?.color,
    }));
  });

  /** Flat visible task list (respects collapsed groups) */
  readonly visibleTasks = computed<GanttTask[]>(() => {
    const collapsedSet = this.collapsedGroups();
    return this.tasks().filter((t) => {
      if (!t.group) return true;
      return !collapsedSet.has(t.group);
    });
  });

  /**
   * Unified row list consumed by BOTH the sidebar and the timeline.
   * Group header rows are included so both components always have the
   * same number of rows in the same order — keeping them pixel-aligned.
   */
  readonly visibleRows = computed<GanttRowItem[]>(() => {
    const groups = this.groups();
    const rows: GanttRowItem[] = [];
    let visualIndex = 0;

    for (const group of groups) {
      // Named groups get a header row
      if (group.id !== '__ungrouped__') {
        rows.push({ type: 'group', group });
        // Header row counts as a visual row only when the group is NOT collapsed
        // (collapsed group header still takes a row, but tasks below it don’t)
        visualIndex++;
      }
      if (!group.collapsed) {
        for (const task of group.tasks) {
          rows.push({ type: 'task', task, visualIndex });
          visualIndex++;
        }
      }
    }

    return rows;
  });

  readonly barLayouts = computed<GanttBarLayout[]>(() => {
    const rows = this.visibleRows();
    const start = this.viewportStart();
    const cw = this.cellWidth();
    const rh = this.rowHeight();
    const barH = Math.round(rh * BAR_HEIGHT_RATIO);
    const barTop = Math.round((rh - barH) / 2);

    const layouts: GanttBarLayout[] = [];
    for (const row of rows) {
      if (row.type !== 'task') continue;
      const { task, visualIndex } = row;
      const startOffset = this._daysBetween(start, task.start);
      const duration = Math.max(1, this._daysBetween(task.start, task.end) + 1);
      const left = startOffset * cw;
      const width = Math.max(MIN_BAR_WIDTH_PX, duration * cw - 4);
      layouts.push({ task, left, width, top: barTop, height: barH, rowIndex: visualIndex });
    }
    return layouts;
  });

  // ── Derived: Dependency arrows ──────────────────────────────────────────────

  readonly dependencyArrows = computed<GanttDependencyArrow[]>(() => {
    if (!this.showDependencies()) return [];

    const layouts = this.barLayouts();
    const rh = this.rowHeight();
    const layoutMap = new Map<string | number, GanttBarLayout>();
    for (const layout of layouts) {
      layoutMap.set(layout.task.id, layout);
    }

    const arrows: GanttDependencyArrow[] = [];

    for (const layout of layouts) {
      for (const depId of layout.task.dependencies ?? []) {
        const from = layoutMap.get(depId);
        if (!from) continue;

        const fromX = from.left + from.width;
        const fromY = from.rowIndex * rh + rh / 2;
        const toX = layout.left;
        const toY = layout.rowIndex * rh + rh / 2;

        // S-curve bezier path
        const midX = (fromX + toX) / 2;
        const path = `M ${fromX} ${fromY} C ${midX} ${fromY}, ${midX} ${toY}, ${toX} ${toY}`;

        arrows.push({
          fromTaskId: depId,
          toTaskId: layout.task.id,
          path,
        });
      }
    }

    return arrows;
  });

  // ── Pixel-to-date utilities (used by drag handlers) ────────────────────────

  /** Convert a pixel offset from the timeline origin to a Date */
  pixelToDate(px: number): Date {
    const daysOffset = Math.round(px / this.cellWidth());
    return this._addDays(this.viewportStart(), daysOffset);
  }

  /** Convert a Date to a pixel offset from the timeline origin */
  dateToPixel(date: Date): number {
    const days = this._daysBetween(this.viewportStart(), date);
    return days * this.cellWidth();
  }

  // ── Group toggle ────────────────────────────────────────────────────────────

  toggleGroup(groupId: string): void {
    this.collapsedGroups.update((set) => {
      const next = new Set(set);
      if (next.has(groupId)) {
        next.delete(groupId);
      } else {
        next.add(groupId);
      }
      return next;
    });
  }

  collapseAllGroups(): void {
    const groupIds = this.groups()
      .map((g) => g.id)
      .filter((id) => id !== '__ungrouped__');
    this.collapsedGroups.set(new Set(groupIds));
  }

  expandAllGroups(): void {
    this.collapsedGroups.set(new Set());
  }

  /** Rename a task by ID */
  renameTask(id: string | number, newTitle: string): void {
    this.tasks.update((tasks) =>
      tasks.map((t) => (t.id === id ? { ...t, title: newTitle } : t)),
    );
  }

  /** Update a task's progress by ID (clamped 0–100) */
  updateProgress(id: string | number, progress: number): void {
    const clamped = Math.max(0, Math.min(100, Math.round(progress)));
    this.tasks.update((tasks) =>
      tasks.map((t) => (t.id === id ? { ...t, progress: clamped } : t)),
    );
  }

  /**
   * Reorder tasks within their group using group-relative indices.
   * Tasks are moved in-place inside the flat task array, preserving all
   * other tasks and groups in their original positions.
   */
  reorderTask(taskId: string | number, previousIndex: number, newIndex: number): void {
    if (previousIndex === newIndex) return;

    const allTasks = this.tasks();
    const task = allTasks.find((t) => t.id === taskId);
    if (!task) return;

    const groupKey = task.group ?? '__ungrouped__';

    // Collect indices (in the flat array) that belong to this group
    const groupIndices: number[] = [];
    allTasks.forEach((t, i) => {
      if ((t.group ?? '__ungrouped__') === groupKey) groupIndices.push(i);
    });

    if (previousIndex < 0 || previousIndex >= groupIndices.length) return;
    if (newIndex < 0 || newIndex >= groupIndices.length) return;

    // Clone and reorder just the group-relative index references
    const reorderedIndices = [...groupIndices];
    const [movedIdx] = reorderedIndices.splice(previousIndex, 1);
    reorderedIndices.splice(newIndex, 0, movedIdx);

    // Rebuild the full task array, replacing group slots with the new order
    const result = [...allTasks];
    groupIndices.forEach((flatIdx, relIdx) => {
      result[flatIdx] = allTasks[reorderedIndices[relIdx]];
    });

    this.tasks.set(result);
  }

  /** Apply external config overrides */
  applyConfig(config: Partial<GanttConfig>): void {
    if (config.viewMode !== undefined) {
      this.viewMode.set(config.viewMode);
      this._zoomOverride.set(null); // reset zoom on mode change
    }
    if (config.rowHeight !== undefined) this.rowHeight.set(config.rowHeight);
    if (config.sidebarWidth !== undefined) this.sidebarWidth.set(config.sidebarWidth);
    if (config.showDependencies !== undefined) this.showDependencies.set(config.showDependencies);
    if (config.readonly !== undefined) this.readonly.set(config.readonly);
    if (config.locale !== undefined) this.locale.set(config.locale);
    if (config.specialDates !== undefined) this.specialDates.set(config.specialDates);
  }

  // ── Private date helpers ──────────────────────────────────────────────────────────

  private _startOfDay(date: Date): Date {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    return d;
  }

  private _addDays(date: Date, days: number): Date {
    const d = new Date(date);
    d.setDate(d.getDate() + days);
    return d;
  }

  private _daysBetween(from: Date, to: Date): number {
    const fromMs = this._startOfDay(from).getTime();
    const toMs = this._startOfDay(to).getTime();
    return Math.round((toMs - fromMs) / (1000 * 60 * 60 * 24));
  }

  private _bufferDays(): number {
    const mode = this.viewMode();
    if (mode === 'day') return 1;
    if (mode === 'week') return 3;
    return 7;
  }

  /**
   * Normalise a `GanttSpecialDate.date` value to an ISO "YYYY-MM-DD" key
   * using the local calendar date (ignoring time-zone offsets).
   */
  private _toIsoKey(date: Date | string): string {
    const d = typeof date === 'string' ? new Date(date) : new Date(date);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }
}
