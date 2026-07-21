import {
  Component,
  input,
  output,
  signal,
  computed,
  model,
  inject,
  ElementRef,
  afterNextRender,
  DestroyRef,
  OnDestroy,
} from '@angular/core';
import { LucideDynamicIcon } from '@lucide/angular';
import { TooltipDirective } from '../tooltip/tooltip';

// ─── Types ───────────────────────────────────────────────────────────

export interface SidenavItem {
  id: string;
  label: string;
  icon?: string;
  active?: boolean;
  disabled?: boolean;
  badge?: string | number;
  indent?: number;
  /** Nested children for multi-level trees */
  children?: SidenavItem[];
}

// ─── SidenavItemComponent ────────────────────────────────────────────

@Component({
  selector: 'app-sidenav-item',
  imports: [LucideDynamicIcon, TooltipDirective],
  host: {
    class: 'block',
    role: 'listitem',
  },
  template: `
    <button
      type="button"
      class="sidenav-item"
      [class.sidenav-item--active]="active()"
      [class.sidenav-item--disabled]="disabled()"
      [class.sidenav-item--collapsed]="collapsed()"
      [class.sidenav-item--has-children]="expandable()"
      [style.padding-left]="indentPx()"
      [disabled]="disabled()"
      [attr.aria-expanded]="expandable() ? expanded() : null"
      [appTooltip]="collapsed() ? label() : ''"
      tooltipPosition="right"
      [tooltipDelay]="300"
      (click)="handleClick()"
    >
      <!-- Active indicator bar -->
      @if (active()) {
        <span class="sidenav-item__indicator" aria-hidden="true"></span>
      }

      <!-- Tree branch connector (L-shape) for nested items -->
      @if (indent() > 0 && !collapsed()) {
        <span class="sidenav-item__branch" aria-hidden="true"></span>
      }

      @if (icon()) {
        <span class="sidenav-item__icon">
          <svg [lucideIcon]="icon()!" [size]="20" />
        </span>
      }

      <!-- Dot placeholder when no icon at deeper nesting -->
      @if (!icon() && indent() > 0 && !collapsed()) {
        <span class="sidenav-item__dot" aria-hidden="true"></span>
      }

      <span class="sidenav-item__label" [class.sidenav-item__label--hidden]="collapsed()">
        {{ label() }}
      </span>

      @if (badge() !== undefined && badge() !== null && !collapsed()) {
        <span class="sidenav-item__badge">
          {{ badge() }}
        </span>
      }

      @if (badge() !== undefined && badge() !== null && collapsed()) {
        <span class="sidenav-item__badge-dot" aria-hidden="true"></span>
      }

      <!-- Expand/collapse chevron for items with children -->
      @if (expandable() && !collapsed()) {
        <svg
          lucideIcon="chevron-right"
          [size]="14"
          class="sidenav-item__chevron"
          [class.sidenav-item__chevron--open]="expanded()"
          aria-hidden="true"
        />
      }
    </button>
  `,
  styles: `

    .sidenav-item {
      position: relative;
      display: flex;
      align-items: center;
      gap: 10px;
      width: 100%;
      padding: 9px 16px;
      border: none;
      background: none;
      cursor: pointer;
      border-radius: var(--radius-md);
      transition:
        background-color var(--duration-fast) var(--ease-default),
        padding var(--duration-normal) var(--ease-default);
      color: var(--text-secondary);
      text-align: left;
      outline: none;
    }

    .sidenav-item:hover:not(.sidenav-item--disabled) {
      background-color: var(--fill-primary);
      color: var(--text-primary);
    }

    .sidenav-item:active:not(.sidenav-item--disabled) {
      background-color: var(--fill-secondary);
      transform: scale(0.98);
    }

    .sidenav-item:focus-visible {
      outline: 2px solid var(--focus-ring);
      outline-offset: -2px;
    }

    .sidenav-item--active {
      background-color: var(--interactive-tint);
      color: var(--color-primary);
    }

    .sidenav-item--active:hover {
      background-color: var(--interactive-tint-hover);
      color: var(--color-primary);
    }

    .sidenav-item--disabled {
      opacity: 0.4;
      cursor: not-allowed;
      pointer-events: none;
    }

    .sidenav-item--collapsed {
      justify-content: center;
      padding: 10px;
      gap: 0;
    }

    .sidenav-item__indicator {
      position: absolute;
      left: 0;
      top: 50%;
      transform: translateY(-50%);
      width: 3px;
      height: 20px;
      border-radius: 0 3px 3px 0;
      background: var(--color-primary);
      animation: indicator-in 0.3s var(--ease-spring);
    }

    @keyframes indicator-in {
      from {
        opacity: 0;
        height: 0;
      }
      to {
        opacity: 1;
        height: 20px;
      }
    }

    /* ── Branch connector: horizontal-only L-turn ── */
    .sidenav-item__branch {
      display: inline-flex;
      flex-shrink: 0;
      width: 10px;
      height: 10px;
      /* Only the horizontal bottom portion — the subgroup draws the vertical rail */
      border-bottom: 1px solid var(--separator);
      border-bottom-left-radius: 2px;
      margin-left: -1px;
      align-self: center;
    }

    .sidenav-item__icon {
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      width: 24px;
      height: 24px;
      transition: color var(--duration-fast) var(--ease-default);
    }

    .sidenav-item--active .sidenav-item__icon {
      color: var(--color-primary);
    }

    /* ── Dot placeholder (when no icon at nested levels) ── */
    .sidenav-item__dot {
      flex-shrink: 0;
      width: 5px;
      height: 5px;
      border-radius: 50%;
      background: currentColor;
      opacity: 0.4;
      margin: 0 9.5px;
    }

    .sidenav-item--active .sidenav-item__dot {
      background: var(--color-primary);
      opacity: 1;
    }

    .sidenav-item__label {
      flex: 1;
      font: var(--type-subheadline);
      font-weight: 500;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      transition:
        opacity var(--duration-fast) var(--ease-default),
        max-width var(--duration-normal) var(--ease-default);
      max-width: 240px;
    }

    .sidenav-item__label--hidden {
      opacity: 0;
      max-width: 0;
      overflow: hidden;
    }

    .sidenav-item--active .sidenav-item__label {
      font-weight: 600;
      color: var(--color-primary);
    }

    .sidenav-item__badge {
      flex-shrink: 0;
      font: var(--type-caption-2);
      font-weight: 600;
      padding: 1px 7px;
      border-radius: var(--radius-full);
      background: var(--color-primary);
      color: var(--text-on-fill);
      min-width: 20px;
      text-align: center;
      animation: clear-btn-in 0.2s var(--ease-spring);
    }

    .sidenav-item__badge-dot {
      position: absolute;
      top: 8px;
      right: 8px;
      width: 7px;
      height: 7px;
      border-radius: 50%;
      background: var(--color-primary);
      animation: clear-btn-in 0.2s var(--ease-spring);
    }

    /* ── Expand chevron ── */
    .sidenav-item__chevron {
      flex-shrink: 0;
      color: var(--text-quaternary);
      transition: transform var(--duration-normal) var(--ease-default);
      margin-left: auto;
    }

    .sidenav-item__chevron--open {
      transform: rotate(90deg);
    }

    .sidenav-item--active .sidenav-item__chevron {
      color: var(--color-primary);
    }
  `,
})
export class SidenavItemComponent {
  readonly icon = input<string | null | undefined>(null);
  readonly label = input.required<string>();
  readonly active = input(false);
  readonly disabled = input(false);
  readonly badge = input<string | number | undefined>(undefined);
  readonly collapsed = input(false);
  readonly indent = input(0);
  /**
   * When true the item renders a chevron and emits `expandedChange`
   * so the parent can show/hide children in a `SidenavSubgroupComponent`.
   */
  readonly expandable = input(false);
  /** Two-way bound expanded state (use with SidenavSubgroupComponent). */
  readonly expanded = model(false);

  readonly itemClick = output<void>();

  protected readonly indentPx = computed(() => {
    const indent = this.indent();
    if (indent <= 0 || this.collapsed()) return undefined;
    // Each indent level adds 16px; the branch connector takes 12px of that
    return `${16 + indent * 16}px`;
  });

  protected handleClick(): void {
    if (this.expandable()) {
      this.expanded.update(v => !v);
    }
    this.itemClick.emit();
  }
}

/**
 * Wraps child `app-sidenav-item` elements in an animated collapsible panel.
 * Accepts an `indent` input (= the indent level of its direct children) to
 * draw the continuous vertical guide rail at the correct horizontal position.
 *
 * ```html
 * <app-sidenav-item label="Projects" icon="folder" expandable [(expanded)]="open" />
 * <app-sidenav-subgroup [expanded]="open()" [indent]="1">
 *   <app-sidenav-item label="Alpha" [indent]="1" />
 *   <app-sidenav-subgroup [expanded]="innerOpen()" [indent]="2">
 *     <app-sidenav-item label="Tasks" [indent]="2" />
 *   </app-sidenav-subgroup>
 * </app-sidenav-subgroup>
 * ```
 */
@Component({
  selector: 'app-sidenav-subgroup',
  host: {
    class: 'block',
    role: 'group',
  },
  template: `
    <div
      class="sidenav-subgroup"
      [class.sidenav-subgroup--open]="expanded()"
    >
      <div class="sidenav-subgroup__inner" role="list">
        <!-- Continuous vertical rail connecting siblings at this indent level -->
        <span
          class="sidenav-subgroup__rail"
          [style.left]="railLeft()"
          aria-hidden="true"
        ></span>
        <ng-content />
      </div>
    </div>
  `,
  styles: `
    .sidenav-subgroup {
      display: grid;
      grid-template-rows: 0fr;
      transition: grid-template-rows var(--duration-normal) var(--ease-default);
    }

    .sidenav-subgroup--open {
      grid-template-rows: 1fr;
    }

    .sidenav-subgroup__inner {
      position: relative;
      min-height: 0;
      overflow: hidden;
    }

    /* Continuous vertical line spanning the full height of all sibling items */
    .sidenav-subgroup__rail {
      position: absolute;
      top: 0;
      bottom: 0;
      width: 1px;
      background: var(--separator);
      pointer-events: none;
    }
  `,
})
export class SidenavSubgroupComponent {
  /** Controls the open/closed state of this subgroup. */
  readonly expanded = input(false);
  /**
   * The indent level of the direct children inside this subgroup.
   * Used to position the continuous vertical rail at the same x as
   * the children's branch connectors.
   * Rail left = 14 + indent * 16  (mirrors indentPx - branch margin)
   */
  readonly indent = input(1);

  protected readonly railLeft = computed(() => `${14 + this.indent() * 16}px`);
}

// ─── SidenavGroupComponent ───────────────────────────────────────────

@Component({
  selector: 'app-sidenav-group',
  imports: [LucideDynamicIcon],
  host: {
    class: 'block',
    role: 'group',
    '[attr.aria-label]': 'label()',
  },
  template: `
    @if (label() && !collapsed()) {
      <div class="sidenav-group__header">
        @if (collapsible()) {
          <button
            type="button"
            class="sidenav-group__toggle"
            [attr.aria-expanded]="!groupCollapsed()"
            (click)="groupCollapsed.set(!groupCollapsed())"
          >
            <span class="sidenav-group__label">{{ label() }}</span>
            <svg
              lucideIcon="chevron-down"
              [size]="12"
              class="sidenav-group__chevron"
              [class.sidenav-group__chevron--collapsed]="groupCollapsed()"
            />
          </button>
        } @else {
          <span class="sidenav-group__label">{{ label() }}</span>
        }
      </div>
    }

    @if (collapsed()) {
      <div class="sidenav-group__divider" aria-hidden="true"></div>
    }

    <div
      class="sidenav-group__content"
      [class.sidenav-group__content--collapsed]="collapsible() && groupCollapsed() && !collapsed()"
    >
      <div class="sidenav-group__content-inner" role="list">
        <ng-content />
      </div>
    </div>
  `,
  styles: `
    .sidenav-group__header {
      padding: 20px 16px 6px;
    }

    .sidenav-group__toggle {
      display: flex;
      align-items: center;
      gap: 4px;
      width: 100%;
      border: none;
      background: none;
      cursor: pointer;
      padding: 0;
      outline: none;
    }

    .sidenav-group__toggle:focus-visible {
      outline: 2px solid var(--focus-ring);
      outline-offset: 2px;
      border-radius: var(--radius-sm);
    }

    .sidenav-group__label {
      font: var(--type-caption-1);
      font-weight: 600;
      color: var(--text-tertiary);
      text-transform: uppercase;
      letter-spacing: 0.06em;
    }

    .sidenav-group__chevron {
      color: var(--text-quaternary);
      transition: transform var(--duration-normal) var(--ease-default);
      flex-shrink: 0;
    }

    .sidenav-group__chevron--collapsed {
      transform: rotate(-90deg);
    }

    .sidenav-group__divider {
      height: 1px;
      margin: 8px 16px;
      background: var(--separator);
    }

    .sidenav-group__content {
      display: grid;
      grid-template-rows: 1fr;
      transition: grid-template-rows var(--duration-normal) var(--ease-default);
    }

    .sidenav-group__content--collapsed {
      grid-template-rows: 0fr;
    }

    .sidenav-group__content-inner {
      min-height: 0;
      overflow: hidden;
    }
  `,
})
export class SidenavGroupComponent {
  readonly label = input<string | null>(null);
  readonly collapsible = input(false);
  readonly collapsed = input(false);

  protected readonly groupCollapsed = signal(false);
}

// ─── SidenavComponent (Container) ────────────────────────────────────

@Component({
  selector: 'app-sidenav',
  imports: [LucideDynamicIcon],
  host: {
    class: 'block',
  },
  template: `
    <!-- Mobile overlay scrim -->
    @if (mobileOpen()) {
      <div
        class="sidenav__scrim"
        [class.sidenav__scrim--visible]="mobileOpen()"
        (click)="closeMobile()"
        role="presentation"
      ></div>
    }

    <nav
      class="sidenav"
      [class]="containerClasses()"
      [style.width]="currentWidth()"
      [attr.aria-label]="ariaLabel()"
      role="navigation"
    >
      <!-- Header slot -->
      <div class="sidenav__header" [class.sidenav__header--collapsed]="isCollapsed()">
        <ng-content select="[sidenav-header]" />
      </div>

      <!-- Navigation items -->
      <div class="sidenav__body">
        <ng-content />
      </div>

      <!-- Footer slot -->
      <div class="sidenav__footer" [class.sidenav__footer--collapsed]="isCollapsed()">
        <ng-content select="[sidenav-footer]" />
      </div>

      <!-- Collapse toggle button -->
      @if (showCollapseButton()) {
        <button
          type="button"
          class="sidenav__collapse-btn"
          [attr.aria-label]="isCollapsed() ? 'Expand sidebar' : 'Collapse sidebar'"
          [attr.aria-expanded]="!isCollapsed()"
          (click)="toggleCollapse()"
        >
          <svg
            [lucideIcon]="collapseIcon()"
            [size]="16"
            class="sidenav__collapse-icon"
          />
        </button>
      }
    </nav>
  `,
  styles: `
    :host {
      position: relative;
      display: block;
    }

    /* ── Scrim ─────────────────────────────────────────── */
    .sidenav__scrim {
      position: fixed;
      inset: 0;
      background: var(--overlay-medium);
      backdrop-filter: blur(4px);
      z-index: 299;
      opacity: 0;
      animation: scrim-in 0.3s var(--ease-default) forwards;
    }

    @keyframes scrim-in {
      to { opacity: 1; }
    }

    .sidenav__scrim--visible {
      opacity: 1;
    }

    /* ── Container ─────────────────────────────────────── */
    .sidenav {
      display: flex;
      flex-direction: column;
      height: 100%;
      overflow: hidden;
      transition:
        width var(--duration-normal) var(--ease-default),
        box-shadow var(--duration-normal) var(--ease-default);
      z-index: 300;
    }

    /* ── Variants ──────────────────────────────────────── */
    .sidenav--glass {
      background: var(--glass-bg-thick);
      backdrop-filter: blur(20px) saturate(1.8);
      -webkit-backdrop-filter: blur(20px) saturate(1.8);
      border-right: 1px solid var(--glass-border);
    }

    .sidenav--solid {
      background: var(--surface-primary);
      border-right: 1px solid var(--border-default);
    }

    .sidenav--floating {
      background: var(--surface-elevated);
      border-radius: var(--radius-xl);
      box-shadow: var(--shadow-lg);
      border: 1px solid var(--border-default);
      margin: 12px;
      height: calc(100% - 24px);
    }

    /* ── Position ──────────────────────────────────────── */
    .sidenav--right {
      border-right: none;
      border-left: 1px solid var(--glass-border);
    }

    .sidenav--right.sidenav--solid {
      border-left: 1px solid var(--border-default);
    }

    .sidenav--right.sidenav--floating {
      border-left: none;
    }

    .sidenav--right .sidenav__collapse-icon {
      transform: rotate(180deg);
    }

    .sidenav--right.sidenav--is-collapsed .sidenav__collapse-icon {
      transform: rotate(0deg);
    }

    /* ── Mobile ────────────────────────────────────────── */
    .sidenav--mobile {
      position: fixed;
      top: 0;
      left: 0;
      bottom: 0;
      border-radius: 0;
      margin: 0;
      animation: sidenav-slide-in 0.35s var(--ease-default);
      box-shadow: var(--shadow-xl);
    }

    .sidenav--mobile.sidenav--right {
      left: auto;
      right: 0;
      animation: sidenav-slide-in-right 0.35s var(--ease-default);
    }

    .sidenav--mobile.sidenav--floating {
      border-radius: 0;
      margin: 0;
      height: 100%;
    }

    @keyframes sidenav-slide-in {
      from { transform: translateX(-100%); }
      to { transform: translateX(0); }
    }

    @keyframes sidenav-slide-in-right {
      from { transform: translateX(100%); }
      to { transform: translateX(0); }
    }

    /* ── Sections ──────────────────────────────────────── */
    .sidenav__header {
      padding: 16px 16px 8px;
      transition: padding var(--duration-normal) var(--ease-default);
      flex-shrink: 0;
    }

    .sidenav__header--collapsed {
      padding: 16px 8px 8px;
    }

    .sidenav__body {
      flex: 1;
      overflow-y: auto;
      overflow-x: hidden;
      padding: 4px 12px;
      scrollbar-width: thin;
      scrollbar-color: transparent transparent;
      transition: padding var(--duration-normal) var(--ease-default);
    }

    .sidenav--is-collapsed .sidenav__body {
      padding: 4px 8px;
    }

    .sidenav__body:hover {
      scrollbar-color: var(--text-quaternary) transparent;
    }

    .sidenav__footer {
      padding: 8px 16px 16px;
      border-top: 1px solid var(--separator);
      flex-shrink: 0;
      transition: padding var(--duration-normal) var(--ease-default);
    }

    .sidenav__footer--collapsed {
      padding: 8px 8px 16px;
    }

    .sidenav__footer:empty {
      display: none;
    }

    /* ── Collapse Button ──────────────────────────────── */
    .sidenav__collapse-btn {
      position: absolute;
      bottom: 16px;
      right: -14px;
      width: 28px;
      height: 28px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: var(--radius-full);
      background: var(--surface-elevated);
      border: 1px solid var(--border-default);
      box-shadow: var(--shadow-sm);
      cursor: pointer;
      color: var(--text-secondary);
      transition:
        background-color var(--duration-fast) var(--ease-default),
        color var(--duration-fast) var(--ease-default),
        transform var(--duration-fast) var(--ease-default);
      z-index: 10;
      outline: none;
    }

    .sidenav--right .sidenav__collapse-btn {
      right: auto;
      left: -14px;
    }

    .sidenav__collapse-btn:hover {
      background: var(--color-primary);
      border-color: var(--color-primary);
      color: var(--text-on-fill);
      transform: scale(1.1);
    }

    .sidenav__collapse-btn:focus-visible {
      outline: 2px solid var(--focus-ring);
      outline-offset: 2px;
    }

    .sidenav__collapse-btn:active {
      transform: scale(0.95);
    }

    .sidenav__collapse-icon {
      transition: transform var(--duration-normal) var(--ease-default);
    }

    .sidenav--is-collapsed .sidenav__collapse-icon {
      transform: rotate(180deg);
    }
  `,
})
export class SidenavComponent implements OnDestroy {
  /** Two-way collapsed state */
  readonly collapsed = model(false);
  /** Side position */
  readonly position = input<'left' | 'right'>('left');
  /** Visual variant */
  readonly variant = input<'glass' | 'solid' | 'floating'>('glass');
  /** Expanded width */
  readonly width = input('280px');
  /** Collapsed width */
  readonly collapsedWidth = input('72px');
  /** Show collapse toggle */
  readonly showCollapseButton = input(true);
  /** Breakpoint for mobile overlay (px) */
  readonly mobileBreakpoint = input(768);
  /** Accessible label */
  readonly ariaLabel = input('Sidebar navigation');

  protected readonly isMobile = signal(false);
  protected readonly mobileOpen = signal(false);

  private resizeCleanup: (() => void) | null = null;

  protected readonly isCollapsed = computed(() => {
    if (this.isMobile()) return false;
    return this.collapsed();
  });

  protected readonly currentWidth = computed(() => {
    if (this.isMobile()) return this.width();
    return this.isCollapsed() ? this.collapsedWidth() : this.width();
  });

  protected readonly collapseIcon = computed(() => {
    if (this.position() === 'right') {
      return this.isCollapsed() ? 'chevron-left' : 'chevron-right';
    }
    return this.isCollapsed() ? 'chevron-right' : 'chevron-left';
  });

  protected readonly containerClasses = computed(() => {
    const classes: string[] = ['sidenav'];
    classes.push(`sidenav--${this.variant()}`);

    if (this.position() === 'right') {
      classes.push('sidenav--right');
    }

    if (this.isCollapsed()) {
      classes.push('sidenav--is-collapsed');
    }

    if (this.isMobile() && this.mobileOpen()) {
      classes.push('sidenav--mobile');
    }

    return classes.join(' ');
  });

  constructor() {
    const breakpoint = this.mobileBreakpoint();
    if (typeof window !== 'undefined') {
      this.isMobile.set(window.innerWidth < breakpoint);
    }

    const destroyRef = inject(DestroyRef);
    afterNextRender(() => {
      const checkMobile = () => {
        const mobile = window.innerWidth < breakpoint;
        if (this.isMobile() !== mobile) this.isMobile.set(mobile);
      };
      window.addEventListener('resize', checkMobile, { passive: true });
      this.resizeCleanup = () => window.removeEventListener('resize', checkMobile);
      destroyRef.onDestroy(this.resizeCleanup);
    });
  }

  ngOnDestroy(): void {
    this.resizeCleanup?.();
  }

  toggleCollapse(): void {
    if (this.isMobile()) {
      this.mobileOpen.update(v => !v);
    } else {
      this.collapsed.update(v => !v);
    }
  }

  /** Open mobile overlay */
  openMobile(): void {
    this.mobileOpen.set(true);
  }

  /** Close mobile overlay */
  closeMobile(): void {
    this.mobileOpen.set(false);
  }
}
