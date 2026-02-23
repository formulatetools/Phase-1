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

interface SignupChartProps {
  data: { week: string; count: number }[]
}

const formatWeek = (w: unknown) => {
  const d = new Date(String(w))
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}

export function SignupChart({ data }: SignupChartProps) {
  return (
    <div className="rounded-2xl border border-primary-100 bg-white p-6 shadow-sm">
      <h3 className="mb-4 text-xs font-semibold uppercase tracking-wider text-primary-400">
        Signups Over Time
      </h3>
      {data.length > 0 ? (
        <ResponsiveContainer width="100%" height={280}>
          <AreaChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
            <defs>
              <linearGradient id="signupGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#e4a930" stopOpacity={0.15} />
                <stop offset="95%" stopColor="#e4a930" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f0ee" vertical={false} />
            <XAxis
              dataKey="week"
              tickFormatter={formatWeek}
              tick={{ fontSize: 11, fill: '#888' }}
              axisLine={false}
              tickLine={false}
              interval="preserveStartEnd"
            />
            <YAxis
              allowDecimals={false}
              tick={{ fontSize: 11, fill: '#888' }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              labelFormatter={formatWeek}
              contentStyle={{
                borderRadius: '12px',
                border: '1px solid #f1f0ee',
                fontSize: '13px',
                boxShadow: '0 4px 12px rgba(0,0,0,.06)',
              }}
              formatter={(value: unknown) => [String(value), 'Signups']}
            />
            <Area
              type="monotone"
              dataKey="count"
              stroke="#e4a930"
              strokeWidth={2}
              fill="url(#signupGrad)"
            />
          </AreaChart>
        </ResponsiveContainer>
      ) : (
        <div className="flex h-[280px] items-center justify-center text-sm text-primary-400">
          No signup data yet
        </div>
      )}
    </div>
  )
}
