import {
  Component,
  input,
  output,
  signal,
  computed,
  ElementRef,
  viewChild,
  OnDestroy,
  inject,
} from '@angular/core';
import { Observable, Subscription } from 'rxjs';
import { LucideDynamicIcon } from '@lucide/angular';
import { LiveAnnouncer } from '@angular/cdk/a11y';
import { ProgressComponent } from '../progress/progress';

// ── Interfaces ────────────────────────────────────────────────

export interface FileEntry {
  id: string;
  file: File;
  preview: string | null;
  progress: number;
  status: 'pending' | 'uploading' | 'success' | 'error';
  error: string | null;
}

export interface UploadProgress {
  progress: number;
  status: 'uploading' | 'success' | 'error';
  error?: string;
}

export interface FileError {
  file: File;
  reason: 'size' | 'type' | 'max-files';
  message: string;
}

// ── Helpers ──────────────────────────────────────────────────

function generateId(): string {
  return Math.random().toString(36).slice(2, 11);
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  const size = bytes / Math.pow(1024, i);
  return `${size < 10 ? size.toFixed(1) : Math.round(size)} ${units[i]}`;
}

function getFileIcon(file: File): string {
  const type = file.type;
  if (type.startsWith('image/')) return 'image';
  if (type.startsWith('video/')) return 'film';
  if (type.startsWith('audio/')) return 'music';
  if (type === 'application/pdf') return 'file-text';
  if (type.includes('zip') || type.includes('compressed') || type.includes('archive'))
    return 'archive';
  if (type.includes('spreadsheet') || type.includes('excel') || file.name.match(/\.(xlsx?|csv)$/i))
    return 'table';
  if (type.includes('presentation') || type.includes('powerpoint'))
    return 'presentation';
  if (type.includes('document') || type.includes('word') || type.includes('text'))
    return 'file-text';
  return 'file';
}

function isImageType(file: File): boolean {
  return file.type.startsWith('image/');
}

function matchesAccept(file: File, accept: string): boolean {
  if (!accept || accept === '*' || accept === '*/*') return true;
  const tokens = accept.split(',').map((t) => t.trim().toLowerCase());
  const fileName = file.name.toLowerCase();
  const fileType = file.type.toLowerCase();

  return tokens.some((token) => {
    if (token.startsWith('.')) {
      return fileName.endsWith(token);
    }
    if (token.endsWith('/*')) {
      const prefix = token.slice(0, -2);
      return fileType.startsWith(prefix + '/');
    }
    return fileType === token;
  });
}

// ── FileItemComponent ────────────────────────────────────────

@Component({
  selector: 'app-file-item',
  imports: [LucideDynamicIcon, ProgressComponent],
  host: {
    class: 'block',
  },
  template: `
    <div
      class="group relative flex items-center gap-3 rounded-xl border px-3 py-2.5 transition-all duration-normal"
      [class]="itemClasses()"
      [style.box-shadow]="itemShadow()"
      [style.animation]="'file-item-in 0.3s var(--ease-spring) both'"
    >
      <!-- Thumbnail / Icon -->
      <div
        class="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg overflow-hidden transition-colors duration-fast"
        [class]="thumbnailBgClass()"
      >
        @if (entry().preview) {
          <img
            [src]="entry().preview!"
            [alt]="entry().file.name"
            class="h-full w-full object-cover"
          />
        } @else {
          <svg
            [lucideIcon]="fileIcon()"
            [size]="20"
            class="transition-colors duration-fast"
            [class]="iconColorClass()"
          />
        }
      </div>

      <!-- Info -->
      <div class="min-w-0 flex-1">
        <p class="truncate text-sm font-medium text-[var(--text-primary)]">
          {{ entry().file.name }}
        </p>
        <div class="mt-0.5 flex items-center gap-2">
          <span class="text-xs text-[var(--text-tertiary)]">
            {{ formattedSize() }}
          </span>
          @if (entry().status === 'error' && entry().error) {
            <span class="text-xs text-system-red">{{ entry().error }}</span>
          }
          @if (entry().status === 'success') {
            <span class="text-xs text-system-green">Uploaded</span>
          }
        </div>
        @if (entry().status === 'uploading') {
          <div class="mt-1.5">
            <app-progress
              [value]="entry().progress"
              [max]="100"
              size="xs"
              color="blue"
              [determinate]="entry().progress > 0"
            />
          </div>
        }
      </div>

      <!-- Status / Actions -->
      <div class="flex shrink-0 items-center gap-1">
        @if (entry().status === 'success') {
          <div
            class="flex h-6 w-6 items-center justify-center rounded-full bg-system-green/15 text-system-green"
            style="animation: file-status-in 0.3s var(--ease-spring) both"
          >
            <svg lucideIcon="check" [size]="14" />
          </div>
        }

        @if (entry().status === 'error') {
          <button
            type="button"
            class="flex h-7 w-7 items-center justify-center rounded-lg text-system-orange hover:bg-system-orange/10 active:scale-90 transition-all duration-fast"
            aria-label="Retry upload"
            (click)="retry.emit(entry())"
          >
            <svg lucideIcon="refresh-cw" [size]="14" />
          </button>
        }

        @if (entry().status === 'uploading') {
          <span class="text-xs font-medium tabular-nums text-system-blue">
            {{ entry().progress }}%
          </span>
        }

        <button
          type="button"
          class="flex h-7 w-7 items-center justify-center rounded-lg text-[var(--text-quaternary)] hover:text-system-red hover:bg-system-red/10 active:scale-90 transition-all duration-fast"
          [class]="entry().status === 'uploading' ? 'opacity-50' : 'opacity-0 group-hover:opacity-100 focus-visible:opacity-100'"
          aria-label="Remove file"
          (click)="remove.emit(entry())"
        >
          <svg lucideIcon="x" [size]="14" />
        </button>
      </div>
    </div>
  `,
  styles: `
    @keyframes file-item-in {
      from {
        opacity: 0;
        transform: translateY(8px) scale(0.97);
      }
      to {
        opacity: 1;
        transform: translateY(0) scale(1);
      }
    }

    @keyframes file-status-in {
      from {
        opacity: 0;
        transform: scale(0.5);
      }
      to {
        opacity: 1;
        transform: scale(1);
      }
    }
  `,
})
export class FileItemComponent {
  readonly entry = input.required<FileEntry>();
  readonly retry = output<FileEntry>();
  readonly remove = output<FileEntry>();

  protected readonly formattedSize = computed(() =>
    formatFileSize(this.entry().file.size)
  );

  protected readonly fileIcon = computed(() =>
    getFileIcon(this.entry().file)
  );

  protected readonly itemClasses = computed(() => {
    const status = this.entry().status;
    switch (status) {
      case 'error':
        return 'border-system-red/20 bg-system-red/5';
      case 'success':
        return 'border-system-green/20 bg-[var(--surface-elevated)]';
      default:
        return 'border-[var(--border-default)] bg-[var(--surface-elevated)]';
    }
  });

  protected readonly itemShadow = computed(() => {
    if (this.entry().status === 'error') {
      return '0 0 0 1px oklch(59% 0.23 27 / 0.08)';
    }
    return 'var(--shadow-xs)';
  });

  protected readonly thumbnailBgClass = computed(() => {
    if (this.entry().preview) return '';
    const status = this.entry().status;
    if (status === 'error') return 'bg-system-red/10';
    if (status === 'success') return 'bg-system-green/10';
    return 'bg-[var(--fill-secondary)]';
  });

  protected readonly iconColorClass = computed(() => {
    const status = this.entry().status;
    if (status === 'error') return 'text-system-red';
    if (status === 'success') return 'text-system-green';
    return 'text-[var(--text-tertiary)]';
  });
}

// ── FileUploadComponent (Main Dropzone) ─────────────────────

@Component({
  selector: 'app-file-upload',
  imports: [LucideDynamicIcon, FileItemComponent],
  host: {
    class: 'block',
    '(paste)': 'onPaste($event)',
  },
  template: `
    <!-- Live region for screen readers -->
    <div
      class="sr-only"
      role="status"
      aria-live="polite"
      aria-atomic="true"
    >
      {{ statusAnnouncement() }}
    </div>

    @if (variant() === 'compact') {
      <!-- ── Compact Variant ── -->
      <div class="flex items-center gap-3">
        <button
          type="button"
          class="inline-flex items-center gap-2 rounded-xl border border-[var(--border-default)] bg-[var(--form-field-glass)] px-4 py-2.5 text-sm font-semibold text-[var(--text-primary)] backdrop-blur-sm transition-all duration-fast hover:border-[var(--border-opaque)] hover:bg-[var(--fill-primary)] active:scale-96 disabled:opacity-40 disabled:pointer-events-none"
          [disabled]="disabled()"
          [attr.aria-label]="label()"
          (click)="openFileDialog()"
        >
          <svg lucideIcon="upload" [size]="16" class="text-system-blue" />
          Choose {{ multiple() ? 'Files' : 'File' }}
        </button>

        @if (files().length > 0) {
          <span class="inline-flex items-center gap-1.5 text-sm text-[var(--text-secondary)]">
            <span
              class="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-system-blue px-1.5 text-2xs font-semibold text-white"
            >
              {{ files().length }}
            </span>
            {{ files().length === 1 ? 'file' : 'files' }} selected
          </span>
        }
      </div>

      <!-- Compact file list -->
      @if (showPreview() && files().length > 0) {
        <div class="mt-3 flex flex-col gap-2">
          @for (entry of files(); track entry.id) {
            <app-file-item
              [entry]="entry"
              (retry)="onRetry($event)"
              (remove)="onRemove($event)"
            />
          }
        </div>
      }
    } @else {
      <!-- ── Default Variant (Full Dropzone) ── -->
      <div
        #dropzone
        role="button"
        tabindex="0"
        [attr.aria-label]="dropzoneAriaLabel()"
        [attr.aria-disabled]="disabled() || null"
        class="relative cursor-pointer rounded-2xl border-2 border-dashed transition-all duration-normal overflow-hidden"
        [class]="dropzoneClasses()"
        [style.box-shadow]="dropzoneShadow()"
        (click)="openFileDialog()"
        (keydown.enter)="openFileDialog()"
        (keydown.space)="onSpaceKey($event)"
        (dragenter)="onDragEnter($event)"
        (dragover)="onDragOver($event)"
        (dragleave)="onDragLeave($event)"
        (drop)="onDrop($event)"
      >
        <!-- Drag overlay pulse -->
        @if (dragActive()) {
          <div
            class="pointer-events-none absolute inset-0 rounded-2xl"
            style="
              background: radial-gradient(ellipse at center, oklch(59% 0.24 264 / 0.06) 0%, transparent 70%);
              animation: dropzone-pulse 1.5s ease-in-out infinite;
            "
          ></div>
        }

        <div
          class="relative flex flex-col items-center justify-center gap-3 px-6 py-10 transition-transform duration-normal"
          [style.transform]="dragActive() ? 'scale(1.01)' : 'scale(1)'"
        >
          <!-- Icon -->
          <div
            class="flex h-14 w-14 items-center justify-center rounded-2xl transition-all duration-normal"
            [class]="iconContainerClasses()"
          >
            <svg
              lucideIcon="upload-cloud"
              [size]="26"
              class="transition-all duration-normal"
              [class]="dragActive() ? 'text-system-blue' : 'text-[var(--text-tertiary)]'"
              [style.transform]="dragActive() ? 'translateY(-2px)' : 'translateY(0)'"
            />
          </div>

          <!-- Label -->
          <div class="text-center">
            <p class="text-sm font-semibold text-[var(--text-primary)]">
              {{ dragActive() ? 'Drop to upload' : label() }}
            </p>
            @if (hint(); as h) {
              <p class="mt-1 text-xs text-[var(--text-tertiary)]">{{ h }}</p>
            } @else {
              <p class="mt-1 text-xs text-[var(--text-tertiary)]">
                or
                <span class="font-medium text-system-blue">browse</span>
                to choose {{ multiple() ? 'files' : 'a file' }}
              </p>
            }
          </div>

          <!-- Constraints info -->
          <div class="flex flex-wrap items-center justify-center gap-x-3 gap-y-1">
            @if (accept() !== '*' && accept() !== '*/*') {
              <span class="text-2xs text-[var(--text-quaternary)]">
                {{ acceptLabel() }}
              </span>
            }
            <span class="text-2xs text-[var(--text-quaternary)]">
              Max {{ formattedMaxSize() }}
            </span>
            @if (multiple()) {
              <span class="text-2xs text-[var(--text-quaternary)]">
                Up to {{ maxFiles() }} files
              </span>
            }
          </div>
        </div>
      </div>

      <!-- Error Messages -->
      @if (errors().length > 0) {
        <div class="mt-2 flex flex-col gap-1">
          @for (err of errors(); track err.file.name + err.reason) {
            <div
              class="flex items-center gap-2 rounded-lg bg-system-red/8 px-3 py-2 text-xs text-system-red"
              role="alert"
              style="animation: file-item-in 0.25s var(--ease-spring) both"
            >
              <svg lucideIcon="alert-circle" [size]="14" class="shrink-0" />
              <span>
                <span class="font-medium">{{ err.file.name }}:</span>
                {{ err.message }}
              </span>
            </div>
          }
        </div>
      }

      <!-- File List -->
      @if (showPreview() && files().length > 0) {
        <div class="mt-3 flex flex-col gap-2">
          @for (entry of files(); track entry.id) {
            <app-file-item
              [entry]="entry"
              (retry)="onRetry($event)"
              (remove)="onRemove($event)"
            />
          }
        </div>
      }
    }

    <!-- Hidden file input -->
    <input
      #fileInput
      type="file"
      class="hidden"
      [accept]="accept()"
      [multiple]="multiple()"
      [disabled]="disabled()"
      (change)="onFileInputChange($event)"
    />
  `,
  styles: `
    :host {
      outline: none;
    }

    @keyframes dropzone-pulse {
      0%, 100% { opacity: 0.5; }
      50% { opacity: 1; }
    }

    @keyframes file-item-in {
      from {
        opacity: 0;
        transform: translateY(8px) scale(0.97);
      }
      to {
        opacity: 1;
        transform: translateY(0) scale(1);
      }
    }

    @keyframes dash-march {
      to { stroke-dashoffset: -16; }
    }
  `,
})
export class FileUploadComponent implements OnDestroy {
  // ── Inputs ──────────────────────────────────────────────────
  readonly accept = input('*');
  readonly multiple = input(true);
  readonly maxFileSize = input(10_485_760); // 10 MB
  readonly maxFiles = input(10);
  readonly disabled = input(false);
  readonly label = input('Drop files here');
  readonly hint = input<string | null>(null);
  readonly showPreview = input(true);
  readonly variant = input<'default' | 'compact'>('default');
  readonly uploadFn = input<((file: File) => Observable<UploadProgress>) | null>(null);

  // ── Outputs ─────────────────────────────────────────────────
  readonly filesChange = output<FileEntry[]>();
  readonly fileAdded = output<FileEntry>();
  readonly fileRemoved = output<FileEntry>();
  readonly fileError = output<FileError>();

  // ── Internal state ──────────────────────────────────────────
  protected readonly files = signal<FileEntry[]>([]);
  protected readonly errors = signal<FileError[]>([]);
  protected readonly dragActive = signal(false);
  protected readonly statusAnnouncement = signal('');
  private dragCounter = 0;
  private readonly subscriptions = new Map<string, Subscription>();
  private readonly liveAnnouncer = inject(LiveAnnouncer);

  private readonly fileInputRef = viewChild<ElementRef<HTMLInputElement>>('fileInput');

  // ── Computed ────────────────────────────────────────────────

  protected readonly formattedMaxSize = computed(() =>
    formatFileSize(this.maxFileSize())
  );

  protected readonly acceptLabel = computed(() => {
    const acc = this.accept();
    if (!acc || acc === '*' || acc === '*/*') return '';
    const tokens = acc.split(',').map((t) => t.trim());
    const labels = tokens.map((t) => {
      if (t.startsWith('.')) return t.toUpperCase();
      if (t === 'image/*') return 'Images';
      if (t === 'video/*') return 'Videos';
      if (t === 'audio/*') return 'Audio';
      if (t === 'application/pdf') return 'PDF';
      return t;
    });
    return labels.join(', ');
  });

  protected readonly dropzoneAriaLabel = computed(() => {
    const base = this.label();
    const fileCount = this.files().length;
    if (fileCount > 0) {
      return `${base}. ${fileCount} ${fileCount === 1 ? 'file' : 'files'} selected. Press Enter to add more.`;
    }
    return `${base}. Press Enter to browse files.`;
  });

  protected readonly dropzoneClasses = computed(() => {
    if (this.disabled()) {
      return 'border-[var(--border-default)] bg-[var(--fill-tertiary)] opacity-50 cursor-not-allowed';
    }
    if (this.dragActive()) {
      return 'border-system-blue bg-system-blue/5 shadow-md';
    }
    return 'border-[var(--border-default)] bg-[var(--form-field-glass)] hover:border-[var(--border-opaque)] hover:bg-[var(--fill-tertiary)] backdrop-blur-sm';
  });

  protected readonly dropzoneShadow = computed(() => {
    if (this.dragActive()) {
      return 'var(--form-field-shadow), var(--form-control-glow)';
    }
    return 'var(--form-field-shadow)';
  });

  protected readonly iconContainerClasses = computed(() => {
    if (this.dragActive()) {
      return 'bg-system-blue/10 scale-110';
    }
    return 'bg-[var(--fill-secondary)]';
  });

  // ── Lifecycle ───────────────────────────────────────────────

  ngOnDestroy(): void {
    this.subscriptions.forEach((sub) => sub.unsubscribe());
    this.subscriptions.clear();
    // Revoke preview URLs
    this.files().forEach((f) => {
      if (f.preview) URL.revokeObjectURL(f.preview);
    });
  }

  // ── Drag & Drop ─────────────────────────────────────────────

  protected onDragEnter(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    if (this.disabled()) return;
    this.dragCounter++;
    if (this.dragCounter === 1) {
      this.dragActive.set(true);
      this.liveAnnouncer.announce('File dragged over drop zone. Release to upload.', 'polite');
    }
  }

  protected onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
  }

  protected onDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    if (this.disabled()) return;
    this.dragCounter--;
    if (this.dragCounter <= 0) {
      this.dragCounter = 0;
      this.dragActive.set(false);
    }
  }

  protected onDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.dragCounter = 0;
    this.dragActive.set(false);
    if (this.disabled()) return;
    const droppedFiles = event.dataTransfer?.files;
    if (droppedFiles?.length) {
      this.liveAnnouncer.announce(
        `${droppedFiles.length} ${droppedFiles.length === 1 ? 'file' : 'files'} dropped. Processing…`,
        'polite'
      );
      this.addFiles(Array.from(droppedFiles));
    }
  }

  // ── File Input ──────────────────────────────────────────────

  protected openFileDialog(): void {
    if (this.disabled()) return;
    this.fileInputRef()?.nativeElement.click();
  }

  protected onSpaceKey(event: Event): void {
    event.preventDefault();
    this.openFileDialog();
  }

  protected onFileInputChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files?.length) {
      this.addFiles(Array.from(input.files));
    }
    // Reset so re-selecting same file triggers change
    input.value = '';
  }

  // ── Clipboard Paste ─────────────────────────────────────────

  protected onPaste(event: ClipboardEvent): void {
    if (this.disabled()) return;
    const items = event.clipboardData?.items;
    if (!items) return;

    const pastedFiles: File[] = [];
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item.kind === 'file') {
        const file = item.getAsFile();
        if (file) pastedFiles.push(file);
      }
    }

    if (pastedFiles.length > 0) {
      event.preventDefault();
      this.addFiles(pastedFiles);
    }
  }

  // ── File Processing ─────────────────────────────────────────

  private addFiles(newFiles: File[]): void {
    const currentFiles = this.files();
    const newErrors: FileError[] = [];
    const entriesToAdd: FileEntry[] = [];

    for (const file of newFiles) {
      // Validate max files
      if (currentFiles.length + entriesToAdd.length >= this.maxFiles()) {
        const error: FileError = {
          file,
          reason: 'max-files',
          message: `Maximum ${this.maxFiles()} files allowed`,
        };
        newErrors.push(error);
        this.fileError.emit(error);
        continue;
      }

      // Validate file type
      if (!matchesAccept(file, this.accept())) {
        const error: FileError = {
          file,
          reason: 'type',
          message: `File type not accepted`,
        };
        newErrors.push(error);
        this.fileError.emit(error);
        continue;
      }

      // Validate file size
      if (file.size > this.maxFileSize()) {
        const error: FileError = {
          file,
          reason: 'size',
          message: `Exceeds ${this.formattedMaxSize()} limit`,
        };
        newErrors.push(error);
        this.fileError.emit(error);
        continue;
      }

      const entry: FileEntry = {
        id: generateId(),
        file,
        preview: null,
        progress: 0,
        status: 'pending',
        error: null,
      };

      // Generate preview for images
      if (isImageType(file)) {
        entry.preview = URL.createObjectURL(file);
      }

      entriesToAdd.push(entry);
    }

    if (entriesToAdd.length > 0) {
      const updated = [...currentFiles, ...entriesToAdd];
      this.files.set(updated);
      this.filesChange.emit(updated);

      for (const entry of entriesToAdd) {
        this.fileAdded.emit(entry);
      }

      // Announce for screen readers
      this.statusAnnouncement.set(
        `${entriesToAdd.length} ${entriesToAdd.length === 1 ? 'file' : 'files'} added`
      );

      // Auto-upload if uploadFn provided
      const fn = this.uploadFn();
      if (fn) {
        for (const entry of entriesToAdd) {
          this.startUpload(entry, fn);
        }
      }
    }

    // Show errors briefly
    if (newErrors.length > 0) {
      this.errors.set(newErrors);
      this.statusAnnouncement.set(
        `${newErrors.length} ${newErrors.length === 1 ? 'file' : 'files'} rejected`
      );
      setTimeout(() => this.errors.set([]), 5000);
    }
  }

  // ── Upload ──────────────────────────────────────────────────

  private startUpload(
    entry: FileEntry,
    fn: (file: File) => Observable<UploadProgress>
  ): void {
    this.updateEntry(entry.id, { status: 'uploading', progress: 0 });

    const sub = fn(entry.file).subscribe({
      next: (progress) => {
        this.updateEntry(entry.id, {
          progress: progress.progress,
          status: progress.status,
          error: progress.error ?? null,
        });
      },
      error: (err) => {
        this.updateEntry(entry.id, {
          status: 'error',
          error: err?.message ?? 'Upload failed',
        });
        this.statusAnnouncement.set(`${entry.file.name} upload failed`);
      },
      complete: () => {
        const current = this.files().find((f) => f.id === entry.id);
        if (current && current.status !== 'error') {
          this.updateEntry(entry.id, { status: 'success', progress: 100 });
          this.statusAnnouncement.set(`${entry.file.name} uploaded successfully`);
        }
        this.subscriptions.delete(entry.id);
      },
    });

    this.subscriptions.set(entry.id, sub);
  }

  private updateEntry(id: string, patch: Partial<FileEntry>): void {
    this.files.update((entries) =>
      entries.map((e) => (e.id === id ? { ...e, ...patch } : e))
    );
    this.filesChange.emit(this.files());
  }

  // ── Actions ─────────────────────────────────────────────────

  protected onRemove(entry: FileEntry): void {
    // Cancel any in-progress upload
    const sub = this.subscriptions.get(entry.id);
    if (sub) {
      sub.unsubscribe();
      this.subscriptions.delete(entry.id);
    }

    // Revoke preview URL
    if (entry.preview) {
      URL.revokeObjectURL(entry.preview);
    }

    this.files.update((entries) => entries.filter((e) => e.id !== entry.id));
    this.filesChange.emit(this.files());
    this.fileRemoved.emit(entry);
    this.statusAnnouncement.set(`${entry.file.name} removed`);
  }

  protected onRetry(entry: FileEntry): void {
    const fn = this.uploadFn();
    if (!fn) return;
    this.updateEntry(entry.id, { status: 'pending', progress: 0, error: null });
    const updated = this.files().find((f) => f.id === entry.id);
    if (updated) {
      this.startUpload(updated, fn);
    }
  }
}
