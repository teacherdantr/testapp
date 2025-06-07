'use client';

import type { Control, FieldArrayWithId, UseFieldArrayAppend, UseFieldArrayRemove, UseFormRegister, FieldErrors, UseFormSetValue, UseFormGetValues } from 'react-hook-form';
import { useFieldArray, Controller } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Trash2, Brain } from 'lucide-react';
import { QuestionType, type Option as OptionType } from '@/lib/types';
import { useToast } from '@/hooks/use-toast'; // Assuming useToast is needed here
import { cn } from '@/lib/utils'; // Assuming cn is needed here

interface OptionsAndCorrectAnswerBuilderProps {
  questionIndex: number;
  control: Control<any>;
  errors: FieldErrors<any>;
  setValue: UseFormSetValue<any>;
  getValues: UseFormGetValues<any>;
  handleGenerateAIOptions: (questionIndex: number) => void;
  register: UseFormRegister<any>;
}

export function OptionsAndCorrectAnswerBuilder({ questionIndex, control, errors, setValue, getValues, handleGenerateAIOptions, register }: OptionsAndCorrectAnswerBuilderProps) {
  const { fields: optionFields, append: appendOption, remove: removeOption } = useFieldArray({
    control,
    name: `questions.${questionIndex}.options` as const,
  });

  const questionType = getValues(`questions.${questionIndex}.type`);

  const handleMCMACorrectAnswerChange = (optionText: string, checked: boolean) => {
    const currentCorrectAnswers = (getValues(`questions.${questionIndex}.correctAnswer`) as string[] | undefined) || [];
    let newCorrectAnswers: string[];
    if (checked) {
      newCorrectAnswers = [...currentCorrectAnswers, optionText];
    } else {
      newCorrectAnswers = currentCorrectAnswers.filter(ans => ans !== optionText);
    }
    setValue(`questions.${questionIndex}.correctAnswer`, newCorrectAnswers, { shouldValidate: true, shouldDirty: true });
  };

  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center">
        <Label>{questionType === QuestionType.MCQ ? 'Options (select one correct answer)' : 'Options (select all correct answers)'}</Label>
        {(questionType === QuestionType.MCQ || questionType === QuestionType.MultipleChoiceMultipleAnswer) && (
             <Button type="button" variant="ghost" size="sm" onClick={() => handleGenerateAIOptions(questionIndex)}>
                <Brain className="mr-2 h-4 w-4" /> Generate with AI
            </Button>
        )}
      </div>

      {questionType === QuestionType.MCQ && (
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
                                    id={`q${questionIndex}-opt${optionIndex}-text-input`}\n
                                    {...register(`questions.${questionIndex}.options.${optionIndex}.text`)}\
                                    placeholder={`Option ${optionIndex + 1}`}\
                                    className="flex-grow"\
                                    onChange={(e) => {\
                                        const oldText = getValues(`questions.${questionIndex}.options.${optionIndex}.text`);\
                                        const newText = e.target.value;\
                                        setValue(`questions.${questionIndex}.options.${optionIndex}.text`, newText, { shouldDirty: true, shouldValidate: true });\
                                        if (controllerField.value === oldText) {\
                                            controllerField.onChange(newText);\
                                        }\
                                    }}\
                                />\
                                <Button\
                                    type="button"\
                                    variant="ghost"\
                                    size="icon"\
                                    onClick={() => removeOption(optionIndex)}\
                                    className="text-destructive hover:bg-destructive/10"\
                                    aria-label="Remove option"\
                                >\
                                    <Trash2 className="h-4 w-4" />\
                                </Button>\
                            </div>\
                            {errors.questions?.[questionIndex]?.options?.[optionIndex]?.text && (\
                                <p className="text-sm text-destructive ml-7">\
                                    {(errors.questions[questionIndex].options[optionIndex].text as any).message}\
                                </p>\
                            )}\
                        </div>\
                    ))}\
                </RadioGroup>\
            )}\
        />\
      )}\

      {questionType === QuestionType.MultipleChoiceMultipleAnswer && (\
        <div className="space-y-2">\
          {optionFields.map((optionField, optionIndex) => (\
            <div key={optionField.id} className="flex flex-col space-y-1">\
                <div className="flex items-center space-x-2">\
                    <Controller\
                        name={`questions.${questionIndex}.options.${optionIndex}.text`} \
                        control={control}\
                        render={({ }) => ( \
                            <Checkbox\
                                id={`q${questionIndex}-opt${optionIndex}-checkbox`}\
                                checked={(getValues(`questions.${questionIndex}.correctAnswer`) as string[] || []).includes(getValues(`questions.${questionIndex}.options.${optionIndex}.text`))}\
                                onCheckedChange={(checked) => handleMCMACorrectAnswerChange(getValues(`questions.${questionIndex}.options.${optionIndex}.text`), !!checked)}\
                            />\
                        )}\
                    />\
                  <Input\
                    id={`q${questionIndex}-opt${optionIndex}-text`}\
                    {...register(`questions.${questionIndex}.options.${optionIndex}.text`)}\
                    placeholder={`Option ${optionIndex + 1}`}\
                    className="flex-grow"\
                    onChange={(e) => {\
                        const oldText = getValues(`questions.${questionIndex}.options.${optionIndex}.text`);\
                        const newText = e.target.value;\
                        setValue(`questions.${questionIndex}.options.${optionIndex}.text`, newText, { shouldDirty: true, shouldValidate: true });\
                        const ca = getValues(`questions.${questionIndex}.correctAnswer`) as string[];\
                        if (ca && ca.includes(oldText)) {\
                            setValue(`questions.${questionIndex}.correctAnswer`, ca.map(ans => ans === oldText ? newText : ans), { shouldDirty: true, shouldValidate: true });\
                        }\
                    }}\
                  />\
                  <Button\
                    type="button"\
                    variant="ghost"\
                    size="icon"\
                    onClick={() => removeOption(optionIndex)}\
                    className="text-destructive hover:bg-destructive/10"\
                    aria-label="Remove option"\
                  >\
                    <Trash2 className="h-4 w-4" />\
                  </Button>\
                </div>\
                {errors.questions?.[questionIndex]?.options?.[optionIndex]?.text && (\
                    <p className="text-sm text-destructive ml-7">\
                        {(errors.questions[questionIndex].options[optionIndex].text as any).message}\
                    </p>\
                )}\
            </div>\
          ))}\
        </div>\
      )}\
      {errors.questions?.[questionIndex]?.options?.message && typeof errors.questions[questionIndex].options.message === 'string' && (\
        <p className="text-sm text-destructive mt-1">\
            {(errors.questions[questionIndex].options as any).message}\
        </p>\
      )}\
      <Button type="button" onClick={() => appendOption({ text: '' })} variant="outline" size="sm">\
        <PlusCircle className="mr-2 h-4 w-4" /> Add Option\
      </Button>\
    </div>\
  );\
}\