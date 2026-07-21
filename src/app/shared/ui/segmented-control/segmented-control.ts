import {
  Component,
  Directive,
  input,
  model,
  signal,
  ElementRef,
  viewChildren,
  afterNextRender,
  inject,
  Injector,
  DestroyRef,
  AfterViewInit,
  effect,
  untracked,
} from '@angular/core';
import { FocusKeyManager, FocusableOption } from '@angular/cdk/a11y';

export interface SegmentOption {
  value: string;
  label: string;
}

/**
 * Thin wrapper that makes each segment button a `FocusableOption`
 * so CDK FocusKeyManager can manage it.
 */
@Directive({
  selector: '[appSegmentFocusItem]',
})
export class SegmentFocusItemDirective implements FocusableOption {
  private readonly elRef = inject(ElementRef<HTMLButtonElement>);

  focus(): void {
    this.elRef.nativeElement.focus();
  }

  getLabel(): string {
    return this.elRef.nativeElement.textContent?.trim() ?? '';
  }
}

@Component({
  selector: 'app-segmented-control',
  imports: [SegmentFocusItemDirective],
  host: {
    class: 'block',
    role: 'radiogroup',
    '[attr.aria-label]': 'ariaLabel()',
  },
  template: `
    <div class="relative inline-flex rounded-lg bg-[var(--fill-secondary)] p-0.5">
      <!-- Sliding indicator -->
      <span
        class="absolute top-0.5 bottom-0.5 rounded-md bg-[var(--surface-elevated)] shadow-sm transition-all duration-normal ease-out"
        [style.left.px]="indicatorLeft()"
        [style.width.px]="indicatorWidth()"
      ></span>
      @for (option of options(); track option.value; let i = $index) {
        <button
          #segmentBtn
          appSegmentFocusItem
          type="button"
          role="radio"
          [attr.aria-checked]="value() === option.value"
          [attr.tabindex]="value() === option.value ? 0 : -1"
          class="relative z-10 cursor-pointer rounded-md px-4 py-1.5 text-sm font-medium transition-colors duration-fast focus-visible:outline-2 focus-visible:outline-[var(--focus-ring)] focus-visible:outline-offset-1"
          [class]="value() === option.value
            ? 'text-[var(--text-primary)]'
            : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'"
          (click)="select(option.value, i)"
          (keydown)="onKeydown($event, i)"
        >
          {{ option.label }}
        </button>
      }
    </div>
  `,
})
export class SegmentedControlComponent implements AfterViewInit {
  readonly options = input.required<SegmentOption[]>();
  readonly value = model.required<string>();
  readonly ariaLabel = input('');

  private readonly segmentBtns = viewChildren<ElementRef<HTMLButtonElement>>('segmentBtn');
  private readonly segmentFocusItems = viewChildren(SegmentFocusItemDirective);
  private readonly destroyRef = inject(DestroyRef);
  // Captured injection context so afterNextRender() can be called from
  // inside an effect() callback (which is not an injection context).
  private readonly injector = inject(Injector);

  private keyManager: FocusKeyManager<SegmentFocusItemDirective> | null = null;

  protected readonly indicatorLeft = signal(2);
  protected readonly indicatorWidth = signal(0);

  constructor() {
    // Update the sliding indicator position whenever value or options change.
    // effect() reacts to signal changes; afterNextRender() (with the captured
    // injector) defers DOM reads until after paint; untracked() prevents writes
    // from feeding back as reactive dependencies.
    effect(() => {
      const val = this.value();
      const opts = this.options();
      afterNextRender(() => {
        const btns = untracked(() => this.segmentBtns());
        const idx = opts.findIndex((o) => o.value === val);
        if (idx >= 0 && btns[idx]) {
          const el = btns[idx].nativeElement;
          const newLeft = el.offsetLeft;
          const newWidth = el.offsetWidth;
          untracked(() => {
            if (this.indicatorLeft() !== newLeft) this.indicatorLeft.set(newLeft);
            if (this.indicatorWidth() !== newWidth) this.indicatorWidth.set(newWidth);
          });
        }

        // Rebuild key manager when items change
        untracked(() => this.buildKeyManager());
      }, { injector: this.injector });
    });
  }

  ngAfterViewInit(): void {
    this.buildKeyManager();
  }

  private buildKeyManager(): void {
    const items = this.segmentFocusItems();
    if (items.length === 0) return;

    this.keyManager = new FocusKeyManager<SegmentFocusItemDirective>(items)
      .withWrap()
      .withHorizontalOrientation('ltr')
      .withTypeAhead(200);

    // Set initial active item to the currently selected segment
    const activeIdx = this.options().findIndex((o) => o.value === this.value());
    if (activeIdx >= 0) {
      this.keyManager.setActiveItem(activeIdx);
    }
  }

  protected select(val: string, index: number): void {
    this.value.set(val);
    this.keyManager?.setActiveItem(index);
  }

  protected onKeydown(event: KeyboardEvent, currentIndex: number): void {
    const km = this.keyManager;
    if (!km) return;

    const opts = this.options();
    const btns = this.segmentBtns();

    // Home / End — jump to first/last
    if (event.key === 'Home') {
      event.preventDefault();
      const firstOpt = opts[0];
      if (firstOpt) {
        this.value.set(firstOpt.value);
        km.setActiveItem(0);
        btns[0]?.nativeElement.focus();
      }
      return;
    }
    if (event.key === 'End') {
      event.preventDefault();
      const lastIdx = opts.length - 1;
      const lastOpt = opts[lastIdx];
      if (lastOpt) {
        this.value.set(lastOpt.value);
        km.setActiveItem(lastIdx);
        btns[lastIdx]?.nativeElement.focus();
      }
      return;
    }

    // Delegate arrow keys and typeahead to FocusKeyManager
    km.onKeydown(event);

    // After focus moves, activate the newly focused segment (follow-focus ARIA pattern)
    const newIdx = km.activeItemIndex;
    if (newIdx !== null && newIdx >= 0 && newIdx < opts.length) {
      this.value.set(opts[newIdx].value);
    }
  }
}
