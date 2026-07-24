import { InvalidStringException } from '@sisques-labs/nestjs-kit';

import { FeatureFlagNameValueObject } from './feature-flag-name.vo';

describe('FeatureFlagNameValueObject', () => {
  it('accepts a non-empty string', () => {
    const vo = new FeatureFlagNameValueObject('New Checkout');

    expect(vo.value).toBe('New Checkout');
  });

  it('rejects an empty string', () => {
    expect(() => new FeatureFlagNameValueObject('')).toThrow(
      InvalidStringException,
    );
  });

  it('rejects a string longer than 150 characters', () => {
    expect(() => new FeatureFlagNameValueObject('a'.repeat(151))).toThrow(
      InvalidStringException,
    );
  });
});
