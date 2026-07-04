import { Service, signal, computed, inject } from '@angular/core';
import { Router } from '@angular/router';

// ─── Types ───────────────────────────────────────────────────────────

export interface Command {
  /** Unique identifier */
  id: string;
  /** Display label */
  label: string;
  /** Lucide icon name */
  icon?: string;
  /** Group label for visual separation */
  group: string;
  /** Keyboard shortcut hint (e.g. '⌘ + D') */
  shortcut?: string;
  /** Search keywords (matched alongside label) */
  keywords?: string[];
  /** Callback executed when the command is selected */
  action: () => void;
}

// ─── Service ─────────────────────────────────────────────────────────

@Service()
export class CommandPaletteService {
  private readonly router = inject(Router);

  private readonly _open = signal(false);
  private readonly _query = signal('');
  private readonly _commands = signal<Command[]>([]);
  private readonly _activeIndex = signal(0);

  readonly open = this._open.asReadonly();
  readonly query = this._query.asReadonly();
  readonly activeIndex = this._activeIndex.asReadonly();

  /** Filtered commands based on current query */
  readonly filteredCommands = computed(() => {
    const q = this._query().toLowerCase().trim();
    const commands = this._commands();

    if (!q) return commands;

    return commands.filter((cmd) => {
      const haystack = [
        cmd.label,
        cmd.group,
        ...(cmd.keywords ?? []),
      ]
        .join(' ')
        .toLowerCase();
      return q.split(/\s+/).every((word) => haystack.includes(word));
    });
  });

  /** Grouped commands for rendering */
  readonly groupedCommands = computed(() => {
    const commands = this.filteredCommands();
    const groups = new Map<string, Command[]>();

    for (const cmd of commands) {
      const group = groups.get(cmd.group) ?? [];
      group.push(cmd);
      groups.set(cmd.group, group);
    }

    return Array.from(groups.entries()).map(([label, items]) => ({
      label,
      items,
    }));
  });

  /** Flat list for keyboard navigation indexing */
  readonly flatFiltered = computed(() => this.filteredCommands());

  constructor() {
    // Register default navigation commands
    this.registerDefaults();
  }

  // ─── Public API ──────────────────────────────────────────────────

  toggle(): void {
    if (this._open()) {
      this.close();
    } else {
      this.openPalette();
    }
  }

  openPalette(): void {
    this._query.set('');
    this._activeIndex.set(0);
    this._open.set(true);
  }

  close(): void {
    this._open.set(false);
    this._query.set('');
    this._activeIndex.set(0);
  }

  setQuery(query: string): void {
    this._query.set(query);
    this._activeIndex.set(0);
  }

  moveUp(): void {
    const max = this.flatFiltered().length;
    if (max === 0) return;
    this._activeIndex.update((i) => (i <= 0 ? max - 1 : i - 1));
  }

  moveDown(): void {
    const max = this.flatFiltered().length;
    if (max === 0) return;
    this._activeIndex.update((i) => (i >= max - 1 ? 0 : i + 1));
  }

  executeActive(): void {
    const commands = this.flatFiltered();
    const index = this._activeIndex();
    if (commands[index]) {
      commands[index].action();
      this.close();
    }
  }

  setActiveIndex(index: number): void {
    this._activeIndex.set(index);
  }

  executeCommand(command: Command): void {
    command.action();
    this.close();
  }

  /** Register additional commands (e.g., from feature modules) */
  registerCommands(commands: Command[]): void {
    this._commands.update((existing) => [...existing, ...commands]);
  }

  /** Remove commands by id (e.g., when a feature module is destroyed) */
  unregisterCommands(ids: string[]): void {
    const idSet = new Set(ids);
    this._commands.update((existing) =>
      existing.filter((cmd) => !idSet.has(cmd.id))
    );
  }

  // ─── Default Commands ────────────────────────────────────────────

  private registerDefaults(): void {
    this.registerCommands([
      // Navigation
      {
        id: 'nav-dashboard',
        label: 'Go to Dashboard',
        icon: 'layout-dashboard',
        group: 'Navigation',
        keywords: ['home', 'main', 'overview'],
        action: () => this.router.navigate(['/dashboard']),
      },
      {
        id: 'nav-profile',
        label: 'Go to Profile',
        icon: 'user',
        group: 'Navigation',
        keywords: ['account', 'me'],
        action: () => this.router.navigate(['/profile']),
      },
      {
        id: 'nav-settings',
        label: 'Go to Settings',
        icon: 'settings',
        group: 'Navigation',
        keywords: ['preferences', 'config'],
        shortcut: '⌘ + ,',
        action: () => this.router.navigate(['/settings']),
      },
      {
        id: 'nav-showcase',
        label: 'Go to Showcase',
        icon: 'sparkles',
        group: 'Navigation',
        keywords: ['components', 'demo', 'ui'],
        action: () => this.router.navigate(['/showcase']),
      },

      // Actions
      {
        id: 'action-theme-light',
        label: 'Switch to Light Theme',
        icon: 'sun',
        group: 'Actions',
        keywords: ['theme', 'appearance', 'mode', 'light'],
        action: () => {
          document.documentElement.style.colorScheme = 'light';
          document.documentElement.classList.remove('dark');
          localStorage.setItem('ngsupa-color-scheme', 'light');
        },
      },
      {
        id: 'action-theme-dark',
        label: 'Switch to Dark Theme',
        icon: 'moon',
        group: 'Actions',
        keywords: ['theme', 'appearance', 'mode', 'dark'],
        action: () => {
          document.documentElement.style.colorScheme = 'dark';
          document.documentElement.classList.add('dark');
          localStorage.setItem('ngsupa-color-scheme', 'dark');
        },
      },
      {
        id: 'action-theme-system',
        label: 'Use System Theme',
        icon: 'monitor',
        group: 'Actions',
        keywords: ['theme', 'appearance', 'auto', 'system'],
        action: () => {
          document.documentElement.style.colorScheme = 'light dark';
          localStorage.removeItem('ngsupa-color-scheme');
          const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
          document.documentElement.classList.toggle('dark', isDark);
        },
      },
      {
        id: 'action-copy-url',
        label: 'Copy Current URL',
        icon: 'link',
        group: 'Actions',
        keywords: ['copy', 'share', 'url', 'link'],
        shortcut: '⌘ + L',
        action: () => {
          navigator.clipboard.writeText(window.location.href);
        },
      },
      {
        id: 'action-fullscreen',
        label: 'Toggle Fullscreen',
        icon: 'maximize',
        group: 'Actions',
        keywords: ['fullscreen', 'maximize', 'expand'],
        action: () => {
          if (document.fullscreenElement) {
            document.exitFullscreen();
          } else {
            document.documentElement.requestFullscreen();
          }
        },
      },
    ]);
  }
}
