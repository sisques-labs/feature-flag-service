import { BaseException } from '@sisques-labs/nestjs-kit';

export class FeatureFlagKeyAlreadyExistsException extends BaseException {
  constructor(tenantId: string, key: string) {
    super(
      `A feature flag with key '${key}' already exists for tenant '${tenantId}'`,
    );
  }
}
