<script lang="ts">
  import { Download } from '@lucide/svelte';
  import type { Workspace } from '$lib/stores/workspace.svelte';
  let { workspace: w }: { workspace: Workspace } = $props();
</script>

<button class="button primary" onclick={() => w.export()} disabled={!w.bitmap || w.busy}
  ><Download size={16} />{w.state === 'EXPORTING' ? 'Exporting…' : 'Export frame'}</button
>
