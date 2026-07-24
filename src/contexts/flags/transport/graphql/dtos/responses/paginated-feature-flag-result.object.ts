import { Field, ObjectType } from '@nestjs/graphql';
import { BasePaginatedResultDto } from '@sisques-labs/nestjs-kit/graphql';

import { FeatureFlagObject } from './feature-flag.object';

@ObjectType('PaginatedFeatureFlagResult')
export class PaginatedFeatureFlagResultObject extends BasePaginatedResultDto {
  @Field(() => [FeatureFlagObject])
  items!: FeatureFlagObject[];
}
