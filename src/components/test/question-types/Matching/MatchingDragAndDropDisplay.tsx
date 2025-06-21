
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  DndContext,
  DragOverlay,
  useSensor,
  useSensors,
  PointerSensor,
  KeyboardSensor,
  type DragStartEvent,
  type DragEndEvent,
} from '@dnd-kit/core';
import { SortableContext, useSortable, arrayMove } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { cn } from '@/lib/utils';
import type { QuestionTypeDisplayProps } from '../QuestionTypeDisplayProps';
import type { MatchingItem } from '@/lib/types';
import { GripVertical } from 'lucide-react';

// Draggable Item Component
function Draggable({ id, item }: { id: string, item: MatchingItem }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="flex items-center p-2 bg-card border rounded-md shadow-sm cursor-grab touch-none select-none active:cursor-grabbing"
    >
      <GripVertical className="h-5 w-5 text-muted-foreground mr-2" />
      <span>{item.text}</span>
    </div>
  );
}

// Droppable Target Component
function Droppable({ id, children, promptText }: { id: string; children?: React.ReactNode, promptText: string }) {
  const { setNodeRef, isOver } = useSortable({ id });

  return (
    <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
      <div className="text-base text-foreground text-right font-medium">{promptText}</div>
      <div className="w-8 text-center text-muted-foreground">↔</div>
      <div
        ref={setNodeRef}
        className={cn(
          "h-14 border-2 border-dashed rounded-md flex items-center justify-center p-2 text-muted-foreground",
          isOver ? "border-primary bg-primary/10" : "border-input"
        )}
      >
        {children || <span className="text-sm italic">Drop here</span>}
      </div>
    </div>
  );
}


export function MatchingDragAndDropDisplay({ question, userAnswer, onAnswerChange, testMode }: QuestionTypeDisplayProps) {
  const [bankItems, setBankItems] = useState<MatchingItem[]>([]);
  const [slotItems, setSlotItems] = useState<(MatchingItem | null)[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);

  const allDraggableItems = useMemo(() => question.draggableItems || [], [question.draggableItems]);
  const allTargetItems = useMemo(() => question.targetItems || [], [question.targetItems]);

  const sensors = useSensors(useSensor(PointerSensor), useSensor(KeyboardSensor));

  // Initialize state from userAnswer or question data
  useEffect(() => {
    let initialSlots = Array(allTargetItems.length).fill(null);
    const usedDraggableIds = new Set<string>();

    if (userAnswer) {
      try {
        const parsed: Array<{ draggableItemId: string, targetItemId: string | null }> = JSON.parse(userAnswer);
        parsed.forEach(match => {
          if (match.targetItemId) {
            const targetIndex = allTargetItems.findIndex(t => t.id === match.targetItemId);
            const draggableItem = allDraggableItems.find(d => d.id === match.draggableItemId);
            if (targetIndex > -1 && draggableItem) {
              initialSlots[targetIndex] = draggableItem;
              usedDraggableIds.add(draggableItem.id);
            }
          }
        });
      } catch (e) {
        console.error("Failed to parse user answer for DND:", e);
      }
    }
    setSlotItems(initialSlots);

    const initialBank = allDraggableItems.filter(d => !usedDraggableIds.has(d.id));
    setBankItems(question.allowShuffle !== false ? [...initialBank].sort(() => Math.random() - 0.5) : initialBank);
    
  }, [userAnswer, allDraggableItems, allTargetItems, question.allowShuffle]);


  const activeItem = useMemo(() => allDraggableItems.find(item => item.id === activeId), [activeId, allDraggableItems]);

  const onDragStart = (event: DragStartEvent) => setActiveId(event.active.id as string);

  const onDragEnd = (event: DragEndEvent) => {
    setActiveId(null);
    const { active, over } = event;
    if (!over) return;
    if (active.id === over.id) return;
    
    const overIsBank = over.id === 'bank';
    const overIsSlot = allTargetItems.some(t => t.id === over.id);

    const activeItem = allDraggableItems.find(item => item.id === active.id);
    if (!activeItem) return;

    let newBank = [...bankItems];
    let newSlots = [...slotItems];

    // Remove active item from its current location
    const wasInBank = newBank.some(item => item.id === active.id);
    if (wasInBank) {
      newBank = newBank.filter(item => item.id !== active.id);
    } else {
      const slotIndex = newSlots.findIndex(item => item?.id === active.id);
      if (slotIndex > -1) newSlots[slotIndex] = null;
    }

    // Place active item in its new location
    if (overIsBank) {
      newBank.push(activeItem);
    } else if (overIsSlot) {
      const overSlotIndex = allTargetItems.findIndex(t => t.id === over.id);
      if (overSlotIndex > -1) {
        const itemAlreadyInSlot = newSlots[overSlotIndex];
        if (itemAlreadyInSlot) {
          // Swap: item from slot goes to bank
          newBank.push(itemAlreadyInSlot);
        }
        newSlots[overSlotIndex] = activeItem;
      }
    }

    setBankItems(newBank);
    setSlotItems(newSlots);

    // Update form state
    const newAnswerArray = allTargetItems.map((target, index) => ({
        targetItemId: target.id,
        draggableItemId: newSlots[index]?.id || null
    }));
    
    const fullAnswer = allDraggableItems.map(dItem => {
        const match = newAnswerArray.find(a => a.draggableItemId === dItem.id);
        return { draggableItemId: dItem.id, targetItemId: match?.targetItemId || null };
    });

    onAnswerChange(question.id, JSON.stringify(fullAnswer));
  };


  return (
    <DndContext sensors={sensors} onDragStart={onDragStart} onDragEnd={onDragEnd}>
      <div className="grid grid-cols-1 md:grid-cols-[2fr_1fr] gap-6">
        {/* Drop zones */}
        <SortableContext items={allTargetItems.map(t => t.id)}>
          <div className="space-y-3">
            <h4 className="font-semibold text-center text-muted-foreground">Match Items To Prompts</h4>
            {allTargetItems.map((target, index) => (
              <Droppable key={target.id} id={target.id} promptText={target.text}>
                {slotItems[index] ? <Draggable id={slotItems[index]!.id} item={slotItems[index]!} /> : undefined}
              </Droppable>
            ))}
          </div>
        </SortableContext>
        
        {/* Item Bank */}
        <SortableContext items={bankItems.map(item => item.id)}>
           <div id="bank" className="p-4 border rounded-md bg-muted/50 min-h-[200px] space-y-2">
            <h4 className="font-semibold text-center text-muted-foreground">Item Bank</h4>
            {bankItems.map(item => (
              <Draggable key={item.id} id={item.id} item={item} />
            ))}
            {bankItems.length === 0 && <p className="text-sm text-center text-muted-foreground pt-4">All items have been placed.</p>}
          </div>
        </SortableContext>

      </div>
      <DragOverlay>
        {activeId && activeItem ? <Draggable id={activeId} item={activeItem} /> : null}
      </DragOverlay>
    </DndContext>
  );
}
