import { Injectable } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import {
  IBaseMcpToolContext,
  IMcpTool,
  McpTool,
} from '@sisques-labs/nestjs-kit/mcp';

import { CreateFeatureFlagCommand } from '../../../application/commands/create-feature-flag/create-feature-flag.command';
import { featureFlagCreateSchema } from '../schemas/feature-flag-create.schema';

@McpTool()
@Injectable()
export class FeatureFlagCreateMcpTool implements IMcpTool {
  readonly name = 'feature_flag_create';
  readonly title = 'Create feature flag';
  readonly description =
    'Creates a feature flag scoped to a tenant, with all environments disabled by default.';
  readonly inputSchema = featureFlagCreateSchema;

  constructor(private readonly commandBus: CommandBus) {}

  async execute(
    args: Record<string, unknown>,
    _context: IBaseMcpToolContext,
  ): Promise<CallToolResult> {
    const id = await this.commandBus.execute<CreateFeatureFlagCommand, string>(
      new CreateFeatureFlagCommand(
        args as {
          tenantId: string;
          key: string;
          name: string;
          description?: string;
        },
      ),
    );

    return {
      content: [{ type: 'text', text: JSON.stringify({ id }) }],
    };
  }
}
