import { Component, signal, computed } from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  ResizablePanelGroupComponent,
  ResizablePanelComponent,
  ResizableHandleComponent,
} from '../../shared/ui/resizable/resizable';

// ─── Types ─────────────────────────────────────────────────────────────────

interface DemoTab {
  id: string;
  label: string;
  icon: string;
}

interface CodeFile {
  name: string;
  language: string;
  content: string;
  lines: number;
}

// ─── Component ─────────────────────────────────────────────────────────────

@Component({
  selector: 'app-resizable-demo',
  imports: [
    RouterLink,
    ResizablePanelGroupComponent,
    ResizablePanelComponent,
    ResizableHandleComponent,
  ],
  styles: [`
    :host {
      display: block;
      width: 100%;
      min-height: 100dvh;
      background: var(--surface-grouped);
      font-family: var(--font-sans);
    }

    /* ── Page Layout ── */
    .page {
      display: grid;
      grid-template-rows: auto 1fr;
      min-height: 100dvh;
    }

    /* ── Hero Header ── */
    .hero {
      padding: var(--spacing-8) var(--spacing-6) var(--spacing-6);
      background: var(--surface-primary);
      border-bottom: 1px solid var(--separator);
    }

    .hero-inner {
      max-width: 1200px;
      margin: 0 auto;
    }

    .hero-back {
      display: inline-flex;
      align-items: center;
      gap: var(--spacing-1);
      color: var(--color-primary);
      font-size: var(--text-sm);
      font-weight: var(--font-weight-medium);
      text-decoration: none;
      margin-bottom: var(--spacing-5);
      transition: opacity var(--duration-fast) var(--ease-default);
    }
    .hero-back:hover { opacity: 0.7; }
    .hero-back svg { width: 14px; height: 14px; }

    .hero-title {
      font: var(--type-large-title);
      color: var(--text-primary);
      letter-spacing: var(--tracking-tight);
      margin: 0 0 var(--spacing-2);
    }

    .hero-subtitle {
      font: var(--type-subheadline);
      color: var(--text-secondary);
      margin: 0 0 var(--spacing-5);
    }

    .hero-tags {
      display: flex;
      flex-wrap: wrap;
      gap: var(--spacing-2);
    }

    .tag {
      display: inline-flex;
      align-items: center;
      gap: 5px;
      padding: 3px 10px;
      border-radius: var(--radius-full);
      font-size: var(--text-xs);
      font-weight: var(--font-weight-medium);
      background: var(--fill-secondary);
      color: var(--text-secondary);
      border: 1px solid var(--border-default);
    }

    .tag--blue { background: var(--color-primary-container); color: var(--color-primary); border-color: transparent; }
    .tag--green { background: var(--color-success-container); color: var(--color-success); border-color: transparent; }

    /* ── Demo Sections ── */
    .demos {
      max-width: 1200px;
      margin: 0 auto;
      padding: var(--spacing-8) var(--spacing-6);
      display: flex;
      flex-direction: column;
      gap: var(--spacing-8);
    }

    .section-label {
      font-size: var(--text-xs);
      font-weight: var(--font-weight-semibold);
      letter-spacing: var(--tracking-wider);
      text-transform: uppercase;
      color: var(--text-tertiary);
      margin: 0 0 var(--spacing-3);
    }

    .section-title {
      font: var(--type-title-3);
      color: var(--text-primary);
      margin: 0 0 var(--spacing-1);
      letter-spacing: var(--tracking-tight);
    }

    .section-desc {
      font: var(--type-subheadline);
      color: var(--text-secondary);
      margin: 0 0 var(--spacing-5);
    }

    .demo-card {
      background: var(--surface-primary);
      border-radius: var(--radius-xl);
      border: 1px solid var(--border-default);
      overflow: hidden;
      box-shadow: var(--shadow-sm);
    }

    .demo-card__header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: var(--spacing-4) var(--spacing-5);
      border-bottom: 1px solid var(--separator);
      background: var(--surface-secondary);
    }

    .demo-card__title {
      font: var(--type-headline);
      color: var(--text-primary);
      margin: 0;
    }

    .demo-card__hint {
      font: var(--type-caption-1);
      color: var(--text-tertiary);
      display: flex;
      align-items: center;
      gap: var(--spacing-1);
    }

    /* ── Keyboard Shortcut Badges ── */
    .kbd-list {
      display: flex;
      flex-wrap: wrap;
      gap: var(--spacing-2);
      padding: var(--spacing-4) var(--spacing-5);
      background: var(--surface-secondary);
      border-top: 1px solid var(--separator);
    }

    .kbd-item {
      display: flex;
      align-items: center;
      gap: var(--spacing-1\\.5);
      font-size: var(--text-xs);
      color: var(--text-secondary);
    }

    .kbd {
      display: inline-flex;
      align-items: center;
      padding: 1px 6px;
      border-radius: var(--radius-xs);
      background: var(--fill-secondary);
      border: 1px solid var(--border-opaque);
      font-family: var(--font-mono);
      font-size: 10px;
      color: var(--text-primary);
      white-space: nowrap;
      box-shadow: 0 1px 0 var(--border-opaque);
    }

    /* ── IDE Demo ── */
    .ide-shell {
      height: 420px;
      display: flex;
      flex-direction: column;
    }

    .ide-toolbar {
      display: flex;
      align-items: center;
      gap: var(--spacing-3);
      padding: var(--spacing-3) var(--spacing-4);
      background: var(--surface-secondary);
      border-bottom: 1px solid var(--separator);
      flex-shrink: 0;
    }

    .ide-dots {
      display: flex;
      gap: 6px;
    }

    .ide-dot {
      width: 12px;
      height: 12px;
      border-radius: 50%;
    }

    .ide-dot--red { background: #ff5f57; }
    .ide-dot--yellow { background: #febc2e; }
    .ide-dot--green { background: #28c840; }

    .ide-title {
      font-size: var(--text-xs);
      color: var(--text-tertiary);
      flex: 1;
      text-align: center;
    }

    .ide-body {
      flex: 1;
      overflow: hidden;
    }

    /* ── File Tree Panel ── */
    .file-tree {
      padding: var(--spacing-3);
      height: 100%;
      overflow-y: auto;
    }

    .file-tree__title {
      font-size: var(--text-xs);
      font-weight: var(--font-weight-semibold);
      color: var(--text-tertiary);
      text-transform: uppercase;
      letter-spacing: var(--tracking-wider);
      padding: var(--spacing-2) var(--spacing-2) var(--spacing-3);
      margin: 0;
    }

    .file-item {
      display: flex;
      align-items: center;
      gap: var(--spacing-2);
      padding: var(--spacing-1\\.5) var(--spacing-2);
      border-radius: var(--radius-sm);
      font-size: var(--text-sm);
      color: var(--text-secondary);
      cursor: pointer;
      transition: background var(--duration-fast) var(--ease-default);
      user-select: none;
    }

    .file-item:hover { background: var(--fill-primary); color: var(--text-primary); }
    .file-item--active { background: var(--interactive-tint); color: var(--color-primary); font-weight: var(--font-weight-medium); }

    .file-icon {
      width: 14px;
      height: 14px;
      flex-shrink: 0;
    }

    /* ── Code Editor Panel ── */
    .code-editor {
      height: 100%;
      display: flex;
      flex-direction: column;
      background: var(--surface-primary);
    }

    .code-tabs {
      display: flex;
      align-items: center;
      border-bottom: 1px solid var(--separator);
      overflow-x: auto;
      scrollbar-width: none;
      flex-shrink: 0;
      background: var(--surface-secondary);
    }

    .code-tab {
      display: flex;
      align-items: center;
      gap: var(--spacing-1\\.5);
      padding: var(--spacing-2) var(--spacing-4);
      font-size: var(--text-sm);
      color: var(--text-tertiary);
      white-space: nowrap;
      cursor: pointer;
      border-right: 1px solid var(--separator);
      transition:
        color var(--duration-fast) var(--ease-default),
        background var(--duration-fast) var(--ease-default);
      flex-shrink: 0;
    }

    .code-tab--active {
      color: var(--text-primary);
      background: var(--surface-primary);
    }

    .code-dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
    }

    .code-dot--ts { background: #3178c6; }
    .code-dot--css { background: #1572b6; }
    .code-dot--html { background: #e34c26; }

    .code-body {
      flex: 1;
      overflow: auto;
      padding: var(--spacing-4);
      font-family: var(--font-mono);
      font-size: 12px;
      line-height: 1.7;
    }

    .code-line {
      display: flex;
      gap: var(--spacing-4);
      min-height: 20px;
    }

    .line-num {
      color: var(--text-quaternary);
      min-width: 24px;
      text-align: right;
      flex-shrink: 0;
      user-select: none;
    }

    .line-code { color: var(--text-secondary); }
    .code-kw { color: oklch(65% 0.22 300); }
    .code-str { color: oklch(65% 0.19 145); }
    .code-fn { color: oklch(68% 0.18 55); }
    .code-type { color: oklch(62% 0.22 220); }
    .code-comment { color: var(--text-quaternary); font-style: italic; }
    .code-punct { color: var(--text-tertiary); }
    .code-num { color: oklch(60% 0.19 30); }

    /* ── Output / Terminal Panel ── */
    .terminal {
      height: 100%;
      display: flex;
      flex-direction: column;
      background: var(--surface-secondary);
      font-family: var(--font-mono);
      font-size: 12px;
    }

    .terminal-header {
      display: flex;
      align-items: center;
      gap: var(--spacing-3);
      padding: var(--spacing-2) var(--spacing-4);
      border-bottom: 1px solid var(--separator);
      flex-shrink: 0;
    }

    .terminal-title {
      font-size: var(--text-xs);
      font-weight: var(--font-weight-semibold);
      color: var(--text-tertiary);
      text-transform: uppercase;
      letter-spacing: var(--tracking-wider);
    }

    .terminal-status {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: var(--color-success);
      margin-left: auto;
      box-shadow: 0 0 4px var(--color-success);
    }

    .terminal-body {
      flex: 1;
      overflow: auto;
      padding: var(--spacing-4);
    }

    .term-line {
      display: flex;
      gap: var(--spacing-2);
      margin-bottom: 4px;
      line-height: 1.5;
    }

    .term-prompt { color: var(--color-success); flex-shrink: 0; }
    .term-cmd { color: var(--text-primary); }
    .term-output { color: var(--text-tertiary); }
    .term-success { color: var(--color-success); }
    .term-info { color: var(--color-system-teal); }
    .term-warn { color: var(--color-system-orange); }

    /* ── Vertical Split Demo ── */
    .split-demo {
      height: 380px;
    }

    .panel-content {
      height: 100%;
      overflow: auto;
    }

    .panel-header {
      display: flex;
      align-items: center;
      gap: var(--spacing-2);
      padding: var(--spacing-3) var(--spacing-4);
      border-bottom: 1px solid var(--separator);
      background: var(--surface-secondary);
      position: sticky;
      top: 0;
      z-index: 1;
    }

    .panel-header-icon {
      width: 16px;
      height: 16px;
      color: var(--color-primary);
    }

    .panel-header-title {
      font: var(--type-subheadline);
      font-weight: var(--font-weight-semibold);
      color: var(--text-primary);
      margin: 0;
    }

    .panel-body {
      padding: var(--spacing-4);
    }

    /* ── Inspector Panel ── */
    .inspector {
      height: 100%;
      overflow: auto;
    }

    .inspector-section {
      border-bottom: 1px solid var(--separator);
    }

    .inspector-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: var(--spacing-2) var(--spacing-4);
      gap: var(--spacing-4);
    }

    .inspector-key {
      font-size: var(--text-xs);
      color: var(--text-secondary);
      min-width: 80px;
    }

    .inspector-val {
      font-family: var(--font-mono);
      font-size: var(--text-xs);
      color: var(--color-primary);
      text-align: right;
    }

    .inspector-color-swatch {
      width: 14px;
      height: 14px;
      border-radius: var(--radius-xs);
      border: 1px solid var(--border-default);
      display: inline-block;
      margin-right: 4px;
      vertical-align: middle;
    }

    /* ── Persistence Demo ── */
    .persist-demo {
      height: 300px;
    }

    .persist-badge {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      padding: 3px 9px;
      border-radius: var(--radius-full);
      font-size: var(--text-xs);
      font-weight: var(--font-weight-medium);
      background: var(--color-success-container);
      color: var(--color-success);
      margin-left: var(--spacing-2);
    }

    .sizes-display {
      display: flex;
      gap: var(--spacing-2);
      padding: var(--spacing-3) var(--spacing-5);
      border-top: 1px solid var(--separator);
      align-items: center;
      font-size: var(--text-xs);
      color: var(--text-tertiary);
      background: var(--surface-secondary);
    }

    .size-chip {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      padding: 2px 8px;
      border-radius: var(--radius-full);
      background: var(--fill-secondary);
      border: 1px solid var(--border-default);
      font-family: var(--font-mono);
      color: var(--text-primary);
    }

    .size-chip-label {
      color: var(--text-tertiary);
      font-family: var(--font-sans);
    }

    /* ── Nested Demo ── */
    .nested-demo {
      height: 400px;
    }

    .nav-panel {
      height: 100%;
      display: flex;
      flex-direction: column;
    }

    .nav-group {
      padding: var(--spacing-3);
    }

    .nav-group-label {
      font-size: var(--text-2xs);
      font-weight: var(--font-weight-semibold);
      color: var(--text-quaternary);
      text-transform: uppercase;
      letter-spacing: var(--tracking-wider);
      padding: var(--spacing-2) var(--spacing-2) var(--spacing-1);
    }

    .nav-item {
      display: flex;
      align-items: center;
      gap: var(--spacing-2);
      padding: var(--spacing-1\\.5) var(--spacing-2);
      border-radius: var(--radius-sm);
      font-size: var(--text-sm);
      color: var(--text-secondary);
      cursor: pointer;
      transition: background var(--duration-fast) var(--ease-default);
    }

    .nav-item:hover { background: var(--fill-primary); color: var(--text-primary); }
    .nav-item--active { background: var(--interactive-tint); color: var(--color-primary); }

    .nav-dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: currentColor;
      opacity: 0.6;
      flex-shrink: 0;
    }

    /* ── Chart/Preview Panel ── */
    .chart-area {
      padding: var(--spacing-4);
      height: 100%;
      overflow: auto;
    }

    .chart-bars {
      display: flex;
      align-items: flex-end;
      gap: var(--spacing-2);
      height: 120px;
      padding-bottom: var(--spacing-3);
      border-bottom: 1px solid var(--separator);
    }

    .chart-bar {
      flex: 1;
      border-radius: var(--radius-xs) var(--radius-xs) 0 0;
      transition: opacity var(--duration-fast) var(--ease-default);
    }

    .chart-bar:hover { opacity: 0.7; }

    .chart-legend {
      display: flex;
      gap: var(--spacing-4);
      margin-top: var(--spacing-3);
    }

    .legend-item {
      display: flex;
      align-items: center;
      gap: var(--spacing-1);
      font-size: var(--text-xs);
      color: var(--text-secondary);
    }

    .legend-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
    }

    /* ── Stats/Meta ── */
    .stats-row {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: var(--spacing-3);
      padding: var(--spacing-4);
    }

    .stat-item {
      padding: var(--spacing-3);
      background: var(--surface-secondary);
      border-radius: var(--radius-md);
      border: 1px solid var(--separator);
    }

    .stat-label {
      font-size: var(--text-xs);
      color: var(--text-tertiary);
      margin-bottom: var(--spacing-1);
    }

    .stat-value {
      font: var(--type-title-3);
      color: var(--text-primary);
    }

    .stat-sub {
      font-size: var(--text-xs);
      color: var(--color-success);
      margin-top: 2px;
    }

    /* ── Size Tracker ── */
    .size-tracker {
      padding: var(--spacing-3) var(--spacing-4);
      border-top: 1px solid var(--separator);
      background: var(--surface-secondary);
      display: flex;
      align-items: center;
      gap: var(--spacing-2);
      font-size: var(--text-xs);
      color: var(--text-tertiary);
    }

    .size-track-label {
      color: var(--text-quaternary);
      font-size: 10px;
      text-transform: uppercase;
      letter-spacing: var(--tracking-wider);
      font-weight: var(--font-weight-semibold);
    }

    /* ── Feature Grid ── */
    .features-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: var(--spacing-4);
    }

    .feature-card {
      padding: var(--spacing-5);
      background: var(--surface-primary);
      border-radius: var(--radius-lg);
      border: 1px solid var(--border-default);
      box-shadow: var(--shadow-xs);
      transition:
        box-shadow var(--duration-fast) var(--ease-default),
        transform var(--duration-fast) var(--ease-default);
    }

    .feature-card:hover {
      box-shadow: var(--shadow-md);
      transform: translateY(-2px);
    }

    .feature-icon {
      width: 36px;
      height: 36px;
      border-radius: var(--radius-md);
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: var(--spacing-3);
      font-size: 18px;
    }

    .feature-name {
      font: var(--type-subheadline);
      font-weight: var(--font-weight-semibold);
      color: var(--text-primary);
      margin: 0 0 var(--spacing-1);
    }

    .feature-desc {
      font: var(--type-footnote);
      color: var(--text-secondary);
      margin: 0;
      line-height: 1.5;
    }

    /* ── Responsive ── */
    @media (max-width: 767px) {
      .demos { padding: var(--spacing-5) var(--spacing-4); }
      .hero { padding: var(--spacing-5) var(--spacing-4) var(--spacing-4); }
      .ide-shell { height: 320px; }
      .stats-row { grid-template-columns: 1fr 1fr; }
    }
  `],
  template: `
    <div class="page" role="main">
      <!-- ── Hero ── -->
      <header class="hero">
        <div class="hero-inner">
          <a routerLink="/showcase" class="hero-back" aria-label="Back to showcase">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7"/></svg>
            Back to Showcase
          </a>
          <h1 class="hero-title">Resizable Panel Groups</h1>
          <p class="hero-subtitle">
            Production-grade resizable panels with full keyboard support, WCAG AA accessibility,
            layout persistence, and Apple HIG design language.
          </p>
          <div class="hero-tags">
            <span class="tag tag--blue">Keyboard Navigation</span>
            <span class="tag tag--blue">ARIA Separator</span>
            <span class="tag tag--green">Layout Persistence</span>
            <span class="tag tag--green">Collapse / Expand</span>
            <span class="tag">Horizontal &amp; Vertical</span>
            <span class="tag">Touch Support</span>
            <span class="tag">Nested Groups</span>
            <span class="tag">Dark Mode</span>
          </div>
        </div>
      </header>

      <!-- ── Demos ── -->
      <div class="demos">

        <!-- ─── 1. IDE-like 3-panel layout ─────────────────────────── -->
        <section aria-labelledby="ide-demo-title">
          <p class="section-label">Demo 01</p>
          <h2 class="section-title" id="ide-demo-title">IDE-style 3-Panel Layout</h2>
          <p class="section-desc">
            Horizontal panel group with a collapsible file tree, code editor, and terminal output.
          </p>

          <div class="demo-card">
            <div class="demo-card__header">
              <h3 class="demo-card__title">Code Editor</h3>
              <span class="demo-card__hint">
                <svg width="12" height="12" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
                Drag handles or use keyboard
              </span>
            </div>

            <div class="ide-shell">
              <!-- Fake window chrome -->
              <div class="ide-toolbar" aria-hidden="true">
                <div class="ide-dots">
                  <div class="ide-dot ide-dot--red"></div>
                  <div class="ide-dot ide-dot--yellow"></div>
                  <div class="ide-dot ide-dot--green"></div>
                </div>
                <span class="ide-title">ngsupa — resizable.ts</span>
              </div>

              <!-- Resizable panels -->
              <div class="ide-body">
                <app-resizable-panel-group
                  id="ide-group"
                  direction="horizontal"
                  [keyboardStep]="2"
                  [keyboardLargeStep]="15"
                  [collapseThreshold]="6"
                  persistKey="rp-demo-ide"
                  (sizesChange)="onIdeSizesChange($event)"
                  (panelCollapsed)="onIdePanelCollapsed($event)"
                  (panelExpanded)="onIdePanelExpanded($event)"
                >
                  <!-- File Tree -->
                  <app-resizable-panel
                    [defaultSize]="20"
                    [minSize]="0"
                    [maxSize]="40"
                    [collapsible]="true"
                    [(collapsed)]="fileTreeCollapsed"
                    panelId="rp-file-tree"
                  >
                    <nav class="file-tree" aria-label="File tree">
                      <p class="file-tree__title">Explorer</p>
                      @for (file of files(); track file.name) {
                        <div
                          class="file-item"
                          [class.file-item--active]="activeFile() === file.name"
                          role="button"
                          tabindex="0"
                          [attr.aria-selected]="activeFile() === file.name"
                          (click)="activeFile.set(file.name)"
                          (keydown.enter)="activeFile.set(file.name)"
                          (keydown.space)="activeFile.set(file.name)"
                        >
                          <svg class="file-icon" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" aria-hidden="true">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"/>
                          </svg>
                          {{ file.name }}
                        </div>
                      }
                    </nav>
                  </app-resizable-panel>

                  <app-resizable-handle aria-label="Resize file tree and editor" />

                  <!-- Code Editor -->
                  <app-resizable-panel
                    [defaultSize]="55"
                    [minSize]="20"
                    panelId="rp-editor"
                  >
                    <div class="code-editor" role="region" aria-label="Code editor">
                      <div class="code-tabs" role="tablist">
                        @for (file of files(); track file.name) {
                          <div
                            class="code-tab"
                            [class.code-tab--active]="activeFile() === file.name"
                            role="tab"
                            [attr.aria-selected]="activeFile() === file.name"
                            tabindex="0"
                            (click)="activeFile.set(file.name)"
                            (keydown.enter)="activeFile.set(file.name)"
                          >
                            <span
                              class="code-dot"
                              [class.code-dot--ts]="file.name.endsWith('.ts')"
                              [class.code-dot--css]="file.name.endsWith('.css')"
                              [class.code-dot--html]="file.name.endsWith('.html')"
                              aria-hidden="true"
                            ></span>
                            {{ file.name }}
                          </div>
                        }
                      </div>
                      <div class="code-body" role="tabpanel" [attr.aria-label]="activeFile() + ' content'">
                        @for (line of currentFileLines(); track $index) {
                          <div class="code-line">
                            <span class="line-num" aria-hidden="true">{{ $index + 1 }}</span>
                            <span class="line-code" [innerHTML]="line"></span>
                          </div>
                        }
                      </div>
                    </div>
                  </app-resizable-panel>

                  <app-resizable-handle aria-label="Resize editor and terminal" />

                  <!-- Terminal Output -->
                  <app-resizable-panel
                    [defaultSize]="25"
                    [minSize]="8"
                    [maxSize]="50"
                    [collapsible]="true"
                    panelId="rp-terminal"
                  >
                    <div class="terminal" role="log" aria-label="Terminal output" aria-live="polite">
                      <div class="terminal-header">
                        <span class="terminal-title">Terminal</span>
                        <span class="terminal-status" title="Running" aria-label="Running"></span>
                      </div>
                      <div class="terminal-body">
                        @for (line of terminalLines(); track $index) {
                          <div class="term-line">
                            @if (line.type === 'cmd') {
                              <span class="term-prompt" aria-hidden="true">$</span>
                              <span class="term-cmd">{{ line.text }}</span>
                            } @else if (line.type === 'success') {
                              <span class="term-success">✓ {{ line.text }}</span>
                            } @else if (line.type === 'info') {
                              <span class="term-info">ℹ {{ line.text }}</span>
                            } @else if (line.type === 'warn') {
                              <span class="term-warn">⚠ {{ line.text }}</span>
                            } @else {
                              <span class="term-output">{{ line.text }}</span>
                            }
                          </div>
                        }
                      </div>
                    </div>
                  </app-resizable-panel>
                </app-resizable-panel-group>
              </div>
            </div>

            <!-- Keyboard shortcut legend -->
            <div class="kbd-list" aria-label="Keyboard shortcuts">
              <div class="kbd-item">
                <kbd class="kbd">Tab</kbd>
                <span>Focus handle</span>
              </div>
              <div class="kbd-item">
                <kbd class="kbd">← →</kbd>
                <span>Resize ±2%</span>
              </div>
              <div class="kbd-item">
                <kbd class="kbd">PgUp/PgDn</kbd>
                <span>Resize ±15%</span>
              </div>
              <div class="kbd-item">
                <kbd class="kbd">Home</kbd>
                <span>Collapse left panel</span>
              </div>
              <div class="kbd-item">
                <kbd class="kbd">End</kbd>
                <span>Maximize left panel</span>
              </div>
              <div class="kbd-item">
                <kbd class="kbd">Enter</kbd>
                <span>Toggle collapse</span>
              </div>
              <div class="kbd-item">
                <kbd class="kbd">Esc</kbd>
                <span>Reset to default</span>
              </div>
              <div class="kbd-item">
                <kbd class="kbd">Dbl-click</kbd>
                <span>Reset handle</span>
              </div>
            </div>
          </div>
        </section>

        <!-- ─── 2. Vertical Split + Nested Horizontal ─────────────── -->
        <section aria-labelledby="nested-demo-title">
          <p class="section-label">Demo 02</p>
          <h2 class="section-title" id="nested-demo-title">Nested Panel Groups</h2>
          <p class="section-desc">
            A vertical split where the top pane contains a nested horizontal group — like a design tool layout.
          </p>

          <div class="demo-card">
            <div class="demo-card__header">
              <h3 class="demo-card__title">Design Tool Layout</h3>
              <span class="demo-card__hint">Vertical + nested horizontal</span>
            </div>

            <div class="nested-demo">
              <app-resizable-panel-group
                id="nested-outer"
                direction="vertical"
                [keyboardStep]="2"
                persistKey="rp-demo-nested-outer"
              >
                <!-- Top row (nested horizontal) -->
                <app-resizable-panel [defaultSize]="70" [minSize]="30" panelId="rp-top-row">
                  <app-resizable-panel-group
                    id="nested-inner"
                    direction="horizontal"
                    [keyboardStep]="2"
                    persistKey="rp-demo-nested-inner"
                  >
                    <!-- Nav panel -->
                    <app-resizable-panel
                      [defaultSize]="22"
                      [minSize]="0"
                      [maxSize]="35"
                      [collapsible]="true"
                      panelId="rp-nav"
                    >
                      <nav class="nav-panel" aria-label="Design navigation">
                        <div class="panel-header">
                          <svg class="panel-header-icon" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" aria-hidden="true">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z"/>
                          </svg>
                          <h4 class="panel-header-title">Layers</h4>
                        </div>
                        <div class="nav-group">
                          <p class="nav-group-label">Components</p>
                          @for (layer of layers(); track layer) {
                            <div
                              class="nav-item"
                              [class.nav-item--active]="activeLayer() === layer"
                              role="button"
                              tabindex="0"
                              (click)="activeLayer.set(layer)"
                              (keydown.enter)="activeLayer.set(layer)"
                            >
                              <span class="nav-dot" aria-hidden="true"></span>
                              {{ layer }}
                            </div>
                          }
                        </div>
                      </nav>
                    </app-resizable-panel>

                    <app-resizable-handle aria-label="Resize layers and canvas" />

                    <!-- Canvas / Preview -->
                    <app-resizable-panel [defaultSize]="78" [minSize]="40" panelId="rp-canvas">
                      <div class="panel-content" style="background: var(--surface-grouped);" role="main" aria-label="Canvas">
                        <div class="panel-header">
                          <svg class="panel-header-icon" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" aria-hidden="true">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z"/>
                          </svg>
                          <h4 class="panel-header-title">Canvas — {{ activeLayer() }}</h4>
                        </div>
                        <div class="chart-area">
                          <div class="chart-bars" aria-label="Sample chart visualization" role="img">
                            @for (bar of chartData(); track $index) {
                              <div
                                class="chart-bar"
                                [style.height]="bar.h + '%'"
                                [style.background]="bar.color"
                                [attr.aria-label]="bar.label + ': ' + bar.h + '%'"
                                [title]="bar.label"
                              ></div>
                            }
                          </div>
                          <div class="chart-legend">
                            @for (bar of chartData(); track $index) {
                              <div class="legend-item">
                                <span class="legend-dot" [style.background]="bar.color" aria-hidden="true"></span>
                                {{ bar.label }}
                              </div>
                            }
                          </div>
                          <div class="stats-row">
                            @for (stat of stats(); track stat.label) {
                              <div class="stat-item">
                                <div class="stat-label">{{ stat.label }}</div>
                                <div class="stat-value">{{ stat.value }}</div>
                                <div class="stat-sub">{{ stat.trend }}</div>
                              </div>
                            }
                          </div>
                        </div>
                      </div>
                    </app-resizable-panel>
                  </app-resizable-panel-group>
                </app-resizable-panel>

                <app-resizable-handle aria-label="Resize top and bottom sections" />

                <!-- Bottom properties panel -->
                <app-resizable-panel
                  [defaultSize]="30"
                  [minSize]="0"
                  [maxSize]="60"
                  [collapsible]="true"
                  panelId="rp-props"
                >
                  <div class="inspector" role="region" aria-label="Properties inspector">
                    <div class="panel-header">
                      <svg class="panel-header-icon" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" aria-hidden="true">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M11.42 15.17L17.25 21A2.652 2.652 0 0021 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766M11.42 15.17l-4.655 5.653a2.548 2.548 0 11-3.586-3.586l6.837-5.63m5.108-.233c.55-.164 1.163-.188 1.743-.14a4.5 4.5 0 004.486-6.336l-3.276 3.277a3.004 3.004 0 01-2.25-2.25l3.276-3.276a4.5 4.5 0 00-6.336 4.486c.091 1.076-.071 2.264-.904 2.95l-.102.085m-1.745 1.437L5.909 7.5H4.5L2.25 3.75l1.5-1.5L7.5 4.5v1.409l4.26 4.26m-1.745 1.437l1.745-1.437m6.615 8.206L15.75 15.75M4.867 19.125h.008v.008h-.008v-.008z"/>
                      </svg>
                      <h4 class="panel-header-title">Properties — {{ activeLayer() }}</h4>
                    </div>
                    <div class="inspector-section">
                      @for (prop of inspectorProps(); track prop.key) {
                        <div class="inspector-row">
                          <span class="inspector-key">{{ prop.key }}</span>
                          <span class="inspector-val">
                            @if (prop.color) {
                              <span class="inspector-color-swatch" [style.background]="prop.color" aria-hidden="true"></span>
                            }
                            {{ prop.value }}
                          </span>
                        </div>
                      }
                    </div>
                  </div>
                </app-resizable-panel>
              </app-resizable-panel-group>
            </div>
          </div>
        </section>

        <!-- ─── 3. Layout Persistence Demo ───────────────────────── -->
        <section aria-labelledby="persist-demo-title">
          <p class="section-label">Demo 03</p>
          <h2 class="section-title" id="persist-demo-title">Layout Persistence</h2>
          <p class="section-desc">
            Panel sizes are automatically saved to <code>localStorage</code> and restored on page reload.
            The badge confirms when the layout was loaded from storage.
          </p>

          <div class="demo-card">
            <div class="demo-card__header">
              <h3 class="demo-card__title">
                Persistent Layout
                @if (persistLoaded()) {
                  <span class="persist-badge" role="status">
                    <svg width="10" height="10" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5"/></svg>
                    Restored from storage
                  </span>
                }
              </h3>
              <span class="demo-card__hint">Resize, refresh the page — layout persists</span>
            </div>

            <div class="persist-demo">
              <app-resizable-panel-group
                id="persist-group"
                direction="horizontal"
                persistKey="rp-demo-persist"
                [autoSaveDelay]="300"
                (sizesChange)="onPersistSizesChange($event)"
              >
                <app-resizable-panel [defaultSize]="33" [minSize]="10" panelId="rp-p1">
                  <div class="panel-content">
                    <div class="panel-header">
                      <h4 class="panel-header-title">Panel A</h4>
                    </div>
                    <div class="panel-body">
                      <p style="font: var(--type-subheadline); color: var(--text-secondary); margin: 0;">
                        Drag the handles to resize. Your layout is saved automatically to
                        <code style="font-family: var(--font-mono); font-size: var(--text-xs); background: var(--fill-secondary); padding: 1px 5px; border-radius: var(--radius-xs);">localStorage</code>.
                      </p>
                    </div>
                  </div>
                </app-resizable-panel>

                <app-resizable-handle aria-label="Resize panel A and B" />

                <app-resizable-panel [defaultSize]="33" [minSize]="10" panelId="rp-p2">
                  <div class="panel-content">
                    <div class="panel-header">
                      <h4 class="panel-header-title">Panel B</h4>
                    </div>
                    <div class="panel-body">
                      <p style="font: var(--type-subheadline); color: var(--text-secondary); margin: 0;">
                        Refresh the page and this panel's size will be exactly as you left it.
                        The persist key is <code style="font-family: var(--font-mono); font-size: var(--text-xs); background: var(--fill-secondary); padding: 1px 5px; border-radius: var(--radius-xs);">rp-demo-persist</code>.
                      </p>
                    </div>
                  </div>
                </app-resizable-panel>

                <app-resizable-handle aria-label="Resize panel B and C" />

                <app-resizable-panel [defaultSize]="34" [minSize]="10" panelId="rp-p3">
                  <div class="panel-content">
                    <div class="panel-header">
                      <h4 class="panel-header-title">Panel C</h4>
                    </div>
                    <div class="panel-body">
                      <p style="font: var(--type-subheadline); color: var(--text-secondary); margin: 0;">
                        Multiple independent groups can each have their own storage key for completely isolated persistence.
                      </p>
                    </div>
                  </div>
                </app-resizable-panel>
              </app-resizable-panel-group>
            </div>

            <div class="sizes-display" aria-live="polite" aria-label="Current panel sizes">
              <span class="size-track-label">Live sizes:</span>
              @for (size of persistSizes(); track $index) {
                <span class="size-chip">
                  <span class="size-chip-label">P{{ $index + 1 }}</span>
                  {{ size.toFixed(1) }}%
                </span>
              }
            </div>
          </div>
        </section>

        <!-- ─── 4. Vertical resize demo ───────────────────────────── -->
        <section aria-labelledby="vertical-demo-title">
          <p class="section-label">Demo 04</p>
          <h2 class="section-title" id="vertical-demo-title">Vertical Split</h2>
          <p class="section-desc">
            Vertical panel groups work identically — use ↑/↓ arrow keys for keyboard control.
          </p>

          <div class="demo-card">
            <div class="demo-card__header">
              <h3 class="demo-card__title">Top / Bottom Split</h3>
              <span class="demo-card__hint">↑ ↓ arrow keys on focused handle</span>
            </div>

            <div class="split-demo">
              <app-resizable-panel-group
                id="vertical-group"
                direction="vertical"
                [keyboardStep]="3"
                persistKey="rp-demo-vertical"
              >
                <app-resizable-panel [defaultSize]="55" [minSize]="15" panelId="rp-top">
                  <div class="panel-content">
                    <div class="panel-header">
                      <svg class="panel-header-icon" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" aria-hidden="true">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z"/>
                      </svg>
                      <h4 class="panel-header-title">Primary Content</h4>
                    </div>
                    <div class="panel-body">
                      <p style="font: var(--type-body); color: var(--text-secondary); margin: 0 0 12px;">
                        This is the main content area. Drag the handle below to adjust the split between this panel and the detail panel.
                      </p>
                      <p style="font: var(--type-body); color: var(--text-secondary); margin: 0;">
                        Use <strong>↑ ↓</strong> arrow keys when the handle is focused for precise control, or <strong>Page Up/Down</strong> for large steps.
                      </p>
                    </div>
                  </div>
                </app-resizable-panel>

                <app-resizable-handle aria-label="Resize top and bottom panels" />

                <app-resizable-panel
                  [defaultSize]="45"
                  [minSize]="0"
                  [maxSize]="70"
                  [collapsible]="true"
                  panelId="rp-bottom"
                >
                  <div class="panel-content">
                    <div class="panel-header">
                      <svg class="panel-header-icon" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" aria-hidden="true">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z"/>
                      </svg>
                      <h4 class="panel-header-title">Detail View</h4>
                    </div>
                    <div class="panel-body">
                      <p style="font: var(--type-body); color: var(--text-secondary); margin: 0;">
                        This collapsible panel provides additional detail. Press <strong>Enter</strong> on the handle or click the collapse button to hide it entirely.
                        Layout is persisted — try collapsing and refreshing.
                      </p>
                    </div>
                  </div>
                </app-resizable-panel>
              </app-resizable-panel-group>
            </div>
          </div>
        </section>

        <!-- ─── 5. Feature grid ───────────────────────────────────── -->
        <section aria-labelledby="features-title">
          <p class="section-label">API Reference</p>
          <h2 class="section-title" id="features-title">Features &amp; Capabilities</h2>
          <p class="section-desc">Everything included out of the box.</p>

          <div class="features-grid">
            @for (f of features(); track f.name) {
              <div class="feature-card">
                <div class="feature-icon" [style.background]="f.bg" [attr.aria-hidden]="'true'">{{ f.icon }}</div>
                <h3 class="feature-name">{{ f.name }}</h3>
                <p class="feature-desc">{{ f.desc }}</p>
              </div>
            }
          </div>
        </section>

      </div><!-- /demos -->
    </div><!-- /page -->
  `,
})
export class ResizableDemoComponent {
  // ── IDE Demo state ──────────────────────────────────────────────
  fileTreeCollapsed = signal(false);
  activeFile = signal('resizable.ts');
  ideSizes = signal<number[]>([20, 55, 25]);

  readonly files = signal<CodeFile[]>([
    { name: 'resizable.ts', language: 'TypeScript', lines: 420, content: 'ts' },
    { name: 'styles.css', language: 'CSS', lines: 120, content: 'css' },
    { name: 'demo.html', language: 'HTML', lines: 65, content: 'html' },
  ]);

  readonly currentFileLines = computed(() => {
    const file = this.activeFile();
    if (file.endsWith('.ts')) return this.tsLines;
    if (file.endsWith('.css')) return this.cssLines;
    return this.htmlLines;
  });

  private tsLines = [
    `<span class="code-comment">// Resizable Panel Group — Angular 22</span>`,
    `<span class="code-kw">import</span> <span class="code-punct">{</span> <span class="code-type">Component</span><span class="code-punct">,</span> <span class="code-type">signal</span><span class="code-punct">,</span> <span class="code-type">computed</span> <span class="code-punct">}</span> <span class="code-kw">from</span> <span class="code-str">'@angular/core'</span><span class="code-punct">;</span>`,
    ``,
    `<span class="code-kw">@Component</span><span class="code-punct">({</span>`,
    `  <span class="code-fn">selector</span><span class="code-punct">:</span> <span class="code-str">'app-resizable-panel-group'</span><span class="code-punct">,</span>`,
    `  <span class="code-fn">providers</span><span class="code-punct">:</span> <span class="code-punct">[{</span> <span class="code-fn">provide</span><span class="code-punct">:</span> <span class="code-type">RESIZABLE_GROUP</span><span class="code-punct">,</span>`,
    `    <span class="code-fn">useExisting</span><span class="code-punct">:</span> <span class="code-type">ResizablePanelGroupComponent</span> <span class="code-punct">}],</span>`,
    `  <span class="code-fn">template</span><span class="code-punct">:</span> <span class="code-str">\`&lt;ng-content /&gt;\`</span><span class="code-punct">,</span>`,
    `<span class="code-punct">})</span>`,
    `<span class="code-kw">export class</span> <span class="code-type">ResizablePanelGroupComponent</span> <span class="code-punct">{</span>`,
    `  <span class="code-kw">readonly</span> <span class="code-fn">direction</span> <span class="code-punct">=</span> <span class="code-fn">input</span><span class="code-punct">&lt;</span><span class="code-type">ResizableDirection</span><span class="code-punct">&gt;(</span><span class="code-str">'horizontal'</span><span class="code-punct">);</span>`,
    `  <span class="code-kw">readonly</span> <span class="code-fn">keyboardStep</span> <span class="code-punct">=</span> <span class="code-fn">input</span><span class="code-punct">&lt;</span><span class="code-type">number</span><span class="code-punct">&gt;(</span><span class="code-num">1</span><span class="code-punct">);</span>`,
    `  <span class="code-kw">readonly</span> <span class="code-fn">persistKey</span> <span class="code-punct">=</span> <span class="code-fn">input</span><span class="code-punct">&lt;</span><span class="code-type">string</span> <span class="code-punct">|</span> <span class="code-kw">null</span><span class="code-punct">&gt;(</span><span class="code-kw">null</span><span class="code-punct">);</span>`,
    `  <span class="code-kw">readonly</span> <span class="code-fn">sizesChange</span> <span class="code-punct">=</span> <span class="code-fn">output</span><span class="code-punct">&lt;</span><span class="code-type">number</span><span class="code-punct">[]&gt;();</span>`,
    `<span class="code-punct">}</span>`,
  ];

  private cssLines = [
    `<span class="code-comment">/* Resizable Panel Group Styles */</span>`,
    ``,
    `<span class="code-fn">.rp-group</span> <span class="code-punct">{</span>`,
    `  <span class="code-kw">display</span><span class="code-punct">:</span> <span class="code-str">flex</span><span class="code-punct">;</span>`,
    `  <span class="code-kw">width</span><span class="code-punct">:</span> <span class="code-num">100%</span><span class="code-punct">;</span>`,
    `  <span class="code-kw">height</span><span class="code-punct">:</span> <span class="code-num">100%</span><span class="code-punct">;</span>`,
    `  <span class="code-kw">overflow</span><span class="code-punct">:</span> <span class="code-str">hidden</span><span class="code-punct">;</span>`,
    `<span class="code-punct">}</span>`,
    ``,
    `<span class="code-fn">.rp-handle__pill</span> <span class="code-punct">{</span>`,
    `  <span class="code-kw">border-radius</span><span class="code-punct">:</span> <span class="code-fn">var</span><span class="code-punct">(</span><span class="code-str">--radius-full</span><span class="code-punct">);</span>`,
    `  <span class="code-kw">background</span><span class="code-punct">:</span> <span class="code-fn">var</span><span class="code-punct">(</span><span class="code-str">--border-opaque</span><span class="code-punct">);</span>`,
    `  <span class="code-kw">transition</span><span class="code-punct">:</span> <span class="code-str">background</span> <span class="code-num">150ms</span> <span class="code-fn">ease</span><span class="code-punct">;</span>`,
    `<span class="code-punct">}</span>`,
  ];

  private htmlLines = [
    `<span class="code-comment">&lt;!-- IDE Layout --&gt;</span>`,
    `<span class="code-punct">&lt;</span><span class="code-fn">app-resizable-panel-group</span>`,
    `  <span class="code-kw">direction</span><span class="code-punct">=</span><span class="code-str">"horizontal"</span>`,
    `  <span class="code-kw">persistKey</span><span class="code-punct">=</span><span class="code-str">"my-layout"</span>`,
    `<span class="code-punct">&gt;</span>`,
    `  <span class="code-punct">&lt;</span><span class="code-fn">app-resizable-panel</span> <span class="code-kw">[defaultSize]</span><span class="code-punct">=</span><span class="code-str">"20"</span> <span class="code-kw">[collapsible]</span><span class="code-punct">=</span><span class="code-str">"true"</span><span class="code-punct">&gt;</span>`,
    `    Sidebar content`,
    `  <span class="code-punct">&lt;/</span><span class="code-fn">app-resizable-panel</span><span class="code-punct">&gt;</span>`,
    `  <span class="code-punct">&lt;</span><span class="code-fn">app-resizable-handle</span> <span class="code-punct">/&gt;</span>`,
    `  <span class="code-punct">&lt;</span><span class="code-fn">app-resizable-panel</span> <span class="code-kw">[defaultSize]</span><span class="code-punct">=</span><span class="code-str">"80"</span><span class="code-punct">&gt;</span>`,
    `    Main content`,
    `  <span class="code-punct">&lt;/</span><span class="code-fn">app-resizable-panel</span><span class="code-punct">&gt;</span>`,
    `<span class="code-punct">&lt;/</span><span class="code-fn">app-resizable-panel-group</span><span class="code-punct">&gt;</span>`,
  ];

  readonly terminalLines = signal([
    { type: 'cmd', text: 'ng serve --open' },
    { type: 'info', text: 'Building Angular application...' },
    { type: 'output', text: 'Browser bundles: 312.41 kB' },
    { type: 'success', text: 'Compiled successfully. 42 modules.' },
    { type: 'info', text: 'Application running at http://localhost:4200/' },
    { type: 'cmd', text: 'ng build --configuration production' },
    { type: 'output', text: 'Initial chunk files: main.js (286 kB)' },
    { type: 'output', text: 'Lazy chunk files: showcase.js (152 kB)' },
    { type: 'success', text: 'Build at: dist/ngsupa — 6 files, 288.1 kB' },
    { type: 'warn', text: 'Bundle budget: 286.1 kB (limit 500 kB) ✓' },
  ]);

  onIdeSizesChange(sizes: number[]): void {
    this.ideSizes.set(sizes);
  }

  onIdePanelCollapsed(idx: number): void {
    // Could show a toast notification
  }

  onIdePanelExpanded(idx: number): void {
    // Could show a toast notification
  }

  // ── Nested Demo state ───────────────────────────────────────────
  activeLayer = signal('ResizablePanel');

  readonly layers = signal([
    'ResizablePanelGroup',
    'ResizablePanel',
    'ResizableHandle',
    'PanelContent',
    'CollapseButton',
  ]);

  readonly chartData = signal([
    { h: 80, color: 'var(--color-primary)', label: 'Primary' },
    { h: 55, color: 'var(--color-success)', label: 'Success' },
    { h: 70, color: 'var(--color-system-purple)', label: 'Secondary' },
    { h: 45, color: 'var(--color-system-teal)', label: 'Info' },
    { h: 65, color: 'var(--color-system-orange)', label: 'Warning' },
    { h: 38, color: 'var(--color-error)', label: 'Error' },
  ]);

  readonly stats = signal([
    { label: 'Components', value: '3', trend: '↑ +1 this sprint' },
    { label: 'Test Coverage', value: '98%', trend: '↑ +2%' },
    { label: 'Bundle Size', value: '4.2kB', trend: '↓ -0.3kB' },
  ]);

  readonly inspectorProps = computed(() => {
    const layer = this.activeLayer();
    return [
      { key: 'Component', value: layer, color: null },
      { key: 'Width', value: '100%', color: null },
      { key: 'Min Size', value: '0%', color: null },
      { key: 'Max Size', value: '100%', color: null },
      { key: 'Fill', value: 'var(--surface-primary)', color: 'var(--surface-primary)' },
      { key: 'Border', value: '1px solid', color: null },
      { key: 'Overflow', value: 'hidden', color: null },
      { key: 'Collapsible', value: 'true', color: null },
    ];
  });

  // ── Persistence Demo state ─────────────────────────────────────
  persistSizes = signal<number[]>([33, 33, 34]);
  persistLoaded = signal(false);

  constructor() {
    // Check if persisted layout exists
    try {
      const saved = localStorage.getItem('rp-demo-persist');
      if (saved) this.persistLoaded.set(true);
    } catch { /* ignore */ }
  }

  onPersistSizesChange(sizes: number[]): void {
    this.persistSizes.set(sizes);
  }

  // ── Feature cards ──────────────────────────────────────────────
  readonly features = signal([
    {
      icon: '⌨️',
      bg: 'var(--color-primary-container)',
      name: 'Full Keyboard Control',
      desc: 'Arrow keys, Page Up/Down, Home, End, Enter, Escape — all standard shortcuts work on focused handles with ARIA separator role.',
    },
    {
      icon: '💾',
      bg: 'var(--color-success-container)',
      name: 'Layout Persistence',
      desc: 'Set persistKey to automatically save and restore panel sizes from localStorage with configurable auto-save debounce.',
    },
    {
      icon: '📐',
      bg: 'var(--color-system-purple-light)',
      name: 'Min/Max Constraints',
      desc: 'Per-panel minimum and maximum size constraints in percentage. The resize logic distributes size while respecting all constraints simultaneously.',
    },
    {
      icon: '🗜️',
      bg: 'var(--color-warning-container)',
      name: 'Collapse & Expand',
      desc: 'Collapsible panels auto-collapse when dragged below the threshold, and expand when dragged back. Double-click the handle to reset.',
    },
    {
      icon: '🔲',
      bg: 'var(--color-info-container)',
      name: 'Nested Groups',
      desc: 'ResizablePanelGroup components can be nested inside ResizablePanel — enabling complex 2D grid layouts without extra configuration.',
    },
    {
      icon: '👆',
      bg: 'var(--fill-secondary)',
      name: 'Pointer Events',
      desc: 'Full pointer event capture support for mouse, touch, and stylus with `pointerdown/move/up` — works on all modern devices.',
    },
    {
      icon: '♿',
      bg: 'var(--color-success-container)',
      name: 'WCAG AA Accessible',
      desc: 'Handles use role="separator" with aria-valuenow, aria-valuemin, aria-valuemax, aria-orientation, and descriptive aria-labels.',
    },
    {
      icon: '🎨',
      bg: 'var(--color-primary-container)',
      name: 'Apple HIG Design',
      desc: 'Glassmorphic handles with pill indicators, primary color active states, smooth spring animations, and full light/dark mode support.',
    },
  ]);
}
