
'use client';

import type { Test } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Check, Square, Send, ExternalLink, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface GmtxReviewPageProps {
  test: Test;
  getIsQuestionAnswered: (questionId: string) => boolean;
  onNavigateToQuestion: (index: number) => void;
  onSubmitTest: () => void;
  isSubmitting: boolean;
}

export function GmtxReviewPage({
  test,
  getIsQuestionAnswered,
  onNavigateToQuestion,
  onSubmitTest,
  isSubmitting,
}: GmtxReviewPageProps) {
  return (
    <div className="flex-1 flex flex-col p-4 sm:p-6 lg:p-8 bg-blue-50">
      <div className="w-full max-w-4xl mx-auto">
        <header className="bg-gray-800 text-white p-4 rounded-t-lg shadow-md flex justify-between items-center">
          <div>
            <h1 className="text-xl font-bold">Review Page</h1>
            <p className="text-sm text-gray-300">{test.title}</p>
          </div>
           <Button size="lg" onClick={onSubmitTest} disabled={isSubmitting}>
                {isSubmitting ? (
                    <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Submitting...
                    </>
                ) : (
                    <>
                        <Send className="mr-2 h-4 w-4" />
                        Submit Final Answers
                    </>
                )}
            </Button>
        </header>
        <main className="bg-white shadow-md rounded-b-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50px]">#</TableHead>
                <TableHead>ID</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead className="text-right">Go to Question</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {test.questions.map((q, index) => {
                const isAnswered = getIsQuestionAnswered(q.id);
                return (
                  <TableRow key={q.id}>
                    <TableCell className="font-medium">{index + 1}</TableCell>
                    <TableCell>{q.id.slice(0, 8)}</TableCell>
                    <TableCell>
                      {isAnswered ? (
                        <Check className="h-5 w-5 text-green-600" />
                      ) : (
                        <Square className="h-5 w-5 text-gray-400" />
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" onClick={() => onNavigateToQuestion(index)}>
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </main>
      </div>
    </div>
  );
}
