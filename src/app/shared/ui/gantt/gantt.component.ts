import {
  Component,
  inject,
  input,
  output,
  OnInit,
  effect,
  Injector,
  ElementRef,
  viewChild,
  AfterViewInit,
} from '@angular/core';
import { GanttService } from './gantt.service';
import { GanttToolbarComponent } from './components/gantt-toolbar.component';
import { GanttTaskListComponent } from './components/gantt-task-list.component';
import { GanttTimelineHeaderComponent } from './components/gantt-timeline-header.component';
import { GanttTimelineComponent } from './components/gantt-timeline.component';
import {
  GanttTask,
  GanttViewMode,
  GanttConfig,
  GanttSpecialDate,
  GanttTaskClickPayload,
  GanttTaskDropPayload,
  GanttTaskResizePayload,
  GanttTaskProgressChangePayload,
  GanttTaskRenamePayload,
  GanttTaskReorderPayload,
  GanttViewModeChangePayload,
  DEFAULT_GANTT_CONFIG,
} from './gantt.models';
import { OverlayModule } from '@angular/cdk/overlay';

@Component({
  selector: 'app-gantt',
  imports: [
    OverlayModule,
    GanttToolbarComponent,
    GanttTaskListComponent,
    GanttTimelineHeaderComponent,
    GanttTimelineComponent,
  ],
  providers: [GanttService],
  host: {
    class: 'block',
    role: 'application',
    'aria-label': 'Gantt chart',
  },
  template: `
    <div class="gantt-root">
      <!-- Toolbar -->
      <app-gantt-toolbar
        (scrollToToday)="scrollToToday()"
        (viewModeChange)="viewModeChange.emit($event)"
      />

      <!-- Main body: sidebar + timeline -->
      <div class="gantt-body">
        <!-- ── Left sidebar (fixed) ── -->
        <div class="gantt-sidebar-col">
          <!-- Header spacer — mirrors the timeline header height -->
          <div class="gantt-sidebar-header-spacer"></div>
          <!--
            Sidebar viewport: clips the rows to the visible height.
            The inner .gantt-sidebar-track slides via translateY in lockstep
            with gantt-body-scroll.scrollTop, identical to how the timeline
            header is synced via translateX.
          -->
          <div class="gantt-sidebar-viewport">
            <div class="gantt-sidebar-track" #sidebarTrack>
              <app-gantt-task-list
                (taskRename)="onTaskRename($event)"
                (taskReorder)="onTaskReorder($event)"
              />
            </div>
          </div>
        </div>

        <!-- ── Right side: header (fixed) + scrollable grid ── -->
        <div class="gantt-timeline-col">

          <!--
            Header viewport: fixed height, overflow: hidden.
            The inner content is shifted via translateX to stay in sync
            with the body scroll. This avoids the position:sticky
            horizontal-scroll bug.
          -->
          <div class="gantt-header-viewport" aria-hidden="false">
            <div
              class="gantt-header-track"
              #headerTrack
              [style.width.px]="svc.totalTimelineWidth()"
            >
              <app-gantt-timeline-header />
            </div>
          </div>

          <!-- Scrollable body -->
          <div
            class="gantt-body-scroll"
            #scrollArea
            (scroll)="onScroll()"
          >
            <div
              class="gantt-grid-area"
              [style.width.px]="svc.totalTimelineWidth()"
            >
              <app-gantt-timeline
                (taskClick)="onTaskClick($event)"
                (taskDrop)="onTaskDrop($event)"
                (taskResize)="onTaskResize($event)"
                (taskProgressChange)="onTaskProgressChange($event)"
              />
            </div>
          </div>

        </div>
      </div>
    </div>
  `,
  styles: `
    :host {
      display: block;
      height: 100%;
    }

    .gantt-root {
      display: flex;
      flex-direction: column;
      background: var(--surface-primary);
      border-radius: var(--radius-2xl);
      border: 1px solid var(--border-default);
      box-shadow: var(--shadow-xl);
      overflow: hidden;
      height: 100%;
      min-height: 400px;
    }

    /* ── Body row ─────────────────────────────────────────────── */
    .gantt-body {
      display: flex;
      flex: 1;
      min-height: 0;
      overflow: hidden;
    }

    /* ── Sidebar column ───────────────────────────────────────── */
    .gantt-sidebar-col {
      display: flex;
      flex-direction: column;
      flex-shrink: 0;
      overflow: hidden;
      /* Mirror the same border-right as the task list inner element */
      border-right: 1px solid var(--separator);
    }

    /*
      Sidebar header spacer — matches the two-row timeline header height
      exactly so the task rows are vertically aligned with the timeline rows.
    */
    .gantt-sidebar-header-spacer {
      height: 56px;
      flex-shrink: 0;
      background: var(--surface-secondary);
      border-bottom: 1px solid var(--separator);
    }

    /*
      Sidebar viewport: clips the task rows to the available height.
      overflow: hidden so no scrollbar appears — scroll is driven externally.
    */
    .gantt-sidebar-viewport {
      flex: 1;
      overflow: hidden;
      min-height: 0;
      position: relative;
    }

    /*
      The task list track slides up via translateY in lockstep with
      .gantt-body-scroll.scrollTop, driven by onScroll().
    */
    .gantt-sidebar-track {
      will-change: transform;
    }

    /* ── Timeline column ──────────────────────────────────────── */
    .gantt-timeline-col {
      display: flex;
      flex-direction: column;
      flex: 1;
      min-width: 0;
      overflow: hidden;
    }

    /*
      Header viewport: clips the header to the visible width.
      The inner .gantt-header-track slides via translateX so that
      the correct date columns are always shown without any scrollbar.
    */
    .gantt-header-viewport {
      flex-shrink: 0;
      overflow: hidden;
      position: relative;
      z-index: 10;
      border-bottom: 1px solid var(--separator);
    }

    .gantt-header-track {
      /* transform is applied from TS on every scroll event */
      will-change: transform;
    }

    /* ── Scrollable body ──────────────────────────────────────── */
    .gantt-body-scroll {
      flex: 1;
      overflow-x: auto;
      overflow-y: auto;
      min-height: 0;
      scrollbar-width: thin;
      scrollbar-color: var(--border-opaque) transparent;
    }

    .gantt-grid-area {
      position: relative;
      min-height: 100%;
    }
  `,
})
export class GanttComponent implements OnInit, AfterViewInit {
  private readonly injector = inject(Injector);
  protected readonly svc = inject(GanttService);

  private readonly scrollArea = viewChild.required<ElementRef<HTMLElement>>('scrollArea');
  private readonly headerTrack = viewChild.required<ElementRef<HTMLElement>>('headerTrack');
  private readonly sidebarTrack = viewChild.required<ElementRef<HTMLElement>>('sidebarTrack');

  // ── Inputs ──────────────────────────────────────────────────────────────────────
  readonly tasks = input<GanttTask[]>([]);
  readonly viewMode = input<GanttViewMode>(DEFAULT_GANTT_CONFIG.viewMode);
  readonly rowHeight = input<number>(DEFAULT_GANTT_CONFIG.rowHeight);
  readonly sidebarWidth = input<number>(DEFAULT_GANTT_CONFIG.sidebarWidth);
  readonly showDependencies = input<boolean>(DEFAULT_GANTT_CONFIG.showDependencies);
  readonly readonly = input<boolean>(DEFAULT_GANTT_CONFIG.readonly);
  readonly locale = input<string>(DEFAULT_GANTT_CONFIG.locale);
  /** Calendar-date overrides — mark days as holidays or forced workdays */
  readonly specialDates = input<GanttSpecialDate[]>(DEFAULT_GANTT_CONFIG.specialDates);

  // ── Outputs ─────────────────────────────────────────────────────────────────
  readonly taskClick = output<GanttTaskClickPayload>();
  readonly taskDrop = output<GanttTaskDropPayload>();
  readonly taskResize = output<GanttTaskResizePayload>();
  readonly taskProgressChange = output<GanttTaskProgressChangePayload>();
  readonly taskRename = output<GanttTaskRenamePayload>();
  readonly taskReorder = output<GanttTaskReorderPayload>();
  readonly viewModeChange = output<GanttViewModeChangePayload>();

  ngAfterViewInit(): void {
    // Nothing needed here — viewChild refs are available after view init
  }

  ngOnInit(): void {
    // Initial sync
    this.svc.tasks.set(this.tasks());
    this.svc.applyConfig({
      viewMode: this.viewMode(),
      rowHeight: this.rowHeight(),
      sidebarWidth: this.sidebarWidth(),
      showDependencies: this.showDependencies(),
      readonly: this.readonly(),
      locale: this.locale(),
      specialDates: this.specialDates(),
    });

    // Reactive sync
    effect(() => { this.svc.tasks.set(this.tasks()); }, { injector: this.injector });
    effect(() => { this.svc.viewMode.set(this.viewMode()); }, { injector: this.injector });
    effect(() => { this.svc.rowHeight.set(this.rowHeight()); }, { injector: this.injector });
    effect(() => { this.svc.sidebarWidth.set(this.sidebarWidth()); }, { injector: this.injector });
    effect(() => { this.svc.showDependencies.set(this.showDependencies()); }, { injector: this.injector });
    effect(() => { this.svc.readonly.set(this.readonly()); }, { injector: this.injector });
    effect(() => { this.svc.locale.set(this.locale()); }, { injector: this.injector });
    effect(() => { this.svc.specialDates.set(this.specialDates()); }, { injector: this.injector });

    // Auto-scroll to today on init
    setTimeout(() => this.scrollToToday(), 0);
  }

  /** Sync header translateX and sidebar translateY with the body scroll position. */
  protected onScroll(): void {
    const el = this.scrollArea().nativeElement;
    this.headerTrack().nativeElement.style.transform = `translateX(-${el.scrollLeft}px)`;
    this.sidebarTrack().nativeElement.style.transform = `translateY(-${el.scrollTop}px)`;
  }

  protected scrollToToday(): void {
    const el = this.scrollArea().nativeElement;
    const todayOffset = this.svc.dateToPixel(new Date());
    const halfWidth = el.clientWidth / 2;
    el.scrollTo({ left: Math.max(0, todayOffset - halfWidth), behavior: 'smooth' });
    // Also sync header immediately so there's no flash
    this.onScroll();
  }

  protected onTaskClick(event: GanttTaskClickPayload): void {
    this.taskClick.emit(event);
  }

  protected onTaskDrop(event: GanttTaskDropPayload): void {
    this.svc.tasks.update((tasks) =>
      tasks.map((t) =>
        t.id === event.task.id
          ? { ...t, start: event.newStart, end: event.newEnd }
          : t,
      ),
    );
    this.taskDrop.emit(event);
  }

  protected onTaskResize(event: GanttTaskResizePayload): void {
    this.svc.tasks.update((tasks) =>
      tasks.map((t) =>
        t.id === event.task.id
          ? { ...t, start: event.newStart, end: event.newEnd }
          : t,
      ),
    );
    this.taskResize.emit(event);
  }

  protected onTaskProgressChange(event: GanttTaskProgressChangePayload): void {
    this.taskProgressChange.emit(event);
  }

  protected onTaskRename(event: GanttTaskRenamePayload): void {
    this.taskRename.emit(event);
  }

  protected onTaskReorder(event: GanttTaskReorderPayload): void {
    this.taskReorder.emit(event);
  }
}
