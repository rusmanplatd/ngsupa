import {
  Component,
  ElementRef,
  input,
  output,
  signal,
  viewChild,
  computed,
} from '@angular/core';
import { LucideDynamicIcon } from '@lucide/angular';

export type InputState = 'default' | 'error' | 'success';

@Component({
  selector: 'app-input',
  imports: [LucideDynamicIcon],
  host: {
    class: 'block',
    '(click)': 'focusInput()',
  },
  template: `
    <div
      class="relative flex items-center rounded-xl border transition-all duration-normal"
      [class]="containerClasses()"
      [style.box-shadow]="containerShadow()"
    >
      @if (leadingIcon()) {
        <svg
          [lucideIcon]="leadingIcon()!"
          [size]="18"
          class="ml-3 shrink-0 transition-colors duration-fast"
          [class]="focused() ? 'text-system-blue' : 'text-[var(--text-tertiary)]'"
        />
      }
      <div class="relative flex-1 min-w-0">
        <input
          #inputEl
          [id]="inputId()"
          [type]="currentType()"
          [placeholder]="' '"
          [disabled]="disabled()"
          [readonly]="readonly()"
          [attr.aria-invalid]="error() ? 'true' : null"
          [attr.aria-required]="required() || null"
          [attr.aria-describedby]="descriptionId()"
          [attr.autocomplete]="autocomplete()"
          [attr.inputmode]="resolvedInputMode()"
          [attr.maxlength]="maxLength() || null"
          [value]="value()"
          (input)="onInput($event)"
          (focus)="focused.set(true)"
          (blur)="focused.set(false)"
          class="peer block w-full bg-transparent px-3 pb-2 pt-5 text-base text-[var(--text-primary)] outline-none placeholder-transparent"
        />
        <label
          [for]="inputId()"
          class="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-base transition-all duration-normal ease-default peer-not-placeholder-shown:top-2.5 peer-not-placeholder-shown:translate-y-0 peer-not-placeholder-shown:text-xs peer-focus:top-2.5 peer-focus:translate-y-0 peer-focus:text-xs"
          [class]="focused() ? 'text-system-blue' : 'text-[var(--text-tertiary)]'"
        >
          {{ label() }}
        </label>
      </div>

      <!-- Trailing elements -->
      @if (type() === 'password') {
        <button
          type="button"
          tabindex="-1"
          class="mr-2 p-1.5 rounded-lg text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] hover:bg-[var(--fill-primary)] active:scale-90 transition-all duration-fast"
          [attr.aria-label]="showPassword() ? 'Hide password' : 'Show password'"
          (click)="togglePassword()"
        >
          <svg [lucideIcon]="showPassword() ? 'eye-off' : 'eye'" [size]="18" />
        </button>
      }
      @if (clearable() && value() && type() !== 'password') {
        <button
          type="button"
          tabindex="-1"
          class="clear-btn mr-2 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[var(--fill-secondary)] text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] hover:bg-[var(--text-quaternary)] active:scale-90 transition-all duration-fast"
          aria-label="Clear"
          (click)="onClear()"
        >
          <svg lucideIcon="x" [size]="12" />
        </button>
      }
      @if (state() === 'success' && !focused()) {
        <svg lucideIcon="check" [size]="18" class="mr-3 text-system-green shrink-0 success-icon" />
      }
      @if (trailingIcon() && type() !== 'password' && state() !== 'success') {
        <svg
          [lucideIcon]="trailingIcon()!"
          [size]="18"
          class="mr-3 text-[var(--text-tertiary)] shrink-0"
        />
      }
    </div>

    <div class="mt-1.5 flex items-center justify-between px-1">
      <div class="flex-1 min-w-0">
        @if (error()) {
          <p [id]="inputId() + '-error'" role="alert" class="text-xs text-system-red">
            {{ error() }}
          </p>
        } @else if (hint()) {
          <p [id]="inputId() + '-hint'" class="text-xs text-[var(--text-tertiary)]">{{ hint() }}</p>
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
    input:-webkit-autofill,
    input:-webkit-autofill:hover,
    input:-webkit-autofill:focus {
      -webkit-text-fill-color: var(--text-primary);
      transition: background-color 5000s ease-in-out 0s;
    }

    input[readonly] {
      cursor: default;
    }

    :host([aria-disabled='true']),
    :host:has(input:disabled) {
      filter: grayscale(0.3);
      opacity: 0.5;
      pointer-events: none;
    }

    .clear-btn {
      animation: clear-btn-in 0.2s var(--ease-spring);
    }

    .success-icon {
      animation: glow-pulse 2s ease-in-out infinite, spring-scale-sm 0.3s ease-out;
    }
  `,
})
export class InputComponent {
  readonly label = input.required<string>();
  readonly type = input<'text' | 'email' | 'password' | 'tel' | 'url' | 'number'>('text');
  readonly value = input('');
  readonly error = input<string | null>(null);
  readonly hint = input<string | null>(null);
  readonly disabled = input(false);
  readonly readonly = input(false);
  readonly required = input(false);
  readonly autocomplete = input<string>('off');
  readonly inputMode = input<string | null>(null);
  readonly leadingIcon = input<string | null>(null);
  readonly trailingIcon = input<string | null>(null);
  readonly inputId = input('input-' + Math.random().toString(36).slice(2, 9));
  readonly maxLength = input<number | null>(null);
  readonly showCounter = input(true);
  readonly clearable = input(false);
  readonly state = input<InputState>('default');

  readonly valueChange = output<string>();
  readonly cleared = output<void>();

  protected readonly focused = signal(false);
  protected readonly showPassword = signal(false);
  protected readonly charCount = signal(0);
  private readonly inputElRef = viewChild<ElementRef<HTMLInputElement>>('inputEl');

  protected readonly currentType = computed(() => {
    if (this.type() === 'password' && this.showPassword()) return 'text';
    return this.type();
  });

  protected readonly resolvedInputMode = computed(() => {
    if (this.inputMode()) return this.inputMode();
    if (this.type() === 'tel') return 'tel';
    if (this.type() === 'number') return 'decimal';
    if (this.type() === 'email') return 'email';
    if (this.type() === 'url') return 'url';
    return null;
  });

  protected readonly descriptionId = computed(() => {
    if (this.error()) return this.inputId() + '-error';
    if (this.hint()) return this.inputId() + '-hint';
    return null;
  });

  protected readonly containerClasses = computed(() => {
    const base = 'backdrop-blur-sm';
    if (this.error() || this.state() === 'error') {
      return `${base} border-system-red bg-[var(--surface-primary)]`;
    }
    if (this.state() === 'success' && !this.focused()) {
      return `${base} border-system-green bg-[var(--surface-primary)]`;
    }
    if (this.focused()) {
      return `${base} border-system-blue bg-[var(--surface-primary)]`;
    }
    return `${base} border-[var(--border-default)] bg-[var(--form-field-glass)] hover:border-[var(--border-opaque)]`;
  });

  protected readonly containerShadow = computed(() => {
    const inset = 'var(--form-field-shadow)';
    if (this.error() || this.state() === 'error') {
      return `${inset}, var(--form-control-glow-red)`;
    }
    if (this.state() === 'success' && !this.focused()) {
      return `${inset}, var(--form-control-glow-green)`;
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
    const val = (event.target as HTMLInputElement).value;
    this.charCount.set(val.length);
    this.valueChange.emit(val);
  }

  protected onClear(): void {
    this.charCount.set(0);
    this.valueChange.emit('');
    this.cleared.emit();
    this.inputElRef()?.nativeElement.focus();
  }

  protected togglePassword(): void {
    this.showPassword.update((v) => !v);
  }

  focusInput(): void {
    this.inputElRef()?.nativeElement.focus();
  }
}
