
'use client';

import { useMemo } from 'react';
import type { Option } from '@/lib/types';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import type { QuestionTypeDisplayProps } from '../QuestionTypeDisplayProps';

export function McqDisplay({ question, userAnswer, onAnswerChange, testMode }: QuestionTypeDisplayProps) {
  const optionsToDisplay = useMemo(() => {
    if (!question.options) return [];
    if (testMode === 'testing' || testMode === 'race') {
      const optionsCopy = [...question.options];
      for (let i = optionsCopy.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [optionsCopy[i], optionsCopy[j]] = [optionsCopy[j], optionsCopy[i]];
      }
      return optionsCopy;
    }
    return question.options;
  }, [question.options, testMode]);

  const handleRadioChange = (value: string) => {
    onAnswerChange(question.id, value);
  };

  return (
    <RadioGroup value={userAnswer} onValueChange={handleRadioChange} className="space-y-2">
      {optionsToDisplay.map((option: Option) => (
        <div key={option.id} className="flex items-center space-x-3 p-3 rounded-md border border-input hover:bg-accent/10 transition-colors has-[[data-state=checked]]:bg-accent has-[[data-state=checked]]:text-accent-foreground has-[[data-state=checked]]:border-accent">
          <RadioGroupItem value={option.text} id={`${question.id}-${option.id}`} />
          <Label htmlFor={`${question.id}-${option.id}`} className="text-base font-normal cursor-pointer flex-grow">
            {option.text}
          </Label>
        </div>
      ))}
    </RadioGroup>
  );
}
