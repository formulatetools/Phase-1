'use client'

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'

interface RevenueChartProps {
  data: { month: string; mrr: number }[]
}

const formatMonth = (m: unknown) => {
  const d = new Date(String(m) + '-01')
  return d.toLocaleDateString('en-GB', { month: 'short', year: '2-digit' })
}

const formatCurrency = (v: unknown) => `£${Number(v).toFixed(0)}`

export function RevenueChart({ data }: RevenueChartProps) {
  return (
    <div className="rounded-2xl border border-primary-100 bg-white p-6 shadow-sm">
      <h3 className="mb-4 text-xs font-semibold uppercase tracking-wider text-primary-400">
        Monthly Recurring Revenue
      </h3>
      {data.length > 0 ? (
        <ResponsiveContainer width="100%" height={280}>
          <AreaChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: -10 }}>
            <defs>
              <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#22c55e" stopOpacity={0.15} />
                <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f0ee" vertical={false} />
            <XAxis
              dataKey="month"
              tickFormatter={formatMonth}
              tick={{ fontSize: 11, fill: '#888' }}
              axisLine={false}
              tickLine={false}
              interval="preserveStartEnd"
            />
            <YAxis
              tickFormatter={formatCurrency}
              tick={{ fontSize: 11, fill: '#888' }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              labelFormatter={formatMonth}
              formatter={(value: unknown) => [`£${Number(value).toFixed(2)}`, 'MRR']}
              contentStyle={{
                borderRadius: '12px',
                border: '1px solid #f1f0ee',
                fontSize: '13px',
                boxShadow: '0 4px 12px rgba(0,0,0,.06)',
              }}
            />
            <Area
              type="monotone"
              dataKey="mrr"
              stroke="#22c55e"
              strokeWidth={2}
              fill="url(#revenueGrad)"
            />
          </AreaChart>
        </ResponsiveContainer>
      ) : (
        <div className="flex h-[280px] items-center justify-center text-sm text-primary-400">
          No revenue data yet
        </div>
      )}
    </div>
  )
}
