import { Injectable } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import {
  IBaseMcpToolContext,
  IMcpTool,
  McpTool,
} from '@sisques-labs/nestjs-kit/mcp';

import { FeatureFlagFindByKeyQuery } from '../../../application/queries/feature-flag-find-by-key/feature-flag-find-by-key.query';
import { FeatureFlagViewModel } from '../../../domain/view-models/feature-flag.view-model';
import { featureFlagFindByKeySchema } from '../schemas/feature-flag-find-by-key.schema';

@McpTool()
@Injectable()
export class FeatureFlagFindByKeyMcpTool implements IMcpTool {
  readonly name = 'feature_flag_find_by_key';
  readonly title = 'Find a feature flag by key';
  readonly description =
    'Looks up a feature flag by tenantId + key. Throws if the flag does not exist.';
  readonly inputSchema = featureFlagFindByKeySchema;

  constructor(private readonly queryBus: QueryBus) {}

  async execute(
    args: Record<string, unknown>,
    _context: IBaseMcpToolContext,
  ): Promise<CallToolResult> {
    const viewModel = await this.queryBus.execute<
      FeatureFlagFindByKeyQuery,
      FeatureFlagViewModel
    >(new FeatureFlagFindByKeyQuery(args as { tenantId: string; key: string }));

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            id: viewModel.id,
            tenantId: viewModel.tenantId,
            key: viewModel.key,
            name: viewModel.name,
            description: viewModel.description,
            developmentEnabled: viewModel.developmentEnabled,
            stagingEnabled: viewModel.stagingEnabled,
            productionEnabled: viewModel.productionEnabled,
            archived: viewModel.archived,
          }),
        },
      ],
    };
  }
}
