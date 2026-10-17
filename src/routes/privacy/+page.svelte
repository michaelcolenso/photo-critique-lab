<svelte:head><title>Privacy — Photo Critique Lab</title></svelte:head>
<main class="privacy-page">
  <a href="/" class="text-button">← Back to the lab</a><span class="eyebrow"
    >YOUR PHOTOGRAPH, RESPECTED</span
  >
  <h1>Privacy, by design.</h1>
  <h2>The original stays with you.</h2>
  <p>
    Full-resolution originals remain in your browser. A reduced analysis copy is sent for critique.
    We normalize orientation and remove EXIF before sending a JPEG copy with a long edge of at most
    1600 pixels.
  </p>
  <h2>One request. No photo library.</h2>
  <p>
    The analysis copy is processed by our server and OpenAI for critique. We do not save it, cache
    critique responses, or log image payloads, EXIF or filenames. OpenAI requests use <code
      >store: false</code
    >; provider security and abuse-monitoring retention may still apply. See
    <a href="https://platform.openai.com/docs/guides/your-data" target="_blank" rel="noreferrer"
      >OpenAI’s data controls</a
    >.
  </p>
  <h2>Anonymous choices help validate the idea.</h2>
  <p>
    Random session and photo identifiers connect behavioral events such as viewing, adjusting,
    comparing, choosing and exporting. Events can include crop coordinates, editorial verdict,
    critic mode, quick-choice reasons and critique usefulness. They do not include your photograph,
    EXIF, filename or personal notes. There are no accounts, advertising cookies or cross-site
    trackers.
  </p>
  <p>
    Session identifiers are held in session storage. Notes to yourself remain in memory in this tab.
    Closing or reloading the tab clears the photograph, critique and notes. Deployed behavioral
    events are stored in Cloudflare Analytics Engine with its configured retention; this MVP does
    not maintain a photo library.
  </p>
  <h2>Export means a literal crop.</h2>
  <p>
    Exported JPEGs contain only pixels from the oriented original, without overlays or AI-generated
    content. JPEG encoding is lossy. Transparent areas in PNG and WebP are composited on white for
    JPEG analysis and export.
  </p>
  <h2>Sample photograph</h2>
  <p>
    The public forest photograph is from <a
      href="https://unsplash.com/photos/deer-in-yosemite-valley-meadow-UCd78vfC8vU"
      target="_blank"
      rel="noreferrer">Johannes Andersson on Unsplash</a
    >, used under the
    <a href="https://unsplash.com/license" target="_blank" rel="noreferrer">Unsplash License</a>.
    Using the sample follows the same analysis workflow as uploading a photograph.
  </p>
</main>
