import { z } from 'zod';

export const featureFlagCreateSchema = {
  tenantId: z.string().min(1).max(100),
  key: z
    .string()
    .min(1)
    .max(100)
    .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, 'must be kebab-case'),
  name: z.string().min(1).max(150),
  description: z.string().max(500).optional(),
};
