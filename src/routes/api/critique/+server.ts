import { json } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import { z } from 'zod';
import OpenAI from 'openai';
import { zodTextFormat } from 'openai/helpers/zod';
import { CriticMode, LocalAnalysisSchema, ModelCritique } from '$lib/critique/schema';
import { SYSTEM_PROMPT } from '$lib/critique/prompts';
import { getCritique } from '$lib/server/critique';
import { validProxy } from '$lib/server/proxy-validation';
import { failure, noStore, readJSON, sameOrigin } from '$lib/server/http';
import type { RequestHandler } from './$types';

const RequestSchema = z
  .object({ image: z.string().max(4_500_000), technical: LocalAnalysisSchema, mode: CriticMode })
  .strict();
export const POST: RequestHandler = async ({ request, platform, url }) => {
  if (!sameOrigin(request, url)) return failure('Cross-origin requests are not supported.', 403);
  let payload: z.infer<typeof RequestSchema>;
  try {
    payload = RequestSchema.parse(await readJSON(request, 5_000_000));
    if (!validProxy(payload.image))
      return failure(
        'Send a JPEG analysis copy with no EXIF and a long edge of at most 1600 px.',
        400
      );
  } catch {
    return failure('The analysis request is invalid or too large.', 400);
  }
  const apiKey = platform?.env?.OPENAI_API_KEY || env.OPENAI_API_KEY;
  if (!apiKey)
    return failure(
      'AI critique is not configured yet. Your photograph, local analysis and manual cropping remain available.',
      503
    );
  const model = platform?.env?.OPENAI_MODEL || env.OPENAI_MODEL || 'gpt-5-mini';
  const client = new OpenAI({ apiKey, maxRetries: 0, timeout: 30_000 });
  // A single overall deadline covers both the initial call and the one correction pass.
  const controller = new AbortController();
  const abort = () => controller.abort();
  request.signal.addEventListener('abort', abort, { once: true });
  const deadline = setTimeout(abort, 45_000);
  try {
    const result = await getCritique(async (correction) => {
      const response = await client.responses.parse(
        {
          model,
          store: false,
          reasoning: { effort: 'low' },
          max_output_tokens: 7000,
          instructions: SYSTEM_PROMPT,
          input: [
            {
              role: 'user',
              content: [
                {
                  type: 'input_text',
                  text: `Critic mode: ${payload.mode}. Local measurements on the analysis proxy (not aesthetic conclusions): ${JSON.stringify(payload.technical)}.${correction ? ` CORRECTION: ${correction}` : ''}`
                },
                { type: 'input_image', image_url: payload.image, detail: 'high' }
              ]
            }
          ],
          text: { format: zodTextFormat(ModelCritique, 'photo_critique') }
        },
        { signal: controller.signal }
      );
      return response.output_parsed;
    });
    return json(result, { headers: noStore });
  } catch (error) {
    // Never log SDK exceptions: they can contain request bodies and image data.
    if (error instanceof Error && error.message === 'Invalid structured critique.') {
      console.warn('critique_validation_failed');
    }
    return failure(
      controller.signal.aborted
        ? 'Critique timed out. Try again; your photograph is still here.'
        : 'Critique couldn’t be completed. Please retry.',
      502
    );
  } finally {
    clearTimeout(deadline);
    request.signal.removeEventListener('abort', abort);
  }
};
