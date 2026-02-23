'use client'

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'
import { useChartColors } from '@/hooks/use-chart-colors'

interface WorksheetStat {
  title: string
  views: number
  assignments: number
  exports: number
}

interface PopularWorksheetsChartProps {
  data: WorksheetStat[]
}

const truncate = (s: string, n: number) =>
  s.length > n ? s.slice(0, n) + '...' : s

export function PopularWorksheetsChart({ data }: PopularWorksheetsChartProps) {
  const chartData = data.map((d) => ({
    ...d,
    title: truncate(d.title, 28),
  }))

  const cc = useChartColors()

  return (
    <div className="rounded-2xl border border-primary-100 bg-surface p-6 shadow-sm">
      <h3 className="mb-4 text-xs font-semibold uppercase tracking-wider text-primary-400">
        Most Popular Worksheets
      </h3>
      {chartData.length > 0 ? (
        <ResponsiveContainer width="100%" height={Math.max(300, chartData.length * 40 + 60)}>
          <BarChart
            data={chartData}
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
              dataKey="title"
              width={180}
              tick={{ fontSize: 11, fill: cc.label }}
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
            />
            <Legend
              wrapperStyle={{ fontSize: '12px', paddingTop: '8px' }}
            />
            <Bar dataKey="views" stackId="a" fill="#e4a930" name="Views" radius={[0, 0, 0, 0]} />
            <Bar dataKey="assignments" stackId="a" fill="#3b82f6" name="Assignments" radius={[0, 0, 0, 0]} />
            <Bar dataKey="exports" stackId="a" fill="#8b5cf6" name="Exports" radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      ) : (
        <div className="flex h-[300px] items-center justify-center text-sm text-primary-400">
          No worksheet activity data yet
        </div>
      )}
    </div>
  )
}
