import { Inject, Injectable } from '@nestjs/common';

import { FeatureFlagNotFoundException } from '../../../../domain/exceptions/feature-flag-not-found.exception';
import {
  FEATURE_FLAG_READ_REPOSITORY,
  IFeatureFlagReadRepository,
} from '../../../../domain/repositories/read/feature-flag-read.repository';
import { FeatureFlagViewModel } from '../../../../domain/view-models/feature-flag.view-model';

@Injectable()
export class AssertFeatureFlagViewModelExistsService {
  constructor(
    @Inject(FEATURE_FLAG_READ_REPOSITORY)
    private readonly featureFlagReadRepository: IFeatureFlagReadRepository,
  ) {}

  async execute(tenantId: string, key: string): Promise<FeatureFlagViewModel> {
    const flag = await this.featureFlagReadRepository.findByTenantAndKey(
      tenantId,
      key,
    );

    if (!flag) {
      throw new FeatureFlagNotFoundException(tenantId, key);
    }

    return flag;
  }
}
