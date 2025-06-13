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
    swap: swapDraggable,
  } = useFieldArray({
    control,
    name: `questions.${questionIndex}.draggableItems`,
  });

  const {
 fields: targetFields,
    append: appendTarget,
    remove: removeTarget,
    swap: swapTarget,
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
        if (type === 'draggable') {
          swapDraggable(oldIndex, newIndex);
        } else {
          swapTarget(oldIndex, newIndex);
        }
      }
    }
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
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => removeDraggable(index)}
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
            onClick={() => appendDraggable({ text: '' }, { shouldFocus: false, shouldDirty: true })}
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
                        onClick={() => removeTarget(index)}
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
            onClick={() => appendTarget({ text: '' })}
          >
            <PlusCircle className="mr-2 h-4 w-4" /> Add Target Item
          </Button>
        </div>
      </div>

      {/* Correct Pairings - Assuming index-based matching for now */}
      <div className="mt-6">
        <h4 className="text-lg font-medium mb-2">Correct Pairings (Index-based)</h4>
        <p className="text-sm text-gray-600 mb-4">Items are matched by their order in the lists above (e.g., Draggable Item 1 matches Target Item 1).</p>
        {draggableFields.length > 0 && targetFields.length > 0 && (
             <div className="grid grid-cols-2 gap-4 max-w-md">
                <div className="font-semibold">Draggable Index</div>
                <div className="font-semibold">Matches Target Index</div>
                {draggableFields.map((_, index) => (
                    <div key={index} className="contents">
                        <div>{index + 1}</div>
                        <div>{index + 1}</div>
                    </div>
                ))}
             </div>
        )}
         {draggableFields.length !== targetFields.length && (
            <p className="text-sm text-orange-600 mt-2">Warning: The number of draggable items ({draggableFields.length}) and target items ({targetFields.length}) do not match. This may cause issues.</p>
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