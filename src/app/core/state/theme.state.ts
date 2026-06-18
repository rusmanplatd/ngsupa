import { Service, signal, computed, effect, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

export type ThemePreference = 'light' | 'dark' | 'system';

@Service()
export class ThemeState {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly isBrowser = isPlatformBrowser(this.platformId);

  private readonly STORAGE_KEY = 'ngsupa-color-scheme';

  private readonly _preference = signal<ThemePreference>(this.loadPreference());
  private readonly _systemDark = signal(this.getSystemDark());

  readonly preference = this._preference.asReadonly();
  readonly resolvedTheme = computed<'light' | 'dark'>(() => {
    const pref = this._preference();
    if (pref === 'system') return this._systemDark() ? 'dark' : 'light';
    return pref;
  });
  readonly isDark = computed(() => this.resolvedTheme() === 'dark');

  constructor() {
    // Listen for system theme changes
    if (this.isBrowser) {
      const mq = window.matchMedia('(prefers-color-scheme: dark)');
      mq.addEventListener('change', (e) => {
        this._systemDark.set(e.matches);
      });
    }

    // Sync to DOM and localStorage
    effect(() => {
      const pref = this._preference();
      const resolved = this.resolvedTheme();

      if (!this.isBrowser) return;

      // Update meta tag
      const meta = document.querySelector('meta[name="color-scheme"]');
      if (meta) {
        meta.setAttribute('content', pref === 'system' ? 'light dark' : pref);
      }

      // Update html class for Tailwind dark: variants
      document.documentElement.classList.toggle('dark', resolved === 'dark');

      // Persist preference
      if (pref === 'system') {
        localStorage.removeItem(this.STORAGE_KEY);
      } else {
        localStorage.setItem(this.STORAGE_KEY, pref);
      }
    });
  }

  setTheme(preference: ThemePreference): void {
    this._preference.set(preference);
  }

  private loadPreference(): ThemePreference {
    if (!this.isBrowser) return 'system';
    const stored = localStorage.getItem(this.STORAGE_KEY);
    if (stored === 'light' || stored === 'dark') return stored;
    return 'system';
  }

  private getSystemDark(): boolean {
    if (!this.isBrowser) return false;
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  }
}
