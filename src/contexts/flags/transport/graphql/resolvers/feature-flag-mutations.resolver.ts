import { Args, Mutation, Resolver } from '@nestjs/graphql';
import { CommandBus } from '@nestjs/cqrs';
import {
  MutationResponseDto,
  MutationResponseGraphQLMapper,
} from '@sisques-labs/nestjs-kit/graphql';

import { ArchiveFeatureFlagCommand } from '../../../application/commands/archive-feature-flag/archive-feature-flag.command';
import { CreateFeatureFlagCommand } from '../../../application/commands/create-feature-flag/create-feature-flag.command';
import { SetFeatureFlagEnvironmentValueCommand } from '../../../application/commands/set-feature-flag-environment-value/set-feature-flag-environment-value.command';
import { FeatureFlagArchiveInput } from '../dtos/requests/feature-flag-archive.input';
import { FeatureFlagCreateInput } from '../dtos/requests/feature-flag-create.input';
import { FeatureFlagSetEnvironmentValueInput } from '../dtos/requests/feature-flag-set-environment-value.input';

@Resolver()
export class FeatureFlagMutationsResolver {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly mutationResponseGraphQLMapper: MutationResponseGraphQLMapper,
  ) {}

  @Mutation(() => MutationResponseDto, {
    description: 'Create a feature flag',
  })
  async featureFlagCreate(
    @Args('input') input: FeatureFlagCreateInput,
  ): Promise<MutationResponseDto> {
    const id = await this.commandBus.execute<CreateFeatureFlagCommand, string>(
      new CreateFeatureFlagCommand(input),
    );

    return this.mutationResponseGraphQLMapper.toResponseDto({
      success: true,
      message: 'Feature flag created successfully',
      id,
    });
  }

  @Mutation(() => MutationResponseDto, {
    description: 'Toggle a flag for a single environment',
  })
  async featureFlagSetEnvironmentValue(
    @Args('input') input: FeatureFlagSetEnvironmentValueInput,
  ): Promise<MutationResponseDto> {
    await this.commandBus.execute(
      new SetFeatureFlagEnvironmentValueCommand(input),
    );

    return this.mutationResponseGraphQLMapper.toResponseDto({
      success: true,
      message: 'Feature flag environment value updated successfully',
    });
  }

  @Mutation(() => MutationResponseDto, {
    description: 'Archive (soft-delete) a feature flag',
  })
  async featureFlagArchive(
    @Args('input') input: FeatureFlagArchiveInput,
  ): Promise<MutationResponseDto> {
    await this.commandBus.execute(new ArchiveFeatureFlagCommand(input));

    return this.mutationResponseGraphQLMapper.toResponseDto({
      success: true,
      message: 'Feature flag archived successfully',
    });
  }
}
