'use client';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { UseFormRegister, FieldErrors } from 'react-hook-form';

interface ShortAnswerBuilderProps {
  questionIndex: number;
  register: UseFormRegister<any>;
  errors: FieldErrors<any>;
}

export function ShortAnswerBuilder({ questionIndex, register, errors }: ShortAnswerBuilderProps) {
  return (
    <div>
      <Label htmlFor={`questions.${questionIndex}.correctAnswer`}>Correct Answer</Label>
      <Input
        id={`questions.${questionIndex}.correctAnswer`}
        {...register(`questions.${questionIndex}.correctAnswer`)}
        placeholder="Enter the exact correct answer"
        className="mt-1"
      />
      {errors.questions?.[questionIndex]?.correctAnswer && (
        <p className="text-sm text-destructive mt-1">{(errors.questions[questionIndex]?.correctAnswer as any)?.message}</p>
      )}
    </div>
  );
}