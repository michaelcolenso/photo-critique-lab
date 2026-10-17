<script lang="ts">
  import { Activity } from '@lucide/svelte';
  import type { LocalAnalysis } from '$lib/critique/schema';
  let { analysis: a }: { analysis: LocalAnalysis } = $props();
  const path = $derived.by(() => {
    const max = Math.max(...a.histogram.luminance, 1);
    return `M0 60 ${a.histogram.luminance.map((v, i) => `L${i} ${60 - (v / max) * 55}`).join(' ')} L255 60 Z`;
  });
</script>

<details class="technical-panel" open>
  <summary
    ><span><Activity size={15} /> Pixel measurements</span><span class="fine muted"
      >Local · analysis copy</span
    ></summary
  >
  <div class="technical-content">
    <svg
      viewBox="0 0 255 64"
      preserveAspectRatio="none"
      role="img"
      aria-label="256-bin luminance histogram"
      ><defs
        ><linearGradient id="histogram" x1="0" x2="1"
          ><stop offset="0%" stop-color="#6e8673" /><stop
            offset="100%"
            stop-color="#c5f277"
          /></linearGradient
        ></defs
      ><path d={path} fill="url(#histogram)" /></svg
    >
    <div class="measurement">
      <span>Mean luminance</span><strong>{a.luminance.mean.toFixed(1)}<small> / 255</small></strong>
    </div>
    <div class="measurement">
      <span>Clipped shadows</span><strong
        >{(a.clipping.shadowFraction * 100).toFixed(1)}<small>%</small></strong
      >
    </div>
    <div class="measurement">
      <span>Clipped highlights</span><strong
        >{(a.clipping.highlightFraction * 100).toFixed(1)}<small>%</small></strong
      >
    </div>
    <div class="measurement">
      <span>Edge variance</span><strong>{Math.round(a.sharpness.global)}</strong>
    </div>
  </div>
  <p class="fine muted">
    Measurements describe the analysis pixels. Clipping and edge detail alone do not determine
    photographic quality.
  </p>
</details>
