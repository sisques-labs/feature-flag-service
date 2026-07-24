import { Injectable } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import {
  IBaseMcpToolContext,
  IMcpTool,
  McpTool,
} from '@sisques-labs/nestjs-kit/mcp';

import { SetFeatureFlagEnvironmentValueCommand } from '../../../application/commands/set-feature-flag-environment-value/set-feature-flag-environment-value.command';
import { FeatureFlagEnvironmentEnum } from '../../../domain/enums/feature-flag-environment.enum';
import { featureFlagSetEnvironmentValueSchema } from '../schemas/feature-flag-set-environment-value.schema';

@McpTool()
@Injectable()
export class FeatureFlagSetEnvironmentValueMcpTool implements IMcpTool {
  readonly name = 'feature_flag_set_environment_value';
  readonly title = 'Toggle a feature flag environment value';
  readonly description =
    'Enables or disables a feature flag for a single environment (development, staging, production) independently of the others.';
  readonly inputSchema = featureFlagSetEnvironmentValueSchema;

  constructor(private readonly commandBus: CommandBus) {}

  async execute(
    args: Record<string, unknown>,
    _context: IBaseMcpToolContext,
  ): Promise<CallToolResult> {
    await this.commandBus.execute(
      new SetFeatureFlagEnvironmentValueCommand(
        args as {
          tenantId: string;
          key: string;
          environment: FeatureFlagEnvironmentEnum;
          enabled: boolean;
        },
      ),
    );

    return {
      content: [{ type: 'text', text: JSON.stringify({ success: true }) }],
    };
  }
}
