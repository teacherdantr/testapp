
'use client';

import { useState, useEffect } from 'react';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { cn } from '@/lib/utils';
import type { QuestionTypeDisplayProps } from './QuestionTypeDisplayProps';
import { CheckCircle2, Circle } from 'lucide-react'; // Import icons

export function MtfDisplay({ question, userAnswer, onAnswerChange }: QuestionTypeDisplayProps) {
  const [mtfAnswers, setMtfAnswers] = useState<string[]>([]);

  useEffect(() => {
    try {
      const initialAnswers = userAnswer ? JSON.parse(userAnswer) : [];
      const statementsCount = question.statements?.length || 0;
      // Ensure mtfAnswers array is always the same length as statements
      const correctlySizedAnswers = Array(statementsCount).fill("").map((_, idx) => initialAnswers[idx] || "");
      setMtfAnswers(correctlySizedAnswers);
    } catch(e) {
      // Fallback if parsing fails or userAnswer is not as expected
      const statementsCount = question.statements?.length || 0;
      setMtfAnswers(Array(statementsCount).fill(""));
    }
  }, [userAnswer, question.statements]);

  const handleMtfChange = (statementIndex: number, value: 'true' | 'false') => {
    const newAnswers = [...mtfAnswers];
    newAnswers[statementIndex] = value;
    setMtfAnswers(newAnswers);
    onAnswerChange(question.id, JSON.stringify(newAnswers));
  };

  if (!question.statements) return null;

  return (
    <div className="space-y-3 border rounded-md p-4">
      <div className="grid grid-cols-[1fr_auto_auto] items-center gap-x-4 gap-y-2 mb-2 px-1 sm:px-0">
        <span className="font-medium text-muted-foreground text-sm sm:text-base">Statement</span>
        <span className="font-medium text-muted-foreground text-center text-sm sm:text-base">True</span>
        <span className="font-medium text-muted-foreground text-center text-sm sm:text-base">False</span>
      </div>
      {question.statements.map((statement, index) => (
        <RadioGroup
          key={statement.id}
          value={mtfAnswers[index]} // This correctly reflects the selected value ('true', 'false', or '') for the row
          onValueChange={(value) => handleMtfChange(index, value as 'true' | 'false')}
          className="grid grid-cols-[1fr_auto_auto] items-center gap-x-4 gap-y-2 py-2 border-t first:border-t-0"
        >
          <p className="text-foreground text-sm sm:text-base pr-2">{statement.text}</p>
          {/* True Button */}
          <Label
            htmlFor={`${question.id}-s${statement.id}-true`}
            className={cn(
              "flex items-center justify-center w-10 h-10 rounded-full border cursor-pointer transition-colors",
              mtfAnswers[index] === 'true'
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-background hover:bg-accent/50 border-input"
            )}
            title={`Select True for "${statement.text}"`}
          >
            <RadioGroupItem value="true" id={`${question.id}-s${statement.id}-true`} className="hidden" />
            {mtfAnswers[index] === 'true' ? (
              <CheckCircle2 className="h-5 w-5" />
            ) : (
              <Circle className="h-5 w-5 text-muted-foreground/50" />
            )}
          </Label>
          {/* False Button */}
          <Label
            htmlFor={`${question.id}-s${statement.id}-false`}
            className={cn(
              "flex items-center justify-center w-10 h-10 rounded-full border cursor-pointer transition-colors",
              mtfAnswers[index] === 'false'
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-background hover:bg-accent/50 border-input"
            )}
            title={`Select False for "${statement.text}"`}
          >
            <RadioGroupItem value="false" id={`${question.id}-s${statement.id}-false`} className="hidden" />
             {mtfAnswers[index] === 'false' ? (
              <CheckCircle2 className="h-5 w-5" />
            ) : (
              <Circle className="h-5 w-5 text-muted-foreground/50" />
            )}
          </Label>
        </RadioGroup>
      ))}
    </div>
  );
}
