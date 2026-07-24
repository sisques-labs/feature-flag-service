import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

/**
 * Shared query-string shape for GET/DELETE endpoints scoped by tenant —
 * `tenantId` has no ambient source (no identity-service yet), so every
 * request carries it explicitly.
 */
export class TenantScopedQueryDto {
  @ApiProperty({ description: 'Opaque tenant identifier' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  tenantId!: string;
}
