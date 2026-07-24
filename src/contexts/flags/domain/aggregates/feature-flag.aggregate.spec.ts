import { BooleanValueObject } from '@sisques-labs/nestjs-kit';

import { FeatureFlagBuilder } from '../builders/feature-flag.builder';
import { FeatureFlagEnvironmentEnum } from '../enums/feature-flag-environment.enum';
import { FeatureFlagArchivedEvent } from '../events/feature-flag-archived/feature-flag-archived.event';
import { FeatureFlagCreatedEvent } from '../events/feature-flag-created/feature-flag-created.event';
import { FeatureFlagEnvironmentValueUpdatedEvent } from '../events/feature-flag-environment-value-updated/feature-flag-environment-value-updated.event';
import { FeatureFlagAggregate } from './feature-flag.aggregate';

function buildFlag(): FeatureFlagAggregate {
  const now = new Date();
  return new FeatureFlagBuilder()
    .withId('9f4a7e9e-2f1a-4c8b-9d3a-1a2b3c4d5e6f')
    .withTenantId('tenant-1')
    .withKey('new-checkout')
    .withName('New Checkout')
    .withCreatedAt(now)
    .withUpdatedAt(now)
    .build();
}

describe('FeatureFlagAggregate', () => {
  it('builds with all environments and archived defaulting to false', () => {
    const flag = buildFlag();

    expect(flag.developmentEnabled).toBe(false);
    expect(flag.stagingEnabled).toBe(false);
    expect(flag.productionEnabled).toBe(false);
    expect(flag.archived).toBe(false);
  });

  it('create() emits a single FeatureFlagCreatedEvent with the full snapshot', () => {
    const flag = buildFlag();

    flag.create();

    const events = flag.getUncommittedEvents();
    expect(events).toHaveLength(1);
    expect(events[0]).toBeInstanceOf(FeatureFlagCreatedEvent);
    expect((events[0] as FeatureFlagCreatedEvent).data).toMatchObject({
      tenantId: 'tenant-1',
      key: 'new-checkout',
    });
  });

  it('setEnvironmentValue() toggles only the targeted environment', () => {
    const flag = buildFlag();

    flag.setEnvironmentValue(
      FeatureFlagEnvironmentEnum.STAGING,
      new BooleanValueObject(true),
    );

    expect(flag.stagingEnabled).toBe(true);
    expect(flag.developmentEnabled).toBe(false);
    expect(flag.productionEnabled).toBe(false);

    const events = flag.getUncommittedEvents();
    expect(events[events.length - 1]).toBeInstanceOf(
      FeatureFlagEnvironmentValueUpdatedEvent,
    );
  });

  it('archive() sets archived to true and emits FeatureFlagArchivedEvent', () => {
    const flag = buildFlag();

    flag.archive();

    expect(flag.archived).toBe(true);
    const events = flag.getUncommittedEvents();
    expect(events[events.length - 1]).toBeInstanceOf(FeatureFlagArchivedEvent);
  });

  it('archive() is idempotent — archiving twice keeps archived true', () => {
    const flag = buildFlag();

    flag.archive();
    flag.archive();

    expect(flag.archived).toBe(true);
  });
});
