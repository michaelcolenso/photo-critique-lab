<script lang="ts">
  import { drawCrop, ORIGINAL } from '$lib/image/crop';
  import type { Rect } from '$lib/critique/schema';
  import type { Snippet } from 'svelte';
  let {
    image,
    rect = ORIGINAL,
    label = 'Photograph',
    children,
    small = false
  }: {
    image: ImageBitmap;
    rect?: Rect;
    label?: string;
    children?: Snippet;
    small?: boolean;
  } = $props();
  let canvas: HTMLCanvasElement;
  $effect(() => {
    if (canvas && image) drawCrop(canvas, image, rect, small ? 650 : 1800);
  });
</script>

<div class="photo-stage" class:small>
  <div
    class="photo-surface"
    style:aspect-ratio={`${rect.width * image.width} / ${rect.height * image.height}`}
  >
    <canvas bind:this={canvas!} aria-label={label}>{label}</canvas>
    {@render children?.()}
  </div>
</div>
