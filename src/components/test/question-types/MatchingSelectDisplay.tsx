
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

    const baseChoices = question.choices || [];
    const filteredChoices = baseChoices.filter(choice => {
      if (!choice) {
        // console.warn('[MatchingSelectDisplay] Filtering out null/undefined choice object.');
        return false;
      }
      // Ensure ID is a string and not empty or just whitespace
      if (choice.id == null || typeof choice.id !== 'string' || choice.id.trim() === '') {
        // console.warn(`[MatchingSelectDisplay] Filtering out choice with invalid/empty ID (id: ${JSON.stringify(choice.id)}, type: ${typeof choice.id}):`, choice);
        return false;
      }
      // Ensure text is a string (can be empty)
      if (choice.text == null || typeof choice.text !== 'string') {
        // console.warn(`[MatchingSelectDisplay] Filtering out choice with invalid text type (text: ${JSON.stringify(choice.text)}, type: ${typeof choice.text}):`, choice);
        return false;
      }
      return true;
    });
    // console.log('[MatchingSelectDisplay] After initial filtering - filteredChoices:', JSON.parse(JSON.stringify(filteredChoices)));

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
     if (!question.choices || question.choices.length === 0) {
        return <p className="text-destructive">Configuration error: No choices defined for matching question.</p>;
     }
    return <p className="text-destructive">Configuration error: No valid choices available after filtering for matching question. Please check choice IDs and text in question data.</p>;
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
              
              {/* Dynamically rendered choice items */}
              {validShuffledChoices.map((choice: MatchingItem) => {
                // Ensure choice.id is treated as a string and trimmed for the value prop.
                // Ensure choice.text is treated as a string and trimmed for display.
                const choiceIdStr = String(choice.id == null ? '' : choice.id).trim();
                const choiceTextStr = String(choice.text == null ? '' : choice.text).trim();

                // CRITICAL: If choiceIdStr is empty after trimming, this SelectItem is invalid for Radix UI.
                // The filter in useMemo should prevent this, but this is a final safeguard.
                if (choiceIdStr === '') {
                  console.error(
                    `[MatchingSelectDisplay] CRITICAL: Attempting to render SelectItem with an empty 'value' (derived from choice.id). This item will be skipped. Original choice object:`,
                    JSON.parse(JSON.stringify(choice)), // Log a copy
                    `For Question ID: ${question.id}`
                  );
                  return null; // Skip rendering this invalid item.
                }
                
                // Use the sanitized choiceIdStr for both key and value to be safe.
                return (
                  <SelectItem key={choiceIdStr} value={choiceIdStr} className="text-base">
                    {choiceTextStr || `(Choice ID: ${choiceIdStr})`}
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
