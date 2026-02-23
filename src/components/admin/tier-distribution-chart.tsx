'use client'

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts'
import { useChartColors } from '@/hooks/use-chart-colors'

interface TierDistributionChartProps {
  data: { tier: string; count: number }[]
}

const TIER_COLORS: Record<string, string> = {
  Free: '#94a3b8',
  Starter: '#e4a930',
  Practice: '#3b82f6',
  Specialist: '#8b5cf6',
}

export function TierDistributionChart({ data }: TierDistributionChartProps) {
  const cc = useChartColors()
  return (
    <div className="rounded-2xl border border-primary-100 bg-surface p-6 shadow-sm">
      <h3 className="mb-4 text-xs font-semibold uppercase tracking-wider text-primary-400">
        Tier Distribution
      </h3>
      {data.length > 0 ? (
        <ResponsiveContainer width="100%" height={220}>
          <BarChart
            data={data}
            layout="vertical"
            margin={{ top: 4, right: 20, bottom: 4, left: 10 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke={cc.grid} horizontal={false} />
            <XAxis
              type="number"
              allowDecimals={false}
              tick={{ fontSize: 11, fill: cc.tick }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              type="category"
              dataKey="tier"
              width={80}
              tick={{ fontSize: 12, fill: cc.label }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              contentStyle={{
                borderRadius: '12px',
                border: `1px solid ${cc.tooltipBorder}`,
                background: cc.tooltipBg,
                fontSize: '13px',
                boxShadow: '0 4px 12px rgba(0,0,0,.06)',
              }}
              formatter={(value: unknown) => [String(value), 'Users']}
            />
            <Bar dataKey="count" radius={[0, 6, 6, 0]} barSize={28}>
              {data.map((entry) => (
                <Cell
                  key={entry.tier}
                  fill={TIER_COLORS[entry.tier] || '#94a3b8'}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      ) : (
        <div className="flex h-[220px] items-center justify-center text-sm text-primary-400">
          No user data yet
        </div>
      )}
    </div>
  )
}
