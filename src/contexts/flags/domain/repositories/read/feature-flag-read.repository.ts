import { IBaseReadRepository } from '@sisques-labs/nestjs-kit';

import { FeatureFlagViewModel } from '../../view-models/feature-flag.view-model';

export const FEATURE_FLAG_READ_REPOSITORY = Symbol(
  'FEATURE_FLAG_READ_REPOSITORY',
);

export interface IFeatureFlagReadRepository extends IBaseReadRepository<FeatureFlagViewModel> {
  /**
   * Direct indexed lookup used by the hot evaluation path and by-key reads —
   * bypasses the generic Criteria machinery.
   */
  findByTenantAndKey(
    tenantId: string,
    key: string,
  ): Promise<FeatureFlagViewModel | null>;
}
