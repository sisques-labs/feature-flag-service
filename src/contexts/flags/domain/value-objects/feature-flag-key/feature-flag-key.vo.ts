import { StringValueObject } from '@sisques-labs/nestjs-kit';

const KEBAB_CASE_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*$/;

/**
 * A flag's business handle — kebab-case, unique per tenant, immutable once
 * the flag is created (see openspec/changes/flags-mvp/design.md §3.2).
 */
export class FeatureFlagKeyValueObject extends StringValueObject {
  constructor(value: string) {
    super(value, {
      maxLength: 100,
      allowEmpty: false,
      pattern: KEBAB_CASE_PATTERN,
    });
  }
}
