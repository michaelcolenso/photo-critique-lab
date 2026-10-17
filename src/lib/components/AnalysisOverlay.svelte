<script lang="ts">
  import type { Workspace } from '$lib/stores/workspace.svelte';
  import type { Region, Rect } from '$lib/critique/schema';
  let { workspace: w, rect }: { workspace: Workspace; rect: Rect } = $props();
  const regions = $derived.by(() => {
    const list: { region: Region; kind: string }[] = [];
    const c = w.critique;
    if (c) {
      if (w.overlays.includes('Subject') && c.subject.primaryRegion)
        list.push({ region: c.subject.primaryRegion, kind: 'subject' });
      if (w.overlays.includes('Distractions'))
        list.push(...c.distractions.map((region) => ({ region, kind: 'distraction' })));
      if (w.overlays.includes('Highlights'))
        list.push(...c.highlightRegions.map((region) => ({ region, kind: 'highlight' })));
      if (w.overlays.includes('Shadows'))
        list.push(...c.shadowRegions.map((region) => ({ region, kind: 'shadow' })));
    }
    if (w.activeRegion) list.push({ region: w.activeRegion, kind: 'focused' });
    return list;
  });
  const anchor = $derived(w.critique?.subject.visualAnchor);
</script>

<div class="analysis-layer" aria-label="Photographic observation overlays">
  {#if w.overlays.includes('Thirds')}<div
      class="thirds"
      aria-label="Rule of thirds grid"
    ></div>{/if}
  <div
    class="source-regions"
    style:left={`${(-rect.x / rect.width) * 100}%`}
    style:top={`${(-rect.y / rect.height) * 100}%`}
    style:width={`${100 / rect.width}%`}
    style:height={`${100 / rect.height}%`}
  >
    {#each regions as { region, kind }}
      <div
        class="region {kind}"
        data-testid="analysis-region"
        style:left={`${region.rect.x * 100}%`}
        style:top={`${region.rect.y * 100}%`}
        style:width={`${region.rect.width * 100}%`}
        style:height={`${region.rect.height * 100}%`}
      >
        <span>{region.label}</span>
      </div>
    {/each}
    {#if w.overlays.includes('Visual anchor') && anchor}
      <span
        class="anchor"
        style:left={`${anchor.x * 100}%`}
        style:top={`${anchor.y * 100}%`}
        aria-label="Visual anchor">+</span
      >
    {/if}
  </div>
</div>
