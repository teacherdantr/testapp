
'use client';

import type { Question } from '@/lib/types';
import { cn } from '@/lib/utils';
import { Circle, CheckCircle2 } from 'lucide-react';
import { Label } from '@/components/ui/label';

interface GmtxMtfDisplayProps {
  question: Question;
  currentAnswers: Record<number, 'true' | 'false'>;
  onAnswerChange: (statementIndex: number, value: 'true' | 'false') => void;
}

export function GmtxMtfDisplay({ question, currentAnswers, onAnswerChange }: GmtxMtfDisplayProps) {
  if (!question.statements) return null;

  return (
    <div className="border rounded-md overflow-hidden">
      <div className="grid grid-cols-[1fr_80px_80px] bg-gray-100 p-3 font-medium">
        <span></span>
        <span className="text-center">Yes</span>
        <span className="text-center">No</span>
      </div>
      <div className="divide-y">
        {question.statements.map((statement, index) => (
          <div key={statement.id} className="grid grid-cols-[1fr_80px_80px] items-center p-3">
            <p>{statement.text}</p>
            {/* Yes button */}
            <Label
              htmlFor={`q${question.id}-s${index}-yes`}
              className="flex justify-center items-center cursor-pointer"
            >
              <input
                type="radio"
                id={`q${question.id}-s${index}-yes`}
                name={`q${question.id}-s${index}`}
                value="true"
                checked={currentAnswers[index] === 'true'}
                onChange={() => onAnswerChange(index, 'true')}
                className="sr-only"
              />
              {currentAnswers[index] === 'true'
                ? <CheckCircle2 className="h-6 w-6 text-blue-600" />
                : <Circle className="h-6 w-6 text-gray-400" />
              }
            </Label>
            {/* No button */}
            <Label
              htmlFor={`q${question.id}-s${index}-no`}
              className="flex justify-center items-center cursor-pointer"
            >
              <input
                type="radio"
                id={`q${question.id}-s${index}-no`}
                name={`q${question.id}-s${index}`}
                value="false"
                checked={currentAnswers[index] === 'false'}
                onChange={() => onAnswerChange(index, 'false')}
                className="sr-only"
              />
              {currentAnswers[index] === 'false'
                ? <CheckCircle2 className="h-6 w-6 text-blue-600" />
                : <Circle className="h-6 w-6 text-gray-400" />
              }
            </Label>
          </div>
        ))}
      </div>
    </div>
  );
}
