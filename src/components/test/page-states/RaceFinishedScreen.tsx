
'use client';

import { Button } from '@/components/ui/button';
import { Goal, Send, RotateCcw } from 'lucide-react';
import Link from 'next/link';

interface RaceFinishedScreenProps {
  userId: string | null;
  onViewResults: () => void;
  onRetry: () => void;
}

export function RaceFinishedScreen({ userId, onViewResults, onRetry }: RaceFinishedScreenProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)] text-center p-4">
      <Goal className="h-24 w-24 text-green-500 mb-6" />
      <h1 className="text-4xl font-bold text-primary mb-4">Congratulations, {userId || 'Racer'}!</h1>
      <p className="text-xl text-foreground mb-8">You've successfully completed all questions in the race!</p>
      <div className="space-y-3 sm:space-y-0 sm:flex sm:gap-3">
        <Button onClick={onViewResults} size="lg">
          <Send className="mr-2 h-5 w-5" /> View Detailed Results
        </Button>
        <Button onClick={onRetry} size="lg" variant="outline">
          <RotateCcw className="mr-2 h-5 w-5" />
          Play Again
        </Button>
        <Button asChild size="lg" variant="secondary">
          <Link href="/">Back to Homepage</Link>
        </Button>
      </div>
      <p className="mt-8 text-sm text-muted-foreground">
        In a full multiplayer version, this is where you'd see overall race standings.
      </p>
    </div>
  );
}
