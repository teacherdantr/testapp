
'use client';

import { useMemo } from 'react'; // Removed useState, useEffect
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { QuestionTypeDisplayProps } from './QuestionTypeDisplayProps';
import type { MatchingItem } from '@/lib/types';

export function MatchingSelectDisplay({ question, userAnswer, onAnswerChange, testMode }: QuestionTypeDisplayProps) {

  const currentSelections = useMemo(() => {
    const selections = new Map<string, string | null>();
    const allPrompts = question.prompts || [];
    try {
      const parsedUserAnswer: Array<{ promptId: string, choiceId: string | null }> = userAnswer ? JSON.parse(userAnswer) : [];
      allPrompts.forEach(prompt => {
        if (prompt && prompt.id != null) { // Ensure prompt and prompt.id are valid
          const existingMatch = parsedUserAnswer.find(match => match.promptId === prompt.id);
          selections.set(prompt.id, existingMatch ? (existingMatch.choiceId === '' ? null : existingMatch.choiceId) : null);
        }
      });
    } catch (e) {
      // console.error(`[MatchingSelectDisplay QID: ${question.id}] Error parsing userAnswer for currentSelections:`, e, "User answer was:", userAnswer);
      allPrompts.forEach(prompt => {
        if (prompt && prompt.id != null) {
          selections.set(prompt.id, null);
        }
      });
    }
    return selections;
  }, [userAnswer, question.prompts, question.id]);

  const prompts = useMemo(() => {
    return (question.prompts || []).filter(p => p && p.id != null); // Filter out invalid prompts
  }, [question.id, question.prompts]);

  const validShuffledChoices = useMemo(() => {
    const baseChoices = question.choices || [];
    const filteredChoices = baseChoices.filter((choice, idx) => {
      if (!choice) {
        // console.warn(`[MatchingSelectDisplay QID: ${question.id}] Filtering out NULL/UNDEFINED choice object at index ${idx}.`);
        return false;
      }
      if (choice.id == null) {
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
      if (typeof choice.text !== 'string') {
        // console.warn(`[MatchingSelectDisplay QID: ${question.id}] Filtering out choice with NON-STRING TEXT (type: ${typeof choice.text}) at index ${idx}. ID: "${choice.id}", Text: ${JSON.stringify(choice.text)}`);
        return false;
      }
      return true;
    });

    if (testMode === 'testing' || testMode === 'race') {
      const shuffled = [...filteredChoices];
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      }
      return shuffled;
    }
    return filteredChoices;
  }, [question.choices, question.id, testMode]);


  const handleMatchingSelectChange = (promptIdToUpdate: string, newChoiceId: string) => {
    const updatedAnswersArray: Array<{ promptId: string, choiceId: string | null }> = [];
    prompts.forEach(prompt => { // Iterate over the filtered prompts
      if (prompt.id === promptIdToUpdate) {
        updatedAnswersArray.push({ promptId: prompt.id, choiceId: newChoiceId === '' ? null : newChoiceId });
      } else {
        // Get the current selection for other prompts from the memoized 'currentSelections'
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
    return <p className="text-destructive">Configuration error: No valid choices available after filtering for question (ID: {question.id}). Please check choice IDs and text in question data.</p>;
  }

  return (
    <div className="space-y-4">
      {prompts.map((prompt) => {
        const selectedChoiceIdForThisPrompt = currentSelections.get(prompt.id) || ''; // For Select value, empty string for placeholder

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
                {validShuffledChoices.map((choice, index) => {
                  const valueForSelectItem = String(choice.id).replace(/\s/g, '');
                  if (valueForSelectItem === '') {
                    // This console.error is a critical safeguard if somehow an empty ID gets past validShuffledChoices
                    // console.error(`[MatchingSelectDisplay] CRITICAL RENDER BLOCK (Post-Memo): Skipping SelectItem due to EMPTY ID after aggressive sanitization for Q_ID ${question.id}. Original ID: "${choice.id}". Choice:`, JSON.stringify(choice));
                    return null;
                  }
                  const choiceTextStr = String(choice.text == null ? '' : choice.text).trim();
                  return (
                    <SelectItem key={valueForSelectItem} value={valueForSelectItem} className="text-base">
                      {choiceTextStr || `(ID: ${valueForSelectItem})`}
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
