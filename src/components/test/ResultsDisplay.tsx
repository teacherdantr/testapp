'use client';

import type { TestResult } from '@/lib/types';
import { QuestionType } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { CheckCircle2, XCircle, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Progress } from '@/components/ui/progress';

import MatrixChoiceResult from './results/MatrixChoiceResult';
import HotspotResult from './results/HotspotResult';
import MatchingSelectResult from './results/MatchingSelectResult';
import DefaultQuestionResult from './results/DefaultQuestionResult';
import MatchingDragAndDropResult from './results/MatchingDragAndDropResult';
import MultipleTrueFalseResult from './results/MultipleTrueFalseResult';

interface ResultsDisplayProps {
  results: TestResult;
  testId: string;
  onRetry: () => void;
}

export function ResultsDisplay({ results, testId, onRetry }: ResultsDisplayProps) {
  const scorePercentage = results.totalPoints > 0 ? (results.score / results.totalPoints) * 100 : 0;

  const renderQuestionResultDetails = (qResult: TestResult['questionResults'][0]) => {
    switch (qResult.questionType) {
      case QuestionType.MultipleTrueFalse:
        return <MultipleTrueFalseResult qResult={qResult} />;
      case QuestionType.MatrixChoice:
        return <MatrixChoiceResult qResult={qResult} />;
      case QuestionType.Hotspot:
        return <HotspotResult qResult={qResult} />;
      case QuestionType.MatchingSelect:
        return <MatchingSelectResult qResult={qResult} />;
      case QuestionType.MatchingDragAndDrop:
        return <MatchingDragAndDropResult qResult={qResult} />;
      default:
        // This will now correctly handle MCQ, TrueFalse, ShortAnswer
        return <DefaultQuestionResult qResult={qResult} />;
    }
  };

  return (
    <Card className="w-full max-w-3xl mx-auto shadow-xl" data-ai-hint="results report">
      <CardHeader className="text-center">
        <CardTitle className="text-4xl font-bold text-primary">Test Results: {results.testTitle}</CardTitle>
        <CardDescription className="text-xl text-foreground">
          You scored <span className="font-bold text-primary">{results.score}</span> out of <span className="font-bold text-primary">{results.totalPoints}</span> points.
        </CardDescription>
        <div className="w-full max-w-sm mx-auto pt-4">
          <Progress value={scorePercentage} className="h-4" />
          <p className="text-center text-lg font-semibold mt-2">{scorePercentage.toFixed(0)}%</p>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <h3 className="text-2xl font-semibold text-center mb-6">Answer Breakdown</h3>
        {results.questionResults.map((qResult, index) => (
          <Card key={qResult.questionId} className={`border-l-4 ${qResult.isCorrect ? 'border-green-500' : 'border-red-500'} bg-card overflow-hidden`}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <CardTitle className="text-lg">Question {index + 1}</CardTitle>
                {qResult.isCorrect ? (
                  <CheckCircle2 className="h-6 w-6 text-green-500 shrink-0" />
                ) : (
                  <XCircle className="h-6 w-6 text-red-500 shrink-0" />
                )}
              </div>
              <p className="text-base text-foreground pt-1">{qResult.questionText}</p>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              {renderQuestionResultDetails(qResult)}
              <p className="text-right text-muted-foreground mt-2">
                Points: {qResult.pointsEarned} / {qResult.pointsPossible}
              </p>
            </CardContent>
          </Card>
        ))}
      </CardContent>
      <CardFooter className="flex justify-center items-center py-6 space-x-4">
        <Button onClick={onRetry} size="lg" variant="outline">
          <RotateCcw className="mr-2 h-5 w-5" />
          Retry Test
        </Button>
        <Button asChild size="lg">
          <Link href="/">Back to Homepage</Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
