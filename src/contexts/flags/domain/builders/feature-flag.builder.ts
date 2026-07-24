import {
  BaseBuilder,
  BooleanValueObject,
  DateValueObject,
  FieldIsRequiredException,
  UuidValueObject,
} from '@sisques-labs/nestjs-kit';
import { Injectable } from '@nestjs/common';

import { FeatureFlagAggregate } from '../aggregates/feature-flag.aggregate';
import { FeatureFlagDescriptionValueObject } from '../value-objects/feature-flag-description/feature-flag-description.vo';
import { FeatureFlagKeyValueObject } from '../value-objects/feature-flag-key/feature-flag-key.vo';
import { FeatureFlagNameValueObject } from '../value-objects/feature-flag-name/feature-flag-name.vo';
import { FeatureFlagTenantIdValueObject } from '../value-objects/feature-flag-tenant-id/feature-flag-tenant-id.vo';
import { FeatureFlagViewModel } from '../view-models/feature-flag.view-model';

@Injectable()
export class FeatureFlagBuilder extends BaseBuilder<
  FeatureFlagAggregate,
  FeatureFlagViewModel
> {
  private _tenantId!: string;
  private _key!: string;
  private _name!: string;
  private _description: string | null = null;
  private _developmentEnabled = false;
  private _stagingEnabled = false;
  private _productionEnabled = false;
  private _archived = false;

  withTenantId(tenantId: string): this {
    this._tenantId = tenantId;
    return this;
  }

  withKey(key: string): this {
    this._key = key;
    return this;
  }

  withName(name: string): this {
    this._name = name;
    return this;
  }

  withDescription(description: string | null): this {
    this._description = description;
    return this;
  }

  withDevelopmentEnabled(enabled: boolean): this {
    this._developmentEnabled = enabled;
    return this;
  }

  withStagingEnabled(enabled: boolean): this {
    this._stagingEnabled = enabled;
    return this;
  }

  withProductionEnabled(enabled: boolean): this {
    this._productionEnabled = enabled;
    return this;
  }

  withArchived(archived: boolean): this {
    this._archived = archived;
    return this;
  }

  validate(): void {
    super.validate();
    if (!this._tenantId) {
      throw new FieldIsRequiredException('tenantId');
    }
    if (!this._key) {
      throw new FieldIsRequiredException('key');
    }
    if (!this._name) {
      throw new FieldIsRequiredException('name');
    }
  }

  build(): FeatureFlagAggregate {
    this.validate();
    return new FeatureFlagAggregate({
      id: new UuidValueObject(this._id),
      tenantId: new FeatureFlagTenantIdValueObject(this._tenantId),
      key: new FeatureFlagKeyValueObject(this._key),
      name: new FeatureFlagNameValueObject(this._name),
      description:
        this._description != null
          ? new FeatureFlagDescriptionValueObject(this._description)
          : null,
      developmentEnabled: new BooleanValueObject(this._developmentEnabled),
      stagingEnabled: new BooleanValueObject(this._stagingEnabled),
      productionEnabled: new BooleanValueObject(this._productionEnabled),
      archived: new BooleanValueObject(this._archived),
      createdAt: new DateValueObject(this._createdAt),
      updatedAt: new DateValueObject(this._updatedAt),
    });
  }

  buildViewModel(): FeatureFlagViewModel {
    this.validate();
    return new FeatureFlagViewModel({
      id: this._id,
      tenantId: this._tenantId,
      key: this._key,
      name: this._name,
      description: this._description,
      developmentEnabled: this._developmentEnabled,
      stagingEnabled: this._stagingEnabled,
      productionEnabled: this._productionEnabled,
      archived: this._archived,
      createdAt: this._createdAt,
      updatedAt: this._updatedAt,
    });
  }
}
