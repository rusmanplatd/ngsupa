import { Component, input, computed } from '@angular/core';

export type ToolbarVariant = 'default' | 'prominent';

@Component({
  selector: 'app-toolbar',
  host: {
    class: 'block',
    role: 'toolbar',
    '[attr.aria-label]': 'ariaLabel()',
  },
  template: `
    <div [class]="containerClasses()">
      <div class="flex items-center justify-between gap-3 px-4 py-3 mx-auto max-w-3xl">
        <div class="flex items-center gap-2 min-w-0">
          <ng-content select="[toolbar-leading]" />
        </div>
        <div class="flex items-center gap-2">
          <ng-content />
        </div>
        <div class="flex items-center gap-2">
          <ng-content select="[toolbar-trailing]" />
        </div>
      </div>
    </div>
  `,
  styles: `
    :host {
      position: sticky;
      bottom: 0;
      z-index: var(--z-sticky);
    }
  `,
})
export class ToolbarComponent {
  readonly variant = input<ToolbarVariant>('default');
  readonly ariaLabel = input('Toolbar');

  protected readonly containerClasses = computed(() => {
    const base = 'border-t border-[var(--border-default)]';
    if (this.variant() === 'prominent') {
      return `${base} bg-[var(--glass-bg-thick)] backdrop-blur-xl shadow-lg py-1`;
    }
    return `${base} bg-[var(--glass-bg)] backdrop-blur-xl`;
  });
}
