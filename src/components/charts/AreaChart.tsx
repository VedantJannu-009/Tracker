import { Area, AreaChart as RechartsAreaChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from 'recharts'

interface ChartProps {
  data: { label: string; value: number }[]
  color?: string
  height?: number
}

export function AreaChart({ data, color = '#3b82f6', height = 200 }: ChartProps) {
  if (!data.length) return <div className="text-sm text-muted-foreground text-center py-8">No data yet</div>
  return (
    <ResponsiveContainer width="100%" height={height}>
      <RechartsAreaChart data={data}>
        <defs>
          <linearGradient id={`grad-${color.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.3} />
            <stop offset="100%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <XAxis dataKey="label" tick={{ fontSize: 11, fill: 'var(--chart-axis-tick, #a3a3a3)' }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fontSize: 11, fill: 'var(--chart-axis-tick, #a3a3a3)' }} axisLine={false} tickLine={false} width={35} />
        <Tooltip
          contentStyle={{ background: 'var(--chart-tooltip-bg, #1a1a1a)', border: '1px solid var(--chart-tooltip-border, #2a2a2a)', borderRadius: 8, fontSize: 12 }}
          labelStyle={{ color: 'var(--chart-tooltip-label, #a3a3a3)' }}
        />
        <Area type="monotone" dataKey="value" stroke={color} strokeWidth={2} fill={`url(#grad-${color.replace('#', '')})`} />
      </RechartsAreaChart>
    </ResponsiveContainer>
  )
}
