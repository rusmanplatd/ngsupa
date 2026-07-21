import { Component, input, computed } from '@angular/core';
import { LucideDynamicIcon } from '@lucide/angular';

/* ── Types ──────────────────────────────────────────────────── */

export type TimelineVariant = 'default' | 'success' | 'warning' | 'error' | 'info' | 'neutral';
export type TimelineSize = 'sm' | 'md' | 'lg';

export interface TimelineEvent {
  /** Unique identifier */
  id: string;
  /** Main title */
  title: string;
  /** Optional description / body text */
  description?: string;
  /** Optional timestamp string to display */
  timestamp?: string;
  /** Color variant for the node */
  variant?: TimelineVariant;
  /** Lucide icon name to display inside the node */
  icon?: string;
  /** Avatar image URL (overrides icon) */
  avatar?: string;
  /** Whether this event is the "active" / current step */
  active?: boolean;
  /** Whether this event is completed */
  completed?: boolean;
  /** Optional tags / labels */
  tags?: string[];
}

/* ── Timeline Item Component ────────────────────────────────── */

@Component({
  selector: 'app-timeline-item',
  imports: [LucideDynamicIcon],
  host: {
    class: 'timeline-item',
    '[class.timeline-item--active]': 'active()',
    '[class.timeline-item--completed]': 'completed()',
    '[class.timeline-item--last]': 'isLast()',
    '[class.timeline-item--sm]': 'size() === "sm"',
    '[class.timeline-item--md]': 'size() === "md"',
    '[class.timeline-item--lg]': 'size() === "lg"',
    'role': 'listitem',
  },
  template: `
    <!-- Node column -->
    <div class="timeline-item__rail">
      <div class="timeline-item__node" [class]="nodeClasses()">
        @if (avatar()) {
          <img
            [src]="avatar()"
            [alt]="title() + ' avatar'"
            class="timeline-item__avatar"
          />
        } @else if (icon()) {
          <svg [lucideIcon]="icon()!" [size]="iconSize()" />
        } @else if (completed()) {
          <svg lucideIcon="check" [size]="iconSize()" />
        } @else if (active()) {
          <span class="timeline-item__pulse"></span>
        } @else {
          <span class="timeline-item__dot"></span>
        }
      </div>
      @if (!isLast()) {
        <div class="timeline-item__connector" [class]="connectorClasses()"></div>
      }
    </div>

    <!-- Content column -->
    <div class="timeline-item__content">
      <div class="timeline-item__header">
        <span class="timeline-item__title" [class.timeline-item__title--active]="active()">
          {{ title() }}
        </span>
        @if (timestamp()) {
          <time class="timeline-item__timestamp">{{ timestamp() }}</time>
        }
      </div>
      @if (description()) {
        <p class="timeline-item__description">{{ description() }}</p>
      }
      @if (hasTags()) {
        <div class="timeline-item__tags">
          @for (tag of tags(); track tag) {
            <span class="timeline-item__tag">{{ tag }}</span>
          }
        </div>
      }
      <div class="timeline-item__extra">
        <ng-content />
      </div>
    </div>
  `,
  styles: `
    :host {
      display: grid;
      grid-template-columns: auto 1fr;
      gap: 0 14px;
      position: relative;
    }

    :host(.timeline-item--sm) {
      gap: 0 10px;
    }

    :host(.timeline-item--lg) {
      gap: 0 18px;
    }

    /* ── Rail (node + connector) ─────────────────────── */
    .timeline-item__rail {
      display: flex;
      flex-direction: column;
      align-items: center;
      position: relative;
    }

    /* ── Node ────────────────────────────────────────── */
    .timeline-item__node {
      position: relative;
      z-index: 2;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      border-radius: var(--radius-full);
      transition: all 0.3s var(--ease-spring);
      box-shadow: 0 0 0 3px var(--surface-primary);
    }

    :host(.timeline-item--sm) .timeline-item__node {
      width: 28px;
      height: 28px;
    }

    :host(.timeline-item--md) .timeline-item__node {
      width: 36px;
      height: 36px;
    }

    :host(.timeline-item--lg) .timeline-item__node {
      width: 44px;
      height: 44px;
    }

    /* ── Avatar ──────────────────────────────────────── */
    .timeline-item__avatar {
      width: 100%;
      height: 100%;
      border-radius: var(--radius-full);
      object-fit: cover;
    }

    /* ── Dot (default indicator) ─────────────────────── */
    .timeline-item__dot {
      width: 8px;
      height: 8px;
      border-radius: var(--radius-full);
      background: var(--text-quaternary);
      transition: background 0.2s var(--ease-default);
    }

    :host(.timeline-item--sm) .timeline-item__dot {
      width: 6px;
      height: 6px;
    }

    /* ── Pulse (active indicator) ────────────────────── */
    .timeline-item__pulse {
      width: 10px;
      height: 10px;
      border-radius: var(--radius-full);
      background: var(--timeline-default-bg);
      animation: timeline-pulse 2s var(--ease-in-out) infinite;
    }

    @keyframes timeline-pulse {
      0%, 100% { box-shadow: 0 0 0 0 oklch(59% 0.24 264 / 0.5); }
      50% { box-shadow: 0 0 0 8px oklch(59% 0.24 264 / 0); }
    }

    /* ── Connector ──────────────────────────────────── */
    .timeline-item__connector {
      flex: 1;
      width: 2px;
      min-height: 24px;
      border-radius: 1px;
      transition: background 0.3s var(--ease-default);
    }

    :host(.timeline-item--sm) .timeline-item__connector {
      min-height: 16px;
    }

    :host(.timeline-item--lg) .timeline-item__connector {
      min-height: 32px;
    }

    /* ── Content ─────────────────────────────────────── */
    .timeline-item__content {
      padding-bottom: 28px;
      min-width: 0;
    }

    :host(.timeline-item--sm) .timeline-item__content {
      padding-bottom: 16px;
    }

    :host(.timeline-item--lg) .timeline-item__content {
      padding-bottom: 36px;
    }

    :host(.timeline-item--last) .timeline-item__content {
      padding-bottom: 0;
    }

    .timeline-item__header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
      min-height: 36px;
    }

    :host(.timeline-item--sm) .timeline-item__header {
      min-height: 28px;
    }

    :host(.timeline-item--lg) .timeline-item__header {
      min-height: 44px;
    }

    .timeline-item__title {
      font: var(--type-subheadline);
      font-weight: 500;
      color: var(--text-primary);
      transition: color 0.2s var(--ease-default);
    }

    .timeline-item__title--active {
      font-weight: 600;
      color: var(--timeline-default-color);
    }

    :host(.timeline-item--lg) .timeline-item__title {
      font: var(--type-headline);
    }

    .timeline-item__timestamp {
      font: var(--type-caption-1);
      color: var(--text-tertiary);
      white-space: nowrap;
      flex-shrink: 0;
    }

    .timeline-item__description {
      font: var(--type-footnote);
      color: var(--text-secondary);
      margin-top: 4px;
      line-height: 1.5;
    }

    :host(.timeline-item--lg) .timeline-item__description {
      font: var(--type-subheadline);
      color: var(--text-secondary);
    }

    /* ── Tags ────────────────────────────────────────── */
    .timeline-item__tags {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      margin-top: 8px;
    }

    .timeline-item__tag {
      font: var(--type-caption-2);
      font-weight: 500;
      color: var(--text-secondary);
      background: var(--fill-primary);
      padding: 2px 8px;
      border-radius: var(--radius-full);
      border: 1px solid var(--border-default);
    }

    /* ── Extra (projected content) ───────────────────── */
    .timeline-item__extra:empty {
      display: none;
    }

    .timeline-item__extra {
      margin-top: 10px;
    }

    /* ── Variant node colors ─────────────────────────── */
    .node--default {
      background: var(--fill-primary);
      color: var(--text-tertiary);
    }

    .node--active {
      background: oklch(59% 0.24 264 / 0.12);
      color: var(--timeline-default-color);
      box-shadow: 0 0 0 3px var(--surface-primary), 0 0 0 5px oklch(59% 0.24 264 / 0.15);
    }

    .node--completed {
      background: var(--timeline-success-bg);
      color: #fff;
    }

    .node--success {
      background: oklch(60% 0.19 145 / 0.15);
      color: var(--timeline-success-color);
    }

    .node--warning {
      background: oklch(70% 0.18 55 / 0.15);
      color: var(--timeline-warning-color);
    }

    .node--error {
      background: oklch(59% 0.23 27 / 0.15);
      color: var(--timeline-error-color);
    }

    .node--info {
      background: oklch(62% 0.12 200 / 0.15);
      color: var(--timeline-info-color);
    }

    .node--neutral {
      background: var(--fill-secondary);
      color: var(--text-secondary);
    }

    /* ── Connector colors ────────────────────────────── */
    .connector--default {
      background: var(--separator);
    }

    .connector--completed {
      background: var(--timeline-success-bg);
      opacity: 0.4;
    }

    .connector--dashed {
      background: repeating-linear-gradient(
        to bottom,
        var(--separator) 0px,
        var(--separator) 4px,
        transparent 4px,
        transparent 8px
      );
    }

    /* ── Stagger animation ───────────────────────────── */
    :host {
      animation: timeline-fade-in 0.4s var(--ease-default) both;
    }

    @keyframes timeline-fade-in {
      from {
        opacity: 0;
        transform: translateY(8px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
  `,
})
export class TimelineItemComponent {
  readonly title = input.required<string>();
  readonly description = input<string>();
  readonly timestamp = input<string>();
  readonly variant = input<TimelineVariant>('default');
  readonly icon = input<string>();
  readonly avatar = input<string>();
  readonly active = input(false);
  readonly completed = input(false);
  readonly tags = input<string[]>([]);
  readonly isLast = input(false);
  readonly size = input<TimelineSize>('md');

  protected readonly hasTags = computed(() => this.tags().length > 0);

  protected readonly iconSize = computed(() => {
    const s = this.size();
    if (s === 'sm') return 12;
    if (s === 'lg') return 20;
    return 16;
  });

  protected readonly nodeClasses = computed(() => {
    if (this.active()) return 'timeline-item__node node--active';
    if (this.completed()) return 'timeline-item__node node--completed';

    const variantMap: Record<TimelineVariant, string> = {
      default: 'node--default',
      success: 'node--success',
      warning: 'node--warning',
      error: 'node--error',
      info: 'node--info',
      neutral: 'node--neutral',
    };
    return `timeline-item__node ${variantMap[this.variant()]}`;
  });

  protected readonly connectorClasses = computed(() => {
    if (this.completed()) return 'timeline-item__connector connector--completed';
    if (this.active()) return 'timeline-item__connector connector--dashed';
    return 'timeline-item__connector connector--default';
  });
}

/* ── Timeline Container Component ───────────────────────────── */

@Component({
  selector: 'app-timeline',
  imports: [TimelineItemComponent],
  host: {
    class: 'timeline',
    role: 'list',
    '[attr.aria-label]': 'ariaLabel() || "Timeline"',
  },
  template: `
    @for (event of events(); track event.id; let last = $last; let i = $index) {
      <app-timeline-item
        [title]="event.title"
        [description]="event.description"
        [timestamp]="event.timestamp"
        [variant]="event.variant ?? 'default'"
        [icon]="event.icon"
        [avatar]="event.avatar"
        [active]="event.active ?? false"
        [completed]="event.completed ?? false"
        [tags]="event.tags ?? []"
        [isLast]="last"
        [size]="size()"
        [style.animation-delay]="animate() ? (i * 60) + 'ms' : '0ms'"
      />
    }
  `,
  styles: `
    :host {
      display: block;
    }
  `,
})
export class TimelineComponent {
  readonly events = input.required<TimelineEvent[]>();
  readonly size = input<TimelineSize>('md');
  readonly ariaLabel = input<string>();
  readonly animate = input(true);
}
