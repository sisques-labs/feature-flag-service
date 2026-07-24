import { StringValueObject } from '@sisques-labs/nestjs-kit';

/**
 * Opaque, caller-supplied tenant identifier. No format is enforced — there is
 * no identity-service yet to validate it against. This is a deliberate MVP
 * placeholder (see openspec/changes/flags-mvp/design.md §3.2).
 */
export class FeatureFlagTenantIdValueObject extends StringValueObject {
  constructor(value: string) {
    super(value, { maxLength: 100, allowEmpty: false });
  }
}
