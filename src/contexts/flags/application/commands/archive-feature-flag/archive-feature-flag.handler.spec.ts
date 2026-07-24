import { EventBus } from '@nestjs/cqrs';

import { FeatureFlagBuilder } from '../../../domain/builders/feature-flag.builder';
import { IFeatureFlagWriteRepository } from '../../../domain/repositories/write/feature-flag-write.repository';
import { AssertFeatureFlagExistsService } from '../../services/write/assert-feature-flag-exists/assert-feature-flag-exists.service';
import { ArchiveFeatureFlagCommand } from './archive-feature-flag.command';
import { ArchiveFeatureFlagCommandHandler } from './archive-feature-flag.handler';

function buildFlag() {
  const now = new Date();
  return new FeatureFlagBuilder()
    .withId('9f4a7e9e-2f1a-4c8b-9d3a-1a2b3c4d5e6f')
    .withTenantId('tenant-1')
    .withKey('new-checkout')
    .withName('New Checkout')
    .withCreatedAt(now)
    .withUpdatedAt(now)
    .build();
}

describe('ArchiveFeatureFlagCommandHandler', () => {
  function buildHandler(flag: unknown) {
    const writeRepository: jest.Mocked<IFeatureFlagWriteRepository> = {
      findByTenantAndKey: jest.fn(),
      findById: jest.fn(),
      findByCriteria: jest.fn(),
      save: jest.fn().mockImplementation((f) => Promise.resolve(f)),
      delete: jest.fn(),
    };
    const assertExists = {
      execute: jest.fn().mockResolvedValue(flag),
    } as unknown as jest.Mocked<AssertFeatureFlagExistsService>;
    const eventBus = {
      publishAll: jest.fn(),
    } as unknown as jest.Mocked<EventBus>;

    return {
      handler: new ArchiveFeatureFlagCommandHandler(
        writeRepository,
        assertExists,
        eventBus,
      ),
      writeRepository,
    };
  }

  it('archives the flag and saves it', async () => {
    const flag = buildFlag();
    const { handler, writeRepository } = buildHandler(flag);

    await handler.execute(
      new ArchiveFeatureFlagCommand({
        tenantId: 'tenant-1',
        key: 'new-checkout',
      }),
    );

    expect(flag.archived).toBe(true);
    expect(writeRepository.save).toHaveBeenCalledWith(flag);
  });

  it('is idempotent when the flag is already archived', async () => {
    const flag = buildFlag();
    flag.archive();
    const { handler, writeRepository } = buildHandler(flag);

    await handler.execute(
      new ArchiveFeatureFlagCommand({
        tenantId: 'tenant-1',
        key: 'new-checkout',
      }),
    );

    expect(flag.archived).toBe(true);
    expect(writeRepository.save).toHaveBeenCalledWith(flag);
  });
});
