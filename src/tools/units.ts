import { math, toLatex, type ToolResult } from '../lib/math.js';

// Register common unit aliases not built into mathjs
try {
  math.createUnit('mph', '1 mi/h');
} catch {
  // Already registered (in case module is reloaded)
}

export function units(expression: string): ToolResult {
  if (!expression || expression.trim() === '') {
    return {
      error: 'Expression cannot be empty',
      hint: "Use format: '<value> <unit> to <unit>', e.g. '5 km to miles'",
    };
  }

  const separator = ' to ';
  const sepIndex = expression.indexOf(separator);

  if (sepIndex === -1) {
    return {
      error: 'Invalid format',
      hint: "Use format: '<value> <unit> to <unit>', e.g. '5 km to miles'",
    };
  }

  const fromStr = expression.slice(0, sepIndex).trim();
  const toUnit = expression.slice(sepIndex + separator.length).trim();

  if (!fromStr.trim()) {
    return { error: 'Invalid format', hint: "Use format: '<value> <unit> to <unit>', e.g. '5 km to miles'" };
  }
  if (!toUnit.trim()) {
    return { error: 'Invalid format', hint: "Use format: '<value> <unit> to <unit>', e.g. '5 km to miles'" };
  }

  try {
    const converted = math.unit(fromStr).to(toUnit);
    const numericValue = converted.toNumber(toUnit);
    const formatted = parseFloat(numericValue.toPrecision(6)).toString();
    const resultStr = `${formatted} ${toUnit}`;

    let latex = '';
    try {
      latex = math.parse(resultStr).toTex();
    } catch {
      latex = `${formatted}\\ \\text{${toUnit}}`;
    }

    return {
      result: resultStr,
      numeric: numericValue,
      latex,
      type: 'unit',
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);

    // Dimension mismatch error
    if (
      message.includes('do not match') ||
      message.includes('Units do not match') ||
      message.includes('dimension') ||
      message.includes('cannot be converted')
    ) {
      return {
        error: message,
        hint: 'Units must be of the same dimension (e.g. length to length, temperature to temperature)',
      };
    }

    // Fallback for unknown units and other errors
    return {
      error: message,
      hint: 'Check unit names. Examples: km, miles, kg, lb, degF, degC, Pa, atm, kWh, J, mph',
    };
  }
}
