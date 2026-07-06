import {
  Component,
  inject,
  signal,
  computed,
  viewChild,
  ElementRef,
  afterRenderEffect,
  OnDestroy,
  PLATFORM_ID,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { A11yModule } from '@angular/cdk/a11y';
import { LucideDynamicIcon } from '@lucide/angular';
import { KbdComponent } from '../kbd/kbd';
import { CommandPaletteService, Command } from './command-palette.service';

@Component({
  selector: 'app-command-palette',
  imports: [LucideDynamicIcon, KbdComponent, A11yModule],
  host: {
    class: 'contents',
    '(document:keydown)': 'onKeydown($event)',
  },
  template: `
    @if (service.open()) {
      <!-- Backdrop -->
      <div
        class="cmdk-backdrop"
        (click)="service.close()"
        aria-hidden="true"
      ></div>

      <!-- Dialog -->
      <div
        class="cmdk-dialog"
        role="dialog"
        aria-modal="true"
        aria-label="Command palette"
      >
        <div
          class="cmdk-container"
          cdkTrapFocus
          cdkTrapFocusAutoCapture
        >
          <!-- Search Header -->
          <div class="cmdk-header">
            <svg
              lucideIcon="search"
              [size]="20"
              class="cmdk-header__icon"
              aria-hidden="true"
            />
            <input
              #searchInput
              type="text"
              class="cmdk-header__input"
              placeholder="Type a command or search…"
              autocomplete="off"
              autocorrect="off"
              spellcheck="false"
              [value]="service.query()"
              (input)="onInput($event)"
              aria-label="Search commands"
              role="combobox"
              aria-haspopup="listbox"
              [attr.aria-expanded]="true"
              aria-controls="cmdk-results"
              [attr.aria-activedescendant]="activeItemId()"
            />
            <app-kbd keys="ESC" size="sm" />
          </div>

          <!-- Results -->
          <div id="cmdk-results" class="cmdk-body" role="listbox" aria-label="Commands">
            @if (service.groupedCommands().length === 0) {
              <div class="cmdk-empty">
                <svg
                  lucideIcon="search-x"
                  [size]="40"
                  class="cmdk-empty__icon"
                  aria-hidden="true"
                />
                <p class="cmdk-empty__title">No results found</p>
                <p class="cmdk-empty__desc">Try a different search term</p>
              </div>
            } @else {
              @for (group of service.groupedCommands(); track group.label) {
                <div class="cmdk-group" role="group" [attr.aria-label]="group.label">
                  <div class="cmdk-group__label">{{ group.label }}</div>
                  @for (item of group.items; track item.id) {
                    <button
                      type="button"
                      class="cmdk-item"
                      role="option"
                      [class.cmdk-item--active]="isActive(item)"
                      [attr.aria-selected]="isActive(item)"
                      [id]="'cmdk-item-' + item.id"
                      (click)="service.executeCommand(item)"
                      (mouseenter)="onItemHover(item)"
                    >
                      @if (item.icon) {
                        <span class="cmdk-item__icon">
                          <svg [lucideIcon]="item.icon" [size]="18" />
                        </span>
                      }
                      <span class="cmdk-item__label">{{ item.label }}</span>
                      @if (item.shortcut) {
                        <span class="cmdk-item__shortcut">
                          <app-kbd [keys]="item.shortcut" size="sm" />
                        </span>
                      }
                      <svg
                        lucideIcon="corner-down-left"
                        [size]="14"
                        class="cmdk-item__enter"
                        aria-hidden="true"
                      />
                    </button>
                  }
                </div>
              }
            }
          </div>

          <!-- Footer -->
          <div class="cmdk-footer">
            <div class="cmdk-footer__hint">
              <svg lucideIcon="arrow-up" [size]="12" aria-hidden="true" />
              <svg lucideIcon="arrow-down" [size]="12" aria-hidden="true" />
              <span>Navigate</span>
            </div>
            <div class="cmdk-footer__hint">
              <svg lucideIcon="corner-down-left" [size]="12" aria-hidden="true" />
              <span>Select</span>
            </div>
            <div class="cmdk-footer__hint">
              <span>ESC</span>
              <span>Close</span>
            </div>
          </div>
        </div>
      </div>
    }
  `,
  styles: `
    /* ── Backdrop ────────────────────────────────────────── */
    .cmdk-backdrop {
      position: fixed;
      inset: 0;
      background: var(--overlay-light);
      backdrop-filter: blur(12px) saturate(1.5);
      -webkit-backdrop-filter: blur(12px) saturate(1.5);
      z-index: 9999;
      animation: cmdk-backdrop-in 0.2s var(--ease-out) forwards;
    }

    @keyframes cmdk-backdrop-in {
      from { opacity: 0; }
      to   { opacity: 1; }
    }

    /* ── Dialog ──────────────────────────────────────────── */
    .cmdk-dialog {
      position: fixed;
      inset: 0;
      z-index: 10000;
      display: flex;
      align-items: flex-start;
      justify-content: center;
      padding-top: min(20vh, 140px);
      pointer-events: none;
    }

    /* ── Container ───────────────────────────────────────── */
    .cmdk-container {
      width: 640px;
      max-width: calc(100vw - 32px);
      max-height: min(70vh, 480px);
      display: flex;
      flex-direction: column;
      pointer-events: auto;

      background: var(--glass-bg-thick);
      backdrop-filter: blur(40px) saturate(1.8);
      -webkit-backdrop-filter: blur(40px) saturate(1.8);
      border: 1px solid var(--glass-border);
      border-radius: var(--radius-xl);
      box-shadow:
        0 24px 80px oklch(0% 0 0 / 0.18),
        0 8px 24px oklch(0% 0 0 / 0.08),
        inset 0 0.5px 0 oklch(100% 0 0 / 0.08);
      overflow: hidden;

      animation: cmdk-dialog-in 0.3s var(--ease-spring) forwards;
    }

    @keyframes cmdk-dialog-in {
      from {
        opacity: 0;
        transform: scale(0.96) translateY(-8px);
      }
      to {
        opacity: 1;
        transform: scale(1) translateY(0);
      }
    }

    /* ── Header ──────────────────────────────────────────── */
    .cmdk-header {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 16px 20px;
      border-bottom: 1px solid var(--separator);
    }

    .cmdk-header__icon {
      flex-shrink: 0;
      color: var(--text-tertiary);
    }

    .cmdk-header__input {
      flex: 1;
      background: none;
      border: none;
      outline: none;
      font: var(--type-body);
      color: var(--text-primary);
      caret-color: var(--color-system-blue);
    }

    .cmdk-header__input::placeholder {
      color: var(--text-quaternary);
    }

    /* ── Body / Results ──────────────────────────────────── */
    .cmdk-body {
      flex: 1;
      overflow-y: auto;
      overflow-x: hidden;
      padding: 8px;
      scroll-behavior: smooth;
      overscroll-behavior: contain;

      scrollbar-width: thin;
      scrollbar-color: transparent transparent;
    }

    .cmdk-body:hover {
      scrollbar-color: var(--text-quaternary) transparent;
    }

    /* ── Empty State ─────────────────────────────────────── */
    .cmdk-empty {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 8px;
      padding: 40px 20px;
      text-align: center;
    }

    .cmdk-empty__icon {
      color: var(--text-quaternary);
      opacity: 0.5;
    }

    .cmdk-empty__title {
      margin: 0;
      font: var(--type-subheadline);
      font-weight: 600;
      color: var(--text-secondary);
    }

    .cmdk-empty__desc {
      margin: 0;
      font: var(--type-footnote);
      color: var(--text-tertiary);
    }

    /* ── Group ───────────────────────────────────────────── */
    .cmdk-group {
      margin-bottom: 4px;
    }

    .cmdk-group:last-child {
      margin-bottom: 0;
    }

    .cmdk-group__label {
      font: var(--type-caption-1);
      font-weight: 600;
      color: var(--text-tertiary);
      text-transform: uppercase;
      letter-spacing: 0.06em;
      padding: 8px 12px 4px;
      user-select: none;
    }

    /* ── Item ────────────────────────────────────────────── */
    .cmdk-item {
      display: flex;
      align-items: center;
      gap: 12px;
      width: 100%;
      padding: 10px 12px;
      border: none;
      background: none;
      cursor: pointer;
      border-radius: var(--radius-md);
      color: var(--text-primary);
      font: var(--type-subheadline);
      font-weight: 500;
      text-align: left;
      outline: none;
      transition: background-color var(--duration-instant) var(--ease-default);
    }

    .cmdk-item:focus-visible {
      outline: 2px solid var(--focus-ring);
      outline-offset: -2px;
    }

    .cmdk-item--active {
      background: var(--interactive-tint);
    }

    .cmdk-item--active .cmdk-item__icon {
      color: var(--color-system-blue);
    }

    .cmdk-item--active .cmdk-item__enter {
      opacity: 1;
    }

    .cmdk-item:active {
      transform: scale(0.99);
    }

    .cmdk-item__icon {
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      width: 32px;
      height: 32px;
      border-radius: var(--radius-sm);
      background: var(--fill-primary);
      color: var(--text-secondary);
      transition:
        color var(--duration-fast) var(--ease-default),
        background var(--duration-fast) var(--ease-default);
    }

    .cmdk-item--active .cmdk-item__icon {
      background: var(--interactive-tint-hover);
      color: var(--color-system-blue);
    }

    .cmdk-item__label {
      flex: 1;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .cmdk-item__shortcut {
      flex-shrink: 0;
      margin-left: auto;
    }

    .cmdk-item__enter {
      flex-shrink: 0;
      color: var(--text-quaternary);
      opacity: 0;
      transition: opacity var(--duration-fast) var(--ease-default);
    }

    /* ── Footer ──────────────────────────────────────────── */
    .cmdk-footer {
      display: flex;
      align-items: center;
      gap: 16px;
      padding: 10px 20px;
      border-top: 1px solid var(--separator);
      background: var(--fill-tertiary);
    }

    .cmdk-footer__hint {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      font: var(--type-caption-2);
      color: var(--text-tertiary);
    }

    .cmdk-footer__hint svg {
      background: var(--fill-primary);
      border-radius: var(--radius-xs);
      padding: 2px;
      color: var(--text-secondary);
    }

    /* ── Responsive ──────────────────────────────────────── */
    @media (max-width: 639px) {
      .cmdk-dialog {
        padding-top: 48px;
        padding-left: 8px;
        padding-right: 8px;
      }

      .cmdk-container {
        max-height: 75vh;
        border-radius: var(--radius-lg);
      }

      .cmdk-footer {
        display: none;
      }
    }
  `,
})
export class CommandPaletteComponent implements OnDestroy {
  protected readonly service = inject(CommandPaletteService);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly isBrowser = isPlatformBrowser(this.platformId);

  private readonly searchInputRef =
    viewChild<ElementRef<HTMLInputElement>>('searchInput');

  private globalUnlisten: (() => void) | null = null;

  /** Returns the element ID of the currently active command item, or null. */
  protected readonly activeItemId = computed(() => {
    const flat = this.service.flatFiltered();
    const idx = this.service.activeIndex();
    if (idx < 0 || idx >= flat.length) return null;
    return `cmdk-item-${flat[idx].id}`;
  });

  constructor() {
    // Auto-focus the search input when the palette opens
    afterRenderEffect(() => {
      if (this.service.open()) {
        // Small delay to let the DOM render
        setTimeout(() => {
          this.searchInputRef()?.nativeElement.focus();
        }, 10);
      }
    });
  }

  protected onKeydown(event: KeyboardEvent): void {
    // ⌘K / Ctrl+K to toggle
    if ((event.metaKey || event.ctrlKey) && event.key === 'k') {
      event.preventDefault();
      event.stopPropagation();
      this.service.toggle();
      return;
    }

    if (!this.service.open()) return;

    switch (event.key) {
      case 'Escape':
        event.preventDefault();
        this.service.close();
        break;
      case 'ArrowDown':
        event.preventDefault();
        this.service.moveDown();
        this.scrollActiveIntoView();
        break;
      case 'ArrowUp':
        event.preventDefault();
        this.service.moveUp();
        this.scrollActiveIntoView();
        break;
      case 'Enter':
        event.preventDefault();
        this.service.executeActive();
        break;
    }
  }

  protected onInput(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.service.setQuery(value);
  }

  protected isActive(item: Command): boolean {
    const flat = this.service.flatFiltered();
    const index = flat.indexOf(item);
    return index === this.service.activeIndex();
  }

  protected onItemHover(item: Command): void {
    const flat = this.service.flatFiltered();
    const index = flat.indexOf(item);
    if (index >= 0) {
      this.service.setActiveIndex(index);
    }
  }

  private scrollActiveIntoView(): void {
    if (!this.isBrowser) return;
    requestAnimationFrame(() => {
      const flat = this.service.flatFiltered();
      const index = this.service.activeIndex();
      if (flat[index]) {
        const el = document.getElementById('cmdk-item-' + flat[index].id);
        el?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }
    });
  }

  ngOnDestroy(): void {
    this.globalUnlisten?.();
  }
}
