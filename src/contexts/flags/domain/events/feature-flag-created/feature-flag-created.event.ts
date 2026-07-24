import { BaseEvent, IEventMetadata } from '@sisques-labs/nestjs-kit';

import { IFeatureFlagEventData } from '../interfaces/feature-flag-event-data.interface';

export class FeatureFlagCreatedEvent extends BaseEvent<IFeatureFlagEventData> {
  constructor(metadata: IEventMetadata, data: IFeatureFlagEventData) {
    super(metadata, data);
  }
}
