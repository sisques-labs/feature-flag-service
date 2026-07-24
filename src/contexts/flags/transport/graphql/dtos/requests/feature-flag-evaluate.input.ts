import { Field, InputType } from '@nestjs/graphql';
import { IsEnum, IsNotEmpty, IsString, MaxLength } from 'class-validator';

import { FeatureFlagEnvironmentEnum } from '../../../../domain/enums/feature-flag-environment.enum';

@InputType('FeatureFlagEvaluateInput')
export class FeatureFlagEvaluateInput {
  @Field(() => String)
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  tenantId!: string;

  @Field(() => String)
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  key!: string;

  @Field(() => FeatureFlagEnvironmentEnum)
  @IsEnum(FeatureFlagEnvironmentEnum)
  environment!: FeatureFlagEnvironmentEnum;
}
