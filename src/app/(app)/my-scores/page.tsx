
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, History, AlertTriangle, ListChecks, Zap, Users } from 'lucide-react';
import { fetchUserScoreHistory } from '@/lib/actions/userActions';
import type { StoredTestResult } from '@/lib/types';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

export default function MyScoresPage() {
  const [userId, setUserId] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [scores, setScores] = useState<StoredTestResult[]>([]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId.trim()) {
      setError('Please enter your identifier.');
      setScores([]);
      return;
    }
    setIsLoading(true);
    setError(null);
    setScores([]);

    const result = await fetchUserScoreHistory(userId.trim());

    if ('error' in result) {
      setError(result.error);
    } else {
      setScores(result);
      if (result.length === 0) {
        setError('No scores found for this identifier. Make sure you entered it correctly, or perhaps take a test first!');
      }
    }
    setIsLoading(false);
  };

  const getModeDisplay = (mode?: 'training' | 'testing') => {
    if (!mode) return null;
    const Icon = mode === 'training' ? Users : Zap;
    const text = mode.charAt(0).toUpperCase() + mode.slice(1);
    return (
      <span className={cn(
        "inline-flex items-center text-xs font-medium px-1.5 py-0.5 rounded-full ml-1.5 align-middle",
        mode === 'training' ? "bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300" : "bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300"
      )}>
        <Icon className="h-3 w-3 mr-1" />
        {text}
      </span>
    );
  };

  return (
    <div className="container mx-auto max-w-2xl py-8 px-4">
      <Card className="shadow-xl">
        <CardHeader className="text-center">
          <History className="mx-auto h-12 w-12 text-primary mb-3" />
          <CardTitle className="text-3xl font-bold text-primary">My Test Scores</CardTitle>
          <CardDescription className="text-lg text-muted-foreground pt-1">
            Enter the identifier you used when taking tests to see your history.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <Label htmlFor="userId" className="sr-only">Your Identifier</Label>
              <Input
                id="userId"
                type="text"
                placeholder="Enter your identifier (e.g., AlexP)"
                value={userId}
                onChange={(e) => {
                  setUserId(e.target.value);
                  if (error) setError(null); // Clear error on input change
                }}
                className="text-center text-xl h-14"
                required
              />
            </div>
            <Button type="submit" className="w-full h-14 text-xl" disabled={isLoading}>
              {isLoading ? (
                <Loader2 className="mr-2 h-6 w-6 animate-spin" />
              ) : (
                'Show My Scores'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {error && !isLoading && (
        <Alert 
          variant={error.startsWith('No scores found') ? 'default' : 'destructive'} 
          className="mt-8"
        >
          <AlertTriangle className="h-5 w-5" />
          <AlertTitle>{error.startsWith('No scores found') ? 'Information' : 'Error'}</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {scores.length > 0 && !isLoading && (
        <div className="mt-10">
          <h2 className="text-2xl font-semibold text-center mb-6 text-primary flex items-center justify-center">
            <ListChecks className="mr-3 h-7 w-7" /> Your Score History
          </h2>
          <div className="space-y-4">
            {scores.map((result) => (
              <Card key={`${result.testId}-${result.submittedAt}`} className="shadow-md hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="text-xl text-primary flex items-center">
                    {result.testTitle}
                    {getModeDisplay(result.testMode)}
                  </CardTitle>
                  <CardDescription>
                    Taken on: {format(new Date(result.submittedAt), 'PPpp')}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">
                    Score: {result.score} / {result.totalPoints} 
                    <span className="ml-2 text-lg text-muted-foreground">
                      ({result.totalPoints > 0 ? ((result.score / result.totalPoints) * 100).toFixed(0) : 0}%)
                    </span>
                  </p>
                  {result.timeTaken && (
                    <p className="text-sm text-muted-foreground mt-1">
                      Time taken: {Math.floor(result.timeTaken / 60)}m {result.timeTaken % 60}s
                    </p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

