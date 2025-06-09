
'use client';

import type { Control, FieldErrors } from 'react-hook-form';
import { Controller } from 'react-hook-form';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

interface TrueFalseSelectorProps {
  questionIndex: number;
  control: Control<any>;
  errors: FieldErrors<any>;
}

export function TrueFalseSelector({ questionIndex, control, errors }: TrueFalseSelectorProps) {
  return (
    <div>
      <Label>Correct Answer</Label>
      <Controller
        name={`questions.${questionIndex}.correctAnswer`}
        control={control}
        defaultValue="false" // Default to false
        render={({ field }) => (
          <RadioGroup
            value={field.value as string}
            onValueChange={(value) => field.onChange(value)}
            className="mt-2 flex space-x-4"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="true" id={`q${questionIndex}-true`} />
              <Label htmlFor={`q${questionIndex}-true`} className="font-normal">True</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="false" id={`q${questionIndex}-false`} />
              <Label htmlFor={`q${questionIndex}-false`} className="font-normal">False</Label>
            </div>
          </RadioGroup>
        )}
      />
      {errors.questions?.[questionIndex]?.correctAnswer && (
        <p className="text-sm text-destructive mt-1">{(errors.questions[questionIndex]?.correctAnswer as any)?.message}</p>
      )}
    </div>
  );
}
