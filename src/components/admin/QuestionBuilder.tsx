
'use client';

import type { Control, FieldArrayWithId, UseFieldArrayAppend, UseFieldArrayRemove, UseFormRegister, FieldErrors, UseFormSetValue, UseFormGetValues } from 'react-hook-form';
import { useFieldArray, Controller } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { CardContent } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { Trash2, PlusCircle, Brain, ImageIcon as ImageIconLucide, PencilRuler } from 'lucide-react';
import { QuestionType, type Option as OptionType, type TrueFalseStatement, type Category, type HotspotArea, HotspotShapeType, type MatchingItem } from '@/lib/types';
import { generateAnswerOptionsAI } from '@/lib/actions/testActions';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';


interface QuestionBuilderProps {
  control: Control<any>;
  register: UseFormRegister<any>;
  errors: FieldErrors<any>;
  getValues: UseFormGetValues<any>;
  setValue: UseFormSetValue<any>;
  watch: (name: string | string[]) => any;
}

export function QuestionBuilder({ control, register, errors, getValues, setValue, watch }: QuestionBuilderProps) {
  const { fields, append, remove } = useFieldArray({
    control,
    name: 'questions',
  });
  const { toast } = useToast();

  const addQuestion = () => {
    append({
      text: '',
      type: QuestionType.MCQ,
      imageUrl: '',
      options: [{ text: '' }, { text: '' }],
      statements: [],
      categories: [],
      hotspots: [],
      multipleSelection: false,
      prompts: [],
      choices: [],
      correctAnswer: '',
      points: 1,
    });
  };

  const handleGenerateAIOptions = async (questionIndex: number) => {
    const questionText = getValues(`questions.${questionIndex}.text`);
    const currentCorrectAnswer = getValues(`questions.${questionIndex}.correctAnswer`);
    let correctAnswerForAI: string | undefined;

    if (typeof currentCorrectAnswer === 'string') {
      correctAnswerForAI = currentCorrectAnswer;
    } else if (Array.isArray(currentCorrectAnswer) && currentCorrectAnswer.length > 0 && typeof currentCorrectAnswer[0] === 'string') {
      correctAnswerForAI = currentCorrectAnswer[0];
      toast({ title: "AI Hint", description: "For MCMA/MTF/Matrix, AI generates options based on the first correct answer/statement. Please adjust manually."});
    } else if (Array.isArray(currentCorrectAnswer) && currentCorrectAnswer.length > 0 && typeof currentCorrectAnswer[0] === 'object') {
        const firstMatch = currentCorrectAnswer[0] as { promptId: string, choiceId: string };
        const choice = getValues(`questions.${questionIndex}.choices`)?.find((c: MatchingItem) => c.id === firstMatch.choiceId);
        if (choice) correctAnswerForAI = choice.text;
    }


    if (!questionText || !correctAnswerForAI) {
      toast({
        title: "Missing Information",
        description: "Please provide question text and at least one correct answer text (or first statement's answer for MTF/Matrix) before generating AI options.",
        variant: "destructive",
      });
      return;
    }

    toast({ title: "Generating AI Options...", description: "Please wait a moment."});
    const result = await generateAnswerOptionsAI(questionText, correctAnswerForAI, 4);

    if (result.error) {
      toast({ title: "AI Generation Failed", description: result.error, variant: "destructive" });
    } else if (result.options) {
      const newOptions = result.options.map(optText => ({ text: optText }));
      setValue(`questions.${questionIndex}.options`, newOptions, { shouldValidate: true, shouldDirty: true });

      const questionType = getValues(`questions.${questionIndex}.type`);
      if (questionType === QuestionType.MCQ) {
        const correctOptionIndex = newOptions.findIndex(opt => opt.text.toLowerCase() === correctAnswerForAI!.toLowerCase());
         setValue(`questions.${questionIndex}.correctAnswer`, newOptions[correctOptionIndex !== -1 ? correctOptionIndex : 0]?.text || '', { shouldValidate: true, shouldDirty: true });
      } else if (questionType === QuestionType.MultipleChoiceMultipleAnswer) {
        const correctOptionTexts = newOptions
            .filter(opt => opt.text.toLowerCase() === correctAnswerForAI!.toLowerCase())
            .map(opt => opt.text);
        setValue(`questions.${questionIndex}.correctAnswer`, correctOptionTexts.length > 0 ? correctOptionTexts : [], { shouldValidate: true, shouldDirty: true });
      }
      toast({ title: "AI Options Generated", description: "Review and adjust the options as needed." });
    }
  };

  return (
    <div className="space-y-6">
      <Accordion type="multiple" className="w-full">
        {fields.map((field, index) => {
          const questionType = watch(`questions.${index}.type`);
          const currentImageUrl = watch(`questions.${index}.imageUrl`);
          return (
          <AccordionItem key={field.id} value={field.id}>
             <div className="flex items-center w-full border-b">
               <AccordionTrigger className="flex-grow hover:no-underline text-left justify-start px-2 py-4 text-lg font-medium">
                Question {index + 1}: {getValues(`questions.${index}.text`)?.substring(0,30) || getValues(`questions.${index}.type`)}{getValues(`questions.${index}.text`)?.length > 30 ? "..." : ""} (Points: {getValues(`questions.${index}.points`) || 0})
              </AccordionTrigger>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => remove(index)}
                className="text-destructive hover:bg-destructive/10 ml-auto mr-2 shrink-0"
                aria-label="Remove question"
              >
                <Trash2 className="h-5 w-5" />
              </Button>
            </div>
            <AccordionContent>
              <CardContent className="space-y-4 pt-4">
                <div>
                  <Label htmlFor={`questions.${index}.text`}>Question Text/Prompt</Label>
                  <Textarea
                    id={`questions.${index}.text`}
                    {...register(`questions.${index}.text`)}
                    placeholder="e.g., What is the capital of France? OR Indicate T/F for the following:"
                    className="mt-1"
                  />
                  {errors.questions?.[index]?.text && (
                    <p className="text-sm text-destructive mt-1">{errors.questions[index]?.text?.message}</p>
                  )}
                </div>

                {(questionType === QuestionType.MCQ || questionType === QuestionType.MultipleChoiceMultipleAnswer || questionType === QuestionType.MatchingSelect) && (
                  <div className="space-y-2">
                    <Label htmlFor={`questions.${index}.imageUrl`}>Image URL (Optional)</Label>
                    <Input
                      id={`questions.${index}.imageUrl`}
                      {...register(`questions.${index}.imageUrl`)}
                      placeholder="https://example.com/image.png or /images/my-image.png"
                      className="mt-1"
                    />
                    {errors.questions?.[index]?.imageUrl && (
                      <p className="text-sm text-destructive mt-1">{(errors.questions[index]?.imageUrl as any)?.message}</p>
                    )}
                    {currentImageUrl && (currentImageUrl.startsWith('https://') || currentImageUrl.startsWith('/images/')) && (
                      <div className="mt-2 relative border rounded-md overflow-hidden" style={{ maxWidth: '200px', maxHeight: '150px' }}>
                        <Image src={currentImageUrl} alt="Question image preview" width={200} height={150} style={{ objectFit: 'contain' }} data-ai-hint="question image" />
                      </div>
                    )}
                  </div>
                )}


                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor={`questions.${index}.type`}>Question Type</Label>
                    <Controller
                        name={`questions.${index}.type`}
                        control={control}
                        defaultValue={(field as any).type}
                        render={({ field: controllerField }) => (
                            <Select
                                value={controllerField.value}
                                onValueChange={(value) => {
                                    const newType = value as QuestionType;
                                    controllerField.onChange(newType);

                                    setValue(`questions.${index}.options`, newType === QuestionType.MCQ || newType === QuestionType.MultipleChoiceMultipleAnswer ? [{ text: '' }, { text: '' }] : []);
                                    setValue(`questions.${index}.statements`, newType === QuestionType.MultipleTrueFalse || newType === QuestionType.MatrixChoice ? [{ id: crypto.randomUUID(), text: ''}] : []);
                                    setValue(`questions.${index}.categories`, newType === QuestionType.MatrixChoice ? [{id: crypto.randomUUID(), text: 'Column 1'}, {id: crypto.randomUUID(), text: 'Column 2'}] : []);
                                    setValue(`questions.${index}.imageUrl`, (newType === QuestionType.Hotspot || newType === QuestionType.MCQ || newType === QuestionType.MultipleChoiceMultipleAnswer || newType === QuestionType.MatchingSelect) ? getValues(`questions.${index}.imageUrl`) || '' : undefined);
                                    setValue(`questions.${index}.hotspots`, newType === QuestionType.Hotspot ? [{ id: crypto.randomUUID(), shape: HotspotShapeType.Rectangle, coords: '', label: 'Hotspot 1' }] : []);
                                    setValue(`questions.${index}.multipleSelection`, newType === QuestionType.Hotspot ? false : undefined);
                                    setValue(`questions.${index}.prompts`, newType === QuestionType.MatchingSelect ? [{ id: crypto.randomUUID(), text: ''}] : []);
                                    setValue(`questions.${index}.choices`, newType === QuestionType.MatchingSelect ? [{ id: crypto.randomUUID(), text: ''}] : []);


                                    if (newType === QuestionType.MultipleChoiceMultipleAnswer || (newType === QuestionType.Hotspot && getValues(`questions.${index}.multipleSelection`))) {
                                      setValue(`questions.${index}.correctAnswer`, []);
                                    } else if (newType === QuestionType.MultipleTrueFalse || newType === QuestionType.MatrixChoice) {
                                      const stmts = getValues(`questions.${index}.statements`);
                                      setValue(`questions.${index}.correctAnswer`, stmts ? stmts.map(() => (newType === QuestionType.MultipleTrueFalse ? 'false' : '')) : []);
                                    } else if (newType === QuestionType.MatchingSelect) {
                                      const prompts = getValues(`questions.${index}.prompts`);
                                      setValue(`questions.${index}.correctAnswer`, prompts ? prompts.map((p: MatchingItem) => ({ promptId: p.id, choiceId: ''})) : []);
                                    } else {
                                      setValue(`questions.${index}.correctAnswer`, '');
                                    }
                                }}
                            >
                                <SelectTrigger id={`questions.${index}.type`} className="mt-1">
                                    <SelectValue placeholder="Select type" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value={QuestionType.MCQ}>Multiple Choice (Single Answer)</SelectItem>
                                    <SelectItem value={QuestionType.MultipleChoiceMultipleAnswer}>Multiple Choice (Multiple Answers)</SelectItem>
                                    <SelectItem value={QuestionType.MultipleTrueFalse}>Multiple True/False</SelectItem>
                                    <SelectItem value={QuestionType.MatrixChoice}>Matrix Choice (Grid)</SelectItem>
                                    <SelectItem value={QuestionType.Hotspot}>Hotspot (Clickable Image)</SelectItem>
                                    <SelectItem value={QuestionType.MatchingSelect}>Matching (Select from Dropdown)</SelectItem>
                                    <SelectItem value={QuestionType.ShortAnswer}>Short Answer</SelectItem>
                                    <SelectItem value={QuestionType.TrueFalse}>True/False</SelectItem>
                                </SelectContent>
                            </Select>
                        )}
                    />
                  </div>
                  <div>
                    <Label htmlFor={`questions.${index}.points`}>Points</Label>
                    <Input
                      id={`questions.${index}.points`}
                      type="number"
                      {...register(`questions.${index}.points`, { valueAsNumber: true })}
                      defaultValue={1}
                      min="1"
                      className="mt-1"
                    />
                     {errors.questions?.[index]?.points && (
                      <p className="text-sm text-destructive mt-1">{errors.questions[index]?.points?.message}</p>
                    )}
                  </div>
                </div>

                {(questionType === QuestionType.MCQ || questionType === QuestionType.MultipleChoiceMultipleAnswer) && (
                  <OptionsAndCorrectAnswerBuilder
                    questionIndex={index}
                    control={control}
                    errors={errors}
                    setValue={setValue}
                    getValues={getValues}
                    handleGenerateAIOptions={handleGenerateAIOptions}
                    register={register}
                  />
                )}

                {questionType === QuestionType.MultipleTrueFalse && (
                    <StatementsBuilder
                        questionIndex={index}
                        control={control}
                        register={register}
                        errors={errors}
                        setValue={setValue}
                        getValues={getValues}
                    />
                )}

                {questionType === QuestionType.MatrixChoice && (
                  <MatrixChoiceBuilder
                    questionIndex={index}
                    control={control}
                    register={register}
                    errors={errors}
                    setValue={setValue}
                    getValues={getValues}
                  />
                )}

                {questionType === QuestionType.Hotspot && (
                  <HotspotBuilder
                    questionIndex={index}
                    control={control}
                    register={register}
                    errors={errors}
                    setValue={setValue}
                    getValues={getValues}
                    watch={watch}
                    toast={toast}
                  />
                )}

                {questionType === QuestionType.MatchingSelect && (
                  <MatchingSelectBuilder
                    questionIndex={index}
                    control={control}
                    register={register}
                    errors={errors}
                    setValue={setValue}
                    getValues={getValues}
                  />
                )}


                {questionType === QuestionType.ShortAnswer && (
                  <div>
                    <Label htmlFor={`questions.${index}.correctAnswerSA`}>Correct Answer</Label>
                    <Input
                      id={`questions.${index}.correctAnswerSA`}
                      {...register(`questions.${index}.correctAnswer`)}
                      placeholder="Enter the exact correct answer"
                      className="mt-1"
                    />
                    {errors.questions?.[index]?.correctAnswer && (
                        <p className="text-sm text-destructive mt-1">{(errors.questions[index]?.correctAnswer as any)?.message}</p>
                    )}
                  </div>
                )}

                {questionType === QuestionType.TrueFalse && (
                  <div>
                    <Label>Correct Answer</Label>
                     <Controller
                        name={`questions.${index}.correctAnswer`}
                        control={control}
                        defaultValue={(field as any).correctAnswer as string || 'false'}
                        render={({ field: controllerField }) => (
                            <RadioGroup
                                value={controllerField.value as string}
                                onValueChange={(value) => controllerField.onChange(value)}
                                className="mt-2 flex space-x-4"
                            >
                                <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="true" id={`q${index}-true`} />
                                    <Label htmlFor={`q${index}-true`} className="font-normal">True</Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="false" id={`q${index}-false`} />
                                    <Label htmlFor={`q${index}-false`} className="font-normal">False</Label>
                                </div>
                            </RadioGroup>
                        )}
                    />
                     {errors.questions?.[index]?.correctAnswer && (
                        <p className="text-sm text-destructive mt-1">{(errors.questions[index]?.correctAnswer as any)?.message}</p>
                    )}
                  </div>
                )}
              </CardContent>
            </AccordionContent>
          </AccordionItem>
        );
      })}
      </Accordion>

      <Button type="button" onClick={addQuestion} variant="outline" className="w-full">
        <PlusCircle className="mr-2 h-4 w-4" /> Add Question
      </Button>
    </div>
  );
}


interface OptionsAndCorrectAnswerBuilderProps {
  questionIndex: number;
  control: Control<any>;
  errors: FieldErrors<any>;
  setValue: UseFormSetValue<any>;
  getValues: UseFormGetValues<any>;
  handleGenerateAIOptions: (questionIndex: number) => void;
  register: UseFormRegister<any>;
}

function OptionsAndCorrectAnswerBuilder({ questionIndex, control, errors, setValue, getValues, handleGenerateAIOptions, register }: OptionsAndCorrectAnswerBuilderProps) {
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
                                    id={`q${questionIndex}-opt${optionIndex}-text-input`}
                                    {...register(`questions.${questionIndex}.options.${optionIndex}.text`)}
                                    placeholder={`Option ${optionIndex + 1}`}
                                    className="flex-grow"
                                    onChange={(e) => {
                                        const oldText = getValues(`questions.${questionIndex}.options.${optionIndex}.text`);
                                        const newText = e.target.value;
                                        setValue(`questions.${questionIndex}.options.${optionIndex}.text`, newText, { shouldDirty: true, shouldValidate: true });
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
      )}

      {questionType === QuestionType.MultipleChoiceMultipleAnswer && (
        <div className="space-y-2">
          {optionFields.map((optionField, optionIndex) => (
            <div key={optionField.id} className="flex flex-col space-y-1">
                <div className="flex items-center space-x-2">
                    <Controller
                        name={`questions.${questionIndex}.options.${optionIndex}.text`} 
                        control={control}
                        render={({ }) => ( 
                            <Checkbox
                                id={`q${questionIndex}-opt${optionIndex}-checkbox`}
                                checked={(getValues(`questions.${questionIndex}.correctAnswer`) as string[] || []).includes(getValues(`questions.${questionIndex}.options.${optionIndex}.text`))}
                                onCheckedChange={(checked) => handleMCMACorrectAnswerChange(getValues(`questions.${questionIndex}.options.${optionIndex}.text`), !!checked)}
                            />
                        )}
                    />
                  <Input
                    id={`q${questionIndex}-opt${optionIndex}-text`}
                    {...register(`questions.${questionIndex}.options.${optionIndex}.text`)}
                    placeholder={`Option ${optionIndex + 1}`}
                    className="flex-grow"
                    onChange={(e) => {
                        const oldText = getValues(`questions.${questionIndex}.options.${optionIndex}.text`);
                        const newText = e.target.value;
                        setValue(`questions.${questionIndex}.options.${optionIndex}.text`, newText, { shouldDirty: true, shouldValidate: true });
                        const ca = getValues(`questions.${questionIndex}.correctAnswer`) as string[];
                        if (ca && ca.includes(oldText)) {
                            setValue(`questions.${questionIndex}.correctAnswer`, ca.map(ans => ans === oldText ? newText : ans), { shouldDirty: true, shouldValidate: true });
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
        </div>
      )}
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

interface StatementsBuilderProps {
  questionIndex: number;
  control: Control<any>;
  register: UseFormRegister<any>;
  errors: FieldErrors<any>;
  setValue: UseFormSetValue<any>;
  getValues: UseFormGetValues<any>;
}

function StatementsBuilder({ questionIndex, control, register, errors, setValue, getValues }: StatementsBuilderProps) {
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
      ))}
      {errors.questions?.[questionIndex]?.statements && typeof errors.questions[questionIndex]?.statements?.message === 'string' && (
         <p className="text-sm text-destructive mt-1">{(errors.questions[questionIndex]?.statements as any)?.message}</p>
      )}
       {errors.questions?.[questionIndex]?.correctAnswer && typeof errors.questions[questionIndex]?.correctAnswer?.message === 'string' && (
         <p className="text-sm text-destructive mt-1">{(errors.questions[questionIndex]?.correctAnswer as any)?.message}</p>
      )}


      <Button type="button" onClick={addStatementField} variant="outline" size="sm">
        <PlusCircle className="mr-2 h-4 w-4" /> Add Statement
      </Button>
    </div>
  );
}


interface MatrixChoiceBuilderProps {
  questionIndex: number;
  control: Control<any>;
  register: UseFormRegister<any>;
  errors: FieldErrors<any>;
  setValue: UseFormSetValue<any>;
  getValues: UseFormGetValues<any>;
}

function MatrixChoiceBuilder({ questionIndex, control, register, errors, setValue, getValues }: MatrixChoiceBuilderProps) {
  const { fields: statementFields, append: appendStatement, remove: removeStatement } = useFieldArray({
    control,
    name: `questions.${questionIndex}.statements` as const,
  });
  const { fields: categoryFields, append: appendCategory, remove: removeCategory } = useFieldArray({
    control,
    name: `questions.${questionIndex}.categories` as const,
  });

  const handleMatrixCorrectAnswerChange = (statementIdx: number, categoryText: string) => {
    const currentCorrectAnswers = (getValues(`questions.${questionIndex}.correctAnswer`) as string[]) || [];
    const newCorrectAnswers = [...currentCorrectAnswers];
    newCorrectAnswers[statementIdx] = categoryText;
    setValue(`questions.${questionIndex}.correctAnswer`, newCorrectAnswers, { shouldValidate: true, shouldDirty: true });
  };

  const addStatementField = () => {
    appendStatement({ id: crypto.randomUUID(), text: '' });
    const currentCorrectAnswers = (getValues(`questions.${questionIndex}.correctAnswer`) as string[]) || [];
    const firstCategoryText = getValues(`questions.${questionIndex}.categories.0.text`) || '';
    setValue(`questions.${questionIndex}.correctAnswer`, [...currentCorrectAnswers, firstCategoryText], { shouldValidate: true, shouldDirty: true });
  };

  const removeStatementField = (statementIdx: number) => {
    removeStatement(statementIdx);
    const currentCorrectAnswers = (getValues(`questions.${questionIndex}.correctAnswer`) as string[]) || [];
    const newCorrectAnswers = currentCorrectAnswers.filter((_, i) => i !== statementIdx);
    setValue(`questions.${questionIndex}.correctAnswer`, newCorrectAnswers, { shouldValidate: true, shouldDirty: true });
  };

  const addCategoryField = () => {
    appendCategory({ id: crypto.randomUUID(), text: `Column ${categoryFields.length + 1}` });
  };

  const removeCategoryField = (categoryIdx: number) => {
    const removedCategoryText = getValues(`questions.${questionIndex}.categories.${categoryIdx}.text`);
    removeCategory(categoryIdx);
    const currentCorrectAnswers = (getValues(`questions.${questionIndex}.correctAnswer`) as string[]) || [];
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

                const currentCorrectAnswers = getValues(`questions.${questionIndex}.correctAnswer`) as string[];
                if (currentCorrectAnswers && currentCorrectAnswers.includes(oldText)) {
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
       {errors.questions?.[questionIndex]?.correctAnswer && typeof errors.questions[questionIndex]?.correctAnswer?.message === 'string' && (
         <p className="text-sm text-destructive mt-1">{(errors.questions[questionIndex]?.correctAnswer as any)?.message}</p>
      )}
    </div>
  );
}

interface HotspotBuilderProps {
  questionIndex: number;
  control: Control<any>;
  register: UseFormRegister<any>;
  errors: FieldErrors<any>;
  setValue: UseFormSetValue<any>;
  getValues: UseFormGetValues<any>;
  watch: (name: string | string[]) => any;
  toast: ({ title, description, variant }: { title: string; description?: string; variant?: 'default' | 'destructive' }) => void;
}

function HotspotBuilder({ questionIndex, control, register, errors, setValue, getValues, watch, toast }: HotspotBuilderProps) {
  const { fields: hotspotFields, append: appendHotspot, remove: removeHotspot } = useFieldArray({
    control,
    name: `questions.${questionIndex}.hotspots` as const,
  });

  const imageUrl = watch(`questions.${questionIndex}.imageUrl`);
  const multipleSelection = watch(`questions.${questionIndex}.multipleSelection`);

  // State for drawing
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPoint, setStartPoint] = useState<{ x: number; y: number } | null>(null);
  const [currentRect, setCurrentRect] = useState<{ x: number; y: number; width: number; height: number } | null>(null);
  const [naturalImageSize, setNaturalImageSize] = useState<{ width: number; height: number } | null>(null);
  
  const imageContainerRef = useRef<HTMLDivElement>(null);
  const imageElementRef = useRef<HTMLImageElement>(null);


  const handleImageMouseDown = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!imageUrl || !imageContainerRef.current) return;
    event.preventDefault(); 
    const rect = imageContainerRef.current.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    setIsDrawing(true);
    setStartPoint({ x, y });
    setCurrentRect({ x, y, width: 0, height: 0 });
  };

  const handleImageMouseMove = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!isDrawing || !startPoint || !imageContainerRef.current) return;
    const containerRect = imageContainerRef.current.getBoundingClientRect();
    const currentX = event.clientX - containerRect.left;
    const currentY = event.clientY - containerRect.top;
    
    const constrainedX = Math.max(0, Math.min(currentX, containerRect.width));
    const constrainedY = Math.max(0, Math.min(currentY, containerRect.height));

    const newRect = {
      x: Math.min(startPoint.x, constrainedX),
      y: Math.min(startPoint.y, constrainedY),
      width: Math.abs(constrainedX - startPoint.x),
      height: Math.abs(constrainedY - startPoint.y),
    };
    setCurrentRect(newRect);
  };

  const handleImageMouseUpOrLeave = () => {
    if (isDrawing) {
      setIsDrawing(false);
      if (currentRect && (currentRect.width < 5 || currentRect.height < 5)) {
          setCurrentRect(null); 
          toast({ title: "Hotspot too small", description: "Please draw a larger rectangle.", variant: "default" });
      }
      // Keep currentRect so user can click "Add Drawn Hotspot"
    }
  };

  const handleAddDrawnHotspot = () => {
    if (!currentRect || !imageElementRef.current || currentRect.width < 5 || currentRect.height < 5) {
      toast({ title: "No valid rectangle drawn", description: "Please draw a sufficiently large rectangle on the image first.", variant: "destructive" });
      return;
    }
  
    const img = imageElementRef.current;
    if (!naturalImageSize || naturalImageSize.width === 0 || naturalImageSize.height === 0) {
      toast({ title: "Image error", description: "Cannot determine natural image dimensions. Ensure image is loaded.", variant: "destructive" });
      return;
    }
    
    const displayedWidth = img.offsetWidth;
    const displayedHeight = img.offsetHeight;

    if (displayedWidth === 0 || displayedHeight === 0) {
      toast({ title: "Image display error", description: "Cannot determine displayed image dimensions.", variant: "destructive" });
      return;
    }
  
    // Normalize coordinates based on displayed size relative to natural size.
    // The drawn currentRect coordinates are relative to the displayed image.
    // We need to map these to the 0-1 range based on the natural dimensions.
    // This assumes the image display maintains aspect ratio (object-fit: contain helps)

    const normX = currentRect.x / displayedWidth;
    const normY = currentRect.y / displayedHeight;
    const normWidth = currentRect.width / displayedWidth;
    const normHeight = currentRect.height / displayedHeight;
  
    const coordsString = `${normX.toFixed(4)},${normY.toFixed(4)},${normWidth.toFixed(4)},${normHeight.toFixed(4)}`;
  
    appendHotspot({
      id: crypto.randomUUID(),
      shape: HotspotShapeType.Rectangle,
      coords: coordsString,
      label: `Drawn Hotspot ${hotspotFields.length + 1}`,
    });
  
    setCurrentRect(null);
    setStartPoint(null);
    toast({ title: "Hotspot Added", description: "The drawn rectangle has been added as a hotspot." });
  };


  const handleCorrectHotspotChange = (hotspotId: string, checked: boolean) => {
    let currentCorrectAnswers = getValues(`questions.${questionIndex}.correctAnswer`);
    if (!multipleSelection) {
      setValue(`questions.${questionIndex}.correctAnswer`, checked ? hotspotId : '', { shouldValidate: true, shouldDirty: true });
    } else {
      currentCorrectAnswers = Array.isArray(currentCorrectAnswers) ? currentCorrectAnswers : [];
      let newCorrectAnswers: string[];
      if (checked) {
        newCorrectAnswers = [...currentCorrectAnswers, hotspotId];
      } else {
        newCorrectAnswers = currentCorrectAnswers.filter((id: string) => id !== hotspotId);
      }
      setValue(`questions.${questionIndex}.correctAnswer`, newCorrectAnswers, { shouldValidate: true, shouldDirty: true });
    }
  };

  const addHotspotField = () => {
    appendHotspot({ id: crypto.randomUUID(), shape: HotspotShapeType.Rectangle, coords: '', label: `Hotspot ${hotspotFields.length + 1}` });
  };
  
  // Reset drawing state if image URL changes
  useEffect(() => {
    setCurrentRect(null);
    setStartPoint(null);
    setIsDrawing(false);
    setNaturalImageSize(null);
  }, [imageUrl]);

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor={`questions.${questionIndex}.imageUrl`}>Image URL (HTTPS or local /images/...)</Label>
        <Input
          id={`questions.${questionIndex}.imageUrl`}
          {...register(`questions.${questionIndex}.imageUrl`)}
          placeholder="https://example.com/image.png or /images/my-image.png"
          className="mt-1"
        />
        {errors.questions?.[questionIndex]?.imageUrl && (
          <p className="text-sm text-destructive mt-1">{(errors.questions[questionIndex]?.imageUrl as any)?.message}</p>
        )}
      </div>
      
      {imageUrl && (imageUrl.startsWith('https://') || imageUrl.startsWith('/images/')) && (
        <div className="space-y-2">
          <Label>Draw Hotspot (Rectangles Only)</Label>
          <div
            ref={imageContainerRef}
            className="relative w-full max-w-md mx-auto aspect-video border rounded-md overflow-hidden cursor-crosshair bg-muted/20"
            onMouseDown={handleImageMouseDown}
            onMouseMove={handleImageMouseMove}
            onMouseUp={handleImageMouseUpOrLeave}
            onMouseLeave={handleImageMouseUpOrLeave}
            data-ai-hint="interactive map editor"
          >
            <Image
              ref={imageElementRef}
              src={imageUrl}
              alt="Hotspot image preview for drawing"
              fill
              style={{ objectFit: 'contain' }} // Important for aspect ratio
              draggable={false}
              onDragStart={(e) => e.preventDefault()}
              className="pointer-events-none" // Image itself should not capture mouse events meant for container
              onLoad={(e) => {
                const imgTarget = e.target as HTMLImageElement;
                setNaturalImageSize({ width: imgTarget.naturalWidth, height: imgTarget.naturalHeight });
              }}
            />
            {currentRect && imageContainerRef.current && (
              <svg
                className="absolute top-0 left-0 w-full h-full pointer-events-none"
                // viewBox={`0 0 ${imageContainerRef.current.offsetWidth} ${imageContainerRef.current.offsetHeight}`} // Not needed if rect coords are direct pixels
              >
                <rect
                  x={currentRect.x}
                  y={currentRect.y}
                  width={currentRect.width}
                  height={currentRect.height}
                  className="fill-primary/30 stroke-primary stroke-2"
                />
              </svg>
            )}
          </div>
          <Button
            type="button"
            onClick={handleAddDrawnHotspot}
            disabled={!currentRect || currentRect.width < 5 || currentRect.height < 5}
            size="sm"
            variant="outline"
            className="w-full"
          >
            <PencilRuler className="mr-2 h-4 w-4" /> Add Drawn Rectangle as Hotspot
          </Button>
        </div>
      )}


      <div className="flex items-center space-x-2">
        <Controller
            name={`questions.${questionIndex}.multipleSelection`}
            control={control}
            defaultValue={false}
            render={({ field }) => (
                <Switch
                    id={`questions.${questionIndex}.multipleSelection`}
                    checked={field.value}
                    onCheckedChange={(checked) => {
                        field.onChange(checked);
                        setValue(`questions.${questionIndex}.correctAnswer`, checked ? [] : '', { shouldValidate: true });
                    }}
                />
            )}
        />
        <Label htmlFor={`questions.${questionIndex}.multipleSelection`}>Allow multiple correct hotspots</Label>
      </div>

      <Label>Defined Hotspots (Select correct ones)</Label>
      {hotspotFields.map((hotspotField, hotspotIdx) => (
        <div key={hotspotField.id} className="p-3 border rounded-md space-y-2">
          <div className="flex items-center space-x-2">
            <Label htmlFor={`questions.${questionIndex}.hotspots.${hotspotIdx}.label`} className="sr-only">Hotspot Label</Label>
            <Input
              id={`questions.${questionIndex}.hotspots.${hotspotIdx}.label`}
              {...register(`questions.${questionIndex}.hotspots.${hotspotIdx}.label`)}
              placeholder={`Label (e.g., Area 1)`}
              className="flex-grow"
            />
            <Controller
              name={`questions.${questionIndex}.hotspots.${hotspotIdx}.shape`}
              control={control}
              defaultValue={(hotspotField as any).shape}
              render={({ field }) => (
                <Select onValueChange={field.onChange} value={field.value}>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="Shape" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={HotspotShapeType.Rectangle}>Rectangle</SelectItem>
                    <SelectItem value={HotspotShapeType.Circle}>Circle</SelectItem>
                    <SelectItem value={HotspotShapeType.Polygon}>Polygon</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
            <Button type="button" variant="ghost" size="icon" onClick={() => removeHotspot(hotspotIdx)} className="text-destructive">
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
          <div>
            <Label htmlFor={`questions.${questionIndex}.hotspots.${hotspotIdx}.coords`}>
              Normalized Coordinates (0-1 range, comma-separated)
            </Label>
            <Input
              id={`questions.${questionIndex}.hotspots.${hotspotIdx}.coords`}
              {...register(`questions.${questionIndex}.hotspots.${hotspotIdx}.coords`)}
              placeholder={
                getValues(`questions.${questionIndex}.hotspots.${hotspotIdx}.shape`) === HotspotShapeType.Rectangle ? "x,y,width,height (e.g., 0.1,0.1,0.2,0.1)" :
                getValues(`questions.${questionIndex}.hotspots.${hotspotIdx}.shape`) === HotspotShapeType.Circle ? "cx,cy,r (e.g., 0.5,0.5,0.05)" :
                "x1,y1,x2,y2,x3,y3,... (e.g., 0.1,0.1,0.2,0.1,0.15,0.2)"
              }
              className="mt-1"
            />
            {errors.questions?.[questionIndex]?.hotspots?.[hotspotIdx]?.coords && (
              <p className="text-sm text-destructive mt-1">{(errors.questions[questionIndex]?.hotspots as any)?.[hotspotIdx]?.coords?.message}</p>
            )}
          </div>
          <div className="flex items-center space-x-2 pt-1">
            <Checkbox
              id={`q${questionIndex}-hs${hotspotIdx}-correct`}
              checked={
                multipleSelection
                ? (getValues(`questions.${questionIndex}.correctAnswer`) as string[] || []).includes(getValues(`questions.${questionIndex}.hotspots.${hotspotIdx}.id`))
                : getValues(`questions.${questionIndex}.correctAnswer`) === getValues(`questions.${questionIndex}.hotspots.${hotspotIdx}.id`)
              }
              onCheckedChange={(checked) => handleCorrectHotspotChange(getValues(`questions.${questionIndex}.hotspots.${hotspotIdx}.id`), !!checked)}
            />
            <Label htmlFor={`q${questionIndex}-hs${hotspotIdx}-correct`} className="font-normal">
              Correct Hotspot
            </Label>
          </div>
        </div>
      ))}
      {errors.questions?.[questionIndex]?.hotspots && typeof errors.questions[questionIndex]?.hotspots?.message === 'string' && (
         <p className="text-sm text-destructive mt-1">{(errors.questions[questionIndex]?.hotspots as any)?.message}</p>
      )}
      {errors.questions?.[questionIndex]?.correctAnswer && (errors.questions?.[questionIndex]?.correctAnswer as any)?.message && (
         <p className="text-sm text-destructive mt-1">{(errors.questions[questionIndex]?.correctAnswer as any)?.message}</p>
      )}
      <Button type="button" onClick={addHotspotField} variant="outline" size="sm">
        <PlusCircle className="mr-2 h-4 w-4" /> Add Hotspot Area Manually
      </Button>
    </div>
  );
}

interface MatchingSelectBuilderProps {
  questionIndex: number;
  control: Control<any>;
  register: UseFormRegister<any>;
  errors: FieldErrors<any>;
  setValue: UseFormSetValue<any>;
  getValues: UseFormGetValues<any>;
}

function MatchingSelectBuilder({ questionIndex, control, register, errors, setValue, getValues }: MatchingSelectBuilderProps) {
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
    if (!Array.isArray(currentCorrectAnswers) || currentCorrectAnswers.length !== prompts.length) {
      const newCorrectAnswers = prompts.map((prompt: MatchingItem) => {
        const existingMatch = Array.isArray(currentCorrectAnswers) ? currentCorrectAnswers.find((ca: any) => ca.promptId === prompt.id) : null;
        return { promptId: prompt.id, choiceId: existingMatch ? existingMatch.choiceId : '' };
      });
      setValue(`questions.${questionIndex}.correctAnswer`, newCorrectAnswers, { shouldValidate: true });
    }
  }, [prompts, questionIndex, setValue, getValues]);

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
    const currentCorrectAnswers = getValues(`questions.${questionIndex}.correctAnswer`) as Array<{promptId: string, choiceId: string}> || [];
    setValue(`questions.${questionIndex}.correctAnswer`, [...currentCorrectAnswers, { promptId: newPromptId, choiceId: '' }], { shouldValidate: true, shouldDirty: true });
  };

  const removePromptField = (promptIdx: number) => {
    const promptIdToRemove = getValues(`questions.${questionIndex}.prompts.${promptIdx}.id`);
    removePrompt(promptIdx);
    const currentCorrectAnswers = getValues(`questions.${questionIndex}.correctAnswer`) as Array<{promptId: string, choiceId: string}> || [];
    setValue(`questions.${questionIndex}.correctAnswer`, currentCorrectAnswers.filter(match => match.promptId !== promptIdToRemove), { shouldValidate: true, shouldDirty: true });
  };

  const addChoiceField = () => {
    appendChoice({ id: crypto.randomUUID(), text: '' });
  };

  const removeChoiceField = (choiceIdx: number) => {
    const choiceIdToRemove = getValues(`questions.${questionIndex}.choices.${choiceIdx}.id`);
    removeChoice(choiceIdx);
    const currentCorrectAnswers = getValues(`questions.${questionIndex}.correctAnswer`) as Array<{promptId: string, choiceId: string}> || [];
    setValue(`questions.${questionIndex}.correctAnswer`, currentCorrectAnswers.map(match => match.choiceId === choiceIdToRemove ? {...match, choiceId: ''} : match), { shouldValidate: true, shouldDirty: true });
  };

  return (
    <div className="space-y-6">
      {/* Prompts Section */}
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

      {/* Choices Section */}
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

      {/* Correct Matches Section */}
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
                      {choices.map((choice: MatchingItem) => (
                        <SelectItem key={choice.id} value={choice.id || ''}>{choice.text}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
          ))}
           {errors.questions?.[questionIndex]?.correctAnswer && (
            <p className="text-sm text-destructive mt-1">{(errors.questions[questionIndex]?.correctAnswer as any)?.message || (errors.questions[questionIndex]?.correctAnswer as any)?.[0]?.choiceId?.message}</p>
          )}
        </div>
      )}
    </div>
  );
}



