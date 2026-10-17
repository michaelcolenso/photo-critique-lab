import { it, expect } from 'vitest';
import { PhotoCritique, ModelCritique } from '../../src/lib/critique/schema';
import { zodTextFormat } from 'openai/helpers/zod';
import { critique } from '../fixtures/critique';
it('validates a complete critique', () =>
  expect(PhotoCritique.safeParse(critique).success).toBe(true));
it('generates the actual strict Structured Outputs schema', () => {
  const format = zodTextFormat(ModelCritique, 'photo_critique');
  expect(format.strict).toBe(true);
  expect(format.type).toBe('json_schema');
});
for (const [name, change] of Object.entries({
  'missing crop': (c: any) => c.crops.pop(),
  'out-of-bounds crop': (c: any) => {
    c.crops[0].rect.x = 0.9;
  },
  'invalid role': (c: any) => {
    c.crops[0].role = 'OTHER';
  },
  'duplicate role': (c: any) => {
    c.crops[0].role = 'STRONGEST';
  },
  'excess score': (c: any) => {
    c.scores.light.value = 101;
  },
  'negative confidence': (c: any) => {
    c.crops[0].confidence = -0.1;
  }
}))
  it(`rejects ${name}`, () => {
    const c = structuredClone(critique);
    change(c);
    expect(PhotoCritique.safeParse(c).success).toBe(false);
  });
