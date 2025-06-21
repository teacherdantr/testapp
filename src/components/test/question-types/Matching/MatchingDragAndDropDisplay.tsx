
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { DndContext, useDraggable, useDroppable, closestCenter, DragEndEvent } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { cn } from '@/lib/utils';
import type { QuestionTypeDisplayProps } from '../QuestionTypeDisplayProps';
import type { MatchingItem } from '@/lib/types';
import { GripVertical } from 'lucide-react';

// Draggable Item Component
const DraggableItem = ({ item, isOverlay = false }: { item: MatchingItem; isOverlay?: boolean }) => {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: item.id,
    data: item,
  });
  const style = transform ? { transform: CSS.Translate.toString(transform) } : {};

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "flex items-center p-2 bg-card border rounded-md shadow-sm cursor-grab touch-none select-none",
        isOverlay ? "z-50 shadow-lg" : "active:cursor-grabbing"
      )}
    >
      <GripVertical {...attributes} {...listeners} className="h-5 w-5 text-muted-foreground mr-2 cursor-grab active:cursor-grabbing" />
      <span>{item.text}</span>
    </div>
  );
};

// Droppable Target Component
const DropTarget = ({ target, children }: { target: MatchingItem; children: React.ReactNode }) => {
  const { isOver, setNodeRef } = useDroppable({ id: target.id });

  return (
    <div className="flex items-center gap-4">
      <div className="flex-1 text-base text-foreground text-right">{target.text}</div>
      <div
        ref={setNodeRef}
        className={cn(
          "flex-1 h-14 border-2 border-dashed rounded-md flex items-center justify-center p-2 text-muted-foreground",
          isOver && "border-primary bg-primary/10"
        )}
      >
        {children || <span className="text-sm">Drop here</span>}
      </div>
    </div>
  );
};

export function MatchingDragAndDropDisplay({ question, userAnswer, onAnswerChange, testMode }: QuestionTypeDisplayProps) {
  const [matches, setMatches] = useState<Record<string, string | null>>({}); // { targetId: draggableId }
  const [activeDragItem, setActiveDragItem] = useState<MatchingItem | null>(null);

  // Parse user answer on load
  useEffect(() => {
    try {
      const parsedUserAnswer: Array<{ draggableItemId: string, targetItemId: string | null }> = userAnswer ? JSON.parse(userAnswer) : [];
      const newMatches: Record<string, string | null> = {};
      parsedUserAnswer.forEach(match => {
        if (match.targetItemId) {
          newMatches[match.targetItemId] = match.draggableItemId;
        }
      });
      setMatches(newMatches);
    } catch (e) {
      setMatches({});
    }
  }, [userAnswer]);


  const draggableItems = useMemo(() => {
    if (!question.draggableItems) return [];
    if (testMode === 'testing' || testMode === 'race' || question.allowShuffle) {
      return [...question.draggableItems].sort(() => Math.random() - 0.5);
    }
    return question.draggableItems;
  }, [question.draggableItems, testMode, question.allowShuffle]);

  const targetItems = useMemo(() => question.targetItems || [], [question.targetItems]);

  const unassignedDraggableItems = useMemo(() => {
    const assignedIds = Object.values(matches).filter(id => id !== null);
    return draggableItems.filter(item => !assignedIds.includes(item.id));
  }, [draggableItems, matches]);

  const handleDragStart = (event: any) => {
    setActiveDragItem(event.active.data.current as MatchingItem);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveDragItem(null);
    const { active, over } = event;

    if (!over) return;

    const draggableId = active.id as string;
    const targetId = over.id as string;

    const newMatches = { ...matches };
    
    // Remove the draggable from its previous target, if any
    Object.keys(newMatches).forEach(key => {
        if (newMatches[key] === draggableId) {
            newMatches[key] = null;
        }
    });

    // If dropped on a valid target, create the new match
    if (targetItems.some(t => t.id === targetId)) {
        // If the target already had an item, the old item becomes unassigned
        newMatches[targetId] = draggableId;
    }
    
    // Convert the matches object to the required array format for saving
    const newAnswerArray: Array<{ draggableItemId: string; targetItemId: string | null }> = 
      draggableItems.map(dItem => {
        let foundTargetId: string | null = null;
        for (const targetId in newMatches) {
          if (newMatches[targetId] === dItem.id) {
            foundTargetId = targetId;
            break;
          }
        }
        return { draggableItemId: dItem.id, targetItemId: foundTargetId };
      });
      
    setMatches(newMatches);
    onAnswerChange(question.id, JSON.stringify(newAnswerArray));
  };


  return (
    <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd} collisionDetection={closestCenter}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Left Column: Targets */}
        <div className="space-y-4">
          <h4 className="font-semibold text-center text-muted-foreground">Match To</h4>
          {targetItems.map(target => (
            <DropTarget key={target.id} target={target}>
              {matches[target.id] && (
                <DraggableItem item={draggableItems.find(d => d.id === matches[target.id])!} />
              )}
            </DropTarget>
          ))}
        </div>

        {/* Right Column: Unassigned Draggables */}
        <div className="space-y-4 p-4 border rounded-md bg-muted/50 min-h-[200px]">
           <h4 className="font-semibold text-center text-muted-foreground">Items to Match</h4>
           {unassignedDraggableItems.map(item => (
                <DraggableItem key={item.id} item={item} />
           ))}
            {unassignedDraggableItems.length === 0 && <p className="text-center text-muted-foreground text-sm mt-4">All items matched!</p>}
        </div>
      </div>
      {activeDragItem && <div className="pointer-events-none fixed" style={{ top: -9999, left: -9999 }}><DraggableItem item={activeDragItem} isOverlay /></div>}
    </DndContext>
  );
}
