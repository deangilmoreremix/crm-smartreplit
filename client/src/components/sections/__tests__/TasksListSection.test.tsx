import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

const navigate = vi.fn();
vi.mock('react-router-dom', async (orig) => ({
  ...(await orig<typeof import('react-router-dom')>()),
  useNavigate: () => navigate,
}));

import TasksListSection, { selectDashboardTasks, toTaskRow } from '../TasksListSection';
import { useTaskStore } from '../../../store/taskStore';

const renderIt = () =>
  render(
    <MemoryRouter>
      <TasksListSection />
    </MemoryRouter>
  );

const json = (body: unknown, ok = true) => ({ ok, status: ok ? 200 : 500, json: async () => body });

describe('TasksListSection', () => {
  const fetchMock = vi.fn();
  beforeEach(() => {
    navigate.mockReset();
    fetchMock.mockReset();
    vi.stubGlobal('fetch', fetchMock);
    useTaskStore.setState({ tasks: [] });
  });
  afterEach(() => vi.unstubAllGlobals());

  it('orders open tasks by due date before completed ones and caps the list', () => {
    const rows = [
      toTaskRow({ id: 1, title: 'done', status: 'completed' })!,
      toTaskRow({ id: 2, title: 'later', status: 'pending', dueDate: '2030-01-02' })!,
      toTaskRow({ id: 3, title: 'sooner', status: 'pending', dueDate: '2030-01-01' })!,
      toTaskRow({ id: 4, title: 'undated', status: 'pending' })!,
    ];
    expect(selectDashboardTasks(rows).map((r) => r.title)).toEqual(['sooner', 'later', 'undated', 'done']);
    expect(selectDashboardTasks(rows, 2)).toHaveLength(2);
  });

  it('loads tasks from the API, completes one with PUT {title,status}, and links to /tasks', async () => {
    fetchMock.mockImplementation(async (url: string, init?: RequestInit) =>
      init?.method === 'PUT'
        ? json({})
        : json([{ id: 7, title: 'Call Acme', status: 'pending', priority: 'high' }])
    );
    renderIt();
    expect(screen.getByText('Loading tasks...')).toBeInTheDocument();
    expect(await screen.findByText('Call Acme')).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledWith('/api/tasks', { credentials: 'include' });

    fireEvent.click(screen.getByRole('button', { name: 'Mark Call Acme complete' }));
    await waitFor(() => expect(screen.getByRole('button', { name: 'Call Acme completed' })).toBeDisabled());
    const put = fetchMock.mock.calls.find(([, init]) => init?.method === 'PUT')!;
    expect(put[0]).toBe('/api/tasks/7');
    expect(JSON.parse(put[1].body)).toEqual({ title: 'Call Acme', status: 'completed' });

    fireEvent.click(screen.getByRole('button', { name: 'View all' }));
    expect(navigate).toHaveBeenLastCalledWith('/tasks');
  });

  it('reverts the optimistic completion when the PUT fails', async () => {
    fetchMock.mockImplementation(async (url: string, init?: RequestInit) =>
      init?.method === 'PUT' ? json({}, false) : json([{ id: 7, title: 'Call Acme', status: 'pending' }])
    );
    renderIt();
    fireEvent.click(await screen.findByRole('button', { name: 'Mark Call Acme complete' }));
    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Mark Call Acme complete' })).not.toBeDisabled()
    );
  });

  it('falls back to the task store when the API is unavailable', async () => {
    fetchMock.mockRejectedValue(new Error('offline'));
    useTaskStore.setState({
      tasks: [{ id: 'l1', title: 'Local task', status: 'pending', priority: 'low' } as any],
    });
    renderIt();
    expect(await screen.findByText('Local task')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Mark Local task complete' }));
    expect(useTaskStore.getState().tasks[0].status).toBe('completed');
  });

  it('shows an error with retry when the API fails and nothing is stored locally, then the empty state', async () => {
    fetchMock.mockRejectedValueOnce(new Error('offline'));
    renderIt();
    expect(await screen.findByRole('alert')).toHaveTextContent('Could not load tasks');
    fetchMock.mockResolvedValueOnce(json([]));
    fireEvent.click(screen.getByRole('button', { name: 'Retry' }));
    expect(await screen.findByText(/No tasks yet/)).toBeInTheDocument();
  });
});
