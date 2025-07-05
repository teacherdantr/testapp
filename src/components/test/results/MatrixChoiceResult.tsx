'use client';

import React from 'react';
import type { TestResult } from '@/lib/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { CheckCircle2, XCircle } from 'lucide-react';

interface MatrixChoiceResultProps {
  qResult: TestResult['questionResults'][0];
}

export default function MatrixChoiceResult({ qResult }: MatrixChoiceResultProps) {
  if (qResult.questionType !== 'MatrixChoice' || !qResult.statements || !qResult.categories) {
    return null;
  }

  let userAnswersForMatrix: string[] = [];
  try {
    userAnswersForMatrix = JSON.parse(qResult.userAnswer || '[]') as string[];
  } catch (e) {
    console.error('Invalid userAnswer JSON', e);
  }

  const correctAnswersForMatrix = qResult.correctAnswer as string[];

  return (
    <div className="overflow-x-auto">
      <Table className="min-w-full">
        <TableHeader>
          <TableRow>
            <TableHead className="text-muted-foreground">Statement</TableHead>
            {qResult.categories.map(cat => (
              <TableHead key={cat.id} className="text-center text-muted-foreground">{cat.text}</TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {qResult.statements.map((stmt, stmtIdx) => {
            const userAnswerForStatement = userAnswersForMatrix?.[stmtIdx] ?? '';
            const correctAnswerForStatement = correctAnswersForMatrix?.[stmtIdx] ?? '';

            return (
              <TableRow key={stmt.id}>
                <TableCell className="font-medium text-foreground">{stmt.text}</TableCell>
                {qResult.categories.map(cat => (
                  <TableCell key={cat.id} className="text-center">
                    {userAnswerForStatement === cat.text && correctAnswerForStatement === cat.text && (
                      <CheckCircle2 className="h-5 w-5 text-green-500 mx-auto" />
                    )}
                    {userAnswerForStatement === cat.text && correctAnswerForStatement !== cat.text && (
                      <XCircle className="h-5 w-5 text-red-500 mx-auto" />
                    )}
                    {userAnswerForStatement !== cat.text && correctAnswerForStatement === cat.text && (
                      <span className="text-green-500 font-bold">(Correct)</span>
                    )}
                    {(!qResult.userAnswer || (userAnswerForStatement !== cat.text && correctAnswerForStatement !== cat.text)) && ' '}
                  </TableCell>
                ))}
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
      {!qResult.isCorrect && (
        <p className="text-xs text-muted-foreground mt-2">
          For this question to be fully correct, all statements must be matched to their correct categories.
        </p>
      )}
    </div>
  );
}
