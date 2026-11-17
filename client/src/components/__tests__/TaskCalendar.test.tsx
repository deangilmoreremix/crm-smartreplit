import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';

vi.mock('../../store/taskStore', () => ({
  useTaskStore: () => ({
    tasks: [
      { id: 't1', title: 'Real task title', dueDate: new Date(), priority: 'high', status: 'todo' },
    ],
    calendarEvents: [],
  }),
}));
vi.mock('../TaskDetailsModal', () => ({ TaskDetailsModal: () => null }));

import { TaskCalendar } from '../TaskCalendar';

describe('TaskCalendar', () => {
  it('renders real tasks and no invented Personal/Work calendars', () => {
    const { container } = render(<TaskCalendar />);
    expect(container.textContent).toContain('Real task title');
    expect(container.textContent).not.toContain('Personal');
    expect(container.textContent).not.toContain('Work');
  });
});
