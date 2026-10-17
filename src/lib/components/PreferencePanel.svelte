<script lang="ts">
  import { Check, ArrowRight } from '@lucide/svelte';
  import { REASONS, SELECTIONS, USEFULNESS } from '$lib/telemetry/events';
  import type { Workspace, Version } from '$lib/stores/workspace.svelte';
  let { workspace: w }: { workspace: Workspace } = $props();
  let selection = $state<(typeof SELECTIONS)[number] | null>(null);
  let reasons = $state<string[]>([]),
    note = $state('');
  let usefulness = $state<(typeof USEFULNESS)[number] | null>(null);
  function save() {
    if (!selection || w.preferenceSaved || !w.critique) return;
    const index = ['A', 'B', 'C'].indexOf(selection);
    const recommendedRect = index >= 0 ? w.critique.crops[index].rect : null;
    const userRect = selection === 'NONE' ? null : w.rectFor(selection as Version);
    w.preferenceSaved = true;
    w.event('preference_selected', {
      selection,
      reasons,
      usefulness,
      mode: w.critiqueMode,
      verdict: w.critique.verdict,
      modified: !!w.userRects[selection],
      recommendedRect,
      userRect
    });
  }
</script>

<section class="preference-panel" aria-label="Record your preference">
  <div class="preference-heading">
    <div>
      <span class="eyebrow">Your eye, your call</span>
      <h2>Which version is strongest?</h2>
    </div>
    <span class="step-number">03</span>
  </div>
  {#if w.preferenceSaved}
    <div class="preference-saved" role="status">
      <Check size={20} />
      <div>
        <strong>Preference recorded: {selection}</strong>
        <p>Your choice helps test whether these recommendations are useful.</p>
      </div>
    </div>
  {:else}
    <div class="preference-options" role="group" aria-label="Strongest version">
      {#each SELECTIONS as option}<button
          aria-pressed={selection === option}
          class:active={selection === option}
          onclick={() => {
            selection = option;
            if (option !== 'NONE') w.select(option);
          }}
          >{option === 'ORIGINAL'
            ? 'Original'
            : option === 'NONE'
              ? 'None'
              : option}{#if selection === option}<Check size={14} />{/if}</button
        >{/each}
    </div>
    {#if selection}
      <fieldset class="reason-choices">
        <legend>What made the difference? <span class="muted">Optional</span></legend>
        {#each REASONS as reason}<label
            ><input type="checkbox" value={reason} bind:group={reasons} />{reason}</label
          >{/each}
      </fieldset>
      <label class="note-label"
        >A note to yourself <span class="muted">Optional · stays in this tab</span><textarea
          bind:value={note}
          maxlength="500"
          rows="2"
          placeholder="What did you see differently?"></textarea></label
      >
      <fieldset class="usefulness">
        <legend>Was the critique useful?</legend>{#each USEFULNESS as useful}<label
            ><input
              type="radio"
              value={useful}
              bind:group={usefulness}
              name="usefulness"
            />{useful === 'YES' ? 'Yes' : useful === 'NO' ? 'No' : 'Somewhat'}</label
          >{/each}
      </fieldset>
      <button class="button primary" onclick={save}
        >Record preference <ArrowRight size={16} /></button
      >
    {/if}
  {/if}
</section>
