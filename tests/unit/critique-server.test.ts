import { it, expect, vi } from 'vitest';
import { getCritique } from '../../src/lib/server/critique';
import { critique } from '../fixtures/critique';
import { diverse } from '../../src/lib/critique/crop-diversity';
import { z } from 'zod';
it('does not retry valid responses', async () => {
  const call = vi.fn().mockResolvedValue(critique);
  const result = await getCritique(call);
  expect(call).toHaveBeenCalledTimes(1);
  expect(result.meta.correctionAttempted).toBe(false);
});
it('corrects invalid prose once and accepts the second response', async () => {
  const call = vi.fn().mockResolvedValueOnce({}).mockResolvedValueOnce(critique);
  expect((await getCritique(call)).critique).toEqual(critique);
  expect(call).toHaveBeenCalledTimes(2);
});
it('retains critique and repairs geometry after exactly one correction pass', async () => {
  const invalid = {
    ...critique,
    crops: critique.crops.map((c) => ({ ...c, rect: { x: 0, y: 0, width: 1, height: 1 } }))
  };
  const call = vi.fn().mockResolvedValue(invalid);
  const result = await getCritique(call);
  expect(call).toHaveBeenCalledTimes(2);
  expect(result.critique.thesis).toBe(critique.thesis);
  expect(call.mock.calls[1][0]).toContain('Previous crop geometry');
  expect(call.mock.calls[1][0]).not.toContain(critique.thesis);
  expect(diverse(result.critique.crops.map((c) => c.rect))).toBe(true);
  expect(result.meta.fallbackRoles.length).toBeGreaterThan(0);
});
it('fails gracefully after two invalid structured responses', async () => {
  const call = vi.fn().mockResolvedValue({});
  await expect(getCritique(call)).rejects.toThrow('Invalid structured critique');
  expect(call).toHaveBeenCalledTimes(2);
});
it('retries an SDK parse validation failure once', async () => {
  const invalid = z.string().safeParse(123);
  const call = vi.fn().mockRejectedValueOnce(invalid.error).mockResolvedValueOnce(critique);
  expect((await getCritique(call)).critique.verdict).toBe('MAYBE');
  expect(call).toHaveBeenCalledTimes(2);
});
