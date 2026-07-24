import { z } from 'zod';

import { FeatureFlagEnvironmentEnum } from '../../../domain/enums/feature-flag-environment.enum';

export const featureFlagEvaluateSchema = {
  tenantId: z.string().min(1).max(100),
  key: z.string().min(1).max(100),
  environment: z.nativeEnum(FeatureFlagEnvironmentEnum),
};
