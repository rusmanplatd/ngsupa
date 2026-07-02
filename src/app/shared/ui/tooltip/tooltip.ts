import {
  Directive,
  input,
  inject,
  ElementRef,
  OnDestroy,
  TemplateRef,
  Component,
} from '@angular/core';
import { Overlay, OverlayRef, ConnectedPosition } from '@angular/cdk/overlay';
import { ComponentPortal } from '@angular/cdk/portal';

@Component({
  selector: 'app-tooltip-content',
  host: {
    role: 'tooltip',
    class: 'block pointer-events-none animate-tooltip-in',
  },
  template: `
    <div class="rounded-lg bg-[var(--surface-elevated)] border border-[var(--border-default)] px-3 py-1.5 text-xs font-medium text-[var(--text-primary)] shadow-md max-w-[240px]">
      {{ text }}
    </div>
  `,
  styles: `
    @keyframes tooltip-in {
      from { opacity: 0; transform: scale(0.95); }
      to   { opacity: 1; transform: scale(1); }
    }
    :host {
      animation: tooltip-in 0.15s ease-out;
    }
  `,
})
export class TooltipContentComponent {
  text = '';
}

@Directive({
  selector: '[appTooltip]',
  host: {
    '(mouseenter)': 'show()',
    '(mouseleave)': 'hide()',
    '(focus)': 'show()',
    '(blur)': 'hide()',
    '(keydown.escape)': 'hide()',
  },
})
export class TooltipDirective implements OnDestroy {
  readonly appTooltip = input.required<string>();
  readonly tooltipPosition = input<'top' | 'bottom' | 'left' | 'right'>('top');
  readonly tooltipDelay = input(400);

  private readonly overlay = inject(Overlay);
  private readonly elementRef = inject(ElementRef);
  private overlayRef: OverlayRef | null = null;
  private showTimer: ReturnType<typeof setTimeout> | null = null;

  show(): void {
    if (!this.appTooltip() || this.overlayRef?.hasAttached()) return;

    this.showTimer = setTimeout(() => {
      const positions = this.getPositions();
      const positionStrategy = this.overlay
        .position()
        .flexibleConnectedTo(this.elementRef)
        .withPositions(positions)
        .withPush(true);

      this.overlayRef = this.overlay.create({
        positionStrategy,
        scrollStrategy: this.overlay.scrollStrategies.close(),
        panelClass: 'app-tooltip-panel',
      });

      const portal = new ComponentPortal(TooltipContentComponent);
      const ref = this.overlayRef.attach(portal);
      ref.instance.text = this.appTooltip();
    }, this.tooltipDelay());
  }

  hide(): void {
    if (this.showTimer) {
      clearTimeout(this.showTimer);
      this.showTimer = null;
    }
    this.overlayRef?.detach();
    this.overlayRef?.dispose();
    this.overlayRef = null;
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
    return posMap[this.tooltipPosition()] || posMap['top'];
  }

  ngOnDestroy(): void {
    this.hide();
  }
}
