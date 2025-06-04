
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
      // console.error(`[MatchingSelectDisplay QID: ${question.id}] Error parsing userAnswer:`, e, "User answer was:", userAnswer);
      setMatchingAnswers((question.prompts || []).map(p => ({ promptId: p.id, choiceId: null })));
    }
  }, [userAnswer, question.prompts, question.id]);

  const prompts = useMemo(() => {
    // console.log(`[MatchingSelectDisplay QID: ${question.id}] Received question.prompts:`, JSON.stringify(question.prompts));
    return question.prompts || [];
  }, [question.id, question.prompts]);

  const validShuffledChoices = useMemo(() => {
    const baseChoices = question.choices || [];
    // console.log(`[MatchingSelectDisplay QID: ${question.id}] Initial baseChoices:`, JSON.stringify(baseChoices));

    const filteredChoices = baseChoices.filter((choice, idx) => {
      if (!choice) {
        // console.warn(`[MatchingSelectDisplay QID: ${question.id}] Filtering out NULL/UNDEFINED choice object at index ${idx}.`);
        return false;
      }
      if (choice.id == null) { // Catches both null and undefined for ID
        // console.warn(`[MatchingSelectDisplay QID: ${question.id}] Filtering out choice with NULL/UNDEFINED ID at index ${idx}. Choice text: "${choice.text}"`);
        return false;
      }
      if (typeof choice.id !== 'string') {
        // console.warn(`[MatchingSelectDisplay QID: ${question.id}] Filtering out choice with NON-STRING ID (type: ${typeof choice.id}) at index ${idx}. ID: ${JSON.stringify(choice.id)}, Text: "${choice.text}"`);
        return false;
      }
      if (choice.id.trim() === '') {
        // console.warn(`[MatchingSelectDisplay QID: ${question.id}] Filtering out choice with EMPTY/WHITESPACE ID at index ${idx}. Original ID: "${choice.id}", Text: "${choice.text}"`);
        return false;
      }
      if (typeof choice.text !== 'string') { // Text for display can be empty, but not other types
        // console.warn(`[MatchingSelectDisplay QID: ${question.id}] Filtering out choice with NON-STRING TEXT (type: ${typeof choice.text}) at index ${idx}. ID: "${choice.id}", Text: ${JSON.stringify(choice.text)}`);
        return false;
      }
      return true;
    });

    // console.log(`[MatchingSelectDisplay QID: ${question.id}] Filtered choices (before shuffle):`, JSON.stringify(filteredChoices));

    if (testMode === 'testing' || testMode === 'race') {
      const shuffled = [...filteredChoices];
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      }
      // console.log(`[MatchingSelectDisplay QID: ${question.id}] Shuffled choices:`, JSON.stringify(shuffled));
      return shuffled;
    }
    return filteredChoices;
  }, [question.choices, question.id, testMode]);


  const handleMatchingSelectChange = (promptId: string, choiceId: string) => {
    const newAnswers = matchingAnswers.map(match =>
      match.promptId === promptId ? { ...match, choiceId: choiceId === '' ? null : choiceId } : match
    );
    setMatchingAnswers(newAnswers);
    onAnswerChange(question.id, JSON.stringify(newAnswers));
  };

  if (prompts.length === 0) {
    return <p className="text-destructive">Configuration error: No prompts defined for this matching question (ID: {question.id}).</p>;
  }
   if (validShuffledChoices.length === 0) {
     if (!question.choices || question.choices.length === 0) {
        return <p className="text-destructive">Configuration error: No choices defined for this matching question (ID: {question.id}).</p>;
     }
    return <p className="text-destructive">Configuration error: No valid choices available after filtering for question (ID: {question.id}). Please check choice IDs and text in question data. Ensure all choices have non-empty string IDs.</p>;
  }


  return (
    <div className="space-y-4">
      {prompts.map((prompt) => (
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
              
              {validShuffledChoices.map((choice: MatchingItem, index: number) => {
                // CRITICAL PRE-RENDER CHECK
                if (!choice || choice.id == null) {
                  console.error(`[MatchingSelectDisplay] CRITICAL RENDER BLOCK: Encountered null/undefined choice object or choice.id at index ${index} for Q_ID ${question.id}. Skipping SelectItem. Choice:`, JSON.stringify(choice));
                  return null; // Skip rendering this item
                }

                // Aggressively sanitize the ID for the value prop by removing ALL whitespace
                const valueForSelectItem = String(choice.id).replace(/\s/g, '');

                if (valueForSelectItem === '') {
                  console.error(
                      `[MatchingSelectDisplay] CRITICAL RENDER BLOCK: Skipping SelectItem due to EMPTY ID after aggressive sanitization for Q_ID ${question.id} at index ${index}. ` +
                      `Original ID: "${choice.id}", Aggressively Sanitized ID: "${valueForSelectItem}". Choice Object: ${JSON.stringify(choice)}`
                  );
                  return null; // Skip rendering this item if ID becomes empty after full whitespace removal
                }
                
                const choiceTextStr = String(choice.text == null ? '' : choice.text).trim();
                
                // For debugging, you can uncomment this:
                // console.log(`[MatchingSelectDisplay QID: ${question.id}] Rendering SelectItem: key="${valueForSelectItem}", value="${valueForSelectItem}", textContent="${choiceTextStr || `(ID: ${valueForSelectItem})`}"`);

                return (
                  <SelectItem key={valueForSelectItem} value={valueForSelectItem} className="text-base">
                    {choiceTextStr || `(ID: ${valueForSelectItem})`} {/* Display ID if text is empty */}
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
    
