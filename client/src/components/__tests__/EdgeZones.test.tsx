import React from 'react';
import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { DragDropContext } from '@hello-pangea/dnd';
import { EdgeZones } from '../EdgeZones';

describe('EdgeZones', () => {
  it('renders the four drop strips without letting them swallow clicks', () => {
    const { container } = render(
      <DragDropContext onDragEnd={() => {}}>
        <EdgeZones />
      </DragDropContext>
    );
    const zones = container.querySelectorAll('[data-rfd-droppable-id]');
    expect(Array.from(zones).map((z) => z.getAttribute('data-rfd-droppable-id'))).toEqual(['top-edge', 'bottom-edge', 'left-edge', 'right-edge']);
    zones.forEach((zone) => expect(zone).toHaveStyle({ pointerEvents: 'none' }));
  });
});
