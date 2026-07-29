import { Component, inject } from '@angular/core';
import { GanttService } from '../gantt.service';

@Component({
  selector: 'app-gantt-dependency-layer',
  host: {
    class: 'block',
    'aria-hidden': 'true',
    style: 'position: absolute; inset: 0; pointer-events: none;',
  },
  template: `
    <svg
      class="gdl"
      [attr.width]="svc.totalTimelineWidth()"
      [attr.height]="totalHeight()"
      aria-hidden="true"
    >
      <defs>
        <marker
          id="gantt-arrow-head"
          markerWidth="6"
          markerHeight="6"
          refX="5"
          refY="3"
          orient="auto"
        >
          <path
            d="M 0 0 L 6 3 L 0 6 Z"
            fill="var(--color-system-blue)"
            opacity="0.6"
          />
        </marker>
      </defs>

      @for (arrow of svc.dependencyArrows(); track arrow.fromTaskId + '-' + arrow.toTaskId) {
        <path
          class="gdl__arrow"
          [attr.d]="arrow.path"
          fill="none"
          stroke="var(--color-system-blue)"
          stroke-width="1.5"
          stroke-opacity="0.5"
          stroke-dasharray="4 3"
          marker-end="url(#gantt-arrow-head)"
        />
      }
    </svg>
  `,
  styles: `
    .gdl {
      position: absolute;
      top: 0;
      left: 0;
      overflow: visible;
      pointer-events: none;
    }

    .gdl__arrow {
      transition: stroke-opacity var(--duration-fast) var(--ease-default);
    }
  `,
})
export class GanttDependencyLayerComponent {
  protected readonly svc = inject(GanttService);

  protected totalHeight = () => {
    return this.svc.visibleRows().length * this.svc.rowHeight();
  };
}
