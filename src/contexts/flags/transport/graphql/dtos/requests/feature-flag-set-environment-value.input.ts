import { Field, InputType } from '@nestjs/graphql';
import {
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsString,
  MaxLength,
} from 'class-validator';

import { FeatureFlagEnvironmentEnum } from '../../../../domain/enums/feature-flag-environment.enum';

@InputType('FeatureFlagSetEnvironmentValueInput')
export class FeatureFlagSetEnvironmentValueInput {
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

  @Field(() => Boolean)
  @IsBoolean()
  enabled!: boolean;
}
