
'use client';

import { useEffect, useState, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import { fetchAllPublicTestSubmissions } from '@/lib/actions/userActions';
import type { StoredTestResult } from '@/lib/types';
import { SubmissionsPageHeader } from '@/components/admin/submissions/SubmissionsPageHeader';
import { SubmissionsStatsChart } from '@/components/admin/submissions/SubmissionsStatsChart';
import { SubmissionsScoreDistributionChart } from '@/components/admin/submissions/SubmissionsScoreDistributionChart';
import { SubmissionsDataTable } from '@/components/admin/submissions/SubmissionsDataTable';
import { useToast } from '@/hooks/use-toast';

export default function AdminSubmissionsPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submissions, setSubmissions] = useState<StoredTestResult[]>([]);
  const { toast } = useToast();

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

  useEffect(() => {
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

  const barChartConfig = useMemo(() => {
    const config: Record<string, { label: string, color: string }> = {};
    submissionChartData.forEach((data, index) => {
      config[data.testTitle] = {
        label: data.testTitle,
        color: `hsl(var(--chart-${(index % 5) + 1}))`,
      };
    });
    return { count: { label: "Submissions", color: "hsl(var(--chart-1))" }, ...config };
  }, [submissionChartData]);

  const scoreDistributionData = useMemo(() => {
    if (!submissions || submissions.length === 0) return [];
    const brackets: Record<string, { name: string; value: number; fill: string }> = {
      '0-24%':   { name: '0-24%',   value: 0, fill: 'hsl(var(--chart-5))' }, // Destructive/Red-ish
      '25-49%':  { name: '25-49%',  value: 0, fill: 'hsl(var(--chart-4))' }, // Warning/Orange-ish
      '50-74%':  { name: '50-74%',  value: 0, fill: 'hsl(var(--chart-2))' }, // Okay/Yellow-Green-ish
      '75-100%': { name: '75-100%', value: 0, fill: 'hsl(var(--chart-1))' }, // Good/Green-ish
    };
    submissions.forEach(sub => {
      const percentage = sub.totalPoints > 0 ? (sub.score / sub.totalPoints) * 100 : 0;
      if (percentage <= 24) brackets['0-24%'].value++;
      else if (percentage <= 49) brackets['25-49%'].value++;
      else if (percentage <= 74) brackets['50-74%'].value++;
      else brackets['75-100%'].value++;
    });
    return Object.values(brackets).filter(b => b.value > 0); // Only return brackets with data
  }, [submissions]);


  const handleSubmissionDeleted = (deletedSubmission: StoredTestResult) => {
    setSubmissions(prevSubmissions => 
      prevSubmissions.filter(sub => 
        !(sub.userId === deletedSubmission.userId && 
          sub.testId === deletedSubmission.testId && 
          new Date(sub.submittedAt).getTime() === new Date(deletedSubmission.submittedAt).getTime()
        )
      )
    );
    toast({
      title: "Submission Deleted",
      description: `Submission by ${deletedSubmission.userId} for test "${deletedSubmission.testTitle}" has been removed.`,
    });
  };

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
          {submissions.length > 0 && (
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
          )}
          <SubmissionsDataTable
            submissions={submissions}
            isLoading={isLoading}
            error={error}
            onSubmissionDeleted={handleSubmissionDeleted}
          />
        </CardContent>
      </Card>
    </div>
  );
}
