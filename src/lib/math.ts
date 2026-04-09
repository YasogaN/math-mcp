import { create, all } from 'mathjs';
import Algebrite from 'algebrite';

export const math = create(all, { number: 'BigNumber', precision: 64 });

export { Algebrite };

export type ToolSuccess = {
  result: string;
  numeric: number | null;
  latex: string;
  type: 'numeric' | 'symbolic' | 'matrix' | 'boolean' | 'unit';
};

export type ToolError = {
  error: string;
  hint: string;
};

export type ToolResult = ToolSuccess | ToolError;

export function isError(r: ToolResult): r is ToolError {
  return 'error' in r;
}
