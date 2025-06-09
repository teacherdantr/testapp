
'use client';

import type { Control, FieldErrors, UseFormRegister, UseFormSetValue, UseFormGetValues } from 'react-hook-form';
import { useFieldArray, Controller } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Trash2, PlusCircle } from 'lucide-react';
import type { Category } from '@/lib/types';

interface MatrixChoiceGridBuilderProps {
  questionIndex: number;
  control: Control<any>;
  register: UseFormRegister<any>;
  errors: FieldErrors<any>;
  setValue: UseFormSetValue<any>;
  getValues: UseFormGetValues<any>;
}

export function MatrixChoiceGridBuilder({ questionIndex, control, register, errors, setValue, getValues }: MatrixChoiceGridBuilderProps) {
  const { fields: statementFields, append: appendStatement, remove: removeStatement } = useFieldArray({
    control,
    name: `questions.${questionIndex}.statements` as const,
  });
  const { fields: categoryFields, append: appendCategory, remove: removeCategory } = useFieldArray({
    control,
    name: `questions.${questionIndex}.categories` as const,
  });

  const handleMatrixCorrectAnswerChange = (statementIdx: number, categoryText: string) => {
    const currentCorrectAnswers = (getValues(`questions.${questionIndex}.correctAnswer`) as string[] | undefined) || [];
    const newCorrectAnswers = [...currentCorrectAnswers];
    newCorrectAnswers[statementIdx] = categoryText;
    setValue(`questions.${questionIndex}.correctAnswer`, newCorrectAnswers, { shouldValidate: true, shouldDirty: true });
  };

  const addStatementField = () => {
    appendStatement({ id: crypto.randomUUID(), text: '' });
    const currentCorrectAnswers = (getValues(`questions.${questionIndex}.correctAnswer`) as string[] | undefined) || [];
    const firstCategoryText = getValues(`questions.${questionIndex}.categories.0.text`) || '';
    setValue(`questions.${questionIndex}.correctAnswer`, [...currentCorrectAnswers, firstCategoryText], { shouldValidate: true, shouldDirty: true });
  };

  const removeStatementField = (statementIdx: number) => {
    removeStatement(statementIdx);
    const currentCorrectAnswers = (getValues(`questions.${questionIndex}.correctAnswer`) as string[] | undefined) || [];
    const newCorrectAnswers = currentCorrectAnswers.filter((_, i) => i !== statementIdx);
    setValue(`questions.${questionIndex}.correctAnswer`, newCorrectAnswers, { shouldValidate: true, shouldDirty: true });
  };

  const addCategoryField = () => {
    appendCategory({ id: crypto.randomUUID(), text: `Column ${categoryFields.length + 1}` });
  };

  const removeCategoryField = (categoryIdx: number) => {
    const removedCategoryText = getValues(`questions.${questionIndex}.categories.${categoryIdx}.text`);
    removeCategory(categoryIdx);
    const currentCorrectAnswers = (getValues(`questions.${questionIndex}.correctAnswer`) as string[] | undefined) || [];
    const firstCategoryText = getValues(`questions.${questionIndex}.categories.0.text`) || '';
    const newCorrectAnswers = currentCorrectAnswers.map(ans => ans === removedCategoryText ? firstCategoryText : ans);
    setValue(`questions.${questionIndex}.correctAnswer`, newCorrectAnswers, { shouldValidate: true, shouldDirty: true });
  };


  return (
    <div className="space-y-4">
      <div className="space-y-2 p-3 border rounded-md">
        <Label className="block mb-2">Categories (Columns)</Label>
        {categoryFields.map((categoryField, categoryIdx) => (
          <div key={categoryField.id} className="flex items-center space-x-2">
            <Input
              id={`questions.${questionIndex}.categories.${categoryIdx}.text`}
              {...register(`questions.${questionIndex}.categories.${categoryIdx}.text`)}
              placeholder={`Category ${categoryIdx + 1}`}
              className="flex-grow"
              onChange={(e) => {
                const oldText = getValues(`questions.${questionIndex}.categories.${categoryIdx}.text`);
                const newText = e.target.value;
                setValue(`questions.${questionIndex}.categories.${categoryIdx}.text`, newText, { shouldValidate: true, shouldDirty: true });

                const currentCorrectAnswers = getValues(`questions.${questionIndex}.correctAnswer`) as string[] | undefined;
                if (currentCorrectAnswers) {
                    const updatedCorrectAnswers = currentCorrectAnswers.map(ans => ans === oldText ? newText : ans);
                    setValue(`questions.${questionIndex}.correctAnswer`, updatedCorrectAnswers, { shouldValidate: true, shouldDirty: true });
                }
              }}
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => removeCategoryField(categoryIdx)}
              className="text-destructive hover:bg-destructive/10 shrink-0"
              disabled={categoryFields.length <= 1}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}
        {errors.questions?.[questionIndex]?.categories && typeof errors.questions[questionIndex]?.categories?.message === 'string' &&(
             <p className="text-sm text-destructive mt-1">{(errors.questions[questionIndex]?.categories as any)?.message}</p>
        )}
         {Array.isArray(errors.questions?.[questionIndex]?.categories) && (errors.questions?.[questionIndex]?.categories as any[]).map((catErr, catIdx) => (
            catErr?.text && <p key={`cat-${catIdx}-err`} className="text-sm text-destructive">Category {catIdx + 1}: {catErr.text.message}</p>
        ))}
        <Button type="button" onClick={addCategoryField} variant="outline" size="sm">
          <PlusCircle className="mr-2 h-4 w-4" /> Add Category
        </Button>
      </div>

      <div className="space-y-2 p-3 border rounded-md">
        <Label className="block mb-2">Statements (Rows) & Correct Answers</Label>
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
                defaultValue={(getValues(`questions.${questionIndex}.correctAnswer`) as string[])?.[statementIdx] || (getValues(`questions.${questionIndex}.categories.0.text`) || '')}
                render={({ field: controllerField }) => (
                  <RadioGroup
                    value={controllerField.value}
                    onValueChange={(val) => handleMatrixCorrectAnswerChange(statementIdx, val)}
                    className="mt-1 flex flex-wrap gap-x-3 gap-y-1"
                  >
                    {(getValues(`questions.${questionIndex}.categories`) || []).map((category: Category, categoryIdx: number) => (
                      <div key={`${statementIdx}-${categoryIdx}`} className="flex items-center space-x-1">
                        <RadioGroupItem value={category.text} id={`q${questionIndex}-s${statementIdx}-c${categoryIdx}`} />
                        <Label htmlFor={`q${questionIndex}-s${statementIdx}-c${categoryIdx}`} className="font-normal text-sm">{category.text}</Label>
                      </div>
                    ))}
                  </RadioGroup>
                )}
              />
            </div>
          </div>
        ))}
        {errors.questions?.[questionIndex]?.statements && typeof errors.questions[questionIndex]?.statements?.message === 'string' && (
          <p className="text-sm text-destructive mt-1">{(errors.questions[questionIndex]?.statements as any)?.message}</p>
        )}
        <Button type="button" onClick={addStatementField} variant="outline" size="sm">
          <PlusCircle className="mr-2 h-4 w-4" /> Add Statement
        </Button>
      </div>
       {/* Error for overall correctAnswer array for this question type (e.g. if length mismatch) */}
       {errors.questions?.[questionIndex]?.correctAnswer && typeof errors.questions[questionIndex]?.correctAnswer?.message === 'string' && (
         <p className="text-sm text-destructive mt-1">{(errors.questions[questionIndex]?.correctAnswer as any)?.message}</p>
      )}
    </div>
  );
}
