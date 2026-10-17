import { describe, it, expect } from 'vitest';
import { cropIoU, diverse, wildcardDifferent } from '../../src/lib/critique/crop-diversity';
import { repairCrops, orderedCrops } from '../../src/lib/critique/crop-validation';
import { validRect } from '../../src/lib/image/crop';
import { critique } from '../fixtures/critique';
const full = { x: 0, y: 0, width: 1, height: 1 };
describe('crop diversity', () => {
  it('computes identical, non-overlap, and partial intersection', () => {
    expect(cropIoU(full, full)).toBe(1);
    expect(cropIoU({ ...full, width: 0.4 }, { ...full, x: 0.5, width: 0.4 })).toBe(0);
    expect(cropIoU(full, { x: 0.5, y: 0.5, width: 0.5, height: 0.5 })).toBe(0.25);
  });
  it('accepts the different intentions fixture in role order', () =>
    expect(orderedCrops([...critique.crops].reverse())?.map((c) => c.role)).toEqual([
      'CONSERVATIVE',
      'STRONGEST',
      'WILDCARD'
    ]));
  it('enforces A/B strictly below .82', () => {
    const rects = [
      full,
      { x: 0, y: 0, width: 0.82, height: 1 },
      { x: 0, y: 0, width: 0.3, height: 0.3 }
    ];
    expect(diverse(rects)).toBe(false);
    rects[1].width = 0.819;
    expect(diverse(rects)).toBe(true);
  });
  it('enforces A/C below .72', () =>
    expect(
      diverse([
        full,
        { x: 0, y: 0, width: 0.2, height: 0.2 },
        { x: 0, y: 0, width: 0.72, height: 1 }
      ])
    ).toBe(false));
  it('enforces B/C below .78 independently', () => {
    const b = { x: 0.2, y: 0.1, width: 0.6, height: 0.8 };
    expect(diverse([full, b, { ...b, width: b.width * 0.79 }])).toBe(false);
  });
  it('requires a material wildcard difference', () => {
    expect(wildcardDifferent(full, full)).toBe(false);
    expect(wildcardDifferent({ ...full, width: 0.6 }, full)).toBe(true);
  });
  it('preserves valid distinct recommendations during fallback', () => {
    const input = structuredClone(critique.crops);
    input[2].rect.width = 1;
    const result = repairCrops(input);
    expect(result.fallbackRoles).toEqual(['WILDCARD']);
    expect(result.crops[0]).toEqual(input[0]);
    expect(result.crops[1]).toEqual(input[1]);
    expect(diverse(result.crops.map((c) => c.rect))).toBe(true);
  });
  it('repairs missing, identical, duplicate-role, NaN, and extreme anchor cases deterministically', () => {
    for (const raw of [
      null,
      [],
      [critique.crops[0]],
      Array(3).fill(critique.crops[0]),
      critique.crops.map((c) => ({ ...c, rect: full })),
      [{ ...critique.crops[0], rect: { ...full, x: NaN } }]
    ])
      for (const anchor of [
        { x: 0, y: 0 },
        { x: 1, y: 1 },
        { x: 0.5, y: 0.5 }
      ]) {
        const result = repairCrops(raw, anchor);
        expect(diverse(result.crops.map((c) => c.rect))).toBe(true);
        expect(result.crops.every((c) => validRect(c.rect))).toBe(true);
        expect(repairCrops(raw, anchor)).toEqual(result);
      }
  });
});
