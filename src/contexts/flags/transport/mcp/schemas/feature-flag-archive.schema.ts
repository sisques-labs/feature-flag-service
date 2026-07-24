import { z } from 'zod';

export const featureFlagArchiveSchema = {
  tenantId: z.string().min(1).max(100),
  key: z.string().min(1).max(100),
};
