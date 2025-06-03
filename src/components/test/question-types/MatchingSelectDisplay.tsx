
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
    // Uncomment these logs in development if you're still facing issues to see the data flow.
    // console.log('[MatchingSelectDisplay] question.choices received:', JSON.parse(JSON.stringify(question.choices || [])));

    const baseChoices = question.choices || [];
    // Filter out choices with invalid/empty IDs or invalid text types FIRST
    const filteredChoices = baseChoices.filter(choice => {
      if (!choice) {
        // console.warn('[MatchingSelectDisplay] Filtering out null/undefined choice object.');
        return false;
      }
      // Ensure ID is a string and not empty or just whitespace
      if (choice.id == null || typeof choice.id !== 'string' || choice.id.trim() === '') {
        // console.warn(`[MatchingSelectDisplay] Filtering out choice with invalid/empty ID (id: ${JSON.stringify(choice.id)}, type: ${typeof choice.id}):`, JSON.parse(JSON.stringify(choice)));
        return false;
      }
      // Ensure text is a string (can be empty)
      if (choice.text == null || typeof choice.text !== 'string') {
        // console.warn(`[MatchingSelectDisplay] Filtering out choice with invalid text type (text: ${JSON.stringify(choice.text)}, type: ${typeof choice.text}):`, JSON.parse(JSON.stringify(choice)));
        return false;
      }
      return true;
    });
    // console.log('[MatchingSelectDisplay] Choices after filtering:', JSON.parse(JSON.stringify(filteredChoices)));

    if (testMode === 'testing' || testMode === 'race') {
      const shuffled = [...filteredChoices];
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      }
      // console.log('[MatchingSelectDisplay] Choices after shuffling (if applicable):', JSON.parse(JSON.stringify(shuffled)));
      return shuffled;
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
    return <p className="text-destructive">Configuration error: No prompts defined for this matching question.</p>;
  }
   if (!validShuffledChoices || validShuffledChoices.length === 0) {
     if (!question.choices || question.choices.length === 0) {
        return <p className="text-destructive">Configuration error: No choices defined for this matching question.</p>;
     }
    return <p className="text-destructive">Configuration error: No valid choices available after filtering for this matching question. Please check choice IDs and text in question data.</p>;
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
              {validShuffledChoices.map((choice: MatchingItem, index: number) => {
                  // Defensive checks before rendering SelectItem
                  if (!choice || choice.id == null) {
                      console.error(
                          `[MatchingSelectDisplay] CRITICAL: Encountered null/undefined choice object or choice.id at index ${index} in validShuffledChoices. Skipping item. Question ID: ${question.id}. Choice data:`, JSON.stringify(choice)
                      );
                      return null; // Skip this item entirely
                  }

                  const choiceIdStr = String(choice.id).trim();
                  const choiceTextStr = String(choice.text == null ? '' : choice.text).trim();

                  // This is the most critical check to prevent the Radix UI error for non-placeholder items
                  if (choiceIdStr === '') {
                      console.error(
                          `[MatchingSelectDisplay] CRITICAL: choice.id (original: "${choice.id}") resulted in an empty string for 'value' prop after String().trim(). Skipping item. Question ID: ${question.id}, Choice Text: "${choice.text}", Index: ${index}. Choice object:`, JSON.stringify(choice)
                      );
                      return null; // Skip rendering this invalid SelectItem
                  }
                  
                  return (
                    <SelectItem key={choiceIdStr || `choice-fallback-${index}`} value={choiceIdStr} className="text-base">
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

