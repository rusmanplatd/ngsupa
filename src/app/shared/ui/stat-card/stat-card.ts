import { Component, input, computed } from '@angular/core';
import { LucideDynamicIcon } from '@lucide/angular';

export type StatTrend = 'up' | 'down' | 'neutral';

@Component({
  selector: 'app-stat-card',
  imports: [LucideDynamicIcon],
  host: {
    class: 'block',
  },
  template: `
    <div
      class="rounded-2xl p-5 transition-shadow duration-normal"
      [class]="cardClasses()"
    >
      <div class="flex items-start justify-between">
        <div class="min-w-0 flex-1">
          <p class="text-sm font-medium text-[var(--text-secondary)] truncate">{{ title() }}</p>
          <p class="mt-1.5 text-3xl font-bold tracking-tight text-[var(--text-primary)]">
            {{ value() }}
          </p>
        </div>
        @if (icon()) {
          <div class="shrink-0 flex h-10 w-10 items-center justify-center rounded-xl" [class]="iconBgClasses()">
            <svg [lucideIcon]="icon()!" [size]="20" [class]="iconClasses()" />
          </div>
        }
      </div>

      @if (change() !== null) {
        <div class="mt-3 flex items-center gap-1.5">
          <div class="flex items-center gap-0.5 rounded-full px-1.5 py-0.5" [class]="trendBgClasses()">
            @if (resolvedTrend() !== 'neutral') {
              <svg
                [lucideIcon]="resolvedTrend() === 'up' ? 'trending-up' : 'trending-down'"
                [size]="12"
                [class]="trendClasses()"
              />
            }
            <span class="text-xs font-semibold tabular-nums" [class]="trendClasses()">
              {{ change()! >= 0 ? '+' : '' }}{{ change() }}%
            </span>
          </div>
          @if (subtitle()) {
            <span class="text-xs text-[var(--text-tertiary)]">{{ subtitle() }}</span>
          }
        </div>
      }
    </div>
  `,
})
export class StatCardComponent {
  readonly title = input.required<string>();
  readonly value = input.required<string>();
  readonly change = input<number | null>(null);
  readonly trend = input<StatTrend | null>(null);
  readonly icon = input<string | null>(null);
  readonly subtitle = input<string | null>('vs last period');
  readonly variant = input<'default' | 'glass'>('default');

  protected readonly resolvedTrend = computed<StatTrend>(() => {
    if (this.trend()) return this.trend()!;
    const c = this.change();
    if (c === null || c === 0) return 'neutral';
    return c > 0 ? 'up' : 'down';
  });

  protected readonly cardClasses = computed(() => {
    if (this.variant() === 'glass') {
      return 'bg-[var(--glass-bg)] backdrop-blur-xl border border-[var(--glass-border)] shadow-md';
    }
    return 'bg-[var(--surface-elevated)] border border-[var(--border-default)] shadow-sm';
  });

  protected readonly iconBgClasses = computed(() => {
    return 'bg-[var(--fill-secondary)]';
  });

  protected readonly iconClasses = computed(() => {
    return 'text-[var(--text-secondary)]';
  });

  protected readonly trendClasses = computed(() => {
    switch (this.resolvedTrend()) {
      case 'up': return 'text-[var(--color-success)]';
      case 'down': return 'text-[var(--color-error)]';
      default: return 'text-[var(--text-tertiary)]';
    }
  });

  protected readonly trendBgClasses = computed(() => {
    switch (this.resolvedTrend()) {
      case 'up': return 'bg-[var(--color-success-container)]';
      case 'down': return 'bg-[var(--color-error-container)]';
      default: return 'bg-[var(--fill-primary)]';
    }
  });
}
