import {
  Component,
  input,
  output,
  signal,
  computed,
  viewChild,
  effect,
  type OnInit,
} from '@angular/core';
import { CdkTree, CdkTreeNode, CdkTreeNodeDef, CdkTreeNodeToggle, CdkTreeNodePadding } from '@angular/cdk/tree';
import { CdkContextMenuTrigger, CdkMenu, CdkMenuItem } from '@angular/cdk/menu';
import {
  CdkDrag,
  CdkDragHandle,
  CdkDragPreview,
  CdkDragPlaceholder,
  moveItemInArray,
  type CdkDragDrop,
} from '@angular/cdk/drag-drop';
import { LucideDynamicIcon } from '@lucide/angular';
import { CheckboxComponent } from '../checkbox/checkbox';

// ═══════════════════════════════════════════════════════════════
// Interfaces & Types
// ═══════════════════════════════════════════════════════════════

export interface TreeNode {
  id: string;
  label: string;
  icon?: string;
  children?: TreeNode[];
  disabled?: boolean;
  badge?: string;
}

export interface TreeNodeEditEvent {
  node: TreeNode;
  newLabel: string;
}

export interface TreeNodeDropEvent {
  node: TreeNode;
  previousParent: TreeNode | null;
  currentParent: TreeNode | null;
  previousIndex: number;
  currentIndex: number;
}

export type TreeContextAction =
  | 'expand-all'
  | 'collapse-all'
  | 'rename'
  | 'delete'
  | 'duplicate'
  | 'copy';

export interface TreeContextMenuEvent {
  node: TreeNode;
  action: TreeContextAction;
}

// ═══════════════════════════════════════════════════════════════
// Tree Component
// ═══════════════════════════════════════════════════════════════

@Component({
  selector: 'app-tree',
  imports: [
    CdkTree,
    CdkTreeNode,
    CdkTreeNodeDef,
    CdkTreeNodeToggle,
    CdkTreeNodePadding,
    CdkContextMenuTrigger,
    CdkMenu,
    CdkMenuItem,
    CdkDrag,
    CdkDragHandle,
    CdkDragPreview,
    CdkDragPlaceholder,
    LucideDynamicIcon,
    CheckboxComponent,
  ],
  host: {
    class: 'block',
  },
  template: `
    <!-- ─── Search Bar ─────────────────────────────────── -->
    @if (searchable()) {
      <div class="tree-search">
        <svg
          lucideIcon="search"
          [size]="15"
          class="tree-search-icon"
        />
        <input
          type="text"
          class="tree-search-input"
          [placeholder]="searchPlaceholder()"
          [value]="searchQuery()"
          (input)="onSearchInput($event)"
          aria-label="Search tree"
          autocomplete="off"
        />
        @if (searchQuery()) {
          <button
            type="button"
            class="tree-search-clear"
            aria-label="Clear search"
            (click)="clearSearch()"
          >
            <svg lucideIcon="x" [size]="11" />
          </button>
        }
      </div>
    }

    <!-- ─── Tree Container ─────────────────────────────── -->
    <div
      class="tree-container"
      [class.tree-lines]="showLines()"
    >
      <!-- Toolbar -->
      <div class="tree-toolbar">
        <button
          type="button"
          class="tree-toolbar-btn"
          aria-label="Expand all"
          (click)="expandAllNodes()"
        >
          <svg lucideIcon="chevrons-down" [size]="16" />
        </button>
        <button
          type="button"
          class="tree-toolbar-btn"
          aria-label="Collapse all"
          (click)="collapseAllNodes()"
        >
          <svg lucideIcon="chevrons-up" [size]="16" />
        </button>
        <div class="tree-toolbar-spacer"></div>
        @if (selectable() && checkedNodes().length > 0) {
          <span class="tree-toolbar-count">
            {{ checkedNodes().length }} checked
          </span>
        }
        @if (selectionMode() !== 'none' && selectedIds().size > 0) {
          <span class="tree-toolbar-count">
            {{ selectedIds().size }} selected
          </span>
          <button
            type="button"
            class="tree-toolbar-btn"
            aria-label="Clear selection"
            (click)="clearSelection()"
          >
            <svg lucideIcon="x" [size]="14" />
          </button>
        }
      </div>

      <!-- CDK Tree -->
      @if (filteredData().length > 0) {
        <cdk-tree
          [dataSource]="filteredData()"
          [childrenAccessor]="childrenAccessor"
          [trackBy]="trackById"
          role="tree"
          [attr.aria-label]="'Tree'"
          [attr.aria-multiselectable]="selectionMode() === 'multiple' || null"
          [tabindex]="focusedNodeId() ? -1 : 0"
          (keydown)="onTreeKeydown($event)"
          (focus)="onTreeFocus($event)"
          #cdkTree
        >
          <cdk-tree-node
            *cdkTreeNodeDef="let node"
            cdkTreeNodePadding
            [cdkTreeNodePaddingIndent]="indent()"
            [cdkContextMenuTriggerFor]="contextMenu() ? nodeMenu : null"
            [cdkContextMenuTriggerData]="{ node: node }"
          >
            <div
              class="tree-node"
              role="treeitem"
              [attr.id]="'tree-node-' + node.id"
              [attr.aria-selected]="selectionMode() !== 'none' ? isSelected(node) : null"
              [attr.aria-expanded]="hasChildren(node) ? cdkTree.isExpanded(node) : null"
              [attr.aria-disabled]="node.disabled || null"
              [attr.aria-label]="node.label"
              [tabindex]="focusedNodeId() === node.id ? 0 : -1"
              [class.tree-node--selected]="isSelected(node)"
              [class.tree-node--focused]="focusedNodeId() === node.id"
              [class.tree-node--disabled]="node.disabled"
              [class.tree-node--editing]="editingNodeId() === node.id"
              (click)="onNodeClick(node, $event)"
              (dblclick)="onNodeDblClick(node)"
              (focus)="onNodeFocus(node)"
              (keydown)="onNodeKeydown($event, node)"
              cdkDrag
              [cdkDragData]="node"
              [cdkDragDisabled]="!draggable() || !!node.disabled"
            >
              <!-- Drag handle -->
              @if (draggable() && !node.disabled) {
                <span cdkDragHandle class="tree-drag-handle">
                  <svg lucideIcon="grip-vertical" [size]="14" />
                </span>
              }

              <!-- Expand/Collapse toggle -->
              <button
                type="button"
                class="tree-toggle"
                [class.tree-toggle--expanded]="cdkTree.isExpanded(node)"
                [class.tree-toggle--leaf]="!hasChildren(node)"
                [class.tree-toggle--loading]="loadingNodeIds().has(node.id)"
                cdkTreeNodeToggle
                [attr.aria-label]="cdkTree.isExpanded(node) ? 'Collapse ' + node.label : 'Expand ' + node.label"
                [tabIndex]="-1"
                (click)="onToggleClick(node)"
              >
                @if (loadingNodeIds().has(node.id)) {
                  <!-- Loading spinner -->
                  <svg class="tree-toggle-spinner" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
                    <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
                  </svg>
                } @else {
                  <svg
                    lucideIcon="chevron-right"
                    [size]="14"
                    class="tree-toggle-icon"
                  />
                }
              </button>

              <!-- Checkbox -->
              @if (selectable()) {
                <app-checkbox
                  class="tree-checkbox"
                  [checked]="isNodeChecked(node)"
                  [indeterminate]="isNodeIndeterminate(node)"
                  [ariaLabel]="'Select ' + node.label"
                  (checkedChange)="toggleCheck(node)"
                />
              }

              <!-- Icon -->
              @if (showIcons()) {
                <span
                  class="tree-node-icon"
                  [class.tree-node-icon--folder]="hasChildren(node) && !node.icon"
                >
                  <svg
                    [lucideIcon]="getNodeIcon(node)"
                    [size]="18"
                  />
                </span>
              }

              <!-- Label / Edit Input -->
              @if (editingNodeId() === node.id) {
                <input
                  #editInput
                  type="text"
                  class="tree-edit-input"
                  [value]="node.label"
                  (keydown.enter)="commitEdit(node, $event)"
                  (keydown.escape)="cancelEdit()"
                  (blur)="commitEdit(node, $event)"
                  aria-label="Rename node"
                  autocomplete="off"
                />
              } @else {
                <span class="tree-node-label" [innerHTML]="getHighlightedLabel(node)"></span>
              }

              <!-- Badge -->
              @if (node.badge) {
                <span class="tree-node-badge">{{ node.badge }}</span>
              }

              <!-- Drag preview -->
              <div *cdkDragPreview class="tree-drag-preview">
                <svg
                  [lucideIcon]="getNodeIcon(node)"
                  [size]="16"
                  class="tree-drag-preview-icon"
                />
                {{ node.label }}
              </div>

              <!-- Drag placeholder -->
              <div *cdkDragPlaceholder class="tree-drop-placeholder"></div>
            </div>
          </cdk-tree-node>
        </cdk-tree>
      } @else {
        <!-- Empty state -->
        <div class="tree-empty">
          <svg lucideIcon="folder-open" [size]="40" class="tree-empty-icon" />
          <p class="tree-empty-title">
            {{ searchQuery() ? 'No results' : 'No items' }}
          </p>
          <p class="tree-empty-description">
            {{ searchQuery() ? 'Try adjusting your search terms' : 'This tree is empty' }}
          </p>
        </div>
      }
    </div>

    <!-- ─── Context Menu Template (CDK Menu) ──────────── -->
    <ng-template #nodeMenu let-data>
      <div cdkMenu class="tree-context-menu">
        <button
          cdkMenuItem
          class="tree-context-item"
          (cdkMenuItemTriggered)="onContextAction('expand-all', data.node)"
        >
          <svg lucideIcon="chevrons-down" [size]="16" />
          <span class="tree-context-item-label">Expand All</span>
        </button>
        <button
          cdkMenuItem
          class="tree-context-item"
          (cdkMenuItemTriggered)="onContextAction('collapse-all', data.node)"
        >
          <svg lucideIcon="chevrons-up" [size]="16" />
          <span class="tree-context-item-label">Collapse All</span>
        </button>
        <hr class="tree-context-separator" />
        @if (editable()) {
          <button
            cdkMenuItem
            class="tree-context-item"
            (cdkMenuItemTriggered)="onContextAction('rename', data.node)"
          >
            <svg lucideIcon="pencil" [size]="16" />
            <span class="tree-context-item-label">Rename</span>
            <span class="tree-context-item-shortcut">F2</span>
          </button>
        }
        <button
          cdkMenuItem
          class="tree-context-item"
          (cdkMenuItemTriggered)="onContextAction('duplicate', data.node)"
        >
          <svg lucideIcon="copy" [size]="16" />
          <span class="tree-context-item-label">Duplicate</span>
        </button>
        <button
          cdkMenuItem
          class="tree-context-item"
          (cdkMenuItemTriggered)="onContextAction('copy', data.node)"
        >
          <svg lucideIcon="clipboard-copy" [size]="16" />
          <span class="tree-context-item-label">Copy Name</span>
        </button>
        <hr class="tree-context-separator" />
        <button
          cdkMenuItem
          class="tree-context-item tree-context-item--destructive"
          (cdkMenuItemTriggered)="onContextAction('delete', data.node)"
        >
          <svg lucideIcon="trash-2" [size]="16" />
          <span class="tree-context-item-label">Delete</span>
          <span class="tree-context-item-shortcut">⌫</span>
        </button>
      </div>
    </ng-template>

    <!-- ─── Live Region ───────────────────────────────── -->
    <div class="sr-only" aria-live="polite" role="status">
      {{ liveAnnouncement() }}
    </div>
  `,
  styleUrl: './tree.css',
})
export class TreeComponent implements OnInit {
  // ── Inputs ──────────────────────────────────────────────────
  readonly data = input.required<TreeNode[]>();
  readonly selectable = input(false);
  readonly expandAllOnInit = input(false);
  readonly indent = input(24);
  readonly showLines = input(false);
  readonly showIcons = input(true);
  readonly editable = input(false);
  readonly draggable = input(false);
  readonly contextMenu = input(true);
  readonly searchable = input(false);
  readonly searchPlaceholder = input('Search…');
  readonly selectionMode = input<'none' | 'single' | 'multiple'>('single');
  /**
   * Optional async children loader. When provided, nodes without static children
   * will call this function on first expand to lazily load their children.
   * The node is treated as expandable (shows toggle) until it has been loaded.
   */
  readonly loadChildrenFn = input<((node: TreeNode) => Promise<TreeNode[]>) | null>(null);

  // ── Outputs ─────────────────────────────────────────────────
  readonly nodeClick = output<TreeNode>();
  readonly selectionChange = output<TreeNode[]>();
  readonly nodeEdit = output<TreeNodeEditEvent>();
  readonly nodeDrop = output<TreeNodeDropEvent>();
  readonly contextAction = output<TreeContextMenuEvent>();

  // ── ViewChild ───────────────────────────────────────────────
  readonly cdkTree = viewChild<CdkTree<TreeNode>>('cdkTree');

  // ── Internal State ──────────────────────────────────────────
  protected readonly searchQuery = signal('');
  protected readonly selectedIds = signal<Set<string>>(new Set());
  protected readonly lastSelectedId = signal<string | null>(null);
  protected readonly editingNodeId = signal<string | null>(null);
  protected readonly checkedIds = signal<Set<string>>(new Set());
  protected readonly liveAnnouncement = signal('');
  protected readonly focusedNodeId = signal<string | null>(null);

  /** IDs of nodes currently loading async children */
  protected readonly loadingNodeIds = signal<Set<string>>(new Set());
  /** Map of node id -> lazily loaded children */
  private readonly asyncChildrenMap = signal<Map<string, TreeNode[]>>(new Map());

  // IDs to force-expand for search
  private readonly forceExpandIds = signal<Set<string>>(new Set());

  // Type-ahead state
  private typeaheadBuffer = '';
  private typeaheadTimer: ReturnType<typeof setTimeout> | null = null;

  // ── CDK childrenAccessor ────────────────────────────────────
  /** Returns children for a node, including async-loaded ones. */
  readonly childrenAccessor = (node: TreeNode): TreeNode[] => {
    const asyncChildren = this.asyncChildrenMap().get(node.id);
    if (asyncChildren !== undefined) return asyncChildren;
    return node.children ?? [];
  };

  readonly trackById = (_index: number, node: TreeNode): string => node.id;

  // ── Computed ────────────────────────────────────────────────

  /** Flat list of all checked nodes (checkbox selection) */
  protected readonly checkedNodes = computed(() => {
    const ids = this.checkedIds();
    const result: TreeNode[] = [];
    const collect = (nodes: TreeNode[]) => {
      for (const node of nodes) {
        if (ids.has(node.id)) result.push(node);
        if (node.children) collect(node.children);
      }
    };
    collect(this.data());
    return result;
  });

  /** Flat list of all click-selected nodes */
  protected readonly selectedNodes = computed(() => {
    const ids = this.selectedIds();
    const result: TreeNode[] = [];
    const collect = (nodes: TreeNode[]) => {
      for (const node of nodes) {
        if (ids.has(node.id)) result.push(node);
        if (node.children) collect(node.children);
      }
    };
    collect(this.data());
    return result;
  });

  /** Filtered data based on search query */
  protected readonly filteredData = computed(() => {
    const query = this.searchQuery().toLowerCase().trim();
    if (!query) return this.data();

    // Find matching nodes and keep their ancestors
    const matchingIds = new Set<string>();
    const ancestorIds = new Set<string>();

    const findMatches = (nodes: TreeNode[], ancestors: TreeNode[]) => {
      for (const node of nodes) {
        if (node.label.toLowerCase().includes(query)) {
          matchingIds.add(node.id);
          for (const a of ancestors) {
            ancestorIds.add(a.id);
          }
        }
        if (node.children) {
          findMatches(node.children, [...ancestors, node]);
        }
      }
    };
    findMatches(this.data(), []);

    // Update force-expand for matching ancestors
    this.forceExpandIds.set(ancestorIds);

    if (matchingIds.size === 0 && ancestorIds.size === 0) {
      return [];
    }

    // Return full data — the tree will auto-expand ancestors
    return this.data();
  });

  // ── Lifecycle ───────────────────────────────────────────────

  constructor() {
    // Auto-expand ancestor nodes when searching
    effect(() => {
      const ids = this.forceExpandIds();
      const tree = this.cdkTree();
      if (!tree || ids.size === 0) return;

      // Expand all ancestors of matching nodes
      const expandAncestors = (nodes: TreeNode[]) => {
        for (const node of nodes) {
          if (ids.has(node.id)) {
            tree.expand(node);
          }
          if (node.children) expandAncestors(node.children);
        }
      };
      expandAncestors(this.data());
    });
  }

  ngOnInit(): void {
    if (this.expandAllOnInit()) {
      // Defer to after tree renders
      queueMicrotask(() => this.expandAllNodes());
    }
  }

  // ── Keyboard Navigation Helpers ─────────────────────────────

  /**
   * Returns a flat, in-order list of all currently *visible* nodes
   * (i.e. root nodes plus children of expanded parents).
   */
  private getVisibleNodes(): TreeNode[] {
    const tree = this.cdkTree();
    const result: TreeNode[] = [];

    const walk = (nodes: TreeNode[]) => {
      for (const node of nodes) {
        result.push(node);
        if (node.children && node.children.length > 0 && tree?.isExpanded(node)) {
          walk(node.children);
        }
      }
    };
    walk(this.filteredData());
    return result;
  }

  /**
   * Finds the direct parent of a given node in the data tree.
   */
  private findParent(nodeId: string, nodes: TreeNode[], parent: TreeNode | null = null): TreeNode | null {
    for (const n of nodes) {
      if (n.id === nodeId) return parent;
      if (n.children) {
        const found = this.findParent(nodeId, n.children, n);
        if (found !== undefined) return found;
      }
    }
    return undefined as unknown as TreeNode | null;
  }

  /** Focus a node by id — scrolls it into view */
  private focusNode(node: TreeNode): void {
    this.focusedNodeId.set(node.id);
    this.liveAnnouncement.set(node.label);
    queueMicrotask(() => {
      const el = document.getElementById(`tree-node-${node.id}`);
      el?.focus({ preventScroll: false });
    });
  }

  // ── Tree-level keyboard handler (when tree wrapper has focus) ─

  protected onTreeFocus(event: FocusEvent): void {
    // If focus arrives on the tree wrapper itself (not a child), focus the
    // previously focused node or the first visible node.
    const target = event.target as HTMLElement;
    if (target.getAttribute('role') === 'tree') {
      const visible = this.getVisibleNodes();
      if (visible.length === 0) return;
      const current = this.focusedNodeId();
      const node = visible.find((n) => n.id === current) ?? visible[0];
      this.focusNode(node);
    }
  }

  protected onTreeKeydown(event: KeyboardEvent): void {
    // Handled per-node; this catches keys fired on the wrapper itself
    const target = event.target as HTMLElement;
    if (target.getAttribute('role') === 'tree') {
      this.handleTreeKey(event);
    }
  }

  // ── Per-node keyboard handler ────────────────────────────────

  protected onNodeFocus(node: TreeNode): void {
    this.focusedNodeId.set(node.id);
  }

  protected onNodeKeydown(event: KeyboardEvent, node: TreeNode): void {
    this.handleTreeKey(event, node);
  }

  private handleTreeKey(event: KeyboardEvent, node?: TreeNode): void {
    const tree = this.cdkTree();
    if (!tree) return;

    const visible = this.getVisibleNodes();
    if (visible.length === 0) return;

    const currentNode = node ?? visible.find((n) => n.id === this.focusedNodeId()) ?? visible[0];
    const idx = visible.findIndex((n) => n.id === currentNode.id);

    switch (event.key) {
      case 'ArrowDown': {
        event.preventDefault();
        const next = visible[idx + 1];
        if (next) this.focusNode(next);
        break;
      }

      case 'ArrowUp': {
        event.preventDefault();
        const prev = visible[idx - 1];
        if (prev) this.focusNode(prev);
        break;
      }

      case 'ArrowRight': {
        event.preventDefault();
        if (this.hasChildren(currentNode)) {
          if (!tree.isExpanded(currentNode)) {
            tree.expand(currentNode);
            this.liveAnnouncement.set(`${currentNode.label} expanded`);
          } else {
            // Move to first child
            const firstChild = visible[idx + 1];
            if (firstChild) this.focusNode(firstChild);
          }
        }
        break;
      }

      case 'ArrowLeft': {
        event.preventDefault();
        if (this.hasChildren(currentNode) && tree.isExpanded(currentNode)) {
          tree.collapse(currentNode);
          this.liveAnnouncement.set(`${currentNode.label} collapsed`);
        } else {
          // Move to parent
          const parent = this.findParent(currentNode.id, this.filteredData());
          if (parent) this.focusNode(parent);
        }
        break;
      }

      case 'Home': {
        event.preventDefault();
        const first = visible[0];
        if (first) this.focusNode(first);
        break;
      }

      case 'End': {
        event.preventDefault();
        const last = visible[visible.length - 1];
        if (last) this.focusNode(last);
        break;
      }

      case 'Enter':
      case ' ': {
        event.preventDefault();
        if (currentNode.disabled) break;
        if (this.selectable()) {
          this.toggleCheck(currentNode);
        }
        this.nodeClick.emit(currentNode);
        this.selectNode(currentNode);
        break;
      }

      case 'F2': {
        event.preventDefault();
        this.startEditing(currentNode);
        break;
      }

      case '*': {
        event.preventDefault();
        // Expand all siblings (nodes at the same level)
        const parent = this.findParent(currentNode.id, this.filteredData());
        const siblings = parent ? (parent.children ?? []) : this.filteredData();
        for (const sibling of siblings) {
          if (this.hasChildren(sibling)) tree.expand(sibling);
        }
        this.liveAnnouncement.set('Siblings expanded');
        break;
      }

      default: {
        // Type-ahead: focus next node whose label starts with the typed character
        if (event.key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey) {
          event.preventDefault();
          this.handleTypeahead(event.key, visible, idx);
        }
        break;
      }
    }
  }

  private handleTypeahead(char: string, visible: TreeNode[], currentIdx: number): void {
    if (this.typeaheadTimer !== null) {
      clearTimeout(this.typeaheadTimer);
    }
    this.typeaheadBuffer += char.toLowerCase();
    this.typeaheadTimer = setTimeout(() => {
      this.typeaheadBuffer = '';
      this.typeaheadTimer = null;
    }, 500);

    const query = this.typeaheadBuffer;
    // Search from node after current, then wrap around
    const afterCurrent = [...visible.slice(currentIdx + 1), ...visible.slice(0, currentIdx + 1)];
    const match = afterCurrent.find((n) => n.label.toLowerCase().startsWith(query));
    if (match) this.focusNode(match);
  }

  // ── Node Helpers ────────────────────────────────────────────

  protected hasChildren(node: TreeNode): boolean {
    const asyncChildren = this.asyncChildrenMap().get(node.id);
    if (asyncChildren !== undefined) return asyncChildren.length > 0;
    // If a loadChildrenFn is provided and node has no static children, treat it as expandable
    if (this.loadChildrenFn() && !node.children) return true;
    return !!node.children && node.children.length > 0;
  }

  /**
   * Called when the toggle button is clicked. If the node is being expanded
   * for the first time and a loadChildrenFn is provided, trigger async loading.
   * The cdkTreeNodeToggle directive handles the actual expand/collapse.
   */
  protected onToggleClick(node: TreeNode): void {
    const fn = this.loadChildrenFn();
    if (!fn) return;
    // Only load if: not already loaded, not currently loading, and node has no static children
    if (
      !this.asyncChildrenMap().has(node.id) &&
      !this.loadingNodeIds().has(node.id) &&
      !node.children
    ) {
      this.loadingNodeIds.update((ids) => {
        const next = new Set(ids);
        next.add(node.id);
        return next;
      });
      this.liveAnnouncement.set(`Loading children for ${node.label}`);

      fn(node).then((children) => {
        this.asyncChildrenMap.update((map) => {
          const next = new Map(map);
          next.set(node.id, children);
          return next;
        });
        this.loadingNodeIds.update((ids) => {
          const next = new Set(ids);
          next.delete(node.id);
          return next;
        });
        this.liveAnnouncement.set(
          `${node.label} loaded ${children.length} ${children.length === 1 ? 'item' : 'items'}`
        );
      }).catch(() => {
        this.loadingNodeIds.update((ids) => {
          const next = new Set(ids);
          next.delete(node.id);
          return next;
        });
        this.liveAnnouncement.set(`Failed to load children for ${node.label}`);
      });
    }
  }

  protected getNodeIcon(node: TreeNode): string {
    if (node.icon) return node.icon;
    if (this.hasChildren(node)) return 'folder';
    return 'file';
  }

  protected getHighlightedLabel(node: TreeNode): string {
    const query = this.searchQuery().toLowerCase().trim();
    if (!query) return this.escapeHtml(node.label);

    const label = node.label;
    const lowerLabel = label.toLowerCase();
    const idx = lowerLabel.indexOf(query);
    if (idx === -1) return this.escapeHtml(label);

    const before = this.escapeHtml(label.slice(0, idx));
    const match = this.escapeHtml(label.slice(idx, idx + query.length));
    const after = this.escapeHtml(label.slice(idx + query.length));

    return `${before}<span class="tree-highlight">${match}</span>${after}`;
  }

  private escapeHtml(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  // ── Click Handlers ──────────────────────────────────────────

  protected onNodeClick(node: TreeNode, event: Event): void {
    if (node.disabled) return;
    // Don't trigger if clicking interactive children
    const target = event.target as HTMLElement;
    if (target.closest('button, input, app-checkbox, .tree-drag-handle')) return;

    this.nodeClick.emit(node);
    this.selectNode(node, event as MouseEvent);
  }

  protected onNodeDblClick(node: TreeNode): void {
    if (this.editable() && !node.disabled) {
      this.startEditing(node);
    }
  }

  // ── Selection (click-based) ────────────────────────────────

  protected isSelected(node: TreeNode): boolean {
    return this.selectedIds().has(node.id);
  }

  /**
   * Core selection logic — handles single, multiple (Ctrl/Shift) and none modes.
   */
  private selectNode(node: TreeNode, event?: MouseEvent): void {
    const mode = this.selectionMode();
    if (mode === 'none') return;

    if (mode === 'single') {
      // Toggle off if already the only selection, otherwise select
      const alreadySelected = this.selectedIds().has(node.id) && this.selectedIds().size === 1;
      this.selectedIds.set(alreadySelected ? new Set() : new Set([node.id]));
      this.lastSelectedId.set(alreadySelected ? null : node.id);
    } else {
      // multiple mode
      const isCtrl = event ? event.ctrlKey || event.metaKey : false;
      const isShift = event ? event.shiftKey : false;

      if (isShift && this.lastSelectedId()) {
        // Range-select from anchor to this node
        this.selectRange(this.lastSelectedId()!, node.id);
      } else if (isCtrl) {
        // Toggle this node while keeping others
        this.selectedIds.update((ids) => {
          const next = new Set(ids);
          if (next.has(node.id)) {
            next.delete(node.id);
          } else {
            next.add(node.id);
            this.lastSelectedId.set(node.id);
          }
          return next;
        });
      } else {
        // Plain click — select single (toggle off if only one selected)
        const alreadyOnly = this.selectedIds().has(node.id) && this.selectedIds().size === 1;
        this.selectedIds.set(alreadyOnly ? new Set() : new Set([node.id]));
        this.lastSelectedId.set(alreadyOnly ? null : node.id);
      }
    }

    this.selectionChange.emit(this.selectedNodes());
  }

  /**
   * Selects all visible nodes between two node IDs (inclusive).
   * Preserves existing selection outside the range.
   */
  private selectRange(fromId: string, toId: string): void {
    const visible = this.getVisibleNodes();
    const fromIdx = visible.findIndex((n) => n.id === fromId);
    const toIdx = visible.findIndex((n) => n.id === toId);
    if (fromIdx === -1 || toIdx === -1) return;

    const [start, end] = fromIdx <= toIdx ? [fromIdx, toIdx] : [toIdx, fromIdx];
    this.selectedIds.update((ids) => {
      const next = new Set(ids);
      for (let i = start; i <= end; i++) {
        next.add(visible[i].id);
      }
      return next;
    });
  }

  /** Clears all click-based selected nodes. */
  clearSelection(): void {
    this.selectedIds.set(new Set());
    this.lastSelectedId.set(null);
    this.selectionChange.emit([]);
    this.liveAnnouncement.set('Selection cleared');
  }

  // ── Expand / Collapse ───────────────────────────────────────

  expandAllNodes(): void {
    this.cdkTree()?.expandAll();
    this.liveAnnouncement.set('All nodes expanded');
  }

  collapseAllNodes(): void {
    this.cdkTree()?.collapseAll();
    this.liveAnnouncement.set('All nodes collapsed');
  }

  // ── Checkbox Selection (tri-state) ──────────────────────────

  protected isNodeChecked(node: TreeNode): boolean {
    const ids = this.checkedIds();
    // A node is checked if it and all its descendants are checked
    if (!ids.has(node.id)) return false;
    if (!node.children || node.children.length === 0) return true;
    return this.allDescendantsChecked(node, ids);
  }

  protected isNodeIndeterminate(node: TreeNode): boolean {
    if (!node.children || node.children.length === 0) return false;
    const ids = this.checkedIds();
    const someChecked = this.someDescendantsChecked(node, ids);
    const allChecked = this.allDescendantsChecked(node, ids);
    return someChecked && !allChecked;
  }

  protected toggleCheck(node: TreeNode): void {
    this.checkedIds.update((ids) => {
      const next = new Set(ids);
      const shouldCheck = !this.isNodeChecked(node);

      if (shouldCheck) {
        next.add(node.id);
        this.addDescendants(node, next);
      } else {
        next.delete(node.id);
        this.removeDescendants(node, next);
      }

      // Update ancestors
      this.updateAncestors(this.data(), null, next);

      return next;
    });

    this.selectionChange.emit(this.checkedNodes());
  }

  private allDescendantsChecked(node: TreeNode, ids: Set<string>): boolean {
    if (!node.children) return true;
    return node.children.every(
      (c) => ids.has(c.id) && this.allDescendantsChecked(c, ids),
    );
  }

  private someDescendantsChecked(node: TreeNode, ids: Set<string>): boolean {
    if (!node.children) return ids.has(node.id);
    return node.children.some(
      (c) => ids.has(c.id) || this.someDescendantsChecked(c, ids),
    );
  }

  private addDescendants(node: TreeNode, ids: Set<string>): void {
    if (!node.children) return;
    for (const child of node.children) {
      ids.add(child.id);
      this.addDescendants(child, ids);
    }
  }

  private removeDescendants(node: TreeNode, ids: Set<string>): void {
    if (!node.children) return;
    for (const child of node.children) {
      ids.delete(child.id);
      this.removeDescendants(child, ids);
    }
  }

  private updateAncestors(
    nodes: TreeNode[],
    parent: TreeNode | null,
    ids: Set<string>,
  ): void {
    for (const node of nodes) {
      if (node.children && node.children.length > 0) {
        this.updateAncestors(node.children, node, ids);
        const allChecked = node.children.every(
          (c) => ids.has(c.id) && this.allDescendantsChecked(c, ids),
        );
        if (allChecked) {
          ids.add(node.id);
        } else {
          ids.delete(node.id);
        }
      }
    }
  }

  // ── Inline Editing ──────────────────────────────────────────

  protected startEditing(node: TreeNode): void {
    if (!this.editable() || node.disabled) return;
    this.editingNodeId.set(node.id);

    // Focus the input after render
    queueMicrotask(() => {
      const input = document.querySelector('.tree-edit-input') as HTMLInputElement;
      if (input) {
        input.focus();
        input.select();
      }
    });
  }

  protected commitEdit(node: TreeNode, event: Event): void {
    const input = event.target as HTMLInputElement;
    const newLabel = input.value.trim();

    if (newLabel && newLabel !== node.label) {
      this.nodeEdit.emit({ node, newLabel });
    }
    this.editingNodeId.set(null);
  }

  protected cancelEdit(): void {
    this.editingNodeId.set(null);
  }

  // ── Search ──────────────────────────────────────────────────

  protected onSearchInput(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.searchQuery.set(value);

    if (value.trim()) {
      const count = this.countMatches(this.data(), value.toLowerCase().trim());
      this.liveAnnouncement.set(
        `Found ${count} result${count !== 1 ? 's' : ''} for "${value}"`,
      );
    } else {
      this.liveAnnouncement.set('Search cleared');
    }
  }

  protected clearSearch(): void {
    this.searchQuery.set('');
    this.forceExpandIds.set(new Set());
    this.liveAnnouncement.set('Search cleared');
  }

  private countMatches(nodes: TreeNode[], query: string): number {
    let count = 0;
    for (const node of nodes) {
      if (node.label.toLowerCase().includes(query)) count++;
      if (node.children) count += this.countMatches(node.children, query);
    }
    return count;
  }

  // ── Drag & Drop ─────────────────────────────────────────────

  protected onDrop(event: CdkDragDrop<TreeNode[]>): void {
    if (event.previousContainer === event.container) {
      const list = event.container.data;
      if (list) {
        moveItemInArray(list, event.previousIndex, event.currentIndex);
        this.nodeDrop.emit({
          node: event.item.data,
          previousParent: null,
          currentParent: null,
          previousIndex: event.previousIndex,
          currentIndex: event.currentIndex,
        });
      }
    }
  }

  // ── Context Menu ────────────────────────────────────────────

  protected onContextAction(action: TreeContextAction, node: TreeNode): void {
    switch (action) {
      case 'expand-all':
        this.cdkTree()?.expandDescendants(node);
        this.liveAnnouncement.set(`Expanded ${node.label} and all children`);
        break;
      case 'collapse-all':
        this.cdkTree()?.collapseDescendants(node);
        this.liveAnnouncement.set(`Collapsed ${node.label} and all children`);
        break;
      case 'rename':
        this.startEditing(node);
        break;
      default:
        break;
    }
    this.contextAction.emit({ node, action });
  }
}
