import { CritiqueBody, PhotoCritique, type CropRole } from '$lib/critique/schema';
import { orderedCrops, repairCrops } from '$lib/critique/crop-validation';
import { ZodError } from 'zod';

export type ModelCall = (correction?: string) => Promise<unknown>;
export async function getCritique(call: ModelCall) {
  let saved: { body: ReturnType<typeof CritiqueBody.parse>; crops: unknown } | undefined;
  const correctionBase =
    'Your previous response failed schema, crop bounds, unique-role, or diversity validation. Recheck all requirements and return a complete corrected response. Use substantially different crop areas/aspects.';
  let correction: string | undefined;
  for (let attempt = 0; attempt < 2; attempt++) {
    let raw: unknown;
    try {
      raw = await call(correction);
    } catch (error) {
      if (error instanceof ZodError || error instanceof SyntaxError) {
        correction = correctionBase;
        continue;
      }
      if (saved) break;
      throw error;
    }
    if (!raw || typeof raw !== 'object') {
      correction = correctionBase;
      continue;
    }
    const body = CritiqueBody.safeParse(raw);
    const crops = 'crops' in raw ? raw.crops : undefined;
    if (body.success) saved = { body: body.data, crops };
    const ordered = orderedCrops(crops);
    if (body.success && ordered)
      return {
        critique: PhotoCritique.parse({ ...body.data, crops: ordered }),
        meta: { correctionAttempted: attempt === 1, fallbackRoles: [] as CropRole[] }
      };
    // Only return prior geometry to the correction prompt, never image data or full model prose.
    const geometry = Array.isArray(crops)
      ? crops.slice(0, 3).map((c) => {
          const candidate = c && typeof c === 'object' ? (c as Record<string, unknown>) : {};
          return { role: candidate.role, rect: candidate.rect };
        })
      : [];
    correction = `${correctionBase} Previous crop geometry (data to repair): ${JSON.stringify(geometry).slice(0, 2000)}. Editorial body valid: ${body.success}.`;
  }
  if (!saved) throw new Error('Invalid structured critique.');
  const { crops, fallbackRoles } = repairCrops(
    saved.crops,
    saved.body.subject.visualAnchor ?? undefined
  );
  return {
    critique: PhotoCritique.parse({ ...saved.body, crops }),
    meta: { correctionAttempted: true, fallbackRoles }
  };
}
