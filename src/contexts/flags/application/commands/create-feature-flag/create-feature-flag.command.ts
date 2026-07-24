import { FeatureFlagDescriptionValueObject } from '../../../domain/value-objects/feature-flag-description/feature-flag-description.vo';
import { FeatureFlagKeyValueObject } from '../../../domain/value-objects/feature-flag-key/feature-flag-key.vo';
import { FeatureFlagNameValueObject } from '../../../domain/value-objects/feature-flag-name/feature-flag-name.vo';
import { FeatureFlagTenantIdValueObject } from '../../../domain/value-objects/feature-flag-tenant-id/feature-flag-tenant-id.vo';

export interface CreateFeatureFlagCommandInput {
  tenantId: string;
  key: string;
  name: string;
  description?: string | null;
}

export class CreateFeatureFlagCommand {
  public readonly tenantId: FeatureFlagTenantIdValueObject;
  public readonly key: FeatureFlagKeyValueObject;
  public readonly name: FeatureFlagNameValueObject;
  public readonly description: FeatureFlagDescriptionValueObject | null;

  constructor(input: CreateFeatureFlagCommandInput) {
    this.tenantId = new FeatureFlagTenantIdValueObject(input.tenantId);
    this.key = new FeatureFlagKeyValueObject(input.key);
    this.name = new FeatureFlagNameValueObject(input.name);
    this.description = input.description
      ? new FeatureFlagDescriptionValueObject(input.description)
      : null;
  }
}
