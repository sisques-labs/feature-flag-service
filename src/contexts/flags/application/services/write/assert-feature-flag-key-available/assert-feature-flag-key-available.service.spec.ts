import { FeatureFlagKeyAlreadyExistsException } from '../../../../domain/exceptions/feature-flag-key-already-exists.exception';
import { IFeatureFlagWriteRepository } from '../../../../domain/repositories/write/feature-flag-write.repository';
import { AssertFeatureFlagKeyAvailableService } from './assert-feature-flag-key-available.service';

describe('AssertFeatureFlagKeyAvailableService', () => {
  function buildService(existing: unknown) {
    const repository: jest.Mocked<IFeatureFlagWriteRepository> = {
      findByTenantAndKey: jest.fn().mockResolvedValue(existing),
      findById: jest.fn(),
      findByCriteria: jest.fn(),
      save: jest.fn(),
      delete: jest.fn(),
    };
    return {
      service: new AssertFeatureFlagKeyAvailableService(repository),
      repository,
    };
  }

  it('resolves when no flag exists for the tenant/key', async () => {
    const { service } = buildService(null);

    await expect(
      service.execute('tenant-1', 'new-checkout'),
    ).resolves.toBeUndefined();
  });

  it('throws FeatureFlagKeyAlreadyExistsException when a flag already exists', async () => {
    const { service } = buildService({ id: 'existing' });

    await expect(service.execute('tenant-1', 'new-checkout')).rejects.toThrow(
      FeatureFlagKeyAlreadyExistsException,
    );
  });
});
