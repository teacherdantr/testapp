'use client';

import type { Control, FieldErrors, UseFormRegister, UseFormSetValue, UseFormGetValues } from 'react-hook-form';
import { useFieldArray, Controller } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Trash2, PlusCircle } from 'lucide-react';
import type { TrueFalseStatement } from '@/lib/types';


interface StatementsBuilderProps {
  questionIndex: number;
  control: Control<any>;
  register: UseFormRegister<any>;
  errors: FieldErrors<any>;
  setValue: UseFormSetValue<any>;
  getValues: UseFormGetValues<any>;
}

export function StatementsBuilder({ questionIndex, control, register, errors, setValue, getValues }: StatementsBuilderProps) {
  const { fields: statementFields, append: appendStatement, remove: removeStatement } = useFieldArray({
    control,
    name: `questions.${questionIndex}.statements` as const,
  });

  const handleStatementCorrectAnswerChange = (statementIdx: number, value: 'true' | 'false') => {
    const currentCorrectAnswers = (getValues(`questions.${questionIndex}.correctAnswer`) as string[]) || [];
    const newCorrectAnswers = [...currentCorrectAnswers];
    newCorrectAnswers[statementIdx] = value;
    setValue(`questions.${questionIndex}.correctAnswer`, newCorrectAnswers, { shouldValidate: true, shouldDirty: true });
  };

  const addStatementField = () => {
    appendStatement({ id: crypto.randomUUID(), text: '' });
    const currentCorrectAnswers = (getValues(`questions.${questionIndex}.correctAnswer`) as string[]) || [];
    setValue(`questions.${questionIndex}.correctAnswer`, [...currentCorrectAnswers, 'false'], { shouldValidate: true, shouldDirty: true });
  };

  const removeStatementField = (statementIdx: number) => {
    removeStatement(statementIdx);
    const currentCorrectAnswers = (getValues(`questions.${questionIndex}.correctAnswer`) as string[]) || [];
    const newCorrectAnswers = currentCorrectAnswers.filter((_, i) => i !== statementIdx);
    setValue(`questions.${questionIndex}.correctAnswer`, newCorrectAnswers, { shouldValidate: true, shouldDirty: true });
  };


  return (
    <div className="space-y-4">
      <Label>Statements (define text and correct True/False for each)</Label>
      {statementFields.map((statementField, statementIdx) => (
        <div key={statementField.id} className="p-3 border rounded-md space-y-2">
          <div className="flex items-center space-x-2">
            <Textarea
              id={`questions.${questionIndex}.statements.${statementIdx}.text`}
              {...register(`questions.${questionIndex}.statements.${statementIdx}.text`)}
              placeholder={`Statement ${statementIdx + 1}`}
              className="flex-grow"
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => removeStatementField(statementIdx)}
              className="text-destructive hover:bg-destructive/10 shrink-0"
              aria-label="Remove statement"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
          {errors.questions?.[questionIndex]?.statements?.[statementIdx]?.text && (
            <p className="text-sm text-destructive">{(errors.questions[questionIndex]?.statements as any)?.[statementIdx]?.text?.message}</p>
          )}

          <div>
            <Label className="text-xs">Correct Answer for this statement:</Label>
            <Controller
                name={`questions.${questionIndex}.correctAnswer.${statementIdx}`}
                control={control}
                defaultValue={(getValues(`questions.${questionIndex}.correctAnswer`) as string[])?.[statementIdx] || 'false'}
                render={({ field: controllerField }) => (
                    <RadioGroup
                        value={controllerField.value}
                        onValueChange={(val) => handleStatementCorrectAnswerChange(statementIdx, val as 'true' | 'false')}
                        className="mt-1 flex space-x-3"
                    >
                        <div className="flex items-center space-x-1">
                        <RadioGroupItem value="true" id={`q${questionIndex}-s${statementIdx}-true`} />
                        <Label htmlFor={`q${questionIndex}-s${statementIdx}-true`} className="font-normal text-sm">True</Label>
                        </div>
                        <div className="flex items-center space-x-1">
                        <RadioGroupItem value="false" id={`q${questionIndex}-s${statementIdx}-false`} />
                        <Label htmlFor={`q${questionIndex}-s${statementIdx}-false`} className="font-normal text-sm">False</Label>
                        </div>
                    </RadioGroup>
                )}
            />
          </div>
        </div>
      ))}\n      {errors.questions?.[questionIndex]?.statements && typeof errors.questions[questionIndex]?.statements?.message === 'string' && (\
         <p className="text-sm text-destructive mt-1">{(errors.questions[questionIndex]?.statements as any)?.message}</p>\
      )}\
       {errors.questions?.[questionIndex]?.correctAnswer && typeof errors.questions[questionIndex]?.correctAnswer?.message === 'string' && (\
         <p className="text-sm text-destructive mt-1">{(errors.questions[questionIndex]?.correctAnswer as any)?.message}</p>\
      )}\


      <Button type="button" onClick={addStatementField} variant="outline" size="sm">
        <PlusCircle className="mr-2 h-4 w-4" /> Add Statement
      </Button>
    </div>
  );
}