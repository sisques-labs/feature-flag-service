import { Injectable } from '@nestjs/common';

import { FeatureFlagAggregate } from '../../../../domain/aggregates/feature-flag.aggregate';
import { FeatureFlagBuilder } from '../../../../domain/builders/feature-flag.builder';
import { FeatureFlagViewModel } from '../../../../domain/view-models/feature-flag.view-model';
import { FeatureFlagTypeOrmEntity } from '../entities/feature-flag.entity';

@Injectable()
export class FeatureFlagTypeOrmMapper {
  constructor(private readonly featureFlagBuilder: FeatureFlagBuilder) {}

  toAggregate(entity: FeatureFlagTypeOrmEntity): FeatureFlagAggregate {
    return this.hydrate(entity).build();
  }

  toViewModel(entity: FeatureFlagTypeOrmEntity): FeatureFlagViewModel {
    return this.hydrate(entity).buildViewModel();
  }

  toEntity(aggregate: FeatureFlagAggregate): FeatureFlagTypeOrmEntity {
    const primitives = aggregate.toPrimitives();
    const entity = new FeatureFlagTypeOrmEntity();
    entity.id = primitives.id;
    entity.tenantId = primitives.tenantId;
    entity.key = primitives.key;
    entity.name = primitives.name;
    entity.description = primitives.description;
    entity.developmentEnabled = primitives.developmentEnabled;
    entity.stagingEnabled = primitives.stagingEnabled;
    entity.productionEnabled = primitives.productionEnabled;
    entity.archived = primitives.archived;
    entity.createdAt = primitives.createdAt;
    entity.updatedAt = primitives.updatedAt;
    return entity;
  }

  private hydrate(entity: FeatureFlagTypeOrmEntity): FeatureFlagBuilder {
    return this.featureFlagBuilder
      .withId(entity.id)
      .withTenantId(entity.tenantId)
      .withKey(entity.key)
      .withName(entity.name)
      .withDescription(entity.description)
      .withDevelopmentEnabled(entity.developmentEnabled)
      .withStagingEnabled(entity.stagingEnabled)
      .withProductionEnabled(entity.productionEnabled)
      .withArchived(entity.archived)
      .withCreatedAt(entity.createdAt)
      .withUpdatedAt(entity.updatedAt);
  }
}
