
'use client';

import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import type { QuestionTypeDisplayProps } from './QuestionTypeDisplayProps';
import type { QuestionTypeDisplayProps } from '../QuestionTypeDisplayProps';

export function TrueFalseDisplay({ question, userAnswer, onAnswerChange }: QuestionTypeDisplayProps) {
  const handleRadioChange = (value: string) => {
    onAnswerChange(question.id, value);
  };

  return (
    <RadioGroup value={userAnswer} onValueChange={handleRadioChange} className="space-y-2">
      <div className="flex items-center space-x-3 p-3 rounded-md border border-input hover:bg-accent/10 transition-colors has-[[data-state=checked]]:bg-accent has-[[data-state=checked]]:text-accent-foreground has-[[data-state=checked]]:border-accent">
        <RadioGroupItem value="true" id={`${question.id}-true`} />
        <Label htmlFor={`${question.id}-true`} className="text-base font-normal cursor-pointer flex-grow">True</Label>
      </div>
      <div className="flex items-center space-x-3 p-3 rounded-md border border-input hover:bg-accent/10 transition-colors has-[[data-state=checked]]:bg-accent has-[[data-state=checked]]:text-accent-foreground has-[[data-state=checked]]:border-accent">
        <RadioGroupItem value="false" id={`${question.id}-false`} />
        <Label htmlFor={`${question.id}-false`} className="text-base font-normal cursor-pointer flex-grow">False</Label>
      </div>
    </RadioGroup>
  );
}
