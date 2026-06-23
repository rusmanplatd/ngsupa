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
} from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { LucideDynamicIcon } from '@lucide/angular';
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
  imports: [NgTemplateOutlet, LucideDynamicIcon, CheckboxComponent, EmptyStateComponent],
  host: {
    class: 'block',
  },
  template: `
    <!-- ─── Toolbar ─────────────────────────────────────── -->
    <div class="table-toolbar flex items-center gap-3 px-5 py-3.5">
      <!-- Search -->
      @if (searchable()) {
        <div
          class="search-wrapper relative flex items-center flex-1 max-w-xs rounded-xl border transition-all duration-normal"
          [class]="searchFocused()
            ? 'border-system-blue bg-[var(--surface-primary)]'
            : 'border-[var(--border-default)] bg-[var(--form-field-glass)] hover:border-[var(--border-opaque)]'"
          [style.box-shadow]="searchFocused() ? 'var(--form-field-shadow), var(--form-control-glow)' : 'var(--form-field-shadow)'"
        >
          <svg
            lucideIcon="search"
            [size]="15"
            class="ml-3 shrink-0 transition-colors duration-fast"
            [class]="searchFocused() ? 'text-system-blue' : 'text-[var(--text-tertiary)]'"
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
        <span class="selection-badge inline-flex items-center gap-1.5 rounded-full bg-[var(--interactive-tint)] px-3 py-1 text-xs font-semibold text-system-blue">
          {{ selectedRows().length }} selected
        </span>
      }

      <!-- Results count -->
      @if (searchQuery() && !loading()) {
        <span class="text-xs text-[var(--text-tertiary)]">
          {{ filteredData().length }} result{{ filteredData().length !== 1 ? 's' : '' }}
        </span>
      }

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
        [attr.aria-colcount]="columns().length + (selectable() ? 1 : 0) + (expandable() ? 1 : 0)"
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

            <!-- Data columns -->
            @for (col of columns(); track col.key) {
              <th
                role="columnheader"
                class="data-header-cell group"
                [class.sortable-header]="col.sortable"
                [class.sticky-col]="col.sticky"
                [style.width]="col.width || 'auto'"
                [style.min-width]="col.minWidth || '80px'"
                [style.text-align]="col.align || 'start'"
                [attr.aria-sort]="col.sortable ? ariaSort(col.key) : null"
                (click)="col.sortable ? toggleSort(col.key) : null"
                (keydown.enter)="col.sortable ? toggleSort(col.key) : null"
                (keydown.space)="col.sortable ? toggleSort(col.key) : null; $event.preventDefault()"
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
        <tbody>
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
                @for (col of columns(); track col.key) {
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
                [class.striped-row]="striped() && even"
                [class.selected-row]="isRowSelected(row)"
                [class.expanded-parent-row]="isRowExpanded(row)"
                [attr.aria-selected]="selectable() ? isRowSelected(row) : null"
                [attr.aria-expanded]="expandable() ? isRowExpanded(row) : null"
                [attr.aria-rowindex]="currentPageState().pageIndex * currentPageState().pageSize + idx + 1"
                (click)="onRowClick(row, $event)"
              >
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

                <!-- Data cells -->
                @for (col of columns(); track col.key) {
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

    <!-- ─── Live Region ─────────────────────────────────── -->
    <div class="sr-only" aria-live="polite" role="status">
      {{ liveAnnouncement() }}
    </div>
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

  // ── Outputs ─────────────────────────────────────────────────
  readonly sortChange = output<SortState>();
  readonly selectionChange = output<T[]>();
  readonly rowClick = output<T>();
  readonly pageChange = output<PageState>();

  // ── Content Children (cell templates) ───────────────────────
  readonly cellTemplates = contentChildren(DataTableCellDirective);

  // ── Internal State ──────────────────────────────────────────
  protected readonly searchQuery = signal('');
  protected readonly searchFocused = signal(false);
  protected readonly sortState = signal<SortState>({ column: '', direction: '' });
  protected readonly selectedKeys = signal<Set<string | number>>(new Set());
  protected readonly expandedKeys = signal<Set<string | number>>(new Set());
  protected readonly currentPageState = signal<PageState>({ pageIndex: 0, pageSize: 10, totalItems: 0 });
  protected readonly liveAnnouncement = signal('');

  // Debounce timer for search
  private searchDebounceTimer: ReturnType<typeof setTimeout> | null = null;
  private readonly internalSearchQuery = signal('');

  // Resize state
  private resizingColumn: DataTableColumnDef | null = null;
  private resizeStartX = 0;
  private resizeStartWidth = 0;
  private readonly resizeMouseMoveHandler = (e: MouseEvent) => this.onResizeMove(e);
  private readonly resizeMouseUpHandler = () => this.onResizeEnd();

  // Skeleton placeholder rows
  protected readonly skeletonRows = Array.from({ length: 8 }, (_, i) => i);
  private readonly skeletonWidths = ['60%', '80%', '45%', '70%', '55%', '75%', '40%', '90%'];

  constructor() {
    // Sync pageSize input to internal page state
    effect(() => {
      const ps = this.pageSize();
      this.currentPageState.update((s) => ({ ...s, pageSize: ps, pageIndex: 0 }));
    });
  }

  // ── Computed ────────────────────────────────────────────────

  /** Total number of columns including selection/expand */
  protected readonly totalColumnCount = computed(() => {
    let count = this.columns().length;
    if (this.selectable()) count++;
    if (this.expandable()) count++;
    return count;
  });

  /** Filtered data (search applied) */
  protected readonly filteredData = computed<T[]>(() => {
    const query = this.searchQuery().toLowerCase().trim();
    const items = this.data();
    if (!query) return items;

    const cols = this.columns();
    return items.filter((row) =>
      cols.some((col) => {
        const val = row[col.key];
        if (val == null) return false;
        return String(val).toLowerCase().includes(query);
      })
    );
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

    // Live announcement
    if (direction) {
      const col = this.columns().find((c) => c.key === colKey);
      this.liveAnnouncement.set(
        `Sorted by ${col?.header ?? colKey} ${direction === 'asc' ? 'ascending' : 'descending'}`
      );
    } else {
      this.liveAnnouncement.set('Sort cleared');
    }
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

      this.liveAnnouncement.set(
        val
          ? `Found ${this.filteredData().length} results for "${val}"`
          : 'Search cleared'
      );
    }, 250);
  }

  protected clearSearch(): void {
    this.searchQuery.set('');
    this.internalSearchQuery.set('');
    this.currentPageState.update((s) => ({ ...s, pageIndex: 0 }));
    this.liveAnnouncement.set('Search cleared');
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
}
