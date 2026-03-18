import { z } from 'zod';

export const requestRowSchema = z.object({
  row_number: z.number().int().positive(),
  timestamp: z.string().default(''),
  user_chat_id: z.string().default(''),
  user_name: z.string().default(''),
  request_type: z.string().default(''),
  risk_code: z.string().default(''),
  request_text: z.string().default(''),
  status: z.string().default(''),
  response_text: z.string().default(''),
  response_at: z.string().default(''),
});

export type RequestRow = z.infer<typeof requestRowSchema>;

export const createRequestSchema = z.object({
  user_name: z.string().trim().min(1).optional(),
  request_type: z.string().trim().min(1).default('WEB'),
  risk_code: z.string().trim().default(''),
  request_text: z.string().trim().min(1),
});

export const answerRequestSchema = z.object({
  row_number: z.number().int().positive(),
  response_text: z.string().trim().min(1),
});

