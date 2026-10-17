# Real-photograph golden set

Twenty public photographs from Unsplash, with the requested category counts: 4 portraits, 3 landscapes, 3 street, 2 architecture, 2 pets, 2 low-light, 2 minimal and 2 busy/multi-subject.

Each source page explicitly identified the image as free under the [Unsplash License](https://unsplash.com/license) when retrieved on 2026-10-17. `manifest.json` records each photographer, source page, direct rendition URL, dimensions, SHA-256 checksum and required invariants. These images are for engineering/editorial evaluation and are not included in application static assets. No private user photographs are included. The images retain their respective photographers’ copyrights and are not covered by any license applying to this repository’s code.

Files are proportional JPEG renditions with a maximum edge of 1600 pixels, suitable for critique/geometry evaluation, not full-resolution print-quality certification. Use original-resolution, deliberately supplied test images for print and full-resolution export evaluation. The separate synthetic color-block/orientation fixtures exercise exact export and coordinate behavior.

To recreate the downloads, run `node scripts/download-golden.mjs`. Downloads are an explicit maintainer action, never part of application use or unit tests. The manifest checksum pins the current files; a remote image can change, so review any manifest changes after downloading again.

The invariants express requirements, not claims of a passed live model evaluation. With credentials configured, critique each file, validate schema/bounds/diversity and manually inspect that the primary subject is intentionally preserved. Save real responses separately after approval. Never store expected critique prose as a golden assertion.
