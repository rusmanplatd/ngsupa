import {
  Component,
  input,
  model,
  signal,
  computed,
  output,
  OnDestroy,
  inject,
  ElementRef,
  viewChild,
  AfterViewInit,
} from '@angular/core';
import { Overlay, OverlayRef, ConnectedPosition } from '@angular/cdk/overlay';
import { ComponentPortal } from '@angular/cdk/portal';
import { LiveAnnouncer } from '@angular/cdk/a11y';
import { LucideDynamicIcon } from '@lucide/angular';

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

export interface DatePickerConfig {
  minDate?: Date | null;
  maxDate?: Date | null;
  disabledDates?: Date[];
  disabledDaysOfWeek?: number[]; // 0=Sun, 6=Sat
  firstDayOfWeek?: 0 | 1; // 0=Sunday, 1=Monday
  locale?: string;
}

export type DatePickerMode = 'single' | 'range';

export interface DateRange {
  start: Date | null;
  end: Date | null;
}

interface CalendarDay {
  date: Date;
  day: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  isSelected: boolean;
  isRangeStart: boolean;
  isRangeEnd: boolean;
  isInRange: boolean;
  isDisabled: boolean;
}

// ─────────────────────────────────────────────────────────────
// Calendar Panel (dropdown content)
// ─────────────────────────────────────────────────────────────

@Component({
  selector: 'app-calendar-panel',
  imports: [LucideDynamicIcon],
  host: {
    class: 'block',
    role: 'dialog',
    'aria-modal': 'true',
    'aria-label': 'Date picker',
    '(keydown.escape)': 'escapePressed.emit()',
  },
  template: `
    <div class="dp-panel" style="animation: dp-scale-in 0.25s var(--ease-default)">
      <!-- View toggle: days / months / years -->
      @switch (view()) {

        <!-- ── DAYS VIEW ─────────────────────────────── -->
        @case ('days') {
          <!-- Month/Year header -->
          <div class="dp-header">
            <button
              type="button"
              class="dp-header-title"
              aria-label="Switch to month selection"
              (click)="view.set('months')"
            >
              {{ monthYearLabel() }}
              <svg lucideIcon="chevron-down" [size]="10" class="dp-header-chevron" />
            </button>
            <div class="dp-header-nav">
              <button
                type="button"
                class="dp-nav-btn"
                aria-label="Previous month"
                [disabled]="!canGoPrev()"
                (click)="prevMonth()"
              >
                <svg lucideIcon="chevron-left" [size]="14" />
              </button>
              <button
                type="button"
                class="dp-nav-btn"
                aria-label="Next month"
                [disabled]="!canGoNext()"
                (click)="nextMonth()"
              >
                <svg lucideIcon="chevron-right" [size]="14" />
              </button>
            </div>
          </div>

          <!-- Weekday headers -->
          <div class="dp-weekday-row">
            @for (dayName of weekdayLabels(); track dayName) {
              <div class="dp-weekday-label">{{ dayName }}</div>
            }
          </div>

          <!-- Day grid -->
          <div
            class="dp-day-grid"
            role="grid"
            aria-label="Calendar days"
            (keydown)="onGridKeydown($event)"
          >
            @for (day of calendarDays(); track day.date.toISOString()) {
              <button
                type="button"
                role="gridcell"
                [attr.aria-selected]="day.isSelected || day.isRangeStart || day.isRangeEnd"
                [attr.aria-disabled]="day.isDisabled || !day.isCurrentMonth"
                [disabled]="day.isDisabled || !day.isCurrentMonth"
                [attr.aria-label]="getDayAriaLabel(day.date)"
                [attr.tabindex]="isFocusedDay(day.date) ? 0 : -1"
                [attr.data-date]="day.date.toISOString()"
                class="dp-day-cell"
                [class.dp-day--other-month]="!day.isCurrentMonth"
                [class.dp-day--disabled]="day.isDisabled"
                [class.dp-day--today]="day.isToday && !day.isSelected && !day.isRangeStart && !day.isRangeEnd"
                [class.dp-day--selected]="day.isSelected"
                [class.dp-day--range-start]="day.isRangeStart"
                [class.dp-day--range-end]="day.isRangeEnd"
                [class.dp-day--in-range]="day.isInRange"
                [class.dp-day--focused]="isFocusedDay(day.date)"
                (click)="onDayClick(day)"
                (mouseenter)="onDayHover(day)"
                (focus)="onDayFocus(day.date)"
              >
                <span class="dp-day-number">{{ day.day }}</span>
                <!-- Today dot indicator -->
                @if (day.isToday && !day.isSelected && !day.isRangeStart && !day.isRangeEnd) {
                  <span class="dp-today-dot"></span>
                }
              </button>
            }
          </div>

          <!-- Footer -->
          <div class="dp-footer">
            <button
              type="button"
              class="dp-footer-btn dp-footer-btn--accent"
              (click)="goToToday()"
            >
              Today
            </button>
            <div class="dp-footer-actions">
              @if (mode() === 'range' && (rangeStart() || rangeEnd())) {
                <button
                  type="button"
                  class="dp-footer-btn dp-footer-btn--danger"
                  (click)="clearRange()"
                >
                  Clear Range
                </button>
              }
              @if (showClearButton()) {
                <button
                  type="button"
                  class="dp-footer-btn dp-footer-btn--muted"
                  (click)="clearSelection()"
                >
                  Clear
                </button>
              }
            </div>
          </div>
        }

        <!-- ── MONTHS VIEW ───────────────────────────── -->
        @case ('months') {
          <div class="dp-header">
            <button
              type="button"
              class="dp-header-title"
              aria-label="Switch to year selection"
              (click)="view.set('years')"
            >
              {{ viewYear() }}
              <svg lucideIcon="chevron-down" [size]="10" class="dp-header-chevron" />
            </button>
            <div class="dp-header-nav">
              <button
                type="button"
                class="dp-nav-btn"
                aria-label="Previous year"
                (click)="viewYear.update(y => y - 1)"
              >
                <svg lucideIcon="chevron-left" [size]="14" />
              </button>
              <button
                type="button"
                class="dp-nav-btn"
                aria-label="Next year"
                (click)="viewYear.update(y => y + 1)"
              >
                <svg lucideIcon="chevron-right" [size]="14" />
              </button>
            </div>
          </div>
          <div class="dp-grid-view" style="animation: dp-fade-in 0.15s ease-out">
            @for (m of monthLabels; track m.index) {
              <button
                type="button"
                class="dp-grid-cell"
                [class.dp-grid-cell--active]="m.index === viewMonth()"
                [class.dp-grid-cell--current]="m.index !== viewMonth() && isCurrentYearAndMonth(m.index)"
                (click)="selectMonth(m.index)"
              >
                {{ m.short }}
              </button>
            }
          </div>
        }

        <!-- ── YEARS VIEW ────────────────────────────── -->
        @case ('years') {
          <div class="dp-header">
            <span class="dp-header-title dp-header-title--static">
              {{ yearRangeLabel() }}
            </span>
            <div class="dp-header-nav">
              <button
                type="button"
                class="dp-nav-btn"
                aria-label="Previous decade"
                (click)="yearPageStart.update(y => y - 12)"
              >
                <svg lucideIcon="chevron-left" [size]="14" />
              </button>
              <button
                type="button"
                class="dp-nav-btn"
                aria-label="Next decade"
                (click)="yearPageStart.update(y => y + 12)"
              >
                <svg lucideIcon="chevron-right" [size]="14" />
              </button>
            </div>
          </div>
          <div class="dp-grid-view" style="animation: dp-fade-in 0.15s ease-out">
            @for (year of yearGrid(); track year) {
              <button
                type="button"
                class="dp-grid-cell"
                [class.dp-grid-cell--active]="year === viewYear()"
                [class.dp-grid-cell--current]="year !== viewYear() && year === currentActualYear"
                (click)="selectYear(year)"
              >
                {{ year }}
              </button>
            }
          </div>
        }
      }
    </div>
  `,
  styles: `
    /* ── Animations ─────────────────────────────────── */
    @keyframes dp-scale-in {
      from { opacity: 0; transform: scale(0.96) translateY(-6px); }
      to   { opacity: 1; transform: scale(1) translateY(0); }
    }

    @keyframes dp-fade-in {
      from { opacity: 0; transform: translateY(-4px); }
      to   { opacity: 1; transform: translateY(0); }
    }

    /* ── Panel ─────────────────────────────────────── */
    .dp-panel {
      width: 310px;
      border-radius: 16px;
      background: var(--glass-bg-thick);
      backdrop-filter: blur(40px) saturate(1.8);
      -webkit-backdrop-filter: blur(40px) saturate(1.8);
      border: 1px solid var(--glass-border);
      box-shadow:
        0 8px 32px oklch(0% 0 0 / 0.12),
        0 2px 8px oklch(0% 0 0 / 0.06);
      overflow: hidden;
      user-select: none;
    }

    /* ── Header ────────────────────────────────────── */
    .dp-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 14px 14px 8px 16px;
    }

    .dp-header-title {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      padding: 4px 10px 4px 6px;
      border-radius: 8px;
      font-size: 15px;
      font-weight: 600;
      letter-spacing: -0.01em;
      color: var(--text-primary);
      cursor: pointer;
      background: none;
      border: none;
      transition: background-color 0.15s ease;

      &:hover {
        background: var(--fill-primary);
      }

      &:active {
        background: var(--fill-secondary);
      }
    }

    .dp-header-title--static {
      cursor: default;
      padding: 4px 6px;
      &:hover { background: none; }
      &:active { background: none; }
    }

    .dp-header-chevron {
      opacity: 0.45;
      transition: transform 0.2s ease;
    }

    .dp-header-nav {
      display: flex;
      align-items: center;
      gap: 2px;
    }

    .dp-nav-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 32px;
      height: 32px;
      border-radius: 8px;
      background: none;
      border: none;
      color: var(--text-secondary);
      cursor: pointer;
      transition: all 0.15s ease;

      &:hover:not(:disabled) {
        background: var(--fill-primary);
        color: var(--text-primary);
      }

      &:active:not(:disabled) {
        background: var(--fill-secondary);
        transform: scale(0.92);
      }

      &:disabled {
        opacity: 0.25;
        cursor: not-allowed;
      }
    }

    /* ── Weekday Row ───────────────────────────────── */
    .dp-weekday-row {
      display: grid;
      grid-template-columns: repeat(7, 1fr);
      padding: 0 12px 4px;
    }

    .dp-weekday-label {
      display: flex;
      align-items: center;
      justify-content: center;
      height: 28px;
      font-size: 11px;
      font-weight: 600;
      color: var(--text-tertiary);
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }

    /* ── Day Grid ──────────────────────────────────── */
    .dp-day-grid {
      display: grid;
      grid-template-columns: repeat(7, 1fr);
      padding: 0 12px 10px;
      gap: 2px 0;
    }

    .dp-day-cell {
      position: relative;
      display: flex;
      align-items: center;
      justify-content: center;
      height: 36px;
      font-size: 14px;
      font-weight: 400;
      color: var(--text-primary);
      background: none;
      border: none;
      cursor: pointer;
      border-radius: 50%;
      transition: all 0.15s ease;

      &:hover:not(:disabled):not(.dp-day--selected):not(.dp-day--range-start):not(.dp-day--range-end):not(.dp-day--other-month) {
        background: var(--fill-primary);
      }

      &:active:not(:disabled):not(.dp-day--other-month) {
        transform: scale(0.88);
      }
    }

    .dp-day-number {
      position: relative;
      z-index: 2;
      line-height: 1;
    }

    /* Day states */
    .dp-day--other-month {
      color: var(--text-quaternary);
      cursor: default;
    }

    .dp-day--disabled {
      color: var(--text-quaternary);
      cursor: not-allowed;
      opacity: 0.5;
    }

    .dp-day--focused:focus-visible {
      outline: 2px solid var(--system-blue, #007aff);
      outline-offset: 1px;
    }

    .dp-day--today {
      font-weight: 600;
      color: var(--system-blue);
    }

    .dp-today-dot {
      position: absolute;
      bottom: 4px;
      left: 50%;
      transform: translateX(-50%);
      width: 4px;
      height: 4px;
      border-radius: 50%;
      background: var(--system-blue);
    }

    .dp-day--selected {
      background: var(--system-blue) !important;
      color: white !important;
      font-weight: 600;
      border-radius: 50%;
      box-shadow: 0 2px 8px oklch(59% 0.24 264 / 0.35);
    }

    .dp-day--range-start {
      background: var(--system-blue) !important;
      color: white !important;
      font-weight: 600;
      border-radius: 50% 0 0 50%;
      box-shadow: 0 1px 4px oklch(59% 0.24 264 / 0.25);
    }

    .dp-day--range-end {
      background: var(--system-blue) !important;
      color: white !important;
      font-weight: 600;
      border-radius: 0 50% 50% 0;
      box-shadow: 0 1px 4px oklch(59% 0.24 264 / 0.25);
    }

    .dp-day--range-start.dp-day--range-end {
      border-radius: 50%;
    }

    .dp-day--in-range {
      background: oklch(59% 0.24 264 / 0.1);
      color: var(--system-blue);
      border-radius: 0;
      font-weight: 500;
    }

    /* ── Footer ────────────────────────────────────── */
    .dp-footer {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 8px 16px 12px;
      border-top: 1px solid var(--separator);
    }

    .dp-footer-actions {
      display: flex;
      gap: 12px;
    }

    .dp-footer-btn {
      padding: 4px 2px;
      font-size: 13px;
      font-weight: 500;
      background: none;
      border: none;
      cursor: pointer;
      transition: opacity 0.15s ease;

      &:hover { opacity: 0.7; }
      &:active { opacity: 0.5; }
    }

    .dp-footer-btn--accent {
      color: var(--system-blue);
      font-weight: 600;
    }

    .dp-footer-btn--danger {
      color: var(--system-red);
    }

    .dp-footer-btn--muted {
      color: var(--text-tertiary);

      &:hover { color: var(--text-secondary); }
    }

    /* ── Grid View (months/years) ──────────────────── */
    .dp-grid-view {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 6px;
      padding: 4px 14px 14px;
    }

    .dp-grid-cell {
      display: flex;
      align-items: center;
      justify-content: center;
      height: 40px;
      border-radius: 10px;
      font-size: 14px;
      font-weight: 500;
      color: var(--text-primary);
      background: none;
      border: none;
      cursor: pointer;
      transition: all 0.15s ease;

      &:hover:not(.dp-grid-cell--active) {
        background: var(--fill-primary);
      }

      &:active {
        transform: scale(0.95);
      }
    }

    .dp-grid-cell--active {
      background: var(--system-blue);
      color: white;
      font-weight: 600;
      box-shadow: 0 2px 8px oklch(59% 0.24 264 / 0.3);
    }

    .dp-grid-cell--current {
      color: var(--system-blue);
      font-weight: 600;
    }
  `,
})
export class CalendarPanelComponent {
  // Config
  readonly mode = signal<DatePickerMode>('single');
  readonly minDate = signal<Date | null>(null);
  readonly maxDate = signal<Date | null>(null);
  readonly disabledDates = signal<Date[]>([]);
  readonly disabledDaysOfWeek = signal<number[]>([]);
  readonly firstDayOfWeek = signal<0 | 1>(0);
  readonly locale = signal('en-US');

  // State
  readonly selectedDate = signal<Date | null>(null);
  readonly rangeStart = signal<Date | null>(null);
  readonly rangeEnd = signal<Date | null>(null);
  readonly hoveredDate = signal<Date | null>(null);
  /** Tracks which day cell has roving tabindex focus (separate from selectedDate). */
  protected readonly focusedDate = signal<Date | null>(null);

  readonly viewMonth = signal(new Date().getMonth());
  readonly viewYear = signal(new Date().getFullYear());
  readonly view = signal<'days' | 'months' | 'years'>('days');
  readonly yearPageStart = signal(Math.floor(new Date().getFullYear() / 12) * 12);

  // Outputs
  readonly dateSelected = output<Date>();
  readonly rangeSelected = output<DateRange>();
  readonly escapePressed = output<void>();

  // Static
  protected readonly currentActualYear = new Date().getFullYear();

  // Injections
  private readonly liveAnnouncer = inject(LiveAnnouncer);

  // ── Computed ────────────────────────────────────────────

  protected readonly monthYearLabel = computed(() => {
    const d = new Date(this.viewYear(), this.viewMonth());
    return new Intl.DateTimeFormat(this.locale(), { month: 'long', year: 'numeric' }).format(d);
  });

  protected readonly weekdayLabels = computed(() => {
    const locale = this.locale();
    const fdow = this.firstDayOfWeek();
    const labels: string[] = [];
    // Get a known Sunday (2024-01-07 is a Sunday)
    const baseSunday = new Date(2024, 0, 7);
    for (let i = 0; i < 7; i++) {
      const d = new Date(baseSunday);
      d.setDate(d.getDate() + ((i + fdow) % 7));
      labels.push(new Intl.DateTimeFormat(locale, { weekday: 'narrow' }).format(d));
    }
    return labels;
  });

  protected readonly calendarDays = computed((): CalendarDay[] => {
    const year = this.viewYear();
    const month = this.viewMonth();
    const fdow = this.firstDayOfWeek();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const selected = this.selectedDate();
    const rStart = this.rangeStart();
    const rEnd = this.rangeEnd();
    const hovered = this.hoveredDate();
    const isRange = this.mode() === 'range';

    // Determine effective range end for highlighting
    const effectiveRangeEnd = rEnd ?? (isRange && rStart && hovered && hovered > rStart ? hovered : null);

    const firstOfMonth = new Date(year, month, 1);
    const lastOfMonth = new Date(year, month + 1, 0);
    const startDay = firstOfMonth.getDay();
    // How many leading blanks from previous month
    const leadingDays = (startDay - fdow + 7) % 7;

    const days: CalendarDay[] = [];

    // Previous month fill
    for (let i = leadingDays - 1; i >= 0; i--) {
      const d = new Date(year, month, -i);
      days.push(this.buildDay(d, false, today, selected, rStart, effectiveRangeEnd));
    }

    // Current month
    for (let d = 1; d <= lastOfMonth.getDate(); d++) {
      const date = new Date(year, month, d);
      days.push(this.buildDay(date, true, today, selected, rStart, effectiveRangeEnd));
    }

    // Next month fill (complete the grid to 6 rows = 42 cells, or at least fill row)
    const totalCells = days.length <= 35 ? 35 : 42;
    while (days.length < totalCells) {
      const d = new Date(year, month + 1, days.length - leadingDays - lastOfMonth.getDate() + 1);
      days.push(this.buildDay(d, false, today, selected, rStart, effectiveRangeEnd));
    }

    return days;
  });

  protected readonly canGoPrev = computed(() => {
    const min = this.minDate();
    if (!min) return true;
    return this.viewYear() > min.getFullYear() ||
      (this.viewYear() === min.getFullYear() && this.viewMonth() > min.getMonth());
  });

  protected readonly canGoNext = computed(() => {
    const max = this.maxDate();
    if (!max) return true;
    return this.viewYear() < max.getFullYear() ||
      (this.viewYear() === max.getFullYear() && this.viewMonth() < max.getMonth());
  });

  protected readonly showClearButton = computed(() => {
    return this.mode() === 'single' && this.selectedDate() !== null;
  });

  protected readonly yearRangeLabel = computed(() => {
    const start = this.yearPageStart();
    return `${start} – ${start + 11}`;
  });

  protected readonly yearGrid = computed(() => {
    const start = this.yearPageStart();
    return Array.from({ length: 12 }, (_, i) => start + i);
  });

  protected readonly monthLabels = Array.from({ length: 12 }, (_, i) => ({
    index: i,
    short: new Intl.DateTimeFormat('en-US', { month: 'short' }).format(new Date(2024, i)),
  }));

  // ── Helpers ─────────────────────────────────────────────

  protected isCurrentYearAndMonth(monthIndex: number): boolean {
    const now = new Date();
    return this.viewYear() === now.getFullYear() && monthIndex === now.getMonth();
  }

  private buildDay(
    date: Date,
    isCurrentMonth: boolean,
    today: Date,
    selected: Date | null,
    rangeStart: Date | null,
    rangeEnd: Date | null,
  ): CalendarDay {
    const time = date.getTime();
    const isRange = this.mode() === 'range';

    return {
      date,
      day: date.getDate(),
      isCurrentMonth,
      isToday: this.sameDay(date, today),
      isSelected: !isRange && !!selected && this.sameDay(date, selected),
      isRangeStart: isRange && !!rangeStart && this.sameDay(date, rangeStart),
      isRangeEnd: isRange && !!rangeEnd && this.sameDay(date, rangeEnd),
      isInRange: isRange && !!rangeStart && !!rangeEnd &&
        time > rangeStart.getTime() && time < rangeEnd.getTime(),
      isDisabled: !isCurrentMonth || this.isDateDisabled(date),
    };
  }

  private isDateDisabled(date: Date): boolean {
    const min = this.minDate();
    const max = this.maxDate();
    if (min && date < min) return true;
    if (max && date > max) return true;
    if (this.disabledDaysOfWeek().includes(date.getDay())) return true;
    return this.disabledDates().some((d) => this.sameDay(d, date));
  }

  private sameDay(a: Date, b: Date): boolean {
    return a.getFullYear() === b.getFullYear() &&
      a.getMonth() === b.getMonth() &&
      a.getDate() === b.getDate();
  }

  // ── Actions ─────────────────────────────────────────────

  protected prevMonth(): void {
    if (this.viewMonth() === 0) {
      this.viewMonth.set(11);
      this.viewYear.update((y) => y - 1);
    } else {
      this.viewMonth.update((m) => m - 1);
    }
  }

  protected nextMonth(): void {
    if (this.viewMonth() === 11) {
      this.viewMonth.set(0);
      this.viewYear.update((y) => y + 1);
    } else {
      this.viewMonth.update((m) => m + 1);
    }
  }

  protected selectMonth(month: number): void {
    this.viewMonth.set(month);
    this.view.set('days');
  }

  protected selectYear(year: number): void {
    this.viewYear.set(year);
    this.view.set('months');
  }

  protected goToToday(): void {
    const today = new Date();
    this.viewMonth.set(today.getMonth());
    this.viewYear.set(today.getFullYear());
    this.view.set('days');
  }

  protected onDayClick(day: CalendarDay): void {
    if (day.isDisabled) return;

    if (this.mode() === 'single') {
      this.selectedDate.set(day.date);
      this.dateSelected.emit(day.date);
    } else {
      // Range mode
      const start = this.rangeStart();
      if (!start || this.rangeEnd()) {
        // Start new range
        this.rangeStart.set(day.date);
        this.rangeEnd.set(null);
        this.hoveredDate.set(null);
      } else {
        // Complete range
        if (day.date < start) {
          this.rangeStart.set(day.date);
          this.rangeEnd.set(start);
        } else {
          this.rangeEnd.set(day.date);
        }
        this.rangeSelected.emit({
          start: this.rangeStart(),
          end: this.rangeEnd(),
        });
      }
    }
  }

  protected onDayHover(day: CalendarDay): void {
    if (this.mode() === 'range' && this.rangeStart() && !this.rangeEnd() && !day.isDisabled) {
      this.hoveredDate.set(day.date);
    }
  }

  protected onDayFocus(date: Date): void {
    this.focusedDate.set(date);
  }

  /** Returns true if the given date is the current roving-tabindex focus target. */
  protected isFocusedDay(date: Date): boolean {
    const fd = this.focusedDate();
    // Fallback to selectedDate / rangeStart / today if focusedDate not set
    const target = fd ?? this.selectedDate() ?? this.rangeStart() ?? new Date();
    return this.sameDay(date, target);
  }

  /**
   * Grid-level keyboard handler implementing the ARIA grid pattern for a calendar:
   * Arrow Left/Right: ±1 day
   * Arrow Up/Down:    ±7 days (one week)
   * PageUp/PageDown:  previous/next month
   * Home/End:         start/end of current week
   */
  protected onGridKeydown(event: KeyboardEvent): void {
    if (this.view() !== 'days') return;

    const handled = ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown',
                     'PageUp', 'PageDown', 'Home', 'End'];
    if (!handled.includes(event.key)) return;
    event.preventDefault();

    const current = this.focusedDate() ?? this.selectedDate() ?? new Date();
    let next: Date;

    switch (event.key) {
      case 'ArrowLeft':
        next = this.addDays(current, -1);
        break;
      case 'ArrowRight':
        next = this.addDays(current, 1);
        break;
      case 'ArrowUp':
        next = this.addDays(current, -7);
        break;
      case 'ArrowDown':
        next = this.addDays(current, 7);
        break;
      case 'PageUp':
        next = this.addMonths(current, -1);
        break;
      case 'PageDown':
        next = this.addMonths(current, 1);
        break;
      case 'Home': {
        // Jump to Monday (or first day of week) of the current week
        const dow = current.getDay();
        const fdow = this.firstDayOfWeek();
        const diff = (dow - fdow + 7) % 7;
        next = this.addDays(current, -diff);
        break;
      }
      case 'End': {
        // Jump to Sunday (or last day of week) of the current week
        const dow = current.getDay();
        const fdow = this.firstDayOfWeek();
        const diff = (6 - ((dow - fdow + 7) % 7));
        next = this.addDays(current, diff);
        break;
      }
      default:
        return;
    }

    // Navigate to the month of the target date if necessary
    if (next.getMonth() !== this.viewMonth() || next.getFullYear() !== this.viewYear()) {
      this.viewMonth.set(next.getMonth());
      this.viewYear.set(next.getFullYear());
    }

    this.focusedDate.set(next);

    // Announce the new focused date
    this.liveAnnouncer.announce(
      new Intl.DateTimeFormat(this.locale(), {
        weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
      }).format(next),
      'polite'
    );

    // Move DOM focus to the button for the new date (after Angular renders)
    requestAnimationFrame(() => {
      const iso = next.toISOString();
      const btn = document.querySelector<HTMLButtonElement>(
        `[data-date="${iso}"]`
      );
      btn?.focus();
    });
  }

  protected clearSelection(): void {
    this.selectedDate.set(null);
    this.dateSelected.emit(null!);
  }

  protected clearRange(): void {
    this.rangeStart.set(null);
    this.rangeEnd.set(null);
    this.hoveredDate.set(null);
  }

  private addDays(date: Date, days: number): Date {
    const d = new Date(date);
    d.setDate(d.getDate() + days);
    return d;
  }

  private addMonths(date: Date, months: number): Date {
    const d = new Date(date);
    const targetMonth = d.getMonth() + months;
    d.setMonth(targetMonth);
    // Guard against overshooting (e.g. Jan 31 + 1 month => Mar 3)
    if (d.getMonth() !== ((targetMonth % 12) + 12) % 12) {
      d.setDate(0); // last day of previous month
    }
    return d;
  }

  // Public API for parent to set view to a specific date
  navigateTo(date: Date): void {
    this.viewMonth.set(date.getMonth());
    this.viewYear.set(date.getFullYear());
    this.yearPageStart.set(Math.floor(date.getFullYear() / 12) * 12);
    this.focusedDate.set(date);
  }

  protected getDayAriaLabel(date: Date): string {
    return new Intl.DateTimeFormat('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    }).format(date);
  }
}

// ─────────────────────────────────────────────────────────────
// DatePicker Component (input + dropdown)
// ─────────────────────────────────────────────────────────────

@Component({
  selector: 'app-date-picker',
  imports: [LucideDynamicIcon],
  host: {
    class: 'block',
    '(keydown.escape)': 'close()',
  },
  template: `
    <!-- Trigger input -->
    <div
      class="dp-trigger"
      [class.dp-trigger--error]="error()"
      [class.dp-trigger--open]="isOpen()"
      [class.dp-trigger--disabled]="disabled()"
      [class.dp-trigger--filled]="!!displayValue()"
      (click)="toggle()"
      (keydown.enter)="toggle()"
      (keydown.space)="$event.preventDefault(); toggle()"
      [attr.tabindex]="disabled() ? -1 : 0"
      role="combobox"
      [attr.aria-expanded]="isOpen()"
      aria-haspopup="dialog"
      [attr.aria-label]="label()"
    >
      <div class="dp-trigger-icon">
        <svg lucideIcon="calendar" [size]="18" />
      </div>
      <div class="dp-trigger-content">
        <span
          class="dp-trigger-label"
          [class.dp-trigger-label--float]="!!displayValue() || isOpen()"
          [class.dp-trigger-label--accent]="isOpen()"
        >
          {{ label() }}
        </span>
        @if (displayValue()) {
          <span class="dp-trigger-value">{{ displayValue() }}</span>
        }
      </div>
      <div class="dp-trigger-trailing">
        @if (displayValue() && clearable() && !disabled()) {
          <button
            type="button"
            tabindex="-1"
            class="dp-clear-btn"
            aria-label="Clear date"
            (click)="onClear($event)"
          >
            <svg lucideIcon="x" [size]="10" />
          </button>
        }
        <div class="dp-trigger-chevron" [class.dp-trigger-chevron--open]="isOpen()">
          <svg lucideIcon="chevron-down" [size]="14" />
        </div>
      </div>
    </div>

    <!-- Error / Hint -->
    @if (error() || hint()) {
      <div class="dp-hint">
        @if (error()) {
          <p role="alert" class="dp-hint-text dp-hint-text--error">{{ error() }}</p>
        } @else if (hint()) {
          <p class="dp-hint-text">{{ hint() }}</p>
        }
      </div>
    }
  `,
  styles: `
    /* ── Trigger ────────────────────────────────────── */
    .dp-trigger {
      position: relative;
      display: flex;
      align-items: center;
      height: 54px;
      border-radius: 14px;
      border: 1.5px solid var(--border-default);
      background: var(--fill-primary);
      cursor: pointer;
      transition: all 0.2s ease;
      outline: none;

      &:hover:not(.dp-trigger--disabled) {
        border-color: var(--border-opaque);
      }

      &:focus-visible {
        border-color: var(--system-blue);
        box-shadow: 0 0 0 3px oklch(59% 0.24 264 / 0.15);
      }
    }

    .dp-trigger--open {
      border-color: var(--system-blue);
      background: var(--surface-primary);
      box-shadow: 0 0 0 3px oklch(59% 0.24 264 / 0.12);
    }

    .dp-trigger--error {
      border-color: var(--system-red) !important;
      box-shadow: none !important;
    }

    .dp-trigger--disabled {
      opacity: 0.4;
      cursor: not-allowed;
      pointer-events: none;
    }

    /* ── Trigger Icon ──────────────────────────────── */
    .dp-trigger-icon {
      display: flex;
      align-items: center;
      justify-content: center;
      padding-left: 14px;
      color: var(--text-tertiary);
      flex-shrink: 0;
      transition: color 0.15s ease;
    }

    .dp-trigger--open .dp-trigger-icon {
      color: var(--system-blue);
    }

    /* ── Trigger Content ───────────────────────────── */
    .dp-trigger-content {
      flex: 1;
      min-width: 0;
      position: relative;
      padding: 0 12px;
      height: 100%;
      display: flex;
      flex-direction: column;
      justify-content: center;
    }

    .dp-trigger-label {
      font-size: 16px;
      color: var(--text-tertiary);
      transition: all 0.2s ease;
      transform-origin: left center;
      line-height: 1;
    }

    .dp-trigger-label--float {
      font-size: 11px;
      font-weight: 500;
      letter-spacing: 0.02em;
      transform: translateY(-8px);
    }

    .dp-trigger-label--accent {
      color: var(--system-blue);
    }

    .dp-trigger-value {
      font-size: 15px;
      font-weight: 500;
      color: var(--text-primary);
      line-height: 1;
      transform: translateY(2px);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    /* ── Trailing ──────────────────────────────────── */
    .dp-trigger-trailing {
      display: flex;
      align-items: center;
      gap: 6px;
      padding-right: 12px;
      flex-shrink: 0;
    }

    .dp-clear-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 20px;
      height: 20px;
      border-radius: 50%;
      background: var(--fill-secondary);
      border: none;
      color: var(--text-tertiary);
      cursor: pointer;
      transition: all 0.15s ease;

      &:hover {
        background: var(--fill-tertiary);
        color: var(--text-secondary);
      }

      &:active {
        transform: scale(0.9);
      }
    }

    .dp-trigger-chevron {
      color: var(--text-tertiary);
      transition: transform 0.25s cubic-bezier(0.4, 0, 0.2, 1);
      display: flex;
    }

    .dp-trigger-chevron--open {
      transform: rotate(180deg);
    }

    /* ── Hint ──────────────────────────────────────── */
    .dp-hint {
      padding: 6px 4px 0;
    }

    .dp-hint-text {
      font-size: 12px;
      color: var(--text-tertiary);
      margin: 0;
    }

    .dp-hint-text--error {
      color: var(--system-red);
    }
  `,
})
export class DatePickerComponent implements OnDestroy {
  // Inputs
  readonly label = input('Date');
  readonly value = model<Date | null>(null);
  readonly rangeValue = model<DateRange>({ start: null, end: null });
  readonly mode = input<DatePickerMode>('single');
  readonly placeholder = input<string | null>(null);
  readonly error = input<string | null>(null);
  readonly hint = input<string | null>(null);
  readonly disabled = input(false);
  readonly clearable = input(true);
  readonly format = input<'short' | 'medium' | 'long'>('medium');
  readonly minDate = input<Date | null>(null);
  readonly maxDate = input<Date | null>(null);
  readonly disabledDates = input<Date[]>([]);
  readonly disabledDaysOfWeek = input<number[]>([]);
  readonly firstDayOfWeek = input<0 | 1>(0);
  readonly locale = input('en-US');

  // Outputs
  readonly dateChange = output<Date | null>();
  readonly rangeChange = output<DateRange>();

  // State
  protected readonly isOpen = signal(false);

  private readonly overlay = inject(Overlay);
  private readonly elementRef = inject(ElementRef);
  private overlayRef: OverlayRef | null = null;

  // ── Display ─────────────────────────────────────────────

  protected readonly displayValue = computed(() => {
    if (this.mode() === 'range') {
      const range = this.rangeValue();
      if (range.start && range.end) {
        const fmt = this.dateFormatOptions();
        const locale = this.locale();
        const s = new Intl.DateTimeFormat(locale, fmt).format(range.start);
        const e = new Intl.DateTimeFormat(locale, fmt).format(range.end);
        return `${s} → ${e}`;
      }
      if (range.start) {
        return new Intl.DateTimeFormat(this.locale(), this.dateFormatOptions()).format(range.start) + ' → …';
      }
      return '';
    }

    const val = this.value();
    if (!val) return '';
    return new Intl.DateTimeFormat(this.locale(), this.dateFormatOptions()).format(val);
  });

  private dateFormatOptions(): Intl.DateTimeFormatOptions {
    switch (this.format()) {
      case 'short': return { month: 'short', day: 'numeric' };
      case 'long': return { weekday: 'short', month: 'long', day: 'numeric', year: 'numeric' };
      default: return { month: 'short', day: 'numeric', year: 'numeric' };
    }
  }

  // ── Open / Close ────────────────────────────────────────

  toggle(): void {
    if (this.disabled()) return;
    if (this.isOpen()) {
      this.close();
    } else {
      this.open();
    }
  }

  open(): void {
    if (this.overlayRef?.hasAttached()) return;

    const positions: ConnectedPosition[] = [
      { originX: 'start', originY: 'bottom', overlayX: 'start', overlayY: 'top', offsetY: 4 },
      { originX: 'start', originY: 'top', overlayX: 'start', overlayY: 'bottom', offsetY: -4 },
      { originX: 'end', originY: 'bottom', overlayX: 'end', overlayY: 'top', offsetY: 4 },
    ];

    const positionStrategy = this.overlay
      .position()
      .flexibleConnectedTo(this.elementRef)
      .withPositions(positions)
      .withPush(true);

    this.overlayRef = this.overlay.create({
      positionStrategy,
      scrollStrategy: this.overlay.scrollStrategies.reposition(),
      hasBackdrop: true,
      backdropClass: 'cdk-overlay-transparent-backdrop',
    });

    this.overlayRef.backdropClick().subscribe(() => this.close());
    this.overlayRef.keydownEvents().subscribe((event) => {
      if (event.key === 'Escape') this.close();
    });

    const portal = new ComponentPortal(CalendarPanelComponent);
    const ref = this.overlayRef.attach(portal);
    const panel = ref.instance;

    // Configure panel
    panel.mode.set(this.mode());
    panel.minDate.set(this.minDate());
    panel.maxDate.set(this.maxDate());
    panel.disabledDates.set(this.disabledDates());
    panel.disabledDaysOfWeek.set(this.disabledDaysOfWeek());
    panel.firstDayOfWeek.set(this.firstDayOfWeek());
    panel.locale.set(this.locale());

    // Navigate to relevant date
    if (this.mode() === 'single' && this.value()) {
      panel.selectedDate.set(this.value());
      panel.navigateTo(this.value()!);
    } else if (this.mode() === 'range') {
      const r = this.rangeValue();
      if (r.start) {
        panel.rangeStart.set(r.start);
        panel.navigateTo(r.start);
      }
      if (r.end) panel.rangeEnd.set(r.end);
    }

    // Listen for selection
    panel.dateSelected.subscribe((date: Date) => {
      if (this.mode() === 'single') {
        this.value.set(date);
        this.dateChange.emit(date);
        this.close();
      }
    });

    panel.rangeSelected.subscribe((range: DateRange) => {
      this.rangeValue.set(range);
      this.rangeChange.emit(range);
      this.close();
    });

    panel.escapePressed.subscribe(() => this.close());

    this.isOpen.set(true);
  }

  close(): void {
    this.overlayRef?.detach();
    this.overlayRef?.dispose();
    this.overlayRef = null;
    this.isOpen.set(false);
  }

  protected onClear(event: Event): void {
    event.stopPropagation();
    if (this.mode() === 'single') {
      this.value.set(null);
      this.dateChange.emit(null);
    } else {
      this.rangeValue.set({ start: null, end: null });
      this.rangeChange.emit({ start: null, end: null });
    }
  }

  ngOnDestroy(): void {
    this.close();
  }
}
