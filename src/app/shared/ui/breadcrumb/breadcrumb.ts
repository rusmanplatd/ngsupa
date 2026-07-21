import { Component, input, computed } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LucideDynamicIcon } from '@lucide/angular';

export interface BreadcrumbItem {
  /** Visible label for the crumb */
  label: string;
  /** Angular router path. If omitted the item is non-navigable (usually the active crumb). */
  path?: string | string[];
  /** Lucide icon name (e.g. 'home', 'settings'). Rendered before the label. */
  icon?: string;
  /** When true the crumb is rendered as plain text even if a path is provided */
  disabled?: boolean;
}

@Component({
  selector: 'app-breadcrumb',
  imports: [RouterLink, LucideDynamicIcon],
  host: {
    class: 'block',
  },
  template: `
    <nav aria-label="Breadcrumb">
      <ol class="breadcrumb-list" role="list">
        @for (crumb of visible(); track crumb.label; let last = $last; let i = $index) {
          <!-- Leading separator for every item after the first -->
          @if (i > 0) {
            <li class="breadcrumb-separator" aria-hidden="true">
              <svg lucideIcon="chevron-right" [size]="12" [strokeWidth]="2" />
            </li>
          }

          <!-- Crumb item -->
          <li
            class="breadcrumb-item"
            [attr.aria-current]="last ? 'page' : null"
          >
            @if (!last && crumb.path && !crumb.disabled) {
              <a class="breadcrumb-link" [routerLink]="crumb.path">
                @if (crumb.icon) {
                  <svg
                    class="breadcrumb-icon"
                    [lucideIcon]="crumb.icon"
                    [size]="14"
                    [strokeWidth]="2"
                    aria-hidden="true"
                  />
                }
                {{ crumb.label }}
              </a>
            } @else {
              <span
                class="breadcrumb-current"
                [class.breadcrumb-disabled]="crumb.disabled && !last"
              >
                @if (crumb.icon) {
                  <svg
                    class="breadcrumb-icon"
                    [lucideIcon]="crumb.icon"
                    [size]="14"
                    [strokeWidth]="2"
                    aria-hidden="true"
                  />
                }
                {{ crumb.label }}
              </span>
            }
          </li>

          <!-- After the root item, inject ellipsis if overflowing -->
          @if (i === 0 && isOverflowing()) {
            <li class="breadcrumb-separator" aria-hidden="true">
              <svg lucideIcon="chevron-right" [size]="12" [strokeWidth]="2" />
            </li>
            <li aria-hidden="true">
              <button
                type="button"
                class="breadcrumb-ellipsis"
                [attr.aria-label]="'Show ' + collapsedCount() + ' more levels'"
              >
                <span aria-hidden="true">···</span>
              </button>
            </li>
          }
        }
      </ol>
    </nav>
  `,
  styles: `
    .breadcrumb-list {
      display: flex;
      align-items: center;
      flex-wrap: nowrap;
      gap: 0;
      list-style: none;
      margin: 0;
      padding: 0;
      overflow: hidden;
    }

    .breadcrumb-item {
      display: flex;
      align-items: center;
      min-width: 0;
    }

    .breadcrumb-separator {
      display: flex;
      align-items: center;
      flex-shrink: 0;
      color: var(--text-quaternary);
      padding-inline: 2px;
    }

    /* ── Navigable ancestor link ────────────────────────── */
    .breadcrumb-link {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      font: var(--type-subheadline);
      color: var(--text-secondary);
      text-decoration: none;
      border-radius: var(--radius-xs);
      padding: 2px 4px;
      max-width: 160px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      transition:
        color var(--duration-fast) var(--ease-default),
        background-color var(--duration-fast) var(--ease-default),
        transform 50ms var(--ease-default);
      outline: none;
    }

    .breadcrumb-link:hover {
      color: var(--text-primary);
      background-color: var(--fill-primary);
    }

    .breadcrumb-link:focus-visible {
      color: var(--color-primary);
      box-shadow: 0 0 0 3px var(--focus-ring);
    }

    .breadcrumb-link:active {
      transform: scale(0.94);
      color: var(--color-primary);
    }

    /* ── Active / current (last) crumb ──────────────────── */
    .breadcrumb-current {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      font: var(--type-subheadline);
      font-weight: 600;
      color: var(--text-primary);
      max-width: 200px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      padding: 2px 4px;
    }

    /* ── Disabled mid-trail crumb ───────────────────────── */
    .breadcrumb-disabled {
      color: var(--text-quaternary);
      font-weight: 400;
      cursor: not-allowed;
    }

    /* ── Collapsed / ellipsis button ────────────────────── */
    .breadcrumb-ellipsis {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      font: var(--type-subheadline);
      color: var(--text-tertiary);
      background: var(--fill-primary);
      border: none;
      border-radius: var(--radius-xs);
      padding: 1px 7px;
      cursor: pointer;
      letter-spacing: 0.06em;
      transition:
        color var(--duration-fast) var(--ease-default),
        background-color var(--duration-fast) var(--ease-default),
        transform 50ms var(--ease-default);
      outline: none;
      line-height: 1.6;
    }

    .breadcrumb-ellipsis:hover {
      color: var(--text-primary);
      background-color: var(--fill-secondary);
    }

    .breadcrumb-ellipsis:focus-visible {
      box-shadow: 0 0 0 3px var(--focus-ring);
    }

    .breadcrumb-ellipsis:active {
      transform: scale(0.94);
    }

    /* ── Optional inline icon ───────────────────────────── */
    .breadcrumb-icon {
      flex-shrink: 0;
    }
  `,
})
export class BreadcrumbComponent {
  /** Full list of breadcrumb items, ordered from root → current page. */
  readonly items = input.required<BreadcrumbItem[]>();

  /**
   * Maximum number of crumbs to display simultaneously.
   * When the list is longer than this, intermediate items collapse into an ellipsis,
   * always keeping the root and the trailing (maxVisible - 1) items visible.
   * Set to 0 (default) to show every item.
   */
  readonly maxVisible = input(0);

  protected readonly isOverflowing = computed(() => {
    const max = this.maxVisible();
    return max > 0 && this.items().length > max;
  });

  protected readonly collapsedCount = computed(() => {
    const max = this.maxVisible();
    if (max <= 0) return 0;
    return Math.max(0, this.items().length - max);
  });

  /**
   * Items actually rendered.
   * When truncation is active: root + last (maxVisible - 1) items.
   * An ellipsis is injected between them in the template.
   */
  protected readonly visible = computed<BreadcrumbItem[]>(() => {
    const all = this.items();
    const max = this.maxVisible();
    if (max <= 0 || all.length <= max) return all;
    const tail = all.slice(-(max - 1));
    return [all[0], ...tail];
  });
}
