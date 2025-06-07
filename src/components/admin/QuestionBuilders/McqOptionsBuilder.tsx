'use client';

import type { Control, FieldErrors, UseFormSetValue, UseFormGetValues, UseFormRegister } from 'react-hook-form';
import { useFieldArray, Controller } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Trash2, Brain } from 'lucide-react';
import { QuestionType } from '@/lib/types'; // Assuming QuestionType enum is defined here

interface McqOptionsBuilderProps {
  questionIndex: number;
  control: Control<any>;
  errors: FieldErrors<any>;
  setValue: UseFormSetValue<any>;
  getValues: UseFormGetValues<any>;
  handleGenerateAIOptions: (questionIndex: number) => void;
  register: UseFormRegister<any>;
}

export function McqOptionsBuilder({ questionIndex, control, errors, setValue, getValues, handleGenerateAIOptions, register }: McqOptionsBuilderProps) {
  const { fields: optionFields, append: appendOption, remove: removeOption } = useFieldArray({
    control,
    name: `questions.${questionIndex}.options` as const,
  });

  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center">
        <Label>Options (select one correct answer)</Label>
        <Button type="button" variant="ghost" size="sm" onClick={() => handleGenerateAIOptions(questionIndex)}>
          <Brain className="mr-2 h-4 w-4" /> Generate with AI
        </Button>
      </div>

      <Controller
        name={`questions.${questionIndex}.correctAnswer`}
        control={control}
        render={({ field: controllerField }) => (
          <RadioGroup
            value={controllerField.value as string}
            onValueChange={(value) => {
              controllerField.onChange(value);
            }}
            className="space-y-2"
          >
            {optionFields.map((optionField, optionIndex) => (
              <div key={optionField.id} className="flex flex-col space-y-1">
                <div className="flex items-center space-x-2">
                  <RadioGroupItem
                    value={getValues(`questions.${questionIndex}.options.${optionIndex}.text`)}
                    id={`q${questionIndex}-opt${optionIndex}-radio`}
                  />
                  <Input
                    id={`q${questionIndex}-opt${optionIndex}-text-input`}
                    {...register(`questions.${questionIndex}.options.${optionIndex}.text`)}
                    placeholder={`Option ${optionIndex + 1}`}
                    className="flex-grow"
                    onChange={(e) => {
                      const oldText = getValues(`questions.${questionIndex}.options.${optionIndex}.text`);
                      const newText = e.target.value;
                      setValue(`questions.${questionIndex}.options.${optionIndex}.text`, newText, { shouldDirty: true, shouldValidate: true });
                      // Update the correct answer if the text of the selected option changes
                      if (controllerField.value === oldText) {
                        controllerField.onChange(newText);
                      }
                    }}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeOption(optionIndex)}
                    className="text-destructive hover:bg-destructive/10"
                    aria-label="Remove option"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                {errors.questions?.[questionIndex]?.options?.[optionIndex]?.text && (
                  <p className="text-sm text-destructive ml-7">
                    {(errors.questions[questionIndex].options[optionIndex].text as any).message}
                  </p>
                )}
              </div>
            ))}
          </RadioGroup>
        )}
      />
      {errors.questions?.[questionIndex]?.options?.message && typeof errors.questions[questionIndex].options.message === 'string' && (
        <p className="text-sm text-destructive mt-1">
          {(errors.questions[questionIndex].options as any).message}
        </p>
      )}
      <Button type="button" onClick={() => appendOption({ text: '' })} variant="outline" size="sm">
        <PlusCircle className="mr-2 h-4 w-4" /> Add Option
      </Button>
    </div>
  );
}