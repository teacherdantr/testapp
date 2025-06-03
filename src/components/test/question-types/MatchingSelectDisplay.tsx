
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
      // console.error("[MatchingSelectDisplay] Error parsing userAnswer for initial state:", e, "User Answer:", userAnswer);
      setMatchingAnswers((question.prompts || []).map(p => ({ promptId: p.id, choiceId: null })));
    }
  }, [userAnswer, question.prompts]);

  const validShuffledChoices = useMemo(() => {
    // console.log('[MatchingSelectDisplay] Received question.choices:', JSON.parse(JSON.stringify(question.choices || [])));

    // 1. Filter first, always.
    const filteredChoices = (question.choices || []).filter(choice => {
      if (!choice) {
        // console.warn('[MatchingSelectDisplay] Filtering out null/undefined choice object.');
        return false;
      }
      // Ensure choice.id is a string and not empty after trimming
      if (typeof choice.id !== 'string' || choice.id.trim() === '') {
        // console.warn(`[MatchingSelectDisplay] Filtering out choice with invalid/empty ID (id: ${JSON.stringify(choice.id)}, type: ${typeof choice.id}):`, choice);
        return false;
      }
      // Ensure choice.text is also a string (though SelectItem usually handles non-string children, good to be safe)
      if (typeof choice.text !== 'string') {
        // console.warn(`[MatchingSelectDisplay] Filtering out choice with invalid text type (text: ${JSON.stringify(choice.text)}, type: ${typeof choice.text}):`, choice);
        return false;
      }
      return true;
    });
    // console.log('[MatchingSelectDisplay] After initial filtering - filteredChoices:', JSON.parse(JSON.stringify(filteredChoices)));

    // 2. Then shuffle if necessary.
    if (testMode === 'testing' || testMode === 'race') {
      const shuffledFilteredChoices = [...filteredChoices];
      for (let i = shuffledFilteredChoices.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffledFilteredChoices[i], shuffledFilteredChoices[j]] = [shuffledFilteredChoices[j], shuffledFilteredChoices[i]];
      }
      // console.log('[MatchingSelectDisplay] After shuffling - shuffledFilteredChoices:', JSON.parse(JSON.stringify(shuffledFilteredChoices)));
      return shuffledFilteredChoices;
    }
    
    // console.log('[MatchingSelectDisplay] Training mode - returning filteredChoices directly:', JSON.parse(JSON.stringify(filteredChoices)));
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
    // console.warn("[MatchingSelectDisplay] No prompts found for question:", question.id);
    return <p className="text-destructive">Configuration error: No prompts for matching question.</p>;
  }
   if (!validShuffledChoices || validShuffledChoices.length === 0) {
    // console.warn("[MatchingSelectDisplay] No valid choices found for question:", question.id, "Original choices:", question.choices);
     if (!question.choices || question.choices.length === 0) {
        return <p className="text-destructive">Configuration error: No choices defined for matching question.</p>;
     }
    return <p className="text-destructive">Configuration error: No valid choices available after filtering for matching question.</p>;
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
              <SelectItem value="" className="text-base italic text-muted-foreground">-- Select --</SelectItem>
              {validShuffledChoices.map((choice: MatchingItem) => {
                // Final defensive check at render time
                const choiceIdStr = String(choice.id || '').trim();
                const choiceTextStr = String(choice.text || ''); // Text can be empty, but ID cannot for value

                if (choiceIdStr === '') {
                  console.error(
                    `[MatchingSelectDisplay] CRITICAL: Skipping SelectItem due to effectively empty id ('${choiceIdStr}') after all filters. Original choice:`,
                    JSON.stringify(choice)
                  );
                  return null; // Do not render this SelectItem if its ID is effectively empty
                }

                return (
                  <SelectItem key={choiceIdStr} value={choiceIdStr} className="text-base">
                    {choiceTextStr} {/* Display original text, even if it was just spaces */}
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
