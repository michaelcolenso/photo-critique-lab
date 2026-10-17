# GitHub Actions operations

The workflows automate verification, security checks, release packaging and deployment. They do not add product features or enable live AI calls. New workflows run on the `work` branch and its PR; schedules, Dependabot and default-branch dispatch menus become active after these files merge into `main`.

## Automatic validation

`CI` runs on every branch push, PR, manual dispatch and nightly at 06:17 UTC. Its independent jobs validate formatting, Svelte/TypeScript, workflow syntax with actionlint, dependency audit at high severity, unit tests on Node 22 and 24, production compilation, client credential isolation, Wrangler packaging, browser workflows in Chromium/Firefox/WebKit, and the actual packaged Cloudflare Worker runtime. Mobile Chromium and WebKit use a 320px touch viewport. No model call is needed.

The **Required checks** job fails if any required job fails, is cancelled or is skipped. Configure branch protection to require that stable check, plus CodeQL and Dependency review where applicable. No tests are retried automatically. Obsolete CI runs are cancelled, independent matrix failures remain visible, and all jobs have time limits.

Download coverage (HTML/LCOV/JSON), JUnit XML, Playwright HTML reports and failure traces/screenshots from the run’s Artifacts section. Artifacts expire after 14 days. Coverage thresholds apply to the listed computational modules, not the entire Svelte UI; the UI, worker, decoder and canvas behavior are verified by browser tests. Current thresholds are 85% lines, 80% statements, 75% branches and 90% functions. They are regression floors, not evidence of photographic quality.

The build artifact includes `worker.tar.gz`, a source-commit/digest manifest, checksums and a CycloneDX production-dependency SBOM. A separate job downloads that artifact and tests it without rebuilding. A client-output check rejects server-key identifiers or the test critique in browser assets. Only explicit report/bundle paths are uploaded; env files and user photographs are not collected.

`Security` scans JavaScript/TypeScript and Actions with CodeQL on pushes to main/work, PRs and weekly. Dependency review blocks high/critical vulnerabilities introduced in a PR. Dependabot proposes npm and Actions updates weekly; compatible npm updates are grouped, major migrations remain separate, and merges remain reviewable. An npm audit can still report lower-severity findings while passing its explicit high-severity gate.

## Deployment setup (currently deferred)

Create GitHub environments `staging` and `production`. Configure each with:

| Setting                 | Kind                 | Purpose                                                                        |
| ----------------------- | -------------------- | ------------------------------------------------------------------------------ |
| `CLOUDFLARE_API_TOKEN`  | Environment secret   | Token scoped to the intended account/Workers deployment                        |
| `CLOUDFLARE_ACCOUNT_ID` | Environment secret   | Cloudflare account identifier                                                  |
| `CLOUDFLARE_URL`        | Environment variable | Public HTTPS origin, e.g. `https://photo-critique-lab.<subdomain>.workers.dev` |

Enable required reviewers on the production environment and restrict production deployments to the default branch. Once those settings and Cloudflare services are ready, set the repository variable `PCL_DEPLOY_ENABLED=true`. Missing flags leave deployment jobs disabled; they do not simulate a deployment. Repository/environment settings and secrets were not changed by this implementation; the current GitHub integration denies settings/secrets metadata access with HTTP 403.

Successful CI pushes on `main` trigger production deployment when enabled. The `Deploy` dispatch form also accepts a successful CI run id and a staging/production target. Only runs from this repository’s CI workflow, with a successful conclusion and a trusted branch push/manual event, are accepted. PR/fork artifacts are rejected. Production requires the latest default-branch commit, rechecked after any approval wait. The archive’s checksum and source commit are checked before extraction. The exact tested artifact is deployed; it is not rebuilt with different dependencies.

Staging uses the separate `photo-critique-lab-staging` Worker and `pcl_validation_events_staging` dataset. Production uses the root Wrangler configuration. Secrets remain server-side; configure `OPENAI_API_KEY` directly on the intended Cloudflare Worker when credential setup is authorized. No Actions job copies it into frontend assets or release archives.

After deployment, the smoke test checks pages/assets, health, no-store headers, origin/request validation and telemetry field rejection. Its default mode never invokes a configured model: `/api/health` establishes readiness without a billable request. A missing-key 503 is checked only when the server reports critique unavailable. A failed post-deployment smoke fails the deployment job visibly; it does not automatically roll back an otherwise intentionally selected release.

## Rollback and health monitoring

`Rollback` is a manual dispatch requiring the environment, an explicit previous Cloudflare version UUID and a reason. It uses the same GitHub environment protection and deployment concurrency group, validates configuration before mutation and runs the deployed smoke afterward. Version rollback does not recover external datasets or alter Cloudflare secret bindings.

Set `PCL_MONITOR_ENABLED=true` after both deployed URLs exist to run `Deployed health` every six hours (or dispatch it manually). The normal GitHub workflow failure notifications apply; there are no extra email/Slack integrations. It never invokes AI. Each smoke emits a synthetic `crop_viewed` event, not a photo load, critique result or preference; primary experiment denominators must continue to use the definitions in VALIDATION.md.

## Releases and provenance

Pushing a `vMAJOR.MINOR.PATCH` tag (optionally with a prerelease suffix) whose commit belongs to main invokes the complete reusable CI workflow. Only after it passes does `Release` verify the archive and publish a GitHub release with the Worker, checksum, manifest and SBOM. GitHub build-provenance attestation covers the Worker archive. For example, inspect it with `gh attestation verify worker.tar.gz --repo michaelcolenso/photo-critique-lab`. Release publishing does not enable Cloudflare deployment or live AI calls.

## Live golden evaluation (off by default)

The earlier credential deferral remains in force. `Live golden evaluation` has no schedule, is disabled unless repository variable `PCL_LIVE_EVAL_ENABLED=true`, requires the `ai-evaluation` environment, and requires explicit confirmation of billable calls in its dispatch form. Its environment variable `CLOUDFLARE_URL` points to a deliberately configured evaluation/staging Worker. Keep production data separate.

When authorized, select 1, 5 or 20 licensed public golden photographs. The job uploads only those public fixtures, makes real critique requests, records responses/latencies and screenshots as 14-day artifacts, and requires successful server/client schema and geometry checks. It intercepts behavioral events in the test browser so the photographer study is not contaminated. It does not submit preferences or claim that subject preservation/aesthetic quality passed; those need human review. No live evaluation was dispatched while credentials were deferred.

## Workflow trust

All external Actions are pinned to full commit SHAs, with release comments for Dependabot. Checkout credentials are not persisted. Workflows default to read-only contents access; only CodeQL upload, deployment metadata and release attestation/publishing jobs request their additional permissions. No `pull_request_target` workflow executes PR code with secrets. Deployment requires trusted CI provenance and distinct environment configuration. Cache use is limited to npm dependency downloads; deployment disables automatic package-manager caching. Secrets are scoped to the steps that need them.

The Linux actionlint installer pins its version and archive SHA-256 checksum. Update that checksum deliberately when upgrading. `npm run lint:actions`, `npm run test:coverage`, `npm run package:worker`, `npm run verify:worker` and `npm run test:worker` reproduce the key CI checks locally. The Worker harness uses local port 8787; stop an existing Wrangler preview before invoking it.
