
'use client';

import { useMemo } from 'react';
import type { StoredTestResult } from '@/lib/types';
import { SubmissionsStatsChart } from './SubmissionsStatsChart';
import { SubmissionsScoreDistributionChart } from './SubmissionsScoreDistributionChart';

interface SubmissionChartsSectionProps {
  submissions: StoredTestResult[];
}

export function SubmissionChartsSection({ submissions }: SubmissionChartsSectionProps) {
  const submissionChartData = useMemo(() => {
    if (!submissions || submissions.length === 0) return [];
    const countsByTestTitle: Record<string, number> = {};
    submissions.forEach(sub => {
      countsByTestTitle[sub.testTitle] = (countsByTestTitle[sub.testTitle] || 0) + 1;
    });
    return Object.entries(countsByTestTitle).map(([title, count]) => ({
      testTitle: title,
      count,
    })).sort((a, b) => b.count - a.count);
  }, [submissions]);

  const barChartConfig = useMemo(() => {
    const config: Record<string, { label: string, color: string }> = {};
    submissionChartData.forEach((data, index) => {
      config[data.testTitle] = {
        label: data.testTitle,
        color: `hsl(var(--chart-${(index % 5) + 1}))`,
      };
    });
    // Ensure 'count' key is defined for the BarChart's dataKey
    return { count: { label: "Submissions", color: "hsl(var(--chart-1))" }, ...config };
  }, [submissionChartData]);

  const scoreDistributionData = useMemo(() => {
    if (!submissions || submissions.length === 0) return [];
    const brackets: Record<string, { name: string; value: number; fill: string }> = {
      '0-24%':   { name: '0-24%',   value: 0, fill: 'hsl(var(--chart-5))' },
      '25-49%':  { name: '25-49%',  value: 0, fill: 'hsl(var(--chart-4))' },
      '50-74%':  { name: '50-74%',  value: 0, fill: 'hsl(var(--chart-2))' },
      '75-100%': { name: '75-100%', value: 0, fill: 'hsl(var(--chart-1))' },
    };
    submissions.forEach(sub => {
      const percentage = sub.totalPoints > 0 ? (sub.score / sub.totalPoints) * 100 : 0;
      if (percentage <= 24) brackets['0-24%'].value++;
      else if (percentage <= 49) brackets['25-49%'].value++;
      else if (percentage <= 74) brackets['50-74%'].value++;
      else brackets['75-100%'].value++;
    });
    return Object.values(brackets).filter(b => b.value > 0);
  }, [submissions]);

  if (submissions.length === 0) {
    return null; // Don't render the charts section if there are no submissions
  }

  return (
    <div className="grid md:grid-cols-2 gap-6">
      {submissionChartData.length > 0 && (
        <SubmissionsStatsChart
          submissionChartData={submissionChartData}
          chartConfig={barChartConfig}
        />
      )}
      {scoreDistributionData.length > 0 && (
        <SubmissionsScoreDistributionChart
          scoreData={scoreDistributionData}
        />
      )}
    </div>
  );
}
