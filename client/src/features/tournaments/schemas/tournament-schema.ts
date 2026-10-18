import { z } from 'zod'

export const createTournamentSchema = z.object({
  name: z
    .string()
    .trim()
    .min(3, 'Name must be at least 3 characters')
    .max(150, 'Name is too long'),
  initialSeconds: z.coerce
    .number()
    .int('Initial time must be a whole number')
    .min(60, 'Minimum initial time is 60 seconds')
    .max(7200, 'Maximum initial time is 7200 seconds'),
  incrementSeconds: z.coerce
    .number()
    .int('Increment must be a whole number')
    .min(0, 'Increment cannot be negative')
    .max(60, 'Maximum increment is 60 seconds'),
  startsAt: z
    .string()
    .min(1, 'Start time is required')
    .refine((value) => !Number.isNaN(new Date(value).getTime()), {
      message: 'Enter a valid start time',
    }),
})

export const updateTournamentSchema = createTournamentSchema.extend({
  status: z.enum(['DRAFT', 'OPEN', 'ONGOING', 'COMPLETED']),
})

export type CreateTournamentFormValues = z.infer<typeof createTournamentSchema>
export type UpdateTournamentFormValues = z.infer<typeof updateTournamentSchema>
export type CreateTournamentFormInput = z.input<typeof createTournamentSchema>
export type UpdateTournamentFormInput = z.input<typeof updateTournamentSchema>
