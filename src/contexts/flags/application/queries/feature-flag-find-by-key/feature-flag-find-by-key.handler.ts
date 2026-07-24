import { Logger } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';

import { FeatureFlagViewModel } from '../../../domain/view-models/feature-flag.view-model';
import { AssertFeatureFlagViewModelExistsService } from '../../services/read/assert-feature-flag-view-model-exists/assert-feature-flag-view-model-exists.service';
import { FeatureFlagFindByKeyQuery } from './feature-flag-find-by-key.query';

@QueryHandler(FeatureFlagFindByKeyQuery)
export class FeatureFlagFindByKeyQueryHandler implements IQueryHandler<
  FeatureFlagFindByKeyQuery,
  FeatureFlagViewModel
> {
  private readonly logger = new Logger(FeatureFlagFindByKeyQueryHandler.name);

  constructor(
    private readonly assertFeatureFlagViewModelExistsService: AssertFeatureFlagViewModelExistsService,
  ) {}

  async execute(
    query: FeatureFlagFindByKeyQuery,
  ): Promise<FeatureFlagViewModel> {
    this.logger.debug(
      `Finding feature flag: tenantId=${query.tenantId.value} key=${query.key.value}`,
    );

    return this.assertFeatureFlagViewModelExistsService.execute(
      query.tenantId.value,
      query.key.value,
    );
  }
}
