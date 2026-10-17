<script lang="ts">
  import { RotateCcw, Lock, Unlock } from '@lucide/svelte';
  import type { Workspace } from '$lib/stores/workspace.svelte';
  import { fitAspect, clampRect } from '$lib/image/crop';
  let {
    workspace: w,
    aspect = $bindable<number | null>(null)
  }: { workspace: Workspace; aspect?: number | null } = $props();
  let preset = $state('Free');
  let error = $state('');
  function choose(value: string) {
    preset = value;
    error = '';
    if (value === 'Free') {
      aspect = null;
      return;
    }
    const ratio =
      value === 'Original'
        ? w.metadata!.aspectRatio
        : value
            .split(':')
            .map(Number)
            .reduce((a, b) => a / b);
    try {
      w.modify(fitAspect(w.rect, ratio, w.metadata!.aspectRatio), true);
      aspect = ratio;
    } catch (e) {
      error = (e as Error).message;
      aspect = null;
      preset = 'Free';
    }
  }
  function number(key: 'x' | 'y' | 'width' | 'height', value: number) {
    if (!Number.isFinite(value)) return;
    let next = { ...w.rect, [key]: value / 100 };
    if (aspect && (key === 'width' || key === 'height')) {
      const ratio = aspect / w.metadata!.aspectRatio;
      if (key === 'width') next.height = next.width / ratio;
      else next.width = next.height * ratio;
      if (next.width < 0.2 || next.height < 0.2 || next.width > 1 || next.height > 1) {
        error = 'Size must fit the photograph and keep both dimensions at least 20%.';
        return;
      }
    }
    error = '';
    w.modify(clampRect(next), true);
  }
</script>

<div class="crop-editor">
  <div class="editor-top">
    <span class="eyebrow">Refine the frame</span><button
      class="text-button"
      onclick={() => {
        w.resetCrop();
        aspect = null;
        preset = 'Free';
      }}><RotateCcw size={14} /> Reset recommendation</button
    >
  </div>
  <div class="aspect-presets" role="group" aria-label="Crop aspect ratio">
    {#each ['Free', 'Original', '4:5', '1:1', '3:2', '16:9'] as p}<button
        class:active={preset === p}
        onclick={() => choose(p)}>{p}</button
      >{/each}
    <button
      class:active={aspect !== null}
      class="aspect-lock"
      aria-label={aspect ? 'Unlock aspect ratio' : 'Lock current aspect ratio'}
      aria-pressed={aspect !== null}
      onclick={() => {
        aspect = aspect ? null : (w.rect.width * w.metadata!.aspectRatio) / w.rect.height;
        preset = 'Free';
      }}
      >{#if aspect}<Lock size={15} />{:else}<Unlock size={15} />{/if}</button
    >
  </div>
  <div class="numeric-crop">
    {#each [{ key: 'x', label: 'Left' }, { key: 'y', label: 'Top' }, { key: 'width', label: 'Width' }, { key: 'height', label: 'Height' }] as field}
      <label
        >{field.label} %<input
          type="number"
          min={field.key === 'x' || field.key === 'y' ? 0 : 20}
          max="100"
          step="0.1"
          value={Number((w.rect[field.key as keyof typeof w.rect] * 100).toFixed(1))}
          onchange={(e) =>
            number(field.key as 'x' | 'y' | 'width' | 'height', e.currentTarget.valueAsNumber)}
        /></label
      >
    {/each}
  </div>
  {#if error}<p class="error-text" role="alert">{error}</p>{/if}
  <p class="muted fine">Drag the frame or use the fields above. Recommendations stay preserved.</p>
</div>
