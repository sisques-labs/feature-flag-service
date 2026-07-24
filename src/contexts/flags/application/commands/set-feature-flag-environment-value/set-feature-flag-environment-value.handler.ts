import { Inject, Logger } from '@nestjs/common';
import { CommandHandler, EventBus, ICommandHandler } from '@nestjs/cqrs';
import {
  BaseCommandHandler,
  BooleanValueObject,
} from '@sisques-labs/nestjs-kit';

import { FeatureFlagAggregate } from '../../../domain/aggregates/feature-flag.aggregate';
import {
  FEATURE_FLAG_WRITE_REPOSITORY,
  IFeatureFlagWriteRepository,
} from '../../../domain/repositories/write/feature-flag-write.repository';
import { AssertFeatureFlagExistsService } from '../../services/write/assert-feature-flag-exists/assert-feature-flag-exists.service';
import { SetFeatureFlagEnvironmentValueCommand } from './set-feature-flag-environment-value.command';

@CommandHandler(SetFeatureFlagEnvironmentValueCommand)
export class SetFeatureFlagEnvironmentValueCommandHandler
  extends BaseCommandHandler<
    SetFeatureFlagEnvironmentValueCommand,
    FeatureFlagAggregate
  >
  implements ICommandHandler<SetFeatureFlagEnvironmentValueCommand, void>
{
  private readonly logger = new Logger(
    SetFeatureFlagEnvironmentValueCommandHandler.name,
  );

  constructor(
    @Inject(FEATURE_FLAG_WRITE_REPOSITORY)
    private readonly featureFlagWriteRepository: IFeatureFlagWriteRepository,
    private readonly assertFeatureFlagExistsService: AssertFeatureFlagExistsService,
    eventBus: EventBus,
  ) {
    super(eventBus);
  }

  async execute(command: SetFeatureFlagEnvironmentValueCommand): Promise<void> {
    const flag = await this.assertFeatureFlagExistsService.execute(
      command.tenantId.value,
      command.key.value,
    );

    flag.setEnvironmentValue(
      command.environment,
      new BooleanValueObject(command.enabled),
    );

    await this.featureFlagWriteRepository.save(flag);
    await this.publishEvents(flag);

    this.logger.log(
      `Feature flag environment value set: tenantId=${flag.tenantId} key=${flag.key} environment=${command.environment} enabled=${command.enabled}`,
    );
  }
}
