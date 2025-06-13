import React from 'react';
import { Droppable } from 'react-beautiful-dnd';

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

interface MatchingAreaProps {
  staticTargets: StaticTarget[];
  matches: Match[];
  draggableItems: DraggableItem[];
}

const MatchingArea: React.FC<MatchingAreaProps> = ({
  staticTargets,
  matches,
  draggableItems,
}) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      {staticTargets.map((target) => {
        const matchedItem = matches.find(
          (match) => match.staticTargetId === target.id
        );
        const matchedDraggableItem = draggableItems.find(
          (item) => item.id === matchedItem?.draggableItemId
        );

        return (
          <Droppable key={target.id} droppableId={target.id}>
            {(provided) => (
              <div
                ref={provided.innerRef}
                {...provided.droppableProps}
                style={{
                  border: '1px dashed #ccc',
                  minHeight: '50px',
                  padding: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: matchedItem ? 'center' : 'flex-start',
                }}
              >
                {matchedDraggableItem ? (
                  <div style={{ backgroundColor: '#d4edda', padding: '4px', border: '1px solid #28a745' }}>
                    {matchedDraggableItem.content}
                  </div>
                ) : (
                  'Drop here'
                )}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        );
      })}
    </div>
  );
};

export default MatchingArea;