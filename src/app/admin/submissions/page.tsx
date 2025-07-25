
'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, AlertTriangle } from 'lucide-react';
import { fetchAllPublicTestSubmissions } from '@/lib/actions/userActions';
import type { StoredTestResult } from '@/lib/types';
import { SubmissionsPageHeader } from '@/components/admin/submissions/SubmissionsPageHeader';
import { SubmissionsStatsCards } from '@/components/admin/submissions/SubmissionsStatsCards';
import { SubmissionChartsSection } from '@/components/admin/submissions/SubmissionChartsSection';
import { SubmissionsDataTable } from '@/components/admin/submissions/SubmissionsDataTable';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';


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
         // This is not an error, just an empty state. The DataTable will handle the message.
         setError(null);
      }
    }
    setIsLoading(false);
  };

  useEffect(() => {
    loadSubmissions();
  }, []);

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
    console.log("[AdminSubmissionsPage] Submission deleted, updated local state:", deletedSubmission);
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
          {error && (
            <Alert variant="destructive">
              <AlertTriangle className="h-5 w-5" />
              <AlertTitle>Error Loading Submissions</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {!error && (
            <>
              <SubmissionsStatsCards submissions={submissions} />
              <SubmissionChartsSection submissions={submissions} />
              <SubmissionsDataTable
                submissions={submissions}
                onSubmissionDeleted={handleSubmissionDeleted}
              />
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
