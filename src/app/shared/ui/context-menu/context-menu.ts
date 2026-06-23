import {
  Component,
  Service,
  inject,
  signal,
  output,
  ElementRef,
} from '@angular/core';
import { Overlay, OverlayRef, ConnectedPosition } from '@angular/cdk/overlay';
import { ComponentPortal } from '@angular/cdk/portal';
import { LucideDynamicIcon } from '@lucide/angular';

export interface ContextMenuItem {
  id: string;
  label: string;
  icon?: string;
  shortcut?: string;
  destructive?: boolean;
  disabled?: boolean;
  separator?: boolean;
}

@Service()
export class ContextMenuService {
  private readonly overlay = inject(Overlay);
  private overlayRef: OverlayRef | null = null;

  open(items: ContextMenuItem[], origin: { x: number; y: number }): Promise<string | null> {
    this.close();

    return new Promise<string | null>((resolve) => {
      const positionStrategy = this.overlay
        .position()
        .global()
        .left(`${origin.x}px`)
        .top(`${origin.y}px`);

      this.overlayRef = this.overlay.create({
        positionStrategy,
        scrollStrategy: this.overlay.scrollStrategies.close(),
        hasBackdrop: true,
        backdropClass: 'cdk-overlay-transparent-backdrop',
      });

      this.overlayRef.backdropClick().subscribe(() => {
        this.close();
        resolve(null);
      });

      this.overlayRef.keydownEvents().subscribe((event) => {
        if (event.key === 'Escape') {
          this.close();
          resolve(null);
        }
      });

      const portal = new ComponentPortal(ContextMenuPanelComponent);
      const ref = this.overlayRef.attach(portal);
      ref.instance.items.set(items);
      ref.instance.selected.subscribe((id: string | null) => {
        this.close();
        resolve(id);
      });
    });
  }

  close(): void {
    this.overlayRef?.detach();
    this.overlayRef?.dispose();
    this.overlayRef = null;
  }
}

@Component({
  selector: 'app-context-menu-panel',
  imports: [LucideDynamicIcon],
  host: {
    class: 'block',
    role: 'menu',
    '(keydown.arrowDown)': 'focusNext()',
    '(keydown.arrowUp)': 'focusPrev()',
  },
  template: `
    <div
      class="min-w-[200px] max-w-[280px] rounded-xl bg-[var(--glass-bg-thick)] backdrop-blur-xl border border-[var(--glass-border)] shadow-xl overflow-hidden py-1"
      style="animation: scale-in 0.15s var(--ease-default)"
    >
      @for (item of items(); track item.id) {
        @if (item.separator) {
          <div class="my-1 h-px bg-[var(--separator)]" role="separator"></div>
        } @else {
          <button
            type="button"
            role="menuitem"
            [disabled]="item.disabled"
            class="flex w-full items-center gap-3 px-3 py-2 text-left text-sm transition-colors duration-fast"
            [class]="menuItemClasses(item)"
            (click)="select(item.id)"
          >
            @if (item.icon) {
              <svg [lucideIcon]="item.icon" [size]="16" class="shrink-0" />
            }
            <span class="flex-1 min-w-0 truncate">{{ item.label }}</span>
            @if (item.shortcut) {
              <span class="shrink-0 text-xs text-[var(--text-quaternary)] ml-4">{{ item.shortcut }}</span>
            }
          </button>
        }
      }
    </div>
  `,
})
export class ContextMenuPanelComponent {
  readonly items = signal<ContextMenuItem[]>([]);
  readonly selected = output<string | null>();

  private focusedIndex = -1;

  protected menuItemClasses(item: ContextMenuItem): string {
    if (item.disabled) {
      return 'opacity-40 cursor-not-allowed';
    }
    if (item.destructive) {
      return 'text-system-red hover:bg-system-red/10';
    }
    return 'text-[var(--text-primary)] hover:bg-[var(--fill-primary)]';
  }

  protected select(id: string): void {
    this.selected.emit(id);
  }

  protected focusNext(): void {
    const actionableItems = this.items().filter((i) => !i.separator && !i.disabled);
    this.focusedIndex = (this.focusedIndex + 1) % actionableItems.length;
  }

  protected focusPrev(): void {
    const actionableItems = this.items().filter((i) => !i.separator && !i.disabled);
    this.focusedIndex = (this.focusedIndex - 1 + actionableItems.length) % actionableItems.length;
  }
}
