import React from 'react';
import type { TestResult } from '@/lib/types';
import { cn } from '@/lib/utils';
import { CheckCircle2, XCircle } from 'lucide-react';

interface MatchingDragAndDropResultProps {
  qResult: TestResult['questionResults'][0];
}

const MatchingDragAndDropResult: React.FC<MatchingDragAndDropResultProps> = ({ qResult }) => {
  if (!qResult.draggableItems || !qResult.targetItems) {
    return <p className="text-red-500">Error: Missing draggable or target items for this question type.</p>;
  }

  let userAnswerMatches: Array<{ draggableItemId: string, targetItemId: string | null }> = [];
  try {
    userAnswerMatches = JSON.parse(qResult.userAnswer || '[]');
  } catch (e) {
    console.error("Failed to parse user answer for MatchingDragAndDrop:", e);
    return <p className="text-red-500">Error: Could not parse user answer.</p>;
  }

  const correctMatches: Array<{ draggableItemId: string, targetItemId: string }> = Array.isArray(qResult.correctAnswer)
    ? qResult.correctAnswer
    : [];

  return (
    <div className="space-y-4">
      {qResult.targetItems.map((targetItem) => {
        const userMatch = userAnswerMatches.find(match => match.targetItemId === targetItem.id);
        const userDraggableItem = userMatch?.draggableItemId
          ? qResult.draggableItems!.find(item => item.id === userMatch.draggableItemId)
          : null;

        const correctMatch = correctMatches.find(match => match.targetItemId === targetItem.id);
        const correctDraggableItem = correctMatch?.draggableItemId
          ? qResult.draggableItems!.find(item => item.id === correctMatch.draggableItemId)
          : null;

        const isMatchCorrect = userMatch?.draggableItemId === correctMatch?.draggableItemId;

        return (
          <div key={targetItem.id} className="border border-border rounded-lg p-4">
            <p className="font-medium text-sm mb-2 text-muted-foreground">Target: <span className="text-foreground">{targetItem.text}</span></p>

            <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-4 space-y-2 sm:space-y-0">
              {/* User Match */}
              <div
                className={cn(
                  "flex items-center space-x-2 p-2 rounded-md min-w-[160px] justify-center",
                  isMatchCorrect
                    ? "bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300"
                    : "bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300"
                )}
              >
                {isMatchCorrect ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                <span className="font-semibold text-sm">
                  {userDraggableItem?.text || <em className="text-xs italic">Not matched</em>}
                </span>
              </div>

              {/* Correct Match (if needed) */}
              {!isMatchCorrect && (
                <div className="flex items-center space-x-2 p-2 rounded-md bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300 min-w-[160px] justify-center">
                  <CheckCircle2 className="w-4 h-4" />
                  <span className="font-semibold text-sm">{correctDraggableItem?.text || "No correct match"}</span>
                </div>
              )}
            </div>
          </div>
        );
      })}

      {!qResult.isCorrect && (
        <p className="text-xs text-muted-foreground mt-2">
          For this question to be fully correct, all items must be matched correctly.
        </p>
      )}
    </div>
  );
};

export default MatchingDragAndDropResult;
