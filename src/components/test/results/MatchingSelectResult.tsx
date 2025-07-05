
'use client';

import type { TestResult } from '@/lib/types';
import { cn } from '@/lib/utils';
import { CheckCircle2, XCircle, AlertCircle } from 'lucide-react'; // Assuming these are needed based on the logic

interface MatchingSelectResultProps {
  qResult: TestResult['questionResults'][0];
}

 function MatchingSelectResult({ qResult }: MatchingSelectResultProps) {
  if (!qResult.prompts || !qResult.choices) {
    return <div className="text-red-500">Error: Missing prompts or choices for Matching Select question.</div>;
  }

  try {
    const userMatches = JSON.parse(qResult.userAnswer || '[]') as Array<{ promptId: string, choiceId: string | null }>;
    const correctMatches = qResult.correctAnswer as Array<{ promptId: string, choiceId: string }>;

    return (
      <div className="space-y-2">
        {qResult.prompts.map(prompt => {
          const userMatch = userMatches.find(m => m.promptId === prompt.id);
          const correctMatch = correctMatches.find(m => m.promptId === prompt.id);

          const userChoiceText = userMatch && userMatch.choiceId ? qResult.choices?.find(c => c.id === userMatch.choiceId)?.text : "Not matched";
          const correctChoiceText = correctMatch ? qResult.choices?.find(c => c.id === correctMatch.choiceId)?.text : "N/A";

          const isThisPairCorrect = userMatch?.choiceId === correctMatch?.choiceId;

          return (
            <div key={prompt.id} className="flex flex-col sm:flex-row justify-between items-start sm:items-center py-1 border-b border-border/50 last:border-b-0">
              <p className="flex-1 mr-2 font-medium">{prompt.text}</p>
              <div className="flex items-center space-x-2 mt-1 sm:mt-0">
                <span className={cn(
                  "px-2 py-0.5 rounded text-xs",
                  isThisPairCorrect ? "bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300" : "bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300"
                )}>
                  Your: <span className="font-semibold">{userChoiceText}</span>
                </span>
                {!isThisPairCorrect && (
                   <span className="px-2 py-0.5 rounded text-xs bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300">
                    Correct: <span className="font-semibold">{correctChoiceText}</span>
                  </span>
                )}
              </div>
            </div>
          );
        })}
        {!qResult.isCorrect && <p className="text-xs text-muted-foreground mt-2">For this question to be fully correct, all prompts must be matched correctly.</p>}
      </div>
    );
  } catch (error) {
    console.error("Error rendering Matching Select result:", error);
    return <div className="text-red-500">Error displaying result for this question.</div>;
  }
}

export default MatchingSelectResult;