import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class SetFeatureFlagEnvironmentValueDto {
  @ApiProperty({ description: 'Opaque tenant identifier' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  tenantId!: string;

  @ApiProperty({ description: 'Whether the environment should be enabled' })
  @IsBoolean()
  enabled!: boolean;
}
