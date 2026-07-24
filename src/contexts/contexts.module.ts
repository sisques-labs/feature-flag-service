import { DynamicModule, Module, Type } from '@nestjs/common';

import { FlagsModule } from './flags/flags.module';

const CONTEXT_MODULES: (DynamicModule | Type<unknown>)[] = [FlagsModule];

@Module({
  imports: [...CONTEXT_MODULES],
})
export class ContextsModule {}
