import { FeatureFlagKeyValueObject } from '../../../domain/value-objects/feature-flag-key/feature-flag-key.vo';
import { FeatureFlagTenantIdValueObject } from '../../../domain/value-objects/feature-flag-tenant-id/feature-flag-tenant-id.vo';

export interface ArchiveFeatureFlagCommandInput {
  tenantId: string;
  key: string;
}

export class ArchiveFeatureFlagCommand {
  public readonly tenantId: FeatureFlagTenantIdValueObject;
  public readonly key: FeatureFlagKeyValueObject;

  constructor(input: ArchiveFeatureFlagCommandInput) {
    this.tenantId = new FeatureFlagTenantIdValueObject(input.tenantId);
    this.key = new FeatureFlagKeyValueObject(input.key);
  }
}
