
'use client';

import { useState, useEffect } from 'react';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { cn } from '@/lib/utils';
import type { QuestionTypeDisplayProps } from './QuestionTypeDisplayProps';

export function MtfDisplay({ question, userAnswer, onAnswerChange }: QuestionTypeDisplayProps) {
  const [mtfAnswers, setMtfAnswers] = useState<string[]>([]);

  useEffect(() => {
    try {
      const initialAnswers = userAnswer ? JSON.parse(userAnswer) : [];
      const statementsCount = question.statements?.length || 0;
      const correctlySizedAnswers = Array(statementsCount).fill("").map((_, idx) => initialAnswers[idx] || "");
      setMtfAnswers(correctlySizedAnswers);
    } catch(e) {
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
      <div className="grid grid-cols-[1fr_auto_auto] items-center gap-x-4 gap-y-2 mb-2">
        <span className="font-medium text-muted-foreground">Statement</span>
        <span className="font-medium text-muted-foreground text-center">True</span>
        <span className="font-medium text-muted-foreground text-center">False</span>
      </div>
      {question.statements.map((statement, index) => (
        <RadioGroup
          key={statement.id}
          value={mtfAnswers[index]}
          onValueChange={(value) => handleMtfChange(index, value as 'true' | 'false')}
          className="grid grid-cols-[1fr_auto_auto] items-center gap-x-4 gap-y-2 py-2 border-t first:border-t-0"
        >
          <p className="text-foreground text-base">{statement.text}</p>
          <Label
            htmlFor={`${question.id}-s${statement.id}-true`}
            className={cn(
              "flex items-center justify-center p-2 rounded-md border cursor-pointer transition-colors w-20 text-center text-base",
              mtfAnswers[index] === 'true' ? "bg-primary text-primary-foreground border-primary" : "bg-background hover:bg-accent/50 border-input"
            )}
          >
            <RadioGroupItem value="true" id={`${question.id}-s${statement.id}-true`} className="hidden" />
            True
          </Label>
          <Label
            htmlFor={`${question.id}-s${statement.id}-false`}
            className={cn(
              "flex items-center justify-center p-2 rounded-md border cursor-pointer transition-colors w-20 text-center text-base",
              mtfAnswers[index] === 'false' ? "bg-primary text-primary-foreground border-primary" : "bg-background hover:bg-accent/50 border-input"
            )}
          >
            <RadioGroupItem value="false" id={`${question.id}-s${statement.id}-false`} className="hidden" />
            False
          </Label>
        </RadioGroup>
      ))}
    </div>
  );
}
