import {
  Component,
  ElementRef,
  input,
  output,
  signal,
  computed,
  model,
  inject,
  afterNextRender,
  DestroyRef,
  InjectionToken,
  OnInit,
  OnDestroy,
  PLATFORM_ID,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

// ─── Types ────────────────────────────────────────────────────────────────────

export type ResizableDirection = 'horizontal' | 'vertical';

export interface ResizableLayout {
  sizes: number[];
  timestamp: number;
}

// ─── Utilities ────────────────────────────────────────────────────────────────

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function roundTo(value: number, decimals = 4): number {
  const factor = Math.pow(10, decimals);
  return Math.round(value * factor) / factor;
}

// ─── Injection Tokens ─────────────────────────────────────────────────────────

export const RESIZABLE_GROUP = new InjectionToken<ResizablePanelGroupComponent>(
  'ResizablePanelGroup'
);

// ─── ResizablePanelComponent ─────────────────────────────────────────────────

@Component({
  selector: 'app-resizable-panel',
  host: {
    class: 'rp-panel',
    '[class.rp-panel--collapsed]': 'collapsed()',
    '[class.rp-panel--collapsible]': 'collapsible()',
    '[style.flex-basis]': '_flexBasis()',
    '[style.overflow]': '"hidden"',
    '[style.min-width]': 'direction() === "horizontal" ? "0" : null',
    '[style.min-height]': 'direction() === "vertical" ? "0" : null',
    '[attr.id]': 'panelId()',
    '[attr.aria-hidden]': 'collapsed() ? "true" : null',
    role: 'region',
  },
  template: `<ng-content />`,
})
export class ResizablePanelComponent implements OnInit {
  readonly panelId = input<string>('');
  readonly defaultSize = input<number | null>(null);
  readonly minSize = input<number>(0);
  readonly maxSize = input<number>(100);
  readonly collapsible = input<boolean>(false);
  readonly collapsed = model<boolean>(false);

  /** Set internally by the parent group */
  readonly _sizeSignal = signal<number>(0);
  readonly direction = signal<ResizableDirection>('horizontal');

  readonly _flexBasis = computed(() => `${this._sizeSignal()}%`);

  readonly _elRef = inject(ElementRef<HTMLElement>);
  private readonly group = inject(RESIZABLE_GROUP, { optional: true });

  ngOnInit(): void {
    this.group?._panelInited(this);
  }
}

// ─── ResizableHandleComponent ─────────────────────────────────────────────────

@Component({
  selector: 'app-resizable-handle',
  host: {
    class: 'rp-handle',
    '[class.rp-handle--active]': 'isDragging()',
    '[class.rp-handle--focused]': 'isFocused()',
    '[class.rp-handle--collapsible]': '_collapsible()',
    '[class.rp-handle--left-collapsed]': '_leftCollapsed()',
    role: 'separator',
    tabindex: '0',
    '[attr.aria-label]': '_ariaLabel()',
    '[attr.aria-valuenow]': '_ariaNow()',
    '[attr.aria-valuemin]': '0',
    '[attr.aria-valuemax]': '100',
    '[attr.aria-orientation]': '_ariaOrientation()',
    '(keydown)': '_onKeydown($event)',
    '(focus)': '_onFocus()',
    '(blur)': '_onBlur()',
    '(dblclick)': '_onDblClick()',
  },
  template: `
    <div class="rp-handle__track">
      <div class="rp-handle__pill" aria-hidden="true"></div>
    </div>
    @if (_collapsible()) {
      <button
        type="button"
        class="rp-handle__collapse-btn"
        [attr.aria-label]="_leftCollapsed() ? 'Expand panel' : 'Collapse panel'"
        [attr.aria-pressed]="_leftCollapsed()"
        tabindex="-1"
        (click)="$event.stopPropagation(); _onCollapseClick()"
      >
        <svg
          class="rp-handle__collapse-icon"
          [class.rp-handle__collapse-icon--flipped]="_leftCollapsed()"
          xmlns="http://www.w3.org/2000/svg"
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2.5"
          stroke-linecap="round"
          stroke-linejoin="round"
          aria-hidden="true"
        >
          @if (_direction() === 'horizontal') {
            <polyline points="15 18 9 12 15 6"></polyline>
          } @else {
            <polyline points="18 15 12 9 6 15"></polyline>
          }
        </svg>
      </button>
    }
  `,
})
export class ResizableHandleComponent implements OnInit {
  readonly isDragging = signal(false);
  readonly isFocused = signal(false);
  readonly _direction = signal<ResizableDirection>('horizontal');
  readonly _collapsible = signal(false);
  readonly _leftCollapsed = signal(false);
  readonly _leftSize = signal(50);

  // Callbacks set by parent group
  _step: ((delta: number) => void) | null = null;
  _largeStep: ((delta: number) => void) | null = null;
  _home: (() => void) | null = null;
  _end: (() => void) | null = null;
  _toggleCollapse: (() => void) | null = null;
  _reset: (() => void) | null = null;

  readonly _elRef = inject(ElementRef<HTMLElement>);
  private readonly group = inject(RESIZABLE_GROUP, { optional: true });

  readonly _ariaOrientation = computed(() =>
    this._direction() === 'horizontal' ? 'vertical' : 'horizontal'
  );

  readonly _ariaNow = computed(() => Math.round(this._leftSize()));

  readonly _ariaLabel = computed(() => {
    const collapsed = this._leftCollapsed();
    const size = Math.round(this._leftSize());
    const base = `Resize panels. Left panel: ${collapsed ? 'collapsed' : size + '%'}.`;
    const hint = this._collapsible()
      ? ' Press Enter to toggle collapse, Escape to reset.'
      : ' Press Escape to reset.';
    return base + hint;
  });

  ngOnInit(): void {
    this.group?._handleInited(this);
  }

  _onKeydown(event: KeyboardEvent): void {
    const isH = this._direction() === 'horizontal';

    switch (event.key) {
      case 'ArrowLeft':
        if (isH) { event.preventDefault(); this._step?.(-1); }
        break;
      case 'ArrowRight':
        if (isH) { event.preventDefault(); this._step?.(1); }
        break;
      case 'ArrowUp':
        if (!isH) { event.preventDefault(); this._step?.(-1); }
        break;
      case 'ArrowDown':
        if (!isH) { event.preventDefault(); this._step?.(1); }
        break;
      case 'PageUp':
        event.preventDefault();
        this._largeStep?.(10);
        break;
      case 'PageDown':
        event.preventDefault();
        this._largeStep?.(-10);
        break;
      case 'Home':
        event.preventDefault();
        this._home?.();
        break;
      case 'End':
        event.preventDefault();
        this._end?.();
        break;
      case 'Enter':
      case ' ':
        if (this._collapsible()) {
          event.preventDefault();
          this._toggleCollapse?.();
        }
        break;
      case 'Escape':
        event.preventDefault();
        this._reset?.();
        break;
    }
  }

  _onFocus(): void { this.isFocused.set(true); }
  _onBlur(): void { this.isFocused.set(false); }
  _onDblClick(): void { this._reset?.(); }
  _onCollapseClick(): void { this._toggleCollapse?.(); }
}

// ─── ResizablePanelGroupComponent ─────────────────────────────────────────────

@Component({
  selector: 'app-resizable-panel-group',
  providers: [
    {
      provide: RESIZABLE_GROUP,
      useExisting: ResizablePanelGroupComponent,
    },
  ],
  host: {
    class: 'rp-group',
    '[class.rp-group--horizontal]': 'direction() === "horizontal"',
    '[class.rp-group--vertical]': 'direction() === "vertical"',
    '[class.rp-group--dragging]': '_dragging()',
  },
  template: `<ng-content />`,
})
export class ResizablePanelGroupComponent implements OnDestroy {
  // ── Inputs ────────────────────────────────────────────────────────
  readonly direction = input<ResizableDirection>('horizontal');
  readonly keyboardStep = input<number>(1);
  readonly keyboardLargeStep = input<number>(10);
  readonly collapseThreshold = input<number>(5);
  readonly persistKey = input<string | null>(null);
  readonly autoSaveDelay = input<number>(500);

  // ── Outputs ───────────────────────────────────────────────────────
  readonly sizesChange = output<number[]>();
  readonly resizeStart = output<number>();
  readonly resizeEnd = output<number[]>();
  readonly panelCollapsed = output<number>();
  readonly panelExpanded = output<number>();

  // ── State ─────────────────────────────────────────────────────────
  readonly _dragging = signal(false);

  private readonly elRef = inject(ElementRef<HTMLElement>);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly destroyRef = inject(DestroyRef);

  private panels: ResizablePanelComponent[] = [];
  private handles: ResizableHandleComponent[] = [];
  private panelCount = 0;
  private handleCount = 0;
  private sizes: number[] = [];
  private defaultSizes: number[] = [];

  private activeDragHandleIdx = -1;
  private dragStartPos = 0;
  private dragStartSizes: number[] = [];
  private pointerId = -1;

  private saveTimer: ReturnType<typeof setTimeout> | null = null;
  private initialized = false;
  private pendingPanels: ResizablePanelComponent[] = [];
  private pendingHandles: ResizableHandleComponent[] = [];
  private initTimer: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    // Attach pointer listeners to the host element after view is available
    afterNextRender(() => {
      this.attachPointerListeners();
    });

    this.destroyRef.onDestroy(() => {
      this.detachPointerListeners();
      if (this.saveTimer) clearTimeout(this.saveTimer);
      if (this.initTimer) clearTimeout(this.initTimer);
    });
  }

  ngOnDestroy(): void { /* cleanup handled in destroyRef */ }

  // ── Registration (called from child OnInit) ────────────────────────

  _panelInited(panel: ResizablePanelComponent): void {
    this.pendingPanels.push(panel);
    this.scheduleInit();
  }

  _handleInited(handle: ResizableHandleComponent): void {
    this.pendingHandles.push(handle);
    this.scheduleInit();
  }

  private scheduleInit(): void {
    if (this.initTimer) clearTimeout(this.initTimer);
    // Micro-task: wait for all children to register before initializing
    this.initTimer = setTimeout(() => this.tryInit(), 0);
  }

  private tryInit(): void {
    if (this.initialized) {
      // A new child was added dynamically — re-init
      this.reInit();
      return;
    }
    this.reInit();
    this.initialized = true;
  }

  private reInit(): void {
    // Collect panels and handles in DOM order using their injected ElementRefs
    const host = this.elRef.nativeElement as HTMLElement;
    const orderedPanels: ResizablePanelComponent[] = [];
    const orderedHandles: ResizableHandleComponent[] = [];

    for (const child of Array.from(host.children)) {
      const panel = this.pendingPanels.find(
        (p) => p._elRef?.nativeElement === child
      );
      const handle = this.pendingHandles.find(
        (h) => h._elRef?.nativeElement === child
      );
      if (panel) orderedPanels.push(panel);
      if (handle) orderedHandles.push(handle);
    }

    // Fallback: use registration order if DOM matching fails
    if (orderedPanels.length === 0 && this.pendingPanels.length > 0) {
      orderedPanels.push(...this.pendingPanels);
      orderedHandles.push(...this.pendingHandles);
    }

    this.panels = orderedPanels;
    this.handles = orderedHandles;

    this.initSizes();
    this.wireHandles();
  }

  private initSizes(): void {
    const n = this.panels.length;
    if (n === 0) return;

    // Set direction on each panel
    this.panels.forEach((p) => p.direction.set(this.direction()));

    const persisted = this.loadPersistedSizes();
    if (persisted && persisted.length === n) {
      this.sizes = persisted;
    } else {
      const specified = this.panels.map((p) => p.defaultSize());
      const hasDefaults = specified.some((s) => s !== null);

      if (hasDefaults) {
        const specifiedTotal = specified.reduce<number>((acc, s) => acc + (s ?? 0), 0);
        const remaining = 100 - specifiedTotal;
        const nullCount = specified.filter((s) => s === null).length;
        const perNull = nullCount > 0 ? remaining / nullCount : 0;
        this.sizes = specified.map((s) => (s !== null ? s : perNull));
      } else {
        this.sizes = Array(n).fill(roundTo(100 / n));
      }
    }

    this.defaultSizes = [...this.sizes];
    this.applySizes();

    // Sync collapsed state
    this.panels.forEach((p, i) => {
      if (this.sizes[i] <= 0) p.collapsed.set(true);
    });
  }

  private wireHandles(): void {
    this.handles.forEach((h, i) => {
      const leftPanel = this.panels[i];
      h._direction.set(this.direction());
      h._collapsible.set(leftPanel?.collapsible() ?? false);
      h._leftCollapsed.set(leftPanel?.collapsed() ?? false);
      h._leftSize.set(this.sizes[i] ?? 50);

      h._step = (delta: number) => this.keyStep(i, delta * this.keyboardStep());
      h._largeStep = (delta: number) => this.keyStep(i, delta);
      h._home = () => this.keyHome(i);
      h._end = () => this.keyEnd(i);
      h._toggleCollapse = () => this.keyCollapse(i);
      h._reset = () => this.keyReset(i);
    });
  }

  private applySizes(): void {
    this.panels.forEach((panel, i) => {
      panel._sizeSignal.set(roundTo(this.sizes[i] ?? 0));
    });
    this.handles.forEach((h, i) => {
      h._leftSize.set(this.sizes[i] ?? 0);
      h._leftCollapsed.set(this.panels[i]?.collapsed() ?? false);
    });
    this.sizesChange.emit([...this.sizes]);
  }

  // ── Pointer Events ────────────────────────────────────────────────

  private boundPointerDown: ((e: PointerEvent) => void) | null = null;
  private boundPointerMove: ((e: PointerEvent) => void) | null = null;
  private boundPointerUp: ((e: PointerEvent) => void) | null = null;

  private attachPointerListeners(): void {
    const el = this.elRef.nativeElement as HTMLElement;
    this.boundPointerDown = (e) => this.onPointerDown(e);
    this.boundPointerMove = (e) => this.onPointerMove(e);
    this.boundPointerUp = (e) => this.onPointerUp(e);

    el.addEventListener('pointerdown', this.boundPointerDown);
    window.addEventListener('pointermove', this.boundPointerMove, { passive: false });
    window.addEventListener('pointerup', this.boundPointerUp);
    window.addEventListener('pointercancel', this.boundPointerUp);
  }

  private detachPointerListeners(): void {
    const el = this.elRef.nativeElement as HTMLElement;
    if (this.boundPointerDown) el.removeEventListener('pointerdown', this.boundPointerDown);
    if (this.boundPointerMove) {
      window.removeEventListener('pointermove', this.boundPointerMove);
      window.removeEventListener('pointerup', this.boundPointerUp!);
      window.removeEventListener('pointercancel', this.boundPointerUp!);
    }
  }

  private onPointerDown(event: PointerEvent): void {
    const target = event.target as HTMLElement;
    const handleEl = target.closest('app-resizable-handle') as HTMLElement | null;
    if (!handleEl || target.closest('.rp-handle__collapse-btn')) return;

    const handleComp = this.findHandleForEl(handleEl);
    if (!handleComp) return;

    const idx = this.handles.indexOf(handleComp);
    if (idx === -1) return;

    event.preventDefault();
    handleEl.setPointerCapture(event.pointerId);
    this.pointerId = event.pointerId;

    this.activeDragHandleIdx = idx;
    this.dragStartPos = this.direction() === 'horizontal' ? event.clientX : event.clientY;
    this.dragStartSizes = [...this.sizes];
    this._dragging.set(true);
    handleComp.isDragging.set(true);
    this.resizeStart.emit(idx);
  }

  private onPointerMove(event: PointerEvent): void {
    if (this.activeDragHandleIdx === -1 || event.pointerId !== this.pointerId) return;
    event.preventDefault();

    const currentPos = this.direction() === 'horizontal' ? event.clientX : event.clientY;
    const delta = currentPos - this.dragStartPos;
    const containerSize =
      this.direction() === 'horizontal'
        ? this.elRef.nativeElement.offsetWidth
        : this.elRef.nativeElement.offsetHeight;

    if (containerSize === 0) return;
    const deltaPct = (delta / containerSize) * 100;
    this.applyDelta(this.activeDragHandleIdx, deltaPct, this.dragStartSizes);
  }

  private onPointerUp(event: PointerEvent): void {
    if (this.activeDragHandleIdx === -1) return;

    const handle = this.handles[this.activeDragHandleIdx];
    handle?.isDragging.set(false);

    this.activeDragHandleIdx = -1;
    this.pointerId = -1;
    this._dragging.set(false);
    this.resizeEnd.emit([...this.sizes]);
    this.scheduleSave();
  }

  // ── Core Resize ────────────────────────────────────────────────────

  private applyDelta(
    handleIdx: number,
    deltaPct: number,
    baseSizes: number[]
  ): void {
    const leftIdx = handleIdx;
    const rightIdx = handleIdx + 1;
    if (leftIdx < 0 || rightIdx >= this.panels.length) return;

    const leftPanel = this.panels[leftIdx];
    const rightPanel = this.panels[rightIdx];

    const startLeft = baseSizes[leftIdx];
    const startRight = baseSizes[rightIdx];
    const totalAvail = startLeft + startRight;

    const minLeft = leftPanel.minSize();
    const maxLeft = Math.min(leftPanel.maxSize(), totalAvail);
    const minRight = rightPanel.minSize();
    const maxRight = Math.min(rightPanel.maxSize(), totalAvail);

    let newLeft = clamp(startLeft + deltaPct, minLeft, maxLeft);
    newLeft = clamp(newLeft, totalAvail - maxRight, totalAvail - minRight);
    let newRight = totalAvail - newLeft;

    const threshold = this.collapseThreshold();

    // Auto-collapse left
    if (leftPanel.collapsible() && newLeft < threshold && newLeft < startLeft) {
      newLeft = 0;
      newRight = totalAvail;
      if (!leftPanel.collapsed()) {
        leftPanel.collapsed.set(true);
        this.panelCollapsed.emit(leftIdx);
      }
    } else if (leftPanel.collapsed() && newLeft > threshold) {
      leftPanel.collapsed.set(false);
      this.panelExpanded.emit(leftIdx);
    }

    // Auto-collapse right
    if (rightPanel.collapsible() && newRight < threshold && newRight < startRight) {
      newRight = 0;
      newLeft = totalAvail;
      if (!rightPanel.collapsed()) {
        rightPanel.collapsed.set(true);
        this.panelCollapsed.emit(rightIdx);
      }
    } else if (rightPanel.collapsed() && newRight > threshold) {
      rightPanel.collapsed.set(false);
      this.panelExpanded.emit(rightIdx);
    }

    this.sizes[leftIdx] = roundTo(newLeft);
    this.sizes[rightIdx] = roundTo(newRight);
    this.applySizes();
  }

  // ── Keyboard Actions ───────────────────────────────────────────────

  private keyStep(handleIdx: number, deltaPct: number): void {
    const baseSizes = [...this.sizes];
    this.applyDelta(handleIdx, deltaPct, baseSizes);
    this.scheduleSave();
  }

  private keyHome(handleIdx: number): void {
    const leftPanel = this.panels[handleIdx];
    if (!leftPanel) return;

    const totalAvail = this.sizes[handleIdx] + (this.sizes[handleIdx + 1] ?? 0);

    if (leftPanel.collapsible()) {
      this.sizes[handleIdx] = 0;
      this.sizes[handleIdx + 1] = totalAvail;
      if (!leftPanel.collapsed()) {
        leftPanel.collapsed.set(true);
        this.panelCollapsed.emit(handleIdx);
      }
    } else {
      const min = leftPanel.minSize();
      this.sizes[handleIdx] = min;
      this.sizes[handleIdx + 1] = totalAvail - min;
    }

    this.applySizes();
    this.scheduleSave();
  }

  private keyEnd(handleIdx: number): void {
    const leftPanel = this.panels[handleIdx];
    if (!leftPanel) return;

    const rightPanel = this.panels[handleIdx + 1];
    const totalAvail = this.sizes[handleIdx] + (this.sizes[handleIdx + 1] ?? 0);
    const maxLeft = Math.min(leftPanel.maxSize(), totalAvail - (rightPanel?.minSize() ?? 0));

    this.sizes[handleIdx] = maxLeft;
    this.sizes[handleIdx + 1] = totalAvail - maxLeft;

    this.applySizes();
    this.scheduleSave();
  }

  private keyCollapse(handleIdx: number): void {
    const leftPanel = this.panels[handleIdx];
    if (!leftPanel?.collapsible()) return;

    const totalAvail = this.sizes[handleIdx] + (this.sizes[handleIdx + 1] ?? 0);

    if (leftPanel.collapsed()) {
      // Expand
      const restoreSize = this.defaultSizes[handleIdx] ?? totalAvail / 2;
      const newLeft = Math.min(restoreSize, totalAvail - (this.panels[handleIdx + 1]?.minSize() ?? 0));
      this.sizes[handleIdx] = newLeft;
      this.sizes[handleIdx + 1] = totalAvail - newLeft;
      leftPanel.collapsed.set(false);
      this.panelExpanded.emit(handleIdx);
    } else {
      // Collapse
      this.sizes[handleIdx] = 0;
      this.sizes[handleIdx + 1] = totalAvail;
      leftPanel.collapsed.set(true);
      this.panelCollapsed.emit(handleIdx);
    }

    this.applySizes();
    this.scheduleSave();
  }

  private keyReset(handleIdx: number): void {
    const totalAvail = this.sizes[handleIdx] + (this.sizes[handleIdx + 1] ?? 0);
    const defaultLeft = this.defaultSizes[handleIdx] ?? totalAvail / 2;
    const defaultRight = this.defaultSizes[handleIdx + 1] ?? totalAvail / 2;

    // Restore proportionally
    const defaultTotal = defaultLeft + defaultRight;
    this.sizes[handleIdx] = roundTo((defaultLeft / defaultTotal) * totalAvail);
    this.sizes[handleIdx + 1] = totalAvail - this.sizes[handleIdx];

    const leftPanel = this.panels[handleIdx];
    if (leftPanel?.collapsed()) {
      leftPanel.collapsed.set(false);
      this.panelExpanded.emit(handleIdx);
    }

    this.applySizes();
    this.scheduleSave();
  }

  // ── Persistence ────────────────────────────────────────────────────

  private scheduleSave(): void {
    const key = this.persistKey();
    if (!key || !isPlatformBrowser(this.platformId)) return;

    if (this.saveTimer) clearTimeout(this.saveTimer);
    this.saveTimer = setTimeout(() => {
      const layout: ResizableLayout = { sizes: [...this.sizes], timestamp: Date.now() };
      try {
        localStorage.setItem(key, JSON.stringify(layout));
      } catch { /* ignore */ }
    }, this.autoSaveDelay());
  }

  private loadPersistedSizes(): number[] | null {
    const key = this.persistKey();
    if (!key || !isPlatformBrowser(this.platformId)) return null;

    try {
      const raw = localStorage.getItem(key);
      if (!raw) return null;
      const layout = JSON.parse(raw) as ResizableLayout;
      if (!Array.isArray(layout.sizes)) return null;
      return layout.sizes;
    } catch {
      return null;
    }
  }

  private findHandleForEl(el: HTMLElement): ResizableHandleComponent | null {
    for (const h of this.handles) {
      const hEl = h._elRef?.nativeElement as HTMLElement | undefined;
      if (hEl && (hEl === el || hEl.contains(el))) return h;
    }
    return null;
  }

  // ── Public API ─────────────────────────────────────────────────────

  /** Reset all panels to equal sizes */
  resetLayout(): void {
    const n = this.panels.length;
    this.sizes = Array(n).fill(roundTo(100 / n));
    this.panels.forEach((p) => {
      if (p.collapsed()) p.collapsed.set(false);
    });
    this.applySizes();
    this.scheduleSave();
  }

  /** Collapse a specific panel by index */
  collapsePanel(index: number): void {
    const panel = this.panels[index];
    if (!panel?.collapsible()) return;

    const handleIdx = index; // handle to the right of this panel
    if (handleIdx < this.handles.length) {
      this.keyCollapse(handleIdx);
    }
  }

  /** Get current sizes in % */
  getSizes(): number[] {
    return [...this.sizes];
  }
}
