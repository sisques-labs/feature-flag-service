import { StringValueObject } from '@sisques-labs/nestjs-kit';

/**
 * Optional field — only ever instantiated for a non-empty value. Absence is
 * `null` at the aggregate level, never an empty-string VO.
 */
export class FeatureFlagDescriptionValueObject extends StringValueObject {
  constructor(value: string) {
    super(value, { maxLength: 500, allowEmpty: false });
  }
}
