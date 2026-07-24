import { FeatureFlagViewModel } from '../../../domain/view-models/feature-flag.view-model';
import { FeatureFlagRestMapper } from './feature-flag-rest.mapper';

describe('FeatureFlagRestMapper', () => {
  it('copies every field from the view model 1:1', () => {
    const now = new Date();
    const viewModel = new FeatureFlagViewModel({
      id: 'flag-1',
      tenantId: 'tenant-1',
      key: 'new-checkout',
      name: 'New Checkout',
      description: 'Rolls out the new checkout flow',
      developmentEnabled: true,
      stagingEnabled: false,
      productionEnabled: false,
      archived: false,
      createdAt: now,
      updatedAt: now,
    });

    const dto = new FeatureFlagRestMapper().toResponse(viewModel);

    expect(dto).toEqual({
      id: 'flag-1',
      tenantId: 'tenant-1',
      key: 'new-checkout',
      name: 'New Checkout',
      description: 'Rolls out the new checkout flow',
      developmentEnabled: true,
      stagingEnabled: false,
      productionEnabled: false,
      archived: false,
      createdAt: now,
      updatedAt: now,
    });
  });
});
