'use client';

import type { Control, FieldErrors, UseFormGetValues, UseFormRegister, UseFormSetValue } from 'react-hook-form';
import { useFieldArray } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Trash2, PlusCircle, GripVertical } from 'lucide-react';
import { SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { CSS } from '@dnd-kit/utilities';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import {
  Select, // Import Select
  SelectContent, // Import SelectContent
  SelectItem, // Import SelectItem
  SelectTrigger, // Import SelectTrigger
  SelectValue, // Import SelectValue
} from '@/components/ui/select'; // Import the select components


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
    <div ref={setNodeRef} style={style} {...attributes} className={`flex items-center ${className}`}>
      <button type="button" {...listeners} className="cursor-grab mr-2 text-gray-500 hover:text-gray-700">
        <GripVertical className="h-4 w-4" />
      </button>
      <div className="flex-grow">{children}</div>
    </div>
  );
};

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
    // swap: swapDraggable, // Not used in this modified version for now
  } = useFieldArray({
    control,
    name: `questions.${questionIndex}.draggableItems`,
  });

  const {
    fields: targetFields,
    append: appendTarget,
    remove: removeTarget,
    // swap: swapTarget, // Not used in this modified version for now
  } = useFieldArray({
    control,
    name: `questions.${questionIndex}.targetItems`,
  });

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: (event) => {
        // Simple coordinate getter for keyboard sorting
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

  const handleDragEnd = (event: any, type: 'draggable' | 'target') => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const items = type === 'draggable' ? draggableFields : targetFields;
      const oldIndex = items.findIndex((item) => item.id === active.id);
      const newIndex = items.findIndex((item) => item.id === over.id);

      if (oldIndex !== -1 && newIndex !== -1) {
        // We are no longer using swap from useFieldArray directly after drag end
        // We need to manually update the form state based on the new order
        const currentItems = getValues(`questions.${questionIndex}.${type === 'draggable' ? 'draggableItems' : 'targetItems'}`);
        const [movedItem] = currentItems.splice(oldIndex, 1);
        currentItems.splice(newIndex, 0, movedItem);
        setValue(`questions.${questionIndex}.${type === 'draggable' ? 'draggableItems' : 'targetItems'}`, currentItems, { shouldDirty: true });

        // If draggable items were reordered, update the correctAnswer array to reflect the new order
        if (type === 'draggable') {
            const currentCorrectAnswer = getValues(`questions.${questionIndex}.correctAnswer`) || [];
             const newCorrectAnswer = currentItems.map((draggableItem: any) => {
                 // Find the existing pairing for this draggable item's ID
                 const existingMatch = currentCorrectAnswer.find((match: any) => match.promptId === draggableItem.id);
                 // Return the existing match or a new object with empty choiceId if not found
                 return existingMatch || { promptId: draggableItem.id, choiceId: '' };
             });
             setValue(`questions.${questionIndex}.correctAnswer`, newCorrectAnswer, { shouldDirty: true });
        }
      }
    }
  };

  // Function to handle updating the correct answer when a pairing is selected
  const handleCorrectAnswerChange = (draggableItemId: string, targetItemId: string) => {
      const currentCorrectAnswer = getValues(`questions.${questionIndex}.correctAnswer`) || [];
      const existingMatchIndex = currentCorrectAnswer.findIndex((match: any) => match.promptId === draggableItemId);

      const newCorrectAnswer = [...currentCorrectAnswer];

      if (existingMatchIndex > -1) {
          // Update existing match
          newCorrectAnswer[existingMatchIndex] = { promptId: draggableItemId, choiceId: targetItemId };
      } else {
          // Add new match
          newCorrectAnswer.push({ promptId: draggableItemId, choiceId: targetItemId });
      }

      setValue(`questions.${questionIndex}.correctAnswer`, newCorrectAnswer, { shouldDirty: true });
  };

  // Get the current correct answer for a given draggable item ID
  const getCorrectAnswerForDraggable = (draggableItemId: string) => {
      const currentCorrectAnswer = getValues(`questions.${questionIndex}.correctAnswer`) || [];
      const match = currentCorrectAnswer.find((match: any) => match.promptId === draggableItemId);
      return match ? match.choiceId : '';
  };


  return (
    <div className="space-y-4">
      {/* Question Text is handled in the parent QuestionBuilder */}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Draggable Items Column */}
        <div>
          <Label>Draggable Items (Left Column)</Label>
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={(event) => handleDragEnd(event, 'draggable')}
          >
            <SortableContext items={draggableFields.map(f => f.id)} strategy={verticalListSortingStrategy}>
              <ul className="space-y-2 mt-1">
                {draggableFields.map((field, index) => (
                  <SortableItem key={field.id} id={field.id}>
                    <div className="flex items-center gap-2">
                      <Input
                        {...register(`questions.${questionIndex}.draggableItems.${index}.text`)}
                        placeholder={`Item ${index + 1}`}
                        className="flex-grow"
                      />
                       {/* Select for choosing matching target */}
                       <Select
                          onValueChange={(value) => handleCorrectAnswerChange(field.id!, value)}
                          value={getCorrectAnswerForDraggable(field.id!)}
                       >
                          <SelectTrigger className="w-[180px]">
                              <SelectValue placeholder="Select Target" />
                          </SelectTrigger>
                          <SelectContent>
                              {/* Option for no selection */}
                              <SelectItem value="">No Match</SelectItem>
                              {targetFields.map((targetField) => (
                                  <SelectItem key={targetField.id} value={targetField.id!}>
                                      {targetField.text || `Target ${targetFields.findIndex(t => t.id === targetField.id) + 1}`}
                                  </SelectItem>
                              ))}
                          </SelectContent>
                       </Select>
                      <Button
                        type="button"
                        variant="outline"\n                        size="icon"\n                        onClick={() => {
                            removeDraggable(index);
                            // Also remove this item's pairing from correctAnswer
                            const currentCorrectAnswer = getValues(`questions.${questionIndex}.correctAnswer`) || [];
                            const newCorrectAnswer = currentCorrectAnswer.filter((match: any) => match.promptId !== field.id);
                            setValue(`questions.${questionIndex}.correctAnswer`, newCorrectAnswer, { shouldDirty: true });
                        }}
                        className="shrink-0"\n                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                    {errors.questions?.[questionIndex]?.draggableItems?.[index]?.text && (
                      <p className="text-sm text-destructive mt-1">
                        {(errors.questions[questionIndex]?.draggableItems?.[index]?.text as any)?.message}
                      </p>
                    )}
                  </SortableItem>
                ))}\n              </ul>\n            </SortableContext>\n          </DndContext>\n          <Button
            type="button"
            variant="outline"
            size="sm"
            className="mt-4"
            onClick={() => {
                appendDraggable({ id: crypto.randomUUID(), text: '' }, { shouldFocus: false, shouldDirty: true });
                // Add a new entry to correctAnswer with the new draggable item ID and empty choiceId
                const currentCorrectAnswer = getValues(`questions.${questionIndex}.correctAnswer`) || [];
                setValue(`questions.${questionIndex}.correctAnswer`, [...currentCorrectAnswer, { promptId: crypto.randomUUID(), choiceId: '' }], { shouldDirty: true });
            }}
          >
            <PlusCircle className="mr-2 h-4 w-4" /> Add Draggable Item
          </Button>
        </div>

        {/* Target Items Column */}
        <div>
          <Label>Target Items (Right Column)</Label>
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={(event) => handleDragEnd(event, 'target')}
          >
            <SortableContext items={targetFields.map(f => f.id)} strategy={verticalListSortingStrategy}>
              <ul className="space-y-2 mt-1">
                {targetFields.map((field, index) => (
                   <SortableItem key={field.id} id={field.id}>
                    <div className="flex items-center gap-2">
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
                            removeTarget(index);
                             // Also remove any pairings that used this target item
                             const currentCorrectAnswer = getValues(`questions.${questionIndex}.correctAnswer`) || [];
                             const newCorrectAnswer = currentCorrectAnswer.map((match: any) => {
                                 if (match.choiceId === field.id) {
                                     return { ...match, choiceId: '' }; // Set to empty if this target was selected
                                 }
                                 return match;
                             });
                             setValue(`questions.${questionIndex}.correctAnswer`, newCorrectAnswer, { shouldDirty: true });
                        }}
                        className="shrink-0"\n                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                     {errors.questions?.[questionIndex]?.targetItems?.[index]?.text && (\n                      <p className=\"text-sm text-destructive mt-1\">
                        {(errors.questions[questionIndex]?.targetItems?.[index]?.text as any)?.message}
                      </p>
                    )}
                   </SortableItem>
                ))}\n              </ul>\n            </SortableContext>\n          </DndContext>\n          <Button
            type="button"
            variant="outline"
            size="sm"
            className="mt-4"
            onClick={() => appendTarget({ id: crypto.randomUUID(), text: '' }, { shouldFocus: false, shouldDirty: true })}
          >
            <PlusCircle className="mr-2 h-4 w-4" /> Add Target Item
          </Button>
        </div>
      </div>

      {/* Correct Pairings - This section will now be managed by the Select components */}
      <div className="mt-6">
        <h4 className="text-lg font-medium mb-2">Correct Pairings</h4>
        <p className="text-sm text-gray-600 mb-4">Use the dropdown next to each draggable item to select its matching target item.</p>
         {/* Display current pairings for review */}
        {draggableFields.length > 0 && (
             <div className=\"grid grid-cols-2 gap-4 max-w-md\">
                <div className=\"font-semibold\">Draggable Item</div>
                <div className=\"font-semibold\">Matches Target Item</div>
                {draggableFields.map((draggableField, index) => {
                    const matchedTargetId = getCorrectAnswerForDraggable(draggableField.id!);
                    const matchedTarget = targetFields.find(tf => tf.id === matchedTargetId);
                    return (
                        <div key={draggableField.id} className=\"contents\">
                            <div>{draggableField.text || `Item ${index + 1}`}</div>
                            <div>{matchedTarget ? matchedTarget.text || `Target ${targetFields.findIndex(t => t.id === matchedTargetId) + 1}` : 'No Match Selected'}</div>
                        </div>
                    );
                })}
             </div>
        )}
         {draggableFields.length > 0 && targetFields.length > 0 && draggableFields.length !== targetFields.length && (
            <p className="text-sm text-orange-600 mt-2">Warning: The number of draggable items ({draggableFields.length}) and target items ({targetFields.length}) do not match. Ensure you have a target for each draggable item if required.</p>
         )}
         {/* Add validation message if not all prompts are matched */}
         {errors.questions?.[questionIndex]?.correctAnswer && (
            <p className="text-sm text-destructive mt-1">
              {(errors.questions[questionIndex]?.correctAnswer as any)?.message || 'Please ensure all draggable items have a selected target.'}
            </p>
         )}
      </div>


      {/* Optional Fields */}
      <div className="space-y-4 mt-6">
        <div className="flex items-center space-x-2">
          <Checkbox
            id={`questions.${questionIndex}.allowShuffle`}
            {...register(`questions.${questionIndex}.allowShuffle`, {
              onChange: () => setValue(`questions.${questionIndex}.allowShuffle`, getValues(`questions.${questionIndex}.allowShuffle`), { shouldDirty: true }),
            })}

          />
          <Label htmlFor={`questions.${questionIndex}.allowShuffle`}>Shuffle draggable items on display</Label>
        </div>

        <div>
          <Label htmlFor={`questions.${questionIndex}.explanation`}>Explanation/Feedback (Optional)</Label>
          <Textarea
            id={`questions.${questionIndex}.explanation`}
            {...register(`questions.${questionIndex}.explanation`, {
              onChange: () => setValue(`questions.${questionIndex}.explanation`, getValues(`questions.${questionIndex}.explanation`), { shouldDirty: true }),
            })}
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
