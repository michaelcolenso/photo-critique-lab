<script lang="ts">
  import { onDestroy, onMount } from 'svelte';
  import {
    Crop,
    ArrowUpRight,
    ArrowRight,
    ShieldCheck,
    Grid2X2,
    Columns2,
    SlidersHorizontal,
    Eye,
    Check,
    X,
    ChevronDown,
    RefreshCw,
    Focus
  } from '@lucide/svelte';
  import { Workspace, type Overlay } from '$lib/stores/workspace.svelte';
  import { ORIGINAL, pixelRect } from '$lib/image/crop';
  import UploadZone from '$lib/components/UploadZone.svelte';
  import PhotoStage from '$lib/components/PhotoStage.svelte';
  import CropTabs from '$lib/components/CropTabs.svelte';
  import CropOverlay from '$lib/components/CropOverlay.svelte';
  import AnalysisOverlay from '$lib/components/AnalysisOverlay.svelte';
  import CropEditor from '$lib/components/CropEditor.svelte';
  import CritiquePanel from '$lib/components/CritiquePanel.svelte';
  import CompareGrid from '$lib/components/CompareGrid.svelte';
  import ABCompare from '$lib/components/ABCompare.svelte';
  import PreferencePanel from '$lib/components/PreferencePanel.svelte';
  import ExportButton from '$lib/components/ExportButton.svelte';
  import TechnicalPanel from '$lib/components/TechnicalPanel.svelte';
  const w = new Workspace();
  let aspect = $state<number | null>(null);
  let hydrated = $state(false);
  onMount(() => {
    hydrated = true;
  });
  let showOverlays = $state(false),
    showHow = $state(false),
    sampleLoading = $state(false);
  const overlays: Overlay[] = [
    'Subject',
    'Visual anchor',
    'Distractions',
    'Highlights',
    'Shadows',
    'Thirds'
  ];
  const dimensions = $derived(w.bitmap ? pixelRect(w.rect, w.bitmap.width, w.bitmap.height) : null);
  onDestroy(() => w.destroy());
  async function sample() {
    sampleLoading = true;
    try {
      const response = await fetch('/sample.jpg');
      if (!response.ok) throw new Error();
      await w.load(new File([await response.blob()], 'forest-study.jpg', { type: 'image/jpeg' }));
    } catch {
      w.error = 'The sample could not be loaded. Choose a photograph from your device.';
    } finally {
      sampleLoading = false;
    }
  }
</script>

<svelte:head
  ><title>Photo Critique Lab — Find the frame.</title><meta
    name="description"
    content="A considered second look at your photography. Explore image-specific critique and literal crops, compare the frames, and trust your own eye."
  /></svelte:head
>

<a href="#main" class="skip-link">Skip to workspace</a>
<div class="app-shell">
  <header class="site-header">
    <a class="brand" href="/" aria-label="Photo Critique Lab home"
      ><span class="brand-mark"><Crop size={22} strokeWidth={1.8} /></span><span
        >photo critique<span class="brand-light"> lab</span><span class="beta-tag">BETA</span></span
      ></a
    >
    <nav aria-label="Main navigation">
      <button class="nav-link" onclick={() => (showHow = !showHow)}
        >How it works <ArrowUpRight size={13} /></button
      ><span class="header-status"><span></span> A fresh perspective</span>
    </nav>
  </header>

  {#if showHow}
    <section class="how-panel" aria-label="How it works">
      <div>
        <span class="eyebrow">01 · Look</span>
        <p>
          Upload one photograph. Local measurements describe its pixels; AI offers an editorial
          perspective.
        </p>
      </div>
      <div>
        <span class="eyebrow">02 · Explore</span>
        <p>
          Inspect three literal crops, adjust their frames, and compare each with your original.
        </p>
      </div>
      <div>
        <span class="eyebrow">03 · Decide</span>
        <p>
          Choose what works for you, record your preference, and export at the available source
          resolution.
        </p>
      </div>
      <button class="icon-button" aria-label="Close how it works" onclick={() => (showHow = false)}
        ><X size={18} /></button
      >
    </section>
  {/if}

  <main id="main">
    {#if !w.bitmap}
      <div class="landing">
        <section class="hero-copy">
          <div class="eyebrow hero-eyebrow">
            <span class="tiny-line"></span> FOR THE PHOTOGRAPHER’S EYE
          </div>
          <h1>A second eye.<br />A stronger <em>frame.</em></h1>
          <p class="hero-description">
            See what’s working. Find what’s possible.<br />A thoughtful critique and three new ways
            to frame the photograph you already made.
          </p>
          <div class="hero-principle">
            <Focus size={17} strokeWidth={1.5} /> Your pixels. Your perspective. Your call.
          </div>
        </section>
        <section class="hero-visual" aria-label="A photograph can hold more than one frame">
          <div class="visual-index">
            <span>THE ART OF LOOKING AGAIN</span><span>STUDY 001</span>
          </div>
          <div class="hero-photograph">
            <img
              src="/sample.jpg"
              alt="Deer in a meadow beneath a granite mountain, a sample photograph for exploring different frames"
            />
            <div class="decorative-crop"><span></span><span></span><span></span><span></span></div>
            <span class="image-annotation">A different frame.<br />A different feeling.</span><span
              class="photo-coordinate">LITERAL CROP STUDY</span
            >
          </div>
          <div class="visual-caption">
            <span>One photograph. More possibilities.</span><span class="literal-badge"
              ><Check size={11} /> Always original pixels</span
            >
          </div>
        </section>
        <section class="upload-section">
          <UploadZone onfile={(file) => w.load(file)} disabled={w.state === 'DECODING'} />
          <div class="sample-link">
            <span>Just looking around?</span><button
              onclick={sample}
              disabled={sampleLoading || !hydrated}
              >Try a sample photograph <ArrowRight size={14} /></button
            >
          </div>
        </section>
        <div class="landing-note">
          <ShieldCheck size={17} />
          <p>
            Full-resolution originals remain in your browser.<br /><span
              >A reduced analysis copy is sent for critique.</span
            >
          </p>
          <a href="/privacy">Privacy, by design <ArrowUpRight size={13} /></a>
        </div>
        <div class="workflow-strip">
          <div>
            <span>01</span>
            <p>A considered critique<small>Specific observations. Honest judgment.</small></p>
          </div>
          <div>
            <span>02</span>
            <p>Three different intentions<small>Conservative. Strongest. Wildcard.</small></p>
          </div>
          <div>
            <span>03</span>
            <p>The final say is yours<small>Compare, refine, choose and export.</small></p>
          </div>
        </div>
      </div>
      {#if w.error}<div class="error-banner landing-error" role="alert">{w.error}</div>{/if}
      {#if w.state === 'DECODING'}<div class="loading-toast" role="status">
          <span class="loader"></span> Decoding your photograph…
        </div>{/if}
    {:else}
      <section class="workspace-heading">
        <div>
          <span class="eyebrow">THE WORKSPACE</span>
          <h1>Find the photograph within.</h1>
        </div>
        <UploadZone onfile={(file) => w.load(file)} compact disabled={w.state === 'EXPORTING'} />
      </section>
      <div class="workspace-status" aria-live="polite">
        <span class="status-dot" class:working={w.busy}></span>{w.state === 'DECODING'
          ? 'Decoding your photograph…'
          : w.state === 'ANALYZING_LOCAL'
            ? 'Measuring light and edge detail locally…'
            : w.state === 'REQUESTING_CRITIQUE'
              ? 'Requesting critique and alternative crops…'
              : w.state === 'EXPORTING'
                ? 'Exporting your frame…'
                : w.critique
                  ? 'Ready for your perspective'
                  : 'Local workspace ready'}<span class="privacy-short"
          ><ShieldCheck size={13} /> Original stays in your browser</span
        >
      </div>
      {#if w.error}<div class="error-banner" role="alert">
          <span>{w.error}</span>{#if w.state === 'AI_ERROR'}<button
              class="text-button"
              onclick={() => w.requestCritique()}><RefreshCw size={14} /> Retry critique</button
            >{/if}<button
            class="icon-button"
            aria-label="Dismiss error"
            onclick={() => (w.error = '')}><X size={15} /></button
          >
        </div>{/if}
      <div class="workspace-grid">
        <div class="editor-column">
          <div class="photo-workbench">
            <CropTabs workspace={w} />
            <div class="image-toolbar">
              <div class="file-metadata">
                <span>{w.metadata!.width} × {w.metadata!.height}</span><span
                  >{w.metadata!.mimeType.split('/')[1].toUpperCase()}</span
                ><span>{(w.metadata!.bytes / 1024 / 1024).toFixed(1)} MB</span>
              </div>
              <span class="fine muted">SOURCE PIXELS ONLY</span>
            </div>
            {#if w.compare === 'grid'}<CompareGrid
                workspace={w}
              />{:else if w.compare === 'ab'}<ABCompare workspace={w} />{:else}
              <div
                id="photo-panel"
                role="tabpanel"
                aria-labelledby={`tab-${w.selected === 'MANUAL' ? 'ORIGINAL' : w.selected}`}
                class="main-photo"
              >
                <PhotoStage
                  image={w.bitmap}
                  rect={w.editing ? ORIGINAL : w.rect}
                  label={w.editing
                    ? 'Original photograph with editable crop'
                    : `${w.selected} photograph`}
                >
                  <AnalysisOverlay workspace={w} rect={w.editing ? ORIGINAL : w.rect} />
                  {#if w.editing}<CropOverlay
                      rect={w.rect}
                      onchange={(rect, commit) => w.modify(rect, commit)}
                      {aspect}
                      imageAspect={w.metadata!.aspectRatio}
                    />{/if}
                </PhotoStage>
                {#if w.activeRegion}<div class="active-region-caption">
                    <Eye size={14} /><span
                      ><strong>{w.activeRegion.label}</strong> — {w.activeRegion.reason}</span
                    ><button
                      class="icon-button"
                      aria-label="Clear highlighted region"
                      onclick={() => (w.activeRegion = null)}><X size={14} /></button
                    >
                  </div>{/if}
              </div>
            {/if}
            <div class="workbench-controls">
              <div class="control-group">
                <button
                  class:active={w.editing}
                  class="tool-button"
                  aria-pressed={w.editing}
                  onclick={() => {
                    w.editing = !w.editing;
                    w.compare = 'off';
                    aspect = null;
                  }}><Crop size={16} /><span>Adjust crop</span></button
                ><button
                  class:active={showOverlays}
                  class="tool-button"
                  aria-expanded={showOverlays}
                  onclick={() => (showOverlays = !showOverlays)}
                  ><Eye size={16} /><span>Overlays</span><ChevronDown size={12} /></button
                >
              </div>
              <div class="control-group">
                <button
                  class:active={w.compare === 'grid'}
                  class="tool-button"
                  aria-label="Four-up comparison"
                  disabled={!w.critique}
                  onclick={() => w.openCompare('grid')}
                  ><Grid2X2 size={16} /><span>Four-up</span></button
                ><button
                  class:active={w.compare === 'ab'}
                  class="tool-button"
                  aria-label="A/B comparison"
                  disabled={!w.critique}
                  onclick={() => w.openCompare('ab')}><Columns2 size={16} /><span>A/B</span></button
                >
              </div>
            </div>
            {#if showOverlays}<div
                class="overlay-options"
                role="group"
                aria-label="Observation overlays"
              >
                {#each overlays as overlay}<button
                    class:active={w.overlays.includes(overlay)}
                    aria-pressed={w.overlays.includes(overlay)}
                    disabled={overlay !== 'Thirds' && !w.critique}
                    onclick={() => w.toggleOverlay(overlay)}
                    >{#if w.overlays.includes(overlay)}<Check size={12} />{/if}{overlay}</button
                  >{/each}
              </div>{/if}
            {#if w.editing}<CropEditor workspace={w} bind:aspect />{/if}
          </div>
          {#if w.crop && w.compare === 'off'}<div class="crop-rationale">
              <span class="crop-role">{w.selected}</span>
              <div>
                <div class="rationale-heading">
                  <h3>{w.crop.label}</h3>
                  <span class="fine muted"
                    >{w.fallbackRoles.includes(w.crop.role)
                      ? 'Geometric fallback'
                      : `${Math.round(w.crop.confidence * 100)}% model confidence`}{w.userRects[
                      w.selected
                    ]
                      ? ' · Adjusted by you'
                      : ''}</span
                  >
                </div>
                <p>{w.crop.reason}</p>
                <div class="tradeoffs">
                  <span><strong>Preserves</strong> {w.crop.preserves.join(' · ') || '—'}</span><span
                    ><strong>Sacrifices</strong> {w.crop.sacrifices.join(' · ') || '—'}</span
                  >
                </div>
              </div>
            </div>{/if}
          <div class="export-row">
            <div>
              <span class="eyebrow">YOUR FRAME, FULL RESOLUTION</span>
              <p>{dimensions?.width} × {dimensions?.height} px <span>· JPEG · No overlays</span></p>
            </div>
            <ExportButton workspace={w} />
          </div>
          {#if w.notice}<p class="success-notice" role="status">
              <Check size={15} />{w.notice}
            </p>{/if}
          {#if w.technical}<TechnicalPanel analysis={w.technical} />{/if}
          {#if w.critique}{#key w.photoId + w.critique.thesis}<PreferencePanel
                workspace={w}
              />{/key}{/if}
        </div>
        <div class="right-column">
          <div class="mode-control">
            <label for="critic-mode"><SlidersHorizontal size={14} /> Critic’s lens</label><select
              id="critic-mode"
              bind:value={w.mode}
              disabled={w.busy || w.preferenceSaved}
              ><option value="portfolio">Portfolio</option><option value="editorial"
                >Editorial</option
              ><option value="fine-art">Fine art</option><option value="documentary"
                >Documentary</option
              ><option value="social">Social</option></select
            >{#if w.critique && w.mode !== w.critiqueMode}<button
                class="text-button"
                onclick={() => w.requestCritique()}>Apply lens <ArrowRight size={14} /></button
              >{/if}
          </div>
          <CritiquePanel workspace={w} />
          <p class="workspace-privacy">
            <ShieldCheck size={14} /><span
              >Full-resolution originals remain in your browser. A reduced analysis copy is sent for
              critique. <a href="/privacy">Learn more</a></span
            >
          </p>
        </div>
      </div>
    {/if}
  </main>
  <footer class="site-footer">
    <span>Made for looking closer.</span><span
      >Measurement informs. Judgment considers. <em>You decide.</em></span
    ><a href="/privacy">Privacy <ArrowUpRight size={12} /></a>
  </footer>
</div>
