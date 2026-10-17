# Critique schema

`src/lib/critique/schema.ts` is the source of truth. `ModelCritique` is the API-facing strict Structured Outputs schema; unavailable observations use required nullable fields. `PhotoCritique` adds semantic geometry/role checks; `CritiqueBody` permits crop repair without discarding otherwise valid judgments.

- `verdict`: KEEP / MAYBE / CUT, with one to three reasons.
- `thesis`: concise, image-specific photographic interpretation.
- `strengths`, `weaknesses`: claims and reasons; a weakness can reference a bounded, labeled region.
- `subject`: description, optional/null primary region and visual anchor.
- `distractions`, `highlightRegions`, `shadowRegions`: bounded normalized rectangles with textual reason and confidence.
- `scores`: composition, light, moment, originality, technicalExecution, printPotential; integer 0–100 and visible rationale. No overall score.
- `crops`: exactly one CONSERVATIVE (A), STRONGEST (B) and WILDCARD (C). Each includes label, bounded rectangle, reason, preserves, sacrifices and confidence.

All coordinates refer to the complete EXIF-oriented image. Crop dimensions must be at least .20, and `x + width <= 1`, `y + height <= 1`. Roles are canonicalized before display. Pairwise IoU is strictly below .82 (A/B), .72 (A/C), .78 (B/C). The wildcard must differ from B in normalized aspect ratio by >20%, relative area by >25%, or normalized center distance by >12% of the normalized image diagonal. Aspect differences are invariant under original image aspect ratio.

Response envelope:

```json
{
  "critique": { "verdict": "MAYBE", "...": "See schema.ts" },
  "meta": {
    "correctionAttempted": false,
    "fallbackRoles": []
  }
}
```

Geometric fallback proposals have confidence zero, an explicit label/reason, and are not presented as model judgments. Fallbacks are centered on the model’s anchor where available. The photographer must inspect whether they preserve the subject: deterministic geometry cannot establish aesthetic or semantic correctness.

All API failures use `{ "error": "human-readable message" }`, with `Cache-Control: no-store`. An absent key returns 503. Invalid requests return 400, cross-origin requests 403, and critique/provider failures 502. The photo remains editable through failure and retry.
