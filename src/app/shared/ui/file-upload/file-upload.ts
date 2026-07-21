import {
  Component,
  input,
  output,
  signal,
  computed,
  ElementRef,
  viewChild,
  OnInit,
  OnDestroy,
  inject,
  DOCUMENT,
  AfterViewInit,
  effect,
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
  status: 'pending' | 'uploading' | 'success' | 'error' | 'paused';
  error: string | null;
  /** Image natural width (px), populated after preview generation */
  width?: number;
  /** Image natural height (px), populated after preview generation */
  height?: number;
  /** Video duration in seconds, populated after preview generation */
  duration?: number;
  /** Current chunk index (for chunked uploads) */
  currentChunk?: number;
  /** Total chunks (for chunked uploads) */
  totalChunks?: number;
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

// ── Image Cropper Component ──────────────────────────────────

@Component({
  selector: 'app-image-cropper',
  imports: [LucideDynamicIcon],
  host: { class: 'block' },
  template: `
    <div class="cropper-overlay">
      <div class="cropper-container">
        <!-- Header -->
        <div class="cropper-header">
          <span class="cropper-title">Crop Image</span>
          <div class="cropper-header-actions">
            <button type="button" class="cropper-rotate-btn" (click)="rotate(-90)" aria-label="Rotate left">
              <svg lucideIcon="rotate-ccw" [size]="16" />
            </button>
            <button type="button" class="cropper-rotate-btn" (click)="rotate(90)" aria-label="Rotate right">
              <svg lucideIcon="rotate-cw" [size]="16" />
            </button>
          </div>
        </div>

        <!-- Canvas area -->
        <div class="cropper-canvas-wrapper" #wrapperEl>
          <canvas #previewCanvas class="cropper-preview-canvas"></canvas>
          <!-- Crop selection overlay -->
          <div
            class="crop-selection"
            [style.left.px]="cropX()"
            [style.top.px]="cropY()"
            [style.width.px]="cropW()"
            [style.height.px]="cropH()"
            (mousedown)="onSelectionMousedown($event)"
          >
            <div class="crop-handle crop-handle--nw" (mousedown)="onHandleMousedown($event, 'nw')"></div>
            <div class="crop-handle crop-handle--ne" (mousedown)="onHandleMousedown($event, 'ne')"></div>
            <div class="crop-handle crop-handle--sw" (mousedown)="onHandleMousedown($event, 'sw')"></div>
            <div class="crop-handle crop-handle--se" (mousedown)="onHandleMousedown($event, 'se')"></div>
            <!-- Grid lines -->
            <div class="crop-grid"></div>
          </div>
        </div>

        <!-- Actions -->
        <div class="cropper-actions">
          <button type="button" class="cropper-cancel-btn" (click)="cancel.emit()">
            Cancel
          </button>
          <button type="button" class="cropper-apply-btn" (click)="applyCrop()">
            <svg lucideIcon="crop" [size]="14" />
            Apply Crop
          </button>
        </div>
      </div>
    </div>
  `,
  styles: `
    .cropper-overlay {
      position: fixed;
      inset: 0;
      z-index: 100;
      display: flex;
      align-items: center;
      justify-content: center;
      background: oklch(0% 0 0 / 0.7);
      backdrop-filter: blur(8px);
      animation: cropper-fade-in 0.2s var(--ease-default);
    }
    @keyframes cropper-fade-in {
      from { opacity: 0; }
      to   { opacity: 1; }
    }
    .cropper-container {
      display: flex;
      flex-direction: column;
      gap: 0;
      width: min(560px, 95vw);
      border-radius: var(--radius-2xl);
      background: var(--surface-elevated);
      box-shadow: 0 24px 64px -12px oklch(0% 0 0 / 0.5), 0 0 0 1px var(--glass-border);
      overflow: hidden;
      animation: cropper-slide-in 0.25s var(--ease-spring);
    }
    @keyframes cropper-slide-in {
      from { opacity: 0; transform: scale(0.95) translateY(-8px); }
      to   { opacity: 1; transform: scale(1) translateY(0); }
    }
    .cropper-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 16px 20px;
      border-bottom: 1px solid var(--separator);
    }
    .cropper-title {
      font: var(--type-headline);
      color: var(--text-primary);
    }
    .cropper-header-actions {
      display: flex;
      gap: 6px;
    }
    .cropper-rotate-btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 32px;
      height: 32px;
      border: none;
      border-radius: var(--radius-sm);
      background: var(--fill-secondary);
      color: var(--text-secondary);
      cursor: pointer;
      transition: all var(--duration-fast) var(--ease-default);
    }
    .cropper-rotate-btn:hover { background: var(--fill-primary); color: var(--text-primary); }
    .cropper-rotate-btn:active { transform: scale(0.9); }
    .cropper-canvas-wrapper {
      position: relative;
      background: oklch(10% 0 0);
      min-height: 300px;
      max-height: 60vh;
      overflow: hidden;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .cropper-preview-canvas {
      display: block;
      max-width: 100%;
      max-height: 60vh;
      object-fit: contain;
    }
    .crop-selection {
      position: absolute;
      border: 2px solid white;
      box-shadow: 0 0 0 9999px oklch(0% 0 0 / 0.55);
      cursor: move;
      box-sizing: border-box;
    }
    .crop-grid {
      position: absolute;
      inset: 0;
      background-image:
        linear-gradient(to right, oklch(100% 0 0 / 0.2) 1px, transparent 1px),
        linear-gradient(to bottom, oklch(100% 0 0 / 0.2) 1px, transparent 1px);
      background-size: 33.33% 33.33%;
      pointer-events: none;
    }
    .crop-handle {
      position: absolute;
      width: 12px;
      height: 12px;
      background: white;
      border: 1.5px solid oklch(0% 0 0 / 0.3);
      border-radius: 2px;
      box-shadow: 0 1px 4px oklch(0% 0 0 / 0.3);
    }
    .crop-handle--nw { top: -6px; left: -6px; cursor: nw-resize; }
    .crop-handle--ne { top: -6px; right: -6px; cursor: ne-resize; }
    .crop-handle--sw { bottom: -6px; left: -6px; cursor: sw-resize; }
    .crop-handle--se { bottom: -6px; right: -6px; cursor: se-resize; }
    .cropper-actions {
      display: flex;
      align-items: center;
      justify-content: flex-end;
      gap: 8px;
      padding: 14px 20px;
      border-top: 1px solid var(--separator);
    }
    .cropper-cancel-btn {
      padding: 8px 18px;
      font: var(--type-subheadline);
      font-weight: 500;
      color: var(--text-secondary);
      border: 1px solid var(--border-default);
      border-radius: var(--radius-md);
      background: transparent;
      cursor: pointer;
      transition: all var(--duration-fast) var(--ease-default);
    }
    .cropper-cancel-btn:hover { border-color: var(--border-opaque); background: var(--fill-primary); }
    .cropper-apply-btn {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 8px 18px;
      font: var(--type-subheadline);
      font-weight: 600;
      color: white;
      border: none;
      border-radius: var(--radius-md);
      background: var(--color-primary);
      cursor: pointer;
      transition: all var(--duration-fast) var(--ease-spring);
    }
    .cropper-apply-btn:hover { opacity: 0.88; }
    .cropper-apply-btn:active { transform: scale(0.96); }
  `,
})
export class ImageCropperComponent implements AfterViewInit {
  readonly src = input.required<string>();
  readonly fileName = input.required<string>();
  readonly cancel = output<void>();
  readonly cropped = output<{ blob: Blob; previewUrl: string }>();

  private readonly wrapperRef = viewChild.required<ElementRef<HTMLDivElement>>('wrapperEl');
  private readonly canvasRef = viewChild.required<ElementRef<HTMLCanvasElement>>('previewCanvas');
  private readonly document = inject(DOCUMENT);

  private img: HTMLImageElement | null = null;
  private rotation = 0;
  private displayScale = 1;
  private displayOffsetX = 0;
  private displayOffsetY = 0;

  // Crop rect in display (canvas element) coordinates
  readonly cropX = signal(0);
  readonly cropY = signal(0);
  readonly cropW = signal(200);
  readonly cropH = signal(200);

  // Drag/resize state
  private dragging = false;
  private resizing: string | null = null;
  private dragStartX = 0;
  private dragStartY = 0;
  private dragStartCrop = { x: 0, y: 0, w: 0, h: 0 };

  private readonly mouseMoveHandler = (e: MouseEvent) => this.onDocMouseMove(e);
  private readonly mouseUpHandler = () => this.onDocMouseUp();

  ngAfterViewInit(): void {
    this.img = new Image();
    this.img.crossOrigin = 'anonymous';
    this.img.onload = () => this.drawCanvas();
    this.img.src = this.src();
    this.document.addEventListener('mousemove', this.mouseMoveHandler);
    this.document.addEventListener('mouseup', this.mouseUpHandler);
  }

  ngOnDestroy(): void {
    this.document.removeEventListener('mousemove', this.mouseMoveHandler);
    this.document.removeEventListener('mouseup', this.mouseUpHandler);
  }

  rotate(deg: number): void {
    this.rotation = (this.rotation + deg + 360) % 360;
    this.drawCanvas();
  }

  private drawCanvas(): void {
    const img = this.img;
    if (!img) return;
    const canvas = this.canvasRef().nativeElement;
    const wrapper = this.wrapperRef().nativeElement;
    const wW = wrapper.clientWidth || 560;
    const wH = Math.min(wrapper.clientHeight || 400, window.innerHeight * 0.55);

    // Rotated dimensions
    const rad = (this.rotation * Math.PI) / 180;
    const rotW = Math.abs(img.naturalWidth * Math.cos(rad)) + Math.abs(img.naturalHeight * Math.sin(rad));
    const rotH = Math.abs(img.naturalWidth * Math.sin(rad)) + Math.abs(img.naturalHeight * Math.cos(rad));

    this.displayScale = Math.min(wW / rotW, wH / rotH, 1);
    const dispW = rotW * this.displayScale;
    const dispH = rotH * this.displayScale;

    canvas.width = dispW;
    canvas.height = dispH;
    canvas.style.width = dispW + 'px';
    canvas.style.height = dispH + 'px';

    const ctx = canvas.getContext('2d')!;
    ctx.save();
    ctx.translate(dispW / 2, dispH / 2);
    ctx.rotate(rad);
    ctx.drawImage(
      img,
      (-img.naturalWidth * this.displayScale) / 2,
      (-img.naturalHeight * this.displayScale) / 2,
      img.naturalWidth * this.displayScale,
      img.naturalHeight * this.displayScale
    );
    ctx.restore();

    // Init crop rect to 80% of canvas
    const initW = dispW * 0.8;
    const initH = dispH * 0.8;
    this.cropX.set((dispW - initW) / 2);
    this.cropY.set((dispH - initH) / 2);
    this.cropW.set(initW);
    this.cropH.set(initH);
  }

  protected onSelectionMousedown(event: MouseEvent): void {
    if ((event.target as HTMLElement).classList.contains('crop-handle')) return;
    event.preventDefault();
    this.dragging = true;
    this.dragStartX = event.clientX;
    this.dragStartY = event.clientY;
    this.dragStartCrop = { x: this.cropX(), y: this.cropY(), w: this.cropW(), h: this.cropH() };
  }

  protected onHandleMousedown(event: MouseEvent, handle: string): void {
    event.preventDefault();
    event.stopPropagation();
    this.resizing = handle;
    this.dragStartX = event.clientX;
    this.dragStartY = event.clientY;
    this.dragStartCrop = { x: this.cropX(), y: this.cropY(), w: this.cropW(), h: this.cropH() };
  }

  private onDocMouseMove(event: MouseEvent): void {
    if (!this.dragging && !this.resizing) return;
    const dx = event.clientX - this.dragStartX;
    const dy = event.clientY - this.dragStartY;
    const canvas = this.canvasRef().nativeElement;
    const minSize = 30;

    if (this.dragging) {
      const newX = Math.max(0, Math.min(canvas.width - this.cropW(), this.dragStartCrop.x + dx));
      const newY = Math.max(0, Math.min(canvas.height - this.cropH(), this.dragStartCrop.y + dy));
      this.cropX.set(newX);
      this.cropY.set(newY);
    } else if (this.resizing) {
      const { x, y, w, h } = this.dragStartCrop;
      let nx = x, ny = y, nw = w, nh = h;
      if (this.resizing.includes('e')) { nw = Math.max(minSize, Math.min(canvas.width - x, w + dx)); }
      if (this.resizing.includes('s')) { nh = Math.max(minSize, Math.min(canvas.height - y, h + dy)); }
      if (this.resizing.includes('w')) { const delta = Math.max(-x, Math.min(w - minSize, dx)); nx = x + delta; nw = w - delta; }
      if (this.resizing.includes('n')) { const delta = Math.max(-y, Math.min(h - minSize, dy)); ny = y + delta; nh = h - delta; }
      this.cropX.set(nx); this.cropY.set(ny); this.cropW.set(nw); this.cropH.set(nh);
    }
  }

  private onDocMouseUp(): void {
    this.dragging = false;
    this.resizing = null;
  }

  protected applyCrop(): void {
    const img = this.img;
    if (!img) return;
    const outputCanvas = this.document.createElement('canvas');
    const scale = this.displayScale;
    const cw = this.cropW() / scale;
    const ch = this.cropH() / scale;
    outputCanvas.width = Math.round(cw);
    outputCanvas.height = Math.round(ch);
    const ctx = outputCanvas.getContext('2d')!;
    ctx.save();
    ctx.translate(cw / 2, ch / 2);
    const rad = (this.rotation * Math.PI) / 180;
    ctx.rotate(rad);
    // Translate crop offset back to image space
    const imgCX = this.cropX() / scale + cw / 2 / scale - img.naturalWidth / 2;
    const imgCY = this.cropY() / scale + ch / 2 / scale - img.naturalHeight / 2;
    ctx.drawImage(img, -imgCX * scale - cw / 2, -imgCY * scale - ch / 2, img.naturalWidth * scale, img.naturalHeight * scale);
    ctx.restore();
    outputCanvas.toBlob((blob) => {
      if (!blob) return;
      const previewUrl = URL.createObjectURL(blob);
      this.cropped.emit({ blob, previewUrl });
    }, 'image/jpeg', 0.92);
  }
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
            <span class="text-xs text-[var(--color-error)]">{{ entry().error }}</span>
          }
          @if (entry().status === 'success') {
            <span class="text-xs text-[var(--color-success)]">Uploaded</span>
          }
          @if (entry().width && entry().height) {
            <span class="text-xs text-[var(--text-quaternary)]">
              {{ entry().width }}&times;{{ entry().height }}px
            </span>
          }
          @if (entry().duration) {
            <span class="text-xs text-[var(--text-quaternary)]">
              {{ formatDuration(entry().duration!) }}
            </span>
          }
          @if (entry().totalChunks && entry().totalChunks! > 1 && entry().status === 'uploading') {
            <span class="text-xs text-[var(--text-quaternary)] tabular-nums">
              Chunk {{ (entry().currentChunk ?? 0) + 1 }}/{{ entry().totalChunks }}
            </span>
          }
        </div>
        @if (entry().status === 'uploading' || entry().status === 'paused') {
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
            class="flex h-6 w-6 items-center justify-center rounded-full bg-[var(--color-success)]/15 text-[var(--color-success)]"
            style="animation: file-status-in 0.3s var(--ease-spring) both"
          >
            <svg lucideIcon="check" [size]="14" />
          </div>
        }

        @if (entry().status === 'error') {
          <button
            type="button"
            class="flex h-7 w-7 items-center justify-center rounded-lg text-[var(--color-warning)] hover:bg-[var(--color-warning)]/10 active:scale-90 transition-all duration-fast"
            aria-label="Retry upload"
            (click)="retry.emit(entry())"
          >
            <svg lucideIcon="refresh-cw" [size]="14" />
          </button>
        }

        @if (entry().status === 'uploading') {
          <!-- Pause button (chunked uploads) -->
          @if (showPause()) {
            <button
              type="button"
              class="flex h-7 w-7 items-center justify-center rounded-lg text-[var(--text-tertiary)] hover:text-[var(--color-primary)] hover:bg-[var(--interactive-tint)] active:scale-90 transition-all duration-fast"
              aria-label="Pause upload"
              (click)="pause.emit(entry())"
            >
              <svg lucideIcon="pause" [size]="14" />
            </button>
          }
          <span class="text-xs font-medium tabular-nums text-[var(--color-primary)]">
            {{ entry().progress }}%
          </span>
        }

        @if (entry().status === 'paused') {
          <button
            type="button"
            class="flex h-7 w-7 items-center justify-center rounded-lg text-[var(--color-primary)] bg-[var(--interactive-tint)] hover:bg-[var(--interactive-tint-hover)] active:scale-90 transition-all duration-fast"
            aria-label="Resume upload"
            (click)="resume.emit(entry())"
          >
            <svg lucideIcon="play" [size]="13" />
          </button>
          <span class="text-xs font-medium tabular-nums text-[var(--text-tertiary)]">
            {{ entry().progress }}%
          </span>
        }

        <!-- Crop button: visible on hover for image entries when enabled -->
        @if (enableCrop() && entry().preview && entry().file.type.startsWith('image/') && entry().status !== 'uploading' && entry().status !== 'success') {
          <button
            type="button"
            class="flex h-7 w-7 items-center justify-center rounded-lg text-[var(--text-quaternary)] hover:text-[var(--color-primary)] hover:bg-[var(--interactive-tint)] active:scale-90 transition-all duration-fast opacity-0 group-hover:opacity-100 focus-visible:opacity-100"
            aria-label="Crop image"
            (click)="crop.emit(entry())"
          >
            <svg lucideIcon="crop" [size]="14" />
          </button>
        }

        <button
          type="button"
          class="flex h-7 w-7 items-center justify-center rounded-lg text-[var(--text-quaternary)] hover:text-[var(--color-error)] hover:bg-[var(--color-error)]/10 active:scale-90 transition-all duration-fast"
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
  readonly pause = output<FileEntry>();
  readonly resume = output<FileEntry>();
  readonly crop = output<FileEntry>();
  /** Whether to show the crop button on image entries */
  readonly enableCrop = input(false);
  /** Whether to show the pause button (for chunked uploads) */
  readonly showPause = input(false);

  protected readonly formattedSize = computed(() =>
    formatFileSize(this.entry().file.size)
  );

  protected readonly fileIcon = computed(() =>
    getFileIcon(this.entry().file)
  );

  protected formatDuration(seconds: number): string {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  }

  protected readonly itemClasses = computed(() => {
    const status = this.entry().status;
    switch (status) {
      case 'error':
        return 'border-[var(--color-error)]/20 bg-[var(--color-error)]/5';
      case 'paused':
        return 'border-[var(--color-warning)]/20 bg-[var(--color-warning)]/5';
      case 'success':
        return 'border-[var(--color-success)]/20 bg-[var(--surface-elevated)]';
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
    if (status === 'error') return 'bg-[var(--color-error)]/10';
    if (status === 'success') return 'bg-[var(--color-success)]/10';
    return 'bg-[var(--fill-secondary)]';
  });

  protected readonly iconColorClass = computed(() => {
    const status = this.entry().status;
    if (status === 'error') return 'text-[var(--color-error)]';
    if (status === 'success') return 'text-[var(--color-success)]';
    return 'text-[var(--text-tertiary)]';
  });
}

// ── FileUploadComponent (Main Dropzone) ─────────────────────

@Component({
  selector: 'app-file-upload',
  imports: [LucideDynamicIcon, FileItemComponent, ImageCropperComponent],
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

    @if (fullScreenDrop() && windowDragActive()) {
      <div class="fixed inset-0 z-50 flex items-center justify-center bg-[var(--surface-primary)]/85 backdrop-blur-md pointer-events-none" aria-live="assertive" role="status" aria-label="Drop files to upload">
        <div class="relative flex flex-col items-center justify-center gap-5 rounded-3xl border-2 border-dashed border-[var(--color-primary)] bg-[var(--interactive-tint)] px-24 py-16 text-[var(--color-primary)]"
          style="animation: overlay-pulse 1.5s ease-in-out infinite alternate; box-shadow: 0 0 0 8px var(--color-primary)/8, 0 0 60px -10px var(--color-primary)/20"
        >
          <svg lucideIcon="upload-cloud" [size]="72" style="animation: upload-bounce 1s ease-in-out infinite alternate" />
          <p class="text-2xl font-bold tracking-tight">Drop files anywhere to upload</p>
          <p class="text-sm font-medium opacity-70">Release to add your files</p>
        </div>
      </div>
    }

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
          <svg lucideIcon="upload" [size]="16" class="text-[var(--color-primary)]" />
          Choose {{ multiple() ? 'Files' : 'File' }}
        </button>

        @if (files().length > 0) {
          <span class="inline-flex items-center gap-1.5 text-sm text-[var(--text-secondary)]">
            <span
              class="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-[var(--color-primary)] px-1.5 text-2xs font-semibold text-white"
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
              [enableCrop]="enableImageCrop()"
              [showPause]="!!chunkUploadFn()"
              (retry)="onRetry($event)"
              (remove)="onRemove($event)"
              (pause)="onPauseEntry($event)"
              (resume)="onResumeEntry($event)"
              (crop)="onCropRequest($event)"
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
              [class]="dragActive() ? 'text-[var(--color-primary)]' : 'text-[var(--text-tertiary)]'"
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
                <span class="font-medium text-[var(--color-primary)]">browse</span>
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
              class="flex items-center gap-2 rounded-lg bg-[var(--color-error)]/8 px-3 py-2 text-xs text-[var(--color-error)]"
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
              [enableCrop]="enableImageCrop()"
              [showPause]="!!chunkUploadFn()"
              (retry)="onRetry($event)"
              (remove)="onRemove($event)"
              (pause)="onPauseEntry($event)"
              (resume)="onResumeEntry($event)"
              (crop)="onCropRequest($event)"
            />
          }
        </div>
      }
    }

    <!-- Image Cropper (modal overlay) -->
    @if (cropEntry()) {
      <app-image-cropper
        [src]="cropEntry()!.preview!"
        [fileName]="cropEntry()!.file.name"
        (cancel)="cropEntry.set(null)"
        (cropped)="onCropApplied($event)"
      />
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
export class FileUploadComponent implements OnInit, OnDestroy {
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
  /** When true, shows a full-screen overlay for drag-and-drop. */
  readonly fullScreenDrop = input(false);
  /** When true, a Crop button is shown on image file items. Requires preview to be enabled. */
  readonly enableImageCrop = input(false);
  /**
   * Chunk size in bytes. When set, the component will slice files and upload
   * each chunk using chunkUploadFn instead of uploadFn.
   */
  readonly chunkSize = input<number | null>(null);
  /**
   * Function to upload a single chunk. Called for each chunk in order.
   * Return an Observable that emits progress 0–100 for the chunk.
   * Required when chunkSize is set.
   */
  readonly chunkUploadFn = input<
    ((chunk: Blob, index: number, total: number, fileId: string) => Observable<number>) | null
  >(null);

  // ── Outputs ─────────────────────────────────────────────────
  readonly filesChange = output<FileEntry[]>();
  readonly fileAdded = output<FileEntry>();
  readonly fileRemoved = output<FileEntry>();
  readonly fileError = output<FileError>();
  readonly imageCropped = output<{ originalEntry: FileEntry; croppedEntry: FileEntry }>();

  // ── Internal state ──────────────────────────────────────────
  protected readonly files = signal<FileEntry[]>([]);
  protected readonly errors = signal<FileError[]>([]);
  protected readonly dragActive = signal(false);
  protected readonly windowDragActive = signal(false);
  protected readonly statusAnnouncement = signal('');
  /** Entry being cropped — drives the ImageCropperComponent overlay */
  protected readonly cropEntry = signal<FileEntry | null>(null);
  /** IDs of paused entries (chunked upload) */
  private readonly pausedIds = signal<Set<string>>(new Set());
  private dragCounter = 0;
  private windowDragCounter = 0;
  private readonly subscriptions = new Map<string, Subscription>();
  /** Chunked-upload: stores per-entry chunk subscriptions (fileId → active Subscription) */
  private readonly chunkSubscriptions = new Map<string, Subscription>();
  private readonly liveAnnouncer = inject(LiveAnnouncer);
  private readonly document = inject(DOCUMENT);

  private readonly fileInputRef = viewChild<ElementRef<HTMLInputElement>>('fileInput');

  // Document-level drag handlers for full-screen overlay
  private readonly docDragEnterHandler = (e: DragEvent) => this.onDocDragEnter(e);
  private readonly docDragLeaveHandler = (e: DragEvent) => this.onDocDragLeave(e);
  private readonly docDragOverHandler = (e: DragEvent) => { e.preventDefault(); };
  private readonly docDropHandler = (e: DragEvent) => this.onDocDrop(e);

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
      return 'border-[var(--color-primary)] bg-[var(--color-primary)]/5 shadow-md';
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
      return 'bg-[var(--color-primary)]/10 scale-110';
    }
    return 'bg-[var(--fill-secondary)]';
  });

  // ── Lifecycle ───────────────────────────────────────────────

  ngOnInit(): void {
    if (this.fullScreenDrop()) {
      this.document.addEventListener('dragenter', this.docDragEnterHandler);
      this.document.addEventListener('dragleave', this.docDragLeaveHandler);
      this.document.addEventListener('dragover', this.docDragOverHandler);
      this.document.addEventListener('drop', this.docDropHandler);
    }
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((sub) => sub.unsubscribe());
    this.subscriptions.clear();
    // Revoke preview URLs
    this.files().forEach((f) => {
      if (f.preview) URL.revokeObjectURL(f.preview);
    });
    // Remove document-level drag listeners
    this.document.removeEventListener('dragenter', this.docDragEnterHandler);
    this.document.removeEventListener('dragleave', this.docDragLeaveHandler);
    this.document.removeEventListener('dragover', this.docDragOverHandler);
    this.document.removeEventListener('drop', this.docDropHandler);
  }

  // ── Drag & Drop ─────────────────────────────────────────────

  /** Document-level drag enter for full-screen overlay */
  private onDocDragEnter(event: DragEvent): void {
    if (!event.dataTransfer?.types.includes('Files')) return;
    this.windowDragCounter++;
    if (this.windowDragCounter === 1) {
      this.windowDragActive.set(true);
    }
  }

  /** Document-level drag leave for full-screen overlay */
  private onDocDragLeave(event: DragEvent): void {
    this.windowDragCounter--;
    if (this.windowDragCounter <= 0) {
      this.windowDragCounter = 0;
      this.windowDragActive.set(false);
    }
  }

  /** Document-level drop — dismiss overlay and pass files to local handler */
  private onDocDrop(event: DragEvent): void {
    event.preventDefault();
    this.windowDragCounter = 0;
    this.windowDragActive.set(false);
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

      // Generate preview for images + extract dimensions
      if (isImageType(file)) {
        entry.preview = URL.createObjectURL(file);
        // Extract image dimensions asynchronously
        const img = new Image();
        img.onload = () => {
          this.updateEntry(entry.id, { width: img.naturalWidth, height: img.naturalHeight });
        };
        img.src = entry.preview;
      } else if (file.type.startsWith('video/')) {
        entry.preview = URL.createObjectURL(file);
        // Extract video duration asynchronously
        const video = document.createElement('video');
        video.preload = 'metadata';
        video.onloadedmetadata = () => {
          this.updateEntry(entry.id, { duration: video.duration });
          URL.revokeObjectURL(video.src);
        };
        video.src = entry.preview;
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

      // Auto-upload if uploadFn or chunkUploadFn provided
      const chunkFn = this.chunkUploadFn();
      const uploadSize = this.chunkSize();
      if (chunkFn && uploadSize) {
        for (const entry of entriesToAdd) {
          this.startChunkedUpload(entry, chunkFn);
        }
      } else {
        const fn = this.uploadFn();
        if (fn) {
          for (const entry of entriesToAdd) {
            this.startUpload(entry, fn);
          }
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
    // Cancel chunked upload if any
    const chunkSub = this.chunkSubscriptions.get(entry.id);
    if (chunkSub) {
      chunkSub.unsubscribe();
      this.chunkSubscriptions.delete(entry.id);
    }
    // Remove from paused set
    this.pausedIds.update((ids) => { const next = new Set(ids); next.delete(entry.id); return next; });

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
    const chunkFn = this.chunkUploadFn();
    if (chunkFn && this.chunkSize()) {
      this.updateEntry(entry.id, { status: 'pending', progress: 0, error: null, currentChunk: 0 });
      const updated = this.files().find((f) => f.id === entry.id);
      if (updated) this.startChunkedUpload(updated, chunkFn);
      return;
    }
    const fn = this.uploadFn();
    if (!fn) return;
    this.updateEntry(entry.id, { status: 'pending', progress: 0, error: null });
    const updated = this.files().find((f) => f.id === entry.id);
    if (updated) {
      this.startUpload(updated, fn);
    }
  }

  // ── Pause / Resume (Chunked) ────────────────────────────────

  protected onPauseEntry(entry: FileEntry): void {
    this.pausedIds.update((ids) => { const next = new Set(ids); next.add(entry.id); return next; });
    this.updateEntry(entry.id, { status: 'paused' });
    this.statusAnnouncement.set(`${entry.file.name} upload paused`);
  }

  protected onResumeEntry(entry: FileEntry): void {
    this.pausedIds.update((ids) => { const next = new Set(ids); next.delete(entry.id); return next; });
    const fn = this.chunkUploadFn();
    if (!fn) return;
    const updated = this.files().find((f) => f.id === entry.id);
    if (updated) {
      this.updateEntry(entry.id, { status: 'uploading' });
      this.startChunkedUpload(updated, fn);
    }
    this.statusAnnouncement.set(`${entry.file.name} upload resumed`);
  }

  // ── Image Crop ─────────────────────────────────────────────

  protected onCropRequest(entry: FileEntry): void {
    this.cropEntry.set(entry);
  }

  protected onCropApplied(result: { blob: Blob; previewUrl: string }): void {
    const original = this.cropEntry();
    if (!original) return;
    this.cropEntry.set(null);

    // Revoke old preview URL
    if (original.preview) URL.revokeObjectURL(original.preview);

    const croppedFile = new File([result.blob], original.file.name, { type: result.blob.type });
    const croppedEntry: FileEntry = {
      ...original,
      file: croppedFile,
      preview: result.previewUrl,
      status: 'pending',
      progress: 0,
      error: null,
    };

    this.files.update((entries) =>
      entries.map((e) => (e.id === original.id ? croppedEntry : e))
    );
    this.filesChange.emit(this.files());
    this.imageCropped.emit({ originalEntry: original, croppedEntry });
    this.statusAnnouncement.set(`${croppedFile.name} cropped successfully`);
  }

  // ── Chunked Upload ───────────────────────────────────────────

  private startChunkedUpload(
    entry: FileEntry,
    fn: (chunk: Blob, index: number, total: number, fileId: string) => Observable<number>
  ): void {
    const size = this.chunkSize()!;
    const file = entry.file;
    const total = Math.ceil(file.size / size);
    const startChunk = entry.currentChunk ?? 0;

    this.updateEntry(entry.id, {
      status: 'uploading',
      totalChunks: total,
      currentChunk: startChunk,
      progress: Math.round((startChunk / total) * 100),
    });

    const uploadChunk = (idx: number): void => {
      // Check if paused
      if (this.pausedIds().has(entry.id)) return;

      if (idx >= total) {
        this.updateEntry(entry.id, { status: 'success', progress: 100 });
        this.statusAnnouncement.set(`${file.name} uploaded successfully`);
        this.chunkSubscriptions.delete(entry.id);
        return;
      }

      const start = idx * size;
      const chunk = file.slice(start, Math.min(start + size, file.size));

      const sub = fn(chunk, idx, total, entry.id).subscribe({
        next: (chunkProgress) => {
          const overall = Math.round(((idx + chunkProgress / 100) / total) * 100);
          this.updateEntry(entry.id, { progress: overall, currentChunk: idx });
        },
        error: (err) => {
          this.updateEntry(entry.id, {
            status: 'error',
            error: err?.message ?? 'Chunk upload failed',
          });
          this.statusAnnouncement.set(`${file.name} upload failed at chunk ${idx + 1}`);
          this.chunkSubscriptions.delete(entry.id);
        },
        complete: () => {
          this.updateEntry(entry.id, { currentChunk: idx + 1 });
          uploadChunk(idx + 1);
        },
      });

      this.chunkSubscriptions.set(entry.id, sub);
    };

    uploadChunk(startChunk);
  }
}
