import React from 'react';
import { Droppable } from '@hello-pangea/dnd';

export const EdgeZones: React.FC = () => {
  const edgeZones = [
    { id: 'top-edge', position: 'top' },
    { id: 'bottom-edge', position: 'bottom' },
    { id: 'left-edge', position: 'left' },
    { id: 'right-edge', position: 'right' }
  ];

  return (
    <>
      {edgeZones.map(zone => (
        <Droppable droppableId={zone.id} key={zone.id}>
          {(provided, snapshot) => (
            <div
              ref={provided.innerRef}
              {...provided.droppableProps}
              className={`fixed z-40 transition-all duration-200 ${
                snapshot.isDraggingOver ? 'bg-blue-500/20 border-2 border-blue-500' : 'bg-transparent'
              }`}
              style={{
                [zone.position]: 0,
                width: zone.position === 'top' || zone.position === 'bottom' ? '100%' : '100px',
                height: zone.position === 'left' || zone.position === 'right' ? '100%' : '100px',
              }}
              title={`Drop here to position navbar ${zone.position}`}
            >
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      ))}
    </>
  );
};