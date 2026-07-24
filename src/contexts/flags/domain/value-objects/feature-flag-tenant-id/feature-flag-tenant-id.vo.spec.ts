import { InvalidStringException } from '@sisques-labs/nestjs-kit';

import { FeatureFlagTenantIdValueObject } from './feature-flag-tenant-id.vo';

describe('FeatureFlagTenantIdValueObject', () => {
  it('accepts a non-empty string', () => {
    const vo = new FeatureFlagTenantIdValueObject('tenant-1');

    expect(vo.value).toBe('tenant-1');
  });

  it('rejects an empty string', () => {
    expect(() => new FeatureFlagTenantIdValueObject('')).toThrow(
      InvalidStringException,
    );
  });

  it('rejects a string longer than 100 characters', () => {
    expect(() => new FeatureFlagTenantIdValueObject('a'.repeat(101))).toThrow(
      InvalidStringException,
    );
  });
});
