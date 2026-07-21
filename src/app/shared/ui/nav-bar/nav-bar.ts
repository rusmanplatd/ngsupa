import { Component, input, signal, afterNextRender, DestroyRef, inject, untracked } from '@angular/core';

@Component({
  selector: 'app-nav-bar',
  host: {
    class: 'block sticky top-0 z-50',
  },
  template: `
    <!-- Blur backdrop -->
    <div
      class="absolute inset-0 transition-all duration-normal"
      [class]="scrolled()
        ? 'bg-[var(--glass-bg)] backdrop-blur-xl border-b border-[var(--separator)]'
        : 'bg-transparent'"
    ></div>

    <div class="relative flex items-center justify-between px-5 h-14">
      <!-- Leading slot -->
      <div class="flex items-center gap-2 min-w-[60px]">
        <ng-content select="[nav-leading]" />
      </div>

      <!-- Inline title (shown when scrolled) -->
      <h1
        class="absolute left-1/2 -translate-x-1/2 text-base font-semibold text-[var(--text-primary)] transition-opacity duration-normal whitespace-nowrap"
        [class.opacity-0]="!scrolled()"
        [class.opacity-100]="scrolled()"
      >
        {{ title() }}
      </h1>

      <!-- Trailing slot -->
      <div class="flex items-center gap-2 min-w-[60px] justify-end">
        <ng-content select="[nav-trailing]" />
      </div>
    </div>

    <!-- Large title (collapses on scroll) -->
    @if (showLargeTitle()) {
      <div
        #largeTitle
        class="relative px-5 pb-2 transition-all duration-normal"
        [class.opacity-0]="scrolled()"
        [class.h-0]="scrolled()"
        [class.overflow-hidden]="scrolled()"
      >
        <h1 class="text-3xl font-bold tracking-tight text-[var(--text-primary)]">
          {{ title() }}
        </h1>
        <ng-content select="[nav-subtitle]" />
      </div>
    }
  `,
})
export class NavBarComponent {
  readonly title = input.required<string>();
  readonly showLargeTitle = input(true);

  protected readonly scrolled = signal(false);

  private readonly destroyRef = inject(DestroyRef);

  constructor() {
    // Set initial state before first render
    if (typeof window !== 'undefined') {
      this.scrolled.set(window.scrollY > 20);
    }

    afterNextRender(() => {
      const COLLAPSE_AT = 24;
      const EXPAND_AT = 8;
      let rafId: number | null = null;

      const onScroll = () => {
        if (rafId !== null) return; // already queued, skip
        rafId = requestAnimationFrame(() => {
          rafId = null;
          const y = window.scrollY;
          const current = untracked(() => this.scrolled());
          if (!current && y > COLLAPSE_AT) this.scrolled.set(true);
          else if (current && y < EXPAND_AT) this.scrolled.set(false);
        });
      };

      window.addEventListener('scroll', onScroll, { passive: true });
      this.destroyRef.onDestroy(() => {
        window.removeEventListener('scroll', onScroll);
        if (rafId !== null) cancelAnimationFrame(rafId);
      });
    });


  }
}
