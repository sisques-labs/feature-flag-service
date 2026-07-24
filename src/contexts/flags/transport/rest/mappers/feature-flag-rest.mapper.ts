import { Injectable } from '@nestjs/common';

import { FeatureFlagViewModel } from '../../../domain/view-models/feature-flag.view-model';
import { FeatureFlagRestResponseDto } from '../dtos/feature-flag-rest-response.dto';

@Injectable()
export class FeatureFlagRestMapper {
  toResponse(viewModel: FeatureFlagViewModel): FeatureFlagRestResponseDto {
    const dto = new FeatureFlagRestResponseDto();
    dto.id = viewModel.id;
    dto.tenantId = viewModel.tenantId;
    dto.key = viewModel.key;
    dto.name = viewModel.name;
    dto.description = viewModel.description;
    dto.developmentEnabled = viewModel.developmentEnabled;
    dto.stagingEnabled = viewModel.stagingEnabled;
    dto.productionEnabled = viewModel.productionEnabled;
    dto.archived = viewModel.archived;
    dto.createdAt = viewModel.createdAt;
    dto.updatedAt = viewModel.updatedAt;
    return dto;
  }
}
