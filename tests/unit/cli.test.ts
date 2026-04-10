import { describe, it, expect, vi, beforeEach } from 'vitest';
import { parseArgs, printHelp, printVersion, VERSION } from '../../src/cli.js';

describe('parseArgs', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('should return default config when no args provided', () => {
    const result = parseArgs([]);
    expect(result.config.maxExpressionLength).toBe(1000);
    expect(result.config.maxRecursionDepth).toBe(100);
    expect(result.config.timeout).toBe(5000);
    expect(result.config.allowedFunctions).toBeNull();
    expect(result.showHelp).toBe(false);
    expect(result.showVersion).toBe(false);
  });

  it('should parse --max-expression-length', () => {
    const result = parseArgs(['--max-expression-length', '5000']);
    expect(result.config.maxExpressionLength).toBe(5000);
  });

  it('should parse --max-recursion-depth', () => {
    const result = parseArgs(['--max-recursion-depth', '200']);
    expect(result.config.maxRecursionDepth).toBe(200);
  });

  it('should parse --timeout', () => {
    const result = parseArgs(['--timeout', '10000']);
    expect(result.config.timeout).toBe(10000);
  });

  it('should parse --allowed-functions', () => {
    const result = parseArgs(['--allowed-functions', 'sin,cos,sqrt']);
    expect(result.config.allowedFunctions).toEqual(['sin', 'cos', 'sqrt']);
  });

  it('should parse multiple options', () => {
    const result = parseArgs([
      '--max-expression-length', '5000',
      '--max-recursion-depth', '200',
      '--timeout', '10000',
      '--allowed-functions', 'sin,cos,sqrt',
    ]);
    expect(result.config.maxExpressionLength).toBe(5000);
    expect(result.config.maxRecursionDepth).toBe(200);
    expect(result.config.timeout).toBe(10000);
    expect(result.config.allowedFunctions).toEqual(['sin', 'cos', 'sqrt']);
  });

  it('should set showHelp when --help provided', () => {
    const result = parseArgs(['--help']);
    expect(result.showHelp).toBe(true);
  });

  it('should set showVersion when --version provided', () => {
    const result = parseArgs(['--version']);
    expect(result.showVersion).toBe(true);
  });

  it('should exit with error for unknown option', () => {
    const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => {
      throw new Error('exit called');
    });
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => parseArgs(['--unknown'])).toThrow('exit called');
    expect(consoleSpy).toHaveBeenCalledWith('Error: Unknown option: --unknown');
    exitSpy.mockRestore();
    consoleSpy.mockRestore();
  });

  it('should exit with error for missing value', () => {
    const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => {
      throw new Error('exit called');
    });
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => parseArgs(['--max-expression-length'])).toThrow('exit called');
    expect(consoleSpy).toHaveBeenCalledWith('Error: --max-expression-length requires a number');
    exitSpy.mockRestore();
    consoleSpy.mockRestore();
  });
});

describe('printHelp', () => {
  it('should print help text', () => {
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    printHelp();
    expect(consoleSpy).toHaveBeenCalled();
    const output = consoleSpy.mock.calls[0][0];
    expect(output).toContain('math-mcp');
    expect(output).toContain('--max-expression-length');
    expect(output).toContain('--help');
    expect(output).toContain('--version');
    consoleSpy.mockRestore();
  });
});

describe('printVersion', () => {
  it('should print version', () => {
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    printVersion();
    expect(consoleSpy).toHaveBeenCalledWith(`math-mcp version ${VERSION}`);
    consoleSpy.mockRestore();
  });
});