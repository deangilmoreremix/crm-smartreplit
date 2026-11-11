import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

vi.mock('../../../contexts/ThemeContext', () => ({ useTheme: () => ({ isDark: false }) }));
vi.mock('../../TasksSection', () => ({ default: () => <div>tasks-section-stub</div> }));
vi.mock('../../AppointmentWidget', () => ({ default: () => <div>appointments-stub</div> }));
vi.mock('../../dashboard/InteractionHistory', () => ({
  default: () => <div>interaction-stub</div>,
}));
vi.mock('../../dashboard/TasksAndFunnel', () => ({ default: () => <div>funnel-stub</div> }));
vi.mock('../../dashboard/RecentActivity', () => ({ default: () => <div>recent-stub</div> }));

import { DemoDataProvider } from '../../../contexts/DemoDataContext';
import ActivitiesCommunications from '../ActivitiesCommunications';
import { useCommunicationStore } from '../../../store/communicationStore';

const renderWith = (ui: React.ReactElement, showDemo: boolean) => {
  localStorage.setItem('smartcrm_show_demo_data', String(showDemo));
  return render(
    <MemoryRouter>
      <DemoDataProvider>{ui}</DemoDataProvider>
    </MemoryRouter>
  );
};

beforeEach(() => {
  localStorage.clear();
  useCommunicationStore.setState({ communicationLogs: [] });
});

describe('ActivitiesCommunications', () => {
  it('empty communications when off', () => {
    renderWith(<ActivitiesCommunications />, false);
    expect(screen.getByTestId('communications-empty')).toHaveTextContent('No communications yet');
    expect(screen.queryByText('Microsoft deal')).toBeNull();
  });
  it('sample communications + badge when on', () => {
    renderWith(<ActivitiesCommunications />, true);
    expect(screen.getByText('Microsoft deal')).toBeInTheDocument();
    expect(screen.getByText('Ford collaboration')).toBeInTheDocument();
    expect(screen.getByTestId('sample-badge')).toBeInTheDocument();
  });
  it('real communications replace the sample cards', () => {
    useCommunicationStore.setState({
      communicationLogs: [
        {
          id: 'l1',
          type: 'email',
          direction: 'inbound',
          contactId: 'x',
          subject: 'Real thread',
          content: '',
          status: 'completed',
          tags: [],
          attachments: [],
          timestamp: new Date(),
          createdBy: 'u',
        } as any,
      ],
    });
    renderWith(<ActivitiesCommunications />, true);
    expect(screen.getByText('Real thread')).toBeInTheDocument();
    expect(screen.queryByText('Microsoft deal')).toBeNull();
  });
});
