import {
  Directive,
  Component,
  input,
  inject,
  ElementRef,
  OnDestroy,
  signal,
} from '@angular/core';
import { Overlay, OverlayRef, ConnectedPosition } from '@angular/cdk/overlay';
import { ComponentPortal } from '@angular/cdk/portal';

@Component({
  selector: 'app-popover-content',
  host: {
    class: 'block',
    role: 'dialog',
    'aria-modal': 'false',
  },
  template: `
    <div
      class="rounded-2xl bg-[var(--glass-bg-thick)] backdrop-blur-xl border border-[var(--glass-border)] shadow-xl overflow-hidden"
      style="animation: scale-in 0.2s var(--ease-default)"
    >
      <div class="p-4">
        @if (title) {
          <p class="text-sm font-semibold text-[var(--text-primary)] mb-1">{{ title }}</p>
        }
        @if (message) {
          <p class="text-sm text-[var(--text-secondary)]">{{ message }}</p>
        }
      </div>
    </div>
  `,
})
export class PopoverContentComponent {
  title = '';
  message = '';
}

@Directive({
  selector: '[appPopover]',
  host: {
    '(click)': 'toggle()',
    '(keydown.escape)': 'hide()',
  },
})
export class PopoverDirective implements OnDestroy {
  readonly appPopover = input.required<string>();
  readonly popoverTitle = input<string | null>(null);
  readonly popoverPosition = input<'top' | 'bottom' | 'left' | 'right'>('bottom');

  private readonly overlay = inject(Overlay);
  private readonly elementRef = inject(ElementRef);
  private overlayRef: OverlayRef | null = null;
  private readonly isOpen = signal(false);

  toggle(): void {
    if (this.isOpen()) {
      this.hide();
    } else {
      this.show();
    }
  }

  show(): void {
    if (!this.appPopover() || this.overlayRef?.hasAttached()) return;

    const positions = this.getPositions();
    const positionStrategy = this.overlay
      .position()
      .flexibleConnectedTo(this.elementRef)
      .withPositions(positions)
      .withPush(true);

    this.overlayRef = this.overlay.create({
      positionStrategy,
      scrollStrategy: this.overlay.scrollStrategies.reposition(),
      hasBackdrop: true,
      backdropClass: 'cdk-overlay-transparent-backdrop',
    });

    this.overlayRef.backdropClick().subscribe(() => this.hide());

    const portal = new ComponentPortal(PopoverContentComponent);
    const ref = this.overlayRef.attach(portal);
    ref.instance.message = this.appPopover();
    ref.instance.title = this.popoverTitle() || '';
    this.isOpen.set(true);
  }

  hide(): void {
    this.overlayRef?.detach();
    this.overlayRef?.dispose();
    this.overlayRef = null;
    this.isOpen.set(false);
  }

  private getPositions(): ConnectedPosition[] {
    const gap = 8;
    const posMap: Record<string, ConnectedPosition[]> = {
      top: [
        { originX: 'center', originY: 'top', overlayX: 'center', overlayY: 'bottom', offsetY: -gap },
        { originX: 'center', originY: 'bottom', overlayX: 'center', overlayY: 'top', offsetY: gap },
      ],
      bottom: [
        { originX: 'center', originY: 'bottom', overlayX: 'center', overlayY: 'top', offsetY: gap },
        { originX: 'center', originY: 'top', overlayX: 'center', overlayY: 'bottom', offsetY: -gap },
      ],
      left: [
        { originX: 'start', originY: 'center', overlayX: 'end', overlayY: 'center', offsetX: -gap },
        { originX: 'end', originY: 'center', overlayX: 'start', overlayY: 'center', offsetX: gap },
      ],
      right: [
        { originX: 'end', originY: 'center', overlayX: 'start', overlayY: 'center', offsetX: gap },
        { originX: 'start', originY: 'center', overlayX: 'end', overlayY: 'center', offsetX: -gap },
      ],
    };
    return posMap[this.popoverPosition()] || posMap['bottom'];
  }

  ngOnDestroy(): void {
    this.hide();
  }
}
