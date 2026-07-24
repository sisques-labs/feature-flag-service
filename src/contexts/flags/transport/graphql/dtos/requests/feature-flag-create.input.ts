import { Field, InputType } from '@nestjs/graphql';
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
} from 'class-validator';

const KEBAB_CASE_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*$/;

@InputType('FeatureFlagCreateInput')
export class FeatureFlagCreateInput {
  @Field(() => String)
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  tenantId!: string;

  @Field(() => String)
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  @Matches(KEBAB_CASE_PATTERN, {
    message: 'key must be kebab-case (e.g. "new-checkout")',
  })
  key!: string;

  @Field(() => String)
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  name!: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;
}
