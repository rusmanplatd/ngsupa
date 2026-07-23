import { Component, inject, ElementRef, ViewChildren, QueryList } from '@angular/core';
import { LucideDynamicIcon } from '@lucide/angular';
import { CalendarService } from '../calendar.service';
import { CalendarView } from '../calendar.models';

interface ViewOption {
  value: CalendarView;
  label: string;
}

@Component({
  selector: 'app-calendar-header',
  imports: [LucideDynamicIcon],
  host: {
    class: 'flex items-center justify-between gap-3 px-4 py-3',
    role: 'toolbar',
    'aria-label': 'Calendar navigation',
  },
  template: `
    <!-- Left: Today + Prev/Next -->
    <div class="flex items-center gap-1.5">
      <!-- Today Button -->
      <button
        type="button"
        class="cal-header-btn cal-today-btn"
        aria-label="Go to today"
        (click)="calendar.navigateToday()"
      >
        Today
      </button>

      <!-- Prev -->
      <button
        type="button"
        class="cal-header-icon-btn"
        [attr.aria-label]="'Previous ' + calendar.view()"
        (click)="calendar.navigatePrev()"
      >
        <svg lucideIcon="chevron-left" [size]="16" aria-hidden="true"></svg>
      </button>

      <!-- Next -->
      <button
        type="button"
        class="cal-header-icon-btn"
        [attr.aria-label]="'Next ' + calendar.view()"
        (click)="calendar.navigateNext()"
      >
        <svg lucideIcon="chevron-right" [size]="16" aria-hidden="true"></svg>
      </button>
    </div>

    <!-- Center: Period title -->
    <h2 class="cal-period-title" aria-live="polite" aria-atomic="true">
      {{ calendar.periodTitle() }}
    </h2>

    <!-- Right: View switcher (segmented control / radiogroup) -->
    <div
      class="cal-view-switcher"
      role="radiogroup"
      aria-label="Calendar view"
      (keydown)="onSwitcherKeydown($event)"
    >
      @for (opt of viewOptions; track opt.value; let i = $index) {
        <button
          #viewBtn
          type="button"
          role="radio"
          [id]="'cal-view-btn-' + opt.value"
          [attr.aria-checked]="calendar.view() === opt.value"
          [attr.tabindex]="calendar.view() === opt.value ? 0 : -1"
          class="cal-view-btn"
          [class.cal-view-btn--active]="calendar.view() === opt.value"
          (click)="switchView(opt.value)"
        >
          {{ opt.label }}
        </button>
      }
    </div>
  `,
  styles: `
    :host {
      display: flex;
      background: var(--surface-primary);
      border-bottom: 1px solid var(--border-default);
      border-radius: var(--radius-xl) var(--radius-xl) 0 0;
    }

    .cal-period-title {
      flex: 1;
      text-align: center;
      font: var(--type-title-3);
      color: var(--text-primary);
      letter-spacing: var(--tracking-tight);
      margin: 0;
      animation: fade-in 0.2s var(--ease-default);
    }

    .cal-header-btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      padding: 6px 14px;
      border-radius: var(--radius-md);
      font: var(--type-footnote);
      font-weight: var(--font-weight-medium);
      color: var(--color-primary);
      background: transparent;
      border: 1.5px solid var(--border-default);
      cursor: pointer;
      transition: background var(--duration-fast) var(--ease-default),
                  border-color var(--duration-fast) var(--ease-default);
    }

    .cal-header-btn:hover {
      background: var(--interactive-tint);
      border-color: var(--color-primary);
    }

    .cal-header-btn:focus-visible {
      outline: 2px solid var(--color-primary);
      outline-offset: 2px;
    }

    .cal-header-icon-btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 30px;
      height: 30px;
      border-radius: var(--radius-md);
      color: var(--text-secondary);
      background: transparent;
      border: none;
      cursor: pointer;
      transition: background var(--duration-fast) var(--ease-default),
                  color var(--duration-fast) var(--ease-default);
    }

    .cal-header-icon-btn:hover {
      background: var(--fill-secondary);
      color: var(--text-primary);
    }

    .cal-header-icon-btn:focus-visible {
      outline: 2px solid var(--color-primary);
      outline-offset: 2px;
    }

    .cal-view-switcher {
      display: inline-flex;
      align-items: center;
      background: var(--fill-secondary);
      border-radius: var(--radius-md);
      padding: 2px;
      gap: 1px;
    }

    .cal-view-btn {
      padding: 5px 12px;
      border-radius: calc(var(--radius-md) - 2px);
      font: var(--type-footnote);
      font-weight: var(--font-weight-medium);
      color: var(--text-secondary);
      background: transparent;
      border: none;
      cursor: pointer;
      transition: background var(--duration-fast) var(--ease-default),
                  color var(--duration-fast) var(--ease-default),
                  box-shadow var(--duration-fast) var(--ease-default);
      white-space: nowrap;
    }

    .cal-view-btn:hover {
      color: var(--text-primary);
    }

    .cal-view-btn:focus-visible {
      outline: 2px solid var(--color-primary);
      outline-offset: 1px;
    }

    .cal-view-btn--active {
      background: var(--surface-elevated);
      color: var(--text-primary);
      box-shadow: var(--shadow-xs);
    }

    @media (max-width: 640px) {
      :host {
        flex-wrap: wrap;
        gap: 8px;
        padding: 10px 12px;
      }

      .cal-period-title {
        order: -1;
        flex: 100%;
        text-align: left;
        font-size: var(--text-lg);
      }
    }
  `,
})
export class CalendarHeaderComponent {
  protected readonly calendar = inject(CalendarService);

  readonly viewOptions: ViewOption[] = [
    { value: 'month', label: 'Month' },
    { value: 'week', label: 'Week' },
    { value: 'day', label: 'Day' },
    { value: 'schedule', label: 'Schedule' },
  ];

  @ViewChildren('viewBtn') private viewBtns!: QueryList<ElementRef<HTMLButtonElement>>;

  protected switchView(view: CalendarView): void {
    this.calendar.setView(view);
  }

  /** WAI-ARIA radiogroup keyboard pattern: ArrowLeft/Right moves between options */
  protected onSwitcherKeydown(event: KeyboardEvent): void {
    const currentIndex = this.viewOptions.findIndex((o) => o.value === this.calendar.view());
    let nextIndex = currentIndex;

    if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
      event.preventDefault();
      nextIndex = (currentIndex + 1) % this.viewOptions.length;
    } else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
      event.preventDefault();
      nextIndex = (currentIndex - 1 + this.viewOptions.length) % this.viewOptions.length;
    } else {
      return;
    }

    const nextView = this.viewOptions[nextIndex].value;
    this.calendar.setView(nextView);

    // Move focus to the newly selected button
    const btns = this.viewBtns.toArray();
    btns[nextIndex]?.nativeElement.focus();
  }
}
