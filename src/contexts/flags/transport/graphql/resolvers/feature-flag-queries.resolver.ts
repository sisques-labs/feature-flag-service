import { Args, Query, Resolver } from '@nestjs/graphql';
import { QueryBus } from '@nestjs/cqrs';
import { Criteria, PaginatedResult } from '@sisques-labs/nestjs-kit';
import { FilterValidationPipe } from '@sisques-labs/nestjs-kit/graphql';

import { EvaluateFeatureFlagQuery } from '../../../application/queries/evaluate-feature-flag/evaluate-feature-flag.query';
import { FeatureFlagFindByCriteriaQuery } from '../../../application/queries/feature-flag-find-by-criteria/feature-flag-find-by-criteria.query';
import { FeatureFlagFindByKeyQuery } from '../../../application/queries/feature-flag-find-by-key/feature-flag-find-by-key.query';
import { FeatureFlagViewModel } from '../../../domain/view-models/feature-flag.view-model';
import { FeatureFlagEvaluateInput } from '../dtos/requests/feature-flag-evaluate.input';
import { FeatureFlagFindByCriteriaInput } from '../dtos/requests/feature-flag-find-by-criteria.input';
import { FeatureFlagFindByKeyInput } from '../dtos/requests/feature-flag-find-by-key.input';
import { FeatureFlagObject } from '../dtos/responses/feature-flag.object';
import { PaginatedFeatureFlagResultObject } from '../dtos/responses/paginated-feature-flag-result.object';
import { FeatureFlagGraphQLMapper } from '../mappers/feature-flag.mapper';
import { featureFlagFilterableFields } from '../registries/feature-flag-filterable-fields.registry';

@Resolver()
export class FeatureFlagQueriesResolver {
  constructor(
    private readonly queryBus: QueryBus,
    private readonly featureFlagGraphQLMapper: FeatureFlagGraphQLMapper,
  ) {}

  @Query(() => FeatureFlagObject, {
    description: 'Find a feature flag by tenantId + key',
  })
  async featureFlagFindByKey(
    @Args('input') input: FeatureFlagFindByKeyInput,
  ): Promise<FeatureFlagObject> {
    const viewModel = await this.queryBus.execute<
      FeatureFlagFindByKeyQuery,
      FeatureFlagViewModel
    >(new FeatureFlagFindByKeyQuery(input));

    return this.featureFlagGraphQLMapper.toResponseDtoFromViewModel(viewModel);
  }

  @Query(() => PaginatedFeatureFlagResultObject, {
    description: 'List feature flags matching the given criteria',
  })
  async featureFlagsFindByCriteria(
    @Args(
      'input',
      { nullable: true },
      new FilterValidationPipe(featureFlagFilterableFields),
    )
    input?: FeatureFlagFindByCriteriaInput,
  ): Promise<PaginatedFeatureFlagResultObject> {
    const criteria = new Criteria(
      input?.filters,
      input?.sorts,
      input?.pagination,
    );

    const result = await this.queryBus.execute<
      FeatureFlagFindByCriteriaQuery,
      PaginatedResult<FeatureFlagViewModel>
    >(new FeatureFlagFindByCriteriaQuery({ criteria }));

    return this.featureFlagGraphQLMapper.toPaginatedResponseDto(result);
  }

  @Query(() => Boolean, {
    description:
      'Evaluate a flag for an environment. Fail-safe: false for an unknown or archived flag.',
  })
  async featureFlagEvaluate(
    @Args('input') input: FeatureFlagEvaluateInput,
  ): Promise<boolean> {
    return this.queryBus.execute<EvaluateFeatureFlagQuery, boolean>(
      new EvaluateFeatureFlagQuery(input),
    );
  }
}
