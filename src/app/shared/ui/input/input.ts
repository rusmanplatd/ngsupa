import {
  Component,
  ElementRef,
  input,
  output,
  signal,
  viewChild,
  computed,
  effect,
} from '@angular/core';
import { IconComponent } from '../icon/icon';

@Component({
  selector: 'app-input',
  imports: [IconComponent],
  host: {
    class: 'block',
    '(click)': 'focusInput()',
  },
  template: `
    <div
      class="relative flex items-center rounded-xl border transition-colors"
      [class]="containerClasses()"
    >
      @if (leadingIcon()) {
        <app-icon
          [name]="leadingIcon()!"
          [size]="18"
          class="ml-3 text-[var(--text-tertiary)] shrink-0"
        />
      }
      <div class="relative flex-1 min-w-0">
        <input
          #inputEl
          [id]="inputId()"
          [type]="currentType()"
          [placeholder]="' '"
          [disabled]="disabled()"
          [attr.aria-invalid]="error() ? 'true' : null"
          [attr.aria-describedby]="error() ? inputId() + '-error' : null"
          [attr.autocomplete]="autocomplete()"
          [value]="value()"
          (input)="onInput($event)"
          (focus)="focused.set(true)"
          (blur)="focused.set(false)"
          class="peer block w-full bg-transparent px-3 pb-2 pt-5 text-base text-[var(--text-primary)] outline-none placeholder-transparent"
        />
        <label
          [for]="inputId()"
          class="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)] text-base transition-all duration-fast ease-out peer-not-placeholder-shown:top-2.5 peer-not-placeholder-shown:translate-y-0 peer-not-placeholder-shown:text-xs peer-focus:top-2.5 peer-focus:translate-y-0 peer-focus:text-xs peer-focus:text-system-blue"
        >
          {{ label() }}
        </label>
      </div>
      @if (type() === 'password') {
        <button
          type="button"
          tabindex="-1"
          class="mr-2 p-1 rounded-md text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] transition-colors duration-fast"
          [attr.aria-label]="showPassword() ? 'Hide password' : 'Show password'"
          (click)="togglePassword()"
        >
          <app-icon [name]="showPassword() ? 'eye-off' : 'eye'" [size]="18" />
        </button>
      }
      @if (trailingIcon() && type() !== 'password') {
        <app-icon
          [name]="trailingIcon()!"
          [size]="18"
          class="mr-3 text-[var(--text-tertiary)] shrink-0"
        />
      }
    </div>
    @if (error()) {
      <p
        [id]="inputId() + '-error'"
        role="alert"
        class="mt-1.5 ml-1 text-xs text-system-red"
      >
        {{ error() }}
      </p>
    }
    @if (hint() && !error()) {
      <p class="mt-1.5 ml-1 text-xs text-[var(--text-tertiary)]">
        {{ hint() }}
      </p>
    }
  `,
  styles: `
    input:-webkit-autofill,
    input:-webkit-autofill:hover,
    input:-webkit-autofill:focus {
      -webkit-text-fill-color: var(--text-primary);
      transition: background-color 5000s ease-in-out 0s;
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
  readonly autocomplete = input<string>('off');
  readonly leadingIcon = input<string | null>(null);
  readonly trailingIcon = input<string | null>(null);
  readonly inputId = input('input-' + Math.random().toString(36).slice(2, 9));

  readonly valueChange = output<string>();

  protected readonly focused = signal(false);
  protected readonly showPassword = signal(false);
  private readonly inputElRef = viewChild<ElementRef<HTMLInputElement>>('inputEl');

  protected readonly currentType = computed(() => {
    if (this.type() === 'password' && this.showPassword()) return 'text';
    return this.type();
  });

  protected readonly containerClasses = computed(() => {
    if (this.error()) {
      return 'border-system-red bg-[var(--surface-primary)]';
    }
    if (this.focused()) {
      return 'border-system-blue bg-[var(--surface-primary)] ring-2 ring-[var(--focus-ring)]';
    }
    return 'border-[var(--border-default)] bg-[var(--fill-primary)] hover:border-[var(--border-opaque)]';
  });

  protected onInput(event: Event): void {
    const val = (event.target as HTMLInputElement).value;
    this.valueChange.emit(val);
  }

  protected togglePassword(): void {
    this.showPassword.update((v) => !v);
  }

  focusInput(): void {
    this.inputElRef()?.nativeElement.focus();
  }
}
