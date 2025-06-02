
'use client';

import Link from 'next/link';
import type { Test } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { KeyRound, BookOpen, ArrowRight } from 'lucide-react';

interface TestSelectionItemProps {
  test: Test;
}

export function TestSelectionItem({ test }: TestSelectionItemProps) {
  return (
    <Card className="shadow-lg hover:shadow-xl transition-all duration-300 flex flex-col h-full group hover:border-primary/50">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start mb-1">
          <CardTitle className="text-xl font-semibold flex items-center text-primary group-hover:text-primary/90">
            <BookOpen className="mr-2 h-5 w-5 shrink-0" />
            {test.title}
          </CardTitle>
          {test.password && (
            <KeyRound className="h-5 w-5 text-amber-500 shrink-0" title="Password Protected" />
          )}
        </div>
      </CardHeader>
      <CardContent className="flex-grow pt-2 pb-4">
        {test.description ? (
          <p className="text-sm text-muted-foreground line-clamp-3">{test.description}</p>
        ) : (
          <p className="text-sm text-muted-foreground italic">No description provided.</p>
        )}
         <p className="text-xs text-muted-foreground mt-2">
            {test.questions.length} question{test.questions.length !== 1 ? 's' : ''}
          </p>
      </CardContent>
      <CardFooter className="pt-3 mt-auto border-t">
        <Button asChild className="w-full group-hover:bg-primary/90" variant="default">
          <Link href={`/test/${test.id}`}>
            Start Test <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
