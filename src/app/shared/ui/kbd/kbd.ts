import { Component, input, computed } from '@angular/core';

@Component({
  selector: 'app-kbd',
  host: {
    class: 'inline-flex items-center gap-1',
    '[attr.aria-label]': '"Keyboard shortcut: " + keys()',
  },
  template: `
    @for (key of keyParts(); track $index) {
      @if ($index > 0) {
        <span class="text-[var(--text-quaternary)] text-[10px]">+</span>
      }
      <kbd
        class="inline-flex items-center justify-center rounded-md border font-mono text-xs leading-none"
        [class]="keyClasses()"
      >
        {{ key }}
      </kbd>
    }
  `,
  styles: `
    :host {
      vertical-align: baseline;
    }
  `,
})
export class KbdComponent {
  readonly keys = input.required<string>();
  readonly size = input<'sm' | 'md'>('sm');

  protected readonly keyParts = computed(() =>
    this.keys().split('+').map((k) => k.trim())
  );

  protected readonly keyClasses = computed(() => {
    const s = this.size();
    const sizeMap = {
      sm: 'min-w-[20px] h-5 px-1.5 text-[10px]',
      md: 'min-w-[24px] h-6 px-2 text-xs',
    };
    return `${sizeMap[s]} bg-[var(--fill-primary)] border-[var(--border-opaque)] text-[var(--text-secondary)] shadow-xs`;
  });
}
