import { Component, input, output, computed } from '@angular/core';

@Component({
  selector: 'app-paginator',
  host: {
    class: 'block',
    role: 'navigation',
    '[attr.aria-label]': 'ariaLabel()',
  },
  template: `
    <div class="paginator-container">
      <!-- Previous button -->
      <button
        type="button"
        class="paginator-nav"
        [class.paginator-nav--disabled]="currentPage() <= 1"
        [disabled]="currentPage() <= 1"
        [attr.aria-label]="'Go to previous page'"
        (click)="goToPage(currentPage() - 1)"
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
          <path d="M10 3L5.5 8L10 13" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </button>

      <!-- Page buttons -->
      <div class="paginator-pages" role="group">
        @for (page of visiblePages(); track page.key) {
          @if (page.type === 'ellipsis') {
            <span class="paginator-ellipsis" aria-hidden="true">⋯</span>
          } @else {
            <button
              type="button"
              class="paginator-page"
              [class.paginator-page--active]="page.value === currentPage()"
              [attr.aria-label]="'Page ' + page.value"
              [attr.aria-current]="page.value === currentPage() ? 'page' : null"
              (click)="goToPage(page.value!)"
            >
              {{ page.value }}
            </button>
          }
        }
      </div>

      <!-- Next button -->
      <button
        type="button"
        class="paginator-nav"
        [class.paginator-nav--disabled]="currentPage() >= totalPages()"
        [disabled]="currentPage() >= totalPages()"
        [attr.aria-label]="'Go to next page'"
        (click)="goToPage(currentPage() + 1)"
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
          <path d="M6 3L10.5 8L6 13" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </button>

      <!-- Page info -->
      @if (showPageInfo()) {
        <span class="paginator-info">
          {{ currentPage() }} of {{ totalPages() }}
        </span>
      }
    </div>
  `,
  styles: `
    :host {
      --paginator-height: 36px;
      --paginator-page-size: 36px;
      --paginator-gap: 4px;
      --paginator-radius: 10px;
      --paginator-nav-radius: 10px;
    }

    .paginator-container {
      display: inline-flex;
      align-items: center;
      gap: var(--paginator-gap);
      padding: 4px;
      border-radius: calc(var(--paginator-radius) + 4px);
      background: var(--fill-tertiary);
      border: 1px solid var(--border-default);
    }

    /* ── Navigation Arrows ────────────────────────────── */

    .paginator-nav {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: var(--paginator-page-size);
      height: var(--paginator-height);
      border-radius: var(--paginator-nav-radius);
      border: none;
      background: transparent;
      color: var(--text-secondary);
      cursor: pointer;
      transition-property: background-color, color, transform, opacity;
      transition-duration: var(--duration-fast);
      transition-timing-function: var(--ease-default);
      font-family: inherit;
      padding: 0;
    }

    .paginator-nav:hover:not(:disabled) {
      background: var(--fill-secondary);
      color: var(--text-primary);
    }

    .paginator-nav:active:not(:disabled) {
      transform: scale(0.9);
      transition-duration: 50ms;
    }

    .paginator-nav--disabled {
      opacity: 0.3;
      cursor: not-allowed;
      pointer-events: none;
    }

    /* ── Pages Container ──────────────────────────────── */

    .paginator-pages {
      display: flex;
      align-items: center;
      gap: var(--paginator-gap);
    }

    /* ── Page Button ──────────────────────────────────── */

    .paginator-page {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-width: var(--paginator-page-size);
      height: var(--paginator-height);
      padding: 0 4px;
      border-radius: var(--paginator-radius);
      border: none;
      background: transparent;
      color: var(--text-secondary);
      font: var(--type-footnote);
      font-weight: 500;
      cursor: pointer;
      transition-property: background-color, color, transform, box-shadow;
      transition-duration: var(--duration-normal);
      transition-timing-function: var(--ease-default);
      font-family: inherit;
      user-select: none;
      position: relative;
    }

    .paginator-page:hover:not(.paginator-page--active) {
      background: var(--fill-secondary);
      color: var(--text-primary);
    }

    .paginator-page:active:not(.paginator-page--active) {
      transform: scale(0.92);
      transition-duration: 50ms;
    }

    .paginator-page--active {
      background: var(--surface-elevated);
      color: var(--color-system-blue);
      font-weight: 600;
      box-shadow: var(--shadow-sm);
      animation: paginator-pop 0.35s var(--ease-spring);
    }

    /* ── Ellipsis ─────────────────────────────────────── */

    .paginator-ellipsis {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-width: 24px;
      height: var(--paginator-height);
      color: var(--text-tertiary);
      font: var(--type-footnote);
      letter-spacing: 0.1em;
      user-select: none;
    }

    /* ── Page Info ────────────────────────────────────── */

    .paginator-info {
      display: inline-flex;
      align-items: center;
      padding: 0 8px 0 4px;
      font: var(--type-caption-1);
      color: var(--text-tertiary);
      white-space: nowrap;
    }

    /* ── Spring pop animation ─────────────────────────── */

    @keyframes paginator-pop {
      0% {
        transform: scale(0.85);
        opacity: 0.6;
      }
      50% {
        transform: scale(1.06);
      }
      100% {
        transform: scale(1);
        opacity: 1;
      }
    }

    /* ── Size variants ────────────────────────────────── */

    :host(.paginator-sm) {
      --paginator-height: 30px;
      --paginator-page-size: 30px;
      --paginator-radius: 8px;
      --paginator-nav-radius: 8px;
    }

    :host(.paginator-lg) {
      --paginator-height: 42px;
      --paginator-page-size: 42px;
      --paginator-radius: 12px;
      --paginator-nav-radius: 12px;
    }
  `,
})
export class PaginatorComponent {
  /** Current active page (1-indexed) */
  readonly currentPage = input.required<number>();

  /** Total number of pages */
  readonly totalPages = input.required<number>();

  /** Max visible page buttons (excluding ellipsis). Default: 7 */
  readonly maxVisiblePages = input(7);

  /** Whether to show the "X of Y" info text */
  readonly showPageInfo = input(false);

  /** Accessible label for the nav landmark */
  readonly ariaLabel = input('Pagination');

  /** Emits when the user selects a page */
  readonly pageChange = output<number>();

  /** Computed array of page items to render (numbers + ellipsis) */
  protected readonly visiblePages = computed(() => {
    const current = this.currentPage();
    const total = this.totalPages();
    const max = this.maxVisiblePages();

    if (total <= max) {
      return Array.from({ length: total }, (_, i) => ({
        type: 'page' as const,
        value: i + 1,
        key: `p${i + 1}`,
      }));
    }

    const pages: { type: 'page' | 'ellipsis'; value?: number; key: string }[] = [];
    const half = Math.floor((max - 2) / 2); // slots for each side (excluding first/last)

    let startPage = Math.max(2, current - half);
    let endPage = Math.min(total - 1, current + half);

    // Adjust if near the beginning
    if (current - half <= 2) {
      endPage = Math.min(total - 1, max - 1);
    }
    // Adjust if near the end
    if (current + half >= total - 1) {
      startPage = Math.max(2, total - max + 2);
    }

    // Always show first page
    pages.push({ type: 'page', value: 1, key: 'p1' });

    // Leading ellipsis
    if (startPage > 2) {
      pages.push({ type: 'ellipsis', key: 'e-start' });
    }

    // Middle pages
    for (let i = startPage; i <= endPage; i++) {
      pages.push({ type: 'page', value: i, key: `p${i}` });
    }

    // Trailing ellipsis
    if (endPage < total - 1) {
      pages.push({ type: 'ellipsis', key: 'e-end' });
    }

    // Always show last page
    pages.push({ type: 'page', value: total, key: `p${total}` });

    return pages;
  });

  protected goToPage(page: number): void {
    const total = this.totalPages();
    if (page < 1 || page > total || page === this.currentPage()) return;
    this.pageChange.emit(page);
  }
}
