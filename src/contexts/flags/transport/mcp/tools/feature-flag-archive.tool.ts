import { Injectable } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import {
  IBaseMcpToolContext,
  IMcpTool,
  McpTool,
} from '@sisques-labs/nestjs-kit/mcp';

import { ArchiveFeatureFlagCommand } from '../../../application/commands/archive-feature-flag/archive-feature-flag.command';
import { featureFlagArchiveSchema } from '../schemas/feature-flag-archive.schema';

@McpTool()
@Injectable()
export class FeatureFlagArchiveMcpTool implements IMcpTool {
  readonly name = 'feature_flag_archive';
  readonly title = 'Archive a feature flag';
  readonly description =
    'Soft-deletes a feature flag. Idempotent — archiving an already-archived flag succeeds.';
  readonly inputSchema = featureFlagArchiveSchema;

  constructor(private readonly commandBus: CommandBus) {}

  async execute(
    args: Record<string, unknown>,
    _context: IBaseMcpToolContext,
  ): Promise<CallToolResult> {
    await this.commandBus.execute(
      new ArchiveFeatureFlagCommand(args as { tenantId: string; key: string }),
    );

    return {
      content: [{ type: 'text', text: JSON.stringify({ success: true }) }],
    };
  }
}
