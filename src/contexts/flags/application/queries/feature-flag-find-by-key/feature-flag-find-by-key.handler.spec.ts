import { AssertFeatureFlagViewModelExistsService } from '../../services/read/assert-feature-flag-view-model-exists/assert-feature-flag-view-model-exists.service';
import { FeatureFlagFindByKeyQuery } from './feature-flag-find-by-key.query';
import { FeatureFlagFindByKeyQueryHandler } from './feature-flag-find-by-key.handler';

describe('FeatureFlagFindByKeyQueryHandler', () => {
  it('delegates to AssertFeatureFlagViewModelExistsService', async () => {
    const viewModel = { id: 'flag-1' };
    const assertExists = {
      execute: jest.fn().mockResolvedValue(viewModel),
    } as unknown as jest.Mocked<AssertFeatureFlagViewModelExistsService>;
    const handler = new FeatureFlagFindByKeyQueryHandler(assertExists);

    const result = await handler.execute(
      new FeatureFlagFindByKeyQuery({
        tenantId: 'tenant-1',
        key: 'new-checkout',
      }),
    );

    expect(assertExists.execute).toHaveBeenCalledWith(
      'tenant-1',
      'new-checkout',
    );
    expect(result).toBe(viewModel);
  });
});
