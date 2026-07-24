import { createE2EApp, E2EContext } from '../helpers/app-bootstrap';
import { truncateAll } from '../helpers/db-reset';
import { gql } from '../helpers/graphql-client';

describe('Feature Flags GraphQL (e2e)', () => {
  let ctx: E2EContext;

  beforeAll(async () => {
    ctx = await createE2EApp();
  });

  afterAll(async () => {
    await ctx.close();
  });

  beforeEach(async () => {
    await truncateAll(ctx.dataSource);
  });

  it('featureFlagCreate creates a flag and featureFlagFindByKey retrieves it', async () => {
    const createRes = await gql(
      ctx.app,
      `mutation {
        featureFlagCreate(input: { tenantId: "tenant-1", key: "new-checkout", name: "New Checkout" }) {
          success
          id
        }
      }`,
    );

    expect(createRes.status).toBe(200);
    expect(createRes.body.data.featureFlagCreate.success).toBe(true);
    expect(createRes.body.data.featureFlagCreate.id).toBeDefined();

    const findRes = await gql(
      ctx.app,
      `query {
        featureFlagFindByKey(input: { tenantId: "tenant-1", key: "new-checkout" }) {
          key
          developmentEnabled
          stagingEnabled
          productionEnabled
          archived
        }
      }`,
    );

    expect(findRes.status).toBe(200);
    expect(findRes.body.data.featureFlagFindByKey).toMatchObject({
      key: 'new-checkout',
      developmentEnabled: false,
      stagingEnabled: false,
      productionEnabled: false,
      archived: false,
    });
  });

  it('featureFlagFindByKey surfaces a GraphQL error for a missing flag', async () => {
    const res = await gql(
      ctx.app,
      `query {
        featureFlagFindByKey(input: { tenantId: "tenant-1", key: "does-not-exist" }) {
          key
        }
      }`,
    );

    expect(res.body.errors?.[0]?.extensions?.statusCode).toBe(404);
  });

  it('featureFlagSetEnvironmentValue toggles only the targeted environment', async () => {
    await gql(
      ctx.app,
      `mutation {
        featureFlagCreate(input: { tenantId: "tenant-1", key: "new-checkout", name: "New Checkout" }) { success }
      }`,
    );

    const toggleRes = await gql(
      ctx.app,
      `mutation {
        featureFlagSetEnvironmentValue(input: { tenantId: "tenant-1", key: "new-checkout", environment: STAGING, enabled: true }) {
          success
        }
      }`,
    );
    expect(toggleRes.body.data.featureFlagSetEnvironmentValue.success).toBe(
      true,
    );

    const findRes = await gql(
      ctx.app,
      `query {
        featureFlagFindByKey(input: { tenantId: "tenant-1", key: "new-checkout" }) {
          developmentEnabled
          stagingEnabled
          productionEnabled
        }
      }`,
    );

    expect(findRes.body.data.featureFlagFindByKey).toMatchObject({
      developmentEnabled: false,
      stagingEnabled: true,
      productionEnabled: false,
    });
  });

  it('featureFlagArchive is idempotent and featureFlagEvaluate never errors', async () => {
    await gql(
      ctx.app,
      `mutation {
        featureFlagCreate(input: { tenantId: "tenant-1", key: "old-flag", name: "Old Flag" }) { success }
      }`,
    );
    await gql(
      ctx.app,
      `mutation {
        featureFlagSetEnvironmentValue(input: { tenantId: "tenant-1", key: "old-flag", environment: PRODUCTION, enabled: true }) { success }
      }`,
    );

    const firstArchive = await gql(
      ctx.app,
      `mutation {
        featureFlagArchive(input: { tenantId: "tenant-1", key: "old-flag" }) { success }
      }`,
    );
    expect(firstArchive.body.data.featureFlagArchive.success).toBe(true);

    const secondArchive = await gql(
      ctx.app,
      `mutation {
        featureFlagArchive(input: { tenantId: "tenant-1", key: "old-flag" }) { success }
      }`,
    );
    expect(secondArchive.body.data.featureFlagArchive.success).toBe(true);

    const evaluateRes = await gql(
      ctx.app,
      `query {
        featureFlagEvaluate(input: { tenantId: "tenant-1", key: "old-flag", environment: PRODUCTION })
      }`,
    );
    expect(evaluateRes.body.errors).toBeUndefined();
    expect(evaluateRes.body.data.featureFlagEvaluate).toBe(false);

    const missingEvaluateRes = await gql(
      ctx.app,
      `query {
        featureFlagEvaluate(input: { tenantId: "tenant-1", key: "does-not-exist", environment: PRODUCTION })
      }`,
    );
    expect(missingEvaluateRes.body.errors).toBeUndefined();
    expect(missingEvaluateRes.body.data.featureFlagEvaluate).toBe(false);
  });

  it('featureFlagsFindByCriteria filters by tenantId', async () => {
    await gql(
      ctx.app,
      `mutation {
        featureFlagCreate(input: { tenantId: "tenant-1", key: "flag-one", name: "Flag One" }) { success }
      }`,
    );
    await gql(
      ctx.app,
      `mutation {
        featureFlagCreate(input: { tenantId: "tenant-2", key: "flag-two", name: "Flag Two" }) { success }
      }`,
    );

    const res = await gql(
      ctx.app,
      `query {
        featureFlagsFindByCriteria(input: { filters: [{ field: TENANT_ID, operator: EQUALS, value: "tenant-1" }] }) {
          total
          items {
            key
            tenantId
          }
        }
      }`,
    );

    expect(res.body.errors).toBeUndefined();
    expect(res.body.data.featureFlagsFindByCriteria.total).toBe(1);
    expect(res.body.data.featureFlagsFindByCriteria.items[0]).toMatchObject({
      key: 'flag-one',
      tenantId: 'tenant-1',
    });
  });
});
