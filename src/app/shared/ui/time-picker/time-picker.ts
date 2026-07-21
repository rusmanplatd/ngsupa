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
  AfterViewInit,
  viewChild,
} from '@angular/core';
import { Overlay, OverlayRef, ConnectedPosition } from '@angular/cdk/overlay';
import { ComponentPortal } from '@angular/cdk/portal';
import { LucideDynamicIcon } from '@lucide/angular';

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

export interface TimeValue {
  hours: number;   // 0-23
  minutes: number; // 0-59
}

export interface TimeRange {
  start: TimeValue | null;
  end: TimeValue | null;
}

export type TimeFormat = '12h' | '24h';
export type TimePickerMode = 'single' | 'range';

// ─────────────────────────────────────────────────────────────
// Time Picker Panel (dropdown content — scroll-wheel style)
// ─────────────────────────────────────────────────────────────

@Component({
  selector: 'app-time-picker-panel',
  imports: [],
  host: {
    class: 'block',
    role: 'dialog',
    'aria-modal': 'true',
    'aria-label': 'Time picker',
    '(keydown.escape)': 'escapePressed.emit()',
  },
  template: `
    <div class="tp-panel" style="animation: tp-scale-in 0.25s var(--ease-default)">

      <!-- Header -->
      <div class="tp-header">
        @if (mode() === 'range') {
          <div class="tp-range-tabs">
            <button
              type="button"
              class="tp-range-tab"
              [class.tp-range-tab--active]="rangeStep() === 'start'"
              (click)="switchRangeStep('start')"
            >
              <span class="tp-range-tab-label">Start</span>
              @if (rangeStartTime()) {
                <span class="tp-range-tab-value">{{ formatTimeShort(rangeStartTime()!) }}</span>
              }
            </button>
            <span class="tp-range-arrow" aria-hidden="true">→</span>
            <button
              type="button"
              class="tp-range-tab"
              [class.tp-range-tab--active]="rangeStep() === 'end'"
              [class.tp-range-tab--disabled]="!rangeStartTime()"
              [disabled]="!rangeStartTime()"
              (click)="switchRangeStep('end')"
            >
              <span class="tp-range-tab-label">End</span>
              @if (rangeEndTime()) {
                <span class="tp-range-tab-value">{{ formatTimeShort(rangeEndTime()!) }}</span>
              }
            </button>
          </div>
        } @else {
          <span class="tp-header-title">Select Time</span>
        }
      </div>

      <!-- Drum Roller -->
      <div class="tp-roller-wrap">

        <!-- Hour Column -->
        <div class="tp-column" role="listbox" aria-label="Hours">
          <div
            class="tp-column-scroll"
            #hourScroll
            (scroll)="onHourScroll($event)"
          >
            <div class="tp-column-pad"></div>
            @for (h of hourOptions(); track h.value) {
              <button
                type="button"
                role="option"
                [attr.aria-selected]="h.value === selectedHour()"
                class="tp-cell"
                [class.tp-cell--active]="h.value === selectedHour()"
                [class.tp-cell--disabled]="h.disabled"
                [disabled]="h.disabled"
                [attr.data-value]="h.value"
                (click)="selectHour(h.value)"
              >
                {{ h.label }}
              </button>
            }
            <div class="tp-column-pad"></div>
          </div>
        </div>

        <!-- Separator -->
        <div class="tp-separator" aria-hidden="true">:</div>

        <!-- Minute Column -->
        <div class="tp-column" role="listbox" aria-label="Minutes">
          <div
            class="tp-column-scroll"
            #minuteScroll
            (scroll)="onMinuteScroll($event)"
          >
            <div class="tp-column-pad"></div>
            @for (m of minuteOptions(); track m.value) {
              <button
                type="button"
                role="option"
                [attr.aria-selected]="m.value === selectedMinute()"
                class="tp-cell"
                [class.tp-cell--active]="m.value === selectedMinute()"
                [class.tp-cell--disabled]="m.disabled"
                [disabled]="m.disabled"
                [attr.data-value]="m.value"
                (click)="selectMinute(m.value)"
              >
                {{ m.label }}
              </button>
            }
            <div class="tp-column-pad"></div>
          </div>
        </div>

        <!-- AM/PM Column (12h mode) -->
        @if (format() === '12h') {
          <div class="tp-column tp-column--period" role="listbox" aria-label="Period">
            <div class="tp-column-scroll">
              <div class="tp-column-pad"></div>
              <button
                type="button"
                role="option"
                [attr.aria-selected]="selectedPeriod() === 'AM'"
                class="tp-cell"
                [class.tp-cell--active]="selectedPeriod() === 'AM'"
                (click)="selectPeriod('AM')"
              >
                AM
              </button>
              <button
                type="button"
                role="option"
                [attr.aria-selected]="selectedPeriod() === 'PM'"
                class="tp-cell"
                [class.tp-cell--active]="selectedPeriod() === 'PM'"
                (click)="selectPeriod('PM')"
              >
                PM
              </button>
              <div class="tp-column-pad"></div>
            </div>
          </div>
        }

        <!-- Selection highlight band -->
        <div class="tp-highlight" aria-hidden="true"></div>
      </div>

      <!-- Footer -->
      <div class="tp-footer">
        <div class="tp-footer-left">
          <button
            type="button"
            class="tp-footer-btn tp-footer-btn--accent"
            (click)="goToNow()"
          >
            Now
          </button>
          @if (mode() === 'range' && (rangeStartTime() || rangeEndTime())) {
            <button
              type="button"
              class="tp-footer-btn tp-footer-btn--danger"
              (click)="clearRange()"
            >
              Clear
            </button>
          }
        </div>
        <button
          type="button"
          class="tp-footer-btn tp-footer-btn--confirm"
          (click)="confirm()"
        >
          {{ mode() === 'range' && rangeStep() === 'start' ? 'Next' : 'Done' }}
        </button>
      </div>
    </div>
  `,
  styles: `
    /* ── Animations ─────────────────────────────────── */
    @keyframes tp-scale-in {
      from { opacity: 0; transform: scale(0.96) translateY(-6px); }
      to   { opacity: 1; transform: scale(1) translateY(0); }
    }

    /* ── Panel ─────────────────────────────────────── */
    .tp-panel {
      width: 280px;
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
    .tp-header {
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 14px 16px 6px;
    }

    .tp-header-title {
      font-size: 15px;
      font-weight: 600;
      letter-spacing: -0.01em;
      color: var(--text-primary);
    }

    /* ── Range Tabs ─────────────────────────────────── */
    .tp-range-tabs {
      display: flex;
      align-items: center;
      gap: 8px;
      width: 100%;
    }

    .tp-range-tab {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 2px;
      padding: 6px 8px;
      border-radius: 10px;
      background: var(--fill-primary);
      border: 1.5px solid transparent;
      cursor: pointer;
      transition: all 0.2s ease;

      &:hover:not(:disabled) {
        background: var(--fill-secondary);
      }
    }

    .tp-range-tab--active {
      border-color: var(--timepicker-accent);
      background: oklch(59% 0.24 264 / 0.08);
    }

    .tp-range-tab--disabled {
      opacity: 0.35;
      cursor: not-allowed;
    }

    .tp-range-tab-label {
      font-size: 10px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      color: var(--text-tertiary);
    }

    .tp-range-tab--active .tp-range-tab-label {
      color: var(--timepicker-accent);
    }

    .tp-range-tab-value {
      font-size: 14px;
      font-weight: 600;
      color: var(--text-primary);
      font-variant-numeric: tabular-nums;
    }

    .tp-range-tab--active .tp-range-tab-value {
      color: var(--timepicker-accent);
    }

    .tp-range-arrow {
      font-size: 14px;
      color: var(--text-quaternary);
      flex-shrink: 0;
      font-weight: 500;
    }

    /* ── Roller Wrap ───────────────────────────────── */
    .tp-roller-wrap {
      position: relative;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 4px 12px;
      gap: 0;
    }

    /* ── Selection Highlight Band ──────────────────── */
    .tp-highlight {
      position: absolute;
      left: 12px;
      right: 12px;
      top: 50%;
      transform: translateY(-50%);
      height: 38px;
      border-radius: 10px;
      background: var(--fill-secondary);
      border: 1px solid var(--border-default);
      pointer-events: none;
      z-index: 0;
    }

    /* ── Column ────────────────────────────────────── */
    .tp-column {
      position: relative;
      z-index: 1;
      width: 64px;
      flex-shrink: 0;
    }

    .tp-column--period {
      width: 56px;
    }

    .tp-column-scroll {
      height: calc(38px * 5);
      overflow-y: auto;
      scroll-snap-type: y mandatory;
      scrollbar-width: none;
      -ms-overflow-style: none;
      position: relative;

      &::-webkit-scrollbar {
        display: none;
      }
    }

    .tp-column-pad {
      height: calc(38px * 2);
      flex-shrink: 0;
    }

    /* ── Separator ─────────────────────────────────── */
    .tp-separator {
      font-size: 22px;
      font-weight: 700;
      color: var(--text-primary);
      line-height: 1;
      position: relative;
      z-index: 1;
      padding: 0 2px;
      flex-shrink: 0;
    }

    /* ── Cell ──────────────────────────────────────── */
    .tp-cell {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 100%;
      height: 38px;
      font-size: 20px;
      font-weight: 400;
      color: var(--text-tertiary);
      background: none;
      border: none;
      cursor: pointer;
      scroll-snap-align: center;
      transition: all 0.15s ease;
      position: relative;
      z-index: 1;
      padding: 0;
      font-variant-numeric: tabular-nums;
      letter-spacing: -0.02em;

      &:hover:not(:disabled):not(.tp-cell--active) {
        color: var(--text-secondary);
      }
    }

    .tp-cell--active {
      color: var(--text-primary);
      font-weight: 600;
      font-size: 21px;
    }

    .tp-cell--disabled {
      opacity: 0.25;
      cursor: not-allowed;
    }

    /* ── Footer ────────────────────────────────────── */
    .tp-footer {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 8px 16px 12px;
      border-top: 1px solid var(--separator);
    }

    .tp-footer-left {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .tp-footer-btn {
      padding: 6px 14px;
      font-size: 14px;
      font-weight: 500;
      background: none;
      border: none;
      cursor: pointer;
      border-radius: 8px;
      transition: all 0.15s ease;

      &:hover { opacity: 0.7; }
      &:active { opacity: 0.5; transform: scale(0.97); }
    }

    .tp-footer-btn--accent {
      color: var(--timepicker-accent);
      font-weight: 600;
    }

    .tp-footer-btn--danger {
      color: var(--timepicker-error-color);
      font-weight: 500;
    }

    .tp-footer-btn--confirm {
      color: white;
      background: var(--timepicker-selected-bg);
      font-weight: 600;
      border-radius: 10px;
      padding: 7px 20px;
      box-shadow: 0 2px 8px oklch(59% 0.24 264 / 0.3);

      &:hover { opacity: 0.85; }
      &:active { opacity: 0.7; transform: scale(0.97); }
    }
  `,
})
export class TimePickerPanelComponent implements AfterViewInit {
  private readonly hourScrollEl = viewChild<ElementRef<HTMLElement>>('hourScroll');
  private readonly minuteScrollEl = viewChild<ElementRef<HTMLElement>>('minuteScroll');

  // Config
  readonly format = signal<TimeFormat>('12h');
  readonly mode = signal<TimePickerMode>('single');
  readonly minuteStep = signal(1);
  readonly minTime = signal<TimeValue | null>(null);
  readonly maxTime = signal<TimeValue | null>(null);

  // State
  readonly selectedHour = signal(12);
  readonly selectedMinute = signal(0);
  readonly selectedPeriod = signal<'AM' | 'PM'>('AM');

  // Range state
  readonly rangeStep = signal<'start' | 'end'>('start');
  readonly rangeStartTime = signal<TimeValue | null>(null);
  readonly rangeEndTime = signal<TimeValue | null>(null);

  // Outputs
  readonly timeSelected = output<TimeValue>();
  readonly rangeSelected = output<TimeRange>();
  readonly escapePressed = output<void>();

  private scrollTimeout: ReturnType<typeof setTimeout> | null = null;
  private minuteScrollTimeout: ReturnType<typeof setTimeout> | null = null;

  // ── Computed options ────────────────────────────────────────

  readonly hourOptions = computed(() => {
    const fmt = this.format();
    const min = this.minTime();
    const max = this.maxTime();
    const period = this.selectedPeriod();

    if (fmt === '12h') {
      return Array.from({ length: 12 }, (_, i) => {
        const displayVal = i === 0 ? 12 : i;
        const hour24 = this.to24Hour(displayVal, period);
        const disabled = this.isHourDisabled(hour24, min, max);
        return {
          value: displayVal,
          label: String(displayVal).padStart(2, '0'),
          disabled,
        };
      });
    }

    return Array.from({ length: 24 }, (_, i) => {
      const disabled = this.isHourDisabled(i, min, max);
      return {
        value: i,
        label: String(i).padStart(2, '0'),
        disabled,
      };
    });
  });

  readonly minuteOptions = computed(() => {
    const step = this.minuteStep();
    const min = this.minTime();
    const max = this.maxTime();
    const hour24 = this.getCurrentHour24();

    const options: { value: number; label: string; disabled: boolean }[] = [];
    for (let m = 0; m < 60; m += step) {
      const disabled = this.isMinuteDisabled(hour24, m, min, max);
      options.push({
        value: m,
        label: String(m).padStart(2, '0'),
        disabled,
      });
    }
    return options;
  });

  // ── Lifecycle ────────────────────────────────────────────────

  ngAfterViewInit(): void {
    setTimeout(() => this.scrollToSelected(), 0);
  }

  // ── Scroll handling ─────────────────────────────────────────

  protected onHourScroll(event: Event): void {
    if (this.scrollTimeout) clearTimeout(this.scrollTimeout);
    this.scrollTimeout = setTimeout(() => {
      const el = event.target as HTMLElement;
      const cellHeight = 38;
      const scrollTop = el.scrollTop;
      const index = Math.round(scrollTop / cellHeight);
      const options = this.hourOptions();
      if (index >= 0 && index < options.length && !options[index].disabled) {
        this.selectedHour.set(options[index].value);
      }
    }, 80);
  }

  protected onMinuteScroll(event: Event): void {
    if (this.minuteScrollTimeout) clearTimeout(this.minuteScrollTimeout);
    this.minuteScrollTimeout = setTimeout(() => {
      const el = event.target as HTMLElement;
      const cellHeight = 38;
      const scrollTop = el.scrollTop;
      const index = Math.round(scrollTop / cellHeight);
      const options = this.minuteOptions();
      if (index >= 0 && index < options.length && !options[index].disabled) {
        this.selectedMinute.set(options[index].value);
      }
    }, 80);
  }

  // ── Actions ─────────────────────────────────────────────────

  protected selectHour(value: number): void {
    this.selectedHour.set(value);
    this.scrollHourTo(value);
  }

  protected selectMinute(value: number): void {
    this.selectedMinute.set(value);
    this.scrollMinuteTo(value);
  }

  protected selectPeriod(period: 'AM' | 'PM'): void {
    this.selectedPeriod.set(period);
  }

  protected goToNow(): void {
    const now = new Date();
    let hours = now.getHours();
    const minutes = now.getMinutes();
    const step = this.minuteStep();
    const snappedMinutes = Math.round(minutes / step) * step;

    if (this.format() === '12h') {
      this.selectedPeriod.set(hours >= 12 ? 'PM' : 'AM');
      hours = hours % 12 || 12;
    }

    this.selectedHour.set(hours);
    this.selectedMinute.set(snappedMinutes >= 60 ? 0 : snappedMinutes);

    setTimeout(() => this.scrollToSelected(), 0);
  }

  protected confirm(): void {
    const hour24 = this.getCurrentHour24();
    const time: TimeValue = { hours: hour24, minutes: this.selectedMinute() };

    if (this.mode() === 'single') {
      this.timeSelected.emit(time);
      return;
    }

    // Range mode
    if (this.rangeStep() === 'start') {
      this.rangeStartTime.set(time);
      this.rangeStep.set('end');
      
      // Default end roller to start time + 1 hour
      let endH = time.hours + 1;
      let endM = time.minutes;
      if (endH > 23) {
        endH = 23;
        endM = time.minutes + this.minuteStep();
      }
      this.setTimeFromValue({ hours: endH, minutes: endM });
      
      setTimeout(() => {
        // Snap to valid options if the default is disabled
        const hOpts = this.hourOptions();
        let currentH = this.selectedHour();
        if (hOpts.find(o => o.value === currentH)?.disabled) {
          const validH = hOpts.find(o => !o.disabled);
          if (validH) this.selectedHour.set(validH.value);
        }

        const mOpts = this.minuteOptions();
        let currentM = this.selectedMinute();
        if (mOpts.find(o => o.value === currentM)?.disabled) {
          const validM = mOpts.find(o => !o.disabled);
          if (validM) this.selectedMinute.set(validM.value);
        }

        this.scrollToSelected();
      }, 0);
    } else {
      this.rangeEndTime.set(time);
      this.rangeSelected.emit({
        start: this.rangeStartTime(),
        end: time,
      });
    }
  }

  protected switchRangeStep(step: 'start' | 'end'): void {
    this.rangeStep.set(step);
    const time = step === 'start' ? this.rangeStartTime() : this.rangeEndTime();
    if (time) {
      this.setTimeFromValue(time);
      setTimeout(() => this.scrollToSelected(), 0);
    }
  }

  protected clearRange(): void {
    this.rangeStartTime.set(null);
    this.rangeEndTime.set(null);
    this.rangeStep.set('start');
  }

  protected formatTimeShort(time: TimeValue): string {
    const fmt = this.format();
    if (fmt === '24h') {
      return `${String(time.hours).padStart(2, '0')}:${String(time.minutes).padStart(2, '0')}`;
    }
    const period = time.hours >= 12 ? 'PM' : 'AM';
    const h12 = time.hours % 12 || 12;
    return `${h12}:${String(time.minutes).padStart(2, '0')} ${period}`;
  }

  // ── Helpers ─────────────────────────────────────────────────

  private getCurrentHour24(): number {
    if (this.format() === '24h') return this.selectedHour();
    return this.to24Hour(this.selectedHour(), this.selectedPeriod());
  }

  private to24Hour(hour12: number, period: 'AM' | 'PM'): number {
    if (period === 'AM') return hour12 === 12 ? 0 : hour12;
    return hour12 === 12 ? 12 : hour12 + 12;
  }

  private isHourDisabled(hour24: number, min: TimeValue | null, max: TimeValue | null): boolean {
    if (min && hour24 < min.hours) return true;
    if (max && hour24 > max.hours) return true;

    if (this.mode() === 'range') {
      if (this.rangeStep() === 'end') {
        const start = this.rangeStartTime();
        if (start) {
          if (hour24 < start.hours) return true;
          // If all minutes would be disabled, disable the hour
          if (hour24 === start.hours && start.minutes >= 60 - this.minuteStep()) return true;
        }
      } else if (this.rangeStep() === 'start') {
        const end = this.rangeEndTime();
        if (end) {
          if (hour24 > end.hours) return true;
          if (hour24 === end.hours && end.minutes <= 0) return true;
        }
      }
    }

    return false;
  }

  private isMinuteDisabled(hour24: number, minute: number, min: TimeValue | null, max: TimeValue | null): boolean {
    if (min && hour24 === min.hours && minute < min.minutes) return true;
    if (max && hour24 === max.hours && minute > max.minutes) return true;

    if (this.mode() === 'range') {
      if (this.rangeStep() === 'end') {
        const start = this.rangeStartTime();
        if (start && hour24 === start.hours && minute <= start.minutes) return true;
      } else if (this.rangeStep() === 'start') {
        const end = this.rangeEndTime();
        if (end && hour24 === end.hours && minute >= end.minutes) return true;
      }
    }

    return false;
  }

  private scrollToSelected(): void {
    this.scrollHourTo(this.selectedHour());
    this.scrollMinuteTo(this.selectedMinute());
  }

  private scrollHourTo(value: number): void {
    const scrollRef = this.hourScrollEl();
    if (!scrollRef) return;
    const options = this.hourOptions();
    const index = options.findIndex(o => o.value === value);
    if (index < 0) return;
    scrollRef.nativeElement.scrollTo({ top: index * 38, behavior: 'smooth' });
  }

  private scrollMinuteTo(value: number): void {
    const scrollRef = this.minuteScrollEl();
    if (!scrollRef) return;
    const options = this.minuteOptions();
    const index = options.findIndex(o => o.value === value);
    if (index < 0) return;
    scrollRef.nativeElement.scrollTo({ top: index * 38, behavior: 'smooth' });
  }

  // Set roller values from a TimeValue (internal helper)
  private setTimeFromValue(time: TimeValue): void {
    let hours = time.hours;
    if (this.format() === '12h') {
      this.selectedPeriod.set(hours >= 12 ? 'PM' : 'AM');
      hours = hours % 12 || 12;
    }
    this.selectedHour.set(hours);
    this.selectedMinute.set(time.minutes);
  }

  // Public API
  setTime(time: TimeValue): void {
    this.setTimeFromValue(time);
  }

  setRange(range: TimeRange): void {
    this.rangeStartTime.set(range.start);
    this.rangeEndTime.set(range.end);
    // Load the relevant step into the roller
    if (range.start && !range.end) {
      this.rangeStep.set('end');
      const endDefault: TimeValue = {
        hours: Math.min(range.start.hours + 1, 23),
        minutes: range.start.minutes,
      };
      this.setTimeFromValue(endDefault);
    } else if (range.start) {
      this.rangeStep.set('start');
      this.setTimeFromValue(range.start);
    }
  }
}

// ─────────────────────────────────────────────────────────────
// TimePicker Component (input + dropdown)
// ─────────────────────────────────────────────────────────────

@Component({
  selector: 'app-time-picker',
  imports: [LucideDynamicIcon],
  host: {
    class: 'block',
    '(keydown.escape)': 'close()',
  },
  template: `
    <!-- Trigger input -->
    <div
      class="tp-trigger"
      [class.tp-trigger--error]="error()"
      [class.tp-trigger--open]="isOpen()"
      [class.tp-trigger--disabled]="disabled()"
      [class.tp-trigger--filled]="!!displayValue()"
      (click)="toggle()"
      (keydown.enter)="toggle()"
      (keydown.space)="$event.preventDefault(); toggle()"
      [attr.tabindex]="disabled() ? -1 : 0"
      role="combobox"
      [attr.aria-expanded]="isOpen()"
      aria-haspopup="dialog"
      [attr.aria-label]="label()"
    >
      <div class="tp-trigger-icon">
        <svg lucideIcon="clock" [size]="18" />
      </div>
      <div class="tp-trigger-content">
        <span
          class="tp-trigger-label"
          [class.tp-trigger-label--float]="!!displayValue() || isOpen()"
          [class.tp-trigger-label--accent]="isOpen()"
        >
          {{ label() }}
        </span>
        @if (displayValue()) {
          <span class="tp-trigger-value">{{ displayValue() }}</span>
        }
      </div>
      <div class="tp-trigger-trailing">
        @if (displayValue() && clearable() && !disabled()) {
          <button
            type="button"
            tabindex="-1"
            class="tp-clear-btn"
            aria-label="Clear time"
            (click)="onClear($event)"
          >
            <svg lucideIcon="x" [size]="10" />
          </button>
        }
        <div class="tp-trigger-chevron" [class.tp-trigger-chevron--open]="isOpen()">
          <svg lucideIcon="chevron-down" [size]="14" />
        </div>
      </div>
    </div>

    <!-- Error / Hint -->
    @if (error() || hint()) {
      <div class="tp-hint">
        @if (error()) {
          <p role="alert" class="tp-hint-text tp-hint-text--error">{{ error() }}</p>
        } @else if (hint()) {
          <p class="tp-hint-text">{{ hint() }}</p>
        }
      </div>
    }
  `,
  styles: `
    /* ── Trigger ────────────────────────────────────── */
    .tp-trigger {
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

      &:hover:not(.tp-trigger--disabled) {
        border-color: var(--border-opaque);
      }

      &:focus-visible {
        border-color: var(--timepicker-accent);
        box-shadow: 0 0 0 3px oklch(59% 0.24 264 / 0.15);
      }
    }

    .tp-trigger--open {
      border-color: var(--timepicker-accent);
      background: var(--surface-primary);
      box-shadow: 0 0 0 3px oklch(59% 0.24 264 / 0.12);
    }

    .tp-trigger--error {
      border-color: var(--timepicker-error-border) !important;
      box-shadow: none !important;
    }

    .tp-trigger--disabled {
      opacity: 0.4;
      cursor: not-allowed;
      pointer-events: none;
    }

    /* ── Trigger Icon ──────────────────────────────── */
    .tp-trigger-icon {
      display: flex;
      align-items: center;
      justify-content: center;
      padding-left: 14px;
      color: var(--text-tertiary);
      flex-shrink: 0;
      transition: color 0.15s ease;
    }

    .tp-trigger--open .tp-trigger-icon {
      color: var(--timepicker-accent);
    }

    /* ── Trigger Content ───────────────────────────── */
    .tp-trigger-content {
      flex: 1;
      min-width: 0;
      position: relative;
      padding: 0 12px;
      height: 100%;
      display: flex;
      flex-direction: column;
      justify-content: center;
    }

    .tp-trigger-label {
      font-size: 16px;
      color: var(--text-tertiary);
      transition: all 0.2s ease;
      transform-origin: left center;
      line-height: 1;
    }

    .tp-trigger-label--float {
      font-size: 11px;
      font-weight: 500;
      letter-spacing: 0.02em;
      transform: translateY(-8px);
    }

    .tp-trigger-label--accent {
      color: var(--timepicker-accent);
    }

    .tp-trigger-value {
      font-size: 15px;
      font-weight: 500;
      color: var(--text-primary);
      line-height: 1;
      transform: translateY(2px);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      font-variant-numeric: tabular-nums;
      letter-spacing: 0.02em;
    }

    /* ── Trailing ──────────────────────────────────── */
    .tp-trigger-trailing {
      display: flex;
      align-items: center;
      gap: 6px;
      padding-right: 12px;
      flex-shrink: 0;
    }

    .tp-clear-btn {
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

    .tp-trigger-chevron {
      color: var(--text-tertiary);
      transition: transform 0.25s cubic-bezier(0.4, 0, 0.2, 1);
      display: flex;
    }

    .tp-trigger-chevron--open {
      transform: rotate(180deg);
    }

    /* ── Hint ──────────────────────────────────────── */
    .tp-hint {
      padding: 6px 4px 0;
    }

    .tp-hint-text {
      font-size: 12px;
      color: var(--text-tertiary);
      margin: 0;
    }

    .tp-hint-text--error {
      color: var(--timepicker-error-color);
    }
  `,
})
export class TimePickerComponent implements OnDestroy {
  // Inputs
  readonly label = input('Time');
  readonly value = model<TimeValue | null>(null);
  readonly rangeValue = model<TimeRange>({ start: null, end: null });
  readonly mode = input<TimePickerMode>('single');
  readonly format = input<TimeFormat>('12h');
  readonly minuteStep = input(1);
  readonly placeholder = input<string | null>(null);
  readonly error = input<string | null>(null);
  readonly hint = input<string | null>(null);
  readonly disabled = input(false);
  readonly clearable = input(true);
  readonly minTime = input<TimeValue | null>(null);
  readonly maxTime = input<TimeValue | null>(null);

  // Outputs
  readonly timeChange = output<TimeValue | null>();
  readonly rangeChange = output<TimeRange>();

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
        return `${this.formatTime(range.start)} → ${this.formatTime(range.end)}`;
      }
      if (range.start) {
        return `${this.formatTime(range.start)} → …`;
      }
      return '';
    }

    const val = this.value();
    if (!val) return '';
    return this.formatTime(val);
  });

  private formatTime(time: TimeValue): string {
    const fmt = this.format();
    if (fmt === '24h') {
      return `${String(time.hours).padStart(2, '0')}:${String(time.minutes).padStart(2, '0')}`;
    }

    const period = time.hours >= 12 ? 'PM' : 'AM';
    const h12 = time.hours % 12 || 12;
    return `${h12}:${String(time.minutes).padStart(2, '0')} ${period}`;
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

    const portal = new ComponentPortal(TimePickerPanelComponent);
    const ref = this.overlayRef.attach(portal);
    const panel = ref.instance;

    // Configure panel
    panel.format.set(this.format());
    panel.mode.set(this.mode());
    panel.minuteStep.set(this.minuteStep());
    panel.minTime.set(this.minTime());
    panel.maxTime.set(this.maxTime());

    if (this.mode() === 'single') {
      // Set current time
      const currentValue = this.value();
      if (currentValue) {
        panel.setTime(currentValue);
      } else {
        const now = new Date();
        panel.setTime({ hours: now.getHours(), minutes: now.getMinutes() });
      }

      // Listen for single selection
      panel.timeSelected.subscribe((time: TimeValue) => {
        this.value.set(time);
        this.timeChange.emit(time);
        this.close();
      });
    } else {
      // Range mode
      const currentRange = this.rangeValue();
      if (currentRange.start || currentRange.end) {
        panel.setRange(currentRange);
      } else {
        const now = new Date();
        panel.setTime({ hours: now.getHours(), minutes: now.getMinutes() });
      }

      // Listen for range selection
      panel.rangeSelected.subscribe((range: TimeRange) => {
        this.rangeValue.set(range);
        this.rangeChange.emit(range);
        this.close();
      });
    }

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
      this.timeChange.emit(null);
    } else {
      this.rangeValue.set({ start: null, end: null });
      this.rangeChange.emit({ start: null, end: null });
    }
  }

  ngOnDestroy(): void {
    this.close();
  }
}
