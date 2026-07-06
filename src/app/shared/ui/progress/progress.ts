import { Component, input, computed, inject, effect } from '@angular/core';
import { LiveAnnouncer } from '@angular/cdk/a11y';

@Component({
  selector: 'app-progress',
  host: {
    role: 'progressbar',
    '[attr.aria-valuenow]': 'determinate() ? value() : null',
    '[attr.aria-valuemin]': '0',
    '[attr.aria-valuemax]': 'max()',
    '[attr.aria-label]': 'label() || "Progress"',
    class: 'block',
  },
  template: `
    @if (shape() === 'ring') {
      <!-- Circular / Ring variant -->
      <div class="inline-flex flex-col items-center gap-1.5">
        <div class="relative" [style.width.px]="ringSize()" [style.height.px]="ringSize()">
          <svg
            [attr.width]="ringSize()"
            [attr.height]="ringSize()"
            [attr.viewBox]="'0 0 ' + ringSize() + ' ' + ringSize()"
            class="-rotate-90"
          >
            <!-- Track -->
            <circle
              [attr.cx]="ringCenter()"
              [attr.cy]="ringCenter()"
              [attr.r]="ringRadius()"
              fill="none"
              [attr.stroke]="'var(--fill-secondary)'"
              [attr.stroke-width]="ringStroke()"
              stroke-linecap="round"
            />
            <!-- Progress arc -->
            <circle
              [attr.cx]="ringCenter()"
              [attr.cy]="ringCenter()"
              [attr.r]="ringRadius()"
              fill="none"
              [attr.stroke-width]="ringStroke()"
              stroke-linecap="round"
              [class]="ringBarClasses()"
              [attr.stroke-dasharray]="ringCircumference()"
              [attr.stroke-dashoffset]="ringDashOffset()"
              style="transition: stroke-dashoffset 0.5s cubic-bezier(0.2, 0, 0, 1)"
            />
          </svg>
          @if (showLabel() && determinate()) {
            <span class="absolute inset-0 flex items-center justify-center text-sm font-semibold tabular-nums text-[var(--text-primary)]">
              {{ percentage() }}%
            </span>
          }
        </div>
        @if (label()) {
          <span class="text-xs text-[var(--text-tertiary)]">{{ label() }}</span>
        }
      </div>
    } @else {
      <!-- Bar variant -->
      <div class="relative overflow-hidden rounded-full" [class]="trackClasses()">
        <div
          class="h-full rounded-full transition-all duration-slow"
          [class]="barClasses()"
          [style.width]="barWidth()"
          [style.animation]="!determinate() ? 'indeterminate 1.5s ease-in-out infinite' : 'none'"
        ></div>
      </div>
      @if (showLabel()) {
        <div class="mt-1.5 flex items-center justify-between">
          <span class="text-xs text-[var(--text-tertiary)]">{{ label() }}</span>
          @if (determinate()) {
            <span class="text-xs font-medium text-[var(--text-secondary)]">{{ percentage() }}%</span>
          }
        </div>
      }
    }
  `,
  styles: `
    @keyframes indeterminate {
      0% {
        width: 15%;
        margin-left: -15%;
      }
      50% {
        width: 40%;
        margin-left: 50%;
      }
      100% {
        width: 15%;
        margin-left: 115%;
      }
    }
  `,
})
export class ProgressComponent {
  readonly value = input(0);
  readonly max = input(100);
  readonly determinate = input(true);
  readonly size = input<'xs' | 'sm' | 'md'>('sm');
  readonly color = input<'blue' | 'green' | 'red' | 'orange' | 'gradient'>('blue');
  readonly label = input<string | null>(null);
  readonly showLabel = input(false);
  readonly shape = input<'bar' | 'ring'>('bar');
  readonly ringSize = input(64);
  /** Announce progress changes to screen readers. Set to a milestone interval (e.g. 25 = every 25%). */
  readonly announceEvery = input(25);

  private readonly liveAnnouncer = inject(LiveAnnouncer);
  private lastAnnouncedMilestone = -1;

  protected readonly percentage = computed(() =>
    Math.round((this.value() / this.max()) * 100)
  );

  protected readonly barWidth = computed(() =>
    this.determinate() ? `${Math.min(100, this.percentage())}%` : '30%'
  );

  protected readonly trackClasses = computed(() => {
    const sizeMap = { xs: 'h-0.5', sm: 'h-1', md: 'h-2' };
    return `${sizeMap[this.size()]} bg-[var(--fill-secondary)]`;
  });

  protected readonly barClasses = computed(() => {
    const colorMap = {
      blue: 'bg-system-blue',
      green: 'bg-system-green',
      red: 'bg-system-red',
      orange: 'bg-system-orange',
      gradient: 'bg-gradient-to-r from-system-blue via-system-purple to-system-pink',
    };
    return colorMap[this.color()];
  });

  constructor() {
    // Announce progress to screen readers at milestone intervals
    effect(() => {
      if (!this.determinate()) return;
      const pct = this.percentage();
      const interval = this.announceEvery();
      const milestone = Math.floor(pct / interval) * interval;
      if (milestone !== this.lastAnnouncedMilestone && milestone > 0) {
        this.lastAnnouncedMilestone = milestone;
        const labelStr = this.label() ? `${this.label()}: ` : '';
        this.liveAnnouncer.announce(`${labelStr}${pct}%`, 'polite');
      }
      // Announce completion
      if (pct >= 100 && this.lastAnnouncedMilestone !== 100) {
        this.lastAnnouncedMilestone = 100;
        const labelStr = this.label() ? `${this.label()} ` : '';
        this.liveAnnouncer.announce(`${labelStr}complete`, 'assertive');
      }
    });
  }

  // Ring helpers
  protected readonly ringStroke = computed(() => {
    const s = this.ringSize();
    return s <= 48 ? 3 : s <= 80 ? 4 : 5;
  });

  protected readonly ringCenter = computed(() => this.ringSize() / 2);

  protected readonly ringRadius = computed(() =>
    (this.ringSize() - this.ringStroke() * 2) / 2
  );

  protected readonly ringCircumference = computed(() =>
    2 * Math.PI * this.ringRadius()
  );

  protected readonly ringDashOffset = computed(() => {
    if (!this.determinate()) return this.ringCircumference() * 0.75;
    const pct = Math.min(100, this.percentage()) / 100;
    return this.ringCircumference() * (1 - pct);
  });

  protected readonly ringBarClasses = computed(() => {
    const colorMap: Record<string, string> = {
      blue: 'stroke-system-blue',
      green: 'stroke-system-green',
      red: 'stroke-system-red',
      orange: 'stroke-system-orange',
      gradient: 'stroke-system-blue',
    };
    return colorMap[this.color()] || 'stroke-system-blue';
  });
}
