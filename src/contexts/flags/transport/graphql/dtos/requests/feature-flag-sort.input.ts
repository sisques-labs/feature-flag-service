import { InputType } from '@nestjs/graphql';
import { createSortInput } from '@sisques-labs/nestjs-kit/graphql';

import { FeatureFlagQueryableField } from '../../enums/feature-flag-queryable-field.enum';

@InputType('FeatureFlagSortInput')
export class FeatureFlagSortInput extends createSortInput(
  FeatureFlagQueryableField,
  'FeatureFlag',
) {}
