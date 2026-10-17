import { z } from 'zod';
import { CriticMode, RectSchema, ROLES } from '$lib/critique/schema';

export const EVENT_NAMES = [
  'photo_loaded',
  'critique_completed',
  'critique_failed',
  'crop_viewed',
  'overlay_enabled',
  'crop_modified',
  'comparison_opened',
  'preference_selected',
  'crop_exported',
  'another_photo_started'
] as const;
export type ValidationEvent = (typeof EVENT_NAMES)[number];
export const SELECTIONS = ['ORIGINAL', 'A', 'B', 'C', 'NONE'] as const;
export const REASONS = [
  'Better composition',
  'Stronger emotion',
  'Cleaner background',
  'Better subject emphasis',
  'More interesting',
  'Crop too aggressive',
  'Lost important context',
  'AI misunderstood photograph',
  'Other'
] as const;
export const USEFULNESS = ['YES', 'SOMEWHAT', 'NO'] as const;
const version = z.enum(['ORIGINAL', 'A', 'B', 'C', 'MANUAL']);
const rect = RectSchema;
const schemas = {
  photo_loaded: z
    .object({
      width: z.number().int().positive(),
      height: z.number().int().positive(),
      bytes: z.number().int().nonnegative(),
      mimeType: z.enum(['image/jpeg', 'image/png', 'image/webp'])
    })
    .strict(),
  critique_completed: z
    .object({
      mode: CriticMode,
      verdict: z.enum(['KEEP', 'MAYBE', 'CUT']),
      crops: z.array(z.object({ role: z.enum(ROLES), rect }).strict()).length(3),
      fallbackRoles: z.array(z.enum(ROLES)),
      durationMs: z.number().nonnegative()
    })
    .strict(),
  critique_failed: z.object({ category: z.enum(['unavailable', 'invalid', 'network']) }).strict(),
  crop_viewed: z.object({ version }).strict(),
  overlay_enabled: z
    .object({
      overlay: z.enum([
        'Subject',
        'Visual anchor',
        'Distractions',
        'Highlights',
        'Shadows',
        'Thirds'
      ])
    })
    .strict(),
  crop_modified: z.object({ version, recommendedRect: rect.nullable(), userRect: rect }).strict(),
  comparison_opened: z.object({ mode: z.enum(['grid', 'ab']) }).strict(),
  preference_selected: z
    .object({
      selection: z.enum(SELECTIONS),
      reasons: z.array(z.enum(REASONS)).max(9),
      usefulness: z.enum(USEFULNESS).nullable(),
      mode: CriticMode,
      verdict: z.enum(['KEEP', 'MAYBE', 'CUT']),
      modified: z.boolean(),
      recommendedRect: rect.nullable(),
      userRect: rect.nullable()
    })
    .strict(),
  crop_exported: z
    .object({
      version,
      width: z.number().int().positive(),
      height: z.number().int().positive(),
      modified: z.boolean()
    })
    .strict(),
  another_photo_started: z.object({}).strict()
};
export const ValidationEventSchema = z
  .object({
    sessionId: z.uuid(),
    photoId: z.uuid(),
    event: z.enum(EVENT_NAMES),
    timestamp: z.iso.datetime(),
    properties: z.unknown()
  })
  .strict()
  .superRefine((event, ctx) => {
    if (!schemas[event.event].safeParse(event.properties).success)
      ctx.addIssue({ code: 'custom', message: 'Invalid event properties' });
  });
export interface Event {
  sessionId: string;
  photoId: string;
  event: ValidationEvent;
  timestamp: string;
  properties: Record<string, unknown>;
}
export function sendEvent(
  sessionId: string,
  photoId: string,
  event: ValidationEvent,
  properties: Record<string, unknown> = {}
) {
  const payload: Event = {
    sessionId,
    photoId,
    event,
    timestamp: new Date().toISOString(),
    properties
  };
  if (!ValidationEventSchema.safeParse(payload).success) return;
  void fetch('/api/event', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(payload),
    keepalive: true
  }).catch(() => {});
}
