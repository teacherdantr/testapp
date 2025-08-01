
'use client';

import React, { useMemo } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import type { Question, MatchingItem } from '@/lib/types';

interface GmtxMatchingSelectDisplayProps {
  question: Question;
  currentAnswers: Record<string, string>; // promptId -> choiceId
  onAnswerChange: (matches: Record<string, string>) => void;
}

export function GmtxMatchingSelectDisplay({
  question,
  currentAnswers,
  onAnswerChange,
}: GmtxMatchingSelectDisplayProps) {
  const prompts = useMemo(() => question.prompts || [], [question.prompts]);
  const choices = useMemo(() => question.choices || [], [question.choices]);

  const handleSelectChange = (promptId: string, choiceId: string) => {
    onAnswerChange({
      ...currentAnswers,
      [promptId]: choiceId,
    });
  };

  if (prompts.length === 0 || choices.length === 0) {
    return (
      <div className="bg-muted p-4 rounded-md text-center text-muted-foreground">
        This Matching question is missing its prompts or choices.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {prompts.map((prompt) => (
        <div
          key={prompt.id}
          className="grid grid-cols-1 md:grid-cols-[2fr,3fr] items-center gap-x-4 gap-y-2 p-3 border rounded-md"
        >
          <Label htmlFor={`prompt-${prompt.id}`} className="font-normal text-base">
            {prompt.text}
          </Label>
          <Select
            value={currentAnswers[prompt.id] || ''}
            onValueChange={(value) => handleSelectChange(prompt.id, value)}
          >
            <SelectTrigger id={`prompt-${prompt.id}`}>
              <SelectValue placeholder="Select a match..." />
            </SelectTrigger>
            <SelectContent>
              {choices.map((choice) => (
                <SelectItem key={choice.id} value={choice.id}>
                  {choice.text}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      ))}
    </div>
  );
}
