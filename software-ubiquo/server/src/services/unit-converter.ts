/**
 * Unit Converter Service
 * Handles normalization of eosinophil values from different units to a standard format
 */

export interface NormalizedValue {
  value: number;
  unit: string; // Standard unit after conversion
  originalUnit?: string; // Original unit before conversion
}

/**
 * Standard unit for eosinophil values in our database
 * Using percentage (%) as the standard unit
 */
export const STANDARD_UNIT = '%';

/**
 * Eosinophil reference ranges for different units
 * These are typical clinical reference ranges
 */
export const REFERENCE_RANGES = {
  '%': { min: 0, max: 5 }, // 0-5% is normal for eosinophils
  'cells/uL': { min: 0, max: 500 }, // 0-500 cells/uL
  '10*9/L': { min: 0, max: 0.5 }, // 0-0.5 x 10^9/L
  '/uL': { min: 0, max: 500 }, // Same as cells/uL
};

/**
 * Unit conversion factors to standard unit (%)
 * These are approximate conversions based on typical blood cell counts
 */
const CONVERSION_FACTORS: Record<string, number> = {
  // Percentage to percentage (no conversion)
  '%': 1,

  // Absolute count to percentage
  // Assuming total WBC count of ~7000 cells/uL and normal eosinophil percentage of 2%
  'cells/uL': 0.014, // 1 cell/uL ≈ 0.014% (1/7000 * 100)
  '/uL': 0.014, // Same as cells/uL

  // SI units to percentage
  '10*9/L': 14, // 1 x 10^9/L ≈ 14% (1 * 10^9 / 7 * 10^9 * 100)
  '10^9/L': 14, // Alternative notation
  'G/L': 14, // Same as 10^9/L
  '10*6/L': 0.014, // 1 x 10^6/L ≈ 0.014%
  '10^6/L': 0.014, // Alternative notation
  'M/L': 0.014, // Same as 10^6/L
};

/**
 * Normalizes an eosinophil value to the standard unit (%)
 * @param value The numeric value
 * @param unit The original unit
 * @returns Normalized value with conversion information
 */
export function normalizeEosinophilValue(value: number, unit: string): NormalizedValue {
  // Validate input
  if (typeof value !== 'number' || isNaN(value) || !isFinite(value)) {
    throw new Error(`Invalid eosinophil value: ${value}`);
  }

  if (!unit || typeof unit !== 'string') {
    throw new Error(`Invalid unit: ${unit}`);
  }

  // Normalize unit string (remove case sensitivity and common variations)
  const normalizedUnit = normalizeUnitString(unit);

  // Check if we have a conversion factor for this unit
  const conversionFactor = CONVERSION_FACTORS[normalizedUnit];

  if (conversionFactor === undefined) {
    throw new Error(
      `Unsupported unit for eosinophil values: ${unit}. Supported units: ${Object.keys(CONVERSION_FACTORS).join(', ')}`
    );
  }

  // Convert to standard unit
  const convertedValue = value * conversionFactor;

  return {
    value: convertedValue,
    unit: STANDARD_UNIT,
    originalUnit: unit,
  };
}

/**
 * Normalizes unit strings to handle variations in notation
 * @param unit The unit string to normalize
 * @returns Normalized unit string
 */
function normalizeUnitString(unit: string): string {
  // Convert to lowercase and remove common variations
  let normalized = unit
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '') // Remove spaces
    .replace(/cells\/ul/g, 'cells/uL') // Standardize cells/uL
    .replace(/\/ul/g, '/uL') // Standardize /uL
    .replace(/10\^9\/l/g, '10*9/L') // Standardize 10^9/L
    .replace(/10\^6\/l/g, '10*6/L') // Standardize 10^6/L
    .replace(/g\/l/g, 'G/L') // Standardize G/L
    .replace(/m\/l/g, 'M/L'); // Standardize M/L

  return normalized;
}

/**
 * Validates if a normalized eosinophil value is within expected ranges
 * @param normalizedValue The normalized eosinophil value
 * @returns True if value is within normal range, false otherwise
 */
export function isEosinophilValueNormal(normalizedValue: NormalizedValue): boolean {
  const range = REFERENCE_RANGES[normalizedValue.unit as keyof typeof REFERENCE_RANGES];

  if (!range) {
    throw new Error(`No reference range defined for unit: ${normalizedValue.unit}`);
  }

  return normalizedValue.value >= range.min && normalizedValue.value <= range.max;
}

/**
 * Determines if an eosinophil value indicates eosinophilia (elevated eosinophils)
 * @param normalizedValue The normalized eosinophil value
 * @returns True if value indicates eosinophilia, false otherwise
 */
export function isEosinophilia(normalizedValue: NormalizedValue): boolean {
  const range = REFERENCE_RANGES[normalizedValue.unit as keyof typeof REFERENCE_RANGES];

  if (!range) {
    throw new Error(`No reference range defined for unit: ${normalizedValue.unit}`);
  }

  // Eosinophilia is typically defined as >5% or >500 cells/uL
  // For normalized values in %, threshold is 5%
  return normalizedValue.value > range.max;
}

/**
 * Gets the severity level of eosinophilia
 * @param normalizedValue The normalized eosinophil value
 * @returns Severity level string
 */
export function getEosinophiliaSeverity(
  normalizedValue: NormalizedValue
): 'normal' | 'mild' | 'moderate' | 'severe' {
  if (!isEosinophilia(normalizedValue)) {
    return 'normal';
  }

  // Severity thresholds based on percentage values
  if (normalizedValue.value <= 10) {
    return 'mild'; // 5-10%
  } else if (normalizedValue.value <= 20) {
    return 'moderate'; // 10-20%
  } else {
    return 'severe'; // >20%
  }
}

/**
 * Converts a normalized value back to a specified unit
 * @param normalizedValue The normalized value in standard unit
 * @param targetUnit The target unit to convert to
 * @returns Value in target unit
 */
export function convertToUnit(
  normalizedValue: NormalizedValue,
  targetUnit: string
): NormalizedValue {
  if (normalizedValue.unit !== STANDARD_UNIT) {
    throw new Error(`Cannot convert from non-standard unit: ${normalizedValue.unit}`);
  }

  const normalizedTargetUnit = normalizeUnitString(targetUnit);
  const conversionFactor = CONVERSION_FACTORS[normalizedTargetUnit];

  if (conversionFactor === undefined) {
    throw new Error(
      `Unsupported target unit: ${targetUnit}. Supported units: ${Object.keys(CONVERSION_FACTORS).join(', ')}`
    );
  }

  const convertedValue = normalizedValue.value / conversionFactor;

  return {
    value: convertedValue,
    unit: targetUnit,
    originalUnit: normalizedValue.unit,
  };
}
