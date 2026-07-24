import { Inject, Logger } from '@nestjs/common';
import { CommandHandler, EventBus, ICommandHandler } from '@nestjs/cqrs';
import { BaseCommandHandler, UuidValueObject } from '@sisques-labs/nestjs-kit';

import { FeatureFlagAggregate } from '../../../domain/aggregates/feature-flag.aggregate';
import { FeatureFlagBuilder } from '../../../domain/builders/feature-flag.builder';
import {
  FEATURE_FLAG_WRITE_REPOSITORY,
  IFeatureFlagWriteRepository,
} from '../../../domain/repositories/write/feature-flag-write.repository';
import { AssertFeatureFlagKeyAvailableService } from '../../services/write/assert-feature-flag-key-available/assert-feature-flag-key-available.service';
import { CreateFeatureFlagCommand } from './create-feature-flag.command';

@CommandHandler(CreateFeatureFlagCommand)
export class CreateFeatureFlagCommandHandler
  extends BaseCommandHandler<CreateFeatureFlagCommand, FeatureFlagAggregate>
  implements ICommandHandler<CreateFeatureFlagCommand, string>
{
  private readonly logger = new Logger(CreateFeatureFlagCommandHandler.name);

  constructor(
    @Inject(FEATURE_FLAG_WRITE_REPOSITORY)
    private readonly featureFlagWriteRepository: IFeatureFlagWriteRepository,
    private readonly featureFlagBuilder: FeatureFlagBuilder,
    private readonly assertFeatureFlagKeyAvailableService: AssertFeatureFlagKeyAvailableService,
    eventBus: EventBus,
  ) {
    super(eventBus);
  }

  async execute(command: CreateFeatureFlagCommand): Promise<string> {
    await this.assertFeatureFlagKeyAvailableService.execute(
      command.tenantId.value,
      command.key.value,
    );

    const now = new Date();
    const flag = this.featureFlagBuilder
      .withId(UuidValueObject.generate().value)
      .withTenantId(command.tenantId.value)
      .withKey(command.key.value)
      .withName(command.name.value)
      .withDescription(command.description?.value ?? null)
      .withDevelopmentEnabled(false)
      .withStagingEnabled(false)
      .withProductionEnabled(false)
      .withArchived(false)
      .withCreatedAt(now)
      .withUpdatedAt(now)
      .build();

    flag.create();

    await this.featureFlagWriteRepository.save(flag);
    await this.publishEvents(flag);

    this.logger.log(
      `Feature flag created: tenantId=${flag.tenantId} key=${flag.key} id=${flag.id.value}`,
    );

    return flag.id.value;
  }
}
