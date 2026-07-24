import { Inject, Injectable } from '@nestjs/common';

import { FeatureFlagKeyAlreadyExistsException } from '../../../../domain/exceptions/feature-flag-key-already-exists.exception';
import {
  FEATURE_FLAG_WRITE_REPOSITORY,
  IFeatureFlagWriteRepository,
} from '../../../../domain/repositories/write/feature-flag-write.repository';

@Injectable()
export class AssertFeatureFlagKeyAvailableService {
  constructor(
    @Inject(FEATURE_FLAG_WRITE_REPOSITORY)
    private readonly featureFlagWriteRepository: IFeatureFlagWriteRepository,
  ) {}

  async execute(tenantId: string, key: string): Promise<void> {
    const existing = await this.featureFlagWriteRepository.findByTenantAndKey(
      tenantId,
      key,
    );

    if (existing) {
      throw new FeatureFlagKeyAlreadyExistsException(tenantId, key);
    }
  }
}
