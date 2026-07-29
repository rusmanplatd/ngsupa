import { Component, inject, output } from '@angular/core';
import { GanttService } from '../gantt.service';
import { GanttBarComponent } from './gantt-bar.component';
import { GanttDependencyLayerComponent } from './gantt-dependency-layer.component';
import { GanttTaskDropPayload, GanttTaskResizePayload, GanttTaskClickPayload, GanttTaskProgressChangePayload } from '../gantt.models';

@Component({
  selector: 'app-gantt-timeline',
  imports: [GanttBarComponent, GanttDependencyLayerComponent],
  host: { class: 'block' },
  template: `
    <div
      class="gtt"
      [style.width.px]="svc.totalTimelineWidth()"
      role="grid"
      aria-label="Gantt timeline grid"
    >
      <!-- Background grid columns (today highlight + weekend tint) -->
      <div class="gtt__bg-cols" aria-hidden="true">
        @for (col of svc.timeColumns(); track col.key) {
          <div
            class="gtt__bg-col"
            [class.gtt__bg-col--today]="col.isToday"
            [class.gtt__bg-col--weekend]="col.isWeekend && !col.isHoliday && !col.isWorkday"
            [class.gtt__bg-col--holiday]="col.isHoliday"
            [class.gtt__bg-col--workday]="col.isWorkday"
            [style.width.px]="col.widthPx"
            [style.left.px]="col.offsetPx"
          ></div>
        }
      </div>

      <!-- Horizontal row bands — mirrors the sidebar's visibleRows exactly -->
      <div class="gtt__rows" aria-hidden="true">
        @for (row of svc.visibleRows(); track $index; let i = $index) {
          @if (row.type === 'group') {
            <!-- Transparent spacer matching the sidebar group header row -->
            <div
              class="gtt__group-band"
              [style.height.px]="svc.rowHeight()"
            ></div>
          } @else {
            <div
              class="gtt__row-band"
              [class.gtt__row-band--hovered]="svc.hoveredRowIndex() === i"
              [class.gtt__row-band--even]="i % 2 === 0"
              [style.height.px]="svc.rowHeight()"
              (mouseenter)="svc.hoveredRowIndex.set(i)"
              (mouseleave)="svc.hoveredRowIndex.set(null)"
            ></div>
          }
        }
      </div>

      <!-- Task bars -->
      @for (layout of svc.barLayouts(); track layout.task.id) {
        <div
          class="gtt__bar-row"
          [style.top.px]="layout.rowIndex * svc.rowHeight()"
          [style.height.px]="svc.rowHeight()"
          (mouseenter)="svc.hoveredRowIndex.set(layout.rowIndex)"
          (mouseleave)="svc.hoveredRowIndex.set(null)"
        >
          <app-gantt-bar
            [layout]="layout"
            (taskClick)="taskClick.emit($event)"
            (taskDrop)="taskDrop.emit($event)"
            (taskResize)="taskResize.emit($event)"
            (taskProgressChange)="taskProgressChange.emit($event)"
          />
        </div>
      }

      <!-- Today line -->
      @if (todayOffsetPx() !== null) {
        <div
          class="gtt__today-line"
          [style.left.px]="todayOffsetPx()"
          aria-hidden="true"
        >
          <div class="gtt__today-line__head"></div>
        </div>
      }

      <!-- SVG dependency arrows -->
      @if (svc.showDependencies()) {
        <app-gantt-dependency-layer />
      }
    </div>
  `,
  styles: `
    .gtt {
      position: relative;
      min-height: 100%;
    }

    /* Background columns */
    .gtt__bg-cols {
      position: absolute;
      inset: 0;
      pointer-events: none;
    }

    .gtt__bg-col {
      position: absolute;
      top: 0;
      bottom: 0;
      border-right: 1px solid var(--separator);
    }

    .gtt__bg-col--today {
      background: color-mix(in oklch, var(--color-system-blue) 5%, transparent);
    }

    .gtt__bg-col--weekend:not(.gtt__bg-col--today) {
      background: var(--fill-tertiary);
    }

    /* Holiday: subtle red tint across the full column height */
    .gtt__bg-col--holiday {
      background: color-mix(in oklch, var(--color-system-red) 7%, transparent);
    }

    .gtt__bg-col--holiday.gtt__bg-col--today {
      background: color-mix(in oklch, var(--color-system-red) 8%, var(--color-system-blue) 5%);
    }

    /* Forced workday: no special tint (inherits default) */
    .gtt__bg-col--workday {
      background: transparent;
    }

    /* Row bands */
    .gtt__rows {
      position: absolute;
      inset: 0;
      display: flex;
      flex-direction: column;
      pointer-events: none;
    }

    .gtt__row-band {
      border-bottom: 1px solid var(--separator);
      flex-shrink: 0;
      transition: background var(--duration-instant) linear;
      pointer-events: all;
    }

    .gtt__row-band--hovered {
      background: var(--fill-primary);
    }

    /* Spacer band matching the sidebar group header — transparent but occupies the same height */
    .gtt__group-band {
      flex-shrink: 0;
      background: var(--fill-tertiary);
      border-bottom: 1px solid var(--separator);
      pointer-events: none;
    }

    /* Bar rows */
    .gtt__bar-row {
      position: absolute;
      left: 0;
      right: 0;
    }

    /* Today vertical line */
    .gtt__today-line {
      position: absolute;
      top: 0;
      bottom: 0;
      width: 2px;
      background: var(--color-system-blue);
      pointer-events: none;
      transform: translateX(-50%);
      opacity: 0.7;
    }

    .gtt__today-line__head {
      position: absolute;
      top: -1px;
      left: 50%;
      transform: translateX(-50%);
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: var(--color-system-blue);
    }
  `,
})
export class GanttTimelineComponent {
  protected readonly svc = inject(GanttService);

  readonly taskClick = output<GanttTaskClickPayload>();
  readonly taskDrop = output<GanttTaskDropPayload>();
  readonly taskResize = output<GanttTaskResizePayload>();
  readonly taskProgressChange = output<GanttTaskProgressChangePayload>();

  protected todayOffsetPx() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const start = this.svc.viewportStart();
    const end = this.svc.viewportEnd();
    if (today < start || today > end) return null;
    const days = Math.round(
      (today.getTime() - start.getTime()) / (1000 * 60 * 60 * 24),
    );
    return days * this.svc.cellWidth() + this.svc.cellWidth() / 2;
  }
}
