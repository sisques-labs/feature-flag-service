import { FilterFieldRegistry } from '@sisques-labs/nestjs-kit';

import { FeatureFlagQueryableField } from '../enums/feature-flag-queryable-field.enum';

export const featureFlagFilterableFields: FilterFieldRegistry<FeatureFlagQueryableField> =
  {
    [FeatureFlagQueryableField.TENANT_ID]: { type: 'string' },
    [FeatureFlagQueryableField.KEY]: { type: 'string' },
    [FeatureFlagQueryableField.NAME]: { type: 'string' },
    [FeatureFlagQueryableField.ARCHIVED]: { type: 'boolean' },
    [FeatureFlagQueryableField.DEVELOPMENT_ENABLED]: { type: 'boolean' },
    [FeatureFlagQueryableField.STAGING_ENABLED]: { type: 'boolean' },
    [FeatureFlagQueryableField.PRODUCTION_ENABLED]: { type: 'boolean' },
  };
