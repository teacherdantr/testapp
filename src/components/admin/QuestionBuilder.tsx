
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
import { Trash2, PlusCircle, Brain, ArrowUpCircle, ArrowDownCircle } from 'lucide-react';
import { QuestionType, type MatchingItem } from '@/lib/types';
import { generateAnswerOptionsAI } from '@/lib/actions/testActions';
import { generateAnswerOptionsAI as generateAnswerOptionsAINew } from '@/lib/actions/test/aiActions';
import { useToast } from '@/hooks/use-toast';
import Image from 'next/image';

// Import the new question type builders
import { McqOptionsBuilder } from './QuestionBuilders/McqOptionsBuilder';
import { McmaOptionsBuilder } from './QuestionBuilders/McmaOptionsBuilder';
import { MtfStatementsBuilder } from './QuestionBuilders/MtfStatementsBuilder';
import { MatrixChoiceGridBuilder } from './QuestionBuilders/MatrixChoiceGridBuilder';
import { HotspotImageBuilder } from './QuestionBuilders/HotspotImageBuilder';
import { MatchingSelectItemsBuilder } from './QuestionBuilders/MatchingSelectItemsBuilder';
import { ShortAnswerBuilder } from './QuestionBuilders/ShortAnswerBuilder';
import { TrueFalseSelector } from './QuestionBuilders/TrueFalseSelector';
import { handleGenerateAIOptions } from './questionUtils';


interface QuestionBuilderProps {
  control: Control<any>;
  register: UseFormRegister<any>;
  errors: FieldErrors<any>;
  getValues: UseFormGetValues<any>;
  setValue: UseFormSetValue<any>;
  watch: (name: string | string[]) => any;
}

export function QuestionBuilder({ control, register, errors, getValues, setValue, watch }: QuestionBuilderProps) {
  const { fields, append, remove, swap } = useFieldArray({
    control,
    name: 'questions',
  });
  const { toast } = useToast();

  const addQuestion = () => {
    append({
      text: '',
      type: QuestionType.MCQ,
      imageUrl: '',
      options: [{ id: crypto.randomUUID(), text: '' }, { id: crypto.randomUUID(), text: '' }],
      statements: [],
      categories: [],
      hotspots: [],
      multipleSelection: false,
      prompts: [],
      choices: [],
      draggableItems: [],
      targetItems: [],
      allowShuffle: true,
      correctAnswer: '',
      points: 1,
    });
  };

  const handlePasteIntoQuestionText = (event: React.ClipboardEvent<HTMLTextAreaElement>, questionIndex: number) => {
    const pastedText = event.clipboardData.getData('text/plain');
    const lines = pastedText.split('\n').map(line => line.trim());

    let questionText = pastedText;
    let potentialItemLines: string[] = [];
    let questionBreakPoint = -1;

    // Find the last line ending with '?' or ':' to be the question
    for (let i = lines.length - 1; i >= 0; i--) {
      if (lines[i].endsWith('?') || lines[i].endsWith(':')) {
        questionBreakPoint = i;
        break;
      }
    }

    if (questionBreakPoint !== -1) {
      questionText = lines.slice(0, questionBreakPoint + 1).join('\n');
      potentialItemLines = lines.slice(questionBreakPoint + 1).filter(line => line.length > 0);
    } else if (lines.length > 1 && (lines[0].endsWith('?') || lines[0].endsWith(':'))) {
        // If no line ends with ?/: but the first line does, and there are subsequent lines
        questionText = lines[0];
        potentialItemLines = lines.slice(1).filter(line => line.length > 0);
    }

    setValue(`questions.${questionIndex}.text`, questionText, { shouldValidate: true, shouldDirty: true });
    const questionType = getValues(`questions.${questionIndex}.type`);

    if (potentialItemLines.length > 0) {
      event.preventDefault(); // Prevent default paste only if we're also handling options/statements

      if (questionType === QuestionType.MCQ || questionType === QuestionType.MultipleChoiceMultipleAnswer) {
        const newOptions = potentialItemLines.map(line => ({ id: crypto.randomUUID(), text: line }));
        setValue(`questions.${questionIndex}.options`, newOptions, { shouldValidate: true, shouldDirty: true });
        if (questionType === QuestionType.MCQ) {
          setValue(`questions.${questionIndex}.correctAnswer`, newOptions.length > 0 ? newOptions[0].text : '', { shouldValidate: true, shouldDirty: true });
        } else { // MCMA
          setValue(`questions.${questionIndex}.correctAnswer`, [], { shouldValidate: true, shouldDirty: true });
        }
        toast({ title: "Pasted!", description: "Question and options populated."});
      } else if (questionType === QuestionType.MultipleTrueFalse || questionType === QuestionType.MatrixChoice) {
        const newStatements = potentialItemLines.map(line => ({ id: crypto.randomUUID(), text: line }));
        setValue(`questions.${questionIndex}.statements`, newStatements, { shouldValidate: true, shouldDirty: true });
        if (questionType === QuestionType.MultipleTrueFalse) {
          setValue(`questions.${questionIndex}.correctAnswer`, newStatements.map(() => 'false'), { shouldValidate: true, shouldDirty: true });
        } else { // MatrixChoice
          const firstCategoryText = getValues(`questions.${questionIndex}.categories.0.text`) || '';
          setValue(`questions.${questionIndex}.correctAnswer`, newStatements.map(() => firstCategoryText), { shouldValidate: true, shouldDirty: true });
        }
        toast({ title: "Pasted!", description: "Question and statements populated."});
      } else if (questionText !== pastedText) { // Question was split, but type doesn't auto-populate items from question paste
        toast({ title: "Pasted!", description: "Question text populated. Options/statements not auto-filled for this question type from main text paste."});
      }
    } else if (questionText !== pastedText) { // Only question text was changed due to splitting
        event.preventDefault();
        toast({ title: "Pasted!", description: "Question text populated."});
    }
    // If questionText is the same as pastedText (no split occurred and no items populated), allow default paste.
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
                  Question {index + 1}: {getValues(`questions.${index}.text`)?.substring(0, 30) || getValues(`questions.${index}.type`)}{getValues(`questions.${index}.text`)?.length > 30 ? "..." : ""} (Points: {getValues(`questions.${index}.points`) || 0})
                </AccordionTrigger>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => swap(index, index - 1)}
                  disabled={index === 0}
                  className="text-muted-foreground hover:text-primary ml-auto shrink-0"
                  aria-label="Move question up"
                >
                  <ArrowUpCircle className="h-5 w-5" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => swap(index, index + 1)}
                  disabled={index === fields.length - 1}
                  className="text-muted-foreground hover:text-primary shrink-0"
                  aria-label="Move question down"
                >
                  <ArrowDownCircle className="h-5 w-5" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => remove(index)}
                  className="text-destructive hover:bg-destructive/10 shrink-0 mr-2"
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
                      onPaste={(e) => handlePasteIntoQuestionText(e, index)}
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

                              // Clear all optional data fields first to prevent carrying over old data structures
                              setValue(`questions.${index}.options`, []);
                              setValue(`questions.${index}.statements`, []);
                              setValue(`questions.${index}.categories`, []);
                              setValue(`questions.${index}.hotspots`, []);
                              setValue(`questions.${index}.prompts`, []);
                              setValue(`questions.${index}.choices`, []);
                              setValue(`questions.${index}.draggableItems`, []);
                              setValue(`questions.${index}.targetItems`, []);

                              // Set default values for the new type
                              if (newType === QuestionType.MCQ || newType === QuestionType.MultipleChoiceMultipleAnswer) {
                                setValue(`questions.${index}.options`, [{ id: crypto.randomUUID(), text: '' }, { id: crypto.randomUUID(), text: '' }]);
                              } else if (newType === QuestionType.MultipleTrueFalse) {
                                setValue(`questions.${index}.statements`, [{ id: crypto.randomUUID(), text: '' }]);
                              } else if (newType === QuestionType.MatrixChoice) {
                                setValue(`questions.${index}.statements`, [{ id: crypto.randomUUID(), text: '' }]);
                                setValue(`questions.${index}.categories`, [{ id: crypto.randomUUID(), text: 'Column 1' }, { id: crypto.randomUUID(), text: 'Column 2' }]);
                              } else if (newType === QuestionType.Hotspot) {
                                setValue(`questions.${index}.hotspots`, [{ id: crypto.randomUUID(), shape: 'rect', coords: '', label: 'Hotspot 1' }]);
                                setValue(`questions.${index}.multipleSelection`, false);
                              } else if (newType === QuestionType.MatchingSelect) {
                                setValue(`questions.${index}.prompts`, [{ id: crypto.randomUUID(), text: '' }]);
                                setValue(`questions.${index}.choices`, [{ id: crypto.randomUUID(), text: '' }]);
                              } else if (newType === QuestionType.MatchingDragAndDrop) {
                                setValue(`questions.${index}.draggableItems`, [{ id: crypto.randomUUID(), text: '' }]);
                                setValue(`questions.${index}.targetItems`, [{ id: crypto.randomUUID(), text: '' }]);
                                setValue(`questions.${index}.allowShuffle`, true);
                              }

                              // Conditional cleanup for imageUrl
                              if (![QuestionType.Hotspot, QuestionType.MCQ, QuestionType.MultipleChoiceMultipleAnswer, QuestionType.MatchingSelect].includes(newType)) {
                                setValue(`questions.${index}.imageUrl`, undefined);
                              }
                              
                              // Reset correctAnswer based on the new type
                              if (newType === QuestionType.MultipleChoiceMultipleAnswer || (newType === QuestionType.Hotspot && getValues(`questions.${index}.multipleSelection`))) {
                                setValue(`questions.${index}.correctAnswer`, []);
                              } else if (newType === QuestionType.MultipleTrueFalse) {
                                const stmts = getValues(`questions.${index}.statements`);
                                setValue(`questions.${index}.correctAnswer`, stmts ? stmts.map(() => 'false') : []);
                              } else if (newType === QuestionType.MatrixChoice) {
                                const stmts = getValues(`questions.${index}.statements`);
                                const firstCategory = getValues(`questions.${index}.categories.0.text`) || '';
                                setValue(`questions.${index}.correctAnswer`, stmts ? stmts.map(() => firstCategory) : []);
                              } else if (newType === QuestionType.MatchingSelect) {
                                const prompts = getValues(`questions.${index}.prompts`);
                                setValue(`questions.${index}.correctAnswer`, prompts ? prompts.map((p: MatchingItem) => ({ promptId: p.id, choiceId: '' })) : []);
                              } else if (newType === QuestionType.MatchingDragAndDrop) {
                                const draggables = getValues(`questions.${index}.draggableItems`) || [];
                                const targets = getValues(`questions.${index}.targetItems`) || [];
                                const correctAnswer = targets.map((target: any, idx: number) => ({
                                  draggableItemId: draggables[idx]?.id || '',
                                  targetItemId: target.id || ''
                                }));
                                setValue(`questions.${index}.correctAnswer`, correctAnswer);
                              }
                              else {
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
                              <SelectItem value={QuestionType.MatchingDragAndDrop}>Matching (Drag and Drop)</SelectItem>
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

                  {/* Render specific builder based on question type */}
                  {questionType === QuestionType.MCQ && (
                    <McqOptionsBuilder
                      questionIndex={index}
                      control={control}
                      errors={errors}
                      setValue={setValue}
                      getValues={getValues}
                      handleGenerateAIOptions={() => handleGenerateAIOptions(questionIndex, getValues, setValue, toast)}
                      register={register}
                    />
                  )}

                  {questionType === QuestionType.MultipleChoiceMultipleAnswer && (
                    <McmaOptionsBuilder
                      questionIndex={index}
                      control={control}
                      errors={errors}
                      setValue={setValue}
                      getValues={getValues}
                      handleGenerateAIOptions={() => handleGenerateAIOptions(questionIndex, getValues, setValue, toast)}
                      register={register}
                    />
                  )}

                  {questionType === QuestionType.MultipleTrueFalse && (
                    <MtfStatementsBuilder
                      questionIndex={index}
                      control={control}
                      register={register}
                      errors={errors}
                      setValue={setValue}
                      getValues={getValues}
                    />
                  )}


                  {questionType === QuestionType.MatrixChoice && (
                    <MatrixChoiceGridBuilder
                      questionIndex={index}
                      control={control}
                      register={register}
                      errors={errors}
                      setValue={setValue}
                      getValues={getValues}
                    />
                  )}


                  {questionType === QuestionType.Hotspot && (
                    <HotspotImageBuilder
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
                    <MatchingSelectItemsBuilder
                      questionIndex={index}
                      control={control}
                      register={register}
                      errors={errors}
                      setValue={setValue}
                      getValues={getValues}
                    />
                  )}

                  {questionType === QuestionType.MatchingDragAndDrop && (
                    <MatchingDragAndDropBuilder
                      questionIndex={index}
                      control={control}
                      register={register}
                      errors={errors}
                      setValue={setValue}
                      getValues={getValues}
                    />
                  )}


                  {questionType === QuestionType.ShortAnswer && (
                    <ShortAnswerBuilder
                      questionIndex={index}
                      register={register}
                      errors={errors}
                    />
                  )}


                  {questionType === QuestionType.TrueFalse && (
                    <TrueFalseSelector
                      questionIndex={index}
                      control={control}
                      errors={errors}
                    />
                  )}
                  {/* General error for correctAnswer if not caught by specific builders */}
                  {errors.questions?.[index]?.correctAnswer && (
                    <p className="text-sm text-destructive mt-1">{(errors.questions[index]?.correctAnswer as any)?.message}</p>
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
