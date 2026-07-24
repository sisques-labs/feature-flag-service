# Design: Feature Flags MVP

> Technical design for the `flags` bounded context — the **first** context in `feature-flag-service`. Every decision here doubles as the reference pattern for the next context added to this service (per `AGENTS.md`). Grounded in `@sisques-labs/nestjs-kit` base classes and the `architecture` skill's `Bounded Context Structure`.

---

## 1. Approach Summary

- **Domain**: single aggregate (`FeatureFlagAggregate`), no per-field VO explosion beyond what's needed — three independent `BooleanValueObject` fields (one per environment) rather than a composite "environment map" VO, because the MVP is on/off only and this keeps `SetFeatureFlagEnvironmentValue` a trivial single-field update.
- **Identification**: flags are addressed by **`(tenantId, key)`**, not by the internal UUID `id`. `key` is the business handle every API consumer uses (create, toggle, evaluate, archive); `id` exists only because every aggregate/entity in this codebase has one (kit convention), and is returned in list/read responses for completeness. This mirrors how every real feature-flag API (LaunchDarkly, Unleash) works — flags are looked up by key, not by an opaque database id the client never sees at creation time.
- **Persistence**: plain TypeORM repository, no tenant-scoping proxy (`createTenantRepository` from gardenia-api doesn't exist in this template and isn't needed — `tenantId` is just a regular indexed column here, not an ambient-context-derived value, because there is no `SpaceContext`-equivalent yet).
- **Auth**: a new cross-cutting `src/core/auth/` module — **not** a bounded context — providing a single `ApiKeyGuard` registered globally via `APP_GUARD`. It protects REST, GraphQL, and MCP transports uniformly because Nest's `APP_GUARD` runs for every transport that goes through Nest's execution context, including GraphQL resolvers; MCP tool calls are additionally checked inside `McpModule`'s existing HTTP entrypoint, which is itself a REST-like NestJS route already covered by the same guard.
- **Evaluation is the hot path**: `EvaluateFeatureFlag` bypasses the generic `findByCriteria`/Criteria machinery and calls a dedicated `findByTenantAndKey` repository method (a direct indexed `WHERE tenant_id = ? AND key = ?` lookup) — no pagination, no filter validation overhead.

---

## 2. File Tree

All paths relative to repo root. `*` marks new files.

```
src/core/auth/                                                     *   (new cross-cutting module, NOT a bounded context)
├── api-key.guard.ts                                               *   (ApiKeyGuard implements CanActivate)
└── api-key.guard.spec.ts                                          *

src/core/config/
├── auth.config.ts                                                 *   (registerAs('auth', () => ({ apiKey: process.env.FEATURE_FLAGS_API_KEY })))
└── env.validation.ts                                              MODIFIED (require FEATURE_FLAGS_API_KEY)

src/core/core.module.ts                                            MODIFIED (register authConfig in ConfigModule.load, APP_GUARD: ApiKeyGuard)

src/contexts/flags/
├── domain/
│   ├── aggregates/
│   │   └── feature-flag.aggregate.ts                              *
│   ├── builders/
│   │   └── feature-flag.builder.ts                                *
│   ├── enums/
│   │   └── feature-flag-environment.enum.ts                       *   (DEVELOPMENT | STAGING | PRODUCTION)
│   ├── events/
│   │   ├── interfaces/
│   │   │   └── feature-flag-event-data.interface.ts                *
│   │   ├── feature-flag-created/feature-flag-created.event.ts      *
│   │   ├── feature-flag-environment-value-updated/
│   │   │   └── feature-flag-environment-value-updated.event.ts     *
│   │   └── feature-flag-archived/feature-flag-archived.event.ts    *
│   ├── exceptions/
│   │   ├── feature-flag-not-found.exception.ts                     *
│   │   └── feature-flag-key-already-exists.exception.ts             *
│   ├── interfaces/
│   │   └── feature-flag.interface.ts                                *   (IFeatureFlag — VO-typed ctor props)
│   ├── primitives/
│   │   └── feature-flag.primitives.ts                               *   (IFeatureFlagPrimitives extends BasePrimitives)
│   ├── repositories/
│   │   ├── read/feature-flag-read.repository.ts                     *   (IFeatureFlagReadRepository + token)
│   │   └── write/feature-flag-write.repository.ts                   *   (IFeatureFlagWriteRepository + token)
│   ├── value-objects/
│   │   ├── feature-flag-tenant-id/feature-flag-tenant-id.vo.ts       *
│   │   ├── feature-flag-key/feature-flag-key.vo.ts                   *
│   │   ├── feature-flag-name/feature-flag-name.vo.ts                 *
│   │   └── feature-flag-description/feature-flag-description.vo.ts  *
│   └── view-models/
│       └── feature-flag.view-model.ts                                *
├── application/
│   ├── commands/
│   │   ├── create-feature-flag/
│   │   │   ├── create-feature-flag.command.ts                       *
│   │   │   └── create-feature-flag.handler.ts                       *
│   │   ├── set-feature-flag-environment-value/
│   │   │   ├── set-feature-flag-environment-value.command.ts        *
│   │   │   └── set-feature-flag-environment-value.handler.ts        *
│   │   └── archive-feature-flag/
│   │       ├── archive-feature-flag.command.ts                      *
│   │       └── archive-feature-flag.handler.ts                      *
│   ├── queries/
│   │   ├── feature-flag-find-by-key/
│   │   │   ├── feature-flag-find-by-key.query.ts                    *
│   │   │   └── feature-flag-find-by-key.handler.ts                  *
│   │   ├── feature-flag-find-by-criteria/
│   │   │   ├── feature-flag-find-by-criteria.query.ts                *
│   │   │   └── feature-flag-find-by-criteria.handler.ts              *
│   │   └── evaluate-feature-flag/
│   │       ├── evaluate-feature-flag.query.ts                        *
│   │       └── evaluate-feature-flag.handler.ts                      *
│   └── services/
│       ├── read/assert-feature-flag-view-model-exists/
│       │   └── assert-feature-flag-view-model-exists.service.ts      *
│       └── write/
│           ├── assert-feature-flag-exists/
│           │   └── assert-feature-flag-exists.service.ts             *
│           └── assert-feature-flag-key-available/
│               └── assert-feature-flag-key-available.service.ts      *
├── infrastructure/
│   └── persistence/typeorm/
│       ├── entities/feature-flag.entity.ts                           *
│       ├── mappers/feature-flag-typeorm.mapper.ts                    *
│       └── repositories/
│           ├── feature-flag-typeorm-read.repository.ts                *
│           └── feature-flag-typeorm-write.repository.ts               *
├── transport/
│   ├── rest/
│   │   ├── feature-flags.controller.ts                                *
│   │   └── dtos/
│   │       ├── create-feature-flag.dto.ts                             *
│   │       ├── set-feature-flag-environment-value.dto.ts              *
│   │       └── feature-flag-rest-response.dto.ts                      *
│   ├── graphql/
│   │   ├── resolvers/
│   │   │   ├── feature-flag-queries.resolver.ts                       *
│   │   │   └── feature-flag-mutations.resolver.ts                     *
│   │   ├── dtos/
│   │   │   ├── requests/
│   │   │   │   ├── feature-flag-create.input.ts                       *
│   │   │   │   ├── feature-flag-set-environment-value.input.ts        *
│   │   │   │   ├── feature-flag-archive.input.ts                      *
│   │   │   │   ├── feature-flag-find-by-key.input.ts                  *
│   │   │   │   ├── feature-flag-evaluate.input.ts                     *
│   │   │   │   ├── feature-flag-filter.input.ts                       *   (createFilterInput)
│   │   │   │   └── feature-flag-sort.input.ts                         *   (createSortInput)
│   │   │   └── responses/
│   │   │       ├── feature-flag.object.ts                             *
│   │   │       └── paginated-feature-flag-result.object.ts            *
│   │   ├── mappers/feature-flag.mapper.ts                              *
│   │   ├── enums/
│   │   │   ├── feature-flag-registered-enums.graphql.ts                *
│   │   │   └── feature-flag-queryable-field.enum.ts                    *
│   │   └── registries/
│   │       ├── feature-flag-filterable-fields.registry.ts               *
│   │       └── feature-flag-filterable-fields.registry.spec.ts          *
│   └── mcp/
│       ├── tools/
│       │   ├── feature-flag-create.tool.ts                            *
│       │   ├── feature-flag-set-environment-value.tool.ts             *
│       │   ├── feature-flag-archive.tool.ts                           *
│       │   ├── feature-flag-find-by-key.tool.ts                       *
│       │   ├── feature-flags-find-by-criteria.tool.ts                 *
│       │   └── feature-flag-evaluate.tool.ts                          *
│       └── schemas/
│           ├── feature-flag-create.schema.ts                          *
│           ├── feature-flag-set-environment-value.schema.ts           *
│           ├── feature-flag-archive.schema.ts                         *
│           ├── feature-flag-find-by-key.schema.ts                     *
│           ├── feature-flags-find-by-criteria.schema.ts               *
│           └── feature-flag-evaluate.schema.ts                        *
└── flags.module.ts                                                    *

src/database/migrations/
└── <timestamp>-CreateFeatureFlags.ts                                  *

src/contexts/contexts.module.ts                                       MODIFIED (register FlagsModule in CONTEXT_MODULES)
src/core/filters/base-exception.filter.ts                              MODIFIED (register FeatureFlag exceptions — see §3.6)
src/contexts/flags/README.md                                           *   (public surface doc, required by openspec/config.yaml)
```

---

## 3. Domain Layer

### 3.1 `FeatureFlagAggregate` (extends `BaseAggregate`)

**Fields (private, all VOs — per `openspec/config.yaml` "aggregate fields MUST always be value objects"):**
- `_id: UuidValueObject` (readonly)
- `_tenantId: FeatureFlagTenantIdValueObject` (readonly)
- `_key: FeatureFlagKeyValueObject` (readonly — immutable once created; renaming a key is out of scope)
- `_name: FeatureFlagNameValueObject`
- `_description: FeatureFlagDescriptionValueObject | null`
- `_developmentEnabled: BooleanValueObject`
- `_stagingEnabled: BooleanValueObject`
- `_productionEnabled: BooleanValueObject`
- `_archived: BooleanValueObject`

**Constructor**: hydration only (`constructor(props: IFeatureFlag)`), calls `super(props.createdAt, props.updatedAt)`. No `apply()` calls here (hard rule).

**`create(): void`** — emits `FeatureFlagCreatedEvent` with `this.toPrimitives()`.

**`setEnvironmentValue(environment: FeatureFlagEnvironmentEnum, enabled: BooleanValueObject): void`**
- Switches on `environment` and reassigns the matching private field (`_developmentEnabled`/`_stagingEnabled`/`_productionEnabled`).
- `this.touch()`.
- Emits `FeatureFlagEnvironmentValueUpdatedEvent` with `{ ...this.toPrimitives(), environment: environment }`.

**`archive(): void`** — `this._archived = new BooleanValueObject(true)`, `this.touch()`, emits `FeatureFlagArchivedEvent` with `this.toPrimitives()`. No-op guard: if already archived, still emits (idempotent at the handler level via the assert service, see §4.3).

**`toPrimitives(): IFeatureFlagPrimitives`** — unwraps every VO via `.value`; `description` → `this._description?.value ?? null`.

**Getters**: `id`, `tenantId`, `key`, `name`, `description`, `developmentEnabled`, `stagingEnabled`, `productionEnabled`, `archived` — all return the unwrapped primitive except where a raw VO is more useful (`tenantId`/`key` as `string` for equality checks in assert services).

### 3.2 Value Objects

| VO | Base | Rules |
|----|------|-------|
| `FeatureFlagTenantIdValueObject` | `StringValueObject` | `{ maxLength: 100, allowEmpty: false }` — deliberately **no format validation** (no UUID requirement); it's an opaque caller-supplied string until identity-service exists |
| `FeatureFlagKeyValueObject` | `StringValueObject` | `{ maxLength: 100, allowEmpty: false, pattern: /^[a-z0-9]+(-[a-z0-9]+)*$/ }` — kebab-case slug, matches how flag keys are written in every feature-flag product |
| `FeatureFlagNameValueObject` | `StringValueObject` | `{ maxLength: 150, allowEmpty: false }` |
| `FeatureFlagDescriptionValueObject` | `StringValueObject` | `{ maxLength: 500, allowEmpty: false }` — only instantiated when a non-empty value is present; absence is `null` at the aggregate level (same optional-VO pattern as `gardenia-api`'s `plants` context) |

Environment booleans and `archived` use the kit's `BooleanValueObject` directly (no bespoke subclass needed).

### 3.3 `FeatureFlagEnvironmentEnum` (`domain/enums/feature-flag-environment.enum.ts`)

```ts
export enum FeatureFlagEnvironmentEnum {
  DEVELOPMENT = 'development',
  STAGING = 'staging',
  PRODUCTION = 'production',
}
```

### 3.4 `IFeatureFlagPrimitives`

```ts
export type IFeatureFlagPrimitives = BasePrimitives & {
  tenantId: string;
  key: string;
  name: string;
  description: string | null;
  developmentEnabled: boolean;
  stagingEnabled: boolean;
  productionEnabled: boolean;
  archived: boolean;
};
```

### 3.5 `FeatureFlagBuilder` (`@Injectable`, extends `BaseBuilder<FeatureFlagAggregate, FeatureFlagViewModel>`)

Fluent setters for every field (`withTenantId`, `withKey`, `withName`, `withDescription`, `withDevelopmentEnabled`, `withStagingEnabled`, `withProductionEnabled`, `withArchived`, plus inherited `withId`/`withCreatedAt`/`withUpdatedAt`).

`validate()`: `super.validate()` + require `tenantId`, `key`, `name` via `FieldIsRequiredException`. `description` is not required. Environment booleans and `archived` default to `false` when unset (the builder applies these defaults, not the caller).

### 3.6 Exceptions

- `FeatureFlagNotFoundException extends BaseException` — `constructor(tenantId: string, key: string)`.
- `FeatureFlagKeyAlreadyExistsException extends BaseException` — `constructor(tenantId: string, key: string)`.

**MANDATORY filter wiring** (`src/core/filters/base-exception.filter.ts` — MODIFIED): add `FeatureFlagNotFoundException` to the 404 branch, `FeatureFlagKeyAlreadyExistsException` to the 409 (CONFLICT) branch. Applies to both REST and GraphQL (the filter implements both `ExceptionFilter` and `GqlExceptionFilter`).

### 3.7 Repository Interfaces

```ts
// read
export const FEATURE_FLAG_READ_REPOSITORY = Symbol('FEATURE_FLAG_READ_REPOSITORY');
export interface IFeatureFlagReadRepository extends IBaseReadRepository<FeatureFlagViewModel> {
  findByTenantAndKey(tenantId: string, key: string): Promise<FeatureFlagViewModel | null>;
}

// write
export const FEATURE_FLAG_WRITE_REPOSITORY = Symbol('FEATURE_FLAG_WRITE_REPOSITORY');
export interface IFeatureFlagWriteRepository extends IBaseWriteRepository<FeatureFlagAggregate> {
  findByTenantAndKey(tenantId: string, key: string): Promise<FeatureFlagAggregate | null>;
}
```

The extra method is the load-bearing lookup for every command/query except `FeatureFlagFindByCriteria` (which uses the generic `findByCriteria`).

---

## 4. Application Layer

### 4.1 `CreateFeatureFlagCommand` + Handler

**Inputs**: `{ tenantId: string; key: string; name: string; description?: string }`. Command constructor wraps each in its VO.

**Handler**:
1. `await this.assertFeatureFlagKeyAvailableService.execute(command.tenantId, command.key)` — throws `FeatureFlagKeyAlreadyExistsException` if a non-archived or any flag with that `(tenantId, key)` already exists (uniqueness holds regardless of `archived` state — a key is never reused, even after archiving, to avoid resurrecting stale evaluation results for old consumers).
2. Build aggregate via `FeatureFlagBuilder` with `withId(UuidValueObject.generate().value)`, all three environment booleans defaulted to `false`, `archived` defaulted to `false`, timestamps `now`.
3. `flag.create()`.
4. `await this.featureFlagWriteRepository.save(flag)`.
5. `await this.publishEvents(flag)`.
6. Returns `flag.id.value` (string) — no re-fetch.

Dependencies: `FEATURE_FLAG_WRITE_REPOSITORY`, `FeatureFlagBuilder`, `AssertFeatureFlagKeyAvailableService`, `EventBus`.

### 4.2 `SetFeatureFlagEnvironmentValueCommand` + Handler

**Inputs**: `{ tenantId: string; key: string; environment: FeatureFlagEnvironmentEnum; enabled: boolean }`.

**Handler**:
1. `const flag = await this.assertFeatureFlagExistsService.execute(command.tenantId, command.key)`.
2. `flag.setEnvironmentValue(command.environment, new BooleanValueObject(command.enabled))`.
3. `await this.featureFlagWriteRepository.save(flag)`.
4. `await this.publishEvents(flag)`.

Returns `void`. Setting the same value twice is a no-op at the data level but still emits the event (idempotent semantics, simplest correct behavior for MVP).

### 4.3 `ArchiveFeatureFlagCommand` + Handler

**Inputs**: `{ tenantId: string; key: string }`.

**Handler**: `assertFeatureFlagExistsService.execute(...)` → `flag.archive()` → `save` → `publishEvents`. **Archiving an already-archived flag is idempotent** (no error) — the assert service finds it regardless of `archived` state; only a genuinely missing `(tenantId, key)` throws `FeatureFlagNotFoundException`.

### 4.4 `FeatureFlagFindByKeyQuery` + Handler

**Inputs**: `{ tenantId: string; key: string }`. Delegates to `AssertFeatureFlagViewModelExistsService` → `FeatureFlagViewModel`, throws `FeatureFlagNotFoundException` (404) if absent.

### 4.5 `FeatureFlagFindByCriteriaQuery` + Handler

**Inputs**: `{ criteria: Criteria }`. `@Inject(FEATURE_FLAG_READ_REPOSITORY)`, delegates directly to `findByCriteria`. Callers MUST include a `tenantId` `EQUALS` filter to scope results (nothing enforces this server-side in the MVP — see Risks §11).

### 4.6 `EvaluateFeatureFlagQuery` + Handler

**Inputs**: `{ tenantId: string; key: string; environment: FeatureFlagEnvironmentEnum }`.

**Handler** (the one handler in this context that does NOT use an assert service — fail-safe by design):
1. `const flag = await this.featureFlagReadRepository.findByTenantAndKey(query.tenantId, query.key)`.
2. `if (!flag || flag.archived) return false`.
3. `return { development: flag.developmentEnabled, staging: flag.stagingEnabled, production: flag.productionEnabled }[query.environment]`.

Never throws `FeatureFlagNotFoundException` — a missing/archived flag evaluates to `false`. This is the one deliberate exception to "assert services for existence checks": the whole point of this query is to never break a caller's request path because a flag doesn't exist yet.

### 4.7 Assert Services

- `AssertFeatureFlagViewModelExistsService` (read, `services/read/`): `execute(tenantId, key) → FeatureFlagViewModel`, throws `FeatureFlagNotFoundException`. Used by `FeatureFlagFindByKeyQueryHandler`.
- `AssertFeatureFlagExistsService` (write, `services/write/`): `execute(tenantId, key) → FeatureFlagAggregate`, throws `FeatureFlagNotFoundException`. Used by `SetEnvironmentValue`/`Archive` handlers.
- `AssertFeatureFlagKeyAvailableService` (write, `services/write/`): `execute(tenantId, key) → void`, throws `FeatureFlagKeyAlreadyExistsException` when `findByTenantAndKey` returns non-null. Used by `CreateFeatureFlag`.

---

## 5. Infrastructure Layer

### 5.1 `FeatureFlagTypeOrmEntity` (`@Entity('feature_flags')`)

| Property | Decorator | Type |
|----------|-----------|------|
| `id` | `@PrimaryGeneratedColumn('uuid')` | `string` |
| `tenantId` | `@Column({ name: 'tenant_id', type: 'varchar', length: 100 })` | `string` |
| `key` | `@Column({ type: 'varchar', length: 100 })` | `string` |
| `name` | `@Column({ type: 'varchar', length: 150 })` | `string` |
| `description` | `@Column({ type: 'varchar', length: 500, nullable: true })` | `string \| null` |
| `developmentEnabled` | `@Column({ name: 'development_enabled', type: 'boolean', default: false })` | `boolean` |
| `stagingEnabled` | `@Column({ name: 'staging_enabled', type: 'boolean', default: false })` | `boolean` |
| `productionEnabled` | `@Column({ name: 'production_enabled', type: 'boolean', default: false })` | `boolean` |
| `archived` | `@Column({ type: 'boolean', default: false })` | `boolean` |
| `createdAt` / `updatedAt` | `@CreateDateColumn` / `@UpdateDateColumn` | `Date` |

A unique index `UQ_feature_flags_tenant_key` on `(tenant_id, "key")` enforces uniqueness at the DB level as a backstop to `AssertFeatureFlagKeyAvailableService` (which has a race window between check and save — acceptable for MVP; the DB constraint is the real guarantee, the assert service exists to turn the raw constraint violation into a clean domain exception in the common case). A second plain index on `tenant_id` alone supports `FeatureFlagFindByCriteria`.

### 5.2 `FeatureFlagTypeOrmMapper`

`toAggregate`, `toEntity`, `toViewModel` — mirrors the standard three-method mapper shape used everywhere else in this template family.

### 5.3 Repositories

`FeatureFlagTypeOrmReadRepository implements IFeatureFlagReadRepository`:
- `findById(id)`, `findByCriteria(criteria)` (standard `QueryBuilder` translation per the mandatory Criteria pattern), `findByTenantAndKey(tenantId, key)` → `repo.findOne({ where: { tenantId, key } })` → view model or `null`.
- `save`/`delete` — no-op stubs (read-side projection convention).

`FeatureFlagTypeOrmWriteRepository implements IFeatureFlagWriteRepository`:
- `findById`, `save` (create-or-update via TypeORM `save`), `delete` (hard delete — unused in the MVP flow since `ArchiveFeatureFlag` calls `save`, not `delete`; kept only to satisfy `IBaseWriteRepository`), `findByTenantAndKey`.
- `findByCriteria` → `throw new Error('Method not implemented.')` (write side never queries by criteria — template convention).

---

## 6. Transport Layer

### 6.1 REST — `FeatureFlagsController` (`@Controller('feature-flags')`)

All routes sit behind the global `ApiKeyGuard` (no per-route guard needed — it's `APP_GUARD`).

| Endpoint | Dispatch | Success |
|----------|----------|---------|
| `POST /feature-flags` | body `{ tenantId, key, name, description? }` → `CreateFeatureFlagCommand` | 201, `FeatureFlagRestResponseDto` |
| `GET /feature-flags` | query `tenantId` (required) + optional Criteria filters/pagination → `FeatureFlagFindByCriteriaQuery` | 200, paginated |
| `GET /feature-flags/:key` | query `tenantId` (required) → `FeatureFlagFindByKeyQuery` | 200 / 404 |
| `PATCH /feature-flags/:key/environments/:environment` | body `{ tenantId, enabled }` → `SetFeatureFlagEnvironmentValueCommand` | 200 / 404 |
| `DELETE /feature-flags/:key` | body/query `tenantId` → `ArchiveFeatureFlagCommand` | 204 / 404 |
| `GET /feature-flags/:key/evaluate/:environment` | query `tenantId` (required) → `EvaluateFeatureFlagQuery` | 200, `{ enabled: boolean }` — **never 404** |

Controller dispatches only via `CommandBus`/`QueryBus` (hard rule) and maps results through a `FeatureFlagRestMapper` (1:1 field copy, no logic).

### 6.2 GraphQL

`FeatureFlagQueriesResolver`: `featureFlagFindByKey`, `featureFlagsFindByCriteria` (wired with `FilterValidationPipe(featureFlagFilterableFields)` per the mandatory Criteria pattern), `featureFlagEvaluate`.

`FeatureFlagMutationsResolver`: `featureFlagCreate`, `featureFlagSetEnvironmentValue`, `featureFlagArchive` — all return `MutationResponseDto` from the kit (via the globally-provided `MutationResponseGraphQLMapper` — never add it to this module's providers, per the architecture skill's hard rule #3).

`FeatureFlagQueryableField` enum whitelists: `TENANT_ID`, `KEY`, `NAME`, `ARCHIVED`, `DEVELOPMENT_ENABLED`, `STAGING_ENABLED`, `PRODUCTION_ENABLED`. Registered in `feature-flag-registered-enums.graphql.ts` alongside `FeatureFlagEnvironmentEnum`.

### 6.3 MCP

One `{Name}McpTool` per command/query (6 total), each dispatching through the same Command/QueryBus as the other transports, tagged `@McpTool()` + `@Injectable()`, registered in an `MCP_TOOLS` array spread into `FlagsModule` providers. Tool names (snake_case, entity-prefixed): `feature_flag_create`, `feature_flag_set_environment_value`, `feature_flag_archive`, `feature_flag_find_by_key`, `feature_flags_find_by_criteria`, `feature_flag_evaluate`. Each tool's Zod `inputSchema` lives in its own file under `transport/mcp/schemas/`.

> This context has no auth/tenancy context of its own beyond the global API key, so every MCP tool implements `IMcpTool<IBaseMcpToolContext>` (the default `{ requestId }` context) — no custom `TContext` needed, matching `core.module.ts`'s existing comment ("No auth yet, so the default context builder is used").

---

## 7. Auth — `src/core/auth/` (cross-cutting, NOT a bounded context)

`ApiKeyGuard implements CanActivate`:
```ts
canActivate(context: ExecutionContext): boolean {
  const req = this.extractRequest(context); // GqlExecutionContext.create(context).getContext().req for GraphQL, context.switchToHttp().getRequest() otherwise
  const provided = req.headers['x-api-key'];
  const expected = this.configService.getOrThrow<string>('auth.apiKey');
  if (!provided || provided !== expected) {
    throw new UnauthorizedException('Invalid or missing API key');
  }
  return true;
}
```

Registered in `CoreModule` as `{ provide: APP_GUARD, useClass: ApiKeyGuard }`. `authConfig` (`registerAs('auth', ...)`) added to `ConfigModule.load`. `env.validation.ts` gains a required `FEATURE_FLAGS_API_KEY` string (min length, e.g. 32 chars, to discourage trivial keys).

No domain exception wrapping — `UnauthorizedException` (built-in Nest, → 401) is sufficient; this is a transport/infra concern, not a domain rule.

---

## 8. Module Registration — `FlagsModule`

Follows the standard grouped-array pattern (`COMMAND_HANDLERS`, `QUERY_HANDLERS`, `APPLICATION_SERVICES`, `DOMAIN_BUILDERS`, `INFRASTRUCTURE_REPOSITORIES`, `INFRASTRUCTURE_MAPPERS`, `INFRASTRUCTURE_ENTITIES`, `TRANSPORT_PROVIDERS` including REST controller + GraphQL resolvers + MCP tools) spread into `@Module({ imports: [CqrsModule, TypeOrmModule.forFeature(INFRASTRUCTURE_ENTITIES)], controllers: [...], providers: [...] })`. Registered in `src/contexts/contexts.module.ts`'s `CONTEXT_MODULES` array (never imported directly in `AppModule`, per the architecture skill's hard rule #7).

---

## 9. Migration

Hand-written TypeScript migration `<timestamp>-CreateFeatureFlags.ts`: creates `feature_flags` table per §5.1, plus `UQ_feature_flags_tenant_key` unique index and a plain index on `tenant_id`. `down()` drops the table.

---

## 10. Dependency Injection Map

| Token | Bound class | Used by |
|-------|-------------|---------|
| `FEATURE_FLAG_READ_REPOSITORY` | `FeatureFlagTypeOrmReadRepository` | `FeatureFlagFindByCriteriaQueryHandler`, `EvaluateFeatureFlagQueryHandler`, `AssertFeatureFlagViewModelExistsService` |
| `FEATURE_FLAG_WRITE_REPOSITORY` | `FeatureFlagTypeOrmWriteRepository` | `CreateFeatureFlagCommandHandler`, `AssertFeatureFlagExistsService`, `AssertFeatureFlagKeyAvailableService` |

`ApiKeyGuard` is process-wide (`APP_GUARD` in `CoreModule`) — not injected into `FlagsModule` at all.

---

## 11. Architectural Risks & Assumptions Requiring Validation

1. **Tenant scoping is caller-enforced, not server-enforced (HIGH, explicit MVP tradeoff).** Nothing stops a caller from omitting the `tenantId` filter on `FeatureFlagFindByCriteria` and reading flags across all tenants — there is no ambient tenant context (no `SpaceContext` equivalent) because identity-service doesn't exist. This is acceptable **only** because the single static API key is already a trust boundary around the whole service in this MVP. Must be revisited the moment a second real tenant/customer touches this service.
2. **Key immutability (MED).** `key` is `readonly` on the aggregate — there is no `RenameFeatureFlag` command. If a consumer needs to rename a flag, they archive and recreate. Explicit MVP simplification, callable out if the user disagrees.
3. **Race on create (LOW/MED).** `AssertFeatureFlagKeyAvailableService` check + `save` is not atomic; the DB unique index is the real guarantee. The write repository's `save()` should catch the Postgres unique-violation error code and rethrow as `FeatureFlagKeyAlreadyExistsException` so both races and the common case surface the same domain exception — this must be an explicit task, not an afterthought.
4. **Archived flags keep their key forever (LOW).** Re-using a key after archiving is disallowed (see §4.1) — if this is too strict for the user's workflow (e.g. "delete and recreate with the same key" is a common flag-management pattern), this is the one design choice most likely to get pushback and is easy to relax later (allow create when the only existing match is `archived = true`).
