import { IBaseWriteRepository } from '@sisques-labs/nestjs-kit';

import { FeatureFlagAggregate } from '../../aggregates/feature-flag.aggregate';

export const FEATURE_FLAG_WRITE_REPOSITORY = Symbol(
  'FEATURE_FLAG_WRITE_REPOSITORY',
);

export interface IFeatureFlagWriteRepository extends IBaseWriteRepository<FeatureFlagAggregate> {
  findByTenantAndKey(
    tenantId: string,
    key: string,
  ): Promise<FeatureFlagAggregate | null>;
}
