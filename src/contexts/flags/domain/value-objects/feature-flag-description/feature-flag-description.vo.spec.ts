import { InvalidStringException } from '@sisques-labs/nestjs-kit';

import { FeatureFlagDescriptionValueObject } from './feature-flag-description.vo';

describe('FeatureFlagDescriptionValueObject', () => {
  it('accepts a non-empty string', () => {
    const vo = new FeatureFlagDescriptionValueObject('Rolls out the new UI');

    expect(vo.value).toBe('Rolls out the new UI');
  });

  it('rejects an empty string', () => {
    expect(() => new FeatureFlagDescriptionValueObject('')).toThrow(
      InvalidStringException,
    );
  });

  it('rejects a string longer than 500 characters', () => {
    expect(
      () => new FeatureFlagDescriptionValueObject('a'.repeat(501)),
    ).toThrow(InvalidStringException);
  });
});
