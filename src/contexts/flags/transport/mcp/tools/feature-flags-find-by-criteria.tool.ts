import { Injectable } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import {
  Criteria,
  Filter,
  PaginatedResult,
  Sort,
} from '@sisques-labs/nestjs-kit';
import {
  IBaseMcpToolContext,
  IMcpTool,
  McpTool,
} from '@sisques-labs/nestjs-kit/mcp';

import { FeatureFlagFindByCriteriaQuery } from '../../../application/queries/feature-flag-find-by-criteria/feature-flag-find-by-criteria.query';
import { FeatureFlagViewModel } from '../../../domain/view-models/feature-flag.view-model';
import { featureFlagsFindByCriteriaSchema } from '../schemas/feature-flags-find-by-criteria.schema';

interface FeatureFlagsFindByCriteriaArgs {
  filters?: Filter[];
  sorts?: Sort[];
  page?: number;
  perPage?: number;
}

@McpTool()
@Injectable()
export class FeatureFlagsFindByCriteriaMcpTool implements IMcpTool {
  readonly name = 'feature_flags_find_by_criteria';
  readonly title = 'List feature flags by criteria';
  readonly description =
    'Lists feature flags matching the given filters/sorts/pagination. A tenantId filter is required to scope results.';
  readonly inputSchema = featureFlagsFindByCriteriaSchema;

  constructor(private readonly queryBus: QueryBus) {}

  async execute(
    args: Record<string, unknown>,
    _context: IBaseMcpToolContext,
  ): Promise<CallToolResult> {
    const input = args as FeatureFlagsFindByCriteriaArgs;
    const criteria = new Criteria(input.filters ?? [], input.sorts ?? [], {
      page: input.page ?? 1,
      perPage: input.perPage ?? 10,
    });

    const result = await this.queryBus.execute<
      FeatureFlagFindByCriteriaQuery,
      PaginatedResult<FeatureFlagViewModel>
    >(new FeatureFlagFindByCriteriaQuery({ criteria }));

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            items: result.items.map((vm) => ({
              id: vm.id,
              tenantId: vm.tenantId,
              key: vm.key,
              name: vm.name,
              archived: vm.archived,
            })),
            total: result.total,
            page: result.page,
            perPage: result.perPage,
            totalPages: result.totalPages,
          }),
        },
      ],
    };
  }
}
