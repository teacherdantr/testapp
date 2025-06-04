
'use client';

import { useMemo, useEffect } from 'react';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { QuestionTypeDisplayProps } from './QuestionTypeDisplayProps';
import type { MatchingItem } from '@/lib/types';
import { QuestionType } from '@/lib/types';

export function MatchingSelectDisplay({ question, userAnswer, onAnswerChange, testMode }: QuestionTypeDisplayProps) {

  useEffect(() => {
    if (question && question.type === QuestionType.MatchingSelect) {
      console.log(`[MatchingSelectDisplay QID: ${question.id}] Full question data received:`, JSON.stringify(question, null, 2));
    }
  }, [question]);

  const currentSelections = useMemo(() => {
    const selections = new Map<string, string | null>();
    const allPrompts = question.prompts || [];
    try {
      const parsedUserAnswer: Array<{ promptId: string, choiceId: string | null }> = userAnswer ? JSON.parse(userAnswer) : [];
      allPrompts.forEach(prompt => {
        if (prompt && prompt.id != null) {
          const existingMatch = parsedUserAnswer.find(match => match.promptId === prompt.id);
          selections.set(prompt.id, existingMatch ? (existingMatch.choiceId === '' ? null : existingMatch.choiceId) : null);
        }
      });
    } catch (e) {
      // console.warn(`[MatchingSelectDisplay QID: ${question.id}] Error parsing userAnswer for currentSelections:`, e, "User answer was:", userAnswer);
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
    // console.log(`[MatchingSelectDisplay QID: ${question.id}] Original question.choices:`, JSON.stringify(baseChoices, null, 2));

    const filteredChoices = baseChoices.filter((choice, idx) => {
      if (!choice) {
        // console.warn(`[MatchingSelectDisplay QID: ${question.id}] Filtering out NULL/UNDEFINED choice object at index ${idx}.`);
        return false;
      }
      if (choice.id == null) { // Checks for both null and undefined
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
      // Text validation (less critical for the value prop error, but good for display)
      if (choice.text != null && typeof choice.text !== 'string') {
         // console.warn(`[MatchingSelectDisplay QID: ${question.id}] Filtering out choice with NON-STRING TEXT (type: ${typeof choice.text}) at index ${idx}. ID: "${choice.id}", Text: ${JSON.stringify(choice.text)}`);
        return false;
      }
      return true;
    });

    // console.log(`[MatchingSelectDisplay QID: ${question.id}] Filtered choices (before shuffle):`, JSON.stringify(filteredChoices, null, 2));

    if (testMode === 'testing' || testMode === 'race') {
      const shuffled = [...filteredChoices];
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      }
      // console.log(`[MatchingSelectDisplay QID: ${question.id}] Shuffled choices:`, JSON.stringify(shuffled, null, 2));
      return shuffled;
    }
    return filteredChoices;
  }, [question.id, question.choices, testMode]);


  const handleMatchingSelectChange = (promptIdToUpdate: string, newChoiceId: string) => {
    const updatedAnswersArray: Array<{ promptId: string, choiceId: string | null }> = [];
    prompts.forEach(prompt => {
      if (prompt.id === promptIdToUpdate) {
        updatedAnswersArray.push({ promptId: prompt.id, choiceId: newChoiceId === '' ? null : newChoiceId });
      } else {
        updatedAnswersArray.push({ promptId: prompt.id, choiceId: currentSelections.get(prompt.id) || null });
      }
    });
    onAnswerChange(question.id, JSON.stringify(updatedAnswersArray));
  };

  if (prompts.length === 0) {
    return <p className="text-destructive">Configuration error: No valid prompts defined for this matching question (ID: {question.id}).</p>;
  }
  if (validShuffledChoices.length === 0) {
    if (!question.choices || question.choices.length === 0) {
       return <p className="text-destructive">Configuration error: No choices defined for this matching question (ID: {question.id}).</p>;
    }
    return <p className="text-destructive">Configuration error: No valid choices available after filtering for question (ID: {question.id}). Please check choice IDs and text in question data. Original choices: {JSON.stringify(question.choices)}</p>;
  }

  return (
    <div className="space-y-4">
      {prompts.map((prompt) => {
        const selectedChoiceIdForThisPrompt = currentSelections.get(prompt.id) || '';

        return (
          <div key={prompt.id} className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-3 items-center p-3 border rounded-md md:min-w-[300px]">
            <Label htmlFor={`q${question.id}-p${prompt.id}-select`} className="text-base text-foreground">
              {prompt.text}
            </Label>
            <Select
              value={selectedChoiceIdForThisPrompt}
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
                  if (!choice || choice.id == null) { // choice.id == null checks for both null and undefined
                    console.error(`[MatchingSelectDisplay QID: ${question.id}] CRITICAL RENDER BLOCK (Invalid Choice Object): Skipping SelectItem due to NULL/UNDEFINED choice object or choice.id. Index: ${index}. Choice:`, JSON.stringify(choice));
                    return null;
                  }
                  
                  const valueForSelectItem = String(choice.id).trim();

                  if (valueForSelectItem === '') {
                    console.error(`[MatchingSelectDisplay QID: ${question.id}] CRITICAL RENDER BLOCK (Empty ID Post-Trim): Skipping SelectItem because choice.id ("${choice.id}") became an empty string after String() and trim(). Full Choice:`, JSON.stringify(choice));
                    return null; // Skip rendering this item
                  }
                  
                  const choiceTextStr = String(choice.text == null ? '' : choice.text).trim();
                  const displayLabel = choiceTextStr || `(Choice ID: ${valueForSelectItem})`;

                  return (
                    <SelectItem
                      key={`${question.id}-${valueForSelectItem}-${index}-${Math.random()}`} // Added Math.random for extreme uniqueness in case of duplicate sanitized IDs
                      value={valueForSelectItem} // This is now guaranteed non-empty by the check above
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
