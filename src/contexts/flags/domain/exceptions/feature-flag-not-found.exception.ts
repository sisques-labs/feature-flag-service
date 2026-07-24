import { BaseException } from '@sisques-labs/nestjs-kit';

export class FeatureFlagNotFoundException extends BaseException {
  constructor(tenantId: string, key: string) {
    super(
      `Feature flag with key '${key}' was not found for tenant '${tenantId}'`,
    );
  }
}
