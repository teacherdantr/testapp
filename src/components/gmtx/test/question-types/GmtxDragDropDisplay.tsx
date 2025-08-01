
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
  closestCenter,
} from '@dnd-kit/core';
import {
  SortableContext,
  useSortable,
  arrayMove,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { Question, MatchingItem } from '@/lib/types';
import { cn } from '@/lib/utils';
import { GripVertical } from 'lucide-react';

interface GmtxDragDropDisplayProps {
  question: Question;
  currentAnswers: Record<string, string | null>; // targetId -> draggableId
  onAnswerChange: (matches: Record<string, string | null>) => void;
}

// Draggable Item Component
function DraggableItem({ id, item }: { id: string, item: MatchingItem }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : 'auto',
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="flex items-center p-4 bg-gray-200 border border-gray-300 rounded-md shadow-sm cursor-grab touch-none select-none active:cursor-grabbing"
    >
      <GripVertical className="h-5 w-5 text-gray-500 mr-3 shrink-0" />
      <span className="text-gray-800">{item.text}</span>
    </div>
  );
}

// Droppable Target Component
function DroppableSlot({ id, children, promptText }: { id: string; children?: React.ReactNode, promptText: string }) {
  const { setNodeRef, isOver } = useSortable({ id });

  return (
    <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-4">
      <div
        ref={setNodeRef}
        className={cn(
          "h-full min-h-[72px] border border-gray-300 rounded-md flex items-center justify-center p-2 text-gray-400 bg-white",
          isOver ? "border-blue-500 bg-blue-50" : ""
        )}
      >
        {children || <span className="text-sm italic">Drop here</span>}
      </div>
      <div className="w-16 h-16 bg-blue-800 rounded-full flex items-center justify-center text-white font-bold shrink-0">
          =
      </div>
      <div className="flex items-center justify-center p-4 bg-blue-800 text-white rounded-md h-full min-h-[72px]">
        {promptText}
      </div>
    </div>
  );
}

export function GmtxDragDropDisplay({ question, currentAnswers, onAnswerChange }: GmtxDragDropDisplayProps) {
  const allDraggableItems = useMemo(() => question.draggableItems || [], [question.draggableItems]);
  const allTargetItems = useMemo(() => question.targetItems || [], [question.targetItems]);

  const [bankItems, setBankItems] = useState<MatchingItem[]>([]);
  const [slotItems, setSlotItems] = useState<Record<string, MatchingItem | null>>({});
  const [activeId, setActiveId] = useState<string | null>(null);
  
  const sensors = useSensors(useSensor(PointerSensor), useSensor(KeyboardSensor));

  useEffect(() => {
    const initialSlots: Record<string, MatchingItem | null> = {};
    const usedDraggableIds = new Set<string>();

    allTargetItems.forEach(target => {
        const draggableId = currentAnswers[target.id];
        if (draggableId) {
            const draggableItem = allDraggableItems.find(d => d.id === draggableId);
            if (draggableItem) {
                initialSlots[target.id] = draggableItem;
                usedDraggableIds.add(draggableId);
            } else {
                 initialSlots[target.id] = null;
            }
        } else {
             initialSlots[target.id] = null;
        }
    });
    setSlotItems(initialSlots);

    const initialBank = allDraggableItems.filter(d => !usedDraggableIds.has(d.id));
    setBankItems(question.allowShuffle !== false ? [...initialBank].sort(() => Math.random() - 0.5) : initialBank);
    
  }, [currentAnswers, allDraggableItems, allTargetItems, question.allowShuffle]);

  const activeItem = useMemo(() => allDraggableItems.find(item => item.id === activeId), [activeId, allDraggableItems]);

  const onDragStart = (event: DragStartEvent) => setActiveId(event.active.id as string);

  const onDragEnd = (event: DragEndEvent) => {
    setActiveId(null);
    const { active, over } = event;
    if (!over || !activeItem) return;

    const newBank = [...bankItems];
    const newSlots = {...slotItems};
    let newAnswers = {...currentAnswers};

    // Remove active item from its current location
    const wasInBank = newBank.some(item => item.id === active.id);
    if (wasInBank) {
        newBank.splice(newBank.findIndex(item => item.id === active.id), 1);
    } else {
        const sourceSlotId = Object.keys(newSlots).find(slotId => newSlots[slotId]?.id === active.id);
        if (sourceSlotId) {
            newSlots[sourceSlotId] = null;
            newAnswers[sourceSlotId] = null;
        }
    }

    // Place item in new location
    if (over.id === 'bank') {
        newBank.push(activeItem);
    } else if (allTargetItems.some(t => t.id === over.id)) {
        const targetSlotId = over.id as string;
        const itemInTargetSlot = newSlots[targetSlotId];
        if(itemInTargetSlot){
             newBank.push(itemInTargetSlot);
        }
        newSlots[targetSlotId] = activeItem;
        newAnswers[targetSlotId] = activeItem.id;
    }
    
    setBankItems(newBank);
    setSlotItems(newSlots);
    onAnswerChange(newAnswers);
  };
  
  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={onDragStart} onDragEnd={onDragEnd}>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <SortableContext items={bankItems.map(i => i.id)} strategy={verticalListSortingStrategy}>
                 <div id="bank" className="p-4 border-2 border-dashed rounded-md bg-gray-50 min-h-[200px] space-y-3">
                    <h4 className="font-semibold text-center text-gray-600">Draggable Items</h4>
                    {bankItems.map(item => <DraggableItem key={item.id} id={item.id} item={item} />)}
                    {bankItems.length === 0 && <p className="text-sm text-center text-gray-500 pt-4">All items have been placed.</p>}
                </div>
            </SortableContext>
            
            <SortableContext items={allTargetItems.map(t => t.id)} strategy={verticalListSortingStrategy}>
                 <div className="space-y-3">
                    <h4 className="font-semibold text-center text-gray-600">Match the Items to their Functions</h4>
                    {allTargetItems.map((target) => (
                      <DroppableSlot key={target.id} id={target.id} promptText={target.text}>
                        {slotItems[target.id] ? <DraggableItem id={slotItems[target.id]!.id} item={slotItems[target.id]!} /> : undefined}
                      </DroppableSlot>
                    ))}
                  </div>
            </SortableContext>
        </div>
      <DragOverlay>
        {activeId && activeItem ? <div className="flex items-center p-4 bg-gray-200 border border-gray-300 rounded-md shadow-lg cursor-grabbing"><GripVertical className="h-5 w-5 text-gray-500 mr-3 shrink-0" /><span>{activeItem.text}</span></div> : null}
      </DragOverlay>
    </DndContext>
  );
}

