
'use client';

import type { Control, FieldErrors, UseFormSetValue, UseFormGetValues, UseFormRegister } from 'react-hook-form';
import { useFieldArray, Controller } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Trash2, PlusCircle } from 'lucide-react';
import { type MatchingItem } from '@/lib/types';
import { useEffect } from 'react';

interface MatchingSelectItemsBuilderProps {
    questionIndex: number;
    control: Control<any>;
    register: UseFormRegister<any>;
    errors: FieldErrors<any>;
    setValue: UseFormSetValue<any>;
    getValues: UseFormGetValues<any>;
}

export function MatchingSelectItemsBuilder({ questionIndex, control, register, errors, setValue, getValues }: MatchingSelectItemsBuilderProps) {
    const { fields: promptFields, append: appendPrompt, remove: removePrompt } = useFieldArray({
        control,
        name: `questions.${questionIndex}.prompts` as const,
    });
    const { fields: choiceFields, append: appendChoice, remove: removeChoice } = useFieldArray({
        control,
        name: `questions.${questionIndex}.choices` as const,
    });

    const prompts = getValues(`questions.${questionIndex}.prompts`) || [];
    const choices = getValues(`questions.${questionIndex}.choices`) || [];

    useEffect(() => {
        const currentCorrectAnswers = getValues(`questions.${questionIndex}.correctAnswer`) || [];
        const currentPrompts = getValues(`questions.${questionIndex}.prompts`) || [];
        if (!Array.isArray(currentCorrectAnswers) || currentCorrectAnswers.length !== currentPrompts.length) {
            const newCorrectAnswers = currentPrompts.map((prompt: MatchingItem) => {
                const existingMatch = Array.isArray(currentCorrectAnswers) ? currentCorrectAnswers.find((ca: any) => ca.promptId === prompt.id) : null;
                return { promptId: prompt.id, choiceId: existingMatch ? existingMatch.choiceId : '' };
            });
            setValue(`questions.${questionIndex}.correctAnswer`, newCorrectAnswers, { shouldValidate: true });
        }
    }, [prompts, questionIndex, setValue, getValues]); // Depend on prompts array from getValues

    const handleCorrectMatchChange = (promptIdx: number, choiceId: string) => {
        const currentCorrectAnswers = getValues(`questions.${questionIndex}.correctAnswer`) as Array<{ promptId: string, choiceId: string }>;
        const promptId = getValues(`questions.${questionIndex}.prompts.${promptIdx}.id`);
        const newCorrectAnswers = currentCorrectAnswers.map(match =>
            match.promptId === promptId ? { ...match, choiceId } : match
        );
        setValue(`questions.${questionIndex}.correctAnswer`, newCorrectAnswers, { shouldValidate: true, shouldDirty: true });
    };

    const addPromptField = () => {
        const newPromptId = crypto.randomUUID();
        appendPrompt({ id: newPromptId, text: '' });
        const currentCorrectAnswers = getValues(`questions.${questionIndex}.correctAnswer`) as Array<{ promptId: string, choiceId: string }> || [];
        setValue(`questions.${questionIndex}.correctAnswer`, [...currentCorrectAnswers, { promptId: newPromptId, choiceId: '' }], { shouldValidate: true, shouldDirty: true });
    };

    const removePromptField = (promptIdx: number) => {
        const promptIdToRemove = getValues(`questions.${questionIndex}.prompts.${promptIdx}.id`);
        removePrompt(promptIdx);
        const currentCorrectAnswers = getValues(`questions.${questionIndex}.correctAnswer`) as Array<{ promptId: string, choiceId: string }> || [];
        setValue(`questions.${questionIndex}.correctAnswer`, currentCorrectAnswers.filter(match => match.promptId !== promptIdToRemove), { shouldValidate: true, shouldDirty: true });
    };

    const addChoiceField = () => {
        appendChoice({ id: crypto.randomUUID(), text: '' });
    };

    const removeChoiceField = (choiceIdx: number) => {
        const choiceIdToRemove = getValues(`questions.${questionIndex}.choices.${choiceIdx}.id`);
        removeChoice(choiceIdx);
        const currentCorrectAnswers = getValues(`questions.${questionIndex}.correctAnswer`) as Array<{ promptId: string, choiceId: string }> || [];
        setValue(`questions.${questionIndex}.correctAnswer`, currentCorrectAnswers.map(match => match.choiceId === choiceIdToRemove ? { ...match, choiceId: '' } : match), { shouldValidate: true, shouldDirty: true });
    };

    return (
        <div className="space-y-6">
            <div className="space-y-3 p-3 border rounded-md">
                <Label className="text-md font-semibold">Prompt Items (Left Column)</Label>
                {promptFields.map((promptField, promptIdx) => (
                    <div key={promptField.id} className="flex items-center space-x-2">
                        <Input
                            id={`questions.${questionIndex}.prompts.${promptIdx}.text`}
                            {...register(`questions.${questionIndex}.prompts.${promptIdx}.text`)}
                            placeholder={`Prompt Item ${promptIdx + 1}`}
                            className="flex-grow"
                        />
                        <Button type="button" variant="ghost" size="icon" onClick={() => removePromptField(promptIdx)} className="text-destructive">
                            <Trash2 className="h-4 w-4" />
                        </Button>
                    </div>
                ))}
                <Button type="button" onClick={addPromptField} variant="outline" size="sm">
                    <PlusCircle className="mr-2 h-4 w-4" /> Add Prompt Item
                </Button>
                {errors.questions?.[questionIndex]?.prompts && (
                    <p className="text-sm text-destructive mt-1">{(errors.questions[questionIndex]?.prompts as any)?.message || (errors.questions[questionIndex]?.prompts as any)?.[0]?.text?.message}</p>
                )}
            </div>

            <div className="space-y-3 p-3 border rounded-md">
                <Label className="text-md font-semibold">Choice Items (Options for Right Column Dropdowns)</Label>
                {choiceFields.map((choiceField, choiceIdx) => (
                    <div key={choiceField.id} className="flex items-center space-x-2">
                        <Input
                            id={`questions.${questionIndex}.choices.${choiceIdx}.text`}
                            {...register(`questions.${questionIndex}.choices.${choiceIdx}.text`)}
                            placeholder={`Choice Item ${choiceIdx + 1}`}
                            className="flex-grow"
                        />
                        <Button type="button" variant="ghost" size="icon" onClick={() => removeChoiceField(choiceIdx)} className="text-destructive">
                            <Trash2 className="h-4 w-4" />
                        </Button>
                    </div>
                ))}
                <Button type="button" onClick={addChoiceField} variant="outline" size="sm">
                    <PlusCircle className="mr-2 h-4 w-4" /> Add Choice Item
                </Button>
                {errors.questions?.[questionIndex]?.choices && (
                    <p className="text-sm text-destructive mt-1">{(errors.questions[questionIndex]?.choices as any)?.message || (errors.questions[questionIndex]?.choices as any)?.[0]?.text?.message}</p>
                )}
            </div>

            {prompts.length > 0 && choices.length > 0 && (
                <div className="space-y-3 p-3 border rounded-md">
                    <Label className="text-md font-semibold">Define Correct Matches</Label>
                    {prompts.map((prompt: MatchingItem, promptIdx: number) => (
                        <div key={prompt.id} className="grid grid-cols-2 gap-4 items-center">
                            <Label htmlFor={`questions.${questionIndex}.correctAnswer.${promptIdx}.choiceId`}>{prompt.text || `Prompt ${promptIdx + 1}`}</Label>
                            <Controller
                                name={`questions.${questionIndex}.correctAnswer.${promptIdx}.choiceId`}
                                control={control}
                                defaultValue={((getValues(`questions.${questionIndex}.correctAnswer`) as any[])?.[promptIdx]?.choiceId) || ''}
                                render={({ field }) => (
                                    <Select
                                        value={field.value}
                                        onValueChange={(value) => handleCorrectMatchChange(promptIdx, value)}
                                    >
                                        <SelectTrigger id={`questions.${questionIndex}.correctAnswer.${promptIdx}.choiceId`}>
                                            <SelectValue placeholder="Select matching choice" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="" disabled className="text-muted-foreground">-- Select --</SelectItem>
                                            {choices.map((choice: MatchingItem) => (
                                                <SelectItem key={choice.id} value={choice.id || ''}>{choice.text}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                )}
                            />
                        </div>
                    ))}
                    {/* Error for overall correctAnswer array for this question type (e.g. if not all matched) */}
                    {errors.questions?.[questionIndex]?.correctAnswer && typeof errors.questions[questionIndex]?.correctAnswer?.message === 'string' && (
                        <p className="text-sm text-destructive mt-1">{(errors.questions[questionIndex]?.correctAnswer as any)?.message}</p>
                    )}
                     {Array.isArray(errors.questions?.[questionIndex]?.correctAnswer) && (errors.questions?.[questionIndex]?.correctAnswer as any[]).map((matchErr, matchIdx) => (
                        matchErr?.choiceId && <p key={`match-${matchIdx}-err`} className="text-sm text-destructive">Match for Prompt {matchIdx + 1}: {matchErr.choiceId.message}</p>
                    ))}
                </div>
            )}
        </div>
    );
}
