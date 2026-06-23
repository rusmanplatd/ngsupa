import {
  Component,
  input,
  output,
  signal,
  computed,
  viewChild,
  ElementRef,
  OnDestroy,
} from '@angular/core';
import { LucideDynamicIcon } from '@lucide/angular';

@Component({
  selector: 'app-search-bar',
  imports: [LucideDynamicIcon],
  host: {
    class: 'block',
  },
  template: `
    <div class="relative flex items-center" [class]="expanded() ? 'gap-2' : ''">
      <div
        class="relative flex flex-1 items-center rounded-xl transition-all duration-normal"
        [class]="containerClasses()"
        [style.box-shadow]="containerShadow()"
      >
        <svg
          lucideIcon="search"
          [size]="16"
          class="ml-3 shrink-0 transition-colors duration-normal"
          [class]="expanded() ? 'text-system-blue' : 'text-[var(--text-tertiary)]'"
        />
        <input
          #searchInput
          type="search"
          [placeholder]="placeholder()"
          [value]="value()"
          (input)="onInput($event)"
          (focus)="onFocus()"
          (blur)="onBlur()"
          (keydown.escape)="onClear()"
          class="block w-full bg-transparent py-2.5 pl-2 pr-3 text-sm text-[var(--text-primary)] outline-none placeholder:text-[var(--text-tertiary)]"
          [attr.aria-label]="placeholder()"
        />
        @if (value()) {
          <button
            type="button"
            tabindex="-1"
            class="clear-btn mr-2 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[var(--fill-secondary)] text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] hover:bg-[var(--text-quaternary)] active:scale-90 transition-all duration-fast"
            aria-label="Clear search"
            (click)="onClear()"
          >
            <svg lucideIcon="x" [size]="12" />
          </button>
        }
      </div>
      @if (showCancel() && expanded()) {
        <button
          type="button"
          class="cancel-btn shrink-0 text-sm font-medium text-system-blue transition-all duration-fast hover:opacity-70 active:scale-95"
          (click)="onCancel()"
        >
          Cancel
        </button>
      }
    </div>
  `,
  styles: `
    input[type='search']::-webkit-search-cancel-button {
      display: none;
    }

    .clear-btn {
      animation: clear-btn-in 0.2s var(--ease-spring);
    }

    .cancel-btn {
      animation: cancel-slide-in 0.25s var(--ease-spring);
    }

    @keyframes cancel-slide-in {
      from {
        opacity: 0;
        transform: translateX(12px);
      }
      to {
        opacity: 1;
        transform: translateX(0);
      }
    }
  `,
})
export class SearchBarComponent implements OnDestroy {
  readonly placeholder = input('Search…');
  readonly value = input('');
  readonly showCancel = input(true);
  readonly debounceMs = input(300);

  readonly valueChange = output<string>();
  readonly search = output<string>();
  readonly cancelled = output<void>();

  protected readonly expanded = signal(false);
  private readonly searchInputRef = viewChild<ElementRef<HTMLInputElement>>('searchInput');
  private debounceTimer: ReturnType<typeof setTimeout> | null = null;

  protected readonly containerClasses = computed(() => {
    if (this.expanded()) {
      return 'bg-[var(--surface-primary)] border border-system-blue backdrop-blur-sm';
    }
    return 'bg-[var(--form-field-glass)] border border-transparent hover:bg-[var(--fill-secondary)] backdrop-blur-sm';
  });

  protected readonly containerShadow = computed(() => {
    if (this.expanded()) {
      return 'var(--form-field-shadow), var(--form-control-glow)';
    }
    return 'var(--form-field-shadow)';
  });

  protected onInput(event: Event): void {
    const val = (event.target as HTMLInputElement).value;
    this.valueChange.emit(val);

    if (this.debounceTimer) clearTimeout(this.debounceTimer);
    this.debounceTimer = setTimeout(() => {
      this.search.emit(val);
    }, this.debounceMs());
  }

  protected onFocus(): void {
    this.expanded.set(true);
  }

  protected onBlur(): void {
    if (!this.value()) {
      this.expanded.set(false);
    }
  }

  protected onClear(): void {
    this.valueChange.emit('');
    this.search.emit('');
    this.searchInputRef()?.nativeElement.focus();
  }

  protected onCancel(): void {
    this.valueChange.emit('');
    this.search.emit('');
    this.expanded.set(false);
    this.cancelled.emit();
    this.searchInputRef()?.nativeElement.blur();
  }

  ngOnDestroy(): void {
    if (this.debounceTimer) clearTimeout(this.debounceTimer);
  }
}
