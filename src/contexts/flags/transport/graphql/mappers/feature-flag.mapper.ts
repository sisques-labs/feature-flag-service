import { Injectable } from '@nestjs/common';
import { PaginatedResult } from '@sisques-labs/nestjs-kit';

import { FeatureFlagViewModel } from '../../../domain/view-models/feature-flag.view-model';
import { FeatureFlagObject } from '../dtos/responses/feature-flag.object';
import { PaginatedFeatureFlagResultObject } from '../dtos/responses/paginated-feature-flag-result.object';

@Injectable()
export class FeatureFlagGraphQLMapper {
  toResponseDtoFromViewModel(
    viewModel: FeatureFlagViewModel,
  ): FeatureFlagObject {
    const object = new FeatureFlagObject();
    object.id = viewModel.id;
    object.tenantId = viewModel.tenantId;
    object.key = viewModel.key;
    object.name = viewModel.name;
    object.description = viewModel.description;
    object.developmentEnabled = viewModel.developmentEnabled;
    object.stagingEnabled = viewModel.stagingEnabled;
    object.productionEnabled = viewModel.productionEnabled;
    object.archived = viewModel.archived;
    object.createdAt = viewModel.createdAt;
    object.updatedAt = viewModel.updatedAt;
    return object;
  }

  toPaginatedResponseDto(
    result: PaginatedResult<FeatureFlagViewModel>,
  ): PaginatedFeatureFlagResultObject {
    const dto = new PaginatedFeatureFlagResultObject();
    dto.items = result.items.map((vm) => this.toResponseDtoFromViewModel(vm));
    dto.total = result.total;
    dto.page = result.page;
    dto.perPage = result.perPage;
    dto.totalPages = result.totalPages;
    return dto;
  }
}
