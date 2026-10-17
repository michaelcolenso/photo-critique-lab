# Validation and experiment readiness

## Observed verification — 2026-10-17

| Check                                        | Result                                                                                    |
| -------------------------------------------- | ----------------------------------------------------------------------------------------- |
| Svelte/TypeScript check                      | Passed, zero errors and warnings                                                          |
| Vitest                                       | 42 tests passed                                                                           |
| Playwright on development server             | 38 tests passed across desktop and 320px touch Chromium                                   |
| Playwright on final production Worker bundle | 36 applicable tests passed across both viewports                                          |
| Literal crop pixel tests                     | Both development-browser cases passed; cropped JPEG dimensions and source colors verified |
| Production build                             | Passed with the Cloudflare adapter                                                        |
| Wrangler deployment dry run                  | Passed with assets and Analytics Engine binding                                           |
| Local Cloudflare runtime smoke               | Passed on final bundle, including no-key failure behavior and telemetry rejection         |
| Live OpenAI response/latency verification    | Pending: credentials explicitly deferred                                                  |
| Remote Cloudflare deployment and smoke       | Pending: Cloudflare credentials unavailable                                               |
| Real-photo golden set                        | 20 licensed photographs curated and decoded; live semantic review pending                 |
| Photographer study                           | Pending after live-model and deployment verification                                      |

The two dev-only pixel tests dynamically import source modules from Vite; the production run excludes those and verifies the exported crop through the full download workflow instead. AI responses in browser tests are mocked only in the test runner. No live model call was made. The MVP is implemented and locally verified, but the brief’s full deployment/live-quality acceptance gate remains open.

## Engineering checks

Run `npm run check`, `npm test`, `npm run test:e2e`, `npm run build`, and `npm run cf:check`. Browser tests use actual decode, worker analysis, canvas rendering, crop editing, downloading and pixel checks. Only critique responses are mocked; mocks live exclusively under `tests/`. All eight EXIF orientations are checked against known source colors, not just width/height.

The fixture generator produces twenty synthetic scenes in the requested category counts: 4 portrait, 3 landscape, 3 street, 2 architecture, 2 pets, 2 low-light, 2 minimal and 2 busy. It also produces lossless color blocks, eight oriented JPEGs and a 2400px source for proxy validation. See `tests/fixtures/manifest.json` for invariants. These are engineering fixtures, not twenty representative real photographs. The public sample is separately licensed via Unsplash. No private photograph is committed.

The separate `tests/golden/` set contains twenty licensed public photographs in the same category counts, with attribution, source URLs, dimensions and SHA-256 checksums in `tests/golden/manifest.json`. The set was visually reviewed for category fit and checked for decode/integrity; it is excluded from shipped app assets. Before the photographer study, run live critique on that set, inspect subject preservation and save representative real responses as fixtures. **Live model responses have not been collected while credentials are deferred.** Geometry/schema tests cannot prove critique specificity or photographic quality.

## Runtime smoke

After build, run `npm run cf:dev` and `npm run smoke` against the local Cloudflare runtime. This checks routes/assets, no-key behavior, request validation, no-store headers, origin checks and telemetry privacy. A Wrangler dry run checks packaging and bindings but is not a deployed smoke test.

After authentication/deployment, run `PCL_BASE_URL=https://<worker>.workers.dev npm run smoke` before setting the key, or `PCL_EXPECT_AI=true PCL_BASE_URL=https://<worker>.workers.dev npm run smoke` afterward. The latter makes a real billable API call; do this only when live credential use is authorized. Run the browser workflow against that URL as well, excluding the dev-module-only `pixels.spec.ts` test.

Remote Cloudflare deployment, real model response fixtures, live latency and subjective quality remain unverified until the relevant credentials are configured. Do not label the MVP fully accepted before those gates pass.

## Experiment: 20 photographers × 10 photos

Freeze the feature set. Collect 200 evaluations, with verdict and recommended A/B/C geometry from `critique_completed`, chosen/revised geometry and structured reasons/usefulness from `preference_selected`, plus repeat upload behavior from `another_photo_started`. Notes are intentionally local-only. Collect willingness to pay through the study interview, not an added subscription flow.

| Metric                       | Definition                                                                              | Continue threshold |
| ---------------------------- | --------------------------------------------------------------------------------------- | ------------------ |
| Crop win rate                | A/B/C preferences / all completed preference submissions, including ORIGINAL and NONE   | ≥65%               |
| Wildcard win rate            | C preferences / all completed preference submissions                                    | Diagnostic         |
| Original win rate            | ORIGINAL preferences / all completed preference submissions                             | Diagnostic         |
| Critique usefulness          | YES / all non-null usefulness answers; report response rate separately                  | ≥50%               |
| Re-engagement                | Sessions with a successful subsequent upload / sessions with ≥1 successful photo upload | ≥40%               |
| Willingness to pay $10/month | Interview participants saying yes / interviewed participants                            | ≥30%               |

Define a completed comparison as a submitted preference; merely opening a comparison view is not completion. Each session/photo contributes one preference to the primary metric. Report NONE and missing-answer rates separately. Deduplicate before calculating rates, audit telemetry loss and Analytics Engine sampling (`_sample_interval`), and do not inflate denominators with crop views or retries. Mode changes can produce multiple critique events for one photo: use the critique mode/verdict carried with the submitted preference, not an arbitrary earlier verdict.

Analytics Engine SQL API example for preference rows (authenticated operator access only):

```sql
SELECT index1 AS session_id, blob1 AS photo_id,
       blob3 AS submitted_at, blob4 AS properties, _sample_interval
FROM pcl_validation_events
WHERE blob2 = 'preference_selected'
ORDER BY double1
```

Export rows to a study analysis environment, deduplicate `(session_id, photo_id)` using the latest submitted preference, parse `properties`, and calculate the definitions above. Quantify uncertainty at photographer/session level rather than assuming 200 independent people. Ensure the study fits the provider’s dataset retention window and export approved anonymous results before expiry.

If strongest dominates, the editorial framing is working. If wildcard wins, explore discovery value. If original wins but critique is useful, test portfolio critique. If photographers repeatedly edit crops similarly, preserve that signal for evaluation. If they do not upload another photograph, investigate the result before polishing or expanding scope.
