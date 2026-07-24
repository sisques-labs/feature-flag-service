import { EventBus } from '@nestjs/cqrs';

import { FeatureFlagBuilder } from '../../../domain/builders/feature-flag.builder';
import { FeatureFlagEnvironmentEnum } from '../../../domain/enums/feature-flag-environment.enum';
import { FeatureFlagNotFoundException } from '../../../domain/exceptions/feature-flag-not-found.exception';
import { IFeatureFlagWriteRepository } from '../../../domain/repositories/write/feature-flag-write.repository';
import { AssertFeatureFlagExistsService } from '../../services/write/assert-feature-flag-exists/assert-feature-flag-exists.service';
import { SetFeatureFlagEnvironmentValueCommand } from './set-feature-flag-environment-value.command';
import { SetFeatureFlagEnvironmentValueCommandHandler } from './set-feature-flag-environment-value.handler';

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

describe('SetFeatureFlagEnvironmentValueCommandHandler', () => {
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
      handler: new SetFeatureFlagEnvironmentValueCommandHandler(
        writeRepository,
        assertExists,
        eventBus,
      ),
      writeRepository,
      assertExists,
      eventBus,
    };
  }

  it('toggles only the targeted environment and saves', async () => {
    const flag = buildFlag();
    const { handler, writeRepository } = buildHandler(flag);

    await handler.execute(
      new SetFeatureFlagEnvironmentValueCommand({
        tenantId: 'tenant-1',
        key: 'new-checkout',
        environment: FeatureFlagEnvironmentEnum.STAGING,
        enabled: true,
      }),
    );

    expect(flag.stagingEnabled).toBe(true);
    expect(flag.developmentEnabled).toBe(false);
    expect(flag.productionEnabled).toBe(false);
    expect(writeRepository.save).toHaveBeenCalledWith(flag);
  });

  it('propagates FeatureFlagNotFoundException without saving', async () => {
    const notFound = new FeatureFlagNotFoundException(
      'tenant-1',
      'missing-flag',
    );
    const { handler, writeRepository, assertExists } = buildHandler(null);
    assertExists.execute.mockRejectedValueOnce(notFound);

    await expect(
      handler.execute(
        new SetFeatureFlagEnvironmentValueCommand({
          tenantId: 'tenant-1',
          key: 'missing-flag',
          environment: FeatureFlagEnvironmentEnum.STAGING,
          enabled: true,
        }),
      ),
    ).rejects.toThrow(notFound);

    expect(writeRepository.save).not.toHaveBeenCalled();
  });
});
