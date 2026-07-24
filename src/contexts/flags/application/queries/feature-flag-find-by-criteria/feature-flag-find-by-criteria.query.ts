import { Criteria } from '@sisques-labs/nestjs-kit';

export interface FeatureFlagFindByCriteriaQueryInput {
  criteria: Criteria;
}

export class FeatureFlagFindByCriteriaQuery {
  public readonly criteria: Criteria;

  constructor(input: FeatureFlagFindByCriteriaQueryInput) {
    this.criteria = input.criteria;
  }
}
