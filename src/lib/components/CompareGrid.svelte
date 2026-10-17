<script lang="ts">
  import { Expand } from '@lucide/svelte';
  import PhotoStage from './PhotoStage.svelte';
  import type { Workspace, Version } from '$lib/stores/workspace.svelte';
  let { workspace: w }: { workspace: Workspace } = $props();
  const versions: { version: Version; label: string }[] = [
    { version: 'ORIGINAL', label: 'Original' },
    { version: 'A', label: 'A · Conservative' },
    { version: 'B', label: 'B · Strongest' },
    { version: 'C', label: 'C · Wildcard' }
  ];
</script>

<div class="compare-grid" aria-label="Four-up comparison">
  {#each versions as { version, label }}
    <button
      class="compare-tile"
      onclick={() => {
        w.select(version);
        w.compare = 'off';
      }}
      aria-label={`Expand ${label}`}
    >
      <PhotoStage image={w.bitmap!} rect={w.rectFor(version)} small {label} />
      <span class="compare-caption">{label}<Expand size={14} /></span>
    </button>
  {/each}
</div>
