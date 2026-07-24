import { Inject, Logger } from '@nestjs/common';
import { CommandHandler, EventBus, ICommandHandler } from '@nestjs/cqrs';
import { BaseCommandHandler } from '@sisques-labs/nestjs-kit';

import { FeatureFlagAggregate } from '../../../domain/aggregates/feature-flag.aggregate';
import {
  FEATURE_FLAG_WRITE_REPOSITORY,
  IFeatureFlagWriteRepository,
} from '../../../domain/repositories/write/feature-flag-write.repository';
import { AssertFeatureFlagExistsService } from '../../services/write/assert-feature-flag-exists/assert-feature-flag-exists.service';
import { ArchiveFeatureFlagCommand } from './archive-feature-flag.command';

@CommandHandler(ArchiveFeatureFlagCommand)
export class ArchiveFeatureFlagCommandHandler
  extends BaseCommandHandler<ArchiveFeatureFlagCommand, FeatureFlagAggregate>
  implements ICommandHandler<ArchiveFeatureFlagCommand, void>
{
  private readonly logger = new Logger(ArchiveFeatureFlagCommandHandler.name);

  constructor(
    @Inject(FEATURE_FLAG_WRITE_REPOSITORY)
    private readonly featureFlagWriteRepository: IFeatureFlagWriteRepository,
    private readonly assertFeatureFlagExistsService: AssertFeatureFlagExistsService,
    eventBus: EventBus,
  ) {
    super(eventBus);
  }

  async execute(command: ArchiveFeatureFlagCommand): Promise<void> {
    const flag = await this.assertFeatureFlagExistsService.execute(
      command.tenantId.value,
      command.key.value,
    );

    flag.archive();

    await this.featureFlagWriteRepository.save(flag);
    await this.publishEvents(flag);

    this.logger.log(
      `Feature flag archived: tenantId=${flag.tenantId} key=${flag.key}`,
    );
  }
}
