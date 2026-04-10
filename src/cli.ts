import { DEFAULT_CONFIG, SecurityConfig } from './lib/validator.js';

export interface CLIOptions {
  config: SecurityConfig;
  showHelp: boolean;
  showVersion: boolean;
}

const VERSION = '0.1.0';

export function parseArgs(args: string[] = process.argv.slice(2)): CLIOptions {
  const options: CLIOptions = {
    config: { ...DEFAULT_CONFIG },
    showHelp: false,
    showVersion: false,
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    switch (arg) {
      case '--max-expression-length': {
        const value = args[++i];
        if (value === undefined) {
          console.error('Error: --max-expression-length requires a number');
          process.exit(1);
        }
        const num = parseInt(value, 10);
        if (isNaN(num) || num <= 0) {
          console.error('Error: --max-expression-length must be a positive number');
          process.exit(1);
        }
        options.config.maxExpressionLength = num;
        break;
      }

      case '--max-recursion-depth': {
        const value = args[++i];
        if (value === undefined) {
          console.error('Error: --max-recursion-depth requires a number');
          process.exit(1);
        }
        const num = parseInt(value, 10);
        if (isNaN(num) || num <= 0) {
          console.error('Error: --max-recursion-depth must be a positive number');
          process.exit(1);
        }
        options.config.maxRecursionDepth = num;
        break;
      }

      case '--timeout': {
        const value = args[++i];
        if (value === undefined) {
          console.error('Error: --timeout requires a number');
          process.exit(1);
        }
        const num = parseInt(value, 10);
        if (isNaN(num) || num <= 0) {
          console.error('Error: --timeout must be a positive number');
          process.exit(1);
        }
        options.config.timeout = num;
        break;
      }

      case '--allowed-functions': {
        const value = args[++i];
        if (value === undefined) {
          console.error('Error: --allowed-functions requires a comma-separated list');
          process.exit(1);
        }
        options.config.allowedFunctions = value.split(',').map((s) => s.trim()).filter(Boolean);
        break;
      }

      case '--help':
        options.showHelp = true;
        break;

      case '--version':
        options.showVersion = true;
        break;

      default:
        if (arg.startsWith('-')) {
          console.error(`Error: Unknown option: ${arg}`);
          process.exit(1);
        }
        break;
    }
  }

  return options;
}

export function printHelp(): void {
  const helpText = `math-mcp - A comprehensive math MCP server for AI agents

Usage: math-mcp [options]

Options:
  --max-expression-length <number>  Maximum length of mathematical expressions (default: ${DEFAULT_CONFIG.maxExpressionLength})
  --max-recursion-depth <number>  Maximum recursion depth for expression evaluation (default: ${DEFAULT_CONFIG.maxRecursionDepth})
  --timeout <ms>                   Timeout for expression evaluation in milliseconds (default: ${DEFAULT_CONFIG.timeout})
  --allowed-functions <list>       Comma-separated list of allowed functions (default: all allowed)
  --help                           Show this help message and exit
  --version                         Show version information and exit

Examples:
  math-mcp
  math-mcp --max-expression-length 5000 --timeout 10000
  math-mcp --allowed-functions "sin,cos,sqrt,log"
`;
  console.log(helpText);
}

export function printVersion(): void {
  console.log(`math-mcp version ${VERSION}`);
}

export { VERSION };