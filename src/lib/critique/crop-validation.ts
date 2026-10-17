import { CropProposal, ROLES, type CropRole, type Rect } from './schema';
import { clampRect } from '$lib/image/crop';
import { diverse } from './crop-diversity';

export function orderedCrops(raw: unknown): CropProposal[] | null {
  if (!Array.isArray(raw) || raw.length !== 3) return null;
  const parsed = raw.map((c) => CropProposal.safeParse(c));
  if (parsed.some((p) => !p.success)) return null;
  const crops = parsed.map((p) => p.data!);
  if (new Set(crops.map((c) => c.role)).size !== 3) return null;
  const ordered = ROLES.map((role) => crops.find((c) => c.role === role)!);
  return diverse(ordered.map((c) => c.rect)) ? ordered : null;
}
export function repairCrops(
  raw: unknown,
  anchor = { x: 0.5, y: 0.5 }
): { crops: CropProposal[]; fallbackRoles: CropRole[] } {
  const valid = Array.isArray(raw)
    ? raw
        .map((c) => CropProposal.safeParse(c))
        .filter((p) => p.success)
        .map((p) => p.data!)
    : [];
  const existing = ROLES.map((role) =>
    valid.filter((c) => c.role === role).length === 1 ? valid.find((c) => c.role === role)! : null
  );
  const sizes = [
    [0.96, 0.96],
    [0.84, 0.84],
    [0.7, 0.86],
    [0.86, 0.7],
    [0.65, 0.65],
    [0.5, 0.8],
    [0.8, 0.5],
    [0.45, 0.45],
    [0.3, 0.6],
    [0.6, 0.3],
    [0.2, 0.2]
  ];
  const candidates: Rect[] = sizes.map(([width, height]) =>
    clampRect({ x: anchor.x - width / 2, y: anchor.y - height / 2, width, height })
  );
  // Maximize the number of untouched valid recommendations before adding fallback geometry.
  for (const mask of [7, 3, 5, 6, 1, 2, 4, 0]) {
    if (existing.some((e, i) => mask & (1 << i) && !e)) continue;
    const choices = existing.map((e, i) => (mask & (1 << i) ? [e!.rect] : candidates));
    for (const a of choices[0])
      for (const b of choices[1])
        for (const c of choices[2]) {
          if (!diverse([a, b, c])) continue;
          const rects = [a, b, c];
          const fallbackRoles = ROLES.filter((_, i) => !(mask & (1 << i)));
          return {
            fallbackRoles,
            crops: ROLES.map((role, i) =>
              mask & (1 << i)
                ? existing[i]!
                : {
                    role,
                    rect: rects[i],
                    label: `${role[0]}${role.slice(1).toLowerCase()} · geometric alternative`,
                    reason:
                      'The model recommendation failed geometry or diversity checks. This is a deterministic crop for comparison; judge whether it preserves the photograph’s intent.',
                    preserves: ['Only existing source pixels'],
                    sacrifices: ['Some surrounding context; inspect subject boundaries'],
                    confidence: 0
                  }
            )
          };
        }
  }
  throw new Error('Could not construct valid crop geometry.');
}
