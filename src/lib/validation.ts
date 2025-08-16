// src/lib/validation.ts
import * as z from 'zod'

export const finalizeSchema = z.object({
  cancellationId: z.string().uuid(),
  csrfToken: z.string().min(1),
  reasonKey: z.string().min(1),
  // You’re sending a JSON string (usage + detail). Keep it as a string.
  reasonText: z.string().optional().default(''),
})

export const downsellSchema = z.object({
  cancellationId: z.string().uuid(),
  csrfToken: z.string().min(1),
  reasonKey: z.string().min(1),     // e.g. "accepted_downsell"
  reasonText: z.string().optional().default(''),
})
