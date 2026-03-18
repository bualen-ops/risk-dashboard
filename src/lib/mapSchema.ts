import { z } from 'zod';

export const mapPointSchema = z.object({
  risk_code: z.string().min(1),
  risk_name: z.string().optional().default(''),
  probability: z.number().finite(),
  impact: z.number().finite(),
  score: z.number().finite().optional(),
});

export const mapResponseSchema = z.object({
  items: z.array(mapPointSchema),
});

export type MapPoint = z.infer<typeof mapPointSchema>;

