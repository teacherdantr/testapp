
'use client';

import { useEffect, useState, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, AlertTriangle } from 'lucide-react';
import { fetchAllPublicTestSubmissions } from '@/lib/actions/userActions';
import type { StoredTestResult } from '@/lib/types';
import { SubmissionsPageHeader } from '@/components/admin/submissions/SubmissionsPageHeader';
import { SubmissionsStatsChart } from '@/components/admin/submissions/SubmissionsStatsChart';
import { SubmissionsDataTable } from '@/components/admin/submissions/SubmissionsDataTable';

export default function AdminSubmissionsPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submissions, setSubmissions] = useState<StoredTestResult[]>([]);

  useEffect(() => {
    const loadSubmissions = async () => {
      setIsLoading(true);
      setError(null);
      const result = await fetchAllPublicTestSubmissions();
      if ('error' in result) {
        setError(result.error);
        setSubmissions([]);
      } else {
        setSubmissions(result);
        if (result.length === 0) {
           setError('No test submissions found yet.');
        }
      }
      setIsLoading(false);
    };
    loadSubmissions();
  }, []);

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

  const chartConfig = useMemo(() => {
    const config: Record<string, { label: string, color: string }> = {};
    submissionChartData.forEach((data, index) => {
      config[data.testTitle] = {
        label: data.testTitle,
        color: `hsl(var(--chart-${(index % 5) + 1}))`,
      };
    });
    return { count: { label: "Submissions", color: "hsl(var(--chart-1))" }, ...config };
  }, [submissionChartData]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground">Loading Submissions...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <Card className="shadow-xl">
        <SubmissionsPageHeader />
        <CardContent className="pt-8 space-y-8">
          {submissions.length > 0 && submissionChartData.length > 0 && (
            <SubmissionsStatsChart
              submissionChartData={submissionChartData}
              chartConfig={chartConfig}
            />
          )}
          <SubmissionsDataTable
            submissions={submissions}
            isLoading={isLoading} // isLoading will be false here, but passed for consistency if table had its own loading
            error={error} // Pass error for table to display specific messages if needed
          />
        </CardContent>
      </Card>
    </div>
  );
}
