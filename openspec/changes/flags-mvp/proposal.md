# Proposal: Feature Flags MVP

## Intent

`feature-flag-service` is a brand-new microservice cloned from `nestjs-template`. It ships the cross-cutting infrastructure (`src/core/`, `src/support/`) but has **zero bounded contexts** — this change introduces `flags`, the first one, and therefore also defines the pattern every future context in this service follows.

Why now: Gardenia needs a way to turn functionality on/off per environment without redeploying `gardenia-api`/`gardenia-web`. There is no `identity-service` yet (it will own tenants/users later), so this MVP deliberately keeps tenancy as an **opaque, unvalidated `tenantId` string** on every flag — a placeholder that becomes real multi-tenant auth once identity-service exists, without a data-model rewrite.

Success looks like: an API client can create a flag, toggle it on/off independently per environment (`development`/`staging`/`production`), and a consumer service (gardenia-api or gardenia-web) can evaluate a flag by `tenantId` + `key` + `environment` over a pull REST/GraphQL API, authenticated with a static API key.

## Scope

### In Scope

- New `flags` bounded context under `src/contexts/flags/` (domain → application → infrastructure → transport), first context in this service — establishes the reference pattern (see `design.md`).
- `FeatureFlagAggregate`: `tenantId` (opaque string, unvalidated), `key` (kebab-case slug, unique per tenant), `name`, `description` (optional), three independent booleans — `developmentEnabled`, `stagingEnabled`, `productionEnabled` — and `archived` (soft-delete flag).
- Commands: `CreateFeatureFlag`, `SetFeatureFlagEnvironmentValue` (toggle one environment), `ArchiveFeatureFlag` (soft-delete).
- Queries: `FeatureFlagFindByKey` (admin lookup), `FeatureFlagFindByCriteria` (list/filter by `tenantId`/`archived`/environment value — mandatory Criteria pattern per `openspec/config.yaml`), `EvaluateFeatureFlag` (fast consumption path: `tenantId` + `key` + `environment` → boolean, fail-safe to `false` when the flag doesn't exist).
- DUAL transport: REST + GraphQL (both already scaffolded by the template) using the **same** Command/QueryBus handlers.
- MCP tools for every command/query (mandatory per `openspec/config.yaml` — every context exposes its public commands/queries as MCP tools).
- New cross-cutting **API-key guard** (`src/core/auth/`) wired globally (`APP_GUARD`) protecting every endpoint (REST, GraphQL, MCP) with a single static key read from `FEATURE_FLAGS_API_KEY`. This is transversal infrastructure, not a bounded context.
- Migration creating the `feature_flags` table with a unique `(tenant_id, key)` index.
- Tests at all applicable layers: unit (domain + handlers), integration (persistence, using the template's `test/integration` + Testcontainers Postgres), E2E (REST + GraphQL, using `test/*.e2e-spec.ts`).
- `README.md` at `src/contexts/flags/README.md` documenting the context's public surface (required by `openspec/config.yaml` apply rules).

### Out of Scope (explicit — future phases)

- **Real multi-tenancy / tenant auth.** `tenantId` is a free-form string the caller supplies; nothing validates it belongs to a real tenant. `identity-service` will own this later — at that point the API-key guard is replaced/extended, not the flag data model.
- **Percentage rollout, attribute-based targeting, segments.** On/off per environment only.
- **Realtime push (SSE/WebSocket).** Consumers pull; documented as a future iteration.
- **Admin UI.** Lives in a separate repo (e.g. `feature-flag-service-web`), not built here. This MVP is API/Swagger/GraphQL-Playground/MCP only.
- **Audit log / change history / versioning** of flag changes beyond `createdAt`/`updatedAt`.
- **Hard delete.** `ArchiveFeatureFlag` is a soft-delete (`archived = true`); flags are never physically removed in the MVP.
- **Per-key or per-tenant API keys.** One global static key for the whole service in this MVP.

## Risks

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| `tenantId` typos/collisions across callers (no validation) | Med | Low | Acceptable for MVP — documented explicitly as a placeholder; `(tenant_id, key)` uniqueness still enforced at the DB level |
| Static API key leaks or is shared too broadly | Low | High | Single env var, never logged; rotate by redeploying with a new `FEATURE_FLAGS_API_KEY`; documented as a stopgap until identity-service |
| `EvaluateFeatureFlag` becomes a latency-sensitive hot path called on every gardenia-api/web request | Med | Med | Direct indexed lookup by `(tenant_id, key)` (no Criteria overhead on this path); caching is an explicit future iteration, not blocking MVP |
| First bounded context in this service sets a bad precedent for the whole template | Med | High | Follow the `architecture` skill and `openspec/config.yaml` rules exactly (Criteria pattern, MCP tools, assert services, VO-only aggregate fields); this design doc is the canonical reference for the next context |

## Rollback Plan

Purely additive change: new context module, new migration, new core auth module. Rollback = revert the branch and, if already deployed, run the migration's `down()` to drop the `feature_flags` table. No existing modules are modified except `src/contexts/contexts.module.ts` (register `FlagsModule`), `src/core/core.module.ts` (register `ApiKeyGuard` as `APP_GUARD`, add `authConfig`), and `src/core/config/env.validation.ts` (require `FEATURE_FLAGS_API_KEY`) — all trivially revertible.

## Success Criteria

- [x] `CreateFeatureFlag`, `SetFeatureFlagEnvironmentValue`, `ArchiveFeatureFlag` commands work over REST, GraphQL, and MCP.
- [x] `FeatureFlagFindByKey`, `FeatureFlagFindByCriteria`, `EvaluateFeatureFlag` queries work over REST, GraphQL, and MCP.
- [x] `(tenantId, key)` uniqueness enforced; duplicate creation returns a domain error, not a raw DB constraint error.
- [x] Every endpoint (REST/GraphQL/MCP) requires a valid `X-Api-Key`; missing/invalid key → 401.
- [x] `EvaluateFeatureFlag` on a non-existent flag returns `false` (fail-safe), never throws.
- [x] `pnpm test`, `pnpm test:integration`, `pnpm test:e2e` green (unit-only coverage is high for domain/application; transport/persistence layers are verified via integration/e2e instead of mocked unit tests — see `tasks.md` Phase 7 note).
- [x] `src/contexts/flags/README.md` documents the public commands/queries/events.
- [ ] gardenia-api can call `EvaluateFeatureFlag` end-to-end against a local instance of this service — **out of scope for this PR** (would require changes in the `gardenia-api` repo); this service's own REST/GraphQL/MCP surfaces are verified end-to-end against a real Postgres instead.
