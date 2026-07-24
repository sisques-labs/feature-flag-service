import { BadRequestException } from '@nestjs/common';
import { FilterOperator } from '@sisques-labs/nestjs-kit';
import { FilterValidationPipe } from '@sisques-labs/nestjs-kit/graphql';

import { FeatureFlagQueryableField } from '../enums/feature-flag-queryable-field.enum';
import { featureFlagFilterableFields } from './feature-flag-filterable-fields.registry';

describe('featureFlagFilterableFields', () => {
  it('has a registry entry for every FeatureFlagQueryableField value', () => {
    for (const field of Object.values(FeatureFlagQueryableField)) {
      expect(featureFlagFilterableFields[field]).toBeDefined();
    }
  });

  it('accepts a filter on a whitelisted field with the expected value type', () => {
    const pipe = new FilterValidationPipe(featureFlagFilterableFields);

    expect(() =>
      pipe.transform({
        filters: [
          {
            field: FeatureFlagQueryableField.TENANT_ID,
            operator: FilterOperator.EQUALS,
            value: 'tenant-1',
          },
        ],
      }),
    ).not.toThrow();
  });

  it('rejects a filter on a field not in the whitelist', () => {
    const pipe = new FilterValidationPipe(featureFlagFilterableFields);

    expect(() =>
      pipe.transform({
        filters: [
          {
            field: 'notAQueryableField',
            operator: FilterOperator.EQUALS,
            value: 'anything',
          },
        ],
      }),
    ).toThrow(BadRequestException);
  });

  it('rejects a value that does not match the field type (boolean expected)', () => {
    const pipe = new FilterValidationPipe(featureFlagFilterableFields);

    expect(() =>
      pipe.transform({
        filters: [
          {
            field: FeatureFlagQueryableField.ARCHIVED,
            operator: FilterOperator.EQUALS,
            value: 'not-a-boolean',
          },
        ],
      }),
    ).toThrow(BadRequestException);
  });
});
