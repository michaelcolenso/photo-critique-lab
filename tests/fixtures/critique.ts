import type { PhotoCritique } from '../../src/lib/critique/schema';
export const region = {
  rect: { x: 0.72, y: 0.05, width: 0.2, height: 0.3 },
  label: 'Bright upper corner',
  reason: 'The pale area pulls attention away from the central subject.',
  confidence: 0.8
};
const score = (value: number, reason: string) => ({ value, reason });
export const critique: PhotoCritique = {
  verdict: 'MAYBE',
  thesis: 'A quiet central subject becomes stronger when the pale edge is given less space.',
  verdictReasons: ['The subject is readable, but the upper edge competes for attention.'],
  strengths: [
    {
      claim: 'A clear visual anchor',
      reason: 'The central shape separates from the muted background.'
    }
  ],
  weaknesses: [
    { claim: 'The bright corner competes', reason: 'The pale area draws the eye outward.', region }
  ],
  subject: {
    description: 'A central figure against a quiet background.',
    primaryRegion: {
      ...region,
      rect: { x: 0.3, y: 0.22, width: 0.4, height: 0.65 },
      label: 'Main subject'
    },
    visualAnchor: { x: 0.5, y: 0.4 }
  },
  distractions: [region],
  highlightRegions: [region],
  shadowRegions: [],
  crops: [
    {
      role: 'CONSERVATIVE',
      label: 'Keep the breathing room',
      rect: { x: 0.03, y: 0.02, width: 0.94, height: 0.94 },
      reason: 'Trim the border while retaining context.',
      preserves: ['Context'],
      sacrifices: ['A narrow edge'],
      confidence: 0.85
    },
    {
      role: 'STRONGEST',
      label: 'Bring the subject forward',
      rect: { x: 0.2, y: 0.12, width: 0.6, height: 0.8 },
      reason: 'Emphasize the figure with a tighter vertical frame.',
      preserves: ['Visual anchor'],
      sacrifices: ['Peripheral space'],
      confidence: 0.82
    },
    {
      role: 'WILDCARD',
      label: 'An intimate detail',
      rect: { x: 0.3, y: 0.22, width: 0.4, height: 0.4 },
      reason: 'Discover a graphic detail inside the original.',
      preserves: ['Central detail'],
      sacrifices: ['Wider narrative'],
      confidence: 0.6
    }
  ],
  scores: {
    composition: score(72, 'The anchor is clear but the pale edge competes.'),
    light: score(76, 'Soft contrast separates the central shape.'),
    moment: score(50, 'The image offers stillness rather than a decisive gesture.'),
    originality: score(58, 'The framing is familiar.'),
    technicalExecution: score(84, 'Edges are legible at the analysis scale.'),
    printPotential: score(70, 'Muted tones could hold together in a moderate print.')
  }
};
