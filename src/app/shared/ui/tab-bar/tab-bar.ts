import { Component, input, model, output } from '@angular/core';
import { IconComponent } from '../icon/icon';

export interface Tab {
  id: string;
  label: string;
  icon: string;
  route?: string;
}

@Component({
  selector: 'app-tab-bar',
  imports: [IconComponent],
  host: {
    class: 'block fixed bottom-0 left-0 right-0 z-50 md:hidden',
    role: 'tablist',
  },
  template: `
    <div class="flex items-end justify-around bg-[var(--glass-bg-thick)] backdrop-blur-xl border-t border-[var(--separator)] pb-[env(safe-area-inset-bottom)]">
      @for (tab of tabs(); track tab.id) {
        <button
          type="button"
          role="tab"
          [attr.aria-selected]="activeTab() === tab.id"
          [attr.aria-label]="tab.label"
          class="flex flex-1 flex-col items-center gap-0.5 pb-1 pt-2 transition-colors duration-fast"
          [class]="activeTab() === tab.id
            ? 'text-system-blue'
            : 'text-[var(--text-tertiary)]'"
          (click)="activeTab.set(tab.id); tabPressed.emit(tab)"
        >
          <app-icon [name]="tab.icon" [size]="22" />
          <span class="text-[10px] font-medium">{{ tab.label }}</span>
        </button>
      }
    </div>
  `,
})
export class TabBarComponent {
  readonly tabs = input.required<Tab[]>();
  readonly activeTab = model.required<string>();
  readonly tabPressed = output<Tab>();
}
