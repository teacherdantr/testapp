
'use client';

import { CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ClipboardListIcon } from 'lucide-react';

export function SubmissionsPageHeader() {
  return (
    <CardHeader className="text-center border-b pb-6">
      <ClipboardListIcon className="mx-auto h-14 w-14 text-primary mb-4" />
      <CardTitle className="text-4xl font-bold text-primary">Test Submissions</CardTitle>
      <CardDescription className="text-lg text-muted-foreground pt-2">
        Overview of all test submissions on the platform.
      </CardDescription>
    </CardHeader>
  );
}
