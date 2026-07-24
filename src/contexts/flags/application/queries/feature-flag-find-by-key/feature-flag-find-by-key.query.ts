import { FeatureFlagKeyValueObject } from '../../../domain/value-objects/feature-flag-key/feature-flag-key.vo';
import { FeatureFlagTenantIdValueObject } from '../../../domain/value-objects/feature-flag-tenant-id/feature-flag-tenant-id.vo';

export interface FeatureFlagFindByKeyQueryInput {
  tenantId: string;
  key: string;
}

export class FeatureFlagFindByKeyQuery {
  public readonly tenantId: FeatureFlagTenantIdValueObject;
  public readonly key: FeatureFlagKeyValueObject;

  constructor(input: FeatureFlagFindByKeyQueryInput) {
    this.tenantId = new FeatureFlagTenantIdValueObject(input.tenantId);
    this.key = new FeatureFlagKeyValueObject(input.key);
  }
}
