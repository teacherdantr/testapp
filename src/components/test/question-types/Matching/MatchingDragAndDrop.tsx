import React, { useState } from 'react';
import { DragDropContext, DropResult } from 'react-beautiful-dnd';
import DraggableItemsColumn from './DraggableItemsColumn';
import StaticTargetsColumn from './StaticTargetsColumn';
import MatchingArea from './MatchingArea';

interface DraggableItem {
  id: string;
  content: string;
}

interface StaticTarget {
  id: string;
  content: string;
}

interface Match {
  draggableItemId: string;
  staticTargetId: string;
}

interface MatchingDragAndDropProps {
  draggableItems: DraggableItem[];
  staticTargets: StaticTarget[];
}

const MatchingDragAndDrop: React.FC<MatchingDragAndDropProps> = ({
  draggableItems: initialDraggableItems,
  staticTargets,
}) => {
  const [draggableItems, setDraggableItems] = useState(initialDraggableItems);
  const [matches, setMatches] = useState<Match[]>([]);

  // const onDragEnd = (result: DropResult) => {
  //   const { source, destination, draggableId } = result;

  //   // Dropped outside a droppable area
  //   if (!destination) {
  //     return;
  //   }

  //   // Check if the draggable item is already matched
  //   if (matches.find((match) => match.draggableItemId === draggableId)) {
  //     return;
  //   }

  //   // Check if the drop target is a valid static target
  //   const staticTarget = staticTargets.find(
  //     (target) => target.id === destination.droppableId
  //   );
  //   if (!staticTarget) {
  //     return;
  //   }

  //   // Add the new match
  //   setMatches((prevMatches) => [
  //     ...prevMatches,
  //     { draggableItemId: draggableId, staticTargetId: staticTarget.id },
  //   ]);

  //   // Remove the matched item from the draggable items list
  //   setDraggableItems((prevItems) =>
  //     prevItems.filter((item) => item.id !== draggableId)
  //   );
  // };

  const resetMatches = () => {
    setMatches([]);
    setDraggableItems(initialDraggableItems);
  };

  const validateMatches = () => {
    // Implement your validation logic here
    // This will depend on how you define correct matches
    console.log('Validating matches:', matches);
    // Return true if matches are correct, false otherwise
    return false; // Placeholder
  };

  return (
    <DragDropContext onDragEnd={() => {}}> {/* Temporarily disable drag and drop */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
        {/* Left Column: Draggable Items */}
        <DraggableItemsColumn draggableItems={draggableItems} />

        {/* Center Column: Drop Zones and Matched Items */}
        <MatchingArea staticTargets={staticTargets} matches={matches} draggableItems={initialDraggableItems} />

        {/* Right Column: Static Targets */}
        <StaticTargetsColumn staticTargets={staticTargets} />
      </div>
      <button onClick={resetMatches} style={{ marginTop: '16px' }}>
        Reset Matches
      </button>
      <button onClick={validateMatches} style={{ marginTop: '16px', marginLeft: '8px' }}>
        Validate Matches
      </button>
    </DragDropContext>
  );
};

export default MatchingDragAndDrop;
