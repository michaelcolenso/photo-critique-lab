# Architecture

The original file and its EXIF-oriented `ImageBitmap` are canonical and browser-only. There is no image generation code or endpoint. All previews, crop adjustments and exports read that same oriented bitmap. JPEG encoding is lossy; transparent pixels are explicitly composited on white for analysis/export.

## Three separate kinds of evidence

| Kind        | Owner              | Representation                                                                                          |
| ----------- | ------------------ | ------------------------------------------------------------------------------------------------------- |
| Measurement | Browser Web Worker | Luminance percentiles, 256-bin histograms, clipping fractions and proxy-scale Laplacian variance        |
| Judgment    | Server + OpenAI    | Validated editorial verdict, photographic thesis, regions, six scores with rationale and crop proposals |
| Preference  | Photographer       | Chosen version, optional structured reasons/usefulness, recommended/user geometry and modification flag |

The UI labels measurements separately from judgments. It never produces a combined aesthetic score. Preferences are captured in dedicated events, rather than being interpreted as model truth.

## Image lifecycle

1. Validate MIME type and a 30 MiB limit, then decode using `createImageBitmap({ imageOrientation: 'from-image' })`. All eight orientation cases have browser pixel tests. Reject images above 80 MP to avoid unbounded working memory.
2. Paint the original before analysis. Produce a canvas-encoded JPEG proxy, long edge at most 1600 px, quality .85, with EXIF stripped. Transfer its RGBA buffer to a dedicated Web Worker.
3. `POST /api/critique` receives only proxy data, local measurements and critic mode. It bounds streaming request bytes, validates the payload, checks JPEG dimensions and rejects EXIF-bearing proxies.
4. The server calls the official OpenAI Responses API using `responses.parse`, `zodTextFormat`, `store: false`, and a server-only key. `gpt-5-mini` is configurable through `OPENAI_MODEL`. There is a 45-second total deadline, SDK retries are disabled, and at most one semantic correction pass is made.
5. Validate prose, overlay regions, crop bounds, minimum crop size, unique roles and diversity. The client independently validates received schema and diversity. Invalid prose after the correction fails honestly. Valid prose with bad crops retains the maximum compatible subset of valid recommendations and supplies clearly labeled, deterministic geometry for the others.
6. Crop edits write `userRects`; model `rect` remains the recommendation. Integer source endpoints are rounded once by `pixelRect` for consistent preview/export geometry. Exports use the source crop dimensions and JPEG quality .95 without overlays.

No proxy is stored, cached or intentionally logged. Exceptions from the SDK are not logged because their payloads can contain images. `store: false` does not override provider security/abuse-monitoring retention; the privacy page links to provider controls.

## Workspace lifecycle

`EMPTY → DECODING → ANALYZING_LOCAL → REQUESTING_CRITIQUE → READY`

Critique/local analysis failures enter `AI_ERROR`, preserving the original and manual editor. `READY`/`AI_ERROR` can enter `EXPORTING` and return to the preceding state. A new upload replaces the bitmap only after successful decode. Revision tokens and request aborts prevent stale AI responses from replacing a newer photo. Existing workers and bitmaps are released when replaced/unmounted. Upload controls are disabled until browser event handlers have attached, preventing lost uploads during hydration.

## Runtime and telemetry

The SvelteKit Cloudflare adapter emits `.svelte-kit/cloudflare/_worker.js` and static assets. The configured Analytics Engine dataset receives allowlisted behavioral events. `sessionId` is a random UUID held in session storage; `photoId` is a fresh random UUID per successful upload. No filename, EXIF, image content, model prose or free-text notes are accepted by the event endpoint. Notes stay in tab memory.

Dataset field mapping: `index1=sessionId`, `blob1=photoId`, `blob2=event`, `blob3=ISO timestamp`, `blob4=properties JSON`, `double1=timestamp milliseconds`. Missing local dataset bindings return `202 { captured: false }` honestly; events are not printed as a fallback. No raw HTTP body logging is configured. Infrastructure may maintain standard access/security logs outside the application’s event stream.

Analytics Engine is an experiment sink, not an exactly-once database. The UI emits a submitted preference once per photo/critique and disables repeats; metric queries must still deduplicate by session/photo. Network failures can lose telemetry and should be audited before using experiment results. There are no accounts, photo storage, subscriptions or personalization.

## Official references checked during implementation

- [OpenAI Structured Outputs](https://developers.openai.com/api/docs/guides/structured-outputs?api-mode=responses)
- [GPT-5 mini: image input and Structured Outputs](https://developers.openai.com/api/docs/models/gpt-5-mini)
- [OpenAI image inputs](https://developers.openai.com/api/docs/guides/images-vision)
- [SvelteKit on Cloudflare Workers](https://developers.cloudflare.com/workers/framework-guides/web-apps/sveltekit/)

The repository uses Svelte 5 with the SvelteKit 2 configuration format requested in the brief. Dependencies are locked; there is no SvelteKit version 5 requirement silently mapped to a nonexistent package release.
