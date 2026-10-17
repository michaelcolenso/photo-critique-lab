import { z } from 'zod';

export const Point = z.object({ x: z.number().min(0).max(1), y: z.number().min(0).max(1) });
export const RectSchema = z.object({
  x: z.number().min(0).max(1),
  y: z.number().min(0).max(1),
  width: z.number().gt(0).max(1),
  height: z.number().gt(0).max(1)
});
export type Rect = z.infer<typeof RectSchema>;
export const boundedRect = (r: Rect) => r.x + r.width <= 1 + 1e-9 && r.y + r.height <= 1 + 1e-9;
export const Region = z.object({
  rect: RectSchema.refine(boundedRect, 'Region exceeds photograph'),
  label: z.string().min(1).max(120),
  reason: z.string().min(1).max(600),
  confidence: z.number().min(0).max(1)
});
export type Region = z.infer<typeof Region>;
export const ROLES = ['CONSERVATIVE', 'STRONGEST', 'WILDCARD'] as const;
export type CropRole = (typeof ROLES)[number];
export const CropProposal = z.object({
  role: z.enum(ROLES),
  label: z.string().min(1).max(100),
  rect: RectSchema.refine(
    (r) => boundedRect(r) && r.width >= 0.2 && r.height >= 0.2,
    'Crop exceeds bounds or minimum size'
  ),
  reason: z.string().min(1).max(800),
  preserves: z.array(z.string().max(250)).max(5),
  sacrifices: z.array(z.string().max(250)).max(5),
  confidence: z.number().min(0).max(1)
});
export type CropProposal = z.infer<typeof CropProposal>;
const Score = z.object({
  value: z.number().int().min(0).max(100),
  reason: z.string().min(1).max(600)
});
export const Scores = z.object({
  composition: Score,
  light: Score,
  moment: Score,
  originality: Score,
  technicalExecution: Score,
  printPotential: Score
});
export const CritiqueBody = z.object({
  verdict: z.enum(['KEEP', 'MAYBE', 'CUT']),
  thesis: z.string().min(1).max(1200),
  verdictReasons: z.array(z.string().min(1).max(600)).min(1).max(3),
  strengths: z.array(z.object({ claim: z.string().max(250), reason: z.string().max(600) })).max(5),
  weaknesses: z
    .array(
      z.object({
        claim: z.string().max(250),
        reason: z.string().max(600),
        region: Region.nullish()
      })
    )
    .max(5),
  subject: z.object({
    description: z.string().max(600),
    primaryRegion: Region.nullish(),
    visualAnchor: Point.nullish()
  }),
  distractions: z.array(Region).max(6),
  highlightRegions: z.array(Region).max(4),
  shadowRegions: z.array(Region).max(4),
  scores: Scores
});
export const PhotoCritique = CritiqueBody.extend({
  crops: z
    .array(CropProposal)
    .length(3)
    .refine(
      (crops) => new Set(crops.map((c) => c.role)).size === 3,
      'Exactly one crop per role is required'
    )
});
export type PhotoCritique = z.infer<typeof PhotoCritique>;
// Optional fields must be required + nullable in OpenAI strict Structured Outputs.
const ModelRegion = z.object({
  rect: RectSchema,
  label: z.string(),
  reason: z.string(),
  confidence: z.number().min(0).max(1)
});
export const ModelCritique = CritiqueBody.extend({
  weaknesses: z
    .array(z.object({ claim: z.string(), reason: z.string(), region: ModelRegion.nullable() }))
    .max(5),
  subject: z.object({
    description: z.string(),
    primaryRegion: ModelRegion.nullable(),
    visualAnchor: Point.nullable()
  }),
  distractions: z.array(ModelRegion).max(6),
  highlightRegions: z.array(ModelRegion).max(4),
  shadowRegions: z.array(ModelRegion).max(4),
  crops: z.array(CropProposal.extend({ rect: RectSchema })).length(3)
});
export const CriticMode = z.enum(['portfolio', 'editorial', 'fine-art', 'documentary', 'social']);
export type CriticMode = z.infer<typeof CriticMode>;
const bins = z.array(z.number().int().nonnegative()).length(256);
export const LocalAnalysisSchema = z.object({
  luminance: z.object({
    mean: z.number().min(0).max(255),
    p05: z.number().min(0).max(255),
    p50: z.number().min(0).max(255),
    p95: z.number().min(0).max(255)
  }),
  clipping: z.object({
    shadowFraction: z.number().min(0).max(1),
    highlightFraction: z.number().min(0).max(1)
  }),
  sharpness: z.object({ global: z.number().nonnegative() }),
  histogram: z.object({ luminance: bins, red: bins, green: bins, blue: bins })
});
export type LocalAnalysis = z.infer<typeof LocalAnalysisSchema>;
