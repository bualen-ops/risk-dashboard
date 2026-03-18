import { z } from 'zod';

export const dynamicsPointSchema = z.object({
  risk_code: z.string().min(1),
  risk_name: z.string().optional().default(''),
  ts: z.string().datetime(),
  probability: z.number().finite(),
  impact: z.number().finite(),
  score: z.number().finite().optional(),
});

export const dynamicsResponseSchema = z.object({
  items: z.array(dynamicsPointSchema),
});

export type DynamicsPoint = z.infer<typeof dynamicsPointSchema>;

