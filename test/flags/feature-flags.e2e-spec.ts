import * as request from 'supertest';

import { createE2EApp, E2EContext } from '../helpers/app-bootstrap';
import { TEST_API_KEY } from '../helpers/api-key';
import { truncateAll } from '../helpers/db-reset';

describe('Feature Flags REST (e2e)', () => {
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

  function withKey(req: request.Test) {
    return req.set('X-Api-Key', TEST_API_KEY);
  }

  it('rejects every request without X-Api-Key', async () => {
    const res = await ctx.http().get('/api/feature-flags?tenantId=tenant-1');

    expect(res.status).toBe(401);
  });

  it('creates a flag with all environments disabled (201)', async () => {
    const res = await withKey(ctx.http().post('/api/feature-flags')).send({
      tenantId: 'tenant-1',
      key: 'new-checkout',
      name: 'New Checkout',
    });

    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({
      tenantId: 'tenant-1',
      key: 'new-checkout',
      name: 'New Checkout',
      developmentEnabled: false,
      stagingEnabled: false,
      productionEnabled: false,
      archived: false,
    });
  });

  it('rejects an invalid (non-kebab-case) key with 400', async () => {
    const res = await withKey(ctx.http().post('/api/feature-flags')).send({
      tenantId: 'tenant-1',
      key: 'Not Valid Key',
      name: 'New Checkout',
    });

    expect(res.status).toBe(400);
  });

  it('rejects a duplicate (tenantId, key) with 409', async () => {
    const create = () =>
      withKey(ctx.http().post('/api/feature-flags')).send({
        tenantId: 'tenant-1',
        key: 'new-checkout',
        name: 'New Checkout',
      });

    expect((await create()).status).toBe(201);
    const dup = await create();
    expect(dup.status).toBe(409);
  });

  it('gets a flag by key (200) and 404s for a missing one', async () => {
    await withKey(ctx.http().post('/api/feature-flags')).send({
      tenantId: 'tenant-1',
      key: 'new-checkout',
      name: 'New Checkout',
    });

    const found = await withKey(
      ctx.http().get('/api/feature-flags/new-checkout?tenantId=tenant-1'),
    );
    expect(found.status).toBe(200);
    expect(found.body.key).toBe('new-checkout');

    const missing = await withKey(
      ctx.http().get('/api/feature-flags/does-not-exist?tenantId=tenant-1'),
    );
    expect(missing.status).toBe(404);
  });

  it('toggles environments independently and 404s for a missing flag', async () => {
    await withKey(ctx.http().post('/api/feature-flags')).send({
      tenantId: 'tenant-1',
      key: 'new-checkout',
      name: 'New Checkout',
    });

    const toggled = await withKey(
      ctx.http().patch('/api/feature-flags/new-checkout/environments/staging'),
    ).send({ tenantId: 'tenant-1', enabled: true });

    expect(toggled.status).toBe(200);
    expect(toggled.body.stagingEnabled).toBe(true);
    expect(toggled.body.developmentEnabled).toBe(false);
    expect(toggled.body.productionEnabled).toBe(false);

    const missing = await withKey(
      ctx
        .http()
        .patch('/api/feature-flags/does-not-exist/environments/staging'),
    ).send({ tenantId: 'tenant-1', enabled: true });
    expect(missing.status).toBe(404);
  });

  it('archives a flag (204) idempotently', async () => {
    await withKey(ctx.http().post('/api/feature-flags')).send({
      tenantId: 'tenant-1',
      key: 'new-checkout',
      name: 'New Checkout',
    });

    const first = await withKey(
      ctx.http().delete('/api/feature-flags/new-checkout?tenantId=tenant-1'),
    );
    expect(first.status).toBe(204);

    const second = await withKey(
      ctx.http().delete('/api/feature-flags/new-checkout?tenantId=tenant-1'),
    );
    expect(second.status).toBe(204);
  });

  it('evaluate never 404s — returns false for a missing flag and true for an enabled environment', async () => {
    const missing = await withKey(
      ctx
        .http()
        .get(
          '/api/feature-flags/does-not-exist/evaluate/production?tenantId=tenant-1',
        ),
    );
    expect(missing.status).toBe(200);
    expect(missing.body.enabled).toBe(false);

    await withKey(ctx.http().post('/api/feature-flags')).send({
      tenantId: 'tenant-1',
      key: 'new-checkout',
      name: 'New Checkout',
    });
    await withKey(
      ctx
        .http()
        .patch('/api/feature-flags/new-checkout/environments/production'),
    ).send({ tenantId: 'tenant-1', enabled: true });

    const enabled = await withKey(
      ctx
        .http()
        .get(
          '/api/feature-flags/new-checkout/evaluate/production?tenantId=tenant-1',
        ),
    );
    expect(enabled.status).toBe(200);
    expect(enabled.body.enabled).toBe(true);
  });

  it('evaluate returns false for an archived flag even if the environment was enabled', async () => {
    await withKey(ctx.http().post('/api/feature-flags')).send({
      tenantId: 'tenant-1',
      key: 'old-flag',
      name: 'Old Flag',
    });
    await withKey(
      ctx.http().patch('/api/feature-flags/old-flag/environments/production'),
    ).send({ tenantId: 'tenant-1', enabled: true });
    await withKey(
      ctx.http().delete('/api/feature-flags/old-flag?tenantId=tenant-1'),
    );

    const res = await withKey(
      ctx
        .http()
        .get(
          '/api/feature-flags/old-flag/evaluate/production?tenantId=tenant-1',
        ),
    );

    expect(res.status).toBe(200);
    expect(res.body.enabled).toBe(false);
  });

  it('lists flags scoped by tenantId', async () => {
    await withKey(ctx.http().post('/api/feature-flags')).send({
      tenantId: 'tenant-1',
      key: 'flag-one',
      name: 'Flag One',
    });
    await withKey(ctx.http().post('/api/feature-flags')).send({
      tenantId: 'tenant-1',
      key: 'flag-two',
      name: 'Flag Two',
    });
    await withKey(ctx.http().post('/api/feature-flags')).send({
      tenantId: 'tenant-2',
      key: 'flag-three',
      name: 'Flag Three',
    });

    const res = await withKey(
      ctx.http().get('/api/feature-flags?tenantId=tenant-1'),
    );

    expect(res.status).toBe(200);
    expect(res.body.total).toBe(2);
    expect(
      res.body.items.every(
        (item: { tenantId: string }) => item.tenantId === 'tenant-1',
      ),
    ).toBe(true);
  });
});
