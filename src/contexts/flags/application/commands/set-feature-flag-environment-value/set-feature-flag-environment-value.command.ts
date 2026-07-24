import { FeatureFlagEnvironmentEnum } from '../../../domain/enums/feature-flag-environment.enum';
import { FeatureFlagKeyValueObject } from '../../../domain/value-objects/feature-flag-key/feature-flag-key.vo';
import { FeatureFlagTenantIdValueObject } from '../../../domain/value-objects/feature-flag-tenant-id/feature-flag-tenant-id.vo';

export interface SetFeatureFlagEnvironmentValueCommandInput {
  tenantId: string;
  key: string;
  environment: FeatureFlagEnvironmentEnum;
  enabled: boolean;
}

export class SetFeatureFlagEnvironmentValueCommand {
  public readonly tenantId: FeatureFlagTenantIdValueObject;
  public readonly key: FeatureFlagKeyValueObject;
  public readonly environment: FeatureFlagEnvironmentEnum;
  public readonly enabled: boolean;

  constructor(input: SetFeatureFlagEnvironmentValueCommandInput) {
    this.tenantId = new FeatureFlagTenantIdValueObject(input.tenantId);
    this.key = new FeatureFlagKeyValueObject(input.key);
    this.environment = input.environment;
    this.enabled = input.enabled;
  }
}
