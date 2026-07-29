import { Component, inject, signal, output } from '@angular/core';
import { GanttService } from '../gantt.service';
import { GanttTask, GanttTaskRenamePayload, GanttTaskReorderPayload } from '../gantt.models';
import { CdkDragDrop, CdkDrag, CdkDragPlaceholder, CdkDropList } from '@angular/cdk/drag-drop';


@Component({
  selector: 'app-gantt-task-list',
  imports: [CdkDrag, CdkDragPlaceholder, CdkDropList],
  host: {
    class: 'block',
    role: 'rowgroup',
    'aria-label': 'Task list',
  },
  template: `
    <div class="gtl" [style.width.px]="svc.sidebarWidth()" cdkDropList (cdkDropListDropped)="onDrop($event)">
      <!-- Unified row list — same source as timeline so indices always match -->
      @for (row of svc.visibleRows(); track $index; let i = $index) {
        @if (row.type === 'group') {
          <!-- Group header row -->
          <div
            class="gtl__group-row"
            [style.height.px]="svc.rowHeight()"
            (click)="svc.toggleGroup(row.group.id)"
            role="button"
            [attr.aria-expanded]="!row.group.collapsed"
            [attr.aria-label]="row.group.title + ' group, ' + (row.group.collapsed ? 'collapsed' : 'expanded')"
          >
            <span class="gtl__chevron" [class.gtl__chevron--collapsed]="row.group.collapsed" aria-hidden="true">
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                <path d="M2 3.5L5 6.5L8 3.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </span>
            <span class="gtl__group-title">{{ row.group.title }}</span>
          </div>
        } @else {
          <!-- Task row — wrapped in cdkDropList per group -->
          <div
            cdkDrag
            [cdkDragData]="row.task"
            class="gtl__task-row"
            [style.height.px]="svc.rowHeight()"
            [class.gtl__task-row--hovered]="svc.hoveredRowIndex() === i"
            [class.gtl__task-row--editing]="editingTaskId() === row.task.id"
            (mouseenter)="svc.hoveredRowIndex.set(i)"
            (mouseleave)="svc.hoveredRowIndex.set(null)"
            role="row"
            [attr.aria-label]="row.task.title"
          >
            <!-- CDK drag placeholder -->
            <div class="gtl__drag-placeholder" *cdkDragPlaceholder></div>

            @if (row.task.milestone) {
              <span
                class="gtl__milestone-marker"
                [class]="'gtl__milestone-marker--' + (row.task.color ?? 'blue')"
                aria-label="Milestone"
              >◆</span>
            } @else {
              <span
                class="gtl__color-dot"
                [class]="'gtl__color-dot--' + (row.task.color ?? 'blue')"
                aria-hidden="true"
              ></span>
            }

            @if (editingTaskId() === row.task.id) {
              <input
                class="gtl__task-edit-input"
                type="text"
                [value]="editingValue()"
                (input)="editingValue.set($any($event.target).value)"
                (keydown.enter)="commitEdit(row.task)"
                (keydown.escape)="cancelEdit()"
                (blur)="commitEdit(row.task)"
                [attr.aria-label]="'Edit task name: ' + row.task.title"
              />
            } @else {
              <span
                class="gtl__task-title"
                [title]="row.task.title"
                (dblclick)="startEdit(row.task)"
                [attr.aria-label]="'Double-click to rename: ' + row.task.title"
              >{{ row.task.title }}</span>
            }

            @if ((row.task.progress ?? 0) > 0) {
              <span class="gtl__progress-chip" [attr.aria-label]="row.task.progress + '% complete'">
                {{ row.task.progress }}%
              </span>
            }

            <!-- Drag handle -->
            <button
              cdkDragHandle
              class="gtl__drag-handle"
              aria-label="Drag to reorder task"
              title="Drag to reorder"
              (click)="$event.stopPropagation()"
            >
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
                <circle cx="4" cy="3" r="1" fill="currentColor"/>
                <circle cx="8" cy="3" r="1" fill="currentColor"/>
                <circle cx="4" cy="6" r="1" fill="currentColor"/>
                <circle cx="8" cy="6" r="1" fill="currentColor"/>
                <circle cx="4" cy="9" r="1" fill="currentColor"/>
                <circle cx="8" cy="9" r="1" fill="currentColor"/>
              </svg>
            </button>
          </div>
        }
      }
    </div>
  `,
  styles: `
    .gtl {
      display: flex;
      flex-direction: column;
      background: var(--surface-primary);
      flex-shrink: 0;
      overflow: hidden;
    }

    /* Group row */
    .gtl__group-row {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 0 12px 0 10px;
      cursor: pointer;
      background: var(--fill-tertiary);
      border-bottom: 1px solid var(--separator);
      transition: background var(--duration-fast) var(--ease-default);
      user-select: none;
      flex-shrink: 0;
    }

    .gtl__group-row:hover {
      background: var(--fill-secondary);
    }

    .gtl__chevron {
      color: var(--text-tertiary);
      display: grid;
      place-items: center;
      transition: transform var(--duration-normal) var(--ease-spring);
      flex-shrink: 0;
    }

    .gtl__chevron--collapsed {
      transform: rotate(-90deg);
    }

    .gtl__group-title {
      font: var(--type-footnote);
      font-weight: 600;
      color: var(--text-secondary);
      text-transform: uppercase;
      letter-spacing: var(--tracking-wide);
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      flex: 1;
    }

    /* Task row */
    .gtl__task-row {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 0 12px 0 16px;
      border-bottom: 1px solid var(--separator);
      transition: background var(--duration-instant) linear;
      flex-shrink: 0;
    }

    .gtl__task-row--hovered {
      background: var(--fill-primary);
    }

    .gtl__color-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      flex-shrink: 0;
    }

    .gtl__color-dot--blue   { background: var(--color-system-blue); }
    .gtl__color-dot--green  { background: var(--color-system-green); }
    .gtl__color-dot--orange { background: var(--color-system-orange); }
    .gtl__color-dot--red    { background: var(--color-system-red); }
    .gtl__color-dot--purple { background: var(--color-system-purple); }
    .gtl__color-dot--teal   { background: var(--color-system-teal); }
    .gtl__color-dot--pink   { background: var(--color-system-pink); }
    .gtl__color-dot--indigo { background: var(--color-system-indigo); }
    .gtl__color-dot--yellow { background: var(--color-system-yellow); }

    .gtl__milestone-marker {
      font-size: 10px;
      flex-shrink: 0;
    }
    .gtl__milestone-marker--blue   { color: var(--color-system-blue); }
    .gtl__milestone-marker--green  { color: var(--color-system-green); }
    .gtl__milestone-marker--orange { color: var(--color-system-orange); }
    .gtl__milestone-marker--red    { color: var(--color-system-red); }
    .gtl__milestone-marker--purple { color: var(--color-system-purple); }
    .gtl__milestone-marker--teal   { color: var(--color-system-teal); }
    .gtl__milestone-marker--pink   { color: var(--color-system-pink); }
    .gtl__milestone-marker--indigo { color: var(--color-system-indigo); }
    .gtl__milestone-marker--yellow { color: var(--color-system-yellow); }

    /* Drop list container — must be a real box (not display:contents) so CDK can measure bounds */
    .gtl__drop-list {
      display: flex;
      flex-direction: column;
      flex-shrink: 0;
    }

    /* Drag placeholder */
    .gtl__drag-placeholder {
      height: 44px;
      background: color-mix(in oklch, var(--color-primary) 8%, transparent);
      border: 1px dashed var(--color-primary);
      border-radius: var(--radius-sm);
      margin: 0 4px;
      flex-shrink: 0;
    }

    /* Drag handle button */
    .gtl__drag-handle {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 20px;
      height: 20px;
      border: none;
      background: transparent;
      border-radius: var(--radius-xs);
      color: var(--text-quaternary, var(--text-tertiary));
      cursor: grab;
      opacity: 0;
      flex-shrink: 0;
      padding: 0;
      transition: opacity var(--duration-fast) var(--ease-default),
                  background var(--duration-fast) var(--ease-default);
    }

    .gtl__task-row:hover .gtl__drag-handle {
      opacity: 1;
    }

    .gtl__drag-handle:hover {
      background: var(--fill-secondary);
      color: var(--text-secondary);
    }

    /* Editing state */
    .gtl__task-row--editing {
      background: color-mix(in oklch, var(--color-primary) 4%, var(--surface-primary));
    }

    /* Inline edit input */
    .gtl__task-edit-input {
      flex: 1;
      border: 1px solid var(--color-primary);
      border-radius: var(--radius-sm);
      background: var(--surface-primary);
      color: var(--text-primary);
      font: var(--type-subheadline);
      padding: 2px 6px;
      outline: none;
      min-width: 0;
      box-shadow: 0 0 0 2px color-mix(in oklch, var(--color-primary) 20%, transparent);
    }

    .gtl__task-title {
      font: var(--type-subheadline);
      color: var(--text-primary);
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      flex: 1;
      cursor: default;
    }

    .gtl__task-title:hover {
      color: var(--color-primary);
    }

    .gtl__progress-chip {
      font: var(--type-caption-2);
      font-weight: 500;
      color: var(--text-tertiary);
      flex-shrink: 0;
    }
  `,
})
export class GanttTaskListComponent {
  protected readonly svc = inject(GanttService);

  readonly taskRename = output<GanttTaskRenamePayload>();
  readonly taskReorder = output<GanttTaskReorderPayload>();

  // ── Inline editing state ───────────────────────────────────────────────────
  protected editingTaskId = signal<string | number | null>(null);
  protected editingValue = signal<string>('');

  protected startEdit(task: GanttTask): void {
    if (this.svc.readonly()) return;
    this.editingTaskId.set(task.id);
    this.editingValue.set(task.title);
  }

  protected commitEdit(task: GanttTask): void {
    const newTitle = this.editingValue().trim();
    if (newTitle && newTitle !== task.title) {
      const previousTitle = task.title;
      this.svc.renameTask(task.id, newTitle);
      this.taskRename.emit({ task, newTitle, previousTitle });
    }
    this.editingTaskId.set(null);
    this.editingValue.set('');
  }

  protected cancelEdit(): void {
    this.editingTaskId.set(null);
    this.editingValue.set('');
  }

  // ── CDK Drag-and-drop ───────────────
  protected onDrop(event: CdkDragDrop<GanttTask[]>): void {
    if (event.previousIndex === event.currentIndex) return;

    const movedTask: GanttTask = event.item.data;
    if (!movedTask) return;

    const visibleTasks = this.svc.visibleRows()
      .filter(row => row.type === 'task')
      .map(row => row.task!);

    const groupKey = movedTask.group ?? '__ungrouped__';
    const groupTasks = visibleTasks.filter(t => (t.group ?? '__ungrouped__') === groupKey);
    const previousIndex = groupTasks.findIndex(t => t.id === movedTask.id);

    // Simulate move to find new group-relative index
    const simulatedTasks = [...visibleTasks];
    simulatedTasks.splice(event.previousIndex, 1);
    simulatedTasks.splice(event.currentIndex, 0, movedTask);

    const simulatedGroupTasks = simulatedTasks.filter(t => (t.group ?? '__ungrouped__') === groupKey);
    const newIndex = simulatedGroupTasks.findIndex(t => t.id === movedTask.id);

    if (previousIndex !== newIndex && previousIndex !== -1 && newIndex !== -1) {
      this.svc.reorderTask(movedTask.id, previousIndex, newIndex);
      this.taskReorder.emit({
        taskId: movedTask.id,
        newIndex,
        previousIndex,
      });
    }
  }
}
