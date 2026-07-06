import { Component, input, signal, computed, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { LucideDynamicIcon } from '@lucide/angular';

export interface AccordionItem {
  id: string;
  title: string;
  content: string;
  icon?: string;
  disabled?: boolean;
}

@Component({
  selector: 'app-accordion',
  imports: [LucideDynamicIcon],
  host: {
    class: 'block',
    role: 'tablist',
    '[attr.aria-label]': 'ariaLabel()',
  },
  template: `
    <div [class]="variant() === 'separated' ? 'space-y-3' : ''">
      @for (item of items(); track item.id; let i = $index; let last = $last) {
        <div [class]="itemContainerClasses(item, last)">
          <!-- Header / Trigger -->
          <button
            type="button"
            role="tab"
            [id]="'accordion-trigger-' + item.id"
            [attr.aria-expanded]="isOpen(item.id)"
            [attr.aria-controls]="'accordion-panel-' + item.id"
            [disabled]="item.disabled"
            class="flex w-full items-center gap-3 text-left transition-colors duration-fast"
            [class]="triggerClasses(item)"
            (click)="toggle(item.id)"
            (keydown.arrowDown)="focusItem(i + 1)"
            (keydown.arrowUp)="focusItem(i - 1)"
          >
            @if (item.icon) {
              <svg [lucideIcon]="item.icon" [size]="18" class="shrink-0 text-[var(--text-secondary)]" />
            }
            <span class="flex-1 text-sm font-medium text-[var(--text-primary)]">{{ item.title }}</span>
            <svg
              lucideIcon="chevron-down"
              [size]="16"
              class="shrink-0 text-[var(--text-tertiary)] transition-transform duration-normal"
              [class.rotate-180]="isOpen(item.id)"
            />
          </button>

          <!-- Panel / Content — lazy: only rendered once the item has been opened at least once -->
          <div
            [id]="'accordion-panel-' + item.id"
            role="tabpanel"
            [attr.aria-labelledby]="'accordion-trigger-' + item.id"
            class="accordion-panel"
            [class.accordion-panel--open]="isOpen(item.id)"
          >
            @if (hasBeenOpened(item.id)) {
              <div class="accordion-panel__content px-4 pb-4 pt-1 text-sm text-[var(--text-secondary)] leading-relaxed">
                {{ item.content }}
              </div>
            }
          </div>
        </div>

        @if (variant() !== 'separated' && !last) {
          <div class="h-px bg-[var(--separator)] mx-4"></div>
        }
      }
    </div>
  `,
  styles: `
    .accordion-panel {
      display: grid;
      grid-template-rows: 0fr;
      transition: grid-template-rows var(--duration-normal) cubic-bezier(0.2, 0, 0, 1);
      overflow: hidden;
    }

    .accordion-panel > div {
      overflow: hidden;
    }

    .accordion-panel--open {
      grid-template-rows: 1fr;
    }

    /* Fade-in content when panel opens */
    .accordion-panel__content {
      animation: accordion-content-in 0.2s var(--ease-default);
    }

    @keyframes accordion-content-in {
      from { opacity: 0; transform: translateY(-4px); }
      to   { opacity: 1; transform: translateY(0); }
    }

    @media (prefers-reduced-motion: reduce) {
      .accordion-panel {
        transition-duration: 0.01ms !important;
      }
      .accordion-panel__content {
        animation: none !important;
      }
    }
  `,
})
export class AccordionComponent {
  readonly items = input.required<AccordionItem[]>();
  readonly multiple = input(false);
  readonly variant = input<'default' | 'separated'>('default');
  readonly ariaLabel = input('Accordion');
  /**
   * When true, panel content is only rendered after the first open — improving
   * initial page load performance for content-heavy panels.
   * Once opened, content stays in the DOM to preserve scroll/focus state.
   */
  readonly lazy = input(false);

  private readonly openIds = signal<Set<string>>(new Set());
  /** Tracks which panels have been opened at least once (for lazy rendering). */
  private readonly everOpenedIds = signal<Set<string>>(new Set());

  isOpen(id: string): boolean {
    return this.openIds().has(id);
  }

  /** Returns true if the panel should render its content (lazy-aware). */
  hasBeenOpened(id: string): boolean {
    if (!this.lazy()) return true;
    return this.everOpenedIds().has(id);
  }

  toggle(id: string): void {
    this.openIds.update((set) => {
      const next = new Set(set);
      if (next.has(id)) {
        next.delete(id);
      } else {
        if (!this.multiple()) next.clear();
        next.add(id);
        // Mark as ever-opened for lazy rendering
        this.everOpenedIds.update((s) => new Set([...s, id]));
      }
      return next;
    });
  }

  protected focusItem(index: number): void {
    const items = this.items();
    if (index < 0 || index >= items.length) return;
    const el = document.getElementById('accordion-trigger-' + items[index].id);
    el?.focus();
  }

  protected itemContainerClasses(item: AccordionItem, last: boolean): string {
    if (this.variant() === 'separated') {
      return 'rounded-2xl bg-[var(--surface-elevated)] border border-[var(--border-default)] overflow-hidden';
    }
    return '';
  }

  protected triggerClasses(item: AccordionItem): string {
    const base = 'px-4 py-3.5 rounded-lg';
    if (item.disabled) {
      return `${base} opacity-40 cursor-not-allowed`;
    }
    return `${base} hover:bg-[var(--fill-primary)] cursor-pointer`;
  }
}
