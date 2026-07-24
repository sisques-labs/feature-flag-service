import { Inject, Logger } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';

import { FeatureFlagEnvironmentEnum } from '../../../domain/enums/feature-flag-environment.enum';
import {
  FEATURE_FLAG_READ_REPOSITORY,
  IFeatureFlagReadRepository,
} from '../../../domain/repositories/read/feature-flag-read.repository';
import { EvaluateFeatureFlagQuery } from './evaluate-feature-flag.query';

const ENVIRONMENT_FIELD: Record<
  FeatureFlagEnvironmentEnum,
  'developmentEnabled' | 'stagingEnabled' | 'productionEnabled'
> = {
  [FeatureFlagEnvironmentEnum.DEVELOPMENT]: 'developmentEnabled',
  [FeatureFlagEnvironmentEnum.STAGING]: 'stagingEnabled',
  [FeatureFlagEnvironmentEnum.PRODUCTION]: 'productionEnabled',
};

/**
 * Fail-safe by design: unlike every other handler in this context, this one
 * does NOT use an assert service. A missing or archived flag evaluates to
 * `false` — it never throws `FeatureFlagNotFoundException` — so a consumer's
 * request path never breaks because a flag hasn't been created yet.
 */
@QueryHandler(EvaluateFeatureFlagQuery)
export class EvaluateFeatureFlagQueryHandler implements IQueryHandler<
  EvaluateFeatureFlagQuery,
  boolean
> {
  private readonly logger = new Logger(EvaluateFeatureFlagQueryHandler.name);

  constructor(
    @Inject(FEATURE_FLAG_READ_REPOSITORY)
    private readonly featureFlagReadRepository: IFeatureFlagReadRepository,
  ) {}

  async execute(query: EvaluateFeatureFlagQuery): Promise<boolean> {
    this.logger.debug(
      `Evaluating feature flag: tenantId=${query.tenantId.value} key=${query.key.value} environment=${query.environment}`,
    );

    const flag = await this.featureFlagReadRepository.findByTenantAndKey(
      query.tenantId.value,
      query.key.value,
    );

    if (!flag || flag.archived) {
      return false;
    }

    return flag[ENVIRONMENT_FIELD[query.environment]];
  }
}
