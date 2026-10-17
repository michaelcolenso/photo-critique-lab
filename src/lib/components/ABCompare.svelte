<script lang="ts">
  import type { Workspace, Version } from '$lib/stores/workspace.svelte';
  import { drawCrop } from '$lib/image/crop';
  let { workspace: w }: { workspace: Workspace } = $props();
  let left = $state<Version>('ORIGINAL'),
    right = $state<Version>('B'),
    position = $state(50);
  let leftCanvas: HTMLCanvasElement, rightCanvas: HTMLCanvasElement;
  const versions: Version[] = ['ORIGINAL', 'A', 'B', 'C'];
  $effect(() => {
    if (w.bitmap && leftCanvas) drawCrop(leftCanvas, w.bitmap, w.rectFor(left));
  });
  $effect(() => {
    if (w.bitmap && rightCanvas) drawCrop(rightCanvas, w.bitmap, w.rectFor(right));
  });
</script>

<div class="ab-compare">
  <div class="ab-selectors">
    <label
      >Left version<select bind:value={left}
        >{#each versions as v}<option value={v}
            >{v === 'ORIGINAL'
              ? 'Original'
              : `${v} · ${v === 'A' ? 'Conservative' : v === 'B' ? 'Strongest' : 'Wildcard'}`}</option
          >{/each}</select
      ></label
    ><span>↔</span><label
      >Right version<select bind:value={right}
        >{#each versions as v}<option value={v}
            >{v === 'ORIGINAL'
              ? 'Original'
              : `${v} · ${v === 'A' ? 'Conservative' : v === 'B' ? 'Strongest' : 'Wildcard'}`}</option
          >{/each}</select
      ></label
    >
  </div>
  <div class="wipe-stage" style:aspect-ratio={w.metadata!.aspectRatio}>
    <canvas bind:this={leftCanvas!} aria-label={`Left comparison: ${left}`}
      >Left comparison: {left}</canvas
    >
    <div class="wipe-right" style:clip-path={`inset(0 0 0 ${position}%)`}>
      <canvas bind:this={rightCanvas!} aria-label={`Right comparison: ${right}`}
        >Right comparison: {right}</canvas
      >
    </div>
    <div class="wipe-line" style:left={`${position}%`}><span>↔</span></div>
  </div>
  <label class="wipe-slider"
    >Comparison wipe <span>{position}%</span><input
      type="range"
      min="0"
      max="100"
      bind:value={position}
      aria-label="Comparison wipe"
    /></label
  >
  <p class="fine muted">
    Each frame fits the same viewing area without stretching. Different aspect ratios may show
    letterboxing.
  </p>
</div>
