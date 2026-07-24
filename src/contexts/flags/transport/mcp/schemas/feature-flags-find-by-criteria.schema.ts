import { FilterOperator, SortDirection } from '@sisques-labs/nestjs-kit';
import { z } from 'zod';

import { FeatureFlagQueryableField } from '../../graphql/enums/feature-flag-queryable-field.enum';

const filterSchema = z.object({
  field: z.nativeEnum(FeatureFlagQueryableField),
  operator: z.nativeEnum(FilterOperator),
  value: z.unknown(),
});

const sortSchema = z.object({
  field: z.nativeEnum(FeatureFlagQueryableField),
  direction: z.nativeEnum(SortDirection),
});

export const featureFlagsFindByCriteriaSchema = {
  filters: z.array(filterSchema).optional(),
  sorts: z.array(sortSchema).optional(),
  page: z.number().int().min(1).optional(),
  perPage: z.number().int().min(1).optional(),
};
