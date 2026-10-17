# Product guardrails

**Do not expand product scope.**

The application evaluates and crops photographs. It does not generate replacement image content.
Never use an image-generation endpoint to implement cropping. Never silently alter source pixels.
Never substitute mock analysis in production. AI statements are judgments, not measurements.
Technical measurements are not aesthetic truth. Preserve the original throughout the session.
Fix root causes rather than weakening tests.
Do not declare completion until build, unit tests, E2E tests and a deployed smoke test have passed.

Use Svelte 5 runes, TypeScript, Zod, Canvas, and the Cloudflare adapter. Keep secrets server-side.
Fixtures must be synthetic or licensed for redistribution; do not commit private photographs.
