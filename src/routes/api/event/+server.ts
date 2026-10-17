import { json } from '@sveltejs/kit';
import { ValidationEventSchema } from '$lib/telemetry/events';
import { failure, noStore, readJSON, sameOrigin } from '$lib/server/http';
import type { RequestHandler } from './$types';
export const POST: RequestHandler = async ({ request, platform, url }) => {
  if (!sameOrigin(request, url)) return failure('Cross-origin requests are not supported.', 403);
  let parsed;
  try {
    parsed = ValidationEventSchema.safeParse(await readJSON(request, 12_000));
  } catch {
    return failure('Invalid validation event.', 400);
  }
  if (!parsed.success) return failure('Invalid validation event.', 400);
  const dataset = platform?.env?.VALIDATION_EVENTS;
  if (!dataset) return json({ captured: false }, { status: 202, headers: noStore });
  const event = parsed.data;
  dataset.writeDataPoint({
    indexes: [event.sessionId],
    blobs: [event.photoId, event.event, event.timestamp, JSON.stringify(event.properties)],
    doubles: [Date.parse(event.timestamp)]
  });
  return json({ captured: true }, { headers: noStore });
};
