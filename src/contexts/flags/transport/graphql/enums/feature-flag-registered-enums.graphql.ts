import { registerEnumType } from '@nestjs/graphql';

import { FeatureFlagEnvironmentEnum } from '../../../domain/enums/feature-flag-environment.enum';
import { FeatureFlagQueryableField } from './feature-flag-queryable-field.enum';

const registeredFeatureFlagEnums = [
  {
    enum: FeatureFlagEnvironmentEnum,
    name: 'FeatureFlagEnvironment',
    description: 'The deployment environment a flag value applies to',
  },
  {
    enum: FeatureFlagQueryableField,
    name: 'FeatureFlagQueryableFieldEnum',
    description: 'Fields that can be used to filter/sort feature flags',
  },
];

for (const {
  enum: enumType,
  name,
  description,
} of registeredFeatureFlagEnums) {
  registerEnumType(enumType, { name, description });
}
