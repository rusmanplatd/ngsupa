import {
  Component,
  ElementRef,
  input,
  output,
  signal,
  viewChild,
  computed,
  afterRenderEffect,
} from '@angular/core';

@Component({
  selector: 'app-textarea',
  imports: [],
  host: {
    class: 'block',
    '(click)': 'focusInput()',
  },
  template: `
    <div
      class="relative flex rounded-xl border transition-all duration-normal backdrop-blur-sm"
      [class]="containerClasses()"
      [style.box-shadow]="containerShadow()"
    >
      <div class="relative flex-1 min-w-0">
        <textarea
          #textareaEl
          [id]="inputId()"
          [placeholder]="' '"
          [disabled]="disabled()"
          [readonly]="readonly()"
          [attr.aria-invalid]="error() ? 'true' : null"
          [attr.aria-describedby]="error() ? inputId() + '-error' : null"
          [attr.maxlength]="maxLength() || null"
          [rows]="minRows()"
          [value]="value()"
          (input)="onInput($event)"
          (focus)="focused.set(true)"
          (blur)="focused.set(false)"
          class="peer block w-full resize-none bg-transparent px-3 pb-2 pt-5 text-base text-[var(--text-primary)] outline-none placeholder-transparent"
          [style.min-height.px]="minRows() * 24"
          [style.max-height.px]="maxRows() ? maxRows()! * 24 : undefined"
        ></textarea>
        <label
          [for]="inputId()"
          class="pointer-events-none absolute left-3 top-3 text-base transition-all duration-normal ease-default peer-not-placeholder-shown:top-1.5 peer-not-placeholder-shown:text-xs peer-focus:top-1.5 peer-focus:text-xs"
          [class]="focused() ? 'text-system-blue' : 'text-[var(--text-tertiary)]'"
        >
          {{ label() }}
        </label>
      </div>
    </div>

    <div class="mt-1.5 flex items-center justify-between px-1">
      <div class="flex-1 min-w-0">
        @if (error()) {
          <p [id]="inputId() + '-error'" role="alert" class="text-xs text-system-red">
            {{ error() }}
          </p>
        } @else if (hint()) {
          <p class="text-xs text-[var(--text-tertiary)]">{{ hint() }}</p>
        }
      </div>
      @if (maxLength() && showCounter()) {
        <span
          class="shrink-0 ml-2 text-xs tabular-nums transition-colors duration-normal"
          [class]="counterClasses()"
        >
          {{ charCount() }}/{{ maxLength() }}
        </span>
      }
    </div>
  `,
  styles: `
    textarea {
      field-sizing: content;
      transition: height 0.2s var(--ease-default);
    }

    :host:has(textarea:disabled) {
      filter: grayscale(0.3);
      opacity: 0.5;
      pointer-events: none;
    }
  `,
})
export class TextareaComponent {
  readonly label = input.required<string>();
  readonly value = input('');
  readonly error = input<string | null>(null);
  readonly hint = input<string | null>(null);
  readonly disabled = input(false);
  readonly readonly = input(false);
  readonly maxLength = input<number | null>(null);
  readonly showCounter = input(true);
  readonly minRows = input(3);
  readonly maxRows = input<number | null>(null);
  readonly autoGrow = input(true);
  readonly inputId = input('textarea-' + Math.random().toString(36).slice(2, 9));

  readonly valueChange = output<string>();

  protected readonly focused = signal(false);
  protected readonly charCount = signal(0);
  private readonly textareaElRef = viewChild<ElementRef<HTMLTextAreaElement>>('textareaEl');

  constructor() {
    afterRenderEffect(() => {
      const el = this.textareaElRef()?.nativeElement;
      if (el) this.charCount.set(el.value.length);
    });
  }

  protected readonly containerClasses = computed(() => {
    if (this.error()) {
      return 'border-system-red bg-[var(--surface-primary)]';
    }
    if (this.focused()) {
      return 'border-system-blue bg-[var(--surface-primary)]';
    }
    return 'border-[var(--border-default)] bg-[var(--form-field-glass)] hover:border-[var(--border-opaque)]';
  });

  protected readonly containerShadow = computed(() => {
    const inset = 'var(--form-field-shadow)';
    if (this.error()) {
      return `${inset}, var(--form-control-glow-red)`;
    }
    if (this.focused()) {
      return `${inset}, var(--form-control-glow)`;
    }
    return inset;
  });

  protected readonly counterClasses = computed(() => {
    const count = this.charCount();
    const max = this.maxLength();
    if (!max) return 'text-[var(--text-tertiary)]';
    const pct = count / max;
    if (pct > 1) return 'text-system-red font-medium';
    if (pct > 0.9) return 'text-system-orange font-medium';
    if (pct > 0.75) return 'text-system-yellow';
    return 'text-[var(--text-tertiary)]';
  });

  protected onInput(event: Event): void {
    const el = event.target as HTMLTextAreaElement;
    this.charCount.set(el.value.length);
    this.valueChange.emit(el.value);

    // Auto-grow
    if (this.autoGrow()) {
      el.style.height = 'auto';
      const maxH = this.maxRows() ? this.maxRows()! * 24 : Infinity;
      el.style.height = `${Math.min(el.scrollHeight, maxH)}px`;
    }
  }

  focusInput(): void {
    this.textareaElRef()?.nativeElement.focus();
  }
}
