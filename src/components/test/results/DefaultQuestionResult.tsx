import React from 'react';
import type { TestResult } from '@/lib/types';
import { QuestionType } from '@/lib/types';
import { CheckCircle2, XCircle, AlertCircle } from 'lucide-react';
import ImageWithZoom from './ImageWithZoom';
import { renderUserAnswer, renderCorrectAnswer } from './resultUtils';

interface DefaultQuestionResultProps {
  qResult: TestResult['questionResults'][0];
}

const DefaultQuestionResult: React.FC<DefaultQuestionResultProps> = ({ qResult }) => {
  const isMCQOrMCMA = qResult.questionType === QuestionType.MCQ || qResult.questionType === QuestionType.MultipleChoiceMultipleAnswer;

  return (
    <>
      {isMCQOrMCMA && qResult.imageUrl && (
        <div className="mb-3">
           <ImageWithZoom imageUrl={qResult.imageUrl} altText={`Illustration for question ${qResult.questionText}`} />
        </div>
      )}

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

      {isMCQOrMCMA && qResult.options && (
        <div className="pl-4 pt-2">
          <p className="font-semibold text-xs text-muted-foreground mb-1">OPTIONS:</p>
          <ul className="list-disc list-inside space-y-1">
            {qResult.options.map(opt => {
              const isCorrectOption = Array.isArray(qResult.correctAnswer)
                ? (qResult.correctAnswer as string[]).includes(opt.text)
                : qResult.correctAnswer === opt.text;

              let userSelectedThisOption = false;
              try {
                  const userAnswerParsed = JSON.parse(qResult.userAnswer || '""');
                  if (Array.isArray(userAnswerParsed)) {
                      userSelectedThisOption = userAnswerParsed.includes(opt.text);
                  } else {
                      userSelectedThisOption = userAnswerParsed === opt.text;
                  }
              } catch {
                  userSelectedThisOption = qResult.userAnswer === opt.text;
              }


              let className = '';
              if (isCorrectOption) className = 'font-medium text-green-700 dark:text-green-300';
              if (userSelectedThisOption && !isCorrectOption) className = 'line-through text-red-700 dark:text-red-300';
              if (!userSelectedThisOption && !isCorrectOption) className = 'text-muted-foreground';

              return (
                <li key={opt.id} className={className}>
                  {opt.text}
                  {isCorrectOption && userSelectedThisOption && <CheckCircle2 className="inline ml-1 h-4 w-4 text-green-500" />}
                  {isCorrectOption && !userSelectedThisOption && <AlertCircle className="inline ml-1 h-4 w-4 text-green-500" />}
                  {userSelectedThisOption && !isCorrectOption && <XCircle className="inline ml-1 h-4 w-4 text-red-500" />}
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
