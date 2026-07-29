import { Component, signal } from '@angular/core';
import { GanttComponent } from '../../shared/ui/gantt/gantt.component';
import {
  GanttTask,
  GanttSpecialDate,
  GanttTaskClickPayload,
  GanttTaskDropPayload,
  GanttTaskResizePayload,
  GanttTaskProgressChangePayload,
  GanttTaskRenamePayload,
  GanttTaskReorderPayload,
  GanttViewModeChangePayload,
  GanttViewMode,
} from '../../shared/ui/gantt/gantt.models';

/** Rich demo payload type */
interface ProjectTaskData {
  assignee: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
}

const TODAY = new Date();
const d = (offsetDays: number): Date => {
  const date = new Date(TODAY);
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() + offsetDays);
  return date;
};

/**
 * Return the ISO key (YYYY-MM-DD) for a date with a given day offset from today.
 * Used to construct demo special dates independently of the real calendar.
 */
const isoKey = (offsetDays: number): string => {
  const date = d(offsetDays);
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

@Component({
  selector: 'app-gantt-demo',
  imports: [GanttComponent],
  template: `
    <div class="demo-page">
      <!-- Page Header -->
      <header class="demo-header">
        <div class="demo-header__inner">
          <div>
            <h1 class="demo-header__title">Project Roadmap</h1>
            <p class="demo-header__subtitle">Q3 2026 — Product Engineering</p>
          </div>
          <div class="demo-header__stats">
            <div class="demo-stat">
              <span class="demo-stat__value">{{ tasks().length }}</span>
              <span class="demo-stat__label">Tasks</span>
            </div>
            <div class="demo-stat">
              <span class="demo-stat__value">{{ uniqueGroupsCount() }}</span>
              <span class="demo-stat__label">Groups</span>
            </div>
            <div class="demo-stat">
              <span class="demo-stat__value">{{ overallProgress() }}%</span>
              <span class="demo-stat__label">Progress</span>
            </div>
          </div>
        </div>
      </header>

      <!-- Event log -->
      @if (lastEvent()) {
        <div class="demo-event-log" role="status" aria-live="polite">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
            <circle cx="7" cy="7" r="6" stroke="var(--color-system-green)" stroke-width="1.5"/>
            <path d="M4.5 7l2 2 3-3" stroke="var(--color-system-green)" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          <span>{{ lastEvent() }}</span>
        </div>
      }

      <!-- Gantt Chart -->
      <div class="demo-gantt-wrapper">
        <app-gantt
          id="main-gantt-chart"
          [tasks]="tasks()"
          [viewMode]="viewMode()"
          [showDependencies]="true"
          [locale]="'en-US'"
          [specialDates]="specialDates()"
          (taskClick)="onTaskClick($event)"
          (taskDrop)="onTaskDrop($event)"
          (taskResize)="onTaskResize($event)"
          (taskProgressChange)="onTaskProgressChange($event)"
          (taskRename)="onTaskRename($event)"
          (taskReorder)="onTaskReorder($event)"
          (viewModeChange)="onViewModeChange($event)"
        />
      </div>

      <!-- Bottom info -->
      <p class="demo-hint">
        <kbd>Drag</kbd> bars to reschedule &nbsp;·&nbsp;
        <kbd>Drag edges</kbd> to resize &nbsp;·&nbsp;
        <kbd>Hover</kbd> to inspect &nbsp;·&nbsp;
        <kbd>Double-click</kbd> task name to rename &nbsp;·&nbsp;
        <kbd>‹›</kbd> on bar to move by day &nbsp;·&nbsp;
        <kbd>Drag ⠿</kbd> to reorder
      </p>
    </div>
  `,
  styles: `
    .demo-page {
      min-height: 100dvh;
      display: flex;
      flex-direction: column;
      gap: 0;
      background: var(--surface-grouped);
      padding: 24px;
      box-sizing: border-box;
    }

    /* Header */
    .demo-header {
      margin-bottom: 16px;
    }

    .demo-header__inner {
      display: flex;
      align-items: flex-end;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: 12px;
    }

    .demo-header__title {
      font: var(--type-title-1);
      color: var(--text-primary);
      margin: 0 0 2px;
    }

    .demo-header__subtitle {
      font: var(--type-subheadline);
      color: var(--text-secondary);
      margin: 0;
    }

    .demo-header__stats {
      display: flex;
      gap: 24px;
    }

    .demo-stat {
      display: flex;
      flex-direction: column;
      align-items: flex-end;
    }

    .demo-stat__value {
      font: var(--type-title-2);
      color: var(--text-primary);
    }

    .demo-stat__label {
      font: var(--type-caption-1);
      color: var(--text-tertiary);
    }

    /* Event log */
    .demo-event-log {
      display: flex;
      align-items: center;
      gap: 6px;
      font: var(--type-footnote);
      color: var(--text-secondary);
      background: var(--color-system-green-light);
      border: 1px solid color-mix(in oklch, var(--color-system-green) 30%, transparent);
      border-radius: var(--radius-lg);
      padding: 6px 12px;
      margin-bottom: 12px;
      animation: slide-down-in 0.2s var(--ease-spring);
    }

    /* Gantt wrapper */
    .demo-gantt-wrapper {
      flex: 1;
      min-height: 500px;
      max-height: calc(100dvh - 220px);
    }

    /* Hint bar */
    .demo-hint {
      font: var(--type-caption-1);
      color: var(--text-tertiary);
      text-align: center;
      margin: 12px 0 0;
    }

    kbd {
      font-family: var(--font-mono);
      font-size: 11px;
      background: var(--fill-secondary);
      border: 1px solid var(--border-default);
      border-radius: var(--radius-xs);
      padding: 1px 5px;
      color: var(--text-secondary);
    }
  `,
})
export class GanttDemoComponent {
  protected readonly viewMode = signal<GanttViewMode>('week');
  protected readonly lastEvent = signal<string | null>(null);

  /**
   * Demo special dates: a handful of simulated holidays and one forced workday.
   * Offsets are relative to today so the demo always shows them in the visible range.
   */
  protected readonly specialDates = signal<GanttSpecialDate[]>([
    // Simulated national holiday ~1 week in
    { date: isoKey(5),  type: 'holiday', label: 'National Day' },
    // Mid-project team holiday
    { date: isoKey(12), type: 'holiday', label: 'Team Offsite' },
    // Company holiday near launch
    { date: isoKey(28), type: 'holiday', label: 'Company Holiday' },
    // Weekend sprint day — force it to look like a workday
    { date: isoKey(6),  type: 'workday', label: 'Sprint Saturday' },
  ]);

  protected readonly tasks = signal<GanttTask<ProjectTaskData>[]>([
    // ── Planning Phase ──────────────────────────────────────────────────────
    {
      id: 'p1', title: 'Project Kickoff', group: 'Planning',
      start: d(-14), end: d(-12),
      progress: 100, color: 'blue', milestone: false,
      data: { assignee: 'Alice', priority: 'high' },
    },
    {
      id: 'p2', title: 'Requirements Gathering', group: 'Planning',
      start: d(-12), end: d(-5),
      progress: 100, color: 'blue',
      data: { assignee: 'Bob', priority: 'high' },
    },
    {
      id: 'p3', title: 'Architecture Design', group: 'Planning',
      start: d(-8), end: d(-1),
      progress: 80, color: 'indigo', dependencies: ['p2'],
      data: { assignee: 'Alice', priority: 'critical' },
    },
    {
      id: 'p4', title: 'Planning Complete', group: 'Planning',
      start: d(-1), end: d(-1),
      progress: 80, color: 'indigo', milestone: true, dependencies: ['p3'],
      data: { assignee: 'Alice', priority: 'medium' },
    },

    // ── Development Phase ───────────────────────────────────────────────────
    {
      id: 'd1', title: 'Core API Development', group: 'Development',
      start: d(0), end: d(14),
      progress: 35, color: 'green', dependencies: ['p3'],
      data: { assignee: 'Charlie', priority: 'critical' },
    },
    {
      id: 'd2', title: 'UI Component Library', group: 'Development',
      start: d(2), end: d(12),
      progress: 60, color: 'teal',
      data: { assignee: 'Diana', priority: 'high' },
    },
    {
      id: 'd3', title: 'Authentication Service', group: 'Development',
      start: d(3), end: d(9),
      progress: 50, color: 'purple', dependencies: ['d1'],
      data: { assignee: 'Eve', priority: 'high' },
    },
    {
      id: 'd4', title: 'Database Schema', group: 'Development',
      start: d(1), end: d(7),
      progress: 90, color: 'orange',
      data: { assignee: 'Frank', priority: 'medium' },
    },
    {
      id: 'd5', title: 'Integration Layer', group: 'Development',
      start: d(10), end: d(20),
      progress: 10, color: 'green', dependencies: ['d1', 'd4'],
      data: { assignee: 'Charlie', priority: 'high' },
    },
    {
      id: 'd6', title: 'Dev Complete', group: 'Development',
      start: d(20), end: d(20),
      progress: 0, color: 'green', milestone: true, dependencies: ['d5', 'd2'],
      data: { assignee: 'Charlie', priority: 'medium' },
    },

    // ── Testing & Launch ────────────────────────────────────────────────────
    {
      id: 't1', title: 'Unit & Integration Tests', group: 'Testing & Launch',
      start: d(14), end: d(22),
      progress: 0, color: 'orange', dependencies: ['d1'],
      data: { assignee: 'Grace', priority: 'high' },
    },
    {
      id: 't2', title: 'Performance Testing', group: 'Testing & Launch',
      start: d(20), end: d(25),
      progress: 0, color: 'red', dependencies: ['d5'],
      data: { assignee: 'Grace', priority: 'medium' },
    },
    {
      id: 't3', title: 'Beta Rollout', group: 'Testing & Launch',
      start: d(24), end: d(30),
      progress: 0, color: 'pink', dependencies: ['t1', 't2'],
      data: { assignee: 'Henry', priority: 'critical' },
    },
    {
      id: 't4', title: 'Production Launch 🚀', group: 'Testing & Launch',
      start: d(31), end: d(31),
      progress: 0, color: 'red', milestone: true, dependencies: ['t3'],
      data: { assignee: 'All', priority: 'critical' },
    },

    // ── Marketing & Operations ──────────────────────────────────────────────
    {
      id: 'm1', title: 'Marketing Campaign Prep', group: 'Marketing & Operations',
      start: d(15), end: d(25),
      progress: 20, color: 'purple',
      data: { assignee: 'Isla', priority: 'high' },
    },
    {
      id: 'm2', title: 'Press Release Draft', group: 'Marketing & Operations',
      start: d(22), end: d(27),
      progress: 5, color: 'pink', dependencies: ['m1'],
      data: { assignee: 'Jack', priority: 'medium' },
    },
    {
      id: 'm3', title: 'Launch Event Planning', group: 'Marketing & Operations',
      start: d(25), end: d(30),
      progress: 0, color: 'yellow',
      data: { assignee: 'Isla', priority: 'high' },
    },
    {
      id: 'm4', title: 'Go-Live Communications', group: 'Marketing & Operations',
      start: d(31), end: d(32),
      progress: 0, color: 'orange', dependencies: ['t4'],
      data: { assignee: 'Jack', priority: 'critical' },
    },

    // ── Post-Launch ─────────────────────────────────────────────────────────
    {
      id: 'pl1', title: 'Monitor System Stability', group: 'Post-Launch',
      start: d(32), end: d(40),
      progress: 0, color: 'blue', dependencies: ['t4'],
      data: { assignee: 'Charlie', priority: 'critical' },
    },
    {
      id: 'pl2', title: 'Gather User Feedback', group: 'Post-Launch',
      start: d(35), end: d(45),
      progress: 0, color: 'teal', dependencies: ['t4'],
      data: { assignee: 'Diana', priority: 'medium' },
    },
    {
      id: 'pl3', title: 'Project Retrospective', group: 'Post-Launch',
      start: d(46), end: d(47),
      progress: 0, color: 'indigo', dependencies: ['pl1', 'pl2'],
      data: { assignee: 'Alice', priority: 'medium' },
    },
  ]);

  protected overallProgress = () => {
    const tasks = this.tasks();
    if (tasks.length === 0) return 0;
    const total = tasks.reduce((sum, t) => sum + (t.progress ?? 0), 0);
    return Math.round(total / tasks.length);
  };

  protected uniqueGroupsCount = () => {
    const groups = new Set(this.tasks().map(t => t.group).filter(Boolean));
    return groups.size;
  };

  protected onTaskClick(event: GanttTaskClickPayload): void {
    const typedTask = event.task as GanttTask<ProjectTaskData>;
    this.lastEvent.set(`Clicked: "${typedTask.title}" — Assignee: ${typedTask.data?.assignee ?? '—'}`);
    setTimeout(() => this.lastEvent.set(null), 4000);
  }

  protected onTaskDrop(event: GanttTaskDropPayload): void {
    this.tasks.update((tasks) =>
      tasks.map((t) =>
        t.id === event.task.id
          ? { ...t, start: event.newStart, end: event.newEnd }
          : t,
      ),
    );
    const fmt = (d: Date) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    this.lastEvent.set(
      `Moved: "${event.task.title}" → ${fmt(event.newStart)} – ${fmt(event.newEnd)}`,
    );
    setTimeout(() => this.lastEvent.set(null), 4000);
  }

  protected onTaskResize(event: GanttTaskResizePayload): void {
    this.tasks.update((tasks) =>
      tasks.map((t) =>
        t.id === event.task.id
          ? { ...t, start: event.newStart, end: event.newEnd }
          : t,
      ),
    );
    const fmt = (d: Date) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    this.lastEvent.set(
      `Resized: "${event.task.title}" ${event.edge} → ${fmt(event.newStart)} – ${fmt(event.newEnd)}`,
    );
    setTimeout(() => this.lastEvent.set(null), 4000);
  }

  protected onViewModeChange(event: GanttViewModeChangePayload): void {
    this.viewMode.set(event.current);
  }

  protected onTaskProgressChange(event: GanttTaskProgressChangePayload): void {
    this.tasks.update((tasks) =>
      tasks.map((t) =>
        t.id === event.task.id ? { ...t, progress: event.newProgress } : t,
      ),
    );
    this.lastEvent.set(`Progress: "${event.task.title}" → ${event.newProgress}%`);
    setTimeout(() => this.lastEvent.set(null), 4000);
  }

  protected onTaskRename(event: GanttTaskRenamePayload): void {
    this.lastEvent.set(`Renamed: "${event.previousTitle}" → "${event.newTitle}"`);
    setTimeout(() => this.lastEvent.set(null), 4000);
  }

  protected onTaskReorder(event: GanttTaskReorderPayload): void {
    this.lastEvent.set(`Reordered task to position ${event.newIndex + 1}`);
    setTimeout(() => this.lastEvent.set(null), 4000);
  }
}
