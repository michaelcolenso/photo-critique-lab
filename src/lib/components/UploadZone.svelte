<script lang="ts">
  import { Upload, ArrowUpRight, ImagePlus } from '@lucide/svelte';
  import { onMount } from 'svelte';
  let {
    onfile,
    compact = false,
    disabled = false
  }: { onfile: (file: File) => void; compact?: boolean; disabled?: boolean } = $props();
  let dragging = $state(false);
  let mounted = $state(false);
  const unavailable = $derived(disabled || !mounted);
  onMount(() => {
    mounted = true;
  });
  let input: HTMLInputElement;
  function files(list: FileList | null) {
    const file = list?.[0];
    if (file && !unavailable) onfile(file);
  }
</script>

{#if compact}
  <button class="button secondary" onclick={() => input.click()} disabled={unavailable}
    ><ImagePlus size={16} /> Another photograph</button
  >
{:else}
  <div
    class:dragging
    class="upload-zone"
    role="region"
    aria-label="Photograph upload"
    ondragover={(e) => {
      e.preventDefault();
      dragging = true;
    }}
    ondragleave={() => (dragging = false)}
    ondrop={(e) => {
      e.preventDefault();
      dragging = false;
      files(e.dataTransfer?.files ?? null);
    }}
  >
    <div class="upload-symbol"><Upload size={26} strokeWidth={1.4} /></div>
    <h2>Start with your photograph</h2>
    <p>Drop a file here, or choose one below.</p>
    <button class="button primary" onclick={() => input.click()} disabled={unavailable}
      >Choose photograph <ArrowUpRight size={17} /></button
    >
    <span class="file-types">JPEG, PNG or WebP <span>·</span> Up to 30 MB</span>
  </div>
{/if}
<input
  bind:this={input!}
  class="sr-only"
  type="file"
  accept="image/jpeg,image/png,image/webp"
  aria-label="Upload photograph"
  onchange={(e) => {
    files(e.currentTarget.files);
    e.currentTarget.value = '';
  }}
  disabled={unavailable}
/>
