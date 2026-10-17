<script lang="ts">
  import type { Version, Workspace } from '$lib/stores/workspace.svelte';
  let { workspace: w }: { workspace: Workspace } = $props();
  const tabs: { key: Version; label: string; title: string }[] = [
    { key: 'ORIGINAL', label: 'Original', title: 'Your framing' },
    { key: 'A', label: 'A', title: 'Conservative' },
    { key: 'B', label: 'B', title: 'Strongest' },
    { key: 'C', label: 'C', title: 'Wildcard' }
  ];
  function keydown(e: KeyboardEvent, index: number) {
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(e.key)) return;
    e.preventDefault();
    let next =
      e.key === 'Home'
        ? 0
        : e.key === 'End'
          ? 3
          : (index + (e.key === 'ArrowRight' ? 1 : -1) + 4) % 4;
    if (!w.critique) next = 0;
    w.select(tabs[next].key);
    document.getElementById(`tab-${tabs[next].key}`)?.focus();
  }
</script>

<div class="crop-tabs" role="tablist" aria-label="Photograph versions">
  {#each tabs as tab, i}
    <button
      id={`tab-${tab.key}`}
      role="tab"
      aria-label={tab.key === 'ORIGINAL' ? 'Original photograph' : `${tab.key} ${tab.title}`}
      aria-selected={w.selected === tab.key}
      aria-controls="photo-panel"
      tabindex={w.selected === tab.key ? 0 : -1}
      disabled={i > 0 && !w.critique}
      class:active={w.selected === tab.key}
      onclick={() => w.select(tab.key)}
      onkeydown={(e) => keydown(e, i)}
    >
      <span class="tab-letter">{tab.label}</span><span class="tab-title">{tab.title}</span>
    </button>
  {/each}
  {#if w.selected === 'MANUAL'}<button
      class="active"
      role="tab"
      aria-selected="true"
      aria-controls="photo-panel">Manual crop</button
    >{/if}
</div>
