import { z } from 'zod';

import { FeatureFlagEnvironmentEnum } from '../../../domain/enums/feature-flag-environment.enum';

export const featureFlagSetEnvironmentValueSchema = {
  tenantId: z.string().min(1).max(100),
  key: z.string().min(1).max(100),
  environment: z.nativeEnum(FeatureFlagEnvironmentEnum),
  enabled: z.boolean(),
};
