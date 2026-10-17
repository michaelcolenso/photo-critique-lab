<script lang="ts">
  import { ArrowUpRight, ScanEye, RefreshCw, Sparkles } from '@lucide/svelte';
  import type { Workspace } from '$lib/stores/workspace.svelte';
  import ScoreCard from './ScoreCard.svelte';
  let { workspace: w }: { workspace: Workspace } = $props();
  let section = $state<'critique' | 'scores'>('critique');
  const scoreGroups = [
    {
      title: 'Photographic',
      fields: [
        ['composition', 'Composition'],
        ['light', 'Light'],
        ['moment', 'Moment'],
        ['originality', 'Originality']
      ]
    },
    { title: 'Technical', fields: [['technicalExecution', 'Technical execution']] },
    { title: 'Presentation', fields: [['printPotential', 'Print potential']] }
  ];
</script>

<aside class="critique-panel" aria-label="Photographic critique">
  <div class="panel-header">
    <div>
      <span class="eyebrow">A second perspective</span>
      <h2>The edit</h2>
    </div>
    <ScanEye size={23} strokeWidth={1.4} />
  </div>
  {#if w.critique}
    <div class="panel-tabs" role="group" aria-label="Critique sections">
      <button class:active={section === 'critique'} onclick={() => (section = 'critique')}
        >Critique</button
      ><button class:active={section === 'scores'} onclick={() => (section = 'scores')}
        >Six dimensions</button
      >
    </div>
    {#if section === 'critique'}
      <div class="verdict-row">
        <span class="verdict" class:cut={w.critique.verdict === 'CUT'}>{w.critique.verdict}</span
        ><span class="muted fine">Editorial judgment · {w.critiqueMode}</span>
      </div>
      <h3 class="thesis">{w.critique.thesis}</h3>
      <ul class="verdict-reasons">
        {#each w.critique.verdictReasons as reason}<li>{reason}</li>{/each}
      </ul>
      <div class="observation-section">
        <span class="eyebrow">What works</span>
        {#each w.critique.strengths as s}<div class="observation">
            <span class="observation-marker positive">+</span>
            <div>
              <h4>{s.claim}</h4>
              <p>{s.reason}</p>
            </div>
          </div>{/each}
      </div>
      <div class="observation-section">
        <span class="eyebrow">What competes</span>
        {#each w.critique.weaknesses as s}
          <div class="observation">
            <span class="observation-marker">−</span>
            <div>
              {#if s.region}<button class="region-link" onclick={() => w.showRegion(s.region!)}
                  >{s.claim}<ArrowUpRight size={14} /></button
                >{:else}<h4>{s.claim}</h4>{/if}
              <p>{s.reason}</p>
              {#if s.region}<span class="fine muted">Select to inspect the region</span>{/if}
            </div>
          </div>
        {/each}
      </div>
      <p class="judgment-note">
        <Sparkles size={14} /> A perspective to consider. Your judgment comes last.
      </p>
    {:else}
      <p class="muted fine score-intro">
        Six independent editorial judgments. Open a dimension for its rationale.
      </p>
      {#each scoreGroups as group}<div class="score-group">
          <span class="eyebrow">{group.title}</span>
          {#each group.fields as [key, label]}<ScoreCard
              {label}
              score={w.critique.scores[key as keyof typeof w.critique.scores]}
            />{/each}
        </div>{/each}
    {/if}
  {:else if w.state === 'REQUESTING_CRITIQUE'}
    <div class="panel-placeholder">
      <span class="loader"></span>
      <h3>Considering the photograph</h3>
      <p>Requesting an image-specific critique and three different frames.</p>
      <span class="fine muted">The original is ready to explore.</span>
    </div>
  {:else if w.state === 'ANALYZING_LOCAL'}
    <div class="panel-placeholder">
      <span class="loader"></span>
      <h3>Measuring the light</h3>
      <p>Calculating luminance, clipping and edge detail in your browser.</p>
    </div>
  {:else}
    <div class="panel-placeholder">
      <ScanEye size={35} strokeWidth={1} />
      <h3>A considered second look</h3>
      <p>
        Image-specific observations, six dimensions of critique, and three different crop intentions
        will appear here.
      </p>
      {#if w.state === 'AI_ERROR'}<button
          class="button secondary"
          onclick={() => w.requestCritique()}><RefreshCw size={15} /> Retry critique</button
        >{/if}
    </div>
  {/if}
</aside>
