import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Bar, BarChart as RechartsBarChart, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { PageContainer } from '@/components/layout/PageContainer'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowLeft, BarChart3, Dumbbell, Clock, Layers, Flame, TrendingUp, Trophy, Activity, ChevronRight } from 'lucide-react'
import { useStatistics } from '@/hooks/useStatistics'
import { useWeeklyInsights } from '@/hooks/useWeeklyInsights'
import { useUnit } from '@/hooks/useUnit'
import { kgToUnit } from '@/lib/units'
import { formatDate } from '@/lib/utils'
import { StatCard } from '@/components/statistics/StatCard'
import { WeeklyInsights } from '@/components/statistics/WeeklyInsights'
import { EmptyState } from '@/components/ui/empty-state'
import { PageLoading } from '@/components/ui/page-loading'

const BAR_COLOR = '#3b82f6'

function SectionFade({ index, children }: { index: number; children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.15 + index * 0.08, ease: 'easeOut' }}
    >
      {children}
    </motion.div>
  )
}

export function StatisticsPage() {
  const navigate = useNavigate()
  const unit = useUnit()
  const stats = useStatistics()
  const { insights } = useWeeklyInsights()

  const hasWorkouts = stats.workoutCount > 0
  const hasWeeklyData = stats.workoutsPerWeek.some(d => d.value > 0)
  const hasRecords = stats.personalRecords.length > 0

  const volumeFormat = useMemo(() => (n: number) => Math.round(kgToUnit(n, unit)).toLocaleString(), [unit])

  const hoursFormat = useMemo(() => (n: number) => n.toFixed(1), [])

  const prsByType = useMemo(() => {
    const byType = {
      weight: stats.personalRecords.filter(p => p.type === 'weight'),
      reps: stats.personalRecords.filter(p => p.type === 'reps'),
      volume: stats.personalRecords.filter(p => p.type === 'volume'),
    }
    return (['weight', 'reps', 'volume'] as const)
      .map(type => ({
        type,
        items: byType[type],
        icon: type === 'weight' ? <TrendingUp size={16} /> : type === 'reps' ? <Activity size={16} /> : <Dumbbell size={16} />,
        label: type === 'weight' ? 'Best Weight' : type === 'reps' ? 'Most Reps' : 'Highest Volume',
      }))
      .filter(section => section.items.length > 0)
  }, [stats.personalRecords])

  if (stats.loading) {
    return (
      <PageContainer>
        <div className="flex items-center gap-3 mb-6">
          <Button variant="ghost" size="icon" onClick={() => navigate('/')} aria-label="Back to home">
            <ArrowLeft size={20} />
          </Button>
        </div>
        <PageLoading />
      </PageContainer>
    )
  }

  return (
    <PageContainer>
      <div className="flex items-center gap-3 mb-6">
        <Button variant="ghost" size="icon" onClick={() => navigate('/')} className="shrink-0" aria-label="Back to home">
          <ArrowLeft size={20} />
        </Button>
        <BarChart3 size={24} className="text-primary shrink-0" />
        <div className="min-w-0">
          <h1 className="text-xl sm:text-2xl font-bold truncate">Statistics</h1>
          <p className="text-xs sm:text-sm text-muted-foreground">Your training overview</p>
        </div>
      </div>

      {!hasWorkouts && !hasRecords && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mb-5"
        >
          <Card className="border-primary/20">
            <CardContent>
              <EmptyState
                icon={BarChart3}
                tone="primary"
                title="No data yet"
                description="Statistics appear automatically as you train"
                action={
                  <Button size="sm" onClick={() => navigate('/workout')}>
                    Start Workout
                  </Button>
                }
              />
            </CardContent>
          </Card>
        </motion.div>
      )}

      {insights.length > 0 && (
        <div className="mt-6">
          <SectionFade index={0}>
            <WeeklyInsights insights={insights} />
          </SectionFade>
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <StatCard
          icon={Dumbbell}
          label="Lifetime Workouts"
          value={stats.workoutCount}
          suffix={stats.workoutCount === 1 ? 'workout' : 'workouts'}
          index={0}
        />
        <StatCard
          icon={Clock}
          label="Training Hours"
          value={stats.trainingMinutes / 60}
          format={hoursFormat}
          suffix="hours"
          index={1}
        />
        <StatCard
          icon={Layers}
          label="Total Sets"
          value={stats.totalSets}
          suffix={stats.totalSets === 1 ? 'set' : 'sets'}
          index={2}
        />
        <StatCard
          icon={TrendingUp}
          label="Total Weight Lifted"
          value={stats.totalVolumeKg}
          format={volumeFormat}
          suffix={unit}
          index={3}
        />
        <StatCard
          icon={Flame}
          label="Longest Streak"
          value={stats.longestStreak}
          suffix={stats.longestStreak === 1 ? 'day' : 'days'}
          index={4}
        />
      </div>

      {stats.currentStreak > 0 && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.5 }}
          className="text-xs text-muted-foreground mt-2 text-center"
        >
          Current streak: {stats.currentStreak} day{stats.currentStreak === 1 ? '' : 's'}
        </motion.p>
      )}

      <div className="mt-6">
        <SectionFade index={1}>
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <BarChart3 size={14} className="text-primary" />
                Workout Frequency
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!hasWeeklyData ? (
                <div className="text-sm text-muted-foreground text-center py-8">
                  {hasWorkouts
                    ? 'No workouts in the last 12 weeks'
                    : 'Workouts per week will appear here'}
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={200}>
                  <RechartsBarChart data={stats.workoutsPerWeek} margin={{ top: 4, right: 0, left: -28, bottom: 0 }}>
                    <XAxis dataKey="label" tick={{ fontSize: 10, fill: 'var(--chart-axis-tick, #a3a3a3)' }} axisLine={false} tickLine={false} interval={1} />
                    <YAxis tick={{ fontSize: 10, fill: 'var(--chart-axis-tick, #a3a3a3)' }} axisLine={false} tickLine={false} allowDecimals={false} />
                    <Tooltip
                      cursor={{ fill: 'var(--chart-hover-bg, rgba(128,128,128,0.08))' }}
                      contentStyle={{ background: 'var(--chart-tooltip-bg, #1a1a1a)', border: '1px solid var(--chart-tooltip-border, #2a2a2a)', borderRadius: 8, fontSize: 12 }}
                      labelStyle={{ color: 'var(--chart-tooltip-label, #a3a3a3)' }}
                    />
                    <Bar dataKey="value" radius={[4, 4, 0, 0]} maxBarSize={22}>
                      {stats.workoutsPerWeek.map((entry, i) => (
                        <Cell key={i} fill={entry.value > 0 ? BAR_COLOR : 'var(--chart-empty-bar, #3f3f46)'} />
                      ))}
                    </Bar>
                  </RechartsBarChart>
                </ResponsiveContainer>
              )}
              <p className="text-[10px] text-muted-foreground mt-2 text-center">Last 12 weeks</p>
            </CardContent>
          </Card>
        </SectionFade>
      </div>

      <div className="mt-6">
        <SectionFade index={2}>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
              <Trophy size={14} className="text-yellow-500" />
              Personal Records
            </h2>
            {hasRecords && (
              <Button variant="ghost" size="sm" className="text-xs h-8 px-2" onClick={() => navigate('/records')}>
                View all <ChevronRight size={14} className="ml-0.5" />
              </Button>
            )}
          </div>

          {!hasRecords ? (
            <Card>
              <CardContent>
                <EmptyState
                  icon={Trophy}
                  title="No records yet"
                  description="Personal records appear automatically as you progress"
                />
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {prsByType.map(section => (
                <div key={section.type}>
                  <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    {section.icon}
                    {section.label}
                  </h3>
                  <Card>
                    <CardContent className="p-2 sm:p-3 divide-y divide-border/40">
                      {section.items.map(pr => (
                        <div key={pr.id} className="flex items-center justify-between px-2 sm:px-3 py-2.5">
                          <div className="min-w-0">
                            <div className="text-sm font-medium truncate">
                              {stats.exerciseNameById.get(pr.exerciseId) ?? pr.exerciseId}
                            </div>
                            <div className="text-[11px] text-muted-foreground">{formatDate(pr.achievedAt)}</div>
                          </div>
                          <div className="text-right shrink-0 ml-2">
                            <div className="text-base font-bold text-success">
                              {pr.type === 'reps'
                                ? pr.value
                                : `${Math.round(kgToUnit(pr.value, unit)).toLocaleString()} ${unit}`}
                            </div>
                          </div>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                </div>
              ))}
            </div>
          )}
        </SectionFade>
      </div>
    </PageContainer>
  )
}
