import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Logger,
  Param,
  ParseEnumPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import {
  Criteria,
  FilterOperator,
  PaginatedResult,
} from '@sisques-labs/nestjs-kit';

import { ArchiveFeatureFlagCommand } from '../../application/commands/archive-feature-flag/archive-feature-flag.command';
import { CreateFeatureFlagCommand } from '../../application/commands/create-feature-flag/create-feature-flag.command';
import { SetFeatureFlagEnvironmentValueCommand } from '../../application/commands/set-feature-flag-environment-value/set-feature-flag-environment-value.command';
import { EvaluateFeatureFlagQuery } from '../../application/queries/evaluate-feature-flag/evaluate-feature-flag.query';
import { FeatureFlagFindByCriteriaQuery } from '../../application/queries/feature-flag-find-by-criteria/feature-flag-find-by-criteria.query';
import { FeatureFlagFindByKeyQuery } from '../../application/queries/feature-flag-find-by-key/feature-flag-find-by-key.query';
import { FeatureFlagEnvironmentEnum } from '../../domain/enums/feature-flag-environment.enum';
import { FeatureFlagViewModel } from '../../domain/view-models/feature-flag.view-model';
import { CreateFeatureFlagDto } from './dtos/create-feature-flag.dto';
import { EvaluateFeatureFlagRestResponseDto } from './dtos/evaluate-feature-flag-rest-response.dto';
import { FeatureFlagRestResponseDto } from './dtos/feature-flag-rest-response.dto';
import { ListFeatureFlagsDto } from './dtos/list-feature-flags.dto';
import { SetFeatureFlagEnvironmentValueDto } from './dtos/set-feature-flag-environment-value.dto';
import { TenantScopedQueryDto } from './dtos/tenant-scoped-query.dto';
import { FeatureFlagRestMapper } from './mappers/feature-flag-rest.mapper';

@ApiTags('feature-flags')
@Controller('feature-flags')
export class FeatureFlagsController {
  private readonly logger = new Logger(FeatureFlagsController.name);

  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
    private readonly featureFlagRestMapper: FeatureFlagRestMapper,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a feature flag' })
  @ApiResponse({ status: 201, type: FeatureFlagRestResponseDto })
  async create(
    @Body() dto: CreateFeatureFlagDto,
  ): Promise<FeatureFlagRestResponseDto> {
    this.logger.log(
      `POST /feature-flags tenantId=${dto.tenantId} key=${dto.key}`,
    );

    await this.commandBus.execute(
      new CreateFeatureFlagCommand({
        tenantId: dto.tenantId,
        key: dto.key,
        name: dto.name,
        description: dto.description,
      }),
    );

    const viewModel = await this.queryBus.execute<
      FeatureFlagFindByKeyQuery,
      FeatureFlagViewModel
    >(new FeatureFlagFindByKeyQuery({ tenantId: dto.tenantId, key: dto.key }));

    return this.featureFlagRestMapper.toResponse(viewModel);
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'List feature flags for a tenant' })
  async list(
    @Query() query: ListFeatureFlagsDto,
  ): Promise<PaginatedResult<FeatureFlagRestResponseDto>> {
    this.logger.debug(`GET /feature-flags tenantId=${query.tenantId}`);

    const filters = [
      {
        field: 'tenantId',
        operator: FilterOperator.EQUALS,
        value: query.tenantId,
      },
    ];
    if (query.archived !== undefined) {
      filters.push({
        field: 'archived',
        operator: FilterOperator.EQUALS,
        value: query.archived as unknown as string,
      });
    }

    const criteria = new Criteria(filters, [], {
      page: query.page ?? 1,
      perPage: query.perPage ?? 10,
    });

    const result = await this.queryBus.execute<
      FeatureFlagFindByCriteriaQuery,
      PaginatedResult<FeatureFlagViewModel>
    >(new FeatureFlagFindByCriteriaQuery({ criteria }));

    return new PaginatedResult(
      result.items.map((vm) => this.featureFlagRestMapper.toResponse(vm)),
      result.total,
      result.page,
      result.perPage,
    );
  }

  @Get(':key')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get a feature flag by key' })
  @ApiResponse({ status: 200, type: FeatureFlagRestResponseDto })
  async getByKey(
    @Param('key') key: string,
    @Query() query: TenantScopedQueryDto,
  ): Promise<FeatureFlagRestResponseDto> {
    this.logger.debug(`GET /feature-flags/${key} tenantId=${query.tenantId}`);

    const viewModel = await this.queryBus.execute<
      FeatureFlagFindByKeyQuery,
      FeatureFlagViewModel
    >(new FeatureFlagFindByKeyQuery({ tenantId: query.tenantId, key }));

    return this.featureFlagRestMapper.toResponse(viewModel);
  }

  @Patch(':key/environments/:environment')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Toggle a flag for a single environment' })
  async setEnvironmentValue(
    @Param('key') key: string,
    @Param('environment', new ParseEnumPipe(FeatureFlagEnvironmentEnum))
    environment: FeatureFlagEnvironmentEnum,
    @Body() dto: SetFeatureFlagEnvironmentValueDto,
  ): Promise<FeatureFlagRestResponseDto> {
    this.logger.log(
      `PATCH /feature-flags/${key}/environments/${environment} tenantId=${dto.tenantId}`,
    );

    await this.commandBus.execute(
      new SetFeatureFlagEnvironmentValueCommand({
        tenantId: dto.tenantId,
        key,
        environment,
        enabled: dto.enabled,
      }),
    );

    const viewModel = await this.queryBus.execute<
      FeatureFlagFindByKeyQuery,
      FeatureFlagViewModel
    >(new FeatureFlagFindByKeyQuery({ tenantId: dto.tenantId, key }));

    return this.featureFlagRestMapper.toResponse(viewModel);
  }

  @Delete(':key')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Archive (soft-delete) a feature flag' })
  async archive(
    @Param('key') key: string,
    @Query() query: TenantScopedQueryDto,
  ): Promise<void> {
    this.logger.log(`DELETE /feature-flags/${key} tenantId=${query.tenantId}`);

    await this.commandBus.execute(
      new ArchiveFeatureFlagCommand({ tenantId: query.tenantId, key }),
    );
  }

  @Get(':key/evaluate/:environment')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary:
      'Evaluate a flag for an environment. Fail-safe: false for an unknown or archived flag — never 404.',
  })
  @ApiResponse({ status: 200, type: EvaluateFeatureFlagRestResponseDto })
  async evaluate(
    @Param('key') key: string,
    @Param('environment', new ParseEnumPipe(FeatureFlagEnvironmentEnum))
    environment: FeatureFlagEnvironmentEnum,
    @Query() query: TenantScopedQueryDto,
  ): Promise<EvaluateFeatureFlagRestResponseDto> {
    this.logger.debug(
      `GET /feature-flags/${key}/evaluate/${environment} tenantId=${query.tenantId}`,
    );

    const enabled = await this.queryBus.execute<
      EvaluateFeatureFlagQuery,
      boolean
    >(
      new EvaluateFeatureFlagQuery({
        tenantId: query.tenantId,
        key,
        environment,
      }),
    );

    return { enabled };
  }
}
