
'use client';

import { useState, useEffect, useMemo } from 'react';
import type { Option } from '@/lib/types';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import type { QuestionTypeDisplayProps } from './QuestionTypeDisplayProps';

export function McmaDisplay({ question, userAnswer, onAnswerChange, testMode }: QuestionTypeDisplayProps) {
  const [selectedMcmaOptions, setSelectedMcmaOptions] = useState<string[]>([]);

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

  useEffect(() => {
    try {
      setSelectedMcmaOptions(userAnswer ? JSON.parse(userAnswer) : []);
    } catch (e) {
      setSelectedMcmaOptions([]);
    }
  }, [userAnswer]);

  const handleMcmaChange = (optionText: string, checked: boolean) => {
    const newSelectedOptions = checked
      ? [...selectedMcmaOptions, optionText]
      : selectedMcmaOptions.filter(opt => opt !== optionText);
    setSelectedMcmaOptions(newSelectedOptions);
    onAnswerChange(question.id, JSON.stringify(newSelectedOptions));
  };

  return (
    <div className="space-y-2">
      {(optionsToDisplay || []).map((option: Option) => (
        <div key={option.id} className="flex items-center space-x-3 p-3 rounded-md border border-input hover:bg-accent/10 transition-colors has-[[data-state=checked]]:bg-accent has-[[data-state=checked]]:text-accent-foreground has-[[data-state=checked]]:border-accent">
          <Checkbox
            id={`${question.id}-${option.id}`}
            checked={selectedMcmaOptions.includes(option.text)}
            onCheckedChange={(checked) => handleMcmaChange(option.text, !!checked)}
          />
          <Label htmlFor={`${question.id}-${option.id}`} className="text-base font-normal cursor-pointer flex-grow">
            {option.text}
          </Label>
        </div>
      ))}
    </div>
  );
}
