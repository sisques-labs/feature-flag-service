import { FeatureFlagBuilder } from '../../../../domain/builders/feature-flag.builder';
import { FeatureFlagTypeOrmEntity } from '../entities/feature-flag.entity';
import { FeatureFlagTypeOrmMapper } from './feature-flag-typeorm.mapper';

function buildEntity(): FeatureFlagTypeOrmEntity {
  const entity = new FeatureFlagTypeOrmEntity();
  entity.id = '9f4a7e9e-2f1a-4c8b-9d3a-1a2b3c4d5e6f';
  entity.tenantId = 'tenant-1';
  entity.key = 'new-checkout';
  entity.name = 'New Checkout';
  entity.description = 'Rolls out the new checkout flow';
  entity.developmentEnabled = true;
  entity.stagingEnabled = false;
  entity.productionEnabled = false;
  entity.archived = false;
  entity.createdAt = new Date('2026-01-01T00:00:00.000Z');
  entity.updatedAt = new Date('2026-01-02T00:00:00.000Z');
  return entity;
}

describe('FeatureFlagTypeOrmMapper', () => {
  function buildMapper() {
    return new FeatureFlagTypeOrmMapper(new FeatureFlagBuilder());
  }

  it('toAggregate() rehydrates every field from the entity', () => {
    const mapper = buildMapper();
    const entity = buildEntity();

    const aggregate = mapper.toAggregate(entity);

    expect(aggregate.id.value).toBe(entity.id);
    expect(aggregate.tenantId).toBe(entity.tenantId);
    expect(aggregate.key).toBe(entity.key);
    expect(aggregate.name).toBe(entity.name);
    expect(aggregate.description).toBe(entity.description);
    expect(aggregate.developmentEnabled).toBe(true);
    expect(aggregate.stagingEnabled).toBe(false);
  });

  it('toViewModel() rehydrates every field from the entity', () => {
    const mapper = buildMapper();
    const entity = buildEntity();

    const viewModel = mapper.toViewModel(entity);

    expect(viewModel.id).toBe(entity.id);
    expect(viewModel.tenantId).toBe(entity.tenantId);
    expect(viewModel.key).toBe(entity.key);
    expect(viewModel.developmentEnabled).toBe(true);
  });

  it('toEntity() round-trips losslessly from an aggregate built via toAggregate()', () => {
    const mapper = buildMapper();
    const entity = buildEntity();

    const roundTripped = mapper.toEntity(mapper.toAggregate(entity));

    expect(roundTripped.id).toBe(entity.id);
    expect(roundTripped.tenantId).toBe(entity.tenantId);
    expect(roundTripped.key).toBe(entity.key);
    expect(roundTripped.name).toBe(entity.name);
    expect(roundTripped.description).toBe(entity.description);
    expect(roundTripped.developmentEnabled).toBe(entity.developmentEnabled);
    expect(roundTripped.stagingEnabled).toBe(entity.stagingEnabled);
    expect(roundTripped.productionEnabled).toBe(entity.productionEnabled);
    expect(roundTripped.archived).toBe(entity.archived);
  });

  it('maps a null description correctly in both directions', () => {
    const mapper = buildMapper();
    const entity = buildEntity();
    entity.description = null;

    const aggregate = mapper.toAggregate(entity);
    expect(aggregate.description).toBeNull();

    const roundTripped = mapper.toEntity(aggregate);
    expect(roundTripped.description).toBeNull();
  });
});
