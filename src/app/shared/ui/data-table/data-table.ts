import {
  Component,
  input,
  output,
  signal,
  computed,
  contentChildren,
  TemplateRef,
  Directive,
  inject,
  ElementRef,
  effect,
  type OnDestroy,
  DOCUMENT,
} from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { LucideDynamicIcon } from '@lucide/angular';
import { LiveAnnouncer } from '@angular/cdk/a11y';
import { DragDropModule, CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { CheckboxComponent } from '../checkbox/checkbox';
import { EmptyStateComponent } from '../empty-state/empty-state';

// ═══════════════════════════════════════════════════════════════
// Interfaces & Types
// ═══════════════════════════════════════════════════════════════

export interface DataTableColumnDef {
  /** Property key on the row data object */
  key: string;
  /** Display header text */
  header: string;
  /** Enable sorting on this column */
  sortable?: boolean;
  /** Fixed width (e.g. '200px', '20%') */
  width?: string;
  /** Minimum width for resizable columns */
  minWidth?: string;
  /** Text alignment */
  align?: 'start' | 'center' | 'end';
  /** Make this column sticky to the left */
  sticky?: boolean;
  /** Custom template name matching appDataTableCell directive */
  templateKey?: string;
  /** Enable per-column filtering for this column */
  filterable?: boolean;
}

export interface SortState {
  column: string;
  direction: 'asc' | 'desc' | '';
}

export interface PageState {
  pageIndex: number;
  pageSize: number;
  totalItems: number;
}

export interface TablePersistedState {
  sortState: SortState;
  hiddenColumns: string[];
  pageSize: number;
}

// ── Advanced Filter Types ────────────────────────────────────

export type FilterOperator =
  | 'contains'
  | 'not-contains'
  | 'equals'
  | 'not-equals'
  | 'starts-with'
  | 'ends-with'
  | 'gt'
  | 'lt'
  | 'gte'
  | 'lte';

export interface ColumnFilter {
  column: string;
  operator: FilterOperator;
  value: string;
}

export const FILTER_OPERATOR_LABELS: Record<FilterOperator, string> = {
  'contains': 'Contains',
  'not-contains': 'Does not contain',
  'equals': 'Equals',
  'not-equals': 'Not equals',
  'starts-with': 'Starts with',
  'ends-with': 'Ends with',
  'gt': 'Greater than',
  'lt': 'Less than',
  'gte': 'Greater than or equal',
  'lte': 'Less than or equal',
};

export const NUMERIC_OPERATORS: FilterOperator[] = ['gt', 'lt', 'gte', 'lte', 'equals', 'not-equals'];
export const TEXT_OPERATORS: FilterOperator[] = ['contains', 'not-contains', 'equals', 'not-equals', 'starts-with', 'ends-with'];

// ═══════════════════════════════════════════════════════════════
// Cell Template Directive
// ═══════════════════════════════════════════════════════════════

@Directive({
  selector: 'ng-template[appDataTableCell]',
})
export class DataTableCellDirective {
  readonly appDataTableCell = input.required<string>();
  readonly templateRef = inject(TemplateRef);
}

// ═══════════════════════════════════════════════════════════════
// Main DataTable Component
// ═══════════════════════════════════════════════════════════════

@Component({
  selector: 'app-data-table',
  imports: [NgTemplateOutlet, LucideDynamicIcon, CheckboxComponent, EmptyStateComponent, DragDropModule],
  host: {
    class: 'block',
    '(document:click)': 'onDocumentClickForFilter($event)',
  },
  template: `
    <!-- ─── Toolbar ─────────────────────────────────────── -->
    <div class="table-toolbar flex items-center gap-3 px-5 py-3.5">
      <!-- Search -->
      @if (searchable()) {
        <div
          class="search-wrapper relative flex items-center flex-1 max-w-xs rounded-xl border transition-all duration-normal"
          [class]="searchFocused()
            ? 'border-[var(--color-primary)] bg-[var(--surface-primary)]'
            : 'border-[var(--border-default)] bg-[var(--form-field-glass)] hover:border-[var(--border-opaque)]'"
          [style.box-shadow]="searchFocused() ? 'var(--form-field-shadow), var(--form-control-glow)' : 'var(--form-field-shadow)'"
        >
          <svg
            lucideIcon="search"
            [size]="15"
            class="ml-3 shrink-0 transition-colors duration-fast"
            [class]="searchFocused() ? 'text-[var(--color-primary)]' : 'text-[var(--text-tertiary)]'"
          />
          <input
            type="text"
            class="w-full bg-transparent py-2 pl-2.5 pr-3 text-sm text-[var(--text-primary)] outline-none placeholder:text-[var(--text-tertiary)]"
            [placeholder]="searchPlaceholder()"
            [value]="searchQuery()"
            (input)="onSearchInput($event)"
            (focus)="searchFocused.set(true)"
            (blur)="searchFocused.set(false)"
            aria-label="Search table"
            autocomplete="off"
          />
          @if (searchQuery()) {
            <button
              type="button"
              tabindex="-1"
              class="clear-search mr-2.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[var(--fill-secondary)] text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] hover:bg-[var(--text-quaternary)] active:scale-90 transition-all duration-fast"
              aria-label="Clear search"
              (click)="clearSearch()"
            >
              <svg lucideIcon="x" [size]="11" />
            </button>
          }
        </div>
      }

      <div class="flex-1"></div>

      <!-- Selection count -->
      @if (selectable() && selectedRows().length > 0) {
        <span class="selection-badge inline-flex items-center gap-1.5 rounded-full bg-[var(--interactive-tint)] px-3 py-1 text-xs font-semibold text-[var(--color-primary)]">
          {{ selectedRows().length }} selected
        </span>
      }

      <!-- Results count -->
      @if ((searchQuery() || activeFilters().length > 0) && !loading()) {
        <span class="text-xs text-[var(--text-tertiary)]">
          {{ filteredData().length }} result{{ filteredData().length !== 1 ? 's' : '' }}
        </span>
      }

      <!-- Active filters badge -->
      @if (activeFilters().length > 0) {
        <button
          type="button"
          class="inline-flex items-center gap-1.5 rounded-full bg-[var(--interactive-tint)] px-3 py-1 text-xs font-semibold text-[var(--color-primary)] transition-all duration-fast hover:bg-[var(--interactive-tint-hover)] active:scale-95"
          (click)="clearAllFilters()"
          aria-label="Clear all column filters"
        >
          <svg lucideIcon="filter-x" [size]="12" />
          {{ activeFilters().length }} filter{{ activeFilters().length !== 1 ? 's' : '' }}
          <svg lucideIcon="x" [size]="11" />
        </button>
      }

      <!-- Column Visibility Toggle -->
      <div class="relative" #colVisContainer>
        <button
          type="button"
          class="col-vis-btn inline-flex items-center gap-1.5 rounded-lg border border-[var(--border-default)] bg-[var(--form-field-glass)] px-2.5 py-1.5 text-xs font-medium text-[var(--text-secondary)] transition-all duration-fast hover:border-[var(--border-opaque)] hover:bg-[var(--fill-primary)] hover:text-[var(--text-primary)] focus-visible:outline-2 focus-visible:outline-[var(--focus-ring)] active:scale-95"
          [class.bg-\[var\(--interactive-tint\)\]]="columnVisibilityOpen()"
          [class.text-\[var\(--color-primary\)\]]="columnVisibilityOpen()"
          [class.border-\[var\(--color-primary\)\]]="columnVisibilityOpen()"
          (click)="columnVisibilityOpen.update(v => !v)"
          aria-label="Toggle column visibility"
          [attr.aria-expanded]="columnVisibilityOpen()"
          [attr.aria-controls]="'col-vis-panel'"
        >
          <svg lucideIcon="columns-3" [size]="14" />
          Columns
          @if (hiddenColumns().size > 0) {
            <span class="inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-[var(--color-primary)] px-1 text-2xs font-bold text-white">
              {{ hiddenColumns().size }}
            </span>
          }
        </button>

        @if (columnVisibilityOpen()) {
          <div
            id="col-vis-panel"
            role="dialog"
            aria-label="Toggle columns"
            class="col-vis-panel absolute right-0 top-full z-50 mt-1.5 min-w-[180px] rounded-xl border border-[var(--glass-border)] bg-[var(--glass-bg-thick)] p-1.5 shadow-xl backdrop-blur-xl"
          >
            <p class="px-2.5 py-1.5 text-2xs font-semibold uppercase tracking-wider text-[var(--text-tertiary)]">Toggle Columns</p>
            <div role="separator" class="mx-2 my-1 border-t border-[var(--separator)]"></div>
            @for (col of columns(); track col.key) {
              <button
                type="button"
                class="col-vis-item flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-sm text-[var(--text-primary)] transition-all duration-fast hover:bg-[var(--fill-primary)] active:scale-98"
                (click)="toggleColumnVisibility(col.key)"
                [attr.aria-pressed]="!hiddenColumns().has(col.key)"
              >
                <span
                  class="flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors duration-fast"
                  [class]="!hiddenColumns().has(col.key)
                    ? 'border-[var(--color-primary)] bg-[var(--color-primary)]'
                    : 'border-[var(--border-default)] bg-transparent'"
                >
                  @if (!hiddenColumns().has(col.key)) {
                    <svg lucideIcon="check" [size]="10" class="text-white" />
                  }
                </span>
                <span class="flex-1 truncate">{{ col.header }}</span>
              </button>
            }
            <div role="separator" class="mx-2 my-1 border-t border-[var(--separator)]"></div>
            <button
              type="button"
              class="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs text-[var(--text-tertiary)] transition-colors duration-fast hover:bg-[var(--fill-primary)] hover:text-[var(--text-secondary)]"
              (click)="resetColumnVisibility()"
            >
              <svg lucideIcon="rotate-ccw" [size]="12" />
              Show all columns
            </button>
          </div>
        }
      </div>

      <!-- Export CSV Button -->
      <button
        type="button"
        class="toolbar-export-btn inline-flex items-center gap-1.5 rounded-lg border border-[var(--border-default)] bg-[var(--form-field-glass)] px-2.5 py-1.5 text-xs font-medium text-[var(--text-secondary)] transition-all duration-fast hover:border-[var(--border-opaque)] hover:bg-[var(--fill-primary)] hover:text-[var(--text-primary)] focus-visible:outline-2 focus-visible:outline-[var(--focus-ring)] active:scale-95"
        (click)="exportToCsv()"
        aria-label="Export table to CSV"
      >
        <svg lucideIcon="download" [size]="14" />
        Export
      </button>

      <!-- Projected toolbar actions -->
      <ng-content select="[tableToolbar]" />
    </div>

    <!-- ─── Table Container ─────────────────────────────── -->
    <div
      class="table-scroll-container overflow-x-auto"
      role="region"
      aria-label="Data table"
      tabindex="0"
    >
      <table
        role="grid"
        class="w-full border-collapse"
        [attr.aria-rowcount]="filteredData().length"
        [attr.aria-colcount]="visibleColumns().length + (selectable() ? 1 : 0) + (expandable() ? 1 : 0)"
      >
        <!-- ─── Header ────────────────────────────────────── -->
        <thead>
          <tr role="row" class="header-row">
            <!-- Expand spacer header -->
            @if (expandable()) {
              <th
                role="columnheader"
                class="expand-header-cell"
                aria-label="Expand"
              >
                <span class="sr-only">Expand row</span>
              </th>
            }

            <!-- Selection header -->
            @if (selectable()) {
              <th
                role="columnheader"
                class="selection-header-cell"
                aria-label="Select all rows"
              >
                <app-checkbox
                  [checked]="allSelected()"
                  [indeterminate]="someSelected() && !allSelected()"
                  (checkedChange)="toggleSelectAll()"
                  ariaLabel="Select all rows"
                />
              </th>
            }

            <!-- Data columns (only visible) -->
            @for (col of visibleColumns(); track col.key) {
              <th
                role="columnheader"
                class="data-header-cell group"
                [class.sortable-header]="col.sortable"
                [class.sticky-col]="col.sticky"
                [style.width]="col.width || 'auto'"
                [style.min-width]="col.minWidth || '80px'"
                [style.text-align]="col.align || 'start'"
                [attr.aria-sort]="col.sortable ? ariaSort(col.key) : null"
                (click)="col.sortable && !filterPopoverOpen(col.key) ? toggleSort(col.key) : null"
                (keydown.enter)="col.sortable && !filterPopoverOpen(col.key) ? toggleSort(col.key) : null"
                (keydown.space)="onHeaderSpaceKey($event, col)"
                [attr.tabindex]="col.sortable ? 0 : null"
              >
                <div class="header-content" [class]="headerAlignClass(col)">
                  <span class="header-label">{{ col.header }}</span>
                  @if (col.sortable) {
                    <span class="sort-icon" [class]="sortIconClasses(col.key)">
                      @if (sortState().column === col.key && sortState().direction === 'asc') {
                        <svg lucideIcon="arrow-up" [size]="14" />
                      } @else if (sortState().column === col.key && sortState().direction === 'desc') {
                        <svg lucideIcon="arrow-down" [size]="14" />
                      } @else {
                        <svg lucideIcon="chevrons-up-down" [size]="14" />
                      }
                    </span>
                  }
                  <!-- Filter indicator dot -->
                  @if (getColumnFilter(col.key)) {
                    <span
                      class="filter-indicator"
                      [title]="getFilterLabel(col.key)"
                    ></span>
                  }
                  <!-- Filter button -->
                  @if (col.filterable) {
                    <div class="relative" (click)="$event.stopPropagation()">
                      <button
                        type="button"
                        class="filter-btn"
                        [class.filter-btn--active]="getColumnFilter(col.key)"
                        [attr.aria-label]="'Filter ' + col.header"
                        [attr.aria-expanded]="filterPopoverOpen(col.key)"
                        (click)="toggleFilterPopover(col.key)"
                      >
                        <svg lucideIcon="filter" [size]="12" />
                      </button>
                      <!-- Filter Popover -->
                      @if (filterPopoverOpen(col.key)) {
                        <div
                          class="filter-popover"
                          role="dialog"
                          [attr.aria-label]="'Filter ' + col.header"
                          (click)="$event.stopPropagation()"
                        >
                          <p class="filter-popover-title">Filter: {{ col.header }}</p>
                          <!-- Operator selector -->
                          <select
                            class="filter-operator-select"
                            [value]="getFilterDraft(col.key).operator"
                            (change)="setFilterDraftOperator(col.key, $event)"
                            aria-label="Filter operator"
                          >
                            @for (op of getAvailableOperators(col.key); track op) {
                              <option [value]="op">{{ FILTER_OPERATOR_LABELS[op] }}</option>
                            }
                          </select>
                          <!-- Value input -->
                          <input
                            type="text"
                            class="filter-value-input"
                            [value]="getFilterDraft(col.key).value"
                            (input)="setFilterDraftValue(col.key, $event)"
                            (keydown.enter)="applyFilter(col.key)"
                            (keydown.escape)="closeFilterPopover(col.key)"
                            [placeholder]="getFilterPlaceholder(col.key)"
                            aria-label="Filter value"
                          />
                          <!-- Actions -->
                          <div class="filter-popover-actions">
                            <button
                              type="button"
                              class="filter-clear-btn"
                              (click)="clearColumnFilter(col.key)"
                              [disabled]="!getColumnFilter(col.key)"
                            >
                              Clear
                            </button>
                            <button
                              type="button"
                              class="filter-apply-btn"
                              (click)="applyFilter(col.key)"
                            >
                              Apply
                            </button>
                          </div>
                        </div>
                      }
                    </div>
                  }
                </div>

                <!-- Resize handle -->
                @if (resizable()) {
                  <div
                    class="resize-handle"
                    (mousedown)="onResizeStart($event, col)"
                    (touchstart)="onResizeStart($event, col)"
                    aria-hidden="true"
                  ></div>
                }
              </th>
            }
          </tr>
        </thead>

        <!-- ─── Body ──────────────────────────────────────── -->
        <tbody
          [class.draggable-tbody]="draggableRows()"
          cdkDropList
          [cdkDropListDisabled]="!draggableRows()"
          (cdkDropListDropped)="onRowDrop($event)"
        >
          @if (loading()) {
            <!-- Skeleton rows -->
            @for (i of skeletonRows; track i) {
              <tr role="row" class="skeleton-row">
                @if (expandable()) {
                  <td class="expand-cell"><div class="skeleton-bone skeleton-icon"></div></td>
                }
                @if (selectable()) {
                  <td class="selection-cell"><div class="skeleton-bone skeleton-checkbox"></div></td>
                }
                @for (col of visibleColumns(); track col.key) {
                  <td
                    role="gridcell"
                    class="data-cell"
                    [style.text-align]="col.align || 'start'"
                    [class.sticky-col]="col.sticky"
                  >
                    <div class="skeleton-bone" [style.width]="skeletonWidth($index)"></div>
                  </td>
                }
              </tr>
            }
          } @else if (paginatedData().length === 0) {
            <!-- Empty state -->
            <tr>
              <td
                [attr.colspan]="totalColumnCount()"
                class="empty-cell"
              >
                <app-empty-state
                  [icon]="emptyIcon()"
                  [title]="searchQuery() ? 'No results found' : emptyTitle()"
                  [description]="searchQuery() ? 'Try adjusting your search terms' : emptyDescription()"
                />
              </td>
            </tr>
          } @else {
            <!-- Data rows -->
            @for (row of paginatedData(); track trackByFn()(row); let idx = $index; let even = $even) {
              <tr
                role="row"
                class="data-row"
                [class.draggable-row]="draggableRows()"
                [class.striped-row]="striped() && even"
                [class.selected-row]="isRowSelected(row)"
                [class.expanded-parent-row]="isRowExpanded(row)"
                [attr.aria-selected]="selectable() ? isRowSelected(row) : null"
                [attr.aria-expanded]="expandable() ? isRowExpanded(row) : null"
                [attr.aria-rowindex]="currentPageState().pageIndex * currentPageState().pageSize + idx + 1"
                (click)="onRowClick(row, $event)"
                cdkDrag
                [cdkDragDisabled]="!draggableRows()"
                [cdkDragData]="row"
              >
                <!-- Drag handle -->
                @if (draggableRows()) {
                  <td class="drag-handle-cell" cdkDragHandle aria-hidden="true">
                    <svg lucideIcon="grip-vertical" [size]="16" class="drag-handle-icon" />
                  </td>
                }
                <!-- Expand toggle -->
                @if (expandable()) {
                  <td class="expand-cell">
                    <button
                      type="button"
                      class="expand-btn"
                      [class.expanded]="isRowExpanded(row)"
                      [attr.aria-label]="isRowExpanded(row) ? 'Collapse row' : 'Expand row'"
                      (click)="toggleExpand(row, $event)"
                    >
                      <svg lucideIcon="chevron-right" [size]="16" />
                    </button>
                  </td>
                }

                <!-- Selection checkbox -->
                @if (selectable()) {
                  <td class="selection-cell" (click)="$event.stopPropagation()">
                    <app-checkbox
                      [checked]="isRowSelected(row)"
                      (checkedChange)="toggleRowSelection(row)"
                      [ariaLabel]="'Select row ' + (idx + 1)"
                    />
                  </td>
                }

                <!-- Data cells (only visible columns) -->
                @for (col of visibleColumns(); track col.key) {
                  <td
                    role="gridcell"
                    class="data-cell"
                    [style.text-align]="col.align || 'start'"
                    [class.sticky-col]="col.sticky"
                  >
                    @if (getCellTemplate(col.templateKey || col.key); as tmpl) {
                      <ng-container
                        [ngTemplateOutlet]="tmpl"
                        [ngTemplateOutletContext]="{ $implicit: row, column: col }"
                      />
                    } @else {
                      <span class="cell-text">{{ getCellValue(row, col.key) }}</span>
                    }
                  </td>
                }
              </tr>

              <!-- Expanded row detail -->
              @if (expandable() && isRowExpanded(row) && expandedRowTemplate()) {
                <tr class="expanded-detail-row" role="row">
                  <td
                    [attr.colspan]="totalColumnCount()"
                    class="expanded-detail-cell"
                  >
                    <div class="expanded-content">
                      <ng-container
                        [ngTemplateOutlet]="expandedRowTemplate()!"
                        [ngTemplateOutletContext]="{ $implicit: row }"
                      />
                    </div>
                  </td>
                </tr>
              }
            }
          }
        </tbody>
      </table>
    </div>

    <!-- ─── Pagination ──────────────────────────────────── -->
    @if (!loading() && filteredData().length > 0) {
      <div class="pagination-bar" role="navigation" aria-label="Table pagination">
        <div class="pagination-info">
          <span class="text-xs text-[var(--text-tertiary)]">
            Showing
            <span class="font-medium text-[var(--text-secondary)]">{{ rangeStart() }}</span>
            –
            <span class="font-medium text-[var(--text-secondary)]">{{ rangeEnd() }}</span>
            of
            <span class="font-medium text-[var(--text-secondary)]">{{ filteredData().length }}</span>
          </span>
        </div>

        <div class="pagination-controls">
          <!-- Page size selector -->
          <div class="page-size-selector">
            <label for="pageSizeSelect" class="text-xs text-[var(--text-tertiary)] mr-2">Rows</label>
            <select
              id="pageSizeSelect"
              class="page-size-select"
              [value]="currentPageState().pageSize"
              (change)="onPageSizeChange($event)"
            >
              @for (size of pageSizeOptions(); track size) {
                <option [value]="size">{{ size }}</option>
              }
            </select>
          </div>

          <!-- Page navigation -->
          <div class="page-nav">
            <button
              type="button"
              class="page-btn"
              [disabled]="currentPageState().pageIndex === 0"
              (click)="goToPage(currentPageState().pageIndex - 1)"
              aria-label="Previous page"
            >
              <svg lucideIcon="chevron-left" [size]="16" />
            </button>

            <span class="page-indicator">
              {{ currentPageState().pageIndex + 1 }} / {{ totalPages() }}
            </span>

            <button
              type="button"
              class="page-btn"
              [disabled]="currentPageState().pageIndex >= totalPages() - 1"
              (click)="goToPage(currentPageState().pageIndex + 1)"
              aria-label="Next page"
            >
              <svg lucideIcon="chevron-right" [size]="16" />
            </button>
          </div>
        </div>
      </div>
    }

  `,
  styleUrl: './data-table.css',
})
export class DataTableComponent<T extends Record<string, unknown>> {
  // ── Inputs ──────────────────────────────────────────────────
  readonly columns = input.required<DataTableColumnDef[]>();
  readonly data = input.required<T[]>();
  readonly trackByFn = input.required<(item: T) => string | number>();

  readonly loading = input(false);
  readonly selectable = input(false);
  readonly expandable = input(false);
  readonly striped = input(false);
  readonly resizable = input(false);
  readonly searchable = input(true);
  readonly searchPlaceholder = input('Search…');
  readonly pageSize = input(10);
  readonly pageSizeOptions = input([10, 25, 50, 100]);
  readonly stickyHeader = input(true);
  readonly emptyIcon = input('inbox');
  readonly emptyTitle = input('No data');
  readonly emptyDescription = input<string | null>(null);
  readonly expandedRowTemplate = input<TemplateRef<{ $implicit: T }> | null>(null);
  /** Enable drag-to-reorder rows. Emits rowReordered when a row is dropped. */
  readonly draggableRows = input(false);
  /**
   * localStorage key for state persistence (sort, hidden columns, page size).
   * Defaults to null (persistence disabled). Provide a unique key per table instance.
   */
  readonly storageKey = input<string | null>(null);
  /** CSV filename prefix when exporting */
  readonly exportFilename = input('table-export');

  // ── Outputs ─────────────────────────────────────────────────
  readonly sortChange = output<SortState>();
  readonly selectionChange = output<T[]>();
  readonly rowClick = output<T>();
  readonly pageChange = output<PageState>();
  readonly rowReordered = output<{ previousIndex: number; currentIndex: number; data: T[] }>();
  readonly filterChange = output<ColumnFilter[]>();

  // ── Content Children (cell templates) ───────────────────────
  readonly cellTemplates = contentChildren(DataTableCellDirective);

  // ── Internal State ──────────────────────────────────────────
  protected readonly searchQuery = signal('');
  protected readonly searchFocused = signal(false);
  protected readonly sortState = signal<SortState>({ column: '', direction: '' });
  protected readonly selectedKeys = signal<Set<string | number>>(new Set());
  protected readonly expandedKeys = signal<Set<string | number>>(new Set());
  protected readonly currentPageState = signal<PageState>({ pageIndex: 0, pageSize: 10, totalItems: 0 });

  /** Set of column keys that are hidden */
  protected readonly hiddenColumns = signal<Set<string>>(new Set());
  /** Whether the column visibility panel is open */
  protected readonly columnVisibilityOpen = signal(false);

  /** Active per-column filters */
  protected readonly activeFilters = signal<ColumnFilter[]>([]);
  /** Which column's filter popover is currently open (column key or null) */
  private readonly openFilterKey = signal<string | null>(null);
  /** Draft filter state per column (before apply) */
  private readonly filterDrafts = signal<Map<string, { operator: FilterOperator; value: string }>>(new Map());

  private readonly liveAnnouncer = inject(LiveAnnouncer);
  private readonly document = inject(DOCUMENT);

  // Debounce timer for search
  private searchDebounceTimer: ReturnType<typeof setTimeout> | null = null;
  private readonly internalSearchQuery = signal('');

  // Resize state
  private resizingColumn: DataTableColumnDef | null = null;
  private resizeStartX = 0;
  private resizeStartWidth = 0;
  private readonly resizeMouseMoveHandler = (e: MouseEvent) => this.onResizeMove(e);
  private readonly resizeMouseUpHandler = () => this.onResizeEnd();

  // Close col-vis panel on outside click
  private readonly outsideClickHandler = (e: MouseEvent) => {
    if (!this.columnVisibilityOpen()) return;
    const host = (e.target as HTMLElement).closest('.col-vis-btn, .col-vis-panel');
    if (!host) this.columnVisibilityOpen.set(false);
  };

  // Skeleton placeholder rows
  protected readonly skeletonRows = Array.from({ length: 8 }, (_, i) => i);
  private readonly skeletonWidths = ['60%', '80%', '45%', '70%', '55%', '75%', '40%', '90%'];

  constructor() {
    // Sync pageSize input to internal page state — guard prevents infinite CD loop
    effect(() => {
      const ps = this.pageSize();
      if (this.currentPageState().pageSize !== ps) {
        this.currentPageState.update((s) => ({ ...s, pageSize: ps, pageIndex: 0 }));
      }
    });

    // Load persisted state when storageKey becomes available
    effect(() => {
      const key = this.storageKey();
      if (key) {
        this.loadState(key);
      }
    });

    // Persist state on change
    effect(() => {
      const key = this.storageKey();
      const sort = this.sortState();
      const hidden = this.hiddenColumns();
      const pageSize = this.currentPageState().pageSize;
      if (key) {
        this.saveState(key, { sortState: sort, hiddenColumns: Array.from(hidden), pageSize });
      }
    });

    // Outside click handler for column visibility panel
    this.document.addEventListener('click', this.outsideClickHandler, true);
  }

  // ── Computed ────────────────────────────────────────────────

  /** Columns currently visible (hidden columns filtered out) */
  protected readonly visibleColumns = computed<DataTableColumnDef[]>(() => {
    const hidden = this.hiddenColumns();
    return this.columns().filter((col) => !hidden.has(col.key));
  });

  /** Total number of columns including selection/expand */
  protected readonly totalColumnCount = computed(() => {
    let count = this.visibleColumns().length;
    if (this.selectable()) count++;
    if (this.expandable()) count++;
    return count;
  });

  /** Filtered data (global search + per-column filters applied) */
  protected readonly filteredData = computed<T[]>(() => {
    const query = this.searchQuery().toLowerCase().trim();
    const filters = this.activeFilters();
    let items = this.data();

    // Apply global search
    if (query) {
      const cols = this.columns();
      items = items.filter((row) =>
        cols.some((col) => {
          const val = row[col.key];
          if (val == null) return false;
          return String(val).toLowerCase().includes(query);
        })
      );
    }

    // Apply per-column filters
    for (const filter of filters) {
      const { column, operator, value } = filter;
      const filterVal = value.toLowerCase().trim();
      if (!filterVal) continue;

      items = items.filter((row) => {
        const cell = row[column];
        if (cell == null) return false;
        const cellStr = String(cell).toLowerCase();
        const cellNum = parseFloat(String(cell));
        const filterNum = parseFloat(filterVal);

        switch (operator) {
          case 'contains':     return cellStr.includes(filterVal);
          case 'not-contains': return !cellStr.includes(filterVal);
          case 'equals':       return cellStr === filterVal;
          case 'not-equals':   return cellStr !== filterVal;
          case 'starts-with':  return cellStr.startsWith(filterVal);
          case 'ends-with':    return cellStr.endsWith(filterVal);
          case 'gt':           return !isNaN(cellNum) && !isNaN(filterNum) ? cellNum > filterNum : cellStr > filterVal;
          case 'lt':           return !isNaN(cellNum) && !isNaN(filterNum) ? cellNum < filterNum : cellStr < filterVal;
          case 'gte':          return !isNaN(cellNum) && !isNaN(filterNum) ? cellNum >= filterNum : cellStr >= filterVal;
          case 'lte':          return !isNaN(cellNum) && !isNaN(filterNum) ? cellNum <= filterNum : cellStr <= filterVal;
          default:             return true;
        }
      });
    }

    return items;
  });

  /** Sorted data (sort applied on top of filter) */
  protected readonly sortedData = computed<T[]>(() => {
    const items = [...this.filteredData()];
    const { column, direction } = this.sortState();
    if (!column || !direction) return items;

    return items.sort((a, b) => {
      const aVal = a[column];
      const bVal = b[column];

      // Handle nulls
      if (aVal == null && bVal == null) return 0;
      if (aVal == null) return direction === 'asc' ? -1 : 1;
      if (bVal == null) return direction === 'asc' ? 1 : -1;

      // Number comparison
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return direction === 'asc' ? aVal - bVal : bVal - aVal;
      }

      // String comparison
      const aStr = String(aVal).toLowerCase();
      const bStr = String(bVal).toLowerCase();
      const cmp = aStr.localeCompare(bStr);
      return direction === 'asc' ? cmp : -cmp;
    });
  });

  /** Paginated data (pagination applied on top of sort+filter) */
  protected readonly paginatedData = computed<T[]>(() => {
    const items = this.sortedData();
    const { pageIndex, pageSize } = this.currentPageState();
    const start = pageIndex * pageSize;
    return items.slice(start, start + pageSize);
  });

  /** Total pages */
  protected readonly totalPages = computed(() => {
    const total = this.filteredData().length;
    const ps = this.currentPageState().pageSize;
    return Math.max(1, Math.ceil(total / ps));
  });

  /** Range labels */
  protected readonly rangeStart = computed(() => {
    const { pageIndex, pageSize } = this.currentPageState();
    return this.filteredData().length === 0 ? 0 : pageIndex * pageSize + 1;
  });

  protected readonly rangeEnd = computed(() => {
    const { pageIndex, pageSize } = this.currentPageState();
    return Math.min((pageIndex + 1) * pageSize, this.filteredData().length);
  });

  /** Selection computed */
  protected readonly selectedRows = computed<T[]>(() => {
    const keys = this.selectedKeys();
    const trackBy = this.trackByFn();
    return this.data().filter((row) => keys.has(trackBy(row)));
  });

  protected readonly allSelected = computed(() => {
    const items = this.filteredData();
    if (items.length === 0) return false;
    const keys = this.selectedKeys();
    const trackBy = this.trackByFn();
    return items.every((row) => keys.has(trackBy(row)));
  });

  protected readonly someSelected = computed(() => {
    const keys = this.selectedKeys();
    if (keys.size === 0) return false;
    const trackBy = this.trackByFn();
    return this.filteredData().some((row) => keys.has(trackBy(row)));
  });

  // ── Template Helpers ────────────────────────────────────────

  protected getCellTemplate(key: string): TemplateRef<unknown> | null {
    const directive = this.cellTemplates().find((d) => d.appDataTableCell() === key);
    return directive ? directive.templateRef : null;
  }

  protected getCellValue(row: T, key: string): string {
    const val = row[key];
    if (val == null) return '';
    return String(val);
  }

  protected isRowSelected(row: T): boolean {
    return this.selectedKeys().has(this.trackByFn()(row));
  }

  protected isRowExpanded(row: T): boolean {
    return this.expandedKeys().has(this.trackByFn()(row));
  }

  protected ariaSort(colKey: string): string {
    const { column, direction } = this.sortState();
    if (column !== colKey || !direction) return 'none';
    return direction === 'asc' ? 'ascending' : 'descending';
  }

  protected sortIconClasses(colKey: string): string {
    const { column, direction } = this.sortState();
    if (column === colKey && direction) return 'sort-active';
    return 'sort-inactive';
  }

  protected headerAlignClass(col: DataTableColumnDef): string {
    switch (col.align) {
      case 'center': return 'justify-center';
      case 'end': return 'justify-end';
      default: return 'justify-start';
    }
  }

  protected skeletonWidth(index: number): string {
    return this.skeletonWidths[index % this.skeletonWidths.length];
  }

  // ── Column Visibility ────────────────────────────────────────

  protected toggleColumnVisibility(key: string): void {
    this.hiddenColumns.update((hidden) => {
      const next = new Set(hidden);
      if (next.has(key)) {
        next.delete(key);
      } else {
        // Don't hide the last visible column
        if (this.visibleColumns().length <= 1) return hidden;
        next.add(key);
      }
      return next;
    });
  }

  protected resetColumnVisibility(): void {
    this.hiddenColumns.set(new Set());
    this.columnVisibilityOpen.set(false);
    this.liveAnnouncer.announce('All columns visible', 'polite');
  }

  // ── Per-Column Filtering ─────────────────────────────────────

  /** Expose operator labels to template */
  protected readonly FILTER_OPERATOR_LABELS = FILTER_OPERATOR_LABELS;

  protected filterPopoverOpen(colKey: string): boolean {
    return this.openFilterKey() === colKey;
  }

  protected toggleFilterPopover(colKey: string): void {
    if (this.openFilterKey() === colKey) {
      this.openFilterKey.set(null);
    } else {
      this.openFilterKey.set(colKey);
      // Init draft from existing filter or default
      const existing = this.activeFilters().find((f) => f.column === colKey);
      this.filterDrafts.update((m) => {
        const next = new Map(m);
        next.set(colKey, {
          operator: existing?.operator ?? 'contains',
          value: existing?.value ?? '',
        });
        return next;
      });
    }
  }

  protected closeFilterPopover(colKey: string): void {
    if (this.openFilterKey() === colKey) {
      this.openFilterKey.set(null);
    }
  }

  protected getColumnFilter(colKey: string): ColumnFilter | undefined {
    return this.activeFilters().find((f) => f.column === colKey);
  }

  protected getFilterDraft(colKey: string): { operator: FilterOperator; value: string } {
    return this.filterDrafts().get(colKey) ?? { operator: 'contains', value: '' };
  }

  protected setFilterDraftOperator(colKey: string, event: Event): void {
    const op = (event.target as HTMLSelectElement).value as FilterOperator;
    this.filterDrafts.update((m) => {
      const next = new Map(m);
      const current = next.get(colKey) ?? { operator: 'contains', value: '' };
      next.set(colKey, { ...current, operator: op });
      return next;
    });
  }

  protected setFilterDraftValue(colKey: string, event: Event): void {
    const val = (event.target as HTMLInputElement).value;
    this.filterDrafts.update((m) => {
      const next = new Map(m);
      const current = next.get(colKey) ?? { operator: 'contains', value: '' };
      next.set(colKey, { ...current, value: val });
      return next;
    });
  }

  protected applyFilter(colKey: string): void {
    const draft = this.getFilterDraft(colKey);
    if (!draft.value.trim()) {
      this.clearColumnFilter(colKey);
      return;
    }
    this.activeFilters.update((filters) => {
      const without = filters.filter((f) => f.column !== colKey);
      return [
        ...without,
        { column: colKey, operator: draft.operator, value: draft.value.trim() },
      ];
    });
    this.currentPageState.update((s) => ({ ...s, pageIndex: 0 }));
    this.openFilterKey.set(null);
    this.filterChange.emit(this.activeFilters());
    const col = this.columns().find((c) => c.key === colKey);
    this.liveAnnouncer.announce(
      `Filter applied to ${col?.header ?? colKey}: ${FILTER_OPERATOR_LABELS[draft.operator]} "${draft.value.trim()}"`,
      'polite'
    );
  }

  protected clearColumnFilter(colKey: string): void {
    this.activeFilters.update((filters) => filters.filter((f) => f.column !== colKey));
    this.openFilterKey.set(null);
    this.filterChange.emit(this.activeFilters());
    const col = this.columns().find((c) => c.key === colKey);
    this.liveAnnouncer.announce(`Filter cleared for ${col?.header ?? colKey}`, 'polite');
  }

  clearAllFilters(): void {
    this.activeFilters.set([]);
    this.openFilterKey.set(null);
    this.currentPageState.update((s) => ({ ...s, pageIndex: 0 }));
    this.filterChange.emit([]);
    this.liveAnnouncer.announce('All column filters cleared', 'polite');
  }

  protected getFilterLabel(colKey: string): string {
    const filter = this.getColumnFilter(colKey);
    if (!filter) return '';
    return `${FILTER_OPERATOR_LABELS[filter.operator]}: "${filter.value}"`;
  }

  protected getAvailableOperators(colKey: string): FilterOperator[] {
    // Use all operators — numeric operators work on string comparisons too
    return ['contains', 'not-contains', 'equals', 'not-equals', 'starts-with', 'ends-with', 'gt', 'gte', 'lt', 'lte'];
  }

  protected getFilterPlaceholder(colKey: string): string {
    const draft = this.getFilterDraft(colKey);
    if (['gt', 'lt', 'gte', 'lte'].includes(draft.operator)) return 'Enter a number…';
    return 'Enter a value…';
  }

  /** Close open filter popovers on outside click */
  protected onDocumentClickForFilter(event: MouseEvent): void {
    if (!this.openFilterKey()) return;
    const target = event.target as HTMLElement;
    if (!target.closest('.filter-popover') && !target.closest('.filter-btn')) {
      this.openFilterKey.set(null);
    }
  }

  // ── CSV Export ───────────────────────────────────────────────

  exportToCsv(): void {
    const cols = this.visibleColumns();
    const rows = this.sortedData();

    // Build header row
    const header = cols.map((c) => `"${c.header.replace(/"/g, '""')}"`).join(',');

    // Build data rows
    const body = rows.map((row) =>
      cols.map((col) => {
        const val = row[col.key];
        if (val == null) return '';
        const str = String(val).replace(/"/g, '""');
        // Wrap in quotes if contains comma, newline, or quote
        return /[,"\n\r]/.test(str) ? `"${str}"` : str;
      }).join(',')
    );

    const csv = [header, ...body].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);

    const filename = `${this.exportFilename()}-${new Date().toISOString().slice(0, 10)}.csv`;
    const a = this.document.createElement('a');
    a.href = url;
    a.download = filename;
    a.style.display = 'none';
    this.document.body.appendChild(a);
    a.click();
    this.document.body.removeChild(a);
    URL.revokeObjectURL(url);

    this.liveAnnouncer.announce(`Table exported to ${filename}`, 'polite');
  }

  // ── State Persistence ────────────────────────────────────────

  private loadState(key: string): void {
    try {
      const raw = localStorage.getItem(`dt-state-${key}`);
      if (!raw) return;
      const state = JSON.parse(raw) as TablePersistedState;
      if (state.sortState) this.sortState.set(state.sortState);
      if (Array.isArray(state.hiddenColumns)) this.hiddenColumns.set(new Set(state.hiddenColumns));
      if (state.pageSize) {
        this.currentPageState.update((s) => ({ ...s, pageSize: state.pageSize, pageIndex: 0 }));
      }
    } catch {
      // Ignore invalid stored state
    }
  }

  private saveState(key: string, state: TablePersistedState): void {
    try {
      localStorage.setItem(`dt-state-${key}`, JSON.stringify(state));
    } catch {
      // Ignore storage errors
    }
  }

  // ── Actions ─────────────────────────────────────────────────

  /** Sort */
  protected toggleSort(colKey: string): void {
    const current = this.sortState();
    let direction: 'asc' | 'desc' | '';

    if (current.column !== colKey) {
      direction = 'asc';
    } else {
      switch (current.direction) {
        case '': direction = 'asc'; break;
        case 'asc': direction = 'desc'; break;
        case 'desc': direction = ''; break;
      }
    }

    const next: SortState = { column: direction ? colKey : '', direction };
    this.sortState.set(next);
    this.sortChange.emit(next);

    // Live announcement via CDK LiveAnnouncer
    if (direction) {
      const col = this.columns().find((c) => c.key === colKey);
      this.liveAnnouncer.announce(
        `Sorted by ${col?.header ?? colKey} ${direction === 'asc' ? 'ascending' : 'descending'}`,
        'polite'
      );
    } else {
      this.liveAnnouncer.announce('Sort cleared', 'polite');
    }
  }

  protected onHeaderSpaceKey(event: Event, col: DataTableColumnDef): void {
    if (!col.sortable || this.filterPopoverOpen(col.key)) return;
    event.preventDefault();
    this.toggleSort(col.key);
  }

  /** Search */
  protected onSearchInput(event: Event): void {
    const val = (event.target as HTMLInputElement).value;
    this.internalSearchQuery.set(val);

    if (this.searchDebounceTimer) clearTimeout(this.searchDebounceTimer);
    this.searchDebounceTimer = setTimeout(() => {
      this.searchQuery.set(val);
      // Reset to first page on search
      this.currentPageState.update((s) => ({ ...s, pageIndex: 0 }));

      this.liveAnnouncer.announce(
        val
          ? `Found ${this.filteredData().length} results for "${val}"`
          : 'Search cleared',
        'polite'
      );
    }, 250);
  }

  protected clearSearch(): void {
    this.searchQuery.set('');
    this.internalSearchQuery.set('');
    this.currentPageState.update((s) => ({ ...s, pageIndex: 0 }));
    this.liveAnnouncer.announce('Search cleared', 'polite');
  }

  /** Selection */
  protected toggleRowSelection(row: T): void {
    const key = this.trackByFn()(row);
    this.selectedKeys.update((keys) => {
      const next = new Set(keys);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
    this.selectionChange.emit(this.selectedRows());
  }

  protected toggleSelectAll(): void {
    const trackBy = this.trackByFn();
    if (this.allSelected()) {
      // Deselect all filtered items
      const filteredKeys = new Set(this.filteredData().map((r) => trackBy(r)));
      this.selectedKeys.update((keys) => {
        const next = new Set(keys);
        for (const k of filteredKeys) next.delete(k);
        return next;
      });
    } else {
      // Select all filtered items
      this.selectedKeys.update((keys) => {
        const next = new Set(keys);
        for (const row of this.filteredData()) next.add(trackBy(row));
        return next;
      });
    }
    this.selectionChange.emit(this.selectedRows());
  }

  /** Row click */
  protected onRowClick(row: T, event: Event): void {
    // Don't fire rowClick if clicking interactive elements inside the row
    const target = event.target as HTMLElement;
    if (target.closest('button, a, input, app-checkbox')) return;
    this.rowClick.emit(row);
  }

  /** Expand */
  protected toggleExpand(row: T, event: Event): void {
    event.stopPropagation();
    const key = this.trackByFn()(row);
    this.expandedKeys.update((keys) => {
      const next = new Set(keys);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  }

  /** Pagination */
  protected goToPage(index: number): void {
    if (index < 0 || index >= this.totalPages()) return;
    this.currentPageState.update((s) => ({ ...s, pageIndex: index }));
    this.pageChange.emit(this.currentPageState());
  }

  protected onPageSizeChange(event: Event): void {
    const size = Number((event.target as HTMLSelectElement).value);
    this.currentPageState.update((s) => ({
      ...s,
      pageSize: size,
      pageIndex: 0,
    }));
    this.pageChange.emit(this.currentPageState());
  }

  /** Resize */
  protected onResizeStart(event: MouseEvent | TouchEvent, col: DataTableColumnDef): void {
    event.preventDefault();
    event.stopPropagation();
    this.resizingColumn = col;

    const clientX = event instanceof MouseEvent ? event.clientX : event.touches[0].clientX;
    this.resizeStartX = clientX;

    // Get the header cell element to read its current width
    const th = (event.target as HTMLElement).closest('th');
    if (th) {
      this.resizeStartWidth = th.getBoundingClientRect().width;
    }

    document.addEventListener('mousemove', this.resizeMouseMoveHandler);
    document.addEventListener('mouseup', this.resizeMouseUpHandler);
    document.addEventListener('touchmove', this.resizeMouseMoveHandler as EventListener);
    document.addEventListener('touchend', this.resizeMouseUpHandler);
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  }

  private onResizeMove(event: MouseEvent): void {
    if (!this.resizingColumn) return;
    const delta = event.clientX - this.resizeStartX;
    const minW = parseInt(this.resizingColumn.minWidth || '80', 10);
    const newWidth = Math.max(minW, this.resizeStartWidth + delta);
    this.resizingColumn.width = newWidth + 'px';
  }

  private onResizeEnd(): void {
    this.resizingColumn = null;
    document.removeEventListener('mousemove', this.resizeMouseMoveHandler);
    document.removeEventListener('mouseup', this.resizeMouseUpHandler);
    document.removeEventListener('touchmove', this.resizeMouseMoveHandler as EventListener);
    document.removeEventListener('touchend', this.resizeMouseUpHandler);
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
  }

  // ── Drag & Drop ─────────────────────────────────────────────

  protected onRowDrop(event: CdkDragDrop<T[]>): void {
    if (event.previousIndex === event.currentIndex) return;

    // The event indices refer to the paginated view. We need to find the actual
    // indices in the original data array to reorder it correctly.
    const paginatedItems = this.paginatedData();
    const itemToMove = paginatedItems[event.previousIndex];
    if (!itemToMove) return;

    const dataArr = [...this.data()];
    const originalPrevIndex = dataArr.findIndex(
      (r) => this.trackByFn()(r) === this.trackByFn()(itemToMove)
    );

    let originalCurrentIndex: number;
    if (event.currentIndex === paginatedItems.length) {
      // Moved to the very end of the current page
      const prevItem = paginatedItems[event.currentIndex - 1];
      const prevOrigIdx = dataArr.findIndex(
        (r) => this.trackByFn()(r) === this.trackByFn()(prevItem)
      );
      originalCurrentIndex = prevOrigIdx + 1;
    } else {
      const targetItem = paginatedItems[event.currentIndex];
      originalCurrentIndex = dataArr.findIndex(
        (r) => this.trackByFn()(r) === this.trackByFn()(targetItem)
      );
    }

    if (originalPrevIndex > -1 && originalCurrentIndex > -1) {
      moveItemInArray(dataArr, originalPrevIndex, originalCurrentIndex);
      this.rowReordered.emit({
        previousIndex: originalPrevIndex,
        currentIndex: originalCurrentIndex,
        data: dataArr,
      });
    }
  }

  ngOnDestroy(): void {
    this.document.removeEventListener('click', this.outsideClickHandler, true);
    if (this.searchDebounceTimer) clearTimeout(this.searchDebounceTimer);
    document.removeEventListener('mousemove', this.resizeMouseMoveHandler);
    document.removeEventListener('mouseup', this.resizeMouseUpHandler);
  }
}
