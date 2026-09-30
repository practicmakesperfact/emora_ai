// ============================================================
// Emora AI — MoodChart Component
// Renders the Recharts line chart and summary stats
// ============================================================

import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { Heart } from 'lucide-react';
import { Card, CardHeader } from '@/components/common/Card';
import { Skeleton } from '@/components/common/Feedback';
import { getMoodEmoji, getMoodLabel } from '@/utils';
import type { MoodTrendsResponse } from '@/types';

interface MoodChartProps {
  trends?: MoodTrendsResponse;
  isLoading: boolean;
  period: 'weekly' | 'monthly';
}

export function MoodChart({ trends, isLoading, period }: MoodChartProps) {
  const chartData = trends?.daily_averages.map((d) => ({
    date: d.date.slice(5), // MM-DD
    score: parseFloat(d.average_score.toFixed(1)),
  }));

  return (
    <Card>
      <CardHeader
        title="Mood Trend"
        subtitle={`Average daily score over the past ${
          period === 'weekly' ? '7' : '30'
        } days`}
        icon={<Heart className="w-4 h-4" />}
      />
      {isLoading ? (
        <Skeleton className="h-48" />
      ) : !chartData || chartData.length === 0 ? (
        <div className="py-10 text-center text-sm text-slate-400">
          No mood records yet. Log your first mood to see trends.
        </div>
      ) : (
        <>
          {/* Summary stats */}
          {trends && (
            <div className="grid grid-cols-3 gap-4 mb-5">
              <div className="text-center p-3 rounded-xl bg-slate-50">
                <p className="text-2xl font-bold text-indigo-600">
                  {trends.summary.average_score.toFixed(1)}
                </p>
                <p className="text-xs text-slate-500 mt-0.5">Average</p>
              </div>
              <div className="text-center p-3 rounded-xl bg-slate-50">
                <p className="text-2xl font-bold text-slate-700">
                  {trends.summary.total_logs}
                </p>
                <p className="text-xs text-slate-500 mt-0.5">Total logs</p>
              </div>
              <div className="text-center p-3 rounded-xl bg-slate-50">
                <p className="text-2xl">
                  {getMoodEmoji(Math.round(trends.summary.average_score))}
                </p>
                <p className="text-xs text-slate-500 mt-0.5">Overall</p>
              </div>
            </div>
          )}

          <div aria-label="Mood trend chart" role="img">
            <ResponsiveContainer width="100%" height={180}>
              <LineChart
                data={chartData}
                margin={{ top: 5, right: 5, left: -20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 11, fill: '#94a3b8' }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  domain={[1, 10]}
                  tick={{ fontSize: 11, fill: '#94a3b8' }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: '12px',
                    border: '1px solid #e2e8f0',
                    fontSize: '12px',
                  }}
                  formatter={(value: unknown) => [
                    `${value} — ${getMoodLabel(Math.round(Number(value)))}`,
                    'Score',
                  ]}
                />
                <Line
                  type="monotone"
                  dataKey="score"
                  stroke="#6366f1"
                  strokeWidth={2}
                  dot={{ r: 4, fill: '#6366f1', strokeWidth: 0 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </>
      )}
    </Card>
  );
}
