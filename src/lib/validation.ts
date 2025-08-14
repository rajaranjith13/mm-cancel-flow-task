import * as z from 'zod'

export const finalizeSchema = z.object({
  reason: z.string().min(1, 'Reason is required'),
  comments: z.string().optional(),
})

export const downsellSchema = z.object({
  plan: z.enum(['monthly', 'annual']),
})
