
'use client';

import React, { useState, useEffect } from 'react'; // Added useEffect
import type { Control, FieldErrors, UseFormGetValues, UseFormRegister, UseFormSetValue } from 'react-hook-form';
import { useFieldArray, Controller } from 'react-hook-form'; // Correctly import Controller here
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Trash2, PlusCircle, GripVertical } from 'lucide-react';
import { SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { CSS } from '@dnd-kit/utilities';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'; // Keep other select imports here


interface MatchingDragAndDropBuilderProps {
  questionIndex: number;
  control: Control<any>;
  register: UseFormRegister<any>;
  errors: FieldErrors<any>;
  setValue: UseFormSetValue<any>;
  getValues: UseFormGetValues<any>;
}

// Helper component for sortable items
const SortableItem = ({ id, children, className }: { id: string; children: React.ReactNode; className?: string }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 1 : 0,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} className={`flex items-center ${className || ''}`}>
      <button type="button" {...listeners} className="cursor-grab mr-2 text-gray-500 hover:text-gray-700">
        <GripVertical className="h-4 w-4" />
      </button>
      <div className="flex-grow">{children}</div>
    </div>
  );
};

const NO_MATCH_PLACEHOLDER_VALUE = "__NO_MATCH_PLACEHOLDER__";

export function MatchingDragAndDropBuilder({
  questionIndex,
  control,
  register,
  errors,
  setValue,
  getValues,
}: MatchingDragAndDropBuilderProps) {
  const {
    fields: draggableFields,
    append: appendDraggable,
    remove: removeDraggable,
    move: moveDraggable, // Added move function
  } = useFieldArray({
    control,
    name: `questions.${questionIndex}.draggableItems`,
    keyName: "dndItemId" // Use a different keyName to avoid conflicts with default 'id'
  });

  const {
    fields: targetFields,
    append: appendTarget,
    remove: removeTarget,
    move: moveTarget, // Added move function
  } = useFieldArray({
    control,
    name: `questions.${questionIndex}.targetItems`,
    keyName: "dndTargetId" // Use a different keyName
  });

  // Initialize correctAnswer as an array if it's not already
  useEffect(() => {
    const currentDraggableItems = getValues(`questions.${questionIndex}.draggableItems`) || [];
    const currentCorrectAnswer = getValues(`questions.${questionIndex}.correctAnswer`);
    if (!Array.isArray(currentCorrectAnswer) || currentCorrectAnswer.length !== currentDraggableItems.length) {
      const newCorrectAnswer = currentDraggableItems.map((item: any) => ({
        draggableItemId: item.id || crypto.randomUUID(), // Ensure item.id exists
        targetItemId: ''
      }));
      setValue(`questions.${questionIndex}.correctAnswer`, newCorrectAnswer, { shouldValidate: false });
    }
  }, [draggableFields, questionIndex, getValues, setValue]);


  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: (event) => {
        if (event.code === 'ArrowUp' || event.code === 'ArrowDown') {
          return {
            x: 0,
            y: event.code === 'ArrowUp' ? -1 : 1,
          };
        }
        return null;
      },
    })
  );

  const handleDragEnd = (event: DragEndEvent, type: 'draggable' | 'target') => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const items = type === 'draggable' ? draggableFields : targetFields;
      const moveFn = type === 'draggable' ? moveDraggable : moveTarget;

      const oldIndex = items.findIndex((item) => item.id === active.id);
      const newIndex = items.findIndex((item) => item.id === over.id);

      if (oldIndex !== -1 && newIndex !== -1) {
        moveFn(oldIndex, newIndex);
        if (type === 'draggable') {
            // Re-order the correctAnswer array to match the new draggableItems order
            const reorderedDraggableItems = getValues(`questions.${questionIndex}.draggableItems`);
            const currentCorrectAnswer = getValues(`questions.${questionIndex}.correctAnswer`) || [];
            
            const newCorrectAnswer = reorderedDraggableItems.map((draggableItem: any) => {
                const existingMatch = currentCorrectAnswer.find((match: any) => match.draggableItemId === draggableItem.id);
                return existingMatch || { draggableItemId: draggableItem.id, targetItemId: '' };
            });
            setValue(`questions.${questionIndex}.correctAnswer`, newCorrectAnswer, { shouldDirty: true, shouldValidate: true });
        }
      }
    }
  };

  const handleCorrectAnswerChange = (draggableItemId: string, targetItemIdToSet: string) => {
      const currentCorrectAnswer = getValues(`questions.${questionIndex}.correctAnswer`) || [];
      const existingMatchIndex = currentCorrectAnswer.findIndex((match: any) => match.draggableItemId === draggableItemId);
      const finalTargetItemId = targetItemIdToSet === NO_MATCH_PLACEHOLDER_VALUE ? '' : targetItemIdToSet;

      const newCorrectAnswer = [...currentCorrectAnswer];

      if (existingMatchIndex > -1) {
          newCorrectAnswer[existingMatchIndex] = { draggableItemId: draggableItemId, targetItemId: finalTargetItemId };
      } else {
          // This case might happen if a draggable item was added but correctAnswer wasn't synced yet.
          // This should ideally be handled by useEffect ensuring correctAnswer is always synced.
          newCorrectAnswer.push({ draggableItemId: draggableItemId, targetItemId: finalTargetItemId });
      }
      setValue(`questions.${questionIndex}.correctAnswer`, newCorrectAnswer, { shouldDirty: true, shouldValidate: true });
  };

  const getCorrectAnswerForDraggable = (draggableItemId: string): string => {
      const currentCorrectAnswer = getValues(`questions.${questionIndex}.correctAnswer`) || [];
      const match = currentCorrectAnswer.find((match: any) => match.draggableItemId === draggableItemId);
      // If a match exists and targetItemId is not null/undefined, return it. Otherwise, return the placeholder.
      return match && match.targetItemId != null ? match.targetItemId : NO_MATCH_PLACEHOLDER_VALUE;
  };

  return (
    <div className="space-y-4">
      {/* Question Text is handled in the parent QuestionBuilder */}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Draggable Items Column */}
        <div>
          <Label>Draggable Items (Left Column - will be matched to targets)</Label>
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={(event) => handleDragEnd(event, 'draggable')}
          >
            <SortableContext items={draggableFields.map(f => f.id)} strategy={verticalListSortingStrategy}>
              <ul className="space-y-2 mt-1">
                {draggableFields.map((field, index) => (
                  <SortableItem key={field.id} id={field.id}>
                    <div className="flex items-center gap-2 w-full">
                      <Input
                        {...register(`questions.${questionIndex}.draggableItems.${index}.text`)}
                        placeholder={`Item ${index + 1}`}
                        className="flex-grow"
                      />
                       <Controller
                            name={`questions.${questionIndex}.correctAnswer.${index}.targetItemId`}
                            control={control}
                            defaultValue={getCorrectAnswerForDraggable(field.id!)}
                            render={({ field: controllerField }) => (
                                <Select
                                    onValueChange={(value) => {
                                        controllerField.onChange(value); // Update Controller's internal state
                                        handleCorrectAnswerChange(field.id!, value); // Update the overall form state
                                    }}
                                    value={controllerField.value === '' ? NO_MATCH_PLACEHOLDER_VALUE : controllerField.value}
                                >
                                    <SelectTrigger className="w-[180px]">
                                        <SelectValue placeholder="Select Target" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value={NO_MATCH_PLACEHOLDER_VALUE}>No Match</SelectItem>
                                        {targetFields.map((targetField, targetIdx) => (
                                            <SelectItem key={targetField.id} value={targetField.id!}>
                                                {targetField.text || `Target ${targetIdx + 1}`}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            )}
                        />
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => {
                            const draggableItemIdToRemove = field.id;
                            removeDraggable(index);
                            const currentCorrectAnswer = getValues(`questions.${questionIndex}.correctAnswer`) || [];
                            const newCorrectAnswer = currentCorrectAnswer.filter((match: any) => match.draggableItemId !== draggableItemIdToRemove);
                            setValue(`questions.${questionIndex}.correctAnswer`, newCorrectAnswer, { shouldDirty: true, shouldValidate: true });
                        }}
                        className="shrink-0"
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                    {errors.questions?.[questionIndex]?.draggableItems?.[index]?.text && (
                      <p className="text-sm text-destructive mt-1">
                        {(errors.questions[questionIndex]?.draggableItems?.[index]?.text as any)?.message}
                      </p>
                    )}
                  </SortableItem>
                ))}
              </ul>
            </SortableContext>
          </DndContext>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="mt-4"
            onClick={() => {
                const newDraggableId = crypto.randomUUID();
                appendDraggable({ id: newDraggableId, text: '' } as any, { shouldFocus: false });
                const currentCorrectAnswer = getValues(`questions.${questionIndex}.correctAnswer`) || [];
                setValue(`questions.${questionIndex}.correctAnswer`, [...currentCorrectAnswer, { draggableItemId: newDraggableId, targetItemId: '' }], { shouldDirty: true, shouldValidate: true });
            }}
          >
            <PlusCircle className="mr-2 h-4 w-4" /> Add Draggable Item
          </Button>
        </div>

        {/* Target Items Column */}
        <div>
          <Label>Target Items (Right Column - where draggable items are matched to)</Label>
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={(event) => handleDragEnd(event, 'target')}
          >
            <SortableContext items={targetFields.map(f => f.id)} strategy={verticalListSortingStrategy}>
              <ul className="space-y-2 mt-1">
                {targetFields.map((field, index) => (
                   <SortableItem key={field.id} id={field.id}>
                    <div className="flex items-center gap-2 w-full">
                      <Input
                        {...register(`questions.${questionIndex}.targetItems.${index}.text`)}
                        placeholder={`Target ${index + 1}`}
                        className="flex-grow"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => {
                             const targetIdToRemove = field.id;
                             removeTarget(index);
                             const currentCorrectAnswer = getValues(`questions.${questionIndex}.correctAnswer`) || [];
                             const newCorrectAnswer = currentCorrectAnswer.map((match: any) => {
                                 if (match.targetItemId === targetIdToRemove) {
                                     return { ...match, targetItemId: '' }; // Reset to "No Match"
                                 }
                                 return match;
                             });
                             setValue(`questions.${questionIndex}.correctAnswer`, newCorrectAnswer, { shouldDirty: true, shouldValidate: true });
                        }}
                        className="shrink-0"
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                     {errors.questions?.[questionIndex]?.targetItems?.[index]?.text && (
                      <p className="text-sm text-destructive mt-1">
                        {(errors.questions[questionIndex]?.targetItems?.[index]?.text as any)?.message}
                      </p>
                    )}
                   </SortableItem>
                ))}
              </ul>
            </SortableContext>
          </DndContext>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="mt-4"
            onClick={() => appendTarget({ id: crypto.randomUUID(), text: '' } as any, { shouldFocus: false })}
          >
            <PlusCircle className="mr-2 h-4 w-4" /> Add Target Item
          </Button>
        </div>
      </div>

      <div className="mt-6">
        <h4 className="text-lg font-medium mb-2">Correct Pairings Review</h4>
        <p className="text-sm text-gray-600 mb-4">Use the dropdown next to each draggable item to select its matching target item. This section helps review the pairings.</p>
        {draggableFields.length > 0 && (
             <div className="grid grid-cols-2 gap-x-4 gap-y-2 max-w-md border p-3 rounded-md">
                <div className="font-semibold text-sm">Draggable Item</div>
                <div className="font-semibold text-sm">Matches Target Item</div>
                {draggableFields.map((draggableField, index) => {
                    const currentCorrectAnswers = getValues(`questions.${questionIndex}.correctAnswer`) || [];
                    const matchedPair = currentCorrectAnswers.find((pair: any) => pair.draggableItemId === draggableField.id);
                    const matchedTargetId = matchedPair ? matchedPair.targetItemId : '';
                    const matchedTarget = targetFields.find(tf => tf.id === matchedTargetId);

                    return (
                        <React.Fragment key={draggableField.id}>
                            <div className="text-sm truncate" title={draggableField.text || `Item ${index + 1}`}>{draggableField.text || `Item ${index + 1}`}</div>
                            <div className="text-sm truncate" title={matchedTarget ? matchedTarget.text || `Target ${targetFields.findIndex(t => t.id === matchedTargetId) + 1}` : (matchedTargetId === '' ? 'No Match Selected' : 'Invalid Target ID')}>
                                {matchedTarget ? (matchedTarget.text || `Target ${targetFields.findIndex(t => t.id === matchedTargetId) + 1}`) : (matchedTargetId === '' || matchedTargetId === NO_MATCH_PLACEHOLDER_VALUE ? <span className="italic text-muted-foreground">No Match Selected</span> : <span className="italic text-red-500">Invalid Target</span>)}
                            </div>
                        </React.Fragment>
                    );
                })}
             </div>
        )}
         {errors.questions?.[questionIndex]?.correctAnswer && (
            <p className="text-sm text-destructive mt-1">
              {(errors.questions[questionIndex]?.correctAnswer as any)?.message || 'Please ensure all draggable items have a selected target or "No Match".'}
            </p>
         )}
         {errors.questions?.[questionIndex]?.draggableItems?.message && (
            <p className="text-sm text-destructive mt-1">
              Draggable Items: {(errors.questions[questionIndex]?.draggableItems as any)?.message}
            </p>
         )}
          {errors.questions?.[questionIndex]?.targetItems?.message && (
            <p className="text-sm text-destructive mt-1">
              Target Items: {(errors.questions[questionIndex]?.targetItems as any)?.message}
            </p>
         )}
      </div>

      <div className="space-y-4 mt-6">
        <div className="flex items-center space-x-2">
          <Controller
            name={`questions.${questionIndex}.allowShuffle`}
            control={control}
            defaultValue={false}
            render={({ field }) => (
              <Checkbox
                id={`questions.${questionIndex}.allowShuffle`}
                checked={field.value}
                onCheckedChange={field.onChange}
              />
            )}
          />
          <Label htmlFor={`questions.${questionIndex}.allowShuffle`}>Shuffle draggable items on display</Label>
        </div>

        <div>
          <Label htmlFor={`questions.${questionIndex}.explanation`}>Explanation/Feedback (Optional)</Label>
          <Textarea
            id={`questions.${questionIndex}.explanation`}
            {...register(`questions.${questionIndex}.explanation`)}
            placeholder="Provide an explanation shown after the test."
            className="mt-1"
          />
           {errors.questions?.[questionIndex]?.explanation && (
            <p className="text-sm text-destructive mt-1">{(errors.questions[questionIndex]?.explanation as any)?.message}</p>
          )}
        </div>
      </div>
    </div>
  );
}

    