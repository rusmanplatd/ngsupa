import {
  Component,
  input,
  output,
  signal,
  computed,
  contentChildren,
  contentChild,
  viewChild,
  ElementRef,
  afterNextRender,
  Directive,
  DestroyRef,
  inject,
  Injector,
  effect,
  untracked,
  TemplateRef,
} from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { LiveAnnouncer } from '@angular/cdk/a11y';

@Directive({
  selector: '[appCarouselSlide]',
  host: {
    class: 'carousel-slide',
    '[attr.role]': '"group"',
    '[attr.aria-roledescription]': '"slide"',
  },
})
export class CarouselSlideDirective {}

/** Optional thumbnail template directive. Apply to an ng-template inside app-carousel. */
@Directive({
  selector: 'ng-template[appCarouselThumbnail]',
})
export class CarouselThumbnailDirective {
  readonly templateRef = inject(TemplateRef);
}

export type CarouselVariant = 'default' | 'card' | 'fullbleed';

@Component({
  selector: 'app-carousel',
  imports: [NgTemplateOutlet],
  host: {
    class: 'block',
    '[attr.aria-roledescription]': '"carousel"',
    '[attr.aria-label]': 'ariaLabel()',
    // tabindex="0" is required so the host can receive focus and fire keydown events
    tabindex: '0',
    '(keydown)': 'onKeydown($event)',
    '(mouseenter)': 'onPointerEnter()',
    '(mouseleave)': 'onPointerLeave()',
    '(focus)': 'onPointerEnter()',
    '(blur)': 'onPointerLeave()',
    '(touchstart)': 'onTouchStart($event)',
    '(touchmove)': 'onTouchMove($event)',
    '(touchend)': 'onTouchEnd($event)',
  },
  template: `
    <!-- Header row: title + nav arrows + play/pause -->
    @if (title() || showArrows() || (autoplay() > 0 && showPlayPause())) {
      <div class="carousel-header">
        @if (title()) {
          <h3 class="carousel-title">{{ title() }}</h3>
        }
        <div class="carousel-nav" role="group" aria-label="Carousel controls">
          @if (autoplay() > 0 && showPlayPause()) {
            <!-- WCAG 2.1 SC 2.2.2: Visible pause/play button for moving content -->
            <button
              class="carousel-arrow carousel-play-pause"
              (click)="togglePause()"
              [attr.aria-label]="isPaused() ? 'Resume autoplay' : 'Pause autoplay'"
              [attr.aria-pressed]="isPaused()"
              type="button"
            >
              @if (isPaused()) {
                <!-- Play icon -->
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                  <polygon points="5 3 19 12 5 21 5 3"/>
                </svg>
              } @else {
                <!-- Pause icon -->
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                  <rect x="6" y="4" width="4" height="16" rx="1"/>
                  <rect x="14" y="4" width="4" height="16" rx="1"/>
                </svg>
              }
            </button>
          }
          @if (showArrows()) {
            <button
              class="carousel-arrow"
              [class.carousel-arrow--disabled]="currentIndex() === 0"
              [disabled]="currentIndex() === 0"
              (click)="prev()"
              aria-label="Previous slide"
              type="button"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="15 18 9 12 15 6"></polyline>
              </svg>
            </button>
            <button
              class="carousel-arrow"
              [class.carousel-arrow--disabled]="currentIndex() >= maxIndex()"
              [disabled]="currentIndex() >= maxIndex()"
              (click)="next()"
              aria-label="Next slide"
              type="button"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="9 18 15 12 9 6"></polyline>
              </svg>
            </button>
          }
        </div>
      </div>
    }

    <!-- Track -->
    <div
      #trackEl
      class="carousel-track"
      [class.carousel-track--card]="variant() === 'card'"
      [class.carousel-track--fullbleed]="variant() === 'fullbleed'"
      [class.carousel-track--peek]="peek()"
      (scroll)="onScroll()"
      [attr.aria-live]="autoplay() ? 'off' : 'polite'"
    >
      <ng-content select="[appCarouselSlide]" />
    </div>

    <!-- Pagination dots -->
    @if (showDots() && slideCount() > 1 && !showThumbnails()) {
      <div class="carousel-dots" role="tablist" aria-label="Slide pagination">
        @for (dot of dotsArray(); track $index) {
          <button
            class="carousel-dot"
            [class.carousel-dot--active]="$index === currentIndex()"
            (click)="goTo($index)"
            [attr.aria-label]="'Go to slide ' + ($index + 1)"
            [attr.aria-selected]="$index === currentIndex()"
            role="tab"
            type="button"
          ></button>
        }
      </div>
    }

    <!-- Thumbnail strip navigation -->
    @if (showThumbnails() && slideCount() > 1) {
      @if (thumbnailTemplate()) {
        <!-- Custom thumbnail templates -->
        <div class="carousel-thumbnails" role="tablist" aria-label="Slide thumbnails">
          @for (slide of slides(); track $index) {
            <button
              class="carousel-thumbnail"
              [class.carousel-thumbnail--active]="$index === currentIndex()"
              (click)="goTo($index)"
              [attr.aria-label]="'Go to slide ' + ($index + 1)"
              [attr.aria-selected]="$index === currentIndex()"
              role="tab"
              type="button"
            >
              <ng-container
                [ngTemplateOutlet]="thumbnailTemplate()!.templateRef"
                [ngTemplateOutletContext]="{ $implicit: $index, active: $index === currentIndex() }"
              />
            </button>
          }
        </div>
      } @else {
        <!-- Default thumbnail dots (larger) as fallback -->
        <div class="carousel-thumbnails carousel-thumbnails--default" role="tablist" aria-label="Slide thumbnails">
          @for (dot of dotsArray(); track $index) {
            <button
              class="carousel-thumbnail carousel-thumbnail--dot"
              [class.carousel-thumbnail--active]="$index === currentIndex()"
              (click)="goTo($index)"
              [attr.aria-label]="'Go to slide ' + ($index + 1)"
              [attr.aria-selected]="$index === currentIndex()"
              role="tab"
              type="button"
            ></button>
          }
        </div>
      }
    }
  `,
  styles: `
    /* ── Header ──────────────────────────────────────────── */
    .carousel-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 12px;
      padding: 0 2px;
    }

    .carousel-title {
      font: var(--type-headline);
      color: var(--text-primary);
      margin: 0;
    }

    /* ── Nav Arrows ──────────────────────────────────────── */
    .carousel-nav {
      display: flex;
      gap: 6px;
    }

    .carousel-arrow {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 32px;
      height: 32px;
      border-radius: 50%;
      border: none;
      cursor: pointer;
      color: var(--text-primary);
      background: var(--fill-secondary);
      backdrop-filter: blur(12px);
      transition:
        background var(--duration-fast) var(--ease-default),
        color var(--duration-fast) var(--ease-default),
        transform var(--duration-fast) var(--ease-spring),
        opacity var(--duration-fast) var(--ease-default);
    }

    .carousel-arrow:hover:not(:disabled) {
      background: var(--fill-primary);
      transform: scale(1.08);
    }

    .carousel-arrow:active:not(:disabled) {
      transform: scale(0.92);
    }

    .carousel-arrow--disabled {
      opacity: 0.3;
      cursor: not-allowed;
    }

    /* ── Track ───────────────────────────────────────────── */
    .carousel-track {
      display: flex;
      gap: 16px;
      overflow-x: auto;
      scroll-snap-type: x mandatory;
      scroll-behavior: smooth;
      -webkit-overflow-scrolling: touch;

      /* Hide scrollbar */
      scrollbar-width: none;
      -ms-overflow-style: none;
    }

    .carousel-track::-webkit-scrollbar {
      display: none;
    }

    /* Peek: show partial next slide */
    .carousel-track--peek {
      padding-right: 48px;
    }

    /* Card variant: give slides card-like rounding */
    .carousel-track--card ::ng-deep .carousel-slide {
      border-radius: var(--radius-xl);
      overflow: hidden;
      background: var(--glass-bg);
      backdrop-filter: blur(20px);
      border: 1px solid var(--glass-border);
      box-shadow: var(--shadow-sm);
    }

    /* Full-bleed variant: no gaps */
    .carousel-track--fullbleed {
      gap: 0;
    }

    /* ── Slide Base ──────────────────────────────────────── */
    :host ::ng-deep .carousel-slide {
      flex: 0 0 auto;
      scroll-snap-align: start;
      scroll-snap-stop: always;
      min-width: 0;
    }

    /* ── Pagination Dots ─────────────────────────────────── */
    .carousel-dots {
      display: flex;
      justify-content: center;
      align-items: center;
      gap: 8px;
      margin-top: 16px;
      padding: 4px 0;
    }

    .carousel-dot {
      width: 8px;
      height: 8px;
      border-radius: 9999px;
      border: none;
      padding: 0;
      cursor: pointer;
      background: var(--text-quaternary);
      transition:
        width var(--duration-normal) var(--ease-spring),
        background var(--duration-normal) var(--ease-default),
        transform var(--duration-fast) var(--ease-spring);
    }

    .carousel-dot:hover:not(.carousel-dot--active) {
      background: var(--text-tertiary);
      transform: scale(1.25);
    }

    .carousel-dot--active {
      width: 24px;
      background: var(--color-primary);
    }

    .carousel-dot:focus-visible {
      outline: 2px solid var(--focus-ring);
      outline-offset: 2px;
    }

    /* ── Play/Pause Button ───────────────────────────────── */
    .carousel-play-pause {
      color: var(--color-primary);
      background: var(--interactive-tint);
    }

    .carousel-play-pause:hover {
      background: var(--interactive-tint-hover);
      transform: scale(1.08);
    }

    .carousel-play-pause[aria-pressed="true"] {
      background: var(--fill-secondary);
      color: var(--text-secondary);
    }

    /* ── Thumbnail Strip ──────────────────────────────────── */
    .carousel-thumbnails {
      display: flex;
      justify-content: center;
      align-items: center;
      gap: 8px;
      margin-top: 12px;
      padding: 4px 0;
      overflow-x: auto;
      scrollbar-width: none;
    }

    .carousel-thumbnails::-webkit-scrollbar {
      display: none;
    }

    .carousel-thumbnail {
      border: none;
      padding: 0;
      cursor: pointer;
      border-radius: var(--radius-sm);
      overflow: hidden;
      transition:
        opacity var(--duration-fast) var(--ease-default),
        transform var(--duration-fast) var(--ease-spring),
        box-shadow var(--duration-fast) var(--ease-default);
      opacity: 0.55;
      flex-shrink: 0;
    }

    .carousel-thumbnail:hover {
      opacity: 0.85;
      transform: scale(1.05);
    }

    .carousel-thumbnail--active {
      opacity: 1;
      box-shadow: 0 0 0 2px var(--color-primary);
      transform: scale(1.08);
    }

    .carousel-thumbnail:focus-visible {
      outline: 2px solid var(--focus-ring);
      outline-offset: 2px;
    }

    /* Default dot-style thumbnails */
    .carousel-thumbnail--dot {
      width: 12px;
      height: 12px;
      border-radius: 9999px;
      background: var(--text-quaternary);
      transition:
        background var(--duration-normal) var(--ease-default),
        transform var(--duration-fast) var(--ease-spring),
        box-shadow var(--duration-fast) var(--ease-default);
    }

    .carousel-thumbnail--dot.carousel-thumbnail--active {
      background: var(--color-primary);
    }

    /* ── Host focus ring ─────────────────────────────────── */
    :host:focus-visible {
      outline: 2px solid var(--focus-ring);
      outline-offset: 4px;
      border-radius: var(--radius-md);
    }
  `,
})
export class CarouselComponent {
  /** Accessible label for the carousel region. */
  readonly ariaLabel = input('Carousel');

  /** Visual variant. */
  readonly variant = input<CarouselVariant>('default');

  /** Optional title displayed above the track. */
  readonly title = input<string | null>(null);

  /** Show next/prev arrows. */
  readonly showArrows = input(true);

  /** Show pagination dots below. */
  readonly showDots = input(true);

  /** Peek – reveal partial next slide. */
  readonly peek = input(true);

  /** Autoplay interval in ms (0 = off). */
  readonly autoplay = input(0);

  /**
   * Show a visible Play/Pause toggle button when autoplay is enabled.
   * Required for WCAG 2.1 SC 2.2.2 (Pause, Stop, Hide).
   * Defaults to true when autoplay > 0.
   */
  readonly showPlayPause = input(true);

  /**
   * Show a thumbnail strip below the track instead of dots.
   * Provide thumbnail templates via <ng-template appCarouselThumbnail>.
   */
  readonly showThumbnails = input(false);

  /** Emits current slide index on change. */
  readonly slideChange = output<number>();

  protected readonly currentIndex = signal(0);
  /** Whether autoplay is currently paused by the user. */
  protected readonly isPaused = signal(false);

  protected readonly slides = contentChildren(CarouselSlideDirective, { read: ElementRef });
  protected readonly thumbnailTemplate = contentChild(CarouselThumbnailDirective);
  private readonly trackRef = viewChild.required<ElementRef<HTMLElement>>('trackEl');
  private readonly destroyRef = inject(DestroyRef);
  private readonly liveAnnouncer = inject(LiveAnnouncer);

  protected readonly slideCount = computed(() => this.slides().length);
  protected readonly maxIndex = computed(() => Math.max(0, this.slideCount() - 1));
  protected readonly dotsArray = computed(() => Array.from({ length: this.slideCount() }));

  private autoplayTimer: ReturnType<typeof setInterval> | null = null;
  private scrollTimeout: ReturnType<typeof setTimeout> | null = null;
  /** Tracks whether hover/focus pause is active. */
  private hoverPaused = false;

  // Touch/swipe gesture tracking
  private touchStartX = 0;
  private touchCurrentX = 0;
  private touchStartTime = 0;
  /** Minimum swipe distance in px to trigger navigation */
  private readonly SWIPE_THRESHOLD = 50;
  /** Minimum velocity (px/ms) to trigger navigation even on short swipes */
  private readonly SWIPE_VELOCITY = 0.3;

  constructor() {
    // Set up autoplay whenever the interval input changes.
    // effect() runs as a side-effect (not in render phase), so it avoids NG0103.
    // untracked() inside the setInterval callback prevents currentIndex/maxIndex
    // reads from re-triggering the effect on every tick.
    effect(() => {
      const interval = this.autoplay();
      untracked(() => {
        this.clearAutoplay();
        if (interval > 0 && !this.hoverPaused && !this.isPaused()) {
          this.startAutoplayTimer(interval);
        }
      });
    });

    // Re-evaluate autoplay when isPaused changes
    effect(() => {
      const paused = this.isPaused();
      untracked(() => {
        this.clearAutoplay();
        const interval = this.autoplay();
        if (interval > 0 && !this.hoverPaused && !paused) {
          this.startAutoplayTimer(interval);
        }
      });
    });

    this.destroyRef.onDestroy(() => {
      this.clearAutoplay();
      if (this.scrollTimeout) clearTimeout(this.scrollTimeout);
    });
  }

  /** Navigate to a specific slide index. */
  goTo(index: number): void {
    const slideEls = this.slides();
    if (index < 0 || index >= slideEls.length) return;

    const target = slideEls[index].nativeElement as HTMLElement;
    const track = this.trackRef().nativeElement;

    track.scrollTo({
      left: target.offsetLeft - track.offsetLeft,
      behavior: 'smooth',
    });

    this.currentIndex.set(index);
    this.slideChange.emit(index);

    // Announce slide change to screen readers
    this.liveAnnouncer.announce(
      `Slide ${index + 1} of ${slideEls.length}`,
      'polite'
    );
  }

  /** Go to next slide. */
  next(): void {
    if (this.currentIndex() < this.maxIndex()) {
      this.goTo(this.currentIndex() + 1);
    }
  }

  /** Go to previous slide. */
  prev(): void {
    if (this.currentIndex() > 0) {
      this.goTo(this.currentIndex() - 1);
    }
  }

  /** Sync index from native scroll (swipe/drag). */
  protected onScroll(): void {
    if (this.scrollTimeout) clearTimeout(this.scrollTimeout);
    this.scrollTimeout = setTimeout(() => this.syncIndexFromScroll(), 80);
  }

  protected onKeydown(event: KeyboardEvent): void {
    if (event.key === 'ArrowRight') {
      event.preventDefault();
      this.next();
    } else if (event.key === 'ArrowLeft') {
      event.preventDefault();
      this.prev();
    } else if (event.key === 'Home') {
      event.preventDefault();
      this.goTo(0);
    } else if (event.key === 'End') {
      event.preventDefault();
      this.goTo(this.maxIndex());
    }
  }

  // ── Touch / Swipe Gestures ─────────────────────────────────

  /** Record start position and timestamp. */
  protected onTouchStart(event: TouchEvent): void {
    const touch = event.changedTouches[0];
    this.touchStartX = touch.clientX;
    this.touchCurrentX = touch.clientX;
    this.touchStartTime = Date.now();
  }

  /** Track movement so we can detect direction during the gesture. */
  protected onTouchMove(event: TouchEvent): void {
    this.touchCurrentX = event.changedTouches[0].clientX;
  }

  /**
   * On finger lift, decide whether to navigate.
   * Navigates if:
   *   - distance ≥ SWIPE_THRESHOLD, OR
   *   - velocity ≥ SWIPE_VELOCITY (fast flick)
   * Prevents interfering with native scroll snap on tiny/slow movements.
   */
  protected onTouchEnd(event: TouchEvent): void {
    const endX = event.changedTouches[0].clientX;
    const distance = endX - this.touchStartX;
    const elapsed = Date.now() - this.touchStartTime;
    const velocity = Math.abs(distance) / Math.max(elapsed, 1);

    const isSwipe = Math.abs(distance) >= this.SWIPE_THRESHOLD || velocity >= this.SWIPE_VELOCITY;
    if (!isSwipe) return;

    // Prevent the native scroll snap from also firing
    event.preventDefault();

    if (distance < 0) {
      this.next(); // swipe left → next slide
    } else {
      this.prev(); // swipe right → prev slide
    }
  }

  /** Pause autoplay on hover or focus — per WCAG 2.1 SC 2.2.2. */
  protected onPointerEnter(): void {
    this.hoverPaused = true;
    this.clearAutoplay();
  }

  /** Resume autoplay when hover/focus is lost (respects user isPaused state). */
  protected onPointerLeave(): void {
    this.hoverPaused = false;
    if (!this.isPaused()) {
      const interval = this.autoplay();
      if (interval > 0) {
        this.startAutoplayTimer(interval);
      }
    }
  }

  /** Toggle user-controlled pause state. */
  togglePause(): void {
    const nowPaused = !this.isPaused();
    this.isPaused.set(nowPaused);
    if (nowPaused) {
      this.clearAutoplay();
      this.liveAnnouncer.announce('Autoplay paused', 'polite');
    } else {
      const interval = this.autoplay();
      if (interval > 0 && !this.hoverPaused) {
        this.startAutoplayTimer(interval);
      }
      this.liveAnnouncer.announce('Autoplay resumed', 'polite');
    }
  }

  private startAutoplayTimer(interval: number): void {
    this.clearAutoplay();
    (this as any).autoplayTimer = setInterval(() => {
      const nextIdx = this.currentIndex() < this.maxIndex() ? this.currentIndex() + 1 : 0;
      this.goTo(nextIdx);
    }, interval);
  }

  private syncIndexFromScroll(): void {
    const track = this.trackRef().nativeElement;
    const slideEls = this.slides();
    if (slideEls.length === 0) return;

    const scrollLeft = track.scrollLeft;
    let closest = 0;
    let minDist = Infinity;

    slideEls.forEach((slide, i) => {
      const el = slide.nativeElement as HTMLElement;
      const dist = Math.abs(el.offsetLeft - track.offsetLeft - scrollLeft);
      if (dist < minDist) {
        minDist = dist;
        closest = i;
      }
    });

    if (closest !== this.currentIndex()) {
      this.currentIndex.set(closest);
      this.slideChange.emit(closest);
    }
  }

  private clearAutoplay(): void {
    if (this.autoplayTimer) {
      clearInterval(this.autoplayTimer);
      this.autoplayTimer = null;
    }
  }
}
