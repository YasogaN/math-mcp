import { parse, type Node } from '@scicave/math-latex-parser';

export function isLatex(input: string): boolean {
  const trimmed = input.trim();
  if (trimmed.startsWith('$') && trimmed.endsWith('$')) {
    return true;
  }
  if (trimmed.startsWith('\\') && trimmed.length > 1) {
    return true;
  }
  return false;
}

function nodeToString(node: Node): string {
  switch (node.type) {
    case 'number':
      return String(node.value);

    case 'id':
      return node.name ?? '';

    case 'frac': {
      const num = nodeToString(node.args[0]);
      const den = nodeToString(node.args[1]);
      return `(${num})/(${den})`;
    }

    case 'sqrt': {
      const arg = nodeToString(node.args[0]);
      return `sqrt(${arg})`;
    }

    case 'pow': {
      const base = nodeToString(node.args[0]);
      const exp = nodeToString(node.args[1]);
      return `(${base})^(${exp})`;
    }

    case 'times': {
      const left = nodeToString(node.args[0]);
      const right = nodeToString(node.args[1]);
      return `(${left})*(${right})`;
    }

    case 'div': {
      const left = nodeToString(node.args[0]);
      const right = nodeToString(node.args[1]);
      return `(${left})/(${right})`;
    }

    case 'plus': {
      const left = nodeToString(node.args[0]);
      const right = nodeToString(node.args[1]);
      return `(${left})+(${right})`;
    }

    case 'minus': {
      const left = nodeToString(node.args[0]);
      const right = nodeToString(node.args[1]);
      return `(${left})-(${right})`;
    }

    case 'neg': {
      const arg = nodeToString(node.args[0]);
      return `-(${arg})`;
    }

    case 'seq': {
      if (node.args.length === 0) return '';
      return node.args.map(nodeToString).join(',');
    }

    case 'call':
    case 'function': {
      const fnName = node.name ?? '';
      const args = node.args.map(nodeToString).join(',');
      return `${fnName}(${args})`;
    }

    case 'operator': {
      if (node.name === '^') {
        const base = nodeToString(node.args[0]);
        const exp = nodeToString(node.args[1]);
        return `(${base})^(${exp})`;
      }
      const left = nodeToString(node.args[0]);
      const right = nodeToString(node.args[1]);
      return `(${left})${node.name}(${right})`;
    }

    case 'pi':
      return 'pi';

    case 'e':
    case 'E':
      return 'e';

    case 'infinity':
      return 'inf';

    default:
      if (typeof node.value === 'string') {
        return node.value;
      }
      if (typeof node.name === 'string') {
        return node.name ?? '';
      }
      return '';
  }
}

export function latexToExpression(input: string): string {
  const trimmed = input.trim();
  const latexInput = trimmed.startsWith('$') && trimmed.endsWith('$')
    ? trimmed.slice(1, -1)
    : trimmed;

  const ast = parse(latexInput);
  return nodeToString(ast);
}