import { Inject, Logger } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { PaginatedResult } from '@sisques-labs/nestjs-kit';

import {
  FEATURE_FLAG_READ_REPOSITORY,
  IFeatureFlagReadRepository,
} from '../../../domain/repositories/read/feature-flag-read.repository';
import { FeatureFlagViewModel } from '../../../domain/view-models/feature-flag.view-model';
import { FeatureFlagFindByCriteriaQuery } from './feature-flag-find-by-criteria.query';

@QueryHandler(FeatureFlagFindByCriteriaQuery)
export class FeatureFlagFindByCriteriaQueryHandler implements IQueryHandler<
  FeatureFlagFindByCriteriaQuery,
  PaginatedResult<FeatureFlagViewModel>
> {
  private readonly logger = new Logger(
    FeatureFlagFindByCriteriaQueryHandler.name,
  );

  constructor(
    @Inject(FEATURE_FLAG_READ_REPOSITORY)
    private readonly featureFlagReadRepository: IFeatureFlagReadRepository,
  ) {}

  async execute(
    query: FeatureFlagFindByCriteriaQuery,
  ): Promise<PaginatedResult<FeatureFlagViewModel>> {
    this.logger.debug('Finding feature flags by criteria');

    return this.featureFlagReadRepository.findByCriteria(query.criteria);
  }
}
