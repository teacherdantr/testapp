
'use client';

import React, { useEffect } from 'react';
import type { Control, FieldErrors, UseFormGetValues, UseFormRegister, UseFormSetValue } from 'react-hook-form';
import { useFieldArray } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Trash2, PlusCircle, GripVertical } from 'lucide-react';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core';
import { SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// Helper component for a single sortable pair
const SortablePair = ({ id, index, onRemove, register, errors, questionIndex }: any) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : 'auto',
  };

  return (
    <div ref={setNodeRef} style={style} className="flex items-start gap-2 p-3 border rounded-md bg-background">
      <button type="button" {...listeners} {...attributes} className="cursor-grab p-1 mt-1.5 text-muted-foreground hover:text-foreground">
        <GripVertical className="h-5 w-5" />
      </button>
      <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <Label htmlFor={`questions.${questionIndex}.targetItems.${index}.text`}>Prompt / Target</Label>
          <Input
            id={`questions.${questionIndex}.targetItems.${index}.text`}
            {...register(`questions.${questionIndex}.targetItems.${index}.text`)}
            placeholder={`Prompt ${index + 1}`}
            className="mt-1"
          />
          {errors.questions?.[questionIndex]?.targetItems?.[index]?.text && (
            <p className="text-sm text-destructive mt-1">
              {(errors.questions[questionIndex]?.targetItems?.[index]?.text as any)?.message}
            </p>
          )}
        </div>
        <div>
          <Label htmlFor={`questions.${questionIndex}.draggableItems.${index}.text`}>Matching Item (Draggable)</Label>
          <Input
            id={`questions.${questionIndex}.draggableItems.${index}.text`}
            {...register(`questions.${questionIndex}.draggableItems.${index}.text`)}
            placeholder={`Matching Item ${index + 1}`}
            className="mt-1"
          />
          {errors.questions?.[questionIndex]?.draggableItems?.[index]?.text && (
            <p className="text-sm text-destructive mt-1">
              {(errors.questions[questionIndex]?.draggableItems?.[index]?.text as any)?.message}
            </p>
          )}
        </div>
      </div>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={onRemove}
        className="shrink-0 text-destructive mt-6"
        aria-label="Remove pair"
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );
};

export function MatchingDragAndDropBuilder({ questionIndex, control, register, errors, setValue, getValues }: any) {
  
  const { fields: targetFields, append: appendTarget, remove: removeTarget, move: moveTarget } = useFieldArray({
    control, name: `questions.${questionIndex}.targetItems`
  });
  const { fields: draggableFields, append: appendDraggable, remove: removeDraggable, move: moveDraggable } = useFieldArray({
    control, name: `questions.${questionIndex}.draggableItems`
  });

  const sensors = useSensors(useSensor(PointerSensor), useSensor(KeyboardSensor));

  const addPair = () => {
    const newTargetId = crypto.randomUUID();
    const newDraggableId = crypto.randomUUID();
    // These updates will trigger the useEffect to sync the correctAnswer
    appendTarget({ id: newTargetId, text: '' });
    appendDraggable({ id: newDraggableId, text: '' });
  };

  const removePair = (index: number) => {
    // These updates will trigger the useEffect to sync the correctAnswer
    removeTarget(index);
    removeDraggable(index);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = targetFields.findIndex(field => field.id === active.id);
      const newIndex = targetFields.findIndex(field => field.id === over.id);
      
      // These updates will trigger the useEffect to sync the correctAnswer
      moveTarget(oldIndex, newIndex);
      moveDraggable(oldIndex, newIndex);
    }
  };
  
  // This useEffect is the single source of truth for synchronizing the correctAnswer array.
  useEffect(() => {
    const targets = getValues(`questions.${questionIndex}.targetItems`) || [];
    const draggables = getValues(`questions.${questionIndex}.draggableItems`) || [];
    
    // Only update if the arrays are in a consistent state
    if (targets.length === draggables.length) {
      const newCorrectAnswer = targets.map((target: any, index: number) => {
        const draggable = draggables[index];
        // Ensure both items exist before creating a pair
        if (target && draggable && target.id && draggable.id) {
          return {
            targetItemId: target.id,
            draggableItemId: draggable.id,
          };
        }
        return null; // Return null for invalid pairs
      }).filter(Boolean); // Filter out any nulls

      // Only set the value if the generated answer length matches, preventing partial updates
      if (newCorrectAnswer.length === targets.length) {
         setValue(`questions.${questionIndex}.correctAnswer`, newCorrectAnswer, { shouldValidate: true, shouldDirty: true });
      }
    }
  }, [targetFields, draggableFields, questionIndex, getValues, setValue]);


  return (
    <div className="space-y-4">
      <div>
        <Label>Matching Pairs</Label>
        <p className="text-sm text-muted-foreground">
          Create pairs of prompts and their corresponding draggable items. The correct answer is defined by the order you set here. You can re-order the pairs by dragging them.
        </p>
      </div>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={targetFields} strategy={verticalListSortingStrategy}>
          <div className="space-y-3">
            {targetFields.map((field, index) => (
              <SortablePair
                key={field.id}
                id={field.id}
                index={index}
                onRemove={() => removePair(index)}
                register={register}
                errors={errors}
                questionIndex={questionIndex}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>
      
      <Button type="button" variant="outline" size="sm" onClick={addPair} className="mt-2">
        <PlusCircle className="mr-2 h-4 w-4" /> Add Pair
      </Button>
      
      {errors.questions?.[questionIndex]?.correctAnswer && (
        <p className="text-sm text-destructive mt-1">
          {(errors.questions[questionIndex]?.correctAnswer as any)?.message}
        </p>
      )}

      <div className="mt-4 space-y-4">
         <div className="flex items-center space-x-2">
           <Checkbox
            id={`questions.${questionIndex}.allowShuffle`}
            {...register(`questions.${questionIndex}.allowShuffle`)}
            defaultChecked={true}
           />
          <Label htmlFor={`questions.${questionIndex}.allowShuffle`}>Shuffle draggable items for the student</Label>
        </div>

        <div>
          <Label htmlFor={`questions.${questionIndex}.explanation`}>Explanation/Feedback (Optional)</Label>
          <Textarea
            id={`questions.${questionIndex}.explanation`}
            {...register(`questions.${questionIndex}.explanation`)}
            placeholder="Provide an explanation shown after the test."
            className="mt-1"
          />
        </div>
      </div>
    </div>
  );
}
