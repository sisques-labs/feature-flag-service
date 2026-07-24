import { EventBus } from '@nestjs/cqrs';

import { FeatureFlagBuilder } from '../../../domain/builders/feature-flag.builder';
import { IFeatureFlagWriteRepository } from '../../../domain/repositories/write/feature-flag-write.repository';
import { AssertFeatureFlagKeyAvailableService } from '../../services/write/assert-feature-flag-key-available/assert-feature-flag-key-available.service';
import { CreateFeatureFlagCommand } from './create-feature-flag.command';
import { CreateFeatureFlagCommandHandler } from './create-feature-flag.handler';

describe('CreateFeatureFlagCommandHandler', () => {
  function buildHandler() {
    const writeRepository: jest.Mocked<IFeatureFlagWriteRepository> = {
      findByTenantAndKey: jest.fn(),
      findById: jest.fn(),
      findByCriteria: jest.fn(),
      save: jest.fn().mockImplementation((flag) => Promise.resolve(flag)),
      delete: jest.fn(),
    };
    const assertKeyAvailable = {
      execute: jest.fn().mockResolvedValue(undefined),
    } as unknown as jest.Mocked<AssertFeatureFlagKeyAvailableService>;
    const eventBus = {
      publishAll: jest.fn(),
    } as unknown as jest.Mocked<EventBus>;

    const handler = new CreateFeatureFlagCommandHandler(
      writeRepository,
      new FeatureFlagBuilder(),
      assertKeyAvailable,
      eventBus,
    );

    return { handler, writeRepository, assertKeyAvailable, eventBus };
  }

  it('checks key availability, persists the flag with all environments disabled, and returns its id', async () => {
    const { handler, writeRepository, assertKeyAvailable, eventBus } =
      buildHandler();

    const id = await handler.execute(
      new CreateFeatureFlagCommand({
        tenantId: 'tenant-1',
        key: 'new-checkout',
        name: 'New Checkout',
      }),
    );

    expect(assertKeyAvailable.execute).toHaveBeenCalledWith(
      'tenant-1',
      'new-checkout',
    );
    expect(writeRepository.save).toHaveBeenCalledTimes(1);
    const savedFlag = writeRepository.save.mock.calls[0][0];
    expect(savedFlag.developmentEnabled).toBe(false);
    expect(savedFlag.stagingEnabled).toBe(false);
    expect(savedFlag.productionEnabled).toBe(false);
    expect(savedFlag.archived).toBe(false);
    expect(eventBus.publishAll).toHaveBeenCalledTimes(1);
    expect(id).toBe(savedFlag.id.value);
  });

  it('propagates the key-already-exists rejection without saving', async () => {
    const { handler, writeRepository, assertKeyAvailable } = buildHandler();
    const error = new Error('already exists');
    assertKeyAvailable.execute.mockRejectedValueOnce(error);

    await expect(
      handler.execute(
        new CreateFeatureFlagCommand({
          tenantId: 'tenant-1',
          key: 'new-checkout',
          name: 'New Checkout',
        }),
      ),
    ).rejects.toThrow(error);

    expect(writeRepository.save).not.toHaveBeenCalled();
  });
});
