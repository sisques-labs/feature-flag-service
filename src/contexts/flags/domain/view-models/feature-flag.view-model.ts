import { BaseViewModel } from '@sisques-labs/nestjs-kit';

import { IFeatureFlagPrimitives } from '../primitives/feature-flag.primitives';

export class FeatureFlagViewModel extends BaseViewModel {
  public readonly tenantId: string;
  public readonly key: string;
  public readonly name: string;
  public readonly description: string | null;
  public readonly developmentEnabled: boolean;
  public readonly stagingEnabled: boolean;
  public readonly productionEnabled: boolean;
  public readonly archived: boolean;

  constructor(props: IFeatureFlagPrimitives) {
    super(props.id, props.createdAt, props.updatedAt);
    this.tenantId = props.tenantId;
    this.key = props.key;
    this.name = props.name;
    this.description = props.description;
    this.developmentEnabled = props.developmentEnabled;
    this.stagingEnabled = props.stagingEnabled;
    this.productionEnabled = props.productionEnabled;
    this.archived = props.archived;
  }
}
