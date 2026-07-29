import { Component, inject, output } from '@angular/core';
import { GanttService } from '../gantt.service';
import { GanttViewMode, GanttViewModeChangePayload } from '../gantt.models';

@Component({
  selector: 'app-gantt-toolbar',
  host: { class: 'block' },
  template: `
    <div class="gantt-toolbar">
      <!-- Left: View Mode Switcher -->
      <div class="gantt-toolbar__segment" role="group" aria-label="Timeline view mode">
        @for (mode of viewModes; track mode.value) {
          <button
            type="button"
            class="gantt-toolbar__seg-btn"
            [class.gantt-toolbar__seg-btn--active]="svc.viewMode() === mode.value"
            (click)="setViewMode(mode.value)"
            [attr.aria-pressed]="svc.viewMode() === mode.value"
            [id]="'gantt-view-' + mode.value"
          >
            {{ mode.label }}
          </button>
        }
      </div>

      <!-- Center: Today button -->
      <button
        type="button"
        class="gantt-toolbar__today-btn"
        id="gantt-today-btn"
        (click)="scrollToToday.emit()"
        aria-label="Scroll to today"
      >
        Today
      </button>

      <!-- Right: Collapse / Zoom controls -->
      <div class="gantt-toolbar__actions">
        <button
          type="button"
          class="gantt-toolbar__icon-btn"
          id="gantt-collapse-all-btn"
          (click)="toggleCollapseAll()"
          [attr.aria-label]="allCollapsed ? 'Expand all groups' : 'Collapse all groups'"
          [attr.title]="allCollapsed ? 'Expand all' : 'Collapse all'"
        >
          @if (allCollapsed) {
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
              <path d="M2 5l5 5 5-5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          } @else {
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
              <path d="M12 9L7 4l-5 5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          }
        </button>

        <div class="gantt-toolbar__separator" role="separator" aria-orientation="vertical"></div>

        <button
          type="button"
          class="gantt-toolbar__icon-btn"
          id="gantt-zoom-out-btn"
          (click)="zoom(-8)"
          aria-label="Zoom out"
          title="Zoom out"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
            <circle cx="6" cy="6" r="4.5" stroke="currentColor" stroke-width="1.5"/>
            <path d="M4 6h4M10.5 10.5l2 2" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
          </svg>
        </button>

        <button
          type="button"
          class="gantt-toolbar__icon-btn"
          id="gantt-zoom-in-btn"
          (click)="zoom(8)"
          aria-label="Zoom in"
          title="Zoom in"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
            <circle cx="6" cy="6" r="4.5" stroke="currentColor" stroke-width="1.5"/>
            <path d="M6 4v4M4 6h4M10.5 10.5l2 2" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
          </svg>
        </button>
      </div>
    </div>
  `,
  styles: `
    .gantt-toolbar {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 10px 16px;
      border-bottom: 1px solid var(--separator);
      background: var(--glass-bg-thick);
      backdrop-filter: blur(var(--blur-md));
      -webkit-backdrop-filter: blur(var(--blur-md));
      flex-shrink: 0;
    }

    /* Segmented control */
    .gantt-toolbar__segment {
      display: flex;
      background: var(--fill-secondary);
      border-radius: var(--radius-md);
      padding: 2px;
      gap: 1px;
    }

    .gantt-toolbar__seg-btn {
      border: none;
      background: transparent;
      border-radius: calc(var(--radius-md) - 2px);
      padding: 4px 12px;
      font: var(--type-footnote);
      font-weight: 500;
      color: var(--text-secondary);
      cursor: pointer;
      transition: all var(--duration-fast) var(--ease-default);
      white-space: nowrap;
    }

    .gantt-toolbar__seg-btn--active {
      background: var(--surface-primary);
      color: var(--text-primary);
      box-shadow: var(--shadow-sm);
    }

    .gantt-toolbar__seg-btn:hover:not(.gantt-toolbar__seg-btn--active) {
      color: var(--text-primary);
    }

    /* Today button */
    .gantt-toolbar__today-btn {
      border: 1px solid var(--border-default);
      background: var(--fill-primary);
      border-radius: var(--radius-md);
      padding: 4px 12px;
      font: var(--type-footnote);
      font-weight: 500;
      color: var(--color-primary);
      cursor: pointer;
      transition: all var(--duration-fast) var(--ease-default);
      margin-left: auto;
    }

    .gantt-toolbar__today-btn:hover {
      background: var(--interactive-tint);
    }

    /* Right actions */
    .gantt-toolbar__actions {
      display: flex;
      align-items: center;
      gap: 4px;
    }

    .gantt-toolbar__separator {
      width: 1px;
      height: 16px;
      background: var(--separator);
      margin: 0 2px;
    }

    .gantt-toolbar__icon-btn {
      border: none;
      background: transparent;
      border-radius: var(--radius-sm);
      width: 28px;
      height: 28px;
      display: grid;
      place-items: center;
      color: var(--text-secondary);
      cursor: pointer;
      transition: all var(--duration-fast) var(--ease-default);
    }

    .gantt-toolbar__icon-btn:hover {
      background: var(--fill-secondary);
      color: var(--text-primary);
    }

    .gantt-toolbar__icon-btn:active {
      background: var(--fill-primary);
      transform: scale(0.92);
    }
  `,
})
export class GanttToolbarComponent {
  protected readonly svc = inject(GanttService);

  readonly scrollToToday = output<void>();
  readonly viewModeChange = output<GanttViewModeChangePayload>();

  protected allCollapsed = false;

  protected readonly viewModes: { label: string; value: GanttViewMode }[] = [
    { label: 'Day', value: 'day' },
    { label: 'Week', value: 'week' },
    { label: 'Month', value: 'month' },
  ];

  setViewMode(mode: GanttViewMode): void {
    const previous = this.svc.viewMode();
    if (previous === mode) return;
    this.svc.viewMode.set(mode);
    this.viewModeChange.emit({ previous, current: mode });
  }

  zoom(delta: number): void {
    // Directly manipulate the computed cell width by adjusting a zoomOffset
    // We store zoom offset in the service via cellWidth override approach
    const current = this.svc.cellWidth();
    const next = Math.max(16, Math.min(128, current + delta));
    // Access internal signal through service (we expose a zoomOverride)
    this.svc['_zoomOverride'].set(next);
  }

  toggleCollapseAll(): void {
    this.allCollapsed = !this.allCollapsed;
    if (this.allCollapsed) {
      this.svc.collapseAllGroups();
    } else {
      this.svc.expandAllGroups();
    }
  }
}
