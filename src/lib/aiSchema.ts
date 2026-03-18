import { z } from 'zod';

export const aiResponseSchema = z.object({
  ok: z.boolean(),
  analysis: z.string().optional(),
  level: z.string().optional(),
  summary: z.string().optional(),
  recommendations: z.array(z.string()).optional(),
  actions_7d: z.array(z.string()).optional(),
  actions_30d: z.array(z.string()).optional(),
  warning_signs: z.array(z.string()).optional(),
  error: z.string().optional(),
});

export type AiResponse = z.infer<typeof aiResponseSchema>;
