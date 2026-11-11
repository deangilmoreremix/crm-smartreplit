import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

const navigate = vi.fn();
vi.mock('react-router-dom', async (orig) => ({
  ...(await orig<typeof import('react-router-dom')>()),
  useNavigate: () => navigate,
}));
vi.mock('../../contexts/ThemeContext', () => ({ useTheme: () => ({ isDark: false }) }));

import AIGoalsCard from '../AIGoalsCard';
import { useGoalStore } from '../../store/goalStore';

const renderIt = () =>
  render(
    <MemoryRouter>
      <AIGoalsCard />
    </MemoryRouter>
  );

describe('AIGoalsCard', () => {
  beforeEach(() => {
    navigate.mockReset();
    useGoalStore.setState({ activeExecutions: new Map(), completedGoals: new Set(), favoriteGoals: new Set() });
  });

  it('shows an empty state (and no hard-coded goals) when no goal is tracked', () => {
    renderIt();
    expect(screen.getByText(/No goals yet/)).toBeInTheDocument();
    expect(screen.queryByText('Increase Lead Conversion')).toBeNull();
    fireEvent.click(screen.getByText('Add New Goal'));
    expect(navigate).toHaveBeenLastCalledWith('/ai-goals');
  });

  it('lists tracked goals from the store with their progress and routes rows to /ai-goals', () => {
    const [g1, g2] = useGoalStore.getState().goals;
    expect(g1 && g2).toBeTruthy();
    useGoalStore.setState({
      activeExecutions: new Map([
        [g1.id, { goalId: g1.id, status: 'executing', progress: 40, steps: [], startTime: new Date() }],
      ]),
      completedGoals: new Set([g2.id]),
    });
    renderIt();
    expect(screen.getByText(g1.title)).toBeInTheDocument();
    expect(screen.getByText('40%')).toBeInTheDocument();
    expect(screen.getByText(g2.title)).toBeInTheDocument();
    expect(screen.getByText('100%')).toBeInTheDocument();
    fireEvent.click(screen.getByText(g1.title));
    expect(navigate).toHaveBeenLastCalledWith('/ai-goals');
  });
});
