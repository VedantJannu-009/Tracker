export type Unit = 'kg' | 'lbs'

export const KG_TO_LBS = 2.2046226218

export function kgToUnit(value: number, unit: Unit): number {
  return unit === 'lbs' ? value * KG_TO_LBS : value
}

export function unitToKg(value: number, unit: Unit): number {
  return unit === 'lbs' ? value / KG_TO_LBS : value
}

function round(value: number): number {
  return Math.round(value * 10) / 10
}

export function formatWeight(value: number, unit: Unit): string {
  const rounded = round(kgToUnit(value, unit))
  return `${Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1)} ${unit}`
}

export function formatWeightValue(value: number, unit: Unit): string {
  const rounded = round(kgToUnit(value, unit))
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1)
}
