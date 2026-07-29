import { Component, inject, ElementRef, viewChild } from '@angular/core';
import { GanttService } from '../gantt.service';
import { GanttTimeColumn } from '../gantt.models';

@Component({
  selector: 'app-gantt-timeline-header',
  host: { class: 'block' },
  template: `
    <div
      class="gth"
      #headerEl
      role="row"
      aria-label="Timeline header"
    >
      <!-- Super-row: month/week labels -->
      <div
        class="gth__super-row"
        [style.width.px]="svc.totalTimelineWidth()"
      >
        @for (col of svc.timeColumns(); track col.key) {
          @if (col.isSuperStart && col.superLabel) {
            <div
              class="gth__super-label"
              [style.left.px]="col.offsetPx"
              [style.width.px]="getSuperWidth(col)"
            >
              {{ col.superLabel }}
            </div>
          }
        }
      </div>

      <!-- Main column row -->
      <div
        class="gth__col-row"
        [style.width.px]="svc.totalTimelineWidth()"
      >
        @for (col of svc.timeColumns(); track col.key) {
          <div
            class="gth__col"
            [class.gth__col--today]="col.isToday"
            [class.gth__col--weekend]="col.isWeekend && !col.isHoliday && !col.isWorkday"
            [class.gth__col--holiday]="col.isHoliday"
            [class.gth__col--workday]="col.isWorkday"
            [style.width.px]="col.widthPx"
            role="columnheader"
            [attr.aria-label]="col.specialLabel ?? col.superLabel ?? col.label"
            [title]="col.specialLabel ?? ''"
          >
            <span class="gth__col-label">{{ col.label }}</span>
            @if (col.isToday) {
              <span class="gth__today-dot" aria-hidden="true"></span>
            }
            @if (col.isHoliday) {
              <span class="gth__holiday-dot" aria-hidden="true"></span>
            }
          </div>
        }
      </div>
    </div>
  `,
  styles: `
    .gth {
      display: flex;
      flex-direction: column;
      background: var(--surface-secondary);
      flex-shrink: 0;
      height: 56px;
    }

    /* Super row — shows month/year labels */
    .gth__super-row {
      position: relative;
      height: 20px;
      border-bottom: 1px solid var(--separator);
      flex-shrink: 0;
    }

    .gth__super-label {
      position: absolute;
      top: 0;
      height: 20px;
      display: flex;
      align-items: center;
      padding-left: 8px;
      font: var(--type-caption-2);
      font-weight: 600;
      color: var(--text-secondary);
      text-transform: uppercase;
      letter-spacing: var(--tracking-wide);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    /* Main column row */
    .gth__col-row {
      display: flex;
      height: 36px;
      align-items: stretch;
    }

    .gth__col {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      position: relative;
      border-right: 1px solid var(--separator);
      gap: 2px;
      flex-shrink: 0;
      transition: background var(--duration-instant) linear;
    }

    .gth__col--today {
      background: color-mix(in oklch, var(--color-system-blue) 8%, transparent);
    }

    .gth__col--weekend:not(.gth__col--today) {
      background: var(--fill-tertiary);
    }

    .gth__col--holiday {
      background: color-mix(in oklch, var(--color-system-red) 10%, transparent);
    }

    .gth__col--holiday.gth__col--today {
      background: color-mix(in oklch, var(--color-system-red) 12%, var(--color-system-blue) 8%);
    }

    /* Forced workday: look like a normal weekday (no extra tint) */
    .gth__col--workday {
      background: transparent;
    }

    .gth__col-label {
      font: var(--type-caption-2);
      font-weight: 500;
      color: var(--text-tertiary);
      text-align: center;
      line-height: 1;
      /* Truncate long day labels in narrow columns */
      overflow: hidden;
      max-width: 100%;
      text-overflow: ellipsis;
      white-space: nowrap;
      padding: 0 2px;
    }

    .gth__col--today .gth__col-label {
      color: var(--color-system-blue);
      font-weight: 700;
    }

    .gth__col--holiday .gth__col-label {
      color: var(--color-system-red);
      font-weight: 600;
    }

    .gth__today-dot {
      width: 4px;
      height: 4px;
      border-radius: 50%;
      background: var(--color-system-blue);
    }

    .gth__holiday-dot {
      width: 4px;
      height: 4px;
      border-radius: 50%;
      background: var(--color-system-red);
    }
  `,
})
export class GanttTimelineHeaderComponent {
  protected readonly svc = inject(GanttService);

  readonly headerEl = viewChild.required<ElementRef<HTMLElement>>('headerEl');

  /** Measure the width of a super-label section (until the next super start or end) */
  protected getSuperWidth(col: GanttTimeColumn): number {
    const cols = this.svc.timeColumns();
    const startIdx = cols.findIndex((c) => c.key === col.key);
    let width = col.widthPx;
    for (let i = startIdx + 1; i < cols.length; i++) {
      if (cols[i].isSuperStart) break;
      width += cols[i].widthPx;
    }
    return width;
  }
}
