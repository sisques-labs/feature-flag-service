import {
  BaseAggregate,
  BooleanValueObject,
  UuidValueObject,
} from '@sisques-labs/nestjs-kit';

import { FeatureFlagEnvironmentEnum } from '../enums/feature-flag-environment.enum';
import { FeatureFlagArchivedEvent } from '../events/feature-flag-archived/feature-flag-archived.event';
import { FeatureFlagCreatedEvent } from '../events/feature-flag-created/feature-flag-created.event';
import { FeatureFlagEnvironmentValueUpdatedEvent } from '../events/feature-flag-environment-value-updated/feature-flag-environment-value-updated.event';
import { IFeatureFlag } from '../interfaces/feature-flag.interface';
import { IFeatureFlagPrimitives } from '../primitives/feature-flag.primitives';
import { FeatureFlagDescriptionValueObject } from '../value-objects/feature-flag-description/feature-flag-description.vo';
import { FeatureFlagKeyValueObject } from '../value-objects/feature-flag-key/feature-flag-key.vo';
import { FeatureFlagNameValueObject } from '../value-objects/feature-flag-name/feature-flag-name.vo';
import { FeatureFlagTenantIdValueObject } from '../value-objects/feature-flag-tenant-id/feature-flag-tenant-id.vo';

export class FeatureFlagAggregate extends BaseAggregate {
  private readonly _id: UuidValueObject;
  private readonly _tenantId: FeatureFlagTenantIdValueObject;
  private readonly _key: FeatureFlagKeyValueObject;
  private _name: FeatureFlagNameValueObject;
  private _description: FeatureFlagDescriptionValueObject | null;
  private _developmentEnabled: BooleanValueObject;
  private _stagingEnabled: BooleanValueObject;
  private _productionEnabled: BooleanValueObject;
  private _archived: BooleanValueObject;

  constructor(props: IFeatureFlag) {
    super(props.createdAt, props.updatedAt);
    this._id = props.id;
    this._tenantId = props.tenantId;
    this._key = props.key;
    this._name = props.name;
    this._description = props.description;
    this._developmentEnabled = props.developmentEnabled;
    this._stagingEnabled = props.stagingEnabled;
    this._productionEnabled = props.productionEnabled;
    this._archived = props.archived;
  }

  public get id(): UuidValueObject {
    return this._id;
  }

  public get tenantId(): string {
    return this._tenantId.value;
  }

  public get key(): string {
    return this._key.value;
  }

  public get name(): string {
    return this._name.value;
  }

  public get description(): string | null {
    return this._description?.value ?? null;
  }

  public get developmentEnabled(): boolean {
    return this._developmentEnabled.value;
  }

  public get stagingEnabled(): boolean {
    return this._stagingEnabled.value;
  }

  public get productionEnabled(): boolean {
    return this._productionEnabled.value;
  }

  public get archived(): boolean {
    return this._archived.value;
  }

  public create(): void {
    this.apply(
      new FeatureFlagCreatedEvent(
        {
          aggregateRootId: this._id.value,
          aggregateRootType: FeatureFlagAggregate.name,
          entityId: this._id.value,
          entityType: FeatureFlagAggregate.name,
          eventType: FeatureFlagCreatedEvent.name,
        },
        this.toPrimitives(),
      ),
    );
  }

  public setEnvironmentValue(
    environment: FeatureFlagEnvironmentEnum,
    enabled: BooleanValueObject,
  ): void {
    switch (environment) {
      case FeatureFlagEnvironmentEnum.DEVELOPMENT:
        this._developmentEnabled = enabled;
        break;
      case FeatureFlagEnvironmentEnum.STAGING:
        this._stagingEnabled = enabled;
        break;
      case FeatureFlagEnvironmentEnum.PRODUCTION:
        this._productionEnabled = enabled;
        break;
    }
    this.touch();

    this.apply(
      new FeatureFlagEnvironmentValueUpdatedEvent(
        {
          aggregateRootId: this._id.value,
          aggregateRootType: FeatureFlagAggregate.name,
          entityId: this._id.value,
          entityType: FeatureFlagAggregate.name,
          eventType: FeatureFlagEnvironmentValueUpdatedEvent.name,
        },
        { ...this.toPrimitives(), environment },
      ),
    );
  }

  public archive(): void {
    this._archived = new BooleanValueObject(true);
    this.touch();

    this.apply(
      new FeatureFlagArchivedEvent(
        {
          aggregateRootId: this._id.value,
          aggregateRootType: FeatureFlagAggregate.name,
          entityId: this._id.value,
          entityType: FeatureFlagAggregate.name,
          eventType: FeatureFlagArchivedEvent.name,
        },
        this.toPrimitives(),
      ),
    );
  }

  public toPrimitives(): IFeatureFlagPrimitives {
    return {
      id: this._id.value,
      tenantId: this._tenantId.value,
      key: this._key.value,
      name: this._name.value,
      description: this._description?.value ?? null,
      developmentEnabled: this._developmentEnabled.value,
      stagingEnabled: this._stagingEnabled.value,
      productionEnabled: this._productionEnabled.value,
      archived: this._archived.value,
      createdAt: this.createdAt.value,
      updatedAt: this.updatedAt.value,
    };
  }
}
