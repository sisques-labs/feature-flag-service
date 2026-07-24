import { BaseEvent, IEventMetadata } from '@sisques-labs/nestjs-kit';

import { FeatureFlagEnvironmentEnum } from '../../enums/feature-flag-environment.enum';
import { IFeatureFlagEventData } from '../interfaces/feature-flag-event-data.interface';

export interface IFeatureFlagEnvironmentValueUpdatedEventData extends IFeatureFlagEventData {
  environment: FeatureFlagEnvironmentEnum;
}

export class FeatureFlagEnvironmentValueUpdatedEvent extends BaseEvent<IFeatureFlagEnvironmentValueUpdatedEventData> {
  constructor(
    metadata: IEventMetadata,
    data: IFeatureFlagEnvironmentValueUpdatedEventData,
  ) {
    super(metadata, data);
  }
}
