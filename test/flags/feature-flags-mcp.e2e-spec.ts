import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';

import { createE2EApp, E2EContext } from '../helpers/app-bootstrap';
import { TEST_API_KEY } from '../helpers/api-key';
import { truncateAll } from '../helpers/db-reset';

interface TextToolResult {
  content: Array<{ type: string; text: string }>;
}

function parseResult(result: TextToolResult): unknown {
  return JSON.parse(result.content[0].text);
}

describe('Feature Flags MCP (e2e)', () => {
  let ctx: E2EContext;
  let client: Client;
  let baseUrl: string;

  beforeAll(async () => {
    ctx = await createE2EApp();
    await ctx.app.listen(0);
    const address = ctx.app.getHttpServer().address();
    baseUrl = `http://127.0.0.1:${address.port}/api/mcp`;
  });

  afterAll(async () => {
    await client?.close();
    await ctx.close();
  });

  beforeEach(async () => {
    await truncateAll(ctx.dataSource);
    client = new Client({ name: 'flags-mcp-e2e', version: '1.0.0' });
    const transport = new StreamableHTTPClientTransport(new URL(baseUrl), {
      requestInit: { headers: { 'x-api-key': TEST_API_KEY } },
    });
    await client.connect(transport);
  });

  it('lists all 6 flags tools', async () => {
    const { tools } = await client.listTools();

    expect(tools.map((tool) => tool.name).sort()).toEqual(
      [
        'feature_flag_archive',
        'feature_flag_create',
        'feature_flag_evaluate',
        'feature_flag_find_by_key',
        'feature_flag_set_environment_value',
        'feature_flags_find_by_criteria',
      ].sort(),
    );
  });

  it('creates a flag, evaluates false before enabling, then true after', async () => {
    const created = parseResult(
      (await client.callTool({
        name: 'feature_flag_create',
        arguments: {
          tenantId: 'mcp-tenant',
          key: 'mcp-flag',
          name: 'MCP Flag',
        },
      })) as TextToolResult,
    ) as { id: string };

    expect(created.id).toBeDefined();

    const beforeToggle = parseResult(
      (await client.callTool({
        name: 'feature_flag_evaluate',
        arguments: {
          tenantId: 'mcp-tenant',
          key: 'mcp-flag',
          environment: 'production',
        },
      })) as TextToolResult,
    ) as { enabled: boolean };
    expect(beforeToggle.enabled).toBe(false);

    await client.callTool({
      name: 'feature_flag_set_environment_value',
      arguments: {
        tenantId: 'mcp-tenant',
        key: 'mcp-flag',
        environment: 'production',
        enabled: true,
      },
    });

    const afterToggle = parseResult(
      (await client.callTool({
        name: 'feature_flag_evaluate',
        arguments: {
          tenantId: 'mcp-tenant',
          key: 'mcp-flag',
          environment: 'production',
        },
      })) as TextToolResult,
    ) as { enabled: boolean };
    expect(afterToggle.enabled).toBe(true);
  });

  it('feature_flag_evaluate returns false for a flag that was never created', async () => {
    const result = parseResult(
      (await client.callTool({
        name: 'feature_flag_evaluate',
        arguments: {
          tenantId: 'mcp-tenant',
          key: 'does-not-exist',
          environment: 'development',
        },
      })) as TextToolResult,
    ) as { enabled: boolean };

    expect(result.enabled).toBe(false);
  });
});
