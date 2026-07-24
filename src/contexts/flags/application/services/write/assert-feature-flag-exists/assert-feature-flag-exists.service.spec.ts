import { FeatureFlagNotFoundException } from '../../../../domain/exceptions/feature-flag-not-found.exception';
import { IFeatureFlagWriteRepository } from '../../../../domain/repositories/write/feature-flag-write.repository';
import { AssertFeatureFlagExistsService } from './assert-feature-flag-exists.service';

describe('AssertFeatureFlagExistsService', () => {
  function buildService(found: unknown) {
    const repository: jest.Mocked<IFeatureFlagWriteRepository> = {
      findByTenantAndKey: jest.fn().mockResolvedValue(found),
      findById: jest.fn(),
      findByCriteria: jest.fn(),
      save: jest.fn(),
      delete: jest.fn(),
    };
    return { service: new AssertFeatureFlagExistsService(repository) };
  }

  it('returns the aggregate when found', async () => {
    const flag = { id: 'flag-1' };
    const { service } = buildService(flag);

    await expect(service.execute('tenant-1', 'new-checkout')).resolves.toBe(
      flag,
    );
  });

  it('throws FeatureFlagNotFoundException when not found', async () => {
    const { service } = buildService(null);

    await expect(service.execute('tenant-1', 'missing-flag')).rejects.toThrow(
      FeatureFlagNotFoundException,
    );
  });
});
