import { decode, type ImageMetadata } from '$lib/image/decode';
import { makeProxy } from '$lib/image/proxy';
import { ORIGINAL, clampRect, pixelRect } from '$lib/image/crop';
import { exportCrop, downloadBlob } from '$lib/image/export';
import {
  PhotoCritique,
  ROLES,
  type CriticMode,
  type CropProposal,
  type CropRole,
  type LocalAnalysis,
  type Rect,
  type Region
} from '$lib/critique/schema';
import { diverse } from '$lib/critique/crop-diversity';
import { sendEvent, type ValidationEvent, type Event } from '$lib/telemetry/events';
import { sessionId } from '$lib/telemetry/session';

export type WorkspaceState =
  | 'EMPTY'
  | 'DECODING'
  | 'ANALYZING_LOCAL'
  | 'REQUESTING_CRITIQUE'
  | 'READY'
  | 'AI_ERROR'
  | 'EXPORTING';
export type Version = 'ORIGINAL' | 'A' | 'B' | 'C' | 'MANUAL';
export type Overlay =
  'Subject' | 'Visual anchor' | 'Distractions' | 'Highlights' | 'Shadows' | 'Thirds';
export class Workspace {
  state = $state<WorkspaceState>('EMPTY');
  bitmap = $state.raw<ImageBitmap | null>(null);
  metadata = $state<ImageMetadata | null>(null);
  file = $state.raw<File | null>(null);
  technical = $state<LocalAnalysis | null>(null);
  critique = $state<PhotoCritique | null>(null);
  mode = $state<CriticMode>('portfolio');
  critiqueMode = $state<CriticMode>('portfolio');
  selected = $state<Version>('ORIGINAL');
  userRects = $state<Record<string, Rect>>({});
  overlays = $state<Overlay[]>([]);
  activeRegion = $state<Region | null>(null);
  editing = $state(false);
  compare = $state<'off' | 'grid' | 'ab'>('off');
  error = $state('');
  notice = $state('');
  fallbackRoles = $state<CropRole[]>([]);
  preferenceSaved = $state(false);
  photoId = '';
  private session = '';
  private proxy = '';
  private request: AbortController | null = null;
  private worker: Worker | null = null;
  private cancelAnalysis: (() => void) | null = null;
  private revision = 0;
  get crop(): CropProposal | undefined {
    const i = ['A', 'B', 'C'].indexOf(this.selected);
    return this.critique?.crops[i];
  }
  get rect(): Rect {
    return this.rectFor(this.selected);
  }
  get busy() {
    return ['DECODING', 'ANALYZING_LOCAL', 'REQUESTING_CRITIQUE', 'EXPORTING'].includes(this.state);
  }
  rectFor(version: Version): Rect {
    if (version === 'ORIGINAL') return ORIGINAL;
    return (
      this.userRects[version] ??
      this.critique?.crops[['A', 'B', 'C'].indexOf(version)]?.rect ?? {
        x: 0.1,
        y: 0.1,
        width: 0.8,
        height: 0.8
      }
    );
  }
  event(event: ValidationEvent, properties: Event['properties'] = {}) {
    if (!this.photoId) return;
    this.session ||= sessionId();
    sendEvent(this.session, this.photoId, event, properties);
  }
  async load(file: File) {
    const revision = ++this.revision;
    this.request?.abort();
    this.cancelAnalysis?.();
    this.error = '';
    this.notice = '';
    this.state = 'DECODING';
    let decoded;
    try {
      decoded = await decode(file);
    } catch (e) {
      if (revision === this.revision) {
        this.error = (e as Error).message;
        this.state = this.bitmap ? (this.critique ? 'READY' : 'AI_ERROR') : 'EMPTY';
      }
      return;
    }
    if (revision !== this.revision) {
      decoded.bitmap.close();
      return;
    }
    if (this.photoId) this.event('another_photo_started');
    this.bitmap?.close();
    this.bitmap = decoded.bitmap;
    this.file = file;
    this.metadata = decoded.metadata;
    this.photoId = crypto.randomUUID();
    this.technical = null;
    this.critique = null;
    this.proxy = '';
    this.userRects = {};
    this.selected = 'ORIGINAL';
    this.overlays = [];
    this.activeRegion = null;
    this.editing = false;
    this.compare = 'off';
    this.fallbackRoles = [];
    this.preferenceSaved = false;
    this.event('photo_loaded', {
      width: decoded.metadata.width,
      height: decoded.metadata.height,
      bytes: file.size,
      mimeType: file.type
    });
    await this.analyzeLocal(revision, decoded.bitmap);
  }
  private async analyzeLocal(revision: number, bitmap: ImageBitmap) {
    this.state = 'ANALYZING_LOCAL';
    // Let the original paint before preparing the analysis copy.
    await new Promise<void>((resolve) =>
      requestAnimationFrame(() => requestAnimationFrame(() => resolve()))
    );
    try {
      if (revision !== this.revision) return;
      const proxy = await makeProxy(bitmap);
      if (revision !== this.revision) return;
      this.proxy = proxy.image;
      const worker = new Worker(new URL('../analysis/analysis.worker.ts', import.meta.url), {
        type: 'module'
      });
      this.worker = worker;
      const technical = await new Promise<LocalAnalysis>((resolve, reject) => {
        const cleanup = () => {
          clearTimeout(timer);
          worker.terminate();
          if (this.worker === worker) {
            this.worker = null;
            this.cancelAnalysis = null;
          }
        };
        const timer = setTimeout(() => {
          cleanup();
          reject(new Error('Local analysis timed out. Cropping remains available.'));
        }, 15_000);
        this.cancelAnalysis = () => {
          cleanup();
          reject(new Error('Analysis cancelled.'));
        };
        worker.onmessage = (event) => {
          cleanup();
          event.data.error ? reject(new Error(event.data.error)) : resolve(event.data.result);
        };
        worker.onerror = () => {
          cleanup();
          reject(new Error('Local analysis could not be completed. Cropping remains available.'));
        };
        worker.postMessage(
          { data: proxy.pixels.data, width: proxy.pixels.width, height: proxy.pixels.height },
          [proxy.pixels.data.buffer]
        );
      });
      if (revision === this.revision) {
        this.technical = technical;
        await this.requestCritique();
      }
    } catch (e) {
      if (revision === this.revision) {
        this.error = (e as Error).message;
        this.state = 'AI_ERROR';
      }
    }
  }
  async requestCritique() {
    if (!this.technical || !this.proxy) {
      if (this.bitmap) await this.analyzeLocal(this.revision, this.bitmap);
      return;
    }
    const revision = this.revision;
    this.request?.abort();
    const request = new AbortController();
    this.request = request;
    this.state = 'REQUESTING_CRITIQUE';
    this.error = '';
    const started = performance.now();
    const mode = this.mode;
    const timer = setTimeout(() => request.abort(), 50_000);
    try {
      const response = await fetch('/api/critique', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ image: this.proxy, technical: this.technical, mode }),
        signal: request.signal
      });
      const data = await response.json();
      if (revision !== this.revision || this.request !== request) return;
      if (!response.ok)
        throw new Error(data.error || 'Critique couldn’t be completed. Please retry.');
      const critique = PhotoCritique.parse(data.critique);
      critique.crops.sort((a, b) => ROLES.indexOf(a.role) - ROLES.indexOf(b.role));
      if (!diverse(critique.crops.map((c) => c.rect)))
        throw new Error('The critique returned crops that were too similar. Please retry.');
      this.critique = critique;
      this.critiqueMode = mode;
      this.fallbackRoles = data.meta?.fallbackRoles ?? [];
      this.userRects = this.userRects.MANUAL ? { MANUAL: this.userRects.MANUAL } : {};
      if (this.selected !== 'MANUAL') this.selected = 'ORIGINAL';
      this.activeRegion = null;
      this.preferenceSaved = false;
      this.state = 'READY';
      this.event('critique_completed', {
        mode,
        verdict: critique.verdict,
        crops: critique.crops.map(({ role, rect }) => ({ role, rect })),
        fallbackRoles: this.fallbackRoles,
        durationMs: Math.round(performance.now() - started)
      });
    } catch (e) {
      if (revision !== this.revision || this.request !== request) return;
      this.error = request.signal.aborted
        ? 'Critique timed out. Your photograph is still here. Try again.'
        : (e as Error).message;
      this.state = 'AI_ERROR';
      this.event('critique_failed', {
        category: request.signal.aborted ? 'network' : 'unavailable'
      });
    } finally {
      clearTimeout(timer);
    }
  }
  select(version: Version) {
    this.selected = version;
    this.activeRegion = null;
    this.event('crop_viewed', { version });
  }
  modify(rect: Rect, commit = false) {
    if (this.selected === 'ORIGINAL') this.selected = 'MANUAL';
    this.userRects[this.selected] = clampRect(rect);
    if (commit)
      this.event('crop_modified', {
        version: this.selected,
        recommendedRect: this.crop?.rect ?? null,
        userRect: this.rect
      });
  }
  resetCrop() {
    delete this.userRects[this.selected];
    this.event('crop_modified', {
      version: this.selected,
      recommendedRect: this.crop?.rect ?? null,
      userRect: this.rect
    });
  }
  toggleOverlay(overlay: Overlay) {
    if (this.overlays.includes(overlay)) this.overlays = this.overlays.filter((o) => o !== overlay);
    else {
      this.overlays = [...this.overlays, overlay];
      this.event('overlay_enabled', { overlay });
    }
  }
  showRegion(region: Region) {
    this.selected = 'ORIGINAL';
    this.editing = false;
    this.compare = 'off';
    this.activeRegion = region;
  }
  openCompare(mode: 'grid' | 'ab') {
    this.compare = this.compare === mode ? 'off' : mode;
    if (this.compare !== 'off') this.event('comparison_opened', { mode });
  }
  async export() {
    if (!this.bitmap || !this.file || this.state === 'EXPORTING') return;
    const previous = this.state,
      image = this.bitmap,
      rect = this.rect,
      version = this.selected,
      file = this.file;
    this.state = 'EXPORTING';
    this.notice = '';
    try {
      const blob = await exportCrop(image, rect);
      const role =
        this.crop?.role.toLowerCase() ?? (version === 'ORIGINAL' ? 'original' : 'manual');
      downloadBlob(blob, `${file.name.replace(/\.[^.]+$/, '')}-pcl-${role}.jpg`);
      const p = pixelRect(rect, image.width, image.height);
      this.event('crop_exported', {
        version,
        width: p.width,
        height: p.height,
        modified: !!this.userRects[version]
      });
      this.notice = `Exported ${p.width} × ${p.height} px. Overlays are excluded.`;
    } catch {
      this.error = 'Export failed. Please try a smaller crop or another browser.';
    } finally {
      this.state = previous;
    }
  }
  destroy() {
    this.revision++;
    this.request?.abort();
    this.cancelAnalysis?.();
    this.bitmap?.close();
  }
}
