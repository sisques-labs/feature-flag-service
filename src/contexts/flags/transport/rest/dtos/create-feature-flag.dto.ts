import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
} from 'class-validator';

const KEBAB_CASE_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*$/;

export class CreateFeatureFlagDto {
  @ApiProperty({ description: 'Opaque tenant identifier' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  tenantId!: string;

  @ApiProperty({ description: 'Kebab-case business key, unique per tenant' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  @Matches(KEBAB_CASE_PATTERN, {
    message: 'key must be kebab-case (e.g. "new-checkout")',
  })
  key!: string;

  @ApiProperty({ description: 'Human-readable name' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  name!: string;

  @ApiPropertyOptional({ description: 'Optional description' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;
}
