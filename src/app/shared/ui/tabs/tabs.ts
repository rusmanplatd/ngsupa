import {
  Component,
  input,
  model,
  output,
  computed,
  signal,
  ElementRef,
  viewChildren,
  afterRenderEffect,
} from '@angular/core';
import { LucideDynamicIcon } from '@lucide/angular';

export interface TabItem {
  id: string;
  label: string;
  icon?: string;
  disabled?: boolean;
  badge?: number | string;
}

export type TabsVariant = 'underline' | 'filled' | 'pills';
export type TabsSize = 'sm' | 'md' | 'lg';
export type TabsOrientation = 'horizontal' | 'vertical';

@Component({
  selector: 'app-tabs',
  imports: [LucideDynamicIcon],
  host: {
    class: 'block',
  },
  template: `
    <div
      class="tabs"
      [class]="rootClasses()"
      role="tablist"
      [attr.aria-label]="ariaLabel()"
      [attr.aria-orientation]="orientation()"
    >
      <!-- Sliding indicator -->
      <span
        class="tabs__indicator"
        [style.left.px]="isHorizontal() ? indicatorLeft() : undefined"
        [style.width.px]="isHorizontal() ? indicatorWidth() : undefined"
        [style.top.px]="!isHorizontal() ? indicatorTop() : undefined"
        [style.height.px]="!isHorizontal() ? indicatorHeight() : undefined"
        aria-hidden="true"
      ></span>

      @for (tab of tabs(); track tab.id; let i = $index) {
        <button
          #tabBtn
          type="button"
          role="tab"
          [id]="'tabs-' + tab.id"
          [attr.aria-selected]="activeTab() === tab.id"
          [attr.aria-disabled]="tab.disabled || null"
          [attr.aria-controls]="'tabpanel-' + tab.id"
          [attr.tabindex]="activeTab() === tab.id ? 0 : -1"
          class="tabs__tab"
          [class]="tabClasses(tab)"
          (click)="selectTab(tab)"
          (keydown)="onKeydown($event, i)"
        >
          @if (tab.icon) {
            <svg [lucideIcon]="tab.icon" [size]="iconSize()" class="tabs__icon" />
          }
          <span class="tabs__label">{{ tab.label }}</span>
          @if (tab.badge !== undefined && tab.badge !== null) {
            <span
              class="tabs__badge"
              [class.tabs__badge--dot]="tab.badge === ''"
            >
              @if (tab.badge !== '') {
                {{ displayBadge(tab.badge) }}
              }
            </span>
          }
        </button>
      }
    </div>
  `,
  styles: `
    /* ═══════════════════════════════════════════════════════════
       Tabs Component — Apple HIG Design
       ═══════════════════════════════════════════════════════════ */

    /* ── Root Container ─────────────────────────────────────── */
    .tabs {
      position: relative;
      display: flex;
    }

    /* Horizontal scroll */
    .tabs--horizontal {
      flex-direction: row;
      overflow-x: auto;
      scrollbar-width: none;
      -webkit-overflow-scrolling: touch;
    }

    .tabs--horizontal::-webkit-scrollbar {
      display: none;
    }

    /* Vertical layout */
    .tabs--vertical {
      flex-direction: column;
      width: fit-content;
    }

    /* Full width stretching */
    .tabs--full-width .tabs__tab {
      flex: 1;
      justify-content: center;
    }

    .tabs--vertical.tabs--full-width {
      width: 100%;
    }

    .tabs--vertical.tabs--full-width .tabs__tab {
      justify-content: flex-start;
    }

    /* ─────────────────────────────────────────────────────────
       VARIANT: Underline
       ───────────────────────────────────────────────────────── */

    /* Horizontal underline */
    .tabs--underline.tabs--horizontal {
      border-bottom: 1px solid var(--separator);
      gap: 0;
    }

    .tabs--underline.tabs--horizontal .tabs__indicator {
      position: absolute;
      bottom: -0.5px;
      height: 2.5px;
      background: var(--color-system-blue);
      border-radius: 2px 2px 0 0;
      transition: left 0.3s var(--ease-default),
                  width 0.3s var(--ease-default);
      will-change: left, width;
    }

    /* Vertical underline → side line on the left */
    .tabs--underline.tabs--vertical {
      border-left: 1px solid var(--separator);
      gap: 0;
    }

    .tabs--underline.tabs--vertical .tabs__indicator {
      position: absolute;
      left: -0.5px;
      width: 2.5px;
      background: var(--color-system-blue);
      border-radius: 0 2px 2px 0;
      transition: top 0.3s var(--ease-default),
                  height 0.3s var(--ease-default);
      will-change: top, height;
    }

    /* ─────────────────────────────────────────────────────────
       VARIANT: Filled (segmented control style)
       ───────────────────────────────────────────────────────── */
    .tabs--filled {
      background: var(--fill-secondary);
      padding: 3px;
      gap: 2px;
    }

    .tabs--filled.tabs--horizontal {
      border-radius: var(--radius-lg);
    }

    .tabs--filled.tabs--vertical {
      border-radius: var(--radius-lg);
    }

    .tabs--filled .tabs__indicator {
      position: absolute;
      background: var(--surface-elevated);
      border-radius: var(--radius-md);
      box-shadow: var(--shadow-sm);
    }

    .tabs--filled.tabs--horizontal .tabs__indicator {
      top: 3px;
      bottom: 3px;
      transition: left 0.3s var(--ease-default),
                  width 0.3s var(--ease-default);
      will-change: left, width;
    }

    .tabs--filled.tabs--vertical .tabs__indicator {
      left: 3px;
      right: 3px;
      transition: top 0.3s var(--ease-default),
                  height 0.3s var(--ease-default);
      will-change: top, height;
    }

    /* ─────────────────────────────────────────────────────────
       VARIANT: Pills
       ───────────────────────────────────────────────────────── */
    .tabs--pills {
      gap: 6px;
    }

    .tabs--pills.tabs--vertical {
      gap: 4px;
    }

    .tabs--pills .tabs__indicator {
      position: absolute;
      background: var(--interactive-tint);
      border-radius: var(--radius-full);
    }

    .tabs--pills.tabs--horizontal .tabs__indicator {
      top: 0;
      bottom: 0;
      transition: left 0.3s var(--ease-default),
                  width 0.3s var(--ease-default);
      will-change: left, width;
    }

    .tabs--pills.tabs--vertical .tabs__indicator {
      left: 0;
      right: 0;
      transition: top 0.3s var(--ease-default),
                  height 0.3s var(--ease-default);
      will-change: top, height;
    }

    /* ─────────────────────────────────────────────────────────
       TAB BUTTON
       ───────────────────────────────────────────────────────── */
    .tabs__tab {
      position: relative;
      z-index: 1;
      display: inline-flex;
      align-items: center;
      gap: 6px;
      white-space: nowrap;
      border: none;
      background: none;
      cursor: pointer;
      color: var(--text-secondary);
      font-weight: 600;
      letter-spacing: 0.04em;
      text-transform: uppercase;
      transition: color 0.2s var(--ease-default);
      -webkit-tap-highlight-color: transparent;
      user-select: none;
    }

    .tabs__tab:hover:not(.tabs__tab--disabled) {
      color: var(--text-primary);
    }

    .tabs__tab:focus-visible {
      outline: 2px solid var(--focus-ring);
      outline-offset: -2px;
      border-radius: var(--radius-sm);
    }

    /* Active states per variant */
    .tabs__tab--active.tabs__tab--underline {
      color: var(--color-system-blue);
    }

    .tabs__tab--active.tabs__tab--filled {
      color: var(--text-primary);
    }

    .tabs__tab--active.tabs__tab--pills {
      color: var(--color-system-blue);
    }

    /* Disabled */
    .tabs__tab--disabled {
      opacity: 0.35;
      cursor: not-allowed;
    }

    /* ─────────────────────────────────────────────────────────
       SIZES
       ───────────────────────────────────────────────────────── */

    /* Small */
    .tabs__tab--sm {
      padding: 8px 12px;
      font-size: 11px;
    }

    .tabs--pills .tabs__tab--sm {
      padding: 6px 14px;
      border-radius: var(--radius-full);
    }

    .tabs--vertical .tabs__tab--sm {
      padding: 7px 16px;
      width: 100%;
      text-align: left;
    }

    /* Medium */
    .tabs__tab--md {
      padding: 10px 20px;
      font-size: 13px;
    }

    .tabs--pills .tabs__tab--md {
      padding: 8px 18px;
      border-radius: var(--radius-full);
    }

    .tabs--vertical .tabs__tab--md {
      padding: 9px 20px;
      width: 100%;
      text-align: left;
    }

    /* Large */
    .tabs__tab--lg {
      padding: 12px 24px;
      font-size: 14px;
    }

    .tabs--pills .tabs__tab--lg {
      padding: 10px 24px;
      border-radius: var(--radius-full);
    }

    .tabs--vertical .tabs__tab--lg {
      padding: 11px 24px;
      width: 100%;
      text-align: left;
    }

    /* ── Icon ───────────────────────────────────────────────── */
    .tabs__icon {
      flex-shrink: 0;
    }

    /* ── Label ──────────────────────────────────────────────── */
    .tabs__label {
      flex: 1;
    }

    /* ── Badge ──────────────────────────────────────────────── */
    .tabs__badge {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-width: 16px;
      height: 16px;
      padding: 0 4px;
      font-size: 10px;
      font-weight: 700;
      line-height: 16px;
      letter-spacing: 0;
      text-transform: none;
      color: #fff;
      background: var(--color-system-red);
      border-radius: var(--radius-full);
      animation: tabs-badge-in 0.4s var(--ease-spring) both;
    }

    .tabs__badge--dot {
      min-width: 7px;
      width: 7px;
      height: 7px;
      padding: 0;
    }

    /* ── Keyframes ──────────────────────────────────────────── */
    @keyframes tabs-badge-in {
      from { opacity: 0; transform: scale(0.3); }
      to   { opacity: 1; transform: scale(1); }
    }

    /* ── Reduced Motion ────────────────────────────────────── */
    @media (prefers-reduced-motion: reduce) {
      .tabs__indicator,
      .tabs__tab {
        transition-duration: 0.01ms !important;
      }
      .tabs__badge {
        animation: none !important;
      }
    }
  `,
})
export class TabsComponent {
  readonly tabs = input.required<TabItem[]>();
  readonly activeTab = model.required<string>();
  readonly tabChanged = output<TabItem>();
  readonly variant = input<TabsVariant>('underline');
  readonly size = input<TabsSize>('md');
  readonly orientation = input<TabsOrientation>('horizontal');
  readonly fullWidth = input(false);
  readonly ariaLabel = input('Tabs');

  private readonly tabBtns = viewChildren<ElementRef<HTMLButtonElement>>('tabBtn');

  // Horizontal indicator position
  protected readonly indicatorLeft = signal(0);
  protected readonly indicatorWidth = signal(0);
  // Vertical indicator position
  protected readonly indicatorTop = signal(0);
  protected readonly indicatorHeight = signal(0);

  protected readonly isHorizontal = computed(() => this.orientation() === 'horizontal');

  protected readonly rootClasses = computed(() => {
    const classes: string[] = [
      `tabs--${this.variant()}`,
      `tabs--${this.orientation()}`,
    ];
    if (this.fullWidth()) classes.push('tabs--full-width');
    return classes.join(' ');
  });

  protected readonly iconSize = computed(() => {
    const sizeMap: Record<TabsSize, number> = { sm: 14, md: 16, lg: 18 };
    return sizeMap[this.size()];
  });

  constructor() {
    afterRenderEffect(() => {
      const btns = this.tabBtns();
      const active = this.activeTab();
      const allTabs = this.tabs();
      const idx = allTabs.findIndex(t => t.id === active);
      if (idx >= 0 && btns[idx]) {
        const el = btns[idx].nativeElement;
        if (this.isHorizontal()) {
          this.indicatorLeft.set(el.offsetLeft);
          this.indicatorWidth.set(el.offsetWidth);
        } else {
          this.indicatorTop.set(el.offsetTop);
          this.indicatorHeight.set(el.offsetHeight);
        }
      }
    });
  }

  protected tabClasses(tab: TabItem): string {
    const classes: string[] = [`tabs__tab--${this.size()}`];
    if (this.activeTab() === tab.id) {
      classes.push('tabs__tab--active');
      classes.push(`tabs__tab--${this.variant()}`);
    }
    if (tab.disabled) classes.push('tabs__tab--disabled');
    return classes.join(' ');
  }

  protected selectTab(tab: TabItem): void {
    if (tab.disabled) return;
    this.activeTab.set(tab.id);
    this.tabChanged.emit(tab);
  }

  protected onKeydown(event: KeyboardEvent, currentIndex: number): void {
    const allTabs = this.tabs();
    const btns = this.tabBtns();
    const horiz = this.isHorizontal();
    let nextIndex: number | null = null;

    const forwardKey = horiz ? 'ArrowRight' : 'ArrowDown';
    const backKey = horiz ? 'ArrowLeft' : 'ArrowUp';

    switch (event.key) {
      case forwardKey:
        event.preventDefault();
        nextIndex = this.findNextEnabled(currentIndex, 1, allTabs);
        break;
      case backKey:
        event.preventDefault();
        nextIndex = this.findNextEnabled(currentIndex, -1, allTabs);
        break;
      case 'Home':
        event.preventDefault();
        nextIndex = this.findNextEnabled(-1, 1, allTabs);
        break;
      case 'End':
        event.preventDefault();
        nextIndex = this.findNextEnabled(allTabs.length, -1, allTabs);
        break;
      default:
        return;
    }

    if (nextIndex !== null && btns[nextIndex]) {
      this.selectTab(allTabs[nextIndex]);
      btns[nextIndex].nativeElement.focus();
    }
  }

  protected displayBadge(badge: number | string): string {
    if (typeof badge === 'number') {
      return badge > 99 ? '99+' : `${badge}`;
    }
    return `${badge}`;
  }

  private findNextEnabled(current: number, direction: 1 | -1, allTabs: TabItem[]): number | null {
    const len = allTabs.length;
    let idx = current + direction;
    let checked = 0;
    while (checked < len) {
      idx = ((idx % len) + len) % len;
      if (!allTabs[idx].disabled) return idx;
      idx += direction;
      checked++;
    }
    return null;
  }
}
