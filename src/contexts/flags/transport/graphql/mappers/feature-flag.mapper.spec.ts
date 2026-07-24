import { PaginatedResult } from '@sisques-labs/nestjs-kit';

import { FeatureFlagViewModel } from '../../../domain/view-models/feature-flag.view-model';
import { FeatureFlagGraphQLMapper } from './feature-flag.mapper';

function buildViewModel(): FeatureFlagViewModel {
  const now = new Date();
  return new FeatureFlagViewModel({
    id: 'flag-1',
    tenantId: 'tenant-1',
    key: 'new-checkout',
    name: 'New Checkout',
    description: null,
    developmentEnabled: true,
    stagingEnabled: false,
    productionEnabled: false,
    archived: false,
    createdAt: now,
    updatedAt: now,
  });
}

describe('FeatureFlagGraphQLMapper', () => {
  it('toResponseDtoFromViewModel() copies every field 1:1', () => {
    const viewModel = buildViewModel();
    const mapper = new FeatureFlagGraphQLMapper();

    const object = mapper.toResponseDtoFromViewModel(viewModel);

    expect(object).toEqual({
      id: 'flag-1',
      tenantId: 'tenant-1',
      key: 'new-checkout',
      name: 'New Checkout',
      description: null,
      developmentEnabled: true,
      stagingEnabled: false,
      productionEnabled: false,
      archived: false,
      createdAt: viewModel.createdAt,
      updatedAt: viewModel.updatedAt,
    });
  });

  it('toPaginatedResponseDto() maps items and pagination metadata', () => {
    const viewModel = buildViewModel();
    const paginated = new PaginatedResult([viewModel], 1, 1, 10);
    const mapper = new FeatureFlagGraphQLMapper();

    const dto = mapper.toPaginatedResponseDto(paginated);

    expect(dto.items).toHaveLength(1);
    expect(dto.items[0].key).toBe('new-checkout');
    expect(dto.total).toBe(1);
    expect(dto.page).toBe(1);
    expect(dto.perPage).toBe(10);
    expect(dto.totalPages).toBe(1);
  });
});
