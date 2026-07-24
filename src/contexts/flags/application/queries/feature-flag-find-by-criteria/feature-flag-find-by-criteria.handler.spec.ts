import { Criteria, PaginatedResult } from '@sisques-labs/nestjs-kit';

import { IFeatureFlagReadRepository } from '../../../domain/repositories/read/feature-flag-read.repository';
import { FeatureFlagFindByCriteriaQuery } from './feature-flag-find-by-criteria.query';
import { FeatureFlagFindByCriteriaQueryHandler } from './feature-flag-find-by-criteria.handler';

describe('FeatureFlagFindByCriteriaQueryHandler', () => {
  it('delegates directly to the read repository findByCriteria', async () => {
    const paginated = new PaginatedResult([], 0, 1, 10);
    const repository: jest.Mocked<IFeatureFlagReadRepository> = {
      findByTenantAndKey: jest.fn(),
      findById: jest.fn(),
      findByCriteria: jest.fn().mockResolvedValue(paginated),
      save: jest.fn(),
      delete: jest.fn(),
    };
    const handler = new FeatureFlagFindByCriteriaQueryHandler(repository);
    const criteria = new Criteria();

    const result = await handler.execute(
      new FeatureFlagFindByCriteriaQuery({ criteria }),
    );

    expect(repository.findByCriteria).toHaveBeenCalledWith(criteria);
    expect(result).toBe(paginated);
  });
});
