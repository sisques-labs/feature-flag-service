import { IBaseEventData } from '@sisques-labs/nestjs-kit';

export interface IFeatureFlagEventData extends IBaseEventData {
  id: string;
  tenantId: string;
  key: string;
  name: string;
  description: string | null;
  developmentEnabled: boolean;
  stagingEnabled: boolean;
  productionEnabled: boolean;
  archived: boolean;
}
