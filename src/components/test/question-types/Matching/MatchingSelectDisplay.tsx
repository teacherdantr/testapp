
'use client';

import { useMemo, useEffect } from 'react';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { QuestionTypeDisplayProps } from '../QuestionTypeDisplayProps';
import type { MatchingItem } from '@/lib/types';
import { QuestionType } from '@/lib/types';

export function MatchingSelectDisplay({ question, userAnswer, onAnswerChange, testMode }: QuestionTypeDisplayProps) {

  const currentSelections = useMemo(() => {
    const selections = new Map<string, string | null>();
    const allPrompts = question.prompts || [];
    try {
      const parsedUserAnswer: Array<{ promptId: string, choiceId: string | null }> = userAnswer ? JSON.parse(userAnswer) : [];
      allPrompts.forEach(prompt => {
        if (prompt && prompt.id != null) {
          const existingMatch = parsedUserAnswer.find(match => match.promptId === prompt.id);
          const choiceIdValue = existingMatch ? existingMatch.choiceId : null;
          selections.set(prompt.id, (choiceIdValue && String(choiceIdValue).trim() !== '') ? String(choiceIdValue) : null);
        }
      });
    } catch (e) {
      console.warn(`[MatchingSelectDisplay QID: ${question.id}] Error parsing userAnswer for currentSelections:`, e, "User answer was:", userAnswer);
      allPrompts.forEach(prompt => {
        if (prompt && prompt.id != null) {
          selections.set(prompt.id, null);
        }
      });
    }
    return selections;
  }, [userAnswer, question.prompts, question.id]);

  const prompts = useMemo(() => {
    return (question.prompts || []).filter(p => p && p.id != null);
  }, [question.prompts]);

  const validShuffledChoices = useMemo(() => {
    const baseChoices = question.choices || [];
    const filteredChoices = baseChoices.filter(choice => 
        choice && 
        choice.id != null && 
        typeof choice.id === 'string' && 
        choice.id.trim() !== ''
    );

    if (testMode === 'testing' || testMode === 'race') {
      const shuffled = [...filteredChoices];
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      }
      return shuffled;
    }
    return filteredChoices;
  }, [question.choices, testMode]);


  const handleMatchingSelectChange = (promptIdToUpdate: string, newChoiceId: string) => {
    const updatedAnswersArray: Array<{ promptId: string, choiceId: string | null }> = [];
    prompts.forEach(prompt => {
      if (prompt.id === promptIdToUpdate) {
        updatedAnswersArray.push({ promptId: prompt.id, choiceId: newChoiceId === '' ? null : newChoiceId });
      } else {
        const existingSelection = currentSelections.get(prompt.id);
        updatedAnswersArray.push({ promptId: prompt.id, choiceId: existingSelection });
      }
    });
    onAnswerChange(question.id, JSON.stringify(updatedAnswersArray));
  };

  if (prompts.length === 0) {
    return <p className="text-destructive">Configuration error: No valid prompts defined for this matching question (ID: {question.id}).</p>;
  }
  if (validShuffledChoices.length === 0) {
     return <p className="text-destructive">Configuration error: No valid choices found for this matching question (ID: {question.id}).</p>;
  }

  return (
    <div className="space-y-4">
      {prompts.map((prompt) => {
        const selectedChoiceIdForThisPrompt = currentSelections.get(prompt.id) || "";

        return (
          <div key={prompt.id} className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-3 items-center p-3 border rounded-md md:min-w-[300px]">
            <Label htmlFor={`q${question.id}-p${prompt.id}-select`} className="text-base text-foreground">
              {prompt.text}
            </Label>
            <Select
              value={selectedChoiceIdForThisPrompt}
              onValueChange={value => handleMatchingSelectChange(prompt.id, value)}
            >
              <SelectTrigger id={`q${question.id}-p${prompt.id}-select`} className="w-full md:w-[250px] text-base h-11">
                <SelectValue placeholder="Select match..." />
              </SelectTrigger>
              <SelectContent>
                {validShuffledChoices.map((choice: MatchingItem) => {
                    const choiceTextStr = String(choice.text == null ? '' : choice.text).trim();
                    const displayLabel = choiceTextStr || `(Choice ID: ${choice.id})`;
                  return (
                    <SelectItem
                      key={choice.id} 
                      value={choice.id}
                      className="text-base"
                    >
                      {displayLabel}
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>
        );
      })}
    </div>
  );
}
