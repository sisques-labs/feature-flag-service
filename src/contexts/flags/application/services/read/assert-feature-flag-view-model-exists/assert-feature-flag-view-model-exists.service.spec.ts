import { FeatureFlagNotFoundException } from '../../../../domain/exceptions/feature-flag-not-found.exception';
import { IFeatureFlagReadRepository } from '../../../../domain/repositories/read/feature-flag-read.repository';
import { AssertFeatureFlagViewModelExistsService } from './assert-feature-flag-view-model-exists.service';

describe('AssertFeatureFlagViewModelExistsService', () => {
  function buildService(found: unknown) {
    const repository: jest.Mocked<IFeatureFlagReadRepository> = {
      findByTenantAndKey: jest.fn().mockResolvedValue(found),
      findById: jest.fn(),
      findByCriteria: jest.fn(),
      save: jest.fn(),
      delete: jest.fn(),
    };
    return { service: new AssertFeatureFlagViewModelExistsService(repository) };
  }

  it('returns the view model when found', async () => {
    const viewModel = { id: 'flag-1' };
    const { service } = buildService(viewModel);

    await expect(service.execute('tenant-1', 'new-checkout')).resolves.toBe(
      viewModel,
    );
  });

  it('throws FeatureFlagNotFoundException when not found', async () => {
    const { service } = buildService(null);

    await expect(service.execute('tenant-1', 'missing-flag')).rejects.toThrow(
      FeatureFlagNotFoundException,
    );
  });
});
