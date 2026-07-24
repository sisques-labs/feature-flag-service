import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class FeatureFlagRestResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  tenantId!: string;

  @ApiProperty()
  key!: string;

  @ApiProperty()
  name!: string;

  @ApiPropertyOptional({ nullable: true })
  description!: string | null;

  @ApiProperty()
  developmentEnabled!: boolean;

  @ApiProperty()
  stagingEnabled!: boolean;

  @ApiProperty()
  productionEnabled!: boolean;

  @ApiProperty()
  archived!: boolean;

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  updatedAt!: Date;
}
