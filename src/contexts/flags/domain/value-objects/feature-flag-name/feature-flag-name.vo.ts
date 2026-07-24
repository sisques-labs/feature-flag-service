import { StringValueObject } from '@sisques-labs/nestjs-kit';

export class FeatureFlagNameValueObject extends StringValueObject {
  constructor(value: string) {
    super(value, { maxLength: 150, allowEmpty: false });
  }
}
