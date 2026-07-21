import {
  Component,
  Directive,
  ElementRef,
  input,
  output,
  signal,
  computed,
  effect,
  AfterViewInit,
  inject,
  viewChildren,
  DestroyRef,
  Injector,
  afterNextRender,
  untracked,
} from '@angular/core';
import { FocusKeyManager, FocusableOption } from '@angular/cdk/a11y';
import { LucideDynamicIcon } from '@lucide/angular';

export interface AccordionItem {
  id: string;
  title: string;
  content: string;
  icon?: string;
  disabled?: boolean;
  /** Optional pill badge displayed after the title (e.g. a count or "New"). */
  badge?: number | string;
  /** Optional secondary line of text displayed below the title in the trigger. */
  subtitle?: string;
}

export type AccordionVariant = 'default' | 'separated' | 'inset';
export type AccordionSize = 'sm' | 'md' | 'lg';

/**
 * Thin focusable wrapper applied to each accordion trigger button so that
 * CDK `FocusKeyManager` can manage vertical arrow-key navigation.
 * Mirrors the pattern used in `TabFocusItemDirective` (tabs component).
 */
@Directive({
  selector: '[appAccordionTrigger]',
})
export class AccordionTriggerDirective implements FocusableOption {
  private readonly elRef = inject(ElementRef<HTMLButtonElement>);
  /** Synced from the parent component to let the key manager skip disabled items. */
  disabled: boolean | undefined = undefined;

  focus(): void {
    this.elRef.nativeElement.focus();
  }

  getLabel(): string {
    return this.elRef.nativeElement.textContent?.trim() ?? '';
  }
}

@Component({
  selector: 'app-accordion',
  imports: [LucideDynamicIcon, AccordionTriggerDirective],
  host: {
    class: 'block',
    role: 'list',
    '[attr.aria-label]': 'ariaLabel()',
  },
  template: `
    <div [class]="wrapperClass()">
      @for (item of items(); track item.id; let i = $index; let last = $last) {
        <div role="listitem" [class]="itemContainerClasses(item, last)">
          <!-- Header / Trigger -->
          <button
            #triggerBtn
            appAccordionTrigger
            type="button"
            [id]="'accordion-trigger-' + item.id"
            [attr.aria-expanded]="isOpen(item.id)"
            [attr.aria-controls]="'accordion-panel-' + item.id"
            [disabled]="item.disabled || null"
            class="accordion-trigger"
            [class]="triggerClasses(item)"
            (click)="toggle(item.id)"
            (keydown)="onKeydown($event)"
          >
            <!-- Leading icon -->
            @if (item.icon) {
              <svg
                [lucideIcon]="item.icon"
                [size]="iconSize()"
                class="shrink-0 text-[var(--text-secondary)]"
                aria-hidden="true"
              />
            }

            <!-- Title + optional subtitle -->
            <span class="flex-1 min-w-0 text-left">
              <span [class]="titleClass()">{{ item.title }}</span>
              @if (item.subtitle) {
                <span [class]="subtitleClass()">{{ item.subtitle }}</span>
              }
            </span>

            <!-- Badge pill -->
            @if (item.badge !== undefined && item.badge !== null) {
              <span class="accordion-trigger__badge" aria-label="{{ formatBadge(item.badge) }}">
                {{ formatBadge(item.badge) }}
              </span>
            }

            <!-- Chevron -->
            <svg
              lucideIcon="chevron-down"
              [size]="chevronSize()"
              class="accordion-trigger__chevron shrink-0 text-[var(--text-tertiary)]"
              [class.rotate-180]="isOpen(item.id)"
              aria-hidden="true"
            />
          </button>

          <!-- Panel — lazy: content only rendered after first open -->
          <div
            [id]="'accordion-panel-' + item.id"
            role="region"
            [attr.aria-labelledby]="'accordion-trigger-' + item.id"
            class="accordion-panel"
            [class.accordion-panel--open]="isOpen(item.id)"
          >
            @if (hasBeenOpened(item.id)) {
              <div [class]="contentClass()">{{ item.content }}</div>
            }
          </div>
        </div>

        <!-- Separator between items -->
        @if (variant() === 'default' && !last) {
          <div
            class="h-px bg-[var(--separator)]"
            [class]="flush() ? '' : 'mx-4'"
          ></div>
        }
        @if (variant() === 'inset' && !last) {
          <!-- Inset separator aligned with title (after icon) -->
          <div class="h-px bg-[var(--separator)] ms-[52px] me-4"></div>
        }
      }
    </div>
  `,
  styles: `
    /* ═══════════════════════════════════════════════════════════
       Accordion Component — Apple HIG Design
       ═══════════════════════════════════════════════════════════ */

    /* ── Inset wrapper — iOS UITableView inset-grouped style ─── */
    :host-context(.accordion--inset) > div,
    .accordion-inset-wrapper {
      border-radius: var(--radius-xl);
      background: var(--surface-elevated);
      border: 1px solid var(--border-default);
      overflow: hidden;
    }

    /* ── Trigger Button ──────────────────────────────────────── */
    .accordion-trigger {
      display: flex;
      width: 100%;
      align-items: center;
      gap: 12px;
      transition: background-color var(--duration-fast) var(--ease-default);
    }

    .accordion-trigger:focus-visible {
      outline: 2px solid var(--focus-ring);
      outline-offset: -2px;
      border-radius: var(--radius-md);
      z-index: 1;
      position: relative;
    }

    /* ── Chevron ─────────────────────────────────────────────── */
    .accordion-trigger__chevron {
      transition: transform var(--duration-normal) var(--ease-default);
      flex-shrink: 0;
    }

    /* ── Badge pill ─────────────────────────────────────────── */
    .accordion-trigger__badge {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-width: 20px;
      height: 18px;
      padding: 0 6px;
      font-size: 11px;
      font-weight: 600;
      line-height: 1;
      color: var(--text-on-fill);
      background: var(--color-primary);
      border-radius: var(--radius-full);
      flex-shrink: 0;
      animation: accordion-badge-in 0.3s var(--ease-spring) both;
    }

    @keyframes accordion-badge-in {
      from { opacity: 0; transform: scale(0.5); }
      to   { opacity: 1; transform: scale(1); }
    }

    /* ── Panel ─────────────────────────────────────────────── */
    /* Note: collapse/expand CSS is in global styles.css to avoid HMR
       and ViewEncapsulation issues with the grid-template-rows trick. */

    /* ── Reduced Motion ─────────────────────────────────────── */
    @media (prefers-reduced-motion: reduce) {
      .accordion-panel {
        transition-duration: 0.01ms !important;
      }
      .accordion-trigger__chevron {
        transition-duration: 0.01ms !important;
      }
      .accordion-panel__content,
      .accordion-trigger__badge {
        animation: none !important;
      }
    }
  `,
})
export class AccordionComponent implements AfterViewInit {
  readonly items = input.required<AccordionItem[]>();
  readonly multiple = input(false);
  readonly variant = input<AccordionVariant>('default');
  readonly size = input<AccordionSize>('md');
  readonly ariaLabel = input('Accordion');
  /**
   * IDs of items that should be open on initial render.
   * When `multiple` is false, only the first matching ID is used.
   */
  readonly defaultOpenIds = input<string[]>([]);
  /**
   * When true, the separator between items in the `default` variant stretches
   * edge-to-edge (no horizontal margin). Useful inside borderless containers.
   */
  readonly flush = input(false);
  /**
   * When true, panel content is only rendered after the first open — improving
   * initial page load performance for content-heavy panels.
   * Once opened, content stays in the DOM to preserve scroll/focus state.
   */
  readonly lazy = input(false);

  /** Emits the current set of open item IDs after every toggle. */
  readonly openChange = output<string[]>();

  // ── CDK Key Manager ────────────────────────────────────────────────────────
  private readonly triggerDirectives = viewChildren(AccordionTriggerDirective);
  private readonly injector = inject(Injector);
  private readonly destroyRef = inject(DestroyRef);
  private keyManager: FocusKeyManager<AccordionTriggerDirective> | null = null;

  // ── Internal State ─────────────────────────────────────────────────────────
  private readonly openIds = signal<Set<string>>(new Set());
  /** Tracks which panels have been opened at least once (for lazy rendering). */
  private readonly everOpenedIds = signal<Set<string>>(new Set());

  // ── Computed Size Tokens ───────────────────────────────────────────────────
  protected readonly iconSize = computed(() => {
    const map: Record<AccordionSize, number> = { sm: 14, md: 16, lg: 18 };
    return map[this.size()];
  });

  protected readonly chevronSize = computed(() => {
    const map: Record<AccordionSize, number> = { sm: 13, md: 15, lg: 17 };
    return map[this.size()];
  });

  protected readonly titleClass = computed(() => {
    const map: Record<AccordionSize, string> = {
      sm: 'block text-xs  font-medium text-[var(--text-primary)] truncate',
      md: 'block text-sm  font-medium text-[var(--text-primary)] truncate',
      lg: 'block text-base font-medium text-[var(--text-primary)] truncate',
    };
    return map[this.size()];
  });

  protected readonly subtitleClass = computed(() => {
    const map: Record<AccordionSize, string> = {
      sm: 'block text-2xs text-[var(--text-tertiary)] truncate mt-0.5',
      md: 'block text-xs  text-[var(--text-tertiary)] truncate mt-0.5',
      lg: 'block text-sm  text-[var(--text-tertiary)] truncate mt-0.5',
    };
    return map[this.size()];
  });

  /** Full class string for the content div — avoids [class]= overriding static class="" */
  protected readonly contentClass = computed(() => {
    const map: Record<AccordionSize, string> = {
      sm: 'accordion-panel__content px-3 pb-3 pt-0.5 text-xs  text-[var(--text-secondary)] leading-relaxed',
      md: 'accordion-panel__content px-4 pb-4 pt-1  text-sm  text-[var(--text-secondary)] leading-relaxed',
      lg: 'accordion-panel__content px-5 pb-5 pt-1.5 text-base text-[var(--text-secondary)] leading-relaxed',
    };
    return map[this.size()];
  });

  protected readonly wrapperClass = computed(() => {
    if (this.variant() === 'separated') return 'space-y-3';
    if (this.variant() === 'inset') return 'accordion-inset-wrapper';
    return '';
  });

  constructor() {
    // Apply defaultOpenIds on first run — effect tracks items() + defaultOpenIds()
    effect(() => {
      const defaults = this.defaultOpenIds();
      const all = this.items();
      if (defaults.length === 0 || all.length === 0) return;

      const validIds = defaults.filter(id => all.some(it => it.id === id && !it.disabled));
      if (validIds.length === 0) return;

      const initial = this.multiple() ? validIds : [validIds[0]];
      this.openIds.set(new Set(initial));
      this.everOpenedIds.set(new Set(initial));
    });

    // Rebuild key manager whenever the items list changes (e.g. dynamic lists)
    effect(() => {
      const _items = this.items(); // track signal
      afterNextRender(() => {
        untracked(() => this.buildKeyManager());
      }, { injector: this.injector });
    });
  }

  ngAfterViewInit(): void {
    this.buildKeyManager();
  }

  private buildKeyManager(): void {
    const directives = this.triggerDirectives();
    if (directives.length === 0) return;

    // Sync disabled state so the key manager skips disabled triggers
    const allItems = this.items();
    directives.forEach((d, i) => {
      d.disabled = allItems[i]?.disabled;
    });

    this.keyManager = new FocusKeyManager<AccordionTriggerDirective>(directives)
      .withWrap()
      .withVerticalOrientation(true);
  }

  // ── State queries ──────────────────────────────────────────────────────────

  isOpen(id: string): boolean {
    return this.openIds().has(id);
  }

  /** Returns true if the panel should render its content (lazy-aware). */
  hasBeenOpened(id: string): boolean {
    if (!this.lazy()) return true;
    return this.everOpenedIds().has(id);
  }

  // ── Actions ────────────────────────────────────────────────────────────────

  toggle(id: string): void {
    this.openIds.update((set) => {
      const next = new Set(set);
      if (next.has(id)) {
        next.delete(id);
      } else {
        if (!this.multiple()) next.clear();
        next.add(id);
        this.everOpenedIds.update((s) => new Set([...s, id]));
      }
      return next;
    });
    this.openChange.emit([...this.openIds()]);
  }

  // ── Keyboard (delegated to CDK FocusKeyManager) ────────────────────────────

  protected onKeydown(event: KeyboardEvent): void {
    const km = this.keyManager;
    if (!km) return;

    const allItems = this.items();
    const directives = this.triggerDirectives();

    if (event.key === 'Home') {
      event.preventDefault();
      const firstEnabled = allItems.findIndex(it => !it.disabled);
      if (firstEnabled >= 0) {
        km.setActiveItem(firstEnabled);
        directives[firstEnabled]?.focus();
      }
      return;
    }

    if (event.key === 'End') {
      event.preventDefault();
      const last = [...allItems]
        .map((it, i) => ({ it, i }))
        .filter(({ it }) => !it.disabled)
        .pop();
      if (last) {
        km.setActiveItem(last.i);
        directives[last.i]?.focus();
      }
      return;
    }

    // Arrow Up/Down with wrap + skip-disabled delegated to FocusKeyManager
    km.onKeydown(event);
  }

  // ── Styling helpers ────────────────────────────────────────────────────────

  protected itemContainerClasses(item: AccordionItem, last: boolean): string {
    if (this.variant() === 'separated') {
      return 'rounded-2xl bg-[var(--surface-elevated)] border border-[var(--border-default)] overflow-hidden';
    }
    return '';
  }

  protected triggerClasses(item: AccordionItem): string {
    const padMap: Record<AccordionSize, string> = {
      sm: 'px-3 py-2.5',
      md: 'px-4 py-3.5',
      lg: 'px-5 py-4',
    };
    const pad = padMap[this.size()];

    if (item.disabled) {
      return `${pad} opacity-40 cursor-not-allowed rounded-lg`;
    }
    return `${pad} hover:bg-[var(--fill-primary)] active:bg-[var(--fill-secondary)] cursor-pointer rounded-lg`;
  }

  protected formatBadge(badge: number | string): string {
    if (typeof badge === 'number') {
      return badge > 99 ? '99+' : `${badge}`;
    }
    return `${badge}`;
  }
}
