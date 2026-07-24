import { InvalidStringException } from '@sisques-labs/nestjs-kit';

import { FeatureFlagKeyValueObject } from './feature-flag-key.vo';

describe('FeatureFlagKeyValueObject', () => {
  it('accepts a kebab-case key', () => {
    const vo = new FeatureFlagKeyValueObject('new-checkout');

    expect(vo.value).toBe('new-checkout');
  });

  it('accepts a single-word key', () => {
    expect(new FeatureFlagKeyValueObject('checkout').value).toBe('checkout');
  });

  it('rejects an empty string', () => {
    expect(() => new FeatureFlagKeyValueObject('')).toThrow(
      InvalidStringException,
    );
  });

  it('rejects uppercase letters', () => {
    expect(() => new FeatureFlagKeyValueObject('New-Checkout')).toThrow(
      InvalidStringException,
    );
  });

  it('rejects spaces', () => {
    expect(() => new FeatureFlagKeyValueObject('new checkout')).toThrow(
      InvalidStringException,
    );
  });

  it('rejects a leading/trailing hyphen', () => {
    expect(() => new FeatureFlagKeyValueObject('-new-checkout')).toThrow(
      InvalidStringException,
    );
  });

  it('rejects a string longer than 100 characters', () => {
    expect(() => new FeatureFlagKeyValueObject('a'.repeat(101))).toThrow(
      InvalidStringException,
    );
  });
});
