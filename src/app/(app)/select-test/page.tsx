
'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { getAllTests } from '@/lib/actions/test/getTests';
import type { Test } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Loader2, AlertTriangle, ListChecks } from 'lucide-react';
import { TestSelectionItem } from '@/components/test/TestSelectionItem';

export default function SelectTestPage() {
  const {
    data: tests,
    isLoading,
    isError,
    error: queryError,
    refetch
  } = useQuery<Test[], Error>({
    queryKey: ['tests'],
    queryFn: getAllTests,
    // staleTime: 5 * 60 * 1000, // e.g., 5 minutes
    // refetchOnWindowFocus: false,
  });

  let displayMessage: string | null = null;
  if (isError && queryError) {
    displayMessage = queryError.message || 'Failed to load tests. Please try again.';
  } else if (!isLoading && tests && tests.length === 0) {
    displayMessage = 'No tests are currently available. Please check back later.';
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="text-center mb-12">
        <ListChecks className="mx-auto h-16 w-16 text-primary mb-4" />
        <h1 className="text-4xl font-bold tracking-tight text-primary">Select a Test</h1>
        <p className="mt-4 text-lg text-muted-foreground">
          Choose from the available tests below to start your assessment.
        </p>
      </div>

      {isLoading && (
        <div className="flex flex-col items-center justify-center min-h-[300px]">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <p className="mt-4 text-muted-foreground">Loading available tests...</p>
        </div>
      )}

      {displayMessage && !isLoading && (
        <div className="flex flex-col items-center justify-center min-h-[300px]">
          <AlertTriangle className="h-12 w-12 text-destructive" />
          <p className="mt-4 text-xl text-destructive">
            {isError ? 'Error Loading Tests' : 'Information'}
          </p>
          <p className="text-muted-foreground text-center">{displayMessage}</p>
          {isError && (
            <Button onClick={() => refetch()} className="mt-6">
              Try Again
            </Button>
          )}
        </div>
      )}

      {!isLoading && !displayMessage && tests && tests.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {tests.map((test) => (
            <TestSelectionItem key={test.id} test={test} />
          ))}
        </div>
      )}
    </div>
  );
}
