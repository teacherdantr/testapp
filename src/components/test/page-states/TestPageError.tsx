
'use client';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface TestPageErrorProps {
  errorMessage: string | null;
  showHomeButton?: boolean;
}

export function TestPageError({ errorMessage, showHomeButton = true }: TestPageErrorProps) {
  const router = useRouter();
  
  return (
    <Alert variant="destructive" className="max-w-lg mx-auto">
      <AlertTriangle className="h-5 w-5" />
      <AlertTitle>Error</AlertTitle>
      <AlertDescription>{errorMessage || 'An unknown error occurred.'}</AlertDescription>
      {showHomeButton && (
        <Button onClick={() => router.push('/')} className="mt-4">Go to Homepage</Button>
      )}
    </Alert>
  );
}
