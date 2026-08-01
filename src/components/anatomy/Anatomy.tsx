import { useEffect, useRef, useState, useCallback, useMemo } from 'react'
import { BodyChart, ViewSide } from 'body-muscles'
import type { BodyState } from 'body-muscles'
import { AnimatePresence } from 'framer-motion'
import { Tooltip } from './Tooltip'
import { useAllMuscleStats } from '@/hooks/useAllMuscleStats'
import type { RecoveryView } from '@/hooks/useRecovery'
import { SEED_TO_LIB, LIB_TO_SEED } from '@/lib/muscleMappings'

interface AnatomyProps {
  onMuscleClick: (muscleId: string) => void
  view: 'front' | 'back'
  colorMode?: 'activity' | 'recovery'
  recoveryMap?: Map<string, RecoveryView> | null
}

const INTENSITY = { INACTIVE: 0, TRAINED: 3, RECENT: 6, FREQUENT: 9 }

const RECOVERY_COLORS: Record<RecoveryView['status'], string> = {
  recovering: '#f59e0b',
  ready: '#22c55e',
  inactive: '#6b7280',
}

function seedColor(stats: { hasData: boolean; isRecentlyTrained: boolean; isFrequentlyTrained: boolean } | undefined): string {
  if (!stats?.hasData) return '#6b7280'
  if (stats.isFrequentlyTrained) return '#3b82f6'
  if (stats.isRecentlyTrained) return '#22c55e'
  return '#6b7280'
}

export function Anatomy({ onMuscleClick, view, colorMode = 'activity', recoveryMap }: AnatomyProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const chartRef = useRef<BodyChart | null>(null)
  const clickTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const onMuscleClickRef = useRef(onMuscleClick)
  const [hoveredLibId, setHoveredLibId] = useState<string | null>(null)
  const [tooltipMuscleId, setTooltipMuscleId] = useState<string | null>(null)
  const [tooltipPos, setTooltipPos] = useState({ x: 200, y: 200 })
  const muscleStats = useAllMuscleStats(colorMode !== 'recovery')

  const { colorMap, glowIds } = useMemo(() => {
    const map = new Map<string, string>()
    const glow = new Set<string>()
    if (colorMode === 'recovery' && recoveryMap) {
      for (const [seedId, rec] of recoveryMap) {
        for (const libId of SEED_TO_LIB[seedId] || []) {
          map.set(libId, RECOVERY_COLORS[rec.status])
          if (rec.status === 'recovering') glow.add(libId)
        }
      }
    } else {
      for (const [seedId, stats] of muscleStats) {
        const color = seedColor(stats)
        for (const libId of SEED_TO_LIB[seedId] || []) {
          map.set(libId, color)
        }
      }
    }
    return { colorMap: map, glowIds: glow }
  }, [colorMode, recoveryMap, muscleStats])

  const bodyState: BodyState = useMemo(() => {
    const state: BodyState = {}
    if (colorMode === 'recovery' && recoveryMap) {
      for (const [seedId, rec] of recoveryMap) {
        const intensity = rec.status === 'recovering'
          ? INTENSITY.RECENT
          : rec.status === 'ready'
            ? INTENSITY.TRAINED
            : INTENSITY.INACTIVE
        for (const libId of SEED_TO_LIB[seedId] || []) {
          state[libId] = { intensity, selected: false }
        }
      }
    } else {
      for (const [seedId, stats] of muscleStats) {
        const intensity = !stats.hasData ? INTENSITY.INACTIVE
          : stats.isFrequentlyTrained ? INTENSITY.FREQUENT
          : stats.isRecentlyTrained ? INTENSITY.RECENT
          : INTENSITY.TRAINED
        for (const libId of SEED_TO_LIB[seedId] || []) {
          state[libId] = { intensity, selected: false }
        }
      }
    }
    return state
  }, [colorMode, recoveryMap, muscleStats])

  useEffect(() => {
    onMuscleClickRef.current = onMuscleClick
  }, [onMuscleClick])

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
        clickTimeoutRef.current = setTimeout(() => onMuscleClickRef.current(seedId), 150)
      },
    })

    chartRef.current = chart
    return () => {
      clearTimeout(clickTimeoutRef.current)
      chart.destroy()
      chartRef.current = null
    }
    // view and bodyState are initial config only; updates flow through the effects below
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
      const recovering = glowIds.has(libId)
      const isHovered = libId === hoveredLibId
      path.style.fill = isHovered ? '#60a5fa' : (base ?? '#6b7280')
      if (colorMode === 'recovery') {
        path.style.filter = isHovered
          ? 'url(#glow)'
          : recovering
            ? 'drop-shadow(0 0 6px rgba(245, 158, 11, 0.45))'
            : 'none'
        path.classList.toggle('muscle-recovering', recovering)
      } else {
        path.style.filter = 'none'
        path.classList.remove('muscle-recovering')
      }
    }
  }, [colorMap, glowIds, hoveredLibId, colorMode])

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
