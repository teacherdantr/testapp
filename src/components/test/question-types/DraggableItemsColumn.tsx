import React from 'react';
import { Droppable, Draggable } from 'react-beautiful-dnd';

interface DraggableItem {
  id: string;
  content: string;
}

interface DraggableItemsColumnProps {
  draggableItems: DraggableItem[];
}

const DraggableItemsColumn: React.FC<DraggableItemsColumnProps> = ({ draggableItems }) => {
  return (
    <Droppable droppableId="draggable-items">
      {(provided) => (
        <div ref={provided.innerRef} {...provided.droppableProps} style={{ border: '1px solid #ccc', minHeight: '100px', padding: '8px' }}>
          <h3>Draggable Items</h3>
          {draggableItems.map((item, index) => (
            <Draggable key={item.id} draggableId={item.id} index={index}>
              {(provided) => (
                <div
                  ref={provided.innerRef}
                  {...provided.draggableProps}
                  {...provided.dragHandleProps}
                  style={{
                    userSelect: 'none',
                    padding: '8px',
                    margin: '0 0 8px 0',
                    backgroundColor: '#fff',
                    border: '1px solid #000',
                    ...provided.draggableProps.style,
                  }}
                >
                  {item.content}
                </div>
              )}
            </Draggable>
          ))}
          {provided.placeholder}
        </div>
      )}
    </Droppable>
  );
};

export default DraggableItemsColumn;