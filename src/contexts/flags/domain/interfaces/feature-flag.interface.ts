import {
  BooleanValueObject,
  DateValueObject,
  UuidValueObject,
} from '@sisques-labs/nestjs-kit';

import { FeatureFlagDescriptionValueObject } from '../value-objects/feature-flag-description/feature-flag-description.vo';
import { FeatureFlagKeyValueObject } from '../value-objects/feature-flag-key/feature-flag-key.vo';
import { FeatureFlagNameValueObject } from '../value-objects/feature-flag-name/feature-flag-name.vo';
import { FeatureFlagTenantIdValueObject } from '../value-objects/feature-flag-tenant-id/feature-flag-tenant-id.vo';

export interface IFeatureFlag {
  id: UuidValueObject;
  tenantId: FeatureFlagTenantIdValueObject;
  key: FeatureFlagKeyValueObject;
  name: FeatureFlagNameValueObject;
  description: FeatureFlagDescriptionValueObject | null;
  developmentEnabled: BooleanValueObject;
  stagingEnabled: BooleanValueObject;
  productionEnabled: BooleanValueObject;
  archived: BooleanValueObject;
  createdAt: DateValueObject;
  updatedAt: DateValueObject;
}
