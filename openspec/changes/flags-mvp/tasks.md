# Tasks: Feature Flags MVP

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | 1600–2000 (first bounded context in the service — domain+application+infra+3 transports+auth+tests) |
| 400-line budget note | This repo has no PR-size rule of its own; `gardenia-web`'s 400-line cap does not apply here. Still recommend chained PRs for reviewability. |
| Suggested split | PR 1: API-key auth (core) + Domain + Application → PR 2: Infrastructure + Module wiring → PR 3: REST + GraphQL + MCP transport → PR 4: E2E tests + README |
| Decision needed before apply | Confirm PR split with the user before starting Phase 4 |

---

## Dependency Graph

```
T1 (auth: guard + config) — independent, unblocks all transports' 401 behavior
T2 (migration) — independent
T3 → T4 → T5, T6, T7
T7 → T8 (exceptions + filter wiring)
T8 → T9 (repo interfaces)
T9 → T10..T15 (application layer)
T16 → T17 → T18, T19 (infrastructure)
T18, T19 → T20 (module skeleton, no transport yet)
T20 → T21..T23 (REST)
T20 → T24..T27 (GraphQL)
T20 → T28..T29 (MCP)
T21..T29 → T30 (register FlagsModule in ContextsModule)
T3..T15 → T31 (unit tests)
T18, T19 → T32 (integration tests)
T30 → T33 (E2E tests)
T30 → T34 (README)
```

---

## Phase 0: Cross-Cutting Auth (blocks nothing domain-related, but every transport task depends on it existing)

- [ ] T1: Create `src/core/auth/api-key.guard.ts` (`ApiKeyGuard implements CanActivate`, reads `X-Api-Key` header from REST or GraphQL context via `GqlExecutionContext`, compares against `ConfigService.getOrThrow('auth.apiKey')`, throws `UnauthorizedException` on mismatch/missing). Create `src/core/config/auth.config.ts` (`registerAs('auth', () => ({ apiKey: process.env.FEATURE_FLAGS_API_KEY }))`). Modify `src/core/config/env.validation.ts` to require `FEATURE_FLAGS_API_KEY` (string, min 32 chars). Modify `src/core/core.module.ts`: add `authConfig` to `ConfigModule.load`, add `{ provide: APP_GUARD, useClass: ApiKeyGuard }` to `CORE_MODULES`/providers. Write `api-key.guard.spec.ts` (valid key passes, missing/invalid key throws, works for both REST-shaped and GraphQL-shaped `ExecutionContext` mocks). Update `.env.example`/README with the new required var. **Acceptance: any request without `X-Api-Key` gets 401, including GraphQL.**

## Phase 1: Foundation — Migration + Domain

- [ ] T2: Create `src/database/migrations/<timestamp>-CreateFeatureFlags.ts` — `up()` creates `feature_flags` table (id uuid PK, tenant_id varchar(100) NOT NULL, key varchar(100) NOT NULL, name varchar(150) NOT NULL, description varchar(500) nullable, development_enabled/staging_enabled/production_enabled boolean NOT NULL DEFAULT false, archived boolean NOT NULL DEFAULT false, created_at/updated_at timestamp DEFAULT now()) plus a unique index `UQ_feature_flags_tenant_key` on `(tenant_id, "key")` and a plain index on `tenant_id`; `down()` drops the table.
- [ ] T3: Create value objects in `src/contexts/flags/domain/value-objects/`: `feature-flag-tenant-id/feature-flag-tenant-id.vo.ts` (maxLength 100, allowEmpty false, no format constraint), `feature-flag-key/feature-flag-key.vo.ts` (maxLength 100, allowEmpty false, kebab-case pattern), `feature-flag-name/feature-flag-name.vo.ts` (maxLength 150, allowEmpty false), `feature-flag-description/feature-flag-description.vo.ts` (maxLength 500, allowEmpty false — only constructed for non-empty values). Co-located `.spec.ts` for each (empty/too-long/bad-pattern rejection).
- [ ] T4: Create `src/contexts/flags/domain/enums/feature-flag-environment.enum.ts` (`DEVELOPMENT`/`STAGING`/`PRODUCTION`).
- [ ] T5: Create `src/contexts/flags/domain/aggregates/feature-flag.aggregate.ts` (`FeatureFlagAggregate extends BaseAggregate`; fields per design §3.1; `create()`/`setEnvironmentValue()`/`archive()`/`toPrimitives()`; constructor is hydration only). Create `domain/interfaces/feature-flag.interface.ts` (`IFeatureFlag`), `domain/primitives/feature-flag.primitives.ts` (`IFeatureFlagPrimitives`), `domain/view-models/feature-flag.view-model.ts` (`FeatureFlagViewModel extends BaseViewModel`), `domain/builders/feature-flag.builder.ts` (`FeatureFlagBuilder`, `build()`/`buildViewModel()`/`validate()` per design §3.5, defaults environment booleans and `archived` to `false`).
- [ ] T6: Create domain events in `domain/events/`: `interfaces/feature-flag-event-data.interface.ts` (full-snapshot payload), `feature-flag-created/feature-flag-created.event.ts`, `feature-flag-environment-value-updated/feature-flag-environment-value-updated.event.ts` (payload includes `environment`), `feature-flag-archived/feature-flag-archived.event.ts` — all extend `BaseEvent<TData>`.
- [ ] T7: Create `domain/exceptions/feature-flag-not-found.exception.ts` and `domain/exceptions/feature-flag-key-already-exists.exception.ts` (both extend `BaseException`, constructors take `tenantId` + `key`). **Modify `src/core/filters/base-exception.filter.ts`**: import both, add `FeatureFlagNotFoundException` to the 404 branch, add `FeatureFlagKeyAlreadyExistsException` to a 409 (CONFLICT) branch (create the branch if it doesn't exist yet). Acceptance: E2E returns correct status codes on both transports.
- [ ] T8: Create `domain/repositories/read/feature-flag-read.repository.ts` (`IFeatureFlagReadRepository extends IBaseReadRepository<FeatureFlagViewModel>` + `findByTenantAndKey`) and `domain/repositories/write/feature-flag-write.repository.ts` (`IFeatureFlagWriteRepository extends IBaseWriteRepository<FeatureFlagAggregate>` + `findByTenantAndKey`), with `FEATURE_FLAG_READ_REPOSITORY`/`FEATURE_FLAG_WRITE_REPOSITORY` Symbol tokens.

## Phase 2: Application Layer

> Write T31 unit tests alongside each handler/service.

- [ ] T9: `application/services/write/assert-feature-flag-key-available/assert-feature-flag-key-available.service.ts` — `execute(tenantId, key)`, throws `FeatureFlagKeyAlreadyExistsException` if `findByTenantAndKey` (write repo) returns non-null.
- [ ] T10: `application/services/write/assert-feature-flag-exists/assert-feature-flag-exists.service.ts` — `execute(tenantId, key) → FeatureFlagAggregate`, throws `FeatureFlagNotFoundException` if not found (write repo).
- [ ] T11: `application/services/read/assert-feature-flag-view-model-exists/assert-feature-flag-view-model-exists.service.ts` — same contract against the read repo, returns `FeatureFlagViewModel`.
- [ ] T12: `application/commands/create-feature-flag/` — command (`tenantId, key, name, description?`) + handler per design §4.1 (uses T9, `FeatureFlagBuilder`, write repo, `EventBus`; returns `id` string, no re-fetch).
- [ ] T13: `application/commands/set-feature-flag-environment-value/` — command (`tenantId, key, environment, enabled`) + handler per design §4.2 (uses T10).
- [ ] T14: `application/commands/archive-feature-flag/` — command (`tenantId, key`) + handler per design §4.3 (uses T10; idempotent on already-archived).
- [ ] T15: `application/queries/feature-flag-find-by-key/` (uses T11), `application/queries/feature-flag-find-by-criteria/` (direct `findByCriteria` on read repo, no assert service), `application/queries/evaluate-feature-flag/` (per design §4.6 — direct `findByTenantAndKey`, fail-safe `false`, never throws).
- [ ] T31: Unit tests: `feature-flag.aggregate.spec.ts` (create/setEnvironmentValue/archive, event emission, idempotent archive), VO specs (from T3), all three assert-service specs, all six handler specs (owner-free here, but cover the not-found/already-exists/fail-safe-evaluate branches explicitly). Coverage ≥ 80% for domain+application.

## Phase 3: Infrastructure

- [ ] T16: `infrastructure/persistence/typeorm/entities/feature-flag.entity.ts` (`FeatureFlagTypeOrmEntity @Entity('feature_flags')`) per design §5.1, including the unique + plain indexes as TypeORM decorators (or confirm they're covered by the migration alone — pick one source of truth and document it in the entity file).
- [ ] T17: `infrastructure/persistence/typeorm/mappers/feature-flag-typeorm.mapper.ts` (`toAggregate`/`toEntity`/`toViewModel`).
- [ ] T18: `infrastructure/persistence/typeorm/repositories/feature-flag-typeorm-read.repository.ts` (`findById`, `findByCriteria` via `QueryBuilder` covering all 8 `FilterOperator` values, `findByTenantAndKey`).
- [ ] T19: `infrastructure/persistence/typeorm/repositories/feature-flag-typeorm-write.repository.ts` (`findById`, `save` — **catch the Postgres unique-violation error code on `(tenant_id, key)` and rethrow as `FeatureFlagKeyAlreadyExistsException`**, per design §11 risk 3 — `delete`, `findByTenantAndKey`, `findByCriteria` throws not-implemented).
- [ ] T32: Integration tests (Testcontainers Postgres, `test/integration/`): CRUD + `findByTenantAndKey` + cross-tenant data coexistence (two tenants, same `key`, both persist independently) + unique-violation-to-domain-exception mapping from T19.

## Phase 4: Transport — REST

- [ ] T20: `flags.module.ts` skeleton — domain/application/infrastructure providers wired (grouped arrays per architecture skill), `controllers: []`/no GraphQL/MCP providers yet (added incrementally in T21–T29). Confirms DI graph resolves with `pnpm build` before adding transport surface.
- [ ] T21: REST DTOs (`transport/rest/dtos/`): `create-feature-flag.dto.ts`, `set-feature-flag-environment-value.dto.ts` (`{ tenantId, enabled }`), `feature-flag-rest-response.dto.ts`.
- [ ] T22: `transport/rest/feature-flags.controller.ts` — `FeatureFlagsController @Controller('feature-flags')`, 6 endpoints per design §6.1, `CommandBus`/`QueryBus` dispatch only, `FeatureFlagRestMapper` for response shaping.
- [ ] T23: Wire `FeatureFlagsController` + `FeatureFlagRestMapper` into `flags.module.ts` `controllers`/`providers`.

## Phase 5: Transport — GraphQL

- [ ] T24: GraphQL request DTOs (`transport/graphql/dtos/requests/`): create/set-environment-value/archive/find-by-key/evaluate inputs, plus `feature-flag-queryable-field.enum.ts` and `feature-flag-filterable-fields.registry.ts` (+ `.spec.ts` per the mandatory Criteria pattern) and `feature-flag-filter.input.ts`/`feature-flag-sort.input.ts` via `createFilterInput`/`createSortInput`.
- [ ] T25: GraphQL response objects (`transport/graphql/dtos/responses/`): `feature-flag.object.ts`, `paginated-feature-flag-result.object.ts` (extends `BasePaginatedResultDto`). `feature-flag-registered-enums.graphql.ts` registers `FeatureFlagEnvironmentEnum` and `FeatureFlagQueryableFieldEnum`.
- [ ] T26: `transport/graphql/mappers/feature-flag.mapper.ts` (`FeatureFlagGraphQLMapper`).
- [ ] T27: `FeatureFlagQueriesResolver` (`featureFlagFindByKey`, `featureFlagsFindByCriteria` with `FilterValidationPipe`, `featureFlagEvaluate`) and `FeatureFlagMutationsResolver` (`featureFlagCreate`, `featureFlagSetEnvironmentValue`, `featureFlagArchive` — using the **global** `MutationResponseGraphQLMapper`, not a locally-provided one). Wire both into `flags.module.ts`.

## Phase 6: Transport — MCP

- [ ] T28: Zod schemas in `transport/mcp/schemas/` — one per tool (6 files) matching each command/query's input shape.
- [ ] T29: MCP tools in `transport/mcp/tools/` — 6 `{Name}McpTool` classes implementing `IMcpTool<IBaseMcpToolContext>`, tagged `@McpTool()` + `@Injectable()`, dispatching via `CommandBus`/`QueryBus`. Wire into `flags.module.ts` via an `MCP_TOOLS` array spread into providers.

## Phase 7: Wiring + Tests + Docs

- [ ] T30: Register `FlagsModule` in `src/contexts/contexts.module.ts`'s `CONTEXT_MODULES` array. Acceptance: `pnpm build` + app boots without DI errors.
- [ ] T33: E2E tests (`test/flags/` or co-located `*.e2e-spec.ts`): REST — create (201 happy, 409 duplicate key, 400 invalid key format), get-by-key (200/404), set-environment-value (200/404, per-environment independence), archive (204, idempotent second call), evaluate (200 with `false` for missing flag — never 404), list with `tenantId` filter. GraphQL — same scenarios via mutations/queries. Auth — every endpoint 401s without `X-Api-Key` on both transports. MCP — smoke test at least `feature_flag_create` + `feature_flag_evaluate` round-trip. Acceptance: ≥ 80% coverage for the `flags` context; all scenarios in `specs/flags/spec.md` covered.
- [ ] T34: Write `src/contexts/flags/README.md` documenting the aggregate, commands, queries, events, and both transports' public surface, per `openspec/config.yaml`'s apply rule. Update root `README.md`/`.env.example` with `FEATURE_FLAGS_API_KEY` if not already covered by T1.
