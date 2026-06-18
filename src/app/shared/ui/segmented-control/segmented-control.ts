import {
  Component,
  input,
  model,
  computed,
  signal,
  ElementRef,
  viewChildren,
  afterRenderEffect,
} from '@angular/core';

export interface SegmentOption {
  value: string;
  label: string;
}

@Component({
  selector: 'app-segmented-control',
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
          type="button"
          role="radio"
          [attr.aria-checked]="value() === option.value"
          class="relative z-10 cursor-pointer rounded-md px-4 py-1.5 text-sm font-medium transition-colors duration-fast"
          [class]="value() === option.value
            ? 'text-[var(--text-primary)]'
            : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'"
          (click)="select(option.value)"
          (keydown.arrowRight)="selectNext(i)"
          (keydown.arrowLeft)="selectPrev(i)"
        >
          {{ option.label }}
        </button>
      }
    </div>
  `,
})
export class SegmentedControlComponent {
  readonly options = input.required<SegmentOption[]>();
  readonly value = model.required<string>();
  readonly ariaLabel = input('');

  private readonly segmentBtns = viewChildren<ElementRef<HTMLButtonElement>>('segmentBtn');

  protected readonly indicatorLeft = signal(2);
  protected readonly indicatorWidth = signal(0);

  constructor() {
    afterRenderEffect(() => {
      const btns = this.segmentBtns();
      const val = this.value();
      const opts = this.options();
      const idx = opts.findIndex((o) => o.value === val);
      if (idx >= 0 && btns[idx]) {
        const el = btns[idx].nativeElement;
        this.indicatorLeft.set(el.offsetLeft);
        this.indicatorWidth.set(el.offsetWidth);
      }
    });
  }

  protected select(val: string): void {
    this.value.set(val);
  }

  protected selectNext(currentIndex: number): void {
    const opts = this.options();
    const nextIdx = (currentIndex + 1) % opts.length;
    this.value.set(opts[nextIdx].value);
    this.segmentBtns()[nextIdx]?.nativeElement.focus();
  }

  protected selectPrev(currentIndex: number): void {
    const opts = this.options();
    const prevIdx = (currentIndex - 1 + opts.length) % opts.length;
    this.value.set(opts[prevIdx].value);
    this.segmentBtns()[prevIdx]?.nativeElement.focus();
  }
}
