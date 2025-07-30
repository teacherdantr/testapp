
'use client';

import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getAllTests } from '@/lib/actions/test/getTests';
import type { Test } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Loader2, AlertTriangle, ListChecks, Search } from 'lucide-react';
import { TestSelectionItem } from '@/components/test/TestSelectionItem';

export default function SelectTestPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const {
    data: tests,
    isLoading,
    isError,
    error: queryError,
    refetch
  } = useQuery<Test[], Error>({
    queryKey: ['tests'],
    queryFn: getAllTests,
  });

  const filteredTests = useMemo(() => {
    if (!tests) return [];
    if (!searchTerm.trim()) return tests;

    const lowercasedSearchTerm = searchTerm.toLowerCase();
    return tests.filter(test =>
      test.title.toLowerCase().includes(lowercasedSearchTerm) ||
      (test.description && test.description.toLowerCase().includes(lowercasedSearchTerm))
    );
  }, [tests, searchTerm]);

  let displayMessage: string | null = null;
  if (isError && queryError) {
    displayMessage = queryError.message || 'Failed to load tests. Please try again.';
  } else if (!isLoading && tests && tests.length === 0) {
    displayMessage = 'No tests are currently available. Please check back later.';
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="text-center mb-8">
        <ListChecks className="mx-auto h-16 w-16 text-primary mb-4" />
        <h1 className="text-4xl font-bold tracking-tight text-primary">Select a Test</h1>
        <p className="mt-4 text-lg text-muted-foreground">
          Choose from the available tests below to start your assessment.
        </p>
      </div>
      
      <div className="mb-10 max-w-lg mx-auto">
        <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search by test title or description..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 h-12 text-base"
              disabled={isLoading || isError}
            />
        </div>
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

      {!isLoading && !displayMessage && filteredTests.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredTests.map((test) => (
            <TestSelectionItem key={test.id} test={test} />
          ))}
        </div>
      )}
      
      {!isLoading && !isError && tests && tests.length > 0 && filteredTests.length === 0 && (
         <div className="flex flex-col items-center justify-center min-h-[300px]">
           <Alert variant="default" className="max-w-md text-center">
             <Search className="h-5 w-5" />
             <AlertTitle>No Matching Tests Found</AlertTitle>
             <AlertDescription>
                Your search for "{searchTerm}" did not return any results.
             </AlertDescription>
           </Alert>
        </div>
      )}
    </div>
  );
}
