import { ApiProperty } from '@nestjs/swagger';

export class EvaluateFeatureFlagRestResponseDto {
  @ApiProperty({
    description:
      'Whether the flag is enabled for the given environment. Fail-safe: false for an unknown or archived flag — never an error.',
  })
  enabled!: boolean;
}
