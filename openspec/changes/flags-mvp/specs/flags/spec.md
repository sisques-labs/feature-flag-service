# Flags Specification

## Purpose

This spec governs the `flags` bounded context — the 1st and only context in `feature-flag-service`'s MVP. It defines the `FeatureFlagAggregate`, its CRUD-minus-D (create/toggle/archive) commands and queries, dual REST+GraphQL+MCP transport, and the global API-key authentication that protects every endpoint. Real multi-tenancy (validated `tenantId`), percentage rollout, targeting rules, realtime push, and an admin UI are explicitly OUT OF SCOPE for this MVP.

## Requirements

### Requirement: FeatureFlagAggregate Fields and Validation

The `FeatureFlagAggregate` MUST carry: `id` (UUID, generated), `tenantId` (non-empty string, ≤100 chars, opaque — no format constraint), `key` (non-empty kebab-case string, ≤100 chars, immutable once created), `name` (non-empty string, ≤150 chars), `description` (optional string, ≤500 chars), `developmentEnabled`/`stagingEnabled`/`productionEnabled` (booleans, default `false`), `archived` (boolean, default `false`), `createdAt`, `updatedAt`.

The system MUST reject aggregate creation when `key` does not match the kebab-case pattern (`^[a-z0-9]+(-[a-z0-9]+)*$`) or when `tenantId`/`key`/`name` are empty.

#### Scenario: Valid flag aggregate

- GIVEN a tenantId, a kebab-case key, a name, and no description
- WHEN a FeatureFlagAggregate is built
- THEN all fields are set, the three environment booleans and `archived` default to `false`, and the aggregate is valid

#### Scenario: Invalid key format rejected

- GIVEN a key containing uppercase letters or spaces (e.g. `"New Flag"`)
- WHEN a FeatureFlagAggregate is built
- THEN a domain validation error is thrown

---

### Requirement: CreateFeatureFlag Command

The system MUST allow creating a flag given `tenantId`, `key`, `name`, and an optional `description`.

The command MUST reject creation when a flag with the same `(tenantId, key)` already exists, regardless of that existing flag's `archived` state.

On success the handler MUST emit `FeatureFlagCreated` and return the new flag's `id`, without re-fetching the aggregate.

#### Scenario: Happy path — flag created

- GIVEN no flag exists for tenant `t1` with key `new-checkout`
- WHEN CreateFeatureFlag is dispatched with tenantId `t1`, key `new-checkout`, name `New Checkout`
- THEN a FeatureFlagAggregate is persisted with all environments disabled, FeatureFlagCreated is emitted, and the flag id is returned

#### Scenario: Duplicate key rejected

- GIVEN a flag already exists for tenant `t1` with key `new-checkout` (active or archived)
- WHEN CreateFeatureFlag is dispatched with the same tenantId and key
- THEN FeatureFlagKeyAlreadyExistsException is thrown and a 409 is returned, and no new aggregate is persisted

---

### Requirement: SetFeatureFlagEnvironmentValue Command

The system MUST allow toggling a single environment's boolean value for an existing flag, identified by `(tenantId, key)`, without affecting the other two environments.

#### Scenario: Toggle one environment independently

- GIVEN a flag with all environments disabled
- WHEN SetFeatureFlagEnvironmentValue is dispatched for `staging` with `enabled: true`
- THEN `stagingEnabled` becomes `true` while `developmentEnabled` and `productionEnabled` remain `false`, and FeatureFlagEnvironmentValueUpdated is emitted

#### Scenario: Flag not found

- GIVEN no flag exists for the given `(tenantId, key)`
- WHEN SetFeatureFlagEnvironmentValue is dispatched
- THEN FeatureFlagNotFoundException is thrown and a 404 is returned

---

### Requirement: ArchiveFeatureFlag Command

The system MUST allow archiving (soft-deleting) a flag identified by `(tenantId, key)`. Archiving MUST be idempotent — archiving an already-archived flag succeeds without error.

Archived flags MUST NOT be physically removed from storage.

#### Scenario: Archive an active flag

- GIVEN an active (non-archived) flag
- WHEN ArchiveFeatureFlag is dispatched
- THEN `archived` becomes `true`, FeatureFlagArchived is emitted, and the row still exists in storage

#### Scenario: Archiving twice is a no-op

- GIVEN a flag that is already archived
- WHEN ArchiveFeatureFlag is dispatched again for the same `(tenantId, key)`
- THEN the command succeeds without error and the flag remains archived

#### Scenario: Flag not found

- GIVEN no flag exists for the given `(tenantId, key)`
- WHEN ArchiveFeatureFlag is dispatched
- THEN FeatureFlagNotFoundException is thrown and a 404 is returned

---

### Requirement: FeatureFlagFindByKey Query

The system MUST return a `FeatureFlagViewModel` for a given `(tenantId, key)`.

If no flag exists for that `(tenantId, key)` the system MUST throw `FeatureFlagNotFoundException`.

#### Scenario: Happy path — flag returned

- GIVEN a flag exists for `(t1, new-checkout)`
- WHEN FeatureFlagFindByKey is dispatched with tenantId `t1`, key `new-checkout`
- THEN the FeatureFlagViewModel is returned

#### Scenario: Not found

- GIVEN no flag exists for `(t1, missing-flag)`
- WHEN FeatureFlagFindByKey is dispatched
- THEN FeatureFlagNotFoundException is thrown and a 404 is returned

---

### Requirement: FeatureFlagFindByCriteria Query

The system MUST return a `PaginatedResult<FeatureFlagViewModel>` filtered by the provided Criteria, using the type-safe Criteria pattern (queryable-field whitelist + filterable-fields registry) mandated for every context in this codebase.

The query MUST NOT silently drop filters — every filter in `criteria.filters` MUST be translated into the underlying `QueryBuilder` WHERE clause.

#### Scenario: Filter by tenantId

- GIVEN tenant `t1` has two flags and tenant `t2` has one flag
- WHEN FeatureFlagFindByCriteria is dispatched with a filter `tenantId EQUALS t1`
- THEN only tenant `t1`'s two flags are returned

#### Scenario: Filter by archived state

- GIVEN a tenant has one active flag and one archived flag
- WHEN FeatureFlagFindByCriteria is dispatched with filters `tenantId EQUALS <tenant>` and `archived EQUALS false`
- THEN only the active flag is returned

---

### Requirement: EvaluateFeatureFlag Query — Fail-Safe

The system MUST return a boolean value for a given `(tenantId, key, environment)`, sourced from the corresponding environment field on the matching flag.

The system MUST return `false` — and MUST NOT throw `FeatureFlagNotFoundException` — when no flag exists for the given `(tenantId, key)`, or when the matching flag is archived. This query is the one exception in this context to the "assert service throws on missing entity" convention: it exists specifically so a consumer's request path never breaks because a flag hasn't been created yet.

#### Scenario: Evaluate an enabled flag

- GIVEN a flag for `(t1, new-checkout)` has `stagingEnabled: true`
- WHEN EvaluateFeatureFlag is dispatched for tenantId `t1`, key `new-checkout`, environment `staging`
- THEN `true` is returned

#### Scenario: Evaluate a missing flag — fail-safe false

- GIVEN no flag exists for `(t1, does-not-exist)`
- WHEN EvaluateFeatureFlag is dispatched for that tenantId/key/environment
- THEN `false` is returned and no exception is thrown

#### Scenario: Evaluate an archived flag — fail-safe false

- GIVEN a flag for `(t1, old-flag)` is archived and had `productionEnabled: true` before archiving
- WHEN EvaluateFeatureFlag is dispatched for tenantId `t1`, key `old-flag`, environment `production`
- THEN `false` is returned

---

### Requirement: REST Transport

The system MUST expose the following endpoints, all protected by the global API-key guard:

| Method | Path | Handler | Success Code |
|--------|------|---------|--------------|
| POST | /feature-flags | CreateFeatureFlag | 201 |
| GET | /feature-flags | FeatureFlagFindByCriteria | 200 |
| GET | /feature-flags/:key | FeatureFlagFindByKey | 200 |
| PATCH | /feature-flags/:key/environments/:environment | SetFeatureFlagEnvironmentValue | 200 |
| DELETE | /feature-flags/:key | ArchiveFeatureFlag | 204 |
| GET | /feature-flags/:key/evaluate/:environment | EvaluateFeatureFlag | 200 |

Response bodies MUST use `FeatureFlagRestResponseDto` mapped from `FeatureFlagViewModel`; the evaluate endpoint MUST return `{ enabled: boolean }` and MUST always respond 200 (never 404) regardless of whether the flag exists.

---

### Requirement: GraphQL Transport

The system MUST expose GraphQL operations, protected by the same global API-key guard:

**Queries**: `featureFlagFindByKey`, `featureFlagsFindByCriteria`, `featureFlagEvaluate`
**Mutations**: `featureFlagCreate`, `featureFlagSetEnvironmentValue`, `featureFlagArchive`

Both resolvers MUST dispatch exclusively via `CommandBus`/`QueryBus`. `featureFlagsFindByCriteria` MUST validate incoming filters against `featureFlagFilterableFields` before execution.

---

### Requirement: MCP Transport

The system MUST expose every command and query listed above as an MCP tool (`feature_flag_create`, `feature_flag_set_environment_value`, `feature_flag_archive`, `feature_flag_find_by_key`, `feature_flags_find_by_criteria`, `feature_flag_evaluate`), each validating its arguments against a co-located Zod schema and dispatching through the same Command/QueryBus as REST and GraphQL.

---

### Requirement: Global API-Key Authentication

The system MUST require a valid `X-Api-Key` header, matching the `FEATURE_FLAGS_API_KEY` environment variable, on every REST, GraphQL, and MCP request.

Requests with a missing or incorrect API key MUST be rejected with HTTP 401 before any command/query handler executes.

#### Scenario: Missing API key rejected

- GIVEN no `X-Api-Key` header is sent
- WHEN any feature-flag endpoint is called (REST, GraphQL, or MCP)
- THEN the request is rejected with 401 and no handler executes

#### Scenario: Valid API key accepted

- GIVEN the `X-Api-Key` header matches `FEATURE_FLAGS_API_KEY`
- WHEN any feature-flag endpoint is called
- THEN the request proceeds to the corresponding handler

---

## Non-Functional Requirements

- Every endpoint (REST/GraphQL/MCP) MUST require a valid `X-Api-Key`.
- `EvaluateFeatureFlag` MUST resolve via a direct indexed `(tenantId, key)` lookup — no Criteria/pagination overhead on this path.
- Test coverage MUST be ≥ 80% for the `flags` context. Tests MUST cover unit (domain + handlers), integration (persistence + uniqueness constraint), and E2E (REST + GraphQL + MCP smoke) layers.

---

## Domain Events

| Event | Payload |
|-------|---------|
| `FeatureFlagCreated` | `{ id, tenantId, key, name, description, developmentEnabled, stagingEnabled, productionEnabled, archived, createdAt, updatedAt }` |
| `FeatureFlagEnvironmentValueUpdated` | same snapshot + `environment` |
| `FeatureFlagArchived` | full snapshot with `archived: true` |

All events extend `BaseEvent<TData>`.

---

## Error Scenarios

| Exception | Code | Trigger |
|-----------|------|---------|
| `FeatureFlagNotFoundException` | 404 | `(tenantId, key)` does not match any flag — on FindByKey, SetEnvironmentValue, Archive |
| `FeatureFlagKeyAlreadyExistsException` | 409 | `(tenantId, key)` already exists — on Create |
| Validation error | 400 | `key` fails the kebab-case pattern; `name`/`tenantId` empty; DTO class-validator constraint fails |
| `UnauthorizedException` | 401 | Missing/incorrect `X-Api-Key` |

---

## Out of Scope

- Real tenant validation/auth (`tenantId` is caller-supplied and unvalidated) — deferred to `identity-service`.
- Percentage rollout, attribute-based targeting, segments, multivariate flags.
- Realtime push delivery (SSE/WebSocket) — pull API only.
- Admin UI — separate repo, future work.
- Audit log / change history beyond `createdAt`/`updatedAt`.
- Hard delete of flags.
- Renaming a flag's `key` after creation.
- Per-tenant or per-key API keys — one global static key for the MVP.
