import {
  AfterViewInit,
  Component,
  DestroyRef,
  ElementRef,
  Service,
  computed,
  inject,
  output,
  signal,
} from '@angular/core';
import { Overlay, OverlayRef } from '@angular/cdk/overlay';
import { ComponentPortal } from '@angular/cdk/portal';
import { LucideDynamicIcon } from '@lucide/angular';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ContextMenuItem {
  /** Unique identifier. Use a descriptive slug-style string. */
  id: string;
  /** Display label. Ignored when `separator` is true. */
  label: string;
  /** Lucide icon name. */
  icon?: string;
  /** Keyboard shortcut hint displayed on the trailing edge. */
  shortcut?: string;
  /** Renders a destructive (red) style. */
  destructive?: boolean;
  /** Makes the item non-interactive. */
  disabled?: boolean;
  /**
   * When true, renders a horizontal divider instead of a menu item.
   * Set `label` to a non-empty string to show a group label above the divider.
   */
  separator?: boolean;
  /** Optional badge/count shown next to the label. */
  badge?: string | number;
  /** When set, hovering/focusing this item opens a nested submenu. */
  children?: ContextMenuItem[];
}

// ─── Service ──────────────────────────────────────────────────────────────────

@Service()
export class ContextMenuService {
  private readonly overlay = inject(Overlay);
  private overlayRef: OverlayRef | null = null;
  private triggerEl: Element | null = null;

  /**
   * Opens a context menu at the given screen coordinates.
   * @param items   Menu item descriptors.
   * @param origin  Screen-space `{x, y}` coordinates (e.g. from a MouseEvent).
   * @param trigger Optional element that triggered the menu; focus will be
   *                restored to it when the menu closes.
   * @returns A Promise that resolves with the selected item id, or `null` if
   *          the menu was dismissed without a selection.
   */
  open(
    items: ContextMenuItem[],
    origin: { x: number; y: number },
    trigger?: Element | null,
  ): Promise<string | null> {
    this.close();
    this.triggerEl = trigger ?? null;

    return new Promise<string | null>((resolve) => {
      // ── Viewport-aware positioning ────────────────────────────────────────
      // Estimate panel size and flip if it would overflow the viewport.
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const estimatedW = 280;
      const estimatedH = items.length * 36 + 16;

      const left = origin.x + estimatedW > vw ? origin.x - estimatedW : origin.x;
      const top  = origin.y + estimatedH > vh ? origin.y - estimatedH : origin.y;

      const positionStrategy = this.overlay
        .position()
        .global()
        .left(`${Math.max(0, left)}px`)
        .top(`${Math.max(0, top)}px`);

      this.overlayRef = this.overlay.create({
        positionStrategy,
        scrollStrategy: this.overlay.scrollStrategies.close(),
        hasBackdrop: true,
        backdropClass: 'cdk-overlay-transparent-backdrop',
      });

      // Dismiss on backdrop click
      this.overlayRef.backdropClick().subscribe(() => {
        this.close();
        resolve(null);
      });

      // Dismiss on Escape (handled in the panel via host binding, but also here
      // as a fallback in case focus is not inside the panel)
      this.overlayRef.keydownEvents().subscribe((event) => {
        if (event.key === 'Escape') {
          this.close();
          resolve(null);
        }
      });

      const portal = new ComponentPortal(ContextMenuPanelComponent);
      const ref = this.overlayRef.attach(portal);
      ref.instance.items.set(items);

      ref.instance.selected.subscribe((id: string | null) => {
        this.close();
        resolve(id);
      });
    });
  }

  close(): void {
    this.overlayRef?.detach();
    this.overlayRef?.dispose();
    this.overlayRef = null;

    // Restore focus to the element that triggered the menu
    if (this.triggerEl instanceof HTMLElement) {
      this.triggerEl.focus();
    }
    this.triggerEl = null;
  }
}

// ─── Panel Component ──────────────────────────────────────────────────────────

@Component({
  selector: 'app-context-menu-panel',
  imports: [LucideDynamicIcon],
  host: {
    class: 'block outline-none',
    role: 'menu',
    'aria-orientation': 'vertical',
    tabindex: '-1',
    '[attr.aria-activedescendant]': 'activeDescendantId()',
    // Keyboard events – preventDefault stops page scroll on arrow keys
    '(keydown)': 'onKeydown($event)',
  },
  template: `
    <div
      class="min-w-[200px] max-w-[280px] rounded-xl bg-[var(--glass-bg-thick)] backdrop-blur-xl border border-[var(--glass-border)] shadow-2xl overflow-hidden py-1"
      style="animation: ctx-menu-in 0.14s cubic-bezier(0.2, 0, 0, 1.1) both"
    >
      @for (item of items(); track item.id; let flatIdx = $index) {
        @if (item.separator) {
          <!-- Group separator, optionally with a label -->
          @if (item.label) {
            <div class="px-3 pt-2 pb-0.5">
              <span class="text-[10px] font-semibold uppercase tracking-widest text-[var(--text-quaternary)] select-none">
                {{ item.label }}
              </span>
            </div>
          } @else {
            <div class="my-1 h-px bg-[var(--separator)]" role="separator" aria-hidden="true"></div>
          }
        } @else {
          <button
            type="button"
            role="menuitem"
            [id]="itemId(item)"
            [disabled]="item.disabled || undefined"
            [attr.aria-disabled]="item.disabled ? 'true' : null"
            [attr.aria-haspopup]="item.children?.length ? 'menu' : null"
            [attr.aria-expanded]="openSubmenuId() === item.id ? 'true' : null"
            tabindex="-1"
            class="menu-item flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm outline-none transition-colors duration-[80ms]"
            [class]="menuItemClasses(item)"
            [class.menu-item--focused]="focusedItem()?.id === item.id"
            (click)="selectItem(item)"
            (mouseenter)="onMouseEnter(item)"
          >
            <!-- Icon -->
            @if (item.icon) {
              <svg [lucideIcon]="item.icon" [size]="15" class="shrink-0 opacity-70" />
            } @else {
              <!-- Reserve icon-width space so labels align when some items have icons -->
              <span class="shrink-0 w-[15px]"></span>
            }

            <!-- Label + badge -->
            <span class="flex-1 min-w-0 truncate">{{ item.label }}</span>
            @if (item.badge !== undefined) {
              <span class="shrink-0 min-w-[18px] h-[18px] rounded-full bg-[var(--color-system-blue)] text-white text-[10px] font-semibold flex items-center justify-center px-1">
                {{ item.badge }}
              </span>
            }

            <!-- Shortcut or submenu arrow -->
            @if (item.children?.length) {
              <svg lucideIcon="chevron-right" [size]="13" class="shrink-0 text-[var(--text-quaternary)]" />
            } @else if (item.shortcut) {
              <span class="shrink-0 text-[11px] text-[var(--text-quaternary)] font-mono ml-2 tabular-nums">
                {{ item.shortcut }}
              </span>
            }
          </button>
        }
      }
    </div>

    <!-- Submenu rendered inline using the same panel recursively -->
    @if (openSubmenuId() && activeSubmenuItems().length > 0) {
      <div class="submenu-positioner" [style.top.px]="submenuTop()">
        <app-context-menu-panel
          [style]="'position:relative'"
          (selected)="onSubmenuSelected($event)"
        />
      </div>
    }

    <style>
      @keyframes ctx-menu-in {
        from { opacity: 0; transform: scale(0.96) translateY(-4px); }
        to   { opacity: 1; transform: scale(1)    translateY(0); }
      }
      .menu-item {
        cursor: default;
        user-select: none;
      }
      .menu-item--focused,
      .menu-item:focus-visible {
        background: var(--fill-primary);
      }
      .menu-item--focused.menu-item--destructive,
      .menu-item--destructive:focus-visible {
        background: color-mix(in srgb, var(--color-system-red) 12%, transparent);
      }
      .submenu-positioner {
        position: absolute;
        left: calc(100% + 4px);
        min-width: 200px;
        z-index: 1;
      }
    </style>
  `,
})
export class ContextMenuPanelComponent implements AfterViewInit {
  // ── Injected ───────────────────────────────────────────────────────────────
  private readonly elRef = inject<ElementRef<HTMLElement>>(ElementRef);
  protected readonly destroyRef = inject(DestroyRef);

  // ── Public signals (set by the service or parent panel) ───────────────────
  readonly items = signal<ContextMenuItem[]>([]);
  readonly selected = output<string | null>();

  // ── Internal state ─────────────────────────────────────────────────────────
  private readonly focusedIndex = signal(-1);
  protected readonly openSubmenuId = signal<string | null>(null);
  protected readonly submenuTop = signal(0);

  /** Items that can receive focus (non-separator, non-disabled). */
  private readonly focusableItems = computed(() =>
    this.items().filter((i) => !i.separator && !i.disabled),
  );

  protected readonly focusedItem = computed(() =>
    this.focusableItems()[this.focusedIndex()] ?? null,
  );

  protected readonly activeSubmenuItems = computed(() => {
    const id = this.openSubmenuId();
    if (!id) return [];
    return this.items().find((i) => i.id === id)?.children ?? [];
  });

  protected readonly activeDescendantId = computed(() => {
    const item = this.focusedItem();
    return item ? this.itemId(item) : null;
  });

  // Type-ahead buffer
  private typeaheadBuffer = '';
  private typeaheadTimer: ReturnType<typeof setTimeout> | null = null;

  // ── Lifecycle ──────────────────────────────────────────────────────────────
  ngAfterViewInit(): void {
    // Auto-focus the panel host so keyboard events are captured immediately
    this.elRef.nativeElement.focus();
  }

  // ── Template helpers ───────────────────────────────────────────────────────
  protected itemId(item: ContextMenuItem): string {
    return `ctx-menu-item-${item.id}`;
  }

  protected menuItemClasses(item: ContextMenuItem): Record<string, boolean> {
    return {
      'opacity-40 cursor-not-allowed pointer-events-none': !!item.disabled,
      'text-[var(--color-system-red)] menu-item--destructive': !item.disabled && !!item.destructive,
      'text-[var(--text-primary)]': !item.disabled && !item.destructive,
    };
  }

  // ── Interactions ───────────────────────────────────────────────────────────
  protected selectItem(item: ContextMenuItem): void {
    if (item.disabled) return;
    if (item.children?.length) {
      // Submenus are toggled, not directly selected
      this.toggleSubmenu(item);
      return;
    }
    this.selected.emit(item.id);
  }

  protected onMouseEnter(item: ContextMenuItem): void {
    if (item.disabled) return;
    const idx = this.focusableItems().findIndex((i) => i.id === item.id);
    if (idx !== -1) {
      this.focusedIndex.set(idx);
      this.scrollItemIntoView(item);
    }
    // Open submenu on hover if this item has children
    if (item.children?.length) {
      this.openSubmenuFor(item);
    } else {
      this.openSubmenuId.set(null);
    }
  }

  protected onSubmenuSelected(id: string | null): void {
    this.selected.emit(id);
  }

  // ── Keyboard handler ───────────────────────────────────────────────────────
  protected onKeydown(event: KeyboardEvent): void {
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        this.moveFocus(1);
        break;
      case 'ArrowUp':
        event.preventDefault();
        this.moveFocus(-1);
        break;
      case 'Home':
        event.preventDefault();
        this.setFocusIndex(0);
        break;
      case 'End':
        event.preventDefault();
        this.setFocusIndex(this.focusableItems().length - 1);
        break;
      case 'ArrowRight': {
        event.preventDefault();
        const item = this.focusedItem();
        if (item?.children?.length) this.toggleSubmenu(item);
        break;
      }
      case 'ArrowLeft':
        event.preventDefault();
        this.openSubmenuId.set(null);
        break;
      case 'Enter':
      case ' ': {
        event.preventDefault();
        const item = this.focusedItem();
        if (item) this.selectItem(item);
        break;
      }
      case 'Tab':
        // Let Tab close the menu (standard pattern)
        this.selected.emit(null);
        break;
      default:
        // Type-ahead: single printable character
        if (event.key.length === 1 && !event.ctrlKey && !event.metaKey) {
          this.handleTypeahead(event.key);
        }
        break;
    }
  }

  // ── Focus helpers ──────────────────────────────────────────────────────────
  private moveFocus(delta: number): void {
    const len = this.focusableItems().length;
    if (len === 0) return;
    const current = this.focusedIndex();
    const next = current === -1
      ? (delta > 0 ? 0 : len - 1)
      : (current + delta + len) % len;
    this.setFocusIndex(next);
  }

  private setFocusIndex(idx: number): void {
    this.focusedIndex.set(idx);
    const item = this.focusableItems()[idx];
    if (item) this.scrollItemIntoView(item);
  }

  private scrollItemIntoView(item: ContextMenuItem): void {
    const el = this.elRef.nativeElement.querySelector<HTMLElement>(
      `#${CSS.escape(this.itemId(item))}`,
    );
    el?.scrollIntoView({ block: 'nearest' });
  }

  // ── Type-ahead ─────────────────────────────────────────────────────────────
  private handleTypeahead(char: string): void {
    if (this.typeaheadTimer !== null) clearTimeout(this.typeaheadTimer);
    this.typeaheadBuffer += char.toLowerCase();

    const focusables = this.focusableItems();
    const startIdx = (this.focusedIndex() + 1) % focusables.length;

    // Search starting from the item after the current one (wraps around)
    const match =
      this.findTypeaheadMatch(focusables, startIdx, focusables.length) ??
      this.findTypeaheadMatch(focusables, 0, startIdx);

    if (match !== null) this.setFocusIndex(match);

    this.typeaheadTimer = setTimeout(() => {
      this.typeaheadBuffer = '';
      this.typeaheadTimer = null;
    }, 500);
  }

  private findTypeaheadMatch(
    items: ContextMenuItem[],
    from: number,
    to: number,
  ): number | null {
    for (let i = from; i < to; i++) {
      if (items[i].label.toLowerCase().startsWith(this.typeaheadBuffer)) {
        return i;
      }
    }
    return null;
  }

  // ── Submenu helpers ────────────────────────────────────────────────────────
  private openSubmenuFor(item: ContextMenuItem): void {
    const btn = this.elRef.nativeElement.querySelector<HTMLElement>(
      `#${CSS.escape(this.itemId(item))}`,
    );
    if (btn) {
      const rect = btn.getBoundingClientRect();
      const panelRect = this.elRef.nativeElement.getBoundingClientRect();
      this.submenuTop.set(rect.top - panelRect.top);
    }
    this.openSubmenuId.set(item.id);
  }

  private toggleSubmenu(item: ContextMenuItem): void {
    if (this.openSubmenuId() === item.id) {
      this.openSubmenuId.set(null);
    } else {
      this.openSubmenuFor(item);
    }
  }
}
