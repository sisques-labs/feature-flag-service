# Flags

The `flags` bounded context implements the `feature-flag-service` MVP: on/off
feature flags scoped to a tenant, toggleable independently per environment
(`development` / `staging` / `production`), exposed over REST, GraphQL, and
MCP. It is the first (and, for the MVP, only) bounded context in this
service — see `openspec/changes/flags-mvp/` for the full proposal, design,
and task history.

## Domain

**`FeatureFlagAggregate`** — fields: `id` (UUID), `tenantId` (opaque string,
unvalidated — see "Tenancy" below), `key` (kebab-case, unique per tenant,
immutable once created), `name`, `description` (optional), three independent
booleans (`developmentEnabled` / `stagingEnabled` / `productionEnabled`,
default `false`), and `archived` (soft-delete flag, default `false`).

Flags are addressed by **`(tenantId, key)`**, not by the internal UUID — `key`
is the business handle every caller uses to create, toggle, evaluate, and
archive a flag.

## Commands

| Command | Effect |
|---|---|
| `CreateFeatureFlagCommand` | Creates a flag with all environments disabled. Rejects a duplicate `(tenantId, key)` — including against an archived flag — with `FeatureFlagKeyAlreadyExistsException`. |
| `SetFeatureFlagEnvironmentValueCommand` | Toggles one environment's boolean, leaving the other two untouched. |
| `ArchiveFeatureFlagCommand` | Soft-deletes a flag (`archived = true`). Idempotent — archiving twice succeeds. |

## Queries

| Query | Effect |
|---|---|
| `FeatureFlagFindByKeyQuery` | Returns the `FeatureFlagViewModel` for `(tenantId, key)`. Throws `FeatureFlagNotFoundException` if missing. |
| `FeatureFlagFindByCriteriaQuery` | Paginated list via the standard Criteria pattern. **The caller is responsible for including a `tenantId EQUALS` filter** — nothing scopes this server-side (see "Tenancy" below). |
| `EvaluateFeatureFlagQuery` | **Fail-safe.** Returns the boolean value for `(tenantId, key, environment)`. Returns `false` — never throws — when the flag doesn't exist or is archived. This is the one query in this context that doesn't use an assert-exists service, by design: a consumer's request path should never break because a flag hasn't been created yet. |

## Domain Events

`FeatureFlagCreatedEvent`, `FeatureFlagEnvironmentValueUpdatedEvent` (payload
includes `environment`), `FeatureFlagArchivedEvent` — all carry the full
aggregate snapshot (`toPrimitives()`), no partial/diff payloads.

## Transports

All three transports dispatch through the **same** Command/QueryBus handlers
— there is exactly one implementation of each operation.

- **REST** (`/api/feature-flags`): `POST /`, `GET /`, `GET /:key`,
  `PATCH /:key/environments/:environment`, `DELETE /:key`,
  `GET /:key/evaluate/:environment`. See `feature-flags.controller.ts`.
- **GraphQL**: queries `featureFlagFindByKey`, `featureFlagsFindByCriteria`
  (validated against `featureFlagFilterableFields` via `FilterValidationPipe`),
  `featureFlagEvaluate`; mutations `featureFlagCreate`,
  `featureFlagSetEnvironmentValue`, `featureFlagArchive` (return the shared
  `MutationResponseDto`).
- **MCP** (`POST /api/mcp`): `feature_flag_create`,
  `feature_flag_set_environment_value`, `feature_flag_archive`,
  `feature_flag_find_by_key`, `feature_flags_find_by_criteria`,
  `feature_flag_evaluate` — one tool per command/query, same dispatch path.

## Auth

Every request on every transport (REST, GraphQL, MCP) requires a valid
`X-Api-Key` header matching the `FEATURE_FLAGS_API_KEY` env var, enforced by
the global `ApiKeyGuard` (`src/core/auth/`). This is a stopgap: there is no
per-tenant or per-key auth yet.

## Tenancy (MVP limitation — read before extending)

`tenantId` is an **opaque, caller-supplied string** — nothing validates it
corresponds to a real tenant, and nothing scopes `FeatureFlagFindByCriteria`
to a tenant automatically (there is no ambient tenant context, unlike
services that carry a `SpaceContext`-style ALS). The single static API key is
the only trust boundary around the whole service in this MVP. `identity-service`
is expected to own real multi-tenancy later; when it does, this is the seam
to revisit — not the data model, which already has `tenantId` on every row
and a `(tenantId, key)` uniqueness constraint.

## Explicitly Out of Scope (MVP)

Percentage rollout, attribute-based targeting/segments, realtime push
(SSE/WebSocket — pull only), an admin UI (separate repo), audit log/change
history beyond `createdAt`/`updatedAt`, hard delete, renaming a flag's `key`
after creation, and per-tenant/per-key API keys. See
`openspec/changes/flags-mvp/proposal.md` for the full rationale.
