import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

const navigate = vi.fn();
vi.mock('react-router-dom', async (orig) => ({
  ...(await orig<typeof import('react-router-dom')>()),
  useNavigate: () => navigate,
}));
vi.mock('../../../contexts/ThemeContext', () => ({ useTheme: () => ({ isDark: false }) }));

import { DemoDataProvider } from '../../../contexts/DemoDataContext';
import CustomerProfile, { pickRealContact } from '../CustomerProfile';
import InteractionHistory from '../InteractionHistory';
import TasksAndFunnel, {
  computeFunnel,
  groupTasksByDay,
  monthLayout,
  sampleDayInfo,
} from '../TasksAndFunnel';
import RecentActivity from '../RecentActivity';
import TasksSection from '../../TasksSection';
import { useContactStore } from '../../../store/contactStore';
import { useTaskStore } from '../../../store/taskStore';
import { useCommunicationStore } from '../../../store/communicationStore';

const renderWith = (ui: React.ReactElement, showDemo: boolean) => {
  localStorage.setItem('smartcrm_show_demo_data', String(showDemo));
  return render(
    <MemoryRouter>
      <DemoDataProvider>{ui}</DemoDataProvider>
    </MemoryRouter>
  );
};

const realContact = {
  id: 'c-real',
  name: 'Real Person',
  firstName: 'Real',
  lastName: 'Person',
  email: 'real@acme.test',
  phone: '+15550001111',
  company: 'Acme',
  status: 'lead',
  createdAt: new Date('2025-01-01'),
  updatedAt: new Date('2025-01-02'),
} as any;

beforeEach(() => {
  navigate.mockReset();
  localStorage.clear();
  useTaskStore.setState({ tasks: [] });
  useCommunicationStore.setState({ communicationLogs: [] });
});
afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

describe('CustomerProfile', () => {
  it('shows an empty state when sample data is off', () => {
    renderWith(<CustomerProfile />, false);
    expect(screen.getByTestId('customer-profile-empty')).toHaveTextContent('No customer selected');
    expect(screen.queryByText('Eva Robinson')).toBeNull();
  });

  it('shows the sample profile with a badge when sample data is on', () => {
    renderWith(<CustomerProfile />, true);
    expect(screen.getByText('Eva Robinson')).toBeInTheDocument();
    expect(screen.getByTestId('sample-badge')).toBeInTheDocument();
  });

  it('prefers the real contact with working actions', () => {
    renderWith(<CustomerProfile />, true);
    useContactStore.setState((s) => ({ contacts: { ...s.contacts, 'c-real': realContact } }));
    // re-render after store change
    cleanup();
    renderWith(<CustomerProfile />, true);
    expect(screen.getByTestId('customer-profile-name')).toHaveTextContent('Real Person');
    expect(screen.queryByTestId('sample-badge')).toBeNull();
    expect(screen.getByLabelText('Email')).toHaveAttribute('href', 'mailto:real@acme.test');
    expect(screen.getByLabelText('Call')).toHaveAttribute('href', 'tel:+15550001111');
    fireEvent.click(screen.getByLabelText('View contact'));
    expect(navigate).toHaveBeenCalledWith('/contacts/c-real');
    useContactStore.setState((s) => {
      const { 'c-real': _drop, ...rest } = s.contacts;
      return { contacts: rest };
    });
  });

  it('pickRealContact ignores sample contacts and picks the most recent real one', () => {
    const older = {
      ...realContact,
      id: 'a',
      updatedAt: new Date('2020-01-01'),
      createdAt: new Date('2020-01-01'),
    };
    expect(pickRealContact({ s: { ...realContact, id: 's', isDemo: true } })).toBeNull();
    expect(pickRealContact({ a: older, b: realContact })?.id).toBe('c-real');
  });
});

describe('InteractionHistory', () => {
  it('empty when off', () => {
    renderWith(<InteractionHistory />, false);
    expect(screen.getByTestId('interactions-empty')).toHaveTextContent('No interactions yet');
    expect(screen.queryByText('Royal Package Opportunity')).toBeNull();
  });
  it('sample + badge when on', () => {
    renderWith(<InteractionHistory />, true);
    expect(screen.getAllByText('Royal Package Opportunity').length).toBeGreaterThan(0);
    expect(screen.getByTestId('sample-badge')).toBeInTheDocument();
  });
  it('uses real communication logs and links to the contact', () => {
    useCommunicationStore.setState({
      communicationLogs: [
        {
          id: 'l1',
          type: 'call',
          direction: 'outbound',
          contactId: 'c9',
          subject: 'Intro call',
          content: '',
          status: 'completed',
          tags: [],
          attachments: [],
          timestamp: new Date(),
          createdBy: 'u',
        } as any,
      ],
    });
    renderWith(<InteractionHistory />, true);
    expect(screen.queryByTestId('sample-badge')).toBeNull();
    fireEvent.click(screen.getByText('Intro call'));
    expect(navigate).toHaveBeenCalledWith('/contacts/c9');
  });
});

describe('TasksSection', () => {
  it('empty when off', () => {
    renderWith(<TasksSection />, false);
    expect(screen.getByTestId('tasks-empty')).toHaveTextContent('No tasks yet');
  });
  it('sample + badge when on', () => {
    renderWith(<TasksSection />, true);
    expect(screen.getAllByText('Google Meet Call').length).toBeGreaterThan(0);
    expect(screen.getByTestId('sample-badge')).toBeInTheDocument();
  });
  it('shows real tasks instead of sample', () => {
    useTaskStore.setState({
      tasks: [
        {
          id: 't1',
          title: 'Real task',
          type: 'call',
          status: 'pending',
          priority: 'high',
          tags: [],
          attachments: [],
          subtasks: [],
          dependencies: [],
          reminders: [],
        } as any,
      ],
    });
    renderWith(<TasksSection />, true);
    expect(screen.getByText('Real task')).toBeInTheDocument();
    expect(screen.queryByTestId('sample-badge')).toBeNull();
  });
});

describe('TasksAndFunnel', () => {
  it('shows empty states when sample data is off', () => {
    renderWith(<TasksAndFunnel />, false);
    expect(screen.getByTestId('tasks-schedule-empty')).toBeInTheDocument();
    expect(screen.getByTestId('funnel-empty')).toBeInTheDocument();
    expect(screen.queryByTestId('sample-badge')).toBeNull();
  });

  it('shows sample schedule and funnel with badges when on', () => {
    renderWith(<TasksAndFunnel />, true);
    expect(screen.getAllByTestId('sample-badge').length).toBe(2);
  });

  it('renders the current month deterministically with correct day count', () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date(2024, 1, 10)); // Feb 2024: leap year, 29 days
    const first = renderWith(<TasksAndFunnel />, true);
    expect(screen.getByTestId('calendar-month')).toHaveTextContent('February 2024');
    const html1 = screen.getByTestId('calendar-grid').innerHTML;
    // 1st of Feb 2024 is a Thursday -> 4 leading blanks + 29 days
    expect(screen.getByTestId('calendar-grid').children.length).toBe(4 + 29);
    first.unmount();
    renderWith(<TasksAndFunnel />, true);
    expect(screen.getByTestId('calendar-grid').innerHTML).toBe(html1);
  });

  it('pure helpers: layout, grouping, sample, funnel', () => {
    expect(monthLayout(2026, 1)).toEqual({ daysInMonth: 28, leadingBlanks: 0 });
    expect(monthLayout(2024, 1).daysInMonth).toBe(29);
    expect(sampleDayInfo(new Date(2026, 4, 9))).toEqual(sampleDayInfo(new Date(2026, 4, 9)));
    const g = groupTasksByDay([
      { title: 'a', dueDate: new Date(2026, 4, 9, 10), contactId: '1' },
      { title: 'b', dueDate: new Date(2026, 4, 9, 15), contactId: '1' },
      { title: 'c' },
    ]);
    expect(g.get('2026-05-09')).toEqual({ assigneeIds: ['1'], taskCount: 2, titles: ['a', 'b'] });
    const f = computeFunnel([
      { value: 100, probability: 50, stage: { id: 'qualification' } },
      { value: 300, probability: 100, stage: { id: 'closed-won' } },
    ]);
    expect(f.total).toBe(100);
    expect(f.weighted).toBe(50);
    expect(f.stages[0].value).toBe(100);
  });
});

describe('RecentActivity', () => {
  it('empty when off', () => {
    renderWith(<RecentActivity />, false);
    expect(screen.getByText('No upcoming deals.')).toBeInTheDocument();
    expect(screen.getByText('No recent activity.')).toBeInTheDocument();
  });

  it('navigates sample deals to /deals/demo-N via the router and View All to /pipeline', () => {
    renderWith(<RecentActivity />, true);
    expect(screen.getAllByTestId('sample-badge').length).toBe(2);
    expect(screen.getByText('View All').closest('a')).toHaveAttribute('href', '/pipeline');
    fireEvent.click(screen.getByText('TechCorp Solutions'));
    expect(navigate).toHaveBeenCalledWith('/deals/demo-1');
    expect(screen.queryByText(/AI Risk Score/)).toBeNull();
  });
});
