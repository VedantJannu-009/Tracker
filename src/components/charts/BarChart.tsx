import { BarChart as RechartsBarChart, Bar, ResponsiveContainer, XAxis, YAxis, Tooltip } from 'recharts'

interface BarChartProps {
  data: { label: string; value: number }[]
  color?: string
  height?: number
}

export function BarChart({ data, color = '#3b82f6', height = 200 }: BarChartProps) {
  if (!data.length) return <div className="text-sm text-muted-foreground text-center py-8">No data yet</div>
  return (
    <ResponsiveContainer width="100%" height={height}>
      <RechartsBarChart data={data}>
        <XAxis dataKey="label" tick={{ fontSize: 11, fill: 'var(--chart-axis-tick, #a3a3a3)' }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fontSize: 11, fill: 'var(--chart-axis-tick, #a3a3a3)' }} axisLine={false} tickLine={false} width={35} />
        <Tooltip
          contentStyle={{ background: 'var(--chart-tooltip-bg, #1a1a1a)', border: '1px solid var(--chart-tooltip-border, #2a2a2a)', borderRadius: 8, fontSize: 12 }}
          labelStyle={{ color: 'var(--chart-tooltip-label, #a3a3a3)' }}
        />
        <Bar dataKey="value" fill={color} radius={[4, 4, 0, 0]} />
      </RechartsBarChart>
    </ResponsiveContainer>
  )
}
