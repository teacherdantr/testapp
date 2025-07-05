'use client';

import type { TestResult } from '@/lib/types';
import { cn } from '@/lib/utils';
import { CheckCircle2, XCircle } from 'lucide-react';

interface MultipleTrueFalseResultProps {
  qResult: TestResult['questionResults'][0];
}

export default function MultipleTrueFalseResult({ qResult }: MultipleTrueFalseResultProps) {
  let userAnswersForStatements: string[] = [];

  try {
    userAnswersForStatements = JSON.parse(qResult.userAnswer || '[]') as string[];
  } catch (e) {
    console.error('Invalid JSON in userAnswer:', e);
  }

  const correctAnswersForStatements = qResult.correctAnswer as string[];

  return (
    <div className="space-y-1 mt-1">
      {qResult.statements?.map((stmt, stmtIdx) => {
        const userAnswerForStatement = userAnswersForStatements[stmtIdx];
        const correctAnswerForStatement = correctAnswersForStatements[stmtIdx];
        const isStatementCorrect =
          userAnswerForStatement?.toLowerCase() === correctAnswerForStatement?.toLowerCase();

        return (
          <div
            key={stmt.id}
            className="flex flex-col sm:flex-row justify-between items-start sm:items-center py-1 border-b border-border/50 last:border-b-0"
          >
            <p className="flex-1 mr-2 text-muted-foreground">- {stmt.text}</p>
            <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-2 mt-1 sm:mt-0 w-full sm:w-auto">
              <span
                className={cn(
                  'px-2 py-0.5 rounded text-xs mb-1 sm:mb-0 w-full sm:w-auto text-center',
                  isStatementCorrect
                    ? 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300'
                    : 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300'
                )}
              >
                Your:{' '}
                <span className="font-semibold">
                  {userAnswerForStatement === undefined || userAnswerForStatement === ''
                    ? 'N/A'
                    : userAnswerForStatement}
                </span>
              </span>
              {!isStatementCorrect && (
                <span className="px-2 py-0.5 rounded text-xs bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300 w-full sm:w-auto text-center">
                  Correct:{' '}
                  <span className="font-semibold">{correctAnswerForStatement}</span>
                </span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
