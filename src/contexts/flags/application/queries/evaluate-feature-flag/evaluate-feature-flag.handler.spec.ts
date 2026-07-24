import { FeatureFlagEnvironmentEnum } from '../../../domain/enums/feature-flag-environment.enum';
import { IFeatureFlagReadRepository } from '../../../domain/repositories/read/feature-flag-read.repository';
import { EvaluateFeatureFlagQuery } from './evaluate-feature-flag.query';
import { EvaluateFeatureFlagQueryHandler } from './evaluate-feature-flag.handler';

describe('EvaluateFeatureFlagQueryHandler', () => {
  function buildHandler(found: unknown) {
    const repository: jest.Mocked<IFeatureFlagReadRepository> = {
      findByTenantAndKey: jest.fn().mockResolvedValue(found),
      findById: jest.fn(),
      findByCriteria: jest.fn(),
      save: jest.fn(),
      delete: jest.fn(),
    };
    return { handler: new EvaluateFeatureFlagQueryHandler(repository) };
  }

  it('returns true when the targeted environment is enabled', async () => {
    const { handler } = buildHandler({
      archived: false,
      developmentEnabled: false,
      stagingEnabled: true,
      productionEnabled: false,
    });

    const result = await handler.execute(
      new EvaluateFeatureFlagQuery({
        tenantId: 'tenant-1',
        key: 'new-checkout',
        environment: FeatureFlagEnvironmentEnum.STAGING,
      }),
    );

    expect(result).toBe(true);
  });

  it('returns false — never throws — when the flag does not exist', async () => {
    const { handler } = buildHandler(null);

    const result = await handler.execute(
      new EvaluateFeatureFlagQuery({
        tenantId: 'tenant-1',
        key: 'does-not-exist',
        environment: FeatureFlagEnvironmentEnum.PRODUCTION,
      }),
    );

    expect(result).toBe(false);
  });

  it('returns false when the flag is archived, even if the environment was enabled', async () => {
    const { handler } = buildHandler({
      archived: true,
      developmentEnabled: false,
      stagingEnabled: false,
      productionEnabled: true,
    });

    const result = await handler.execute(
      new EvaluateFeatureFlagQuery({
        tenantId: 'tenant-1',
        key: 'old-flag',
        environment: FeatureFlagEnvironmentEnum.PRODUCTION,
      }),
    );

    expect(result).toBe(false);
  });
});
