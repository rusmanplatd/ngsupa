import {
  Directive,
  input,
  inject,
  ElementRef,
  OnDestroy,
  Component,
} from '@angular/core';
import { Overlay, OverlayRef, ConnectedPosition } from '@angular/cdk/overlay';
import { ComponentPortal } from '@angular/cdk/portal';
import { A11yModule } from '@angular/cdk/a11y';

@Component({
  selector: 'app-popover-content',
  imports: [A11yModule],
  host: {
    class: 'block',
    role: 'dialog',
    'aria-modal': 'false',
    '(keydown.escape)': 'onEscape()',
  },
  template: `
    <div
      cdkTrapFocus
      cdkTrapFocusAutoCapture
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
  /** Called by the host (keydown.escape) to close the overlay. */
  onEscapeFn: (() => void) | null = null;

  onEscape(): void {
    this.onEscapeFn?.();
  }
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
  private _isOpen = false;

  toggle(): void {
    if (this._isOpen) {
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
    this.overlayRef.keydownEvents().subscribe((e) => {
      if (e.key === 'Escape') this.hide();
    });

    const portal = new ComponentPortal(PopoverContentComponent);
    const ref = this.overlayRef.attach(portal);
    ref.instance.message = this.appPopover();
    ref.instance.title = this.popoverTitle() || '';
    ref.instance.onEscapeFn = () => this.hide();
    this._isOpen = true;
  }

  hide(): void {
    this.overlayRef?.detach();
    this.overlayRef?.dispose();
    this.overlayRef = null;
    this._isOpen = false;
    // Return focus to the trigger element
    this.elementRef.nativeElement.focus();
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
