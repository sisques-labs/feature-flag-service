import { InputType } from '@nestjs/graphql';
import { createFilterInput } from '@sisques-labs/nestjs-kit/graphql';

import { FeatureFlagQueryableField } from '../../enums/feature-flag-queryable-field.enum';

@InputType('FeatureFlagFilterInput')
export class FeatureFlagFilterInput extends createFilterInput(
  FeatureFlagQueryableField,
  'FeatureFlag',
) {}
