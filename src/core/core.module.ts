import { ApiKeyGuard } from './auth/api-key.guard';
import { appConfig } from './config/app.config';
import { authConfig } from './config/auth.config';
import { validateEnv } from './config/env.validation';
import { kafkaConfig } from './config/kafka.config';
import { postgresConfig } from './config/postgres.config';
import { sentryConfig } from './config/sentry.config';
import { AGGREGATE_MODULE_MAP } from './messaging/domain/topics/aggregate-module.map.generated';
import { HealthModule } from './health/health.module';
import { ObservabilityModule } from './observability/observability.module';
import { PingResolver } from './transport/graphql/resolvers/ping.resolver';
import './transport/graphql/registered-enums.graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { CqrsModule } from '@nestjs/cqrs';
import { GraphQLModule } from '@nestjs/graphql';
import { TypeOrmModule, TypeOrmModuleOptions } from '@nestjs/typeorm';
import { SharedGraphQLModule } from '@sisques-labs/nestjs-kit/graphql';
import { McpModule } from '@sisques-labs/nestjs-kit/mcp';
import { MessagingModule } from '@sisques-labs/nestjs-kit/messaging';
import { MetricsModule } from '@sisques-labs/nestjs-kit/metrics';

import { SupportModule } from '../support/support.module';

// Cross-cutting infrastructure every bounded context relies on: config, DB,
// transports, observability. Add new app-wide wiring here, not in AppModule.
const CORE_MODULES = [
  SupportModule,
  CqrsModule.forRoot(),
  SharedGraphQLModule,
  ConfigModule.forRoot({
    isGlobal: true,
    validate: validateEnv,
    load: [postgresConfig, appConfig, sentryConfig, kafkaConfig, authConfig],
    cache: true,
  }),
  TypeOrmModule.forRootAsync({
    inject: [ConfigService],
    useFactory: (config: ConfigService) =>
      config.getOrThrow<TypeOrmModuleOptions>('postgres'),
  }),
  // REST controllers are documented via Swagger (see main.ts). GraphQL is
  // wired alongside it — drop whichever transport this service doesn't use.
  GraphQLModule.forRoot<ApolloDriverConfig>({
    driver: ApolloDriver,
    autoSchemaFile: true,
    playground: true,
    context: ({ req, res }: { req: Request; res: Response }) => ({
      req,
      res,
    }),
  }),
  ObservabilityModule,
  MetricsModule.forRoot({ appLabel: 'nestjs-template' }),
  MessagingModule.forRoot({ aggregateModuleMap: AGGREGATE_MODULE_MAP }),
  HealthModule,
  // No per-identity auth yet (see ApiKeyGuard below) — the default MCP
  // context builder (`{ requestId }`) is used until a service resolves an
  // actual user/tenant identity, at which point pass `contextBuilder` here.
  McpModule.forRoot({ name: 'nestjs-template', version: '0.1.0' }),
];

@Module({
  imports: [...CORE_MODULES],
  providers: [
    PingResolver,
    // Global — protects every REST, GraphQL, and MCP request with a single
    // static API key until identity-service provides real auth.
    { provide: APP_GUARD, useClass: ApiKeyGuard },
  ],
})
export class CoreModule {}
