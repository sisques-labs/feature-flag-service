import { Injectable } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import {
  IBaseMcpToolContext,
  IMcpTool,
  McpTool,
} from '@sisques-labs/nestjs-kit/mcp';

import { EvaluateFeatureFlagQuery } from '../../../application/queries/evaluate-feature-flag/evaluate-feature-flag.query';
import { FeatureFlagEnvironmentEnum } from '../../../domain/enums/feature-flag-environment.enum';
import { featureFlagEvaluateSchema } from '../schemas/feature-flag-evaluate.schema';

@McpTool()
@Injectable()
export class FeatureFlagEvaluateMcpTool implements IMcpTool {
  readonly name = 'feature_flag_evaluate';
  readonly title = 'Evaluate a feature flag';
  readonly description =
    'Evaluates a flag for tenantId + key + environment. Fail-safe: returns false for an unknown or archived flag — never an error.';
  readonly inputSchema = featureFlagEvaluateSchema;

  constructor(private readonly queryBus: QueryBus) {}

  async execute(
    args: Record<string, unknown>,
    _context: IBaseMcpToolContext,
  ): Promise<CallToolResult> {
    const enabled = await this.queryBus.execute<
      EvaluateFeatureFlagQuery,
      boolean
    >(
      new EvaluateFeatureFlagQuery(
        args as {
          tenantId: string;
          key: string;
          environment: FeatureFlagEnvironmentEnum;
        },
      ),
    );

    return {
      content: [{ type: 'text', text: JSON.stringify({ enabled }) }],
    };
  }
}
