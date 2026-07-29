import { Component, input, computed } from '@angular/core';
import { GanttTask, TASK_COLOR_MAP } from '../gantt.models';

@Component({
  selector: 'app-gantt-task-popover',
  host: { class: 'block' },
  template: `
    <div class="gtp" role="tooltip" [attr.aria-label]="task().title + ' details'">
      <!-- Color accent bar -->
      <div class="gtp__accent" [style.background]="taskColor()" aria-hidden="true"></div>

      <div class="gtp__content">
        <!-- Header -->
        <div class="gtp__header">
          <span class="gtp__title">{{ task().title }}</span>
          @if (task().milestone) {
            <span class="gtp__badge gtp__badge--milestone">Milestone</span>
          }
        </div>

        <!-- Dates -->
        <div class="gtp__row">
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
            <rect x="1" y="2" width="10" height="9" rx="1.5" stroke="currentColor" stroke-width="1.2"/>
            <path d="M4 1v2M8 1v2M1 5h10" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/>
          </svg>
          <span>{{ startLabel() }}</span>
          <span class="gtp__sep" aria-hidden="true">→</span>
          <span>{{ endLabel() }}</span>
        </div>

        <!-- Duration -->
        <div class="gtp__row">
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
            <circle cx="6" cy="6" r="5" stroke="currentColor" stroke-width="1.2"/>
            <path d="M6 3v3l2 2" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/>
          </svg>
          <span>{{ durationLabel() }}</span>
        </div>

        <!-- Progress ring -->
        @if ((task().progress ?? 0) > 0) {
          <div class="gtp__progress-row" [attr.aria-label]="task().progress + '% complete'">
            <!-- Mini ring -->
            <svg width="28" height="28" viewBox="0 0 28 28" aria-hidden="true">
              <circle cx="14" cy="14" r="11" fill="none" stroke="var(--fill-secondary)" stroke-width="3"/>
              <circle
                cx="14" cy="14" r="11"
                fill="none"
                [attr.stroke]="taskColor()"
                stroke-width="3"
                stroke-linecap="round"
                [attr.stroke-dasharray]="circumference"
                [attr.stroke-dashoffset]="dashOffset()"
                transform="rotate(-90 14 14)"
              />
            </svg>
            <span class="gtp__progress-label">{{ task().progress }}% complete</span>
          </div>
        }

        <!-- Group -->
        @if (task().group) {
          <div class="gtp__row gtp__row--muted">
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
              <path d="M1 3h4l1 2h5v5H1z" stroke="currentColor" stroke-width="1.2" stroke-linejoin="round"/>
            </svg>
            <span>{{ task().group }}</span>
          </div>
        }

        <!-- Dependencies count -->
        @if ((task().dependencies?.length ?? 0) > 0) {
          <div class="gtp__row gtp__row--muted">
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
              <path d="M2 6h8M7 3l3 3-3 3" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            <span>{{ task().dependencies?.length }} predecessor{{ (task().dependencies?.length ?? 0) > 1 ? 's' : '' }}</span>
          </div>
        }
      </div>
    </div>
  `,
  styles: `
    .gtp {
      display: flex;
      background: var(--glass-bg-thick);
      backdrop-filter: blur(var(--blur-lg));
      -webkit-backdrop-filter: blur(var(--blur-lg));
      border: 1px solid var(--glass-border);
      border-radius: var(--radius-xl);
      box-shadow: var(--shadow-xl);
      overflow: hidden;
      min-width: 200px;
      max-width: 280px;
      animation: slide-up 0.18s var(--ease-spring);
    }

    /* Left accent bar */
    .gtp__accent {
      width: 4px;
      flex-shrink: 0;
      border-radius: var(--radius-full) 0 0 var(--radius-full);
    }

    .gtp__content {
      padding: 12px 14px;
      display: flex;
      flex-direction: column;
      gap: 8px;
      flex: 1;
    }

    /* Header */
    .gtp__header {
      display: flex;
      align-items: flex-start;
      gap: 6px;
    }

    .gtp__title {
      font: var(--type-subheadline);
      font-weight: 600;
      color: var(--text-primary);
      flex: 1;
    }

    .gtp__badge {
      font: var(--type-caption-2);
      font-weight: 600;
      padding: 1px 6px;
      border-radius: var(--radius-full);
      flex-shrink: 0;
    }

    .gtp__badge--milestone {
      background: var(--color-system-orange-light);
      color: var(--color-system-orange);
    }

    /* Info rows */
    .gtp__row {
      display: flex;
      align-items: center;
      gap: 6px;
      font: var(--type-caption-1);
      color: var(--text-secondary);
    }

    .gtp__row--muted {
      color: var(--text-tertiary);
    }

    .gtp__sep {
      color: var(--text-quaternary);
      font-size: 10px;
    }

    /* Progress */
    .gtp__progress-row {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .gtp__progress-label {
      font: var(--type-caption-1);
      color: var(--text-secondary);
    }
  `,
})
export class GanttTaskPopoverComponent {
  readonly task = input.required<GanttTask>();

  protected readonly circumference = 2 * Math.PI * 11;

  protected taskColor = computed(() => {
    const color = this.task().color ?? 'blue';
    return TASK_COLOR_MAP[color];
  });

  protected dashOffset = computed(() => {
    const progress = this.task().progress ?? 0;
    return this.circumference * (1 - progress / 100);
  });

  protected startLabel = computed(() =>
    this.task().start.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    }),
  );

  protected endLabel = computed(() =>
    this.task().end.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }),
  );

  protected durationLabel = computed(() => {
    const ms = this.task().end.getTime() - this.task().start.getTime();
    const days = Math.round(ms / (1000 * 60 * 60 * 24)) + 1;
    if (days === 1) return '1 day';
    if (days < 7) return `${days} days`;
    const weeks = Math.round(days / 7);
    return `${weeks} week${weeks > 1 ? 's' : ''}`;
  });
}
