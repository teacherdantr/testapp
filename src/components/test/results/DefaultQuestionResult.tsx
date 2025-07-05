
import React from 'react';
import type { TestResult } from '@/lib/types';
import { CheckCircle2, XCircle, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { renderUserAnswer, renderCorrectAnswer } from '../results/resultUtils'; // Import helper functions
import ImageWithZoom from './ImageWithZoom'; // Import ImageWithZoom component
import { QuestionType } from '@/lib/types'; // Ensure QuestionType is imported

interface DefaultQuestionResultProps {
  qResult: TestResult['questionResults'][0];
}

const DefaultQuestionResult: React.FC<DefaultQuestionResultProps> = ({ qResult }) => {
  // This component handles MCQ, ShortAnswer, and any other types not explicitly broken out
  const isMCQOrMCMA = qResult.questionType === QuestionType.MCQ || qResult.questionType === QuestionType.MultipleChoiceMultipleAnswer;

  return (
    <>
      {/* Display image for MCQ/MCMA if present */}
      {isMCQOrMCMA && qResult.imageUrl && (
        <div className="mb-3">
           <ImageWithZoom imageUrl={qResult.imageUrl} questionId={qResult.questionId} altText={`Illustration for question ${qResult.questionText}`} />
        </div>
      )}

      {!isMCQOrMCMA && ( // Only show Your Answer/Correct Answer for non-MCQ/MCMA (handled below)
        <>
          <div>
            <span className="font-semibold">Your Answer: </span>
            <span className={qResult.isCorrect ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'}>
              {renderUserAnswer(qResult)}
            </span>
          </div>
          {!qResult.isCorrect && renderCorrectAnswer(qResult) && (
            <div>
              <span className="font-semibold">Correct Answer: </span>
              <span className="text-green-700 dark:text-green-300">{renderCorrectAnswer(qResult)}</span>
            </div>
          )}
        </>
      )}


      {/* Display options for MCQ/MCMA if present */}
      {(qResult.questionType === QuestionType.MCQ || qResult.questionType === QuestionType.MultipleChoiceMultipleAnswer) && qResult.options && (
        <div className="pl-4 pt-2">
          <p className="font-semibold text-xs text-muted-foreground mb-1">OPTIONS:</p>
          <ul className="list-disc list-inside space-y-1">
            {qResult.options.map(opt => {
              const isCorrectOption = qResult.questionType === QuestionType.MultipleChoiceMultipleAnswer
                ? (qResult.correctAnswer as string[]).includes(opt.text)
                : qResult.correctAnswer === opt.text;

              const userSelectedThisOption = qResult.questionType === QuestionType.MultipleChoiceMultipleAnswer
                ? (JSON.parse(qResult.userAnswer || '[]') as string[]).includes(opt.text)
                : qResult.userAnswer === opt.text;

              let className = '';
              if (isCorrectOption) className = 'font-medium text-green-700 dark:text-green-300';
              if (userSelectedThisOption && !isCorrectOption) className = 'line-through text-red-700 dark:text-red-300';
               if (!userSelectedThisOption && !isCorrectOption) className = 'text-muted-foreground';


              return (
                <li key={opt.id} className={className}>
                  {opt.text}
                  {isCorrectOption && userSelectedThisOption && <CheckCircle2 className="inline ml-1 h-4 w-4 text-green-500 dark:text-green-300" />} {/* Correct: and selected */}
                  isCorrectOption && !userSelectedThisOption && <AlertCircle className="inline ml-1 h-4 w-4 text-green-500 dark:text-green-300" />
                  {userSelectedThisOption && !isCorrectOption && <XCircle className="inline ml-1 h-4 w-4 text-red-500 dark:text-red-300" />}
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </>
  );
};

export default DefaultQuestionResult;