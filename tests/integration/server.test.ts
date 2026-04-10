import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { execSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '../../');

let client: Client;

describe('MCP Server Integration', { timeout: 30000 }, () => {
  beforeAll(async () => {
    execSync('pnpm build', { cwd: projectRoot, stdio: 'inherit' });

    const transport = new StdioClientTransport({
      command: 'node',
      args: [path.join(projectRoot, 'dist/index.js')],
    });

    client = new Client({ name: 'test-client', version: '1.0.0' }, { capabilities: {} });
    await client.connect(transport);
  });

  afterAll(async () => {
    await client.close();
  });

  it('tools/list returns all 8 tools', async () => {
    const tools = await client.listTools();
    const names = tools.tools.map((t) => t.name);
    expect(names).toContain('evaluate');
    expect(names).toContain('solve');
    expect(names).toContain('simplify');
    expect(names).toContain('factor');
    expect(names).toContain('expand');
    expect(names).toContain('matrix');
    expect(names).toContain('statistics');
    expect(names).toContain('units');
    expect(names).toHaveLength(8);
  });

  it('evaluate round-trip: 2 + 2 = 4', async () => {
    const result = await client.callTool({ name: 'evaluate', arguments: { expression: '2 + 2' } });
    const parsed = JSON.parse((result.content as Array<{ type: string; text: string }>)[0].text);
    expect(parsed.result).toBe('4');
  });

  it('solve round-trip: x^2 - 9 = 0 gives x = 3 and x = -3', async () => {
    const result = await client.callTool({
      name: 'solve',
      arguments: { equation: 'x^2 - 9 = 0', variable: 'x' },
    });
    const parsed = JSON.parse((result.content as Array<{ type: string; text: string }>)[0].text);
    expect(parsed.result).toContain('3');
    expect(parsed.result).toContain('-3');
  });

  it('simplify round-trip: x + x simplifies to 2x', async () => {
    const result = await client.callTool({
      name: 'simplify',
      arguments: { expression: 'x + x' },
    });
    const parsed = JSON.parse((result.content as Array<{ type: string; text: string }>)[0].text);
    expect(parsed.result).toContain('2');
    expect(parsed.result).toContain('x');
  });

  it('factor round-trip: x^2 - 9 factors to (x+3)(x-3)', async () => {
    const result = await client.callTool({
      name: 'factor',
      arguments: { expression: 'x^2 - 9' },
    });
    const parsed = JSON.parse((result.content as Array<{ type: string; text: string }>)[0].text);
    expect(parsed.result).toContain('3');
  });

  it('expand round-trip: (x+3)*(x-3) expands to x^2 - 9', async () => {
    const result = await client.callTool({
      name: 'expand',
      arguments: { expression: '(x+3)*(x-3)' },
    });
    const parsed = JSON.parse((result.content as Array<{ type: string; text: string }>)[0].text);
    expect(parsed.result).toContain('x');
    expect(parsed.result).toContain('9');
  });

  it('matrix round-trip: determinant of [[1,2],[3,4]] = -2', async () => {
    const result = await client.callTool({
      name: 'matrix',
      arguments: { op: 'determinant', a: [[1, 2], [3, 4]] },
    });
    const parsed = JSON.parse((result.content as Array<{ type: string; text: string }>)[0].text);
    expect(parsed.result).toBe('-2');
  });

  it('statistics round-trip: mean of [1,2,3,4,5] = 3', async () => {
    const result = await client.callTool({
      name: 'statistics',
      arguments: { op: 'mean', data: [1, 2, 3, 4, 5] },
    });
    const parsed = JSON.parse((result.content as Array<{ type: string; text: string }>)[0].text);
    expect(parsed.result).toBe('3');
  });

  it('units round-trip: 1 km to m = 1000', async () => {
    const result = await client.callTool({
      name: 'units',
      arguments: { expression: '1 km to m' },
    });
    const parsed = JSON.parse((result.content as Array<{ type: string; text: string }>)[0].text);
    expect(parsed.result).toContain('1000');
  });

  it('malformed evaluate call returns an error field', async () => {
    const result = await client.callTool({
      name: 'evaluate',
      arguments: { expression: '2 +* 3' },
    });
    const parsed = JSON.parse((result.content as Array<{ type: string; text: string }>)[0].text);
    expect(parsed).toHaveProperty('error');
  });

  it('5 consecutive evaluate calls return valid results (no state bleed)', async () => {
    const cases = [
      { expr: '1+1', expected: '2' },
      { expr: '2+2', expected: '4' },
      { expr: '3+3', expected: '6' },
      { expr: '4+4', expected: '8' },
      { expr: '5+5', expected: '10' },
    ];

    for (const { expr, expected } of cases) {
      const result = await client.callTool({ name: 'evaluate', arguments: { expression: expr } });
      const parsed = JSON.parse((result.content as Array<{ type: string; text: string }>)[0].text);
      expect(parsed).not.toHaveProperty('error');
      expect(parsed).toHaveProperty('result');
      expect(parsed.result).toBe(expected);
    }
  });
});
