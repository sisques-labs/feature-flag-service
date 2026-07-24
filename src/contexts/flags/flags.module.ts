import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { TypeOrmModule } from '@nestjs/typeorm';

import { ArchiveFeatureFlagCommandHandler } from './application/commands/archive-feature-flag/archive-feature-flag.handler';
import { CreateFeatureFlagCommandHandler } from './application/commands/create-feature-flag/create-feature-flag.handler';
import { SetFeatureFlagEnvironmentValueCommandHandler } from './application/commands/set-feature-flag-environment-value/set-feature-flag-environment-value.handler';
import { EvaluateFeatureFlagQueryHandler } from './application/queries/evaluate-feature-flag/evaluate-feature-flag.handler';
import { FeatureFlagFindByCriteriaQueryHandler } from './application/queries/feature-flag-find-by-criteria/feature-flag-find-by-criteria.handler';
import { FeatureFlagFindByKeyQueryHandler } from './application/queries/feature-flag-find-by-key/feature-flag-find-by-key.handler';
import { AssertFeatureFlagViewModelExistsService } from './application/services/read/assert-feature-flag-view-model-exists/assert-feature-flag-view-model-exists.service';
import { AssertFeatureFlagExistsService } from './application/services/write/assert-feature-flag-exists/assert-feature-flag-exists.service';
import { AssertFeatureFlagKeyAvailableService } from './application/services/write/assert-feature-flag-key-available/assert-feature-flag-key-available.service';
import { FeatureFlagBuilder } from './domain/builders/feature-flag.builder';
import { FEATURE_FLAG_READ_REPOSITORY } from './domain/repositories/read/feature-flag-read.repository';
import { FEATURE_FLAG_WRITE_REPOSITORY } from './domain/repositories/write/feature-flag-write.repository';
import { FeatureFlagTypeOrmEntity } from './infrastructure/persistence/typeorm/entities/feature-flag.entity';
import { FeatureFlagTypeOrmMapper } from './infrastructure/persistence/typeorm/mappers/feature-flag-typeorm.mapper';
import { FeatureFlagTypeOrmReadRepository } from './infrastructure/persistence/typeorm/repositories/feature-flag-typeorm-read.repository';
import { FeatureFlagTypeOrmWriteRepository } from './infrastructure/persistence/typeorm/repositories/feature-flag-typeorm-write.repository';
import { FeatureFlagsController } from './transport/rest/feature-flags.controller';
import { FeatureFlagRestMapper } from './transport/rest/mappers/feature-flag-rest.mapper';

const COMMAND_HANDLERS = [
  CreateFeatureFlagCommandHandler,
  SetFeatureFlagEnvironmentValueCommandHandler,
  ArchiveFeatureFlagCommandHandler,
];

const QUERY_HANDLERS = [
  FeatureFlagFindByKeyQueryHandler,
  FeatureFlagFindByCriteriaQueryHandler,
  EvaluateFeatureFlagQueryHandler,
];

const APPLICATION_SERVICES = [
  AssertFeatureFlagViewModelExistsService,
  AssertFeatureFlagExistsService,
  AssertFeatureFlagKeyAvailableService,
];

const DOMAIN_BUILDERS = [FeatureFlagBuilder];

const INFRASTRUCTURE_ENTITIES = [FeatureFlagTypeOrmEntity];

const INFRASTRUCTURE_MAPPERS = [FeatureFlagTypeOrmMapper];

const INFRASTRUCTURE_REPOSITORIES = [
  {
    provide: FEATURE_FLAG_READ_REPOSITORY,
    useClass: FeatureFlagTypeOrmReadRepository,
  },
  {
    provide: FEATURE_FLAG_WRITE_REPOSITORY,
    useClass: FeatureFlagTypeOrmWriteRepository,
  },
];

const REST_CONTROLLERS = [FeatureFlagsController];

const REST_PROVIDERS = [FeatureFlagRestMapper];

@Module({
  imports: [CqrsModule, TypeOrmModule.forFeature(INFRASTRUCTURE_ENTITIES)],
  controllers: [...REST_CONTROLLERS],
  providers: [
    ...COMMAND_HANDLERS,
    ...QUERY_HANDLERS,
    ...APPLICATION_SERVICES,
    ...DOMAIN_BUILDERS,
    ...INFRASTRUCTURE_MAPPERS,
    ...INFRASTRUCTURE_REPOSITORIES,
    ...REST_PROVIDERS,
  ],
})
export class FlagsModule {}
