import { describe, it, expect } from 'vitest';
import { units } from '../../src/tools/units.js';
import { isError } from '../../src/lib/math.js';

describe('units', () => {
  it('distance: "5 km to miles" → result approximately "3.10686 miles" (contains "3.1" and "mile")', () => {
    const result = units('5 km to miles');
    expect(isError(result)).toBe(false);
    if (!isError(result)) {
      expect(result.result).toContain('3.1');
      expect(result.result).toContain('mile');
      expect(result.type).toBe('unit');
      expect(result.latex).not.toBe('');
      expect(typeof result.numeric).toBe('number');
    }
  });

  it('temperature: "100 degF to degC" → result approximately "37.7778 degC" (contains "37" and "degC")', () => {
    const result = units('100 degF to degC');
    expect(isError(result)).toBe(false);
    if (!isError(result)) {
      expect(result.result).toContain('37');
      expect(result.result).toContain('degC');
      expect(result.type).toBe('unit');
    }
  });

  it('pressure: "1 atm to Pa" → result approximately "101325 Pa" (contains "101325")', () => {
    const result = units('1 atm to Pa');
    expect(isError(result)).toBe(false);
    if (!isError(result)) {
      expect(result.result).toContain('101325');
      expect(result.type).toBe('unit');
    }
  });

  it('speed: "60 mph to km/h" → result approximately "96.5606 km/h" (contains "96" and "km")', () => {
    const result = units('60 mph to km/h');
    expect(isError(result)).toBe(false);
    if (!isError(result)) {
      expect(result.result).toContain('96');
      expect(result.result).toContain('km');
      expect(result.type).toBe('unit');
    }
  });

  it('energy: "1 kWh to J" → result "3600000 J" (contains "3600000")', () => {
    const result = units('1 kWh to J');
    expect(isError(result)).toBe(false);
    if (!isError(result)) {
      expect(result.result).toContain('3600000');
      expect(result.type).toBe('unit');
    }
  });

  it('mass: "1 kg to lb" → result approximately "2.20462 lb" (contains "2.2" and "lb")', () => {
    const result = units('1 kg to lb');
    expect(isError(result)).toBe(false);
    if (!isError(result)) {
      expect(result.result).toContain('2.2');
      expect(result.result).toContain('lb');
      expect(result.type).toBe('unit');
    }
  });

  it('already same unit: "5 km to km" → result "5 km"', () => {
    const result = units('5 km to km');
    expect(isError(result)).toBe(false);
    if (!isError(result)) {
      expect(result.result).toBe('5 km');
      expect(result.type).toBe('unit');
    }
  });

  it('incompatible units (length to temperature): "5 km to degC" → returns ToolError with hint about dimensions', () => {
    const result = units('5 km to degC');
    expect(isError(result)).toBe(true);
    if (isError(result)) {
      expect(result.error).toBeTruthy();
      expect(result.hint).toContain('dimension');
    }
  });

  it('invalid format (no "to"): "5 km" → returns ToolError with format hint', () => {
    const result = units('5 km');
    expect(isError(result)).toBe(true);
    if (isError(result)) {
      expect(result.error).toBe('Invalid format');
      expect(result.hint).toContain('format');
    }
  });

  it('unknown unit: "5 frobnitz to km" → returns ToolError', () => {
    const result = units('5 frobnitz to km');
    expect(isError(result)).toBe(true);
    if (isError(result)) {
      expect(result.error).toBeTruthy();
      expect(result.hint).toContain('Check unit names');
    }
  });

  it('undefined expression → returns ToolError with error field', () => {
    const result = units(undefined as any);
    expect(isError(result)).toBe(true);
    if (isError(result)) {
      expect(result.error).toBeTruthy();
    }
  });
});
