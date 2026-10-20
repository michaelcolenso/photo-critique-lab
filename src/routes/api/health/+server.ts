import { json } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import { noStore } from '$lib/server/http';
import type { RequestHandler } from './$types';

/** Readiness without an image upload or a billable model request. */
export const GET: RequestHandler = ({ platform }) =>
  json(
    {
      status: 'ok',
      critique: platform?.env?.OPENAI_API_KEY || env.OPENAI_API_KEY ? 'configured' : 'unavailable',
      telemetry: !!platform?.env?.VALIDATION_EVENTS
    },
    { headers: noStore }
  );
