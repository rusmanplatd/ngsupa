import {
  Component,
  input,
  output,
  signal,
  computed,
  inject,
  ElementRef,
  OnDestroy,
  viewChild,
  effect,
} from '@angular/core';
import { Overlay, OverlayRef, ConnectedPosition } from '@angular/cdk/overlay';
import { TemplatePortal } from '@angular/cdk/portal';
import { ViewContainerRef, TemplateRef } from '@angular/core';
import { LucideDynamicIcon } from '@lucide/angular';

// ── Interfaces ────────────────────────────────────────────────

export interface DropdownOption {
  value: string;
  label: string;
  icon?: string;
  description?: string;
  disabled?: boolean;
}

export interface DropdownGroup {
  label: string;
  options: DropdownOption[];
}

// ── Component ─────────────────────────────────────────────────

@Component({
  selector: 'app-dropdown',
  imports: [LucideDynamicIcon],
  host: {
    class: 'block',
    '(document:keydown)': 'onDocumentKeydown($event)',
  },
  template: `
    <!-- ─── Trigger ─────────────────────────────────────── -->
    <button
      #triggerEl
      type="button"
      [id]="inputId()"
      [disabled]="disabled()"
      [attr.aria-haspopup]="'listbox'"
      [attr.aria-expanded]="isOpen()"
      [attr.aria-describedby]="descriptionId()"
      [attr.aria-invalid]="error() ? 'true' : null"
      (click)="toggle()"
      (keydown)="onTriggerKeydown($event)"
      class="trigger-btn group relative flex w-full items-center rounded-xl border outline-none transition-all duration-normal"
      [class]="triggerClasses()"
      [style.box-shadow]="triggerShadow()"
    >
      <!-- Floating label -->
      <div class="relative flex-1 min-w-0 text-left px-3 pb-2 pt-5">
        <span
          class="pointer-events-none absolute left-3 transition-all duration-normal ease-default"
          [class]="labelClasses()"
        >
          {{ label() }}
        </span>

        @if (multiple()) {
          <!-- Multi-select chips -->
          @if (selectedOptions().length > 0) {
            <div class="flex flex-wrap gap-1 min-h-[1.5rem]">
              @for (opt of visibleChips(); track opt.value) {
                <span
                  class="chip inline-flex items-center gap-1 rounded-lg bg-[var(--interactive-tint)] px-2 py-0.5 text-xs font-medium text-system-blue transition-all duration-fast"
                >
                  {{ opt.label }}
                  @if (!disabled()) {
                    <button
                      type="button"
                      tabindex="-1"
                      class="chip-remove inline-flex items-center justify-center rounded-full hover:bg-[var(--interactive-tint-hover)] transition-colors duration-fast"
                      [attr.aria-label]="'Remove ' + opt.label"
                      (click)="removeValue(opt.value, $event)"
                    >
                      <svg lucideIcon="x" [size]="10" />
                    </button>
                  }
                </span>
              }
              @if (overflowCount() > 0) {
                <span class="chip inline-flex items-center rounded-lg bg-[var(--fill-secondary)] px-2 py-0.5 text-xs font-medium text-[var(--text-secondary)]">
                  +{{ overflowCount() }}
                </span>
              }
            </div>
          } @else {
            <span class="block text-base text-transparent select-none min-h-[1.5rem]">&nbsp;</span>
          }
        } @else {
          <!-- Single-select display -->
          @if (selectedOption()) {
            <span class="block text-base text-[var(--text-primary)] truncate">
              @if (selectedOption()!.icon) {
                <svg
                  [lucideIcon]="selectedOption()!.icon!"
                  [size]="16"
                  class="mr-1.5 -mt-0.5 inline-flex text-[var(--text-secondary)]"
                />
              }
              {{ selectedOption()!.label }}
            </span>
          } @else {
            @if (placeholder()) {
              <span class="block text-base text-[var(--text-tertiary)] truncate">{{ placeholder() }}</span>
            } @else {
              <span class="block text-base text-transparent select-none">&nbsp;</span>
            }
          }
        }
      </div>

      <!-- Trailing: clear + chevron -->
      @if (clearable() && hasValue() && !disabled()) {
        <button
          type="button"
          tabindex="-1"
          class="clear-btn mr-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[var(--fill-secondary)] text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] hover:bg-[var(--text-quaternary)] active:scale-90 transition-all duration-fast"
          aria-label="Clear selection"
          (click)="onClear($event)"
        >
          <svg lucideIcon="x" [size]="12" />
        </button>
      }
      <svg
        lucideIcon="chevron-down"
        [size]="16"
        class="mr-3 shrink-0 pointer-events-none transition-all duration-normal"
        [class]="isOpen()
          ? 'text-system-blue rotate-180'
          : 'text-[var(--text-tertiary)] group-hover:text-[var(--text-secondary)]'"
        [style.transition-timing-function]="'var(--ease-spring)'"
      />
    </button>

    <!-- Error / Hint -->
    <div class="mt-1.5 flex items-center px-1">
      @if (error()) {
        <p [id]="inputId() + '-error'" role="alert" class="text-xs text-system-red">
          {{ error() }}
        </p>
      } @else if (hint()) {
        <p [id]="inputId() + '-hint'" class="text-xs text-[var(--text-tertiary)]">{{ hint() }}</p>
      }
    </div>

    <!-- ─── Panel Template ──────────────────────────────── -->
    <ng-template #panelTemplate>
      <div
        class="dropdown-panel rounded-2xl border border-[var(--glass-border)] bg-[var(--glass-bg-thick)] backdrop-blur-xl overflow-hidden"
        [style.min-width.px]="panelMinWidth()"
        [style.max-width]="'min(400px, 90vw)'"
        [style.box-shadow]="'var(--shadow-xl)'"
        role="listbox"
        [attr.aria-label]="label()"
        [attr.aria-multiselectable]="multiple() || null"
        [attr.aria-activedescendant]="activeDescendant()"
      >
        <!-- Search -->
        @if (searchable()) {
          <div class="search-container px-3 pt-3 pb-1.5">
            <div class="relative flex items-center rounded-lg bg-[var(--fill-primary)] border border-transparent transition-all duration-fast"
              [class]="searchFocused() ? 'border-system-blue bg-[var(--surface-primary)]' : 'hover:bg-[var(--fill-secondary)]'"
              [style.box-shadow]="searchFocused() ? 'var(--form-field-shadow), var(--form-control-glow)' : 'var(--form-field-shadow)'"
            >
              <svg
                lucideIcon="search"
                [size]="14"
                class="ml-2.5 shrink-0 transition-colors duration-fast"
                [class]="searchFocused() ? 'text-system-blue' : 'text-[var(--text-tertiary)]'"
              />
              <input
                #searchInput
                type="text"
                class="w-full bg-transparent py-2 pl-2 pr-3 text-sm text-[var(--text-primary)] outline-none placeholder:text-[var(--text-tertiary)]"
                placeholder="Search…"
                [value]="searchQuery()"
                (input)="onSearchInput($event)"
                (focus)="searchFocused.set(true)"
                (blur)="searchFocused.set(false)"
                (keydown)="onSearchKeydown($event)"
                aria-label="Search options"
                autocomplete="off"
              />
              @if (searchQuery()) {
                <button
                  type="button"
                  tabindex="-1"
                  class="search-clear mr-2 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-[var(--fill-secondary)] text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] active:scale-90 transition-all duration-fast"
                  aria-label="Clear search"
                  (click)="clearSearch()"
                >
                  <svg lucideIcon="x" [size]="10" />
                </button>
              }
            </div>
          </div>
        }

        <!-- Options List -->
        <div
          class="options-list overflow-y-auto overscroll-contain px-1.5 py-1.5"
          [style.max-height]="'280px'"
          #optionsList
        >
          @if (hasGroups()) {
            <!-- Grouped Options -->
            @for (group of filteredGroups(); track group.label; let gi = $index) {
              @if (gi > 0) {
                <div class="mx-2 my-1.5 border-t border-[var(--separator)]" role="separator"></div>
              }
              <div class="px-2.5 py-1.5 text-2xs font-semibold uppercase tracking-wider text-[var(--text-tertiary)] select-none">
                {{ group.label }}
              </div>
              @for (option of group.options; track option.value) {
                <button
                  type="button"
                  [id]="optionId(option.value)"
                  role="option"
                  [attr.aria-selected]="isSelected(option.value)"
                  [attr.aria-disabled]="option.disabled || null"
                  [disabled]="option.disabled"
                  class="option-item group/opt relative flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left outline-none transition-all duration-fast"
                  [class]="optionClasses(option)"
                  (click)="selectOption(option)"
                  (mouseenter)="onOptionHover(option.value)"
                >
                  @if (option.icon) {
                    <svg
                      [lucideIcon]="option.icon"
                      [size]="18"
                      class="shrink-0 transition-colors duration-fast"
                      [class]="isSelected(option.value) ? 'text-system-blue' : 'text-[var(--text-tertiary)] group-hover/opt:text-[var(--text-secondary)]'"
                    />
                  }
                  <div class="flex-1 min-w-0">
                    <span class="block text-sm font-medium truncate"
                      [class]="option.disabled ? 'text-[var(--text-quaternary)]' : 'text-[var(--text-primary)]'"
                    >{{ option.label }}</span>
                    @if (option.description) {
                      <span class="block text-xs text-[var(--text-tertiary)] truncate mt-0.5">{{ option.description }}</span>
                    }
                  </div>
                  <!-- Checkmark -->
                  @if (isSelected(option.value)) {
                    <span class="checkmark shrink-0">
                      <svg viewBox="0 0 16 16" fill="none" class="h-4 w-4 text-system-blue" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M3 8L6.5 11.5L13 4.5" class="animate-check" />
                      </svg>
                    </span>
                  }
                </button>
              }
            }
          } @else {
            <!-- Flat Options -->
            @for (option of filteredOptions(); track option.value) {
              <button
                type="button"
                [id]="optionId(option.value)"
                role="option"
                [attr.aria-selected]="isSelected(option.value)"
                [attr.aria-disabled]="option.disabled || null"
                [disabled]="option.disabled"
                class="option-item group/opt relative flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left outline-none transition-all duration-fast"
                [class]="optionClasses(option)"
                (click)="selectOption(option)"
                (mouseenter)="onOptionHover(option.value)"
              >
                @if (option.icon) {
                  <svg
                    [lucideIcon]="option.icon"
                    [size]="18"
                    class="shrink-0 transition-colors duration-fast"
                    [class]="isSelected(option.value) ? 'text-system-blue' : 'text-[var(--text-tertiary)] group-hover/opt:text-[var(--text-secondary)]'"
                  />
                }
                <div class="flex-1 min-w-0">
                  <span class="block text-sm font-medium truncate"
                    [class]="option.disabled ? 'text-[var(--text-quaternary)]' : 'text-[var(--text-primary)]'"
                  >{{ option.label }}</span>
                  @if (option.description) {
                    <span class="block text-xs text-[var(--text-tertiary)] truncate mt-0.5">{{ option.description }}</span>
                  }
                </div>
                @if (isSelected(option.value)) {
                  <span class="checkmark shrink-0">
                    <svg viewBox="0 0 16 16" fill="none" class="h-4 w-4 text-system-blue" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M3 8L6.5 11.5L13 4.5" class="animate-check" />
                    </svg>
                  </span>
                }
              </button>
            }
          }

          <!-- Empty state -->
          @if (filteredFlatList().length === 0) {
            <div class="flex flex-col items-center justify-center py-8 px-4 text-center">
              <svg lucideIcon="search" [size]="32" class="text-[var(--text-quaternary)] mb-2" />
              <p class="text-sm font-medium text-[var(--text-secondary)]">No results found</p>
              <p class="text-xs text-[var(--text-tertiary)] mt-0.5">Try a different search term</p>
            </div>
          }
        </div>

        <!-- Multi-select footer -->
        @if (multiple() && filteredFlatList().length > 0) {
          <div class="border-t border-[var(--separator)] px-3 py-2 flex items-center justify-between">
            <span class="text-xs text-[var(--text-tertiary)]">
              {{ selectedValues().length }} selected
              @if (maxSelections() !== null) {
                <span> / {{ maxSelections() }} max</span>
              }
            </span>
            @if (selectedValues().length > 0) {
              <button
                type="button"
                class="text-xs font-medium text-system-blue hover:text-system-blue-hover active:scale-95 transition-all duration-fast"
                (click)="clearAll()"
              >
                Clear all
              </button>
            }
          </div>
        }
      </div>
    </ng-template>
  `,
  styles: `
    :host:has(button.trigger-btn:disabled) {
      filter: grayscale(0.3);
      opacity: 0.5;
      pointer-events: none;
    }

    .dropdown-panel {
      animation: dropdown-in 0.22s var(--ease-default);
    }

    @keyframes dropdown-in {
      from {
        opacity: 0;
        transform: scale(0.96) translateY(-4px);
      }
      to {
        opacity: 1;
        transform: scale(1) translateY(0);
      }
    }

    .option-item:focus-visible {
      outline: none;
    }

    .option-item:not(:disabled):active {
      transform: scale(0.98);
    }

    @keyframes check-draw {
      from { stroke-dashoffset: 20; }
      to   { stroke-dashoffset: 0; }
    }
    .animate-check {
      stroke-dasharray: 20;
      animation: check-draw 0.25s cubic-bezier(0.4, 0, 0.2, 1) forwards;
    }

    .chip {
      animation: chip-in 0.2s var(--ease-spring);
    }
    @keyframes chip-in {
      from { opacity: 0; transform: scale(0.8); }
      to   { opacity: 1; transform: scale(1); }
    }

    .clear-btn {
      animation: clear-btn-in 0.2s var(--ease-spring);
    }

    .search-clear {
      animation: clear-btn-in 0.2s var(--ease-spring);
    }

    .checkmark {
      animation: check-pop 0.25s var(--ease-spring);
    }
    @keyframes check-pop {
      from { opacity: 0; transform: scale(0.5); }
      to   { opacity: 1; transform: scale(1); }
    }

    .options-list {
      scrollbar-width: thin;
      scrollbar-color: light-dark(oklch(75% 0 0 / 0.3), oklch(50% 0 0 / 0.3)) transparent;
    }

    /* stagger option items on panel open */
    .option-item {
      animation: option-fade-in 0.2s var(--ease-default) backwards;
    }
    .option-item:nth-child(1) { animation-delay: 0ms; }
    .option-item:nth-child(2) { animation-delay: 20ms; }
    .option-item:nth-child(3) { animation-delay: 40ms; }
    .option-item:nth-child(4) { animation-delay: 60ms; }
    .option-item:nth-child(5) { animation-delay: 80ms; }
    .option-item:nth-child(6) { animation-delay: 100ms; }
    .option-item:nth-child(7) { animation-delay: 120ms; }
    .option-item:nth-child(8) { animation-delay: 140ms; }

    @keyframes option-fade-in {
      from {
        opacity: 0;
        transform: translateY(4px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
  `,
})
export class DropdownComponent implements OnDestroy {
  // ── Inputs ──────────────────────────────────────────────────
  readonly label = input.required<string>();
  readonly options = input<DropdownOption[]>([]);
  readonly groups = input<DropdownGroup[]>([]);
  readonly value = input('');
  readonly values = input<string[]>([]);
  readonly placeholder = input<string | null>(null);
  readonly multiple = input(false);
  readonly searchable = input(false);
  readonly clearable = input(false);
  readonly disabled = input(false);
  readonly error = input<string | null>(null);
  readonly hint = input<string | null>(null);
  readonly inputId = input('dropdown-' + Math.random().toString(36).slice(2, 9));
  readonly maxSelections = input<number | null>(null);

  // ── Outputs ─────────────────────────────────────────────────
  readonly valueChange = output<string>();
  readonly valuesChange = output<string[]>();
  readonly opened = output<void>();
  readonly closed = output<void>();

  // ── State ───────────────────────────────────────────────────
  protected readonly isOpen = signal(false);
  protected readonly searchQuery = signal('');
  protected readonly searchFocused = signal(false);
  protected readonly activeIndex = signal(-1);
  protected readonly selectedValues = signal<string[]>([]);
  protected readonly panelMinWidth = signal(0);

  // ── Injections ──────────────────────────────────────────────
  private readonly overlay = inject(Overlay);
  private readonly elementRef = inject(ElementRef);
  private readonly vcr = inject(ViewContainerRef);
  private overlayRef: OverlayRef | null = null;

  // ── View Children ───────────────────────────────────────────
  private readonly triggerElRef = viewChild<ElementRef<HTMLButtonElement>>('triggerEl');
  private readonly panelTemplateRef = viewChild<TemplateRef<unknown>>('panelTemplate');
  private readonly searchInputRef = viewChild<ElementRef<HTMLInputElement>>('searchInput');
  private readonly optionsListRef = viewChild<ElementRef<HTMLDivElement>>('optionsList');

  // ── Sync input values to internal state ─────────────────────
  constructor() {
    effect(() => {
      const v = this.value();
      if (!this.multiple() && v) {
        this.selectedValues.set([v]);
      }
    });

    effect(() => {
      const vs = this.values();
      if (this.multiple() && vs.length > 0) {
        this.selectedValues.set([...vs]);
      }
    });
  }

  // ── Computed ────────────────────────────────────────────────

  protected readonly hasGroups = computed(() => this.groups().length > 0);

  /** Flat list of all available options (from either options or groups) */
  protected readonly allOptions = computed<DropdownOption[]>(() => {
    if (this.hasGroups()) {
      return this.groups().flatMap((g) => g.options);
    }
    return this.options();
  });

  /** Filtered flat options (search applied) */
  protected readonly filteredOptions = computed(() => {
    const query = this.searchQuery().toLowerCase().trim();
    if (!query) return this.options();
    return this.options().filter(
      (o) =>
        o.label.toLowerCase().includes(query) ||
        o.value.toLowerCase().includes(query) ||
        (o.description && o.description.toLowerCase().includes(query))
    );
  });

  /** Filtered groups (search applied, only groups with matching options) */
  protected readonly filteredGroups = computed(() => {
    const query = this.searchQuery().toLowerCase().trim();
    if (!query) return this.groups();
    return this.groups()
      .map((group) => ({
        ...group,
        options: group.options.filter(
          (o) =>
            o.label.toLowerCase().includes(query) ||
            o.value.toLowerCase().includes(query) ||
            (o.description && o.description.toLowerCase().includes(query))
        ),
      }))
      .filter((g) => g.options.length > 0);
  });

  /** Flat filtered list for keyboard nav & empty state */
  protected readonly filteredFlatList = computed<DropdownOption[]>(() => {
    if (this.hasGroups()) {
      return this.filteredGroups().flatMap((g) => g.options);
    }
    return this.filteredOptions();
  });

  /** Navigable (non-disabled) options for keyboard */
  private readonly navigableOptions = computed(() =>
    this.filteredFlatList().filter((o) => !o.disabled)
  );

  protected readonly hasValue = computed(() => this.selectedValues().length > 0);

  protected readonly selectedOption = computed(() => {
    const vals = this.selectedValues();
    if (vals.length === 0) return null;
    return this.allOptions().find((o) => o.value === vals[0]) ?? null;
  });

  protected readonly selectedOptions = computed(() => {
    const vals = this.selectedValues();
    return this.allOptions().filter((o) => vals.includes(o.value));
  });

  /** Show max 3 chips, rest as "+N" */
  private readonly maxVisibleChips = 3;
  protected readonly visibleChips = computed(() =>
    this.selectedOptions().slice(0, this.maxVisibleChips)
  );
  protected readonly overflowCount = computed(() =>
    Math.max(0, this.selectedOptions().length - this.maxVisibleChips)
  );

  /** The label floats up when there is a value or the dropdown is open */
  private readonly labelFloated = computed(
    () => this.hasValue() || this.isOpen() || !!this.placeholder()
  );

  protected readonly labelClasses = computed(() => {
    const floated = this.labelFloated();
    const colorClass = this.isOpen()
      ? 'text-system-blue'
      : 'text-[var(--text-tertiary)]';

    if (floated) {
      return `top-2.5 translate-y-0 text-xs ${colorClass}`;
    }
    return `top-1/2 -translate-y-1/2 text-base ${colorClass}`;
  });

  protected readonly descriptionId = computed(() => {
    if (this.error()) return this.inputId() + '-error';
    if (this.hint()) return this.inputId() + '-hint';
    return null;
  });

  protected readonly triggerClasses = computed(() => {
    const base = 'backdrop-blur-sm';
    if (this.error()) {
      return `${base} border-system-red bg-[var(--surface-primary)]`;
    }
    if (this.isOpen()) {
      return `${base} border-system-blue bg-[var(--surface-primary)]`;
    }
    return `${base} border-[var(--border-default)] bg-[var(--form-field-glass)] hover:border-[var(--border-opaque)]`;
  });

  protected readonly triggerShadow = computed(() => {
    const inset = 'var(--form-field-shadow)';
    if (this.error()) {
      return `${inset}, var(--form-control-glow-red)`;
    }
    if (this.isOpen()) {
      return `${inset}, var(--form-control-glow)`;
    }
    return inset;
  });

  protected readonly activeDescendant = computed(() => {
    const idx = this.activeIndex();
    const navOptions = this.navigableOptions();
    if (idx < 0 || idx >= navOptions.length) return null;
    return this.optionId(navOptions[idx].value);
  });

  // ── Helpers ─────────────────────────────────────────────────

  protected optionId(value: string): string {
    return `${this.inputId()}-opt-${value}`;
  }

  protected isSelected(value: string): boolean {
    return this.selectedValues().includes(value);
  }

  protected optionClasses(option: DropdownOption): string {
    if (option.disabled) {
      return 'cursor-not-allowed opacity-40';
    }
    const navOptions = this.navigableOptions();
    const idx = this.activeIndex();
    const isActive = idx >= 0 && idx < navOptions.length && navOptions[idx].value === option.value;
    const selected = this.isSelected(option.value);

    if (isActive) {
      return 'bg-[var(--fill-secondary)] cursor-pointer';
    }
    if (selected) {
      return 'bg-[var(--interactive-tint)] cursor-pointer hover:bg-[var(--interactive-tint-hover)]';
    }
    return 'cursor-pointer hover:bg-[var(--fill-primary)]';
  }

  // ── Panel Logic ─────────────────────────────────────────────

  toggle(): void {
    if (this.isOpen()) {
      this.close();
    } else {
      this.open();
    }
  }

  open(): void {
    if (this.isOpen() || this.disabled() || !this.panelTemplateRef()) return;

    // Measure trigger width for min-width
    const triggerEl = this.triggerElRef()?.nativeElement;
    if (triggerEl) {
      this.panelMinWidth.set(triggerEl.getBoundingClientRect().width);
    }

    const positions: ConnectedPosition[] = [
      {
        originX: 'start',
        originY: 'bottom',
        overlayX: 'start',
        overlayY: 'top',
        offsetY: 4,
      },
      {
        originX: 'start',
        originY: 'top',
        overlayX: 'start',
        overlayY: 'bottom',
        offsetY: -4,
      },
      {
        originX: 'end',
        originY: 'bottom',
        overlayX: 'end',
        overlayY: 'top',
        offsetY: 4,
      },
    ];

    const positionStrategy = this.overlay
      .position()
      .flexibleConnectedTo(this.triggerElRef()!)
      .withPositions(positions)
      .withPush(true)
      .withGrowAfterOpen(true);

    this.overlayRef = this.overlay.create({
      positionStrategy,
      scrollStrategy: this.overlay.scrollStrategies.reposition(),
      hasBackdrop: true,
      backdropClass: 'cdk-overlay-transparent-backdrop',
    });

    this.overlayRef.backdropClick().subscribe(() => this.close());
    this.overlayRef.keydownEvents().subscribe((e) => this.onOverlayKeydown(e));

    const portal = new TemplatePortal(this.panelTemplateRef()!, this.vcr);
    this.overlayRef.attach(portal);

    this.isOpen.set(true);
    this.searchQuery.set('');
    this.activeIndex.set(-1);
    this.opened.emit();

    // Focus search input if searchable, after animation frame
    if (this.searchable()) {
      requestAnimationFrame(() => {
        this.searchInputRef()?.nativeElement.focus();
      });
    }
  }

  close(): void {
    if (!this.isOpen()) return;
    this.overlayRef?.detach();
    this.overlayRef?.dispose();
    this.overlayRef = null;
    this.isOpen.set(false);
    this.searchQuery.set('');
    this.activeIndex.set(-1);
    this.closed.emit();
    // Return focus to trigger
    this.triggerElRef()?.nativeElement.focus();
  }

  // ── Selection Logic ─────────────────────────────────────────

  protected selectOption(option: DropdownOption): void {
    if (option.disabled) return;

    if (this.multiple()) {
      this.selectedValues.update((vals) => {
        if (vals.includes(option.value)) {
          return vals.filter((v) => v !== option.value);
        }
        // Check max selections
        const max = this.maxSelections();
        if (max !== null && vals.length >= max) return vals;
        return [...vals, option.value];
      });
      this.valuesChange.emit(this.selectedValues());
    } else {
      this.selectedValues.set([option.value]);
      this.valueChange.emit(option.value);
      this.close();
    }
  }

  protected removeValue(value: string, event: Event): void {
    event.stopPropagation();
    this.selectedValues.update((vals) => vals.filter((v) => v !== value));
    this.valuesChange.emit(this.selectedValues());
  }

  protected onClear(event: Event): void {
    event.stopPropagation();
    this.selectedValues.set([]);
    if (this.multiple()) {
      this.valuesChange.emit([]);
    } else {
      this.valueChange.emit('');
    }
  }

  protected clearAll(): void {
    this.selectedValues.set([]);
    this.valuesChange.emit([]);
  }

  // ── Search Logic ────────────────────────────────────────────

  protected onSearchInput(event: Event): void {
    const val = (event.target as HTMLInputElement).value;
    this.searchQuery.set(val);
    this.activeIndex.set(-1);
  }

  protected clearSearch(): void {
    this.searchQuery.set('');
    this.activeIndex.set(-1);
    this.searchInputRef()?.nativeElement.focus();
  }

  // ── Keyboard Navigation ─────────────────────────────────────

  protected onTriggerKeydown(event: KeyboardEvent): void {
    switch (event.key) {
      case 'ArrowDown':
      case 'ArrowUp':
      case 'Enter':
      case ' ':
        event.preventDefault();
        if (!this.isOpen()) {
          this.open();
        }
        break;
    }
  }

  protected onSearchKeydown(event: KeyboardEvent): void {
    this.handlePanelKeydown(event);
  }

  private onOverlayKeydown(event: KeyboardEvent): void {
    this.handlePanelKeydown(event);
  }

  protected onDocumentKeydown(event: KeyboardEvent): void {
    // Only handle when panel is open and event wasn't already handled
    if (!this.isOpen()) return;

    if (event.key === 'Escape') {
      event.preventDefault();
      this.close();
    }
  }

  private handlePanelKeydown(event: KeyboardEvent): void {
    const navOptions = this.navigableOptions();
    const total = navOptions.length;
    if (total === 0 && event.key !== 'Escape') return;

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        this.activeIndex.update((i) => (i + 1) % total);
        this.scrollActiveIntoView();
        break;

      case 'ArrowUp':
        event.preventDefault();
        this.activeIndex.update((i) => (i <= 0 ? total - 1 : i - 1));
        this.scrollActiveIntoView();
        break;

      case 'Home':
        event.preventDefault();
        this.activeIndex.set(0);
        this.scrollActiveIntoView();
        break;

      case 'End':
        event.preventDefault();
        this.activeIndex.set(total - 1);
        this.scrollActiveIntoView();
        break;

      case 'Enter':
      case ' ':
        // Don't intercept space in search input
        if (event.key === ' ' && this.searchFocused()) return;
        event.preventDefault();
        if (this.activeIndex() >= 0 && this.activeIndex() < total) {
          this.selectOption(navOptions[this.activeIndex()]);
        }
        break;

      case 'Escape':
        event.preventDefault();
        this.close();
        break;

      case 'Tab':
        this.close();
        break;
    }
  }

  protected onOptionHover(value: string): void {
    const navOptions = this.navigableOptions();
    const idx = navOptions.findIndex((o) => o.value === value);
    if (idx >= 0) {
      this.activeIndex.set(idx);
    }
  }

  private scrollActiveIntoView(): void {
    requestAnimationFrame(() => {
      const navOptions = this.navigableOptions();
      const idx = this.activeIndex();
      if (idx < 0 || idx >= navOptions.length) return;
      const optId = this.optionId(navOptions[idx].value);
      const el = document.getElementById(optId);
      el?.scrollIntoView({ block: 'nearest' });
    });
  }

  // ── Cleanup ─────────────────────────────────────────────────

  ngOnDestroy(): void {
    this.overlayRef?.dispose();
  }
}
