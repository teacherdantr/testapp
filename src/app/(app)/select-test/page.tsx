
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getAllTests } from '@/lib/actions/testActions';
import type { Test } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, AlertTriangle, ListChecks, KeyRound, BookOpen } from 'lucide-react';
import { TestSelectionItem } from '@/components/test/TestSelectionItem';

export default function SelectTestPage() {
  const [tests, setTests] = useState<Test[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadTests = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const fetchedTests = await getAllTests();
        setTests(fetchedTests);
        if (fetchedTests.length === 0) {
          setError('No tests are currently available. Please check back later.');
        }
      } catch (err) {
        console.error('Failed to fetch tests:', err);
        setError('Failed to load tests. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };
    loadTests();
  }, []);

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

      {error && !isLoading && (
        <div className="flex flex-col items-center justify-center min-h-[300px]">
          <AlertTriangle className="h-12 w-12 text-destructive" />
          <p className="mt-4 text-xl text-destructive">Error Loading Tests</p>
          <p className="text-muted-foreground text-center">{error}</p>
          <Button onClick={() => window.location.reload()} className="mt-6">
            Try Again
          </Button>
        </div>
      )}

      {!isLoading && !error && tests.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {tests.map((test) => (
            <TestSelectionItem key={test.id} test={test} />
          ))}
        </div>
      )}
    </div>
  );
}
