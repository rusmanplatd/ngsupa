import {
  Component,
  input,
  model,
  output,
  computed,
  signal,
  ElementRef,
  viewChildren,
  afterNextRender,
  DestroyRef,
  inject,
  Injector,
  OnInit,
  effect,
  untracked,
} from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { fromEvent, distinctUntilChanged, map, pairwise, filter, throttleTime } from 'rxjs';
import { LucideDynamicIcon } from '@lucide/angular';

export interface Tab {
  id: string;
  label: string;
  icon: string;
  route?: string;
  badge?: number | string;
  disabled?: boolean;
}

export type TabBarVariant = 'default' | 'floating' | 'minimal';

@Component({
  selector: 'app-tab-bar',
  imports: [LucideDynamicIcon],
  host: {
    class: 'block',
    '[class.tab-bar--hidden]': 'isHidden()',
  },
  template: `
    <nav
      class="tab-bar"
      [class]="variantClass()"
      role="tablist"
      [attr.aria-label]="ariaLabel()"
    >
      <!-- Sliding indicator (default & floating) -->
      @if (variant() !== 'minimal') {
        <span
          class="tab-bar__indicator"
          [style.left.px]="indicatorLeft()"
          [style.width.px]="indicatorWidth()"
          aria-hidden="true"
        ></span>
      }

      @for (tab of tabs(); track tab.id; let i = $index) {
        <button
          #tabBtn
          type="button"
          role="tab"
          [id]="'tab-' + tab.id"
          [attr.aria-selected]="activeTab() === tab.id"
          [attr.aria-disabled]="tab.disabled || null"
          [attr.tabindex]="activeTab() === tab.id ? 0 : -1"
          class="tab-bar__tab"
          [class.tab-bar__tab--active]="activeTab() === tab.id"
          [class.tab-bar__tab--disabled]="tab.disabled"
          (click)="selectTab(tab)"
          (keydown)="onKeydown($event, i)"
        >
          <span class="tab-bar__icon-wrap">
            <svg [lucideIcon]="tab.icon" [size]="variant() === 'minimal' ? 26 : 22" />
            @if (tab.badge !== undefined && tab.badge !== null) {
              <span
                class="tab-bar__badge"
                [class.tab-bar__badge--dot]="tab.badge === ''"
                [attr.aria-label]="badgeLabel(tab)"
              >
                @if (tab.badge !== '') {
                  {{ displayBadge(tab.badge) }}
                }
              </span>
            }
          </span>
          @if (variant() !== 'minimal') {
            <span class="tab-bar__label">{{ tab.label }}</span>
          }
        </button>
      }
    </nav>
  `,
  styles: `
    /* ── Host ───────────────────────────────────────────────── */
    :host {
      display: block;
      position: fixed;
      bottom: 0;
      left: 0;
      right: 0;
      z-index: 50;
      transition: transform 0.35s var(--ease-default);
      will-change: transform;
    }

    :host(.tab-bar--hidden) {
      transform: translateY(100%);
    }

    /* ── Nav Container ─────────────────────────────────────── */
    .tab-bar {
      position: relative;
      display: flex;
      align-items: flex-end;
      justify-content: space-around;
    }

    /* ── Variant: Default ──────────────────────────────────── */
    .tab-bar--default {
      background: var(--glass-bg-thick);
      backdrop-filter: blur(var(--blur-xl));
      -webkit-backdrop-filter: blur(var(--blur-xl));
      border-top: 0.5px solid var(--separator);
      padding-bottom: env(safe-area-inset-bottom, 0px);
    }

    /* ── Variant: Floating ─────────────────────────────────── */
    .tab-bar--floating {
      position: relative;
      margin: 0 auto 12px;
      margin-bottom: calc(12px + env(safe-area-inset-bottom, 0px));
      width: fit-content;
      min-width: 280px;
      max-width: calc(100% - 32px);
      background: var(--glass-bg);
      backdrop-filter: blur(var(--blur-xl));
      -webkit-backdrop-filter: blur(var(--blur-xl));
      border: 0.5px solid var(--glass-border);
      border-radius: var(--radius-2xl);
      padding: 4px 6px;
      box-shadow: var(--shadow-lg);
    }

    /* ── Variant: Minimal ──────────────────────────────────── */
    .tab-bar--minimal {
      background: var(--glass-bg-thick);
      backdrop-filter: blur(var(--blur-xl));
      -webkit-backdrop-filter: blur(var(--blur-xl));
      border-top: 0.5px solid var(--separator);
      padding-bottom: env(safe-area-inset-bottom, 0px);
      padding-top: 2px;
      padding-inline: 8px;
    }

    /* ── Sliding Indicator ─────────────────────────────────── */
    .tab-bar__indicator {
      position: absolute;
      bottom: calc(4px + env(safe-area-inset-bottom, 0px));
      height: calc(100% - 8px - env(safe-area-inset-bottom, 0px));
      border-radius: var(--radius-lg);
      background: var(--fill-secondary);
      transition: left 0.35s var(--ease-default),
                  width 0.35s var(--ease-default);
      will-change: left, width;
    }

    .tab-bar--floating .tab-bar__indicator {
      bottom: 4px;
      height: calc(100% - 8px);
      border-radius: var(--radius-xl);
      background: var(--fill-secondary);
    }

    /* ── Tab Button ─────────────────────────────────────────── */
    .tab-bar__tab {
      position: relative;
      z-index: 1;
      display: flex;
      flex: 1;
      flex-direction: column;
      align-items: center;
      gap: 1px;
      padding: 8px 2px 6px;
      border: none;
      background: none;
      cursor: pointer;
      color: var(--text-tertiary);
      transition: color 0.2s var(--ease-default);
      -webkit-tap-highlight-color: transparent;
      user-select: none;
    }

    .tab-bar--floating .tab-bar__tab {
      padding: 10px 16px 8px;
      min-width: 60px;
    }

    .tab-bar--minimal .tab-bar__tab {
      padding: 8px 2px 6px;
    }

    .tab-bar__tab:focus-visible {
      outline: 2px solid var(--focus-ring);
      outline-offset: -2px;
      border-radius: var(--radius-md);
    }

    /* Active */
    .tab-bar__tab--active {
      color: var(--tab-bar-active-color);
    }

    /* Tap bounce */
    .tab-bar__tab:active:not(.tab-bar__tab--disabled) {
      transform: scale(0.92);
      transition: transform 0.08s ease-out, color 0.2s var(--ease-default);
    }

    .tab-bar__tab:not(:active) {
      transition: transform 0.4s var(--ease-spring), color 0.2s var(--ease-default);
    }

    /* Disabled */
    .tab-bar__tab--disabled {
      opacity: 0.35;
      cursor: not-allowed;
    }

    /* ── Icon Wrap ──────────────────────────────────────────── */
    .tab-bar__icon-wrap {
      position: relative;
      display: flex;
      align-items: center;
      justify-content: center;
      width: 28px;
      height: 28px;
    }

    .tab-bar--minimal .tab-bar__icon-wrap {
      width: 36px;
      height: 36px;
    }

    /* Active icon glow for minimal variant */
    .tab-bar--minimal .tab-bar__tab--active .tab-bar__icon-wrap::after {
      content: '';
      position: absolute;
      inset: -4px;
      border-radius: var(--radius-lg);
      background: var(--interactive-tint);
      z-index: -1;
      animation: tab-glow-in 0.3s var(--ease-default) both;
    }

    /* ── Label ──────────────────────────────────────────────── */
    .tab-bar__label {
      font-size: 10px;
      font-weight: 500;
      line-height: 1;
      letter-spacing: 0.01em;
    }

    .tab-bar--floating .tab-bar__label {
      font-size: 11px;
      font-weight: 600;
    }

    /* ── Badge ──────────────────────────────────────────────── */
    .tab-bar__badge {
      position: absolute;
      top: -4px;
      right: -8px;
      min-width: 16px;
      height: 16px;
      padding: 0 4px;
      font-size: 10px;
      font-weight: 700;
      line-height: 16px;
      text-align: center;
      color: #fff;
      background: var(--color-error);
      border-radius: var(--radius-full);
      border: 2px solid var(--glass-bg-thick);
      box-sizing: content-box;
      animation: tab-badge-in 0.4s var(--ease-spring) both;
    }

    .tab-bar__badge--dot {
      top: -2px;
      right: -4px;
      min-width: 8px;
      width: 8px;
      height: 8px;
      padding: 0;
    }

    /* ── Keyframes ──────────────────────────────────────────── */
    @keyframes tab-badge-in {
      from { opacity: 0; transform: scale(0.3); }
      to   { opacity: 1; transform: scale(1); }
    }

    @keyframes tab-glow-in {
      from { opacity: 0; transform: scale(0.7); }
      to   { opacity: 1; transform: scale(1); }
    }

    /* ── Reduced Motion ────────────────────────────────────── */
    @media (prefers-reduced-motion: reduce) {
      .tab-bar__indicator,
      .tab-bar__tab,
      :host {
        transition-duration: 0.01ms !important;
      }
      .tab-bar__badge,
      .tab-bar--minimal .tab-bar__tab--active .tab-bar__icon-wrap::after {
        animation: none !important;
      }
    }
  `,
})
export class TabBarComponent implements OnInit {
  readonly tabs = input.required<Tab[]>();
  readonly activeTab = model.required<string>();
  readonly tabPressed = output<Tab>();
  readonly variant = input<TabBarVariant>('default');
  readonly hideOnScroll = input(false);
  readonly ariaLabel = input('Navigation');

  private readonly tabBtns = viewChildren<ElementRef<HTMLButtonElement>>('tabBtn');
  private readonly document = inject(DOCUMENT);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly indicatorLeft = signal(0);
  protected readonly indicatorWidth = signal(0);
  protected readonly isHidden = signal(false);
  private readonly injector = inject(Injector);

  protected readonly variantClass = computed(() => {
    return `tab-bar--${this.variant()}`;
  });

  constructor() {
    // Update indicator position when active tab changes.
    // effect() tracks signals; afterNextRender() defers DOM reads until after
    // paint; untracked() writes prevent a reactive feedback loop (NG0103).
    effect(() => {
      const active = this.activeTab();
      const allTabs = this.tabs();
      afterNextRender(() => {
        const btns = untracked(() => this.tabBtns());
        const idx = allTabs.findIndex(t => t.id === active);
        if (idx >= 0 && btns[idx]) {
          const el = btns[idx].nativeElement;
          const newLeft = el.offsetLeft;
          const newWidth = el.offsetWidth;
          untracked(() => {
            if (this.indicatorLeft() !== newLeft) this.indicatorLeft.set(newLeft);
            if (this.indicatorWidth() !== newWidth) this.indicatorWidth.set(newWidth);
          });
        }
      }, { injector: this.injector });
    });
  }

  ngOnInit(): void {
    if (this.hideOnScroll()) {
      this.setupScrollHide();
    }
  }

  protected selectTab(tab: Tab): void {
    if (tab.disabled) return;
    this.activeTab.set(tab.id);
    this.tabPressed.emit(tab);
  }

  protected onKeydown(event: KeyboardEvent, currentIndex: number): void {
    const allTabs = this.tabs();
    const btns = this.tabBtns();
    let nextIndex: number | null = null;

    switch (event.key) {
      case 'ArrowRight':
      case 'ArrowDown':
        event.preventDefault();
        nextIndex = this.findNextEnabledIndex(currentIndex, 1, allTabs);
        break;
      case 'ArrowLeft':
      case 'ArrowUp':
        event.preventDefault();
        nextIndex = this.findNextEnabledIndex(currentIndex, -1, allTabs);
        break;
      case 'Home':
        event.preventDefault();
        nextIndex = this.findNextEnabledIndex(-1, 1, allTabs);
        break;
      case 'End':
        event.preventDefault();
        nextIndex = this.findNextEnabledIndex(allTabs.length, -1, allTabs);
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

  protected badgeLabel(tab: Tab): string {
    if (tab.badge === '') return `${tab.label}: new notification`;
    if (typeof tab.badge === 'number') return `${tab.label}: ${tab.badge} notifications`;
    return `${tab.label}: ${tab.badge}`;
  }

  private findNextEnabledIndex(current: number, direction: 1 | -1, allTabs: Tab[]): number | null {
    const len = allTabs.length;
    let idx = current + direction;
    let checked = 0;
    while (checked < len) {
      idx = ((idx % len) + len) % len; // wrap around
      if (!allTabs[idx].disabled) return idx;
      idx += direction;
      checked++;
    }
    return null;
  }

  private setupScrollHide(): void {
    fromEvent(this.document, 'scroll', { passive: true })
      .pipe(
        throttleTime(100, undefined, { leading: false, trailing: true }),
        map(() => this.document.defaultView?.scrollY ?? 0),
        pairwise(),
        map(([prev, curr]) => curr > prev && curr > 60 ? 'down' : 'up'),
        distinctUntilChanged(),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(direction => {
        this.isHidden.set(direction === 'down');
      });
  }
}
