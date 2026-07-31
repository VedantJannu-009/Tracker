import { describe, expect, it } from 'vitest'
import { KG_TO_LBS, kgToUnit, unitToKg, formatWeight, formatWeightValue } from '@/lib/units'

describe('unit conversion', () => {
  it('exposes the kg→lbs factor', () => {
    expect(KG_TO_LBS).toBe(2.2046226218)
  })

  it('kgToUnit is identity for kg and multiplies for lbs', () => {
    expect(kgToUnit(80, 'kg')).toBe(80)
    expect(kgToUnit(80, 'lbs')).toBeCloseTo(176.37, 2)
  })

  it('unitToKg is identity for kg and divides for lbs', () => {
    expect(unitToKg(80, 'kg')).toBe(80)
    expect(unitToKg(176.369809744, 'lbs')).toBeCloseTo(80, 5)
  })

  it('round-trips kg → lbs → kg', () => {
    const value = 62.5
    expect(unitToKg(kgToUnit(value, 'lbs'), 'lbs')).toBeCloseTo(value, 6)
  })

  it('formats weight with unit suffix', () => {
    expect(formatWeight(80, 'kg')).toBe('80 kg')
    expect(formatWeight(62.5, 'kg')).toBe('62.5 kg')
    expect(formatWeight(80, 'lbs')).toBe('176.4 lbs')
  })

  it('formats weight value without unit', () => {
    expect(formatWeightValue(80, 'kg')).toBe('80')
    expect(formatWeightValue(62.5, 'kg')).toBe('62.5')
    expect(formatWeightValue(80, 'lbs')).toBe('176.4')
    expect(formatWeightValue(100, 'lbs')).toBe('220.5')
  })

  it('rounds lbs to one decimal but keeps kg integral', () => {
    expect(formatWeight(20, 'lbs')).toBe('44.1 lbs')
    expect(formatWeight(1.5, 'kg')).toBe('1.5 kg')
    expect(formatWeight(0, 'lbs')).toBe('0 lbs')
  })
})
