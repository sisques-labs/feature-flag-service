import { Inject, Injectable } from '@nestjs/common';

import { FeatureFlagAggregate } from '../../../../domain/aggregates/feature-flag.aggregate';
import { FeatureFlagNotFoundException } from '../../../../domain/exceptions/feature-flag-not-found.exception';
import {
  FEATURE_FLAG_WRITE_REPOSITORY,
  IFeatureFlagWriteRepository,
} from '../../../../domain/repositories/write/feature-flag-write.repository';

@Injectable()
export class AssertFeatureFlagExistsService {
  constructor(
    @Inject(FEATURE_FLAG_WRITE_REPOSITORY)
    private readonly featureFlagWriteRepository: IFeatureFlagWriteRepository,
  ) {}

  async execute(tenantId: string, key: string): Promise<FeatureFlagAggregate> {
    const flag = await this.featureFlagWriteRepository.findByTenantAndKey(
      tenantId,
      key,
    );

    if (!flag) {
      throw new FeatureFlagNotFoundException(tenantId, key);
    }

    return flag;
  }
}
