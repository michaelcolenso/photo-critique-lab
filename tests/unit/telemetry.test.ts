import { it, expect } from 'vitest';
import { ValidationEventSchema } from '../../src/lib/telemetry/events';
const event = {
  sessionId: '0596a47a-e1f1-40a8-9838-cbd0aa91f910',
  photoId: '0996a47a-e1f1-40a8-9838-cbd0aa91f910',
  event: 'photo_loaded',
  timestamp: new Date().toISOString(),
  properties: { width: 100, height: 200, bytes: 1024, mimeType: 'image/jpeg' }
};
it('accepts only allowlisted behavioral fields', () =>
  expect(ValidationEventSchema.safeParse(event).success).toBe(true));
for (const field of ['filename', 'image', 'exif', 'base64', 'prompt'])
  it(`rejects ${field} in events`, () => {
    expect(
      ValidationEventSchema.safeParse({
        ...event,
        properties: { ...event.properties, [field]: 'private' }
      }).success
    ).toBe(false);
    expect(ValidationEventSchema.safeParse({ ...event, [field]: 'private' }).success).toBe(false);
  });
