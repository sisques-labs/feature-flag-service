import { TypeOrmModule } from '@nestjs/typeorm';
import { FilterOperator, UuidValueObject } from '@sisques-labs/nestjs-kit';

import { FeatureFlagBuilder } from '../../../src/contexts/flags/domain/builders/feature-flag.builder';
import { FeatureFlagKeyAlreadyExistsException } from '../../../src/contexts/flags/domain/exceptions/feature-flag-key-already-exists.exception';
import { FeatureFlagTypeOrmEntity } from '../../../src/contexts/flags/infrastructure/persistence/typeorm/entities/feature-flag.entity';
import { FeatureFlagTypeOrmMapper } from '../../../src/contexts/flags/infrastructure/persistence/typeorm/mappers/feature-flag-typeorm.mapper';
import { FeatureFlagTypeOrmReadRepository } from '../../../src/contexts/flags/infrastructure/persistence/typeorm/repositories/feature-flag-typeorm-read.repository';
import { FeatureFlagTypeOrmWriteRepository } from '../../../src/contexts/flags/infrastructure/persistence/typeorm/repositories/feature-flag-typeorm-write.repository';
import {
  createIntegrationModule,
  IntegrationContext,
} from '../../helpers/integration-bootstrap';
import { truncateAll } from '../../helpers/db-reset';

function buildFlag(overrides: { tenantId: string; key: string; id?: string }) {
  const now = new Date();
  return new FeatureFlagBuilder()
    .withId(overrides.id ?? UuidValueObject.generate().value)
    .withTenantId(overrides.tenantId)
    .withKey(overrides.key)
    .withName('New Checkout')
    .withCreatedAt(now)
    .withUpdatedAt(now)
    .build();
}

describe('FeatureFlag TypeORM repositories (integration)', () => {
  let ctx: IntegrationContext;
  let readRepository: FeatureFlagTypeOrmReadRepository;
  let writeRepository: FeatureFlagTypeOrmWriteRepository;

  beforeAll(async () => {
    ctx = await createIntegrationModule({
      imports: [TypeOrmModule.forFeature([FeatureFlagTypeOrmEntity])],
      providers: [
        FeatureFlagBuilder,
        FeatureFlagTypeOrmMapper,
        FeatureFlagTypeOrmReadRepository,
        FeatureFlagTypeOrmWriteRepository,
      ],
    });

    readRepository = ctx.module.get(FeatureFlagTypeOrmReadRepository);
    writeRepository = ctx.module.get(FeatureFlagTypeOrmWriteRepository);
  });

  afterAll(async () => {
    await ctx.close();
  });

  beforeEach(async () => {
    await truncateAll(ctx.dataSource);
  });

  it('save() persists a flag and findById()/findByTenantAndKey() retrieve it on both repositories', async () => {
    const flag = buildFlag({ tenantId: 'tenant-1', key: 'new-checkout' });

    await writeRepository.save(flag);

    const byIdWrite = await writeRepository.findById(flag.id.value);
    expect(byIdWrite?.key).toBe('new-checkout');

    const byTenantKeyWrite = await writeRepository.findByTenantAndKey(
      'tenant-1',
      'new-checkout',
    );
    expect(byTenantKeyWrite?.id.value).toBe(flag.id.value);

    const byIdRead = await readRepository.findById(flag.id.value);
    expect(byIdRead?.key).toBe('new-checkout');

    const byTenantKeyRead = await readRepository.findByTenantAndKey(
      'tenant-1',
      'new-checkout',
    );
    expect(byTenantKeyRead?.id).toBe(flag.id.value);
  });

  it('save() rejects a duplicate (tenantId, key) with FeatureFlagKeyAlreadyExistsException', async () => {
    await writeRepository.save(
      buildFlag({ tenantId: 'tenant-1', key: 'new-checkout' }),
    );

    await expect(
      writeRepository.save(
        buildFlag({ tenantId: 'tenant-1', key: 'new-checkout' }),
      ),
    ).rejects.toThrow(FeatureFlagKeyAlreadyExistsException);
  });

  it('the same key coexists independently across two tenants', async () => {
    await writeRepository.save(
      buildFlag({ tenantId: 'tenant-a', key: 'shared-key' }),
    );
    await writeRepository.save(
      buildFlag({ tenantId: 'tenant-b', key: 'shared-key' }),
    );

    const flagA = await readRepository.findByTenantAndKey(
      'tenant-a',
      'shared-key',
    );
    const flagB = await readRepository.findByTenantAndKey(
      'tenant-b',
      'shared-key',
    );

    expect(flagA?.tenantId).toBe('tenant-a');
    expect(flagB?.tenantId).toBe('tenant-b');
    expect(flagA?.id).not.toBe(flagB?.id);
  });

  it('findByCriteria() scopes results by tenantId and translates filters', async () => {
    await writeRepository.save(
      buildFlag({ tenantId: 'tenant-1', key: 'flag-one' }),
    );
    await writeRepository.save(
      buildFlag({ tenantId: 'tenant-1', key: 'flag-two' }),
    );
    await writeRepository.save(
      buildFlag({ tenantId: 'tenant-2', key: 'flag-three' }),
    );

    const result = await readRepository.findByCriteria({
      filters: [
        {
          field: 'tenantId',
          operator: FilterOperator.EQUALS,
          value: 'tenant-1',
        },
      ],
      sorts: [],
      pagination: { page: 1, perPage: 10 },
    });

    expect(result.total).toBe(2);
    expect(result.items.every((item) => item.tenantId === 'tenant-1')).toBe(
      true,
    );
  });

  it('delete() removes the row', async () => {
    const flag = buildFlag({ tenantId: 'tenant-1', key: 'to-delete' });
    await writeRepository.save(flag);

    await writeRepository.delete(flag.id.value);

    expect(await writeRepository.findById(flag.id.value)).toBeNull();
  });
});
