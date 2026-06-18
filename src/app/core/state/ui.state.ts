import { Service, signal, computed, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

@Service()
export class UiState {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly isBrowser = isPlatformBrowser(this.platformId);

  private readonly _sidebarOpen = signal(true);
  private readonly _isMobile = signal(this.checkMobile());

  readonly sidebarOpen = this._sidebarOpen.asReadonly();
  readonly isMobile = this._isMobile.asReadonly();
  readonly showSidebar = computed(() => !this._isMobile() && this._sidebarOpen());
  readonly showTabBar = computed(() => this._isMobile());

  constructor() {
    if (this.isBrowser) {
      const mq = window.matchMedia('(max-width: 767px)');
      mq.addEventListener('change', (e) => {
        this._isMobile.set(e.matches);
      });
    }
  }

  toggleSidebar(): void {
    this._sidebarOpen.update((v) => !v);
  }

  setSidebarOpen(open: boolean): void {
    this._sidebarOpen.set(open);
  }

  private checkMobile(): boolean {
    if (!this.isBrowser) return false;
    return window.matchMedia('(max-width: 767px)').matches;
  }
}
