import { Field, InputType } from '@nestjs/graphql';
import { BaseFindByCriteriaInput } from '@sisques-labs/nestjs-kit/graphql';
import { Type } from 'class-transformer';
import { IsArray, IsOptional, ValidateNested } from 'class-validator';

import { FeatureFlagFilterInput } from './feature-flag-filter.input';
import { FeatureFlagSortInput } from './feature-flag-sort.input';

@InputType('FeatureFlagFindByCriteriaInput')
export class FeatureFlagFindByCriteriaInput extends BaseFindByCriteriaInput {
  @Field(() => [FeatureFlagFilterInput], {
    nullable: true,
    description: 'The filters to find by — a tenantId filter is required',
    defaultValue: [],
  })
  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => FeatureFlagFilterInput)
  declare filters?: FeatureFlagFilterInput[];

  @Field(() => [FeatureFlagSortInput], {
    nullable: true,
    description: 'The sorts to find by',
    defaultValue: [],
  })
  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => FeatureFlagSortInput)
  declare sorts?: FeatureFlagSortInput[];
}
