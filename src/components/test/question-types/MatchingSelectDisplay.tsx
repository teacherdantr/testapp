
'use client';

import { useState, useEffect, useMemo } from 'react';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { QuestionTypeDisplayProps } from './QuestionTypeDisplayProps';
import type { MatchingItem } from '@/lib/types';

export function MatchingSelectDisplay({ question, userAnswer, onAnswerChange, testMode }: QuestionTypeDisplayProps) {
  const [matchingAnswers, setMatchingAnswers] = useState<Array<{ promptId: string, choiceId: string | null }>>([]);

  useEffect(() => {
    try {
      const initialUserMatches = userAnswer ? JSON.parse(userAnswer) : [];
      const allPrompts = question.prompts || [];
      const currentMatches = allPrompts.map(prompt => {
        const existingMatch = initialUserMatches.find((match: any) => match.promptId === prompt.id);
        return { promptId: prompt.id, choiceId: existingMatch ? existingMatch.choiceId : null };
      });
      setMatchingAnswers(currentMatches);
    } catch (e) {
      setMatchingAnswers((question.prompts || []).map(p => ({ promptId: p.id, choiceId: null })));
    }
  }, [userAnswer, question.prompts]);

  const validShuffledChoices = useMemo(() => {
    const baseChoices = question.choices || [];
    // console.log('[MatchingSelectDisplay] Received question.choices:', JSON.stringify(baseChoices));

    const filteredChoices = baseChoices.filter(choice => {
      if (!choice) {
        // console.warn('[MatchingSelectDisplay] Filtering out null/undefined choice object.');
        return false;
      }
      if (choice.id == null || typeof choice.id !== 'string' || choice.id.trim() === '') {
        // console.warn(`[MatchingSelectDisplay] Filtering out choice with invalid/empty ID (id: ${JSON.stringify(choice.id)}, type: ${typeof choice.id}):`, JSON.stringify(choice));
        return false;
      }
      if (choice.text == null || typeof choice.text !== 'string') {
        // console.warn(`[MatchingSelectDisplay] Filtering out choice with invalid text type (text: ${JSON.stringify(choice.text)}, type: ${typeof choice.text}):`, JSON.stringify(choice));
        return false;
      }
      return true;
    });
    // console.log('[MatchingSelectDisplay] Choices after filtering in useMemo:', JSON.stringify(filteredChoices));

    if (testMode === 'testing' || testMode === 'race') {
      const shuffled = [...filteredChoices];
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      }
      // console.log('[MatchingSelectDisplay] Choices after shuffling (if applicable):', JSON.stringify(shuffled));
      return shuffled;
    }
    
    return filteredChoices;
  }, [question.choices, testMode]);


  const handleMatchingSelectChange = (promptId: string, choiceId: string) => {
    const newAnswers = matchingAnswers.map(match =>
      match.promptId === promptId ? { ...match, choiceId: choiceId === '' ? null : choiceId } : match
    );
    setMatchingAnswers(newAnswers);
    onAnswerChange(question.id, JSON.stringify(newAnswers));
  };

  if (!question.prompts || question.prompts.length === 0) {
    return <p className="text-destructive">Configuration error: No prompts defined for this matching question.</p>;
  }
   if (!validShuffledChoices || validShuffledChoices.length === 0) {
     if (!question.choices || question.choices.length === 0) {
        return <p className="text-destructive">Configuration error: No choices defined for this matching question.</p>;
     }
    return <p className="text-destructive">Configuration error: No valid choices available after filtering. Please check choice IDs and text in question data. Ensure all choices have non-empty IDs.</p>;
  }


  return (
    <div className="space-y-4">
      {question.prompts.map((prompt) => (
        <div key={prompt.id} className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-3 items-center p-3 border rounded-md md:min-w-[300px]">
          <Label htmlFor={`q${question.id}-p${prompt.id}-select`} className="text-base text-foreground">
            {prompt.text}
          </Label>
          <Select
            value={matchingAnswers.find(m => m.promptId === prompt.id)?.choiceId || ''}
            onValueChange={(value) => handleMatchingSelectChange(prompt.id, value)}
          >
            <SelectTrigger
              id={`q${question.id}-p${prompt.id}-select`}
              className="w-full md:w-[250px] text-base h-11"
            >
              <SelectValue placeholder="Select match..." />
            </SelectTrigger>
            <SelectContent>
              {/* Placeholder item */}
              <SelectItem value="" className="text-base italic text-muted-foreground">-- Select --</SelectItem>
              
              {validShuffledChoices.map((choice: MatchingItem, index: number) => {
                  const originalChoiceId = choice.id;
                  const originalChoiceText = choice.text;

                  let valueForSelectItem: string | undefined = undefined;

                  if (originalChoiceId != null) { // Check for null or undefined
                      const idAsString = String(originalChoiceId);
                      const trimmedId = idAsString.trim();
                      if (trimmedId !== "") {
                          valueForSelectItem = trimmedId;
                      }
                  }

                  if (valueForSelectItem === undefined) {
                      console.error(
                          `[MatchingSelectDisplay] CRITICAL DEFENSE: Skipping SelectItem due to invalid/empty ID. ` +
                          `Original ID: "${originalChoiceId}" (type: ${typeof originalChoiceId}), Original Text: "${originalChoiceText}". ` +
                          `Question ID: ${question.id}, Choice Index: ${index}. ` +
                          `Problematic Choice Object: ${JSON.stringify(choice)}`
                      );
                      return null; // Skip rendering this invalid SelectItem
                  }

                  // Now, valueForSelectItem is a guaranteed non-empty string.
                  const displayText = String(originalChoiceText == null ? '' : originalChoiceText).trim() || `(ID: ${valueForSelectItem})`;
                  
                  // console.log(`[MatchingSelectDisplay] Rendering SelectItem: key="${valueForSelectItem}", value="${valueForSelectItem}", textContent="${displayText}"`);
                  
                  return (
                    <SelectItem key={valueForSelectItem} value={valueForSelectItem} className="text-base">
                      {displayText}
                    </SelectItem>
                  );
              })}
            </SelectContent>
          </Select>
        </div>
      ))}
    </div>
  );
}
