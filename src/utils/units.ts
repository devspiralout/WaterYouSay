import { UnitSystem } from '../types';
import { ML_PER_OZ, ML_PER_CUP } from '../constants';

/**
 * Convert milliliters to the user's preferred unit
 */
export function mlToDisplay(ml: number, unitSystem: UnitSystem): string {
  if (unitSystem === 'metric') {
    if (ml >= 1000) {
      return `${(ml / 1000).toFixed(1)}L`;
    }
    return `${Math.round(ml)}ml`;
  } else {
    const oz = ml / ML_PER_OZ;
    if (oz >= 32) {
      const cups = ml / ML_PER_CUP;
      return `${cups.toFixed(1)} cups`;
    }
    return `${oz.toFixed(1)} oz`;
  }
}

/**
 * Convert milliliters to ounces
 */
export function mlToOz(ml: number): number {
  return ml / ML_PER_OZ;
}

/**
 * Convert ounces to milliliters
 */
export function ozToMl(oz: number): number {
  return oz * ML_PER_OZ;
}

/**
 * Convert kilograms to pounds
 */
export function kgToLbs(kg: number): number {
  return kg * 2.20462;
}

/**
 * Convert pounds to kilograms
 */
export function lbsToKg(lbs: number): number {
  return lbs / 2.20462;
}

/**
 * Get the label for the unit system
 */
export function getVolumeUnitLabel(unitSystem: UnitSystem, small: boolean = false): string {
  if (unitSystem === 'metric') {
    return small ? 'ml' : 'L';
  }
  return small ? 'oz' : 'cups';
}

/**
 * Get quick-add amounts formatted for display
 */
export function getQuickAddAmounts(
  unitSystem: UnitSystem,
  amounts: number[] = [100, 250, 500]
): { ml: number; display: string }[] {
  return amounts.map(ml => ({
    ml,
    display: unitSystem === 'metric'
      ? `${ml}ml`
      : `${Math.round(ml / ML_PER_OZ)} oz`,
  }));
}

/**
 * Format weight for display
 */
export function formatWeight(kg: number, unitSystem: UnitSystem): string {
  if (unitSystem === 'metric') {
    return `${kg} kg`;
  }
  return `${Math.round(kgToLbs(kg))} lbs`;
}
