import { useEffect, useRef, useState, useCallback, useMemo } from 'react'
import { BodyChart, ViewSide } from 'body-muscles'
import type { BodyState } from 'body-muscles'
import { AnimatePresence } from 'framer-motion'
import { Tooltip } from './Tooltip'
import { useAllMuscleStats } from '@/hooks/useAllMuscleStats'
import { SEED_TO_LIB, LIB_TO_SEED } from '@/lib/muscleMappings'

interface AnatomyProps {
  onMuscleClick: (muscleId: string) => void
  view: 'front' | 'back'
}

const INTENSITY = { INACTIVE: 0, TRAINED: 3, RECENT: 6, FREQUENT: 9 }

function seedColor(stats: { hasData: boolean; isRecentlyTrained: boolean; isFrequentlyTrained: boolean } | undefined): string {
  if (!stats?.hasData) return '#6b7280'
  if (stats.isFrequentlyTrained) return '#3b82f6'
  if (stats.isRecentlyTrained) return '#22c55e'
  return '#6b7280'
}

export function Anatomy({ onMuscleClick, view }: AnatomyProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const chartRef = useRef<BodyChart | null>(null)
  const clickTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const [hoveredLibId, setHoveredLibId] = useState<string | null>(null)
  const [tooltipMuscleId, setTooltipMuscleId] = useState<string | null>(null)
  const [tooltipPos, setTooltipPos] = useState({ x: 200, y: 200 })
  const muscleStats = useAllMuscleStats()

  const colorMap = useMemo(() => {
    const map = new Map<string, string>()
    for (const [seedId, stats] of muscleStats) {
      const color = seedColor(stats)
      for (const libId of SEED_TO_LIB[seedId] || []) {
        map.set(libId, color)
      }
    }
    return map
  }, [muscleStats])

  const bodyState: BodyState = useMemo(() => {
    const state: BodyState = {}
    for (const [seedId, stats] of muscleStats) {
      const intensity = !stats.hasData ? INTENSITY.INACTIVE
        : stats.isFrequentlyTrained ? INTENSITY.FREQUENT
        : stats.isRecentlyTrained ? INTENSITY.RECENT
        : INTENSITY.TRAINED
      for (const libId of SEED_TO_LIB[seedId] || []) {
        state[libId] = { intensity, selected: false }
      }
    }
    return state
  }, [muscleStats])

  useEffect(() => {
    if (!containerRef.current) return

    const chart = new BodyChart(containerRef.current, {
      view: view === 'front' ? ViewSide.FRONT : ViewSide.BACK,
      bodyState,
      className: 'opencode-anatomy-chart',
      enableTransitions: true,
      onMuscleHover: (id) => {
        if (id) {
          setHoveredLibId(id)
          setTooltipMuscleId(LIB_TO_SEED[id] ?? null)
        } else {
          setHoveredLibId(null)
          setTooltipMuscleId(null)
        }
      },
      onMuscleClick: (id) => {
        const seedId = LIB_TO_SEED[id]
        if (!seedId) return
        clearTimeout(clickTimeoutRef.current)
        clickTimeoutRef.current = setTimeout(() => onMuscleClick(seedId), 150)
      },
    })

    chartRef.current = chart
    return () => {
      chart.destroy()
      chartRef.current = null
    }
  }, [])

  useEffect(() => {
    chartRef.current?.update({ bodyState })
  }, [bodyState])

  useEffect(() => {
    chartRef.current?.update({ view: view === 'front' ? ViewSide.FRONT : ViewSide.BACK })
  }, [view])

  useEffect(() => {
    const chart = chartRef.current as { musclePaths?: Map<string, SVGPathElement> } | null
    const paths = chart?.musclePaths
    if (!paths) return
    for (const [libId, path] of paths) {
      const base = colorMap.get(libId)
      path.style.fill = libId === hoveredLibId ? '#60a5fa' : (base ?? '#6b7280')
    }
  }, [colorMap, hoveredLibId])

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    setTooltipPos({ x: e.clientX, y: e.clientY })
  }, [])

  const handleMouseLeave = useCallback(() => {
    setTooltipMuscleId(null)
  }, [])

  return (
    <div ref={containerRef} onMouseMove={handleMouseMove} onMouseLeave={handleMouseLeave} className="relative">
      <AnimatePresence>
        {tooltipMuscleId && (
          <Tooltip key={tooltipMuscleId} muscleId={tooltipMuscleId} x={tooltipPos.x} y={tooltipPos.y} />
        )}
      </AnimatePresence>
    </div>
  )
}
