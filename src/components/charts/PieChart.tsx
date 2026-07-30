import { PieChart as RechartsPieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'

interface PieChartProps {
  data: { label: string; value: number }[]
  height?: number
}

const COLORS = ['#3b82f6', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899']

export function PieChart({ data, height = 200 }: PieChartProps) {
  if (!data.length) return <div className="text-sm text-muted-foreground text-center py-8">No data yet</div>
  return (
    <ResponsiveContainer width="100%" height={height}>
      <RechartsPieChart>
        <Pie data={data} dataKey="value" nameKey="label" cx="50%" cy="50%" outerRadius={70} innerRadius={40}>
          {data.map((_, i) => (
            <Cell key={i} fill={COLORS[i % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip
          contentStyle={{ background: 'var(--chart-tooltip-bg, #1a1a1a)', border: '1px solid var(--chart-tooltip-border, #2a2a2a)', borderRadius: 8, fontSize: 12 }}
          labelStyle={{ color: 'var(--chart-tooltip-label, #a3a3a3)' }}
        />
      </RechartsPieChart>
    </ResponsiveContainer>
  )
}
