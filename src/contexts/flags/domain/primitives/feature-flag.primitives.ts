import { BasePrimitives } from '@sisques-labs/nestjs-kit';

export type IFeatureFlagPrimitives = BasePrimitives & {
  tenantId: string;
  key: string;
  name: string;
  description: string | null;
  developmentEnabled: boolean;
  stagingEnabled: boolean;
  productionEnabled: boolean;
  archived: boolean;
};
