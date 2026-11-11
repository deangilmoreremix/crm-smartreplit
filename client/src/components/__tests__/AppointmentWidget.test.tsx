import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

const navigate = vi.fn();
vi.mock('react-router-dom', async (orig) => ({
  ...(await orig<typeof import('react-router-dom')>()),
  useNavigate: () => navigate,
}));
vi.mock('../../contexts/ThemeContext', () => ({ useTheme: () => ({ isDark: false }) }));

import AppointmentWidget, { selectUpcomingAppointments } from '../AppointmentWidget';
import { useAppointmentStore, type Appointment } from '../../store/appointmentStore';

const hours = (n: number) => new Date(Date.now() + n * 3_600_000);
const apt = (id: string, over: Partial<Appointment>): Appointment => ({
  id,
  title: `Apt ${id}`,
  contactName: 'Jane',
  date: hours(24),
  endDate: hours(25),
  duration: 60,
  type: 'video',
  status: 'scheduled',
  createdAt: new Date(),
  updatedAt: new Date(),
  ...over,
});

describe('AppointmentWidget', () => {
  beforeEach(() => navigate.mockReset());

  it('selects scheduled future appointments by `date`, soonest first, within the limit', () => {
    const map = Object.fromEntries(
      [
        apt('late', { date: hours(48) }),
        apt('soon', { date: hours(2) }),
        apt('past', { date: hours(-3) }),
        apt('done', { date: hours(5), status: 'completed' }),
        apt('extra', { date: hours(72) }),
      ].map((a) => [a.id, a])
    );
    expect(selectUpcomingAppointments(map, 2).map((a) => a.id)).toEqual(['soon', 'late']);
  });

  it('renders upcoming appointments with type labels and routes to /appointments', () => {
    useAppointmentStore.setState({
      appointments: {
        a: apt('a', { title: 'Strategy call', type: 'phone', date: hours(3) }),
        b: apt('b', { title: 'Site visit', type: 'in-person', date: hours(30) }),
        c: apt('c', { title: 'Old', date: hours(-5) }),
      },
    });
    render(
      <MemoryRouter>
        <AppointmentWidget />
      </MemoryRouter>
    );
    expect(screen.getByText('Strategy call')).toBeInTheDocument();
    expect(screen.getByText('Site visit')).toBeInTheDocument();
    expect(screen.queryByText('Old')).toBeNull();
    expect(screen.getByText('phone')).toBeInTheDocument();
    expect(screen.getByText('in-person')).toBeInTheDocument();
    // The title lives in the parent section: not duplicated here
    expect(screen.queryByText('Upcoming Appointments')).toBeNull();
    fireEvent.click(screen.getByText('Strategy call'));
    expect(navigate).toHaveBeenLastCalledWith('/appointments');
    fireEvent.click(screen.getByRole('button', { name: 'New appointment' }));
    expect(navigate).toHaveBeenLastCalledWith('/appointments');
  });

  it('shows the empty state', () => {
    useAppointmentStore.setState({ appointments: {} });
    render(
      <MemoryRouter>
        <AppointmentWidget />
      </MemoryRouter>
    );
    expect(screen.getByText('No upcoming appointments')).toBeInTheDocument();
  });
});
