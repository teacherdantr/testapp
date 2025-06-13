
'use client';

import { useMemo, useEffect } from 'react';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { QuestionTypeDisplayProps } from '../QuestionTypeDisplayProps';
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
          // Store null if choiceId is effectively empty or explicitly null, otherwise store the choiceId
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
    // console.log(`[MatchingSelectDisplay QID: ${question.id}] Original question.choices for validShuffledChoices:`, JSON.stringify(baseChoices, null, 2));

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
      const trimmedId = choice.id.trim();
      if (trimmedId === '') {
        // console.warn(`[MatchingSelectDisplay QID: ${question.id}] Filtering out choice with EMPTY/WHITESPACE ID (original: "${choice.id}") at index ${idx}. Text: "${choice.text}"`);
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
        // If the newChoiceId is empty (placeholder selected), store null. Otherwise, store the ID.
        updatedAnswersArray.push({ promptId: prompt.id, choiceId: newChoiceId === '' ? null : newChoiceId });
      } else {
        // Preserve existing selections for other prompts
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
    if (!question.choices || question.choices.length === 0) {
       return <p className="text-destructive">Configuration error: No choices defined for this matching question (ID: {question.id}).</p>;
    }
    return <p className="text-destructive">Configuration error: No valid choices available after filtering for question (ID: {question.id}). Please check choice IDs and text in question data. Original choices: {JSON.stringify(question.choices)}</p>;
  }

  return (
    <div className="space-y-4">
      {prompts.map((prompt) => {
        // The value for the <Select> component should be "" if nothing is selected (to show the placeholder),
        // or the actual choiceId if something is selected.
        // currentSelections.get(prompt.id) returns null if no choice is made for this prompt.
        const selectedChoiceIdForThisPrompt = currentSelections.get(prompt.id) || "";

        return (
          <div key={prompt.id} className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-3 items-center p-3 border rounded-md md:min-w-[300px]">
            <Label htmlFor={`q${question.id}-p${prompt.id}-select`} className="text-base text-foreground">
              {prompt.text}
            </Label>
            <Select
              value={selectedChoiceIdForThisPrompt} // Use "" for placeholder state on the Select component
              onValueChange={value => handleMatchingSelectChange(prompt.id, value)}
            >
              <SelectTrigger id={`q${question.id}-p${prompt.id}-select`} className="w-full md:w-[250px] text-base h-11">
                <SelectValue placeholder="Select match..." />
              </SelectTrigger>
              <SelectContent>
                {/* This is the placeholder item. Radix expects value="" for it when SelectValue has a placeholder. */}
                <SelectItem  value="__placeholder__" disabled  className="text-base italic text-muted-foreground">-- Select --</SelectItem>
                {validShuffledChoices
                  .filter(choice => {
                    if (!choice || choice.id == null) {
                      console.error(`[MatchingSelectDisplay QID: ${question.id}] Filter BLOCK (Invalid Choice Object): Filtering out choice due to NULL/UNDEFINED choice object or choice.id. Choice:`, JSON.stringify(choice));
                      return false; // Filter out invalid choices
                    }
                    const valueForSelectItem = String(choice.id).replace(/\s/g, '');
                    if (valueForSelectItem === '') {
                      console.error(`[MatchingSelectDisplay QID: ${question.id}] Filter BLOCK (Empty ID Post-Sanitization): Filtering out choice because choice.id ("${choice.id}") became an empty string after sanitization. Full Choice:`, JSON.stringify(choice));
                      return false; // Filter out choices with empty IDs after sanitization
                    }
                    return true; // Keep valid choices
                  })
                  .map((choice: MatchingItem, index: number) => {
                    // Recalculate sanitized ID for rendering - this is safe now because of the filter above
                    const valueForSelectItem = String(choice.id).replace(/\s/g, '');

                    const choiceTextStr = String(choice.text == null ? '' : choice.text).trim();
                    const displayLabel = choiceTextStr || `(Choice ID: ${valueForSelectItem})`;

                    // console.log(`[MatchingSelectDisplay QID: ${question.id}] Rendering SelectItem for choice: ID="${choice.id}", SanitizedID/Value="${valueForSelectItem}", Text="${displayLabel}"`);
                  return (
                    <SelectItem
                      key={`${question.id}-${valueForSelectItem}-${index}-${Math.random()}`} 
                      value={valueForSelectItem} // This value MUST NOT be an empty string
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

    