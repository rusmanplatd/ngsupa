import {
  Component,
  signal,
  inject,
  computed,
} from '@angular/core';
import { LucideDynamicIcon } from '@lucide/angular';
import { ButtonComponent } from '../../shared/ui/button/button';
import { NavBarComponent } from '../../shared/ui/nav-bar/nav-bar';
import { ToastService, ToastContainerComponent } from '../../shared/ui/toast/toast';
import { BadgeComponent } from '../../shared/ui/badge/badge';
import { AvatarComponent } from '../../shared/ui/avatar/avatar';
import { CardComponent } from '../../shared/ui/card/card';
import { SegmentedControlComponent, SegmentOption } from '../../shared/ui/segmented-control/segmented-control';
import { SearchBarComponent } from '../../shared/ui/search-bar/search-bar';
import { ToggleComponent } from '../../shared/ui/toggle/toggle';
import {
  SidenavComponent,
  SidenavItemComponent,
  SidenavGroupComponent,
  SidenavSubgroupComponent,
} from '../../shared/ui/sidenav/sidenav';

interface NavItem {
  id: string;
  label: string;
  icon?: string;
  badge?: string | number;
  disabled?: boolean;
}

@Component({
  selector: 'app-sidenav-demo',
  imports: [
    LucideDynamicIcon,
    ButtonComponent,
    NavBarComponent,
    ToastContainerComponent,
    BadgeComponent,
    AvatarComponent,
    CardComponent,
    SegmentedControlComponent,
    SearchBarComponent,
    ToggleComponent,
    SidenavComponent,
    SidenavItemComponent,
    SidenavGroupComponent,
    SidenavSubgroupComponent,
  ],
  template: `
    <app-toast-container />

    <div class="demo-layout" [class.demo-layout--right]="sidenavPosition() === 'right'">
      <!-- ═══ Sidenav ═══ -->
      <app-sidenav
        [variant]="sidenavVariant()"
        [position]="sidenavPosition()"
        [(collapsed)]="sidenavCollapsed"
        [showCollapseButton]="showCollapseBtn()"
        width="280px"
        collapsedWidth="72px"
      >
        <!-- Header -->
        <div sidenav-header class="sidenav-header">
          <div class="sidenav-logo">
            <div class="sidenav-logo__icon">
              <svg lucideIcon="hexagon" [size]="24" />
            </div>
            @if (!sidenavCollapsed()) {
              <div class="sidenav-logo__text">
                <span class="sidenav-logo__name">Acme Studio</span>
                <span class="sidenav-logo__plan">Pro Plan</span>
              </div>
            }
          </div>
          @if (!sidenavCollapsed()) {
            <app-search-bar
              placeholder="Search…"
              [value]="searchVal()"
              (valueChange)="searchVal.set($event)"
            />
          }
        </div>

        @if (isSearching()) {
          <!-- ── Search Results ────────────────────────── -->
          <app-sidenav-group [label]="searchResultsLabel()">
            @if (searchResults().length > 0) {
              @for (item of searchResults(); track item.id) {
                <app-sidenav-item
                  [icon]="item.icon"
                  [label]="item.label"
                  [active]="activeItem() === item.id"
                  [badge]="item.badge"
                  [disabled]="item.disabled ?? false"
                  [collapsed]="sidenavCollapsed()"
                  (itemClick)="activeItem.set(item.id)"
                />
              }
            } @else {
              <div class="sidenav-empty-search">
                <svg lucideIcon="search-x" [size]="28" class="sidenav-empty-search__icon" />
                <span class="sidenav-empty-search__text">No results for "{{ searchVal() }}"</span>
              </div>
            }
          </app-sidenav-group>
        } @else {
          <!-- ── Main Navigation ───────────────────────── -->
          <app-sidenav-group label="Navigation">
            @for (item of mainNavItems; track item.id) {
              <app-sidenav-item
                [icon]="item.icon"
                [label]="item.label"
                [active]="activeItem() === item.id"
                [badge]="item.badge"
                [collapsed]="sidenavCollapsed()"
                (itemClick)="activeItem.set(item.id)"
              />
            }
          </app-sidenav-group>

          <!-- Nested: Projects (multi-level tree) -->
          <app-sidenav-group label="Projects" [collapsible]="true">
            <!-- Level 0: project root items -->
            <app-sidenav-item
              icon="rocket"
              label="Alpha Release"
              [active]="activeItem() === 'project-alpha'"
              [collapsed]="sidenavCollapsed()"
              (itemClick)="activeItem.set('project-alpha')"
            />
            <app-sidenav-item
              icon="flask-conical"
              label="Beta Testing"
              [badge]="3"
              [expandable]="true"
              [(expanded)]="betaExpanded"
              [active]="activeItem() === 'project-beta'"
              [collapsed]="sidenavCollapsed()"
              (itemClick)="openExpandable('project-beta')"
            />
            <!-- Level 1: beta sub-items -->
            <app-sidenav-subgroup [expanded]="betaExpanded()" [indent]="1">
              <app-sidenav-item
                label="Sprint Planning"
                [indent]="1"
                [active]="activeItem() === 'beta-sprint'"
                [collapsed]="sidenavCollapsed()"
                (itemClick)="activeItem.set('beta-sprint')"
              />
              <app-sidenav-item
                label="Bug Tracker"
                [indent]="1"
                [badge]="5"
                [active]="activeItem() === 'beta-bugs'"
                [collapsed]="sidenavCollapsed()"
                (itemClick)="activeItem.set('beta-bugs')"
              />
              <!-- Level 1 expandable → Level 2 -->
              <app-sidenav-item
                icon="list-checks"
                label="Milestones"
                [indent]="1"
                [expandable]="true"
                [(expanded)]="milestonesExpanded"
                [active]="activeItem() === 'beta-milestones'"
                [collapsed]="sidenavCollapsed()"
                (itemClick)="activeItem.set('beta-milestones')"
              />
              <!-- Level 2: milestone sub-items -->
              <app-sidenav-subgroup [expanded]="milestonesExpanded()" [indent]="2">
                <!-- L2: expandable → L3 -->
                <app-sidenav-item
                  label="M1 – Core"
                  [indent]="2"
                  [expandable]="true"
                  [(expanded)]="m1Expanded"
                  [active]="activeItem() === 'ms-core'"
                  [collapsed]="sidenavCollapsed()"
                  (itemClick)="activeItem.set('ms-core')"
                />
                <!-- Level 3: M1 tasks -->
                <app-sidenav-subgroup [expanded]="m1Expanded()" [indent]="3">
                  <app-sidenav-item
                    label="Architecture"
                    [indent]="3"
                    [active]="activeItem() === 'ms-arch'"
                    [collapsed]="sidenavCollapsed()"
                    (itemClick)="activeItem.set('ms-arch')"
                  />
                  <!-- L3: expandable → L4 -->
                  <app-sidenav-item
                    label="Implementation"
                    [indent]="3"
                    [expandable]="true"
                    [(expanded)]="implExpanded"
                    [active]="activeItem() === 'ms-impl'"
                    [collapsed]="sidenavCollapsed()"
                    (itemClick)="activeItem.set('ms-impl')"
                  />
                  <!-- Level 4: implementation phases -->
                  <app-sidenav-subgroup [expanded]="implExpanded()" [indent]="4">
                    <app-sidenav-item
                      label="Phase 1"
                      [indent]="4"
                      [active]="activeItem() === 'impl-p1'"
                      [collapsed]="sidenavCollapsed()"
                      (itemClick)="activeItem.set('impl-p1')"
                    />
                    <!-- L4: expandable → L5 -->
                    <app-sidenav-item
                      label="Phase 2"
                      [indent]="4"
                      [expandable]="true"
                      [(expanded)]="phase2Expanded"
                      [active]="activeItem() === 'impl-p2'"
                      [collapsed]="sidenavCollapsed()"
                      (itemClick)="activeItem.set('impl-p2')"
                    />
                    <!-- Level 5: deepest leaf items -->
                    <app-sidenav-subgroup [expanded]="phase2Expanded()" [indent]="5">
                      <app-sidenav-item
                        label="Step A"
                        [indent]="5"
                        [active]="activeItem() === 'p2-step-a'"
                        [collapsed]="sidenavCollapsed()"
                        (itemClick)="activeItem.set('p2-step-a')"
                      />
                      <app-sidenav-item
                        label="Step B"
                        [indent]="5"
                        [active]="activeItem() === 'p2-step-b'"
                        [collapsed]="sidenavCollapsed()"
                        (itemClick)="activeItem.set('p2-step-b')"
                      />
                      <app-sidenav-item
                        label="Step C"
                        [indent]="5"
                        [disabled]="true"
                        [active]="activeItem() === 'p2-step-c'"
                        [collapsed]="sidenavCollapsed()"
                        (itemClick)="activeItem.set('p2-step-c')"
                      />
                    </app-sidenav-subgroup>
                    <app-sidenav-item
                      label="Phase 3"
                      [indent]="4"
                      [active]="activeItem() === 'impl-p3'"
                      [collapsed]="sidenavCollapsed()"
                      (itemClick)="activeItem.set('impl-p3')"
                    />
                  </app-sidenav-subgroup>
                  <app-sidenav-item
                    label="Testing"
                    [indent]="3"
                    [active]="activeItem() === 'ms-test'"
                    [collapsed]="sidenavCollapsed()"
                    (itemClick)="activeItem.set('ms-test')"
                  />
                </app-sidenav-subgroup>
                <app-sidenav-item
                  label="M2 – Polish"
                  [indent]="2"
                  [active]="activeItem() === 'ms-polish'"
                  [collapsed]="sidenavCollapsed()"
                  (itemClick)="activeItem.set('ms-polish')"
                />
                <app-sidenav-item
                  label="M3 – Launch"
                  [indent]="2"
                  [active]="activeItem() === 'ms-launch'"
                  [collapsed]="sidenavCollapsed()"
                  (itemClick)="activeItem.set('ms-launch')"
                />
              </app-sidenav-subgroup>
            </app-sidenav-subgroup>

            <app-sidenav-item
              icon="palette"
              label="Design System"
              [expandable]="true"
              [(expanded)]="designExpanded"
              [active]="activeItem() === 'project-design'"
              [collapsed]="sidenavCollapsed()"
              (itemClick)="openExpandable('project-design')"
            />
            <!-- Level 1: design sub-items -->
            <app-sidenav-subgroup [expanded]="designExpanded()" [indent]="1">
              @for (task of nestedTaskItems; track task.id) {
                <app-sidenav-item
                  [icon]="task.icon"
                  [label]="task.label"
                  [active]="activeItem() === task.id"
                  [collapsed]="sidenavCollapsed()"
                  [indent]="1"
                  [disabled]="task.disabled ?? false"
                  (itemClick)="activeItem.set(task.id)"
                />
              }
            </app-sidenav-subgroup>
          </app-sidenav-group>

          <!-- Teams -->
          <app-sidenav-group label="Teams" [collapsible]="true">
            @for (team of teamItems; track team.id) {
              <app-sidenav-item
                [icon]="team.icon"
                [label]="team.label"
                [active]="activeItem() === team.id"
                [badge]="team.badge"
                [collapsed]="sidenavCollapsed()"
                (itemClick)="activeItem.set(team.id)"
              />
            }
          </app-sidenav-group>

          <!-- Settings -->
          <app-sidenav-group label="Account">
            <app-sidenav-item
              icon="settings"
              label="Settings"
              [active]="activeItem() === 'settings'"
              [collapsed]="sidenavCollapsed()"
              (itemClick)="activeItem.set('settings')"
            />
            <app-sidenav-item
              icon="help-circle"
              label="Help & Support"
              [active]="activeItem() === 'help'"
              [collapsed]="sidenavCollapsed()"
              (itemClick)="activeItem.set('help')"
            />
          </app-sidenav-group>
        }

        <!-- Footer -->
        <div sidenav-footer class="sidenav-footer">
          @if (!sidenavCollapsed()) {
            <div class="sidenav-user">
              <app-avatar name="Alex Chen" size="sm" status="online" />
              <div class="sidenav-user__info">
                <span class="sidenav-user__name">Alex Chen</span>
                <span class="sidenav-user__role">Administrator</span>
              </div>
              <button
                type="button"
                class="sidenav-user__more"
                aria-label="User menu"
                (click)="toastService.info('User menu opened')"
              >
                <svg lucideIcon="more-horizontal" [size]="16" />
              </button>
            </div>
          } @else {
            <div class="sidenav-user--compact">
              <app-avatar name="Alex Chen" size="xs" status="online" />
            </div>
          }
        </div>
      </app-sidenav>

      <!-- ═══ Main Content ═══ -->
      <div class="demo-main">
        <app-nav-bar [title]="activePageTitle()" [showLargeTitle]="false">
          <button
            nav-leading
            appButton
            variant="ghost"
            size="sm"
            (click)="sidenavCollapsed.set(!sidenavCollapsed())"
            [attr.aria-label]="sidenavCollapsed() ? 'Open sidebar' : 'Close sidebar'"
          >
            <svg [lucideIcon]="sidenavCollapsed() ? 'panel-left-open' : 'panel-left-close'" [size]="18" />
          </button>
          <span nav-trailing class="text-xs text-[var(--text-tertiary)]">Sidenav Demo</span>
        </app-nav-bar>

        <div class="demo-content">
          <!-- Page Header -->
          <div class="demo-page-header">
            <div>
              <h1 class="demo-page-title">{{ activePageTitle() }}</h1>
              <p class="demo-page-subtitle">Interactive sidenav demonstration with all advanced features</p>
            </div>
            <div class="flex items-center gap-3">
              <button appButton variant="gray" size="sm" [rounded]="true" (click)="sidenavCollapsed.set(!sidenavCollapsed())">
                <svg [lucideIcon]="sidenavCollapsed() ? 'panel-left-open' : 'panel-left-close'" [size]="14" />
                {{ sidenavCollapsed() ? 'Expand' : 'Collapse' }}
              </button>
            </div>
          </div>

          <!-- Controls Panel -->
          <app-card variant="outlined" padding="lg">
            <h3 class="control-heading">Sidenav Controls</h3>
            <p class="control-description">Adjust the sidenav properties in real-time to explore all features.</p>

            <div class="controls-grid">
              <!-- Variant -->
              <div class="control-item">
                <label class="control-label">Variant</label>
                <app-segmented-control
                  [options]="variantOptions"
                  [(value)]="sidenavVariant"
                  ariaLabel="Sidenav variant"
                />
              </div>

              <!-- Position -->
              <div class="control-item">
                <label class="control-label">Position</label>
                <app-segmented-control
                  [options]="positionOptions"
                  [(value)]="sidenavPosition"
                  ariaLabel="Sidenav position"
                />
              </div>

              <!-- Toggles -->
              <div class="control-item">
                <label class="control-label">Options</label>
                <div class="space-y-3">
                  <app-toggle label="Show collapse button" [(checked)]="showCollapseBtn" />
                  <app-toggle label="Collapsed" [(checked)]="sidenavCollapsed" />
                </div>
              </div>
            </div>
          </app-card>

          <!-- Feature Cards -->
          <div class="features-grid">
            <app-card variant="elevated">
              <div class="feature-card">
                <div class="feature-icon" style="background: var(--color-system-blue-light); color: var(--color-system-blue)">
                  <svg lucideIcon="layers" [size]="20" />
                </div>
                <h4 class="feature-title">3 Variants</h4>
                <p class="feature-desc">Glass, Solid, and Floating styles with adaptive light/dark theming.</p>
              </div>
            </app-card>

            <app-card variant="elevated">
              <div class="feature-card">
                <div class="feature-icon" style="background: var(--color-system-green-light); color: var(--color-system-green)">
                  <svg lucideIcon="minimize-2" [size]="20" />
                </div>
                <h4 class="feature-title">Collapse / Expand</h4>
                <p class="feature-desc">Smooth spring-animated width transition with icon-only collapsed state.</p>
              </div>
            </app-card>

            <app-card variant="elevated">
              <div class="feature-card">
                <div class="feature-icon" style="background: var(--color-system-purple-light); color: var(--color-system-purple)">
                  <svg lucideIcon="list-tree" [size]="20" />
                </div>
                <h4 class="feature-title">Nested Items</h4>
                <p class="feature-desc">Indent support for sub-items and collapsible group sections.</p>
              </div>
            </app-card>

            <app-card variant="elevated">
              <div class="feature-card">
                <div class="feature-icon" style="background: var(--color-system-orange-light); color: var(--color-system-orange)">
                  <svg lucideIcon="bell" [size]="20" />
                </div>
                <h4 class="feature-title">Badges</h4>
                <p class="feature-desc">Count badges on items, dot indicators when collapsed, and status labels.</p>
              </div>
            </app-card>

            <app-card variant="elevated">
              <div class="feature-card">
                <div class="feature-icon" style="background: var(--color-system-teal-light); color: var(--color-system-teal)">
                  <svg lucideIcon="accessibility" [size]="20" />
                </div>
                <h4 class="feature-title">Accessible</h4>
                <p class="feature-desc">Full keyboard navigation, ARIA roles, focus management, and screen reader support.</p>
              </div>
            </app-card>

            <app-card variant="elevated">
              <div class="feature-card">
                <div class="feature-icon" style="background: var(--color-system-pink-light); color: var(--color-system-pink)">
                  <svg lucideIcon="smartphone" [size]="20" />
                </div>
                <h4 class="feature-title">Mobile Overlay</h4>
                <p class="feature-desc">Responsive overlay mode with slide-in animation and backdrop scrim.</p>
              </div>
            </app-card>
          </div>

          <!-- Active Item Display -->
          <app-card variant="outlined">
            <div class="active-display">
              <div class="active-display__icon">
                <svg [lucideIcon]="activeItemIcon()" [size]="32" />
              </div>
              <div>
                <h3 class="active-display__title">{{ activePageTitle() }}</h3>
                <p class="active-display__subtitle">Currently selected navigation item</p>
              </div>
              <app-badge variant="info" [subtle]="true">Active</app-badge>
            </div>
          </app-card>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
      height: 100dvh;
      overflow: hidden;
    }

    /* ── Layout ───────────────────────────────────────── */
    .demo-layout {
      display: flex;
      height: 100%;
      background: var(--surface-grouped);
    }

    .demo-layout--right {
      flex-direction: row-reverse;
    }

    .demo-main {
      flex: 1;
      display: flex;
      flex-direction: column;
      overflow: hidden;
      min-width: 0;
    }

    .demo-content {
      flex: 1;
      overflow-y: auto;
      padding: 24px 32px 64px;
      display: flex;
      flex-direction: column;
      gap: 24px;
    }

    @media (max-width: 768px) {
      .demo-content {
        padding: 16px 16px 48px;
      }
    }

    /* ── Page Header ──────────────────────────────────── */
    .demo-page-header {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 16px;
      flex-wrap: wrap;
    }

    .demo-page-title {
      font: var(--type-title-1);
      color: var(--text-primary);
      margin: 0;
    }

    .demo-page-subtitle {
      font: var(--type-subheadline);
      color: var(--text-secondary);
      margin: 4px 0 0;
    }

    /* ── Controls ─────────────────────────────────────── */
    .control-heading {
      font: var(--type-headline);
      color: var(--text-primary);
      margin: 0 0 4px;
    }

    .control-description {
      font: var(--type-footnote);
      color: var(--text-secondary);
      margin: 0 0 20px;
    }

    .controls-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 24px;
    }

    .control-item {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .control-label {
      font: var(--type-caption-1);
      font-weight: 600;
      color: var(--text-tertiary);
      text-transform: uppercase;
      letter-spacing: 0.06em;
    }

    /* ── Feature Cards ────────────────────────────────── */
    .features-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
      gap: 16px;
    }

    .feature-card {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .feature-icon {
      width: 44px;
      height: 44px;
      border-radius: var(--radius-lg);
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .feature-title {
      font: var(--type-headline);
      color: var(--text-primary);
      margin: 0;
    }

    .feature-desc {
      font: var(--type-footnote);
      color: var(--text-secondary);
      margin: 0;
      line-height: 1.5;
    }

    /* ── Active Display ───────────────────────────────── */
    .active-display {
      display: flex;
      align-items: center;
      gap: 16px;
    }

    .active-display__icon {
      width: 56px;
      height: 56px;
      border-radius: var(--radius-lg);
      background: var(--interactive-tint);
      color: var(--color-system-blue);
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .active-display__title {
      font: var(--type-headline);
      color: var(--text-primary);
      margin: 0;
    }

    .active-display__subtitle {
      font: var(--type-caption-1);
      color: var(--text-tertiary);
      margin: 2px 0 0;
    }

    /* ── Search Empty State ───────────────────────────── */
    .sidenav-empty-search {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 8px;
      padding: 24px 16px;
      text-align: center;
    }

    .sidenav-empty-search__icon {
      color: var(--text-quaternary);
      opacity: 0.6;
    }

    .sidenav-empty-search__text {
      font: var(--type-footnote);
      color: var(--text-tertiary);
      word-break: break-word;
    }

    /* ── Sidenav Header Styling ───────────────────────── */
    .sidenav-header {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .sidenav-logo {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .sidenav-logo__icon {
      width: 36px;
      height: 36px;
      border-radius: var(--radius-md);
      background: linear-gradient(135deg, var(--color-system-blue), var(--color-system-indigo));
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .sidenav-logo__text {
      display: flex;
      flex-direction: column;
      min-width: 0;
    }

    .sidenav-logo__name {
      font: var(--type-headline);
      color: var(--text-primary);
      white-space: nowrap;
    }

    .sidenav-logo__plan {
      font: var(--type-caption-2);
      color: var(--text-tertiary);
    }

    /* ── Sidenav Footer Styling ───────────────────────── */
    .sidenav-footer {
      width: 100%;
    }

    .sidenav-user {
      display: flex;
      align-items: center;
      gap: 10px;
      width: 100%;
    }

    .sidenav-user__info {
      flex: 1;
      min-width: 0;
      display: flex;
      flex-direction: column;
    }

    .sidenav-user__name {
      font: var(--type-footnote);
      font-weight: 600;
      color: var(--text-primary);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .sidenav-user__role {
      font: var(--type-caption-2);
      color: var(--text-tertiary);
    }

    .sidenav-user__more {
      width: 28px;
      height: 28px;
      border: none;
      background: none;
      border-radius: var(--radius-sm);
      cursor: pointer;
      color: var(--text-tertiary);
      display: flex;
      align-items: center;
      justify-content: center;
      transition: background-color var(--duration-fast) var(--ease-default);
      flex-shrink: 0;
    }

    .sidenav-user__more:hover {
      background: var(--fill-secondary);
      color: var(--text-primary);
    }

    .sidenav-user--compact {
      display: flex;
      justify-content: center;
    }
  `],
})
export class SidenavDemoComponent {
  protected readonly toastService = inject(ToastService);

  // ── Controls ──
  protected readonly betaExpanded = signal(false);
  protected readonly designExpanded = signal(false);
  protected readonly milestonesExpanded = signal(false);
  protected readonly m1Expanded = signal(false);
  protected readonly implExpanded = signal(false);
  protected readonly phase2Expanded = signal(false);

  protected readonly sidenavVariant = signal<'glass' | 'solid' | 'floating'>('solid');
  protected readonly sidenavPosition = signal<'left' | 'right'>('left');
  protected readonly sidenavCollapsed = signal(false);
  protected readonly showCollapseBtn = signal(true);
  protected readonly searchVal = signal('');
  protected readonly activeItem = signal('dashboard');

  protected readonly variantOptions: SegmentOption[] = [
    { value: 'glass', label: 'Glass' },
    { value: 'solid', label: 'Solid' },
    { value: 'floating', label: 'Floating' },
  ];

  protected readonly positionOptions: SegmentOption[] = [
    { value: 'left', label: 'Left' },
    { value: 'right', label: 'Right' },
  ];

  // ── Navigation Items ──
  protected readonly mainNavItems = [
    { id: 'dashboard', label: 'Dashboard', icon: 'layout-dashboard' },
    { id: 'inbox', label: 'Inbox', icon: 'inbox', badge: 12 },
    { id: 'calendar', label: 'Calendar', icon: 'calendar' },
    { id: 'documents', label: 'Documents', icon: 'file-text', badge: 'New' },
    { id: 'analytics', label: 'Analytics', icon: 'bar-chart-2' },
  ];

  protected readonly projectItems = [
    { id: 'project-alpha', label: 'Alpha Release', icon: 'rocket' },
    { id: 'project-beta', label: 'Beta Testing', icon: 'flask-conical', badge: 3 },
    { id: 'project-design', label: 'Design System', icon: 'palette' },
  ];

  protected readonly nestedTaskItems = [
    { id: 'task-components', label: 'Components', icon: 'component' },
    { id: 'task-tokens', label: 'Design Tokens', icon: 'paintbrush' },
    { id: 'task-docs', label: 'Documentation', icon: 'book-open' },
    { id: 'task-archived', label: 'Archived', icon: 'archive', disabled: true },
  ];

  protected readonly teamItems = [
    { id: 'team-engineering', label: 'Engineering', icon: 'code-2', badge: 8 },
    { id: 'team-design', label: 'Design', icon: 'figma' },
    { id: 'team-product', label: 'Product', icon: 'package' },
    { id: 'team-marketing', label: 'Marketing', icon: 'megaphone' },
  ];

  // ── Computed ──
  private readonly allItems: NavItem[] = [
    ...this.mainNavItems,
    ...this.projectItems,
    ...this.nestedTaskItems,
    ...this.teamItems,
    { id: 'settings', label: 'Settings', icon: 'settings' },
    { id: 'help', label: 'Help & Support', icon: 'help-circle' },
    // Flat list of nested items that only appear when browsing (not in projectItems)
    { id: 'beta-sprint', label: 'Sprint Planning' },
    { id: 'beta-bugs', label: 'Bug Tracker' },
    { id: 'beta-milestones', label: 'Milestones', icon: 'list-checks' },
    { id: 'ms-core', label: 'M1 – Core' },
    { id: 'ms-arch', label: 'Architecture' },
    { id: 'ms-impl', label: 'Implementation' },
    { id: 'impl-p1', label: 'Phase 1' },
    { id: 'impl-p2', label: 'Phase 2' },
    { id: 'p2-step-a', label: 'Step A' },
    { id: 'p2-step-b', label: 'Step B' },
    { id: 'p2-step-c', label: 'Step C', disabled: true },
    { id: 'impl-p3', label: 'Phase 3' },
    { id: 'ms-test', label: 'Testing' },
    { id: 'ms-polish', label: 'M2 – Polish' },
    { id: 'ms-launch', label: 'M3 – Launch' },
  ];

  /** True when the user is actively searching */
  protected readonly isSearching = computed(() => this.searchVal().trim().length > 0);

  /** Items matching the current search query */
  protected readonly searchResults = computed(() => {
    const query = this.searchVal().trim().toLowerCase();
    if (!query) return [];
    return this.allItems.filter(item =>
      item.label.toLowerCase().includes(query)
    );
  });

  /** Label for the search results group showing match count */
  protected readonly searchResultsLabel = computed(() => {
    const count = this.searchResults().length;
    return count === 0 ? 'Results' : `${count} result${count === 1 ? '' : 's'}`;
  });

  protected readonly activePageTitle = computed(() => {
    const item = this.allItems.find(i => i.id === this.activeItem());
    return item?.label ?? 'Dashboard';
  });

  protected readonly activeItemIcon = computed(() => {
    const item = this.allItems.find(i => i.id === this.activeItem());
    return item?.icon ?? 'layout-dashboard';
  });

  /**
   * Handles clicks on expandable items.
   * When the sidenav is collapsed, expands it first so the children become
   * visible; the item's `expanded` model is already toggled by the component.
   */
  protected openExpandable(itemId: string): void {
    if (this.sidenavCollapsed()) {
      this.sidenavCollapsed.set(false);
    }
    this.activeItem.set(itemId);
  }
}
