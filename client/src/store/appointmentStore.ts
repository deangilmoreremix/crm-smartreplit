import { create } from 'zustand';

export type AppointmentType = 'video' | 'phone' | 'in-person';
export type AppointmentStatus = 'scheduled' | 'completed' | 'canceled' | 'no-show';

export interface Appointment {
  id: string;
  title: string;
  contactId?: string;
  contactName: string;
  contactEmail?: string;
  contactPhone?: string;
  date: Date;
  endDate: Date;
  duration: number; // in minutes
  type: AppointmentType;
  status: AppointmentStatus;
  location?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

interface AppointmentState {
  appointments: Record<string, Appointment>;
  selectedAppointment: string | null;
  selectedSlot: Date | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchAppointments: () => Promise<void>;
  createAppointment: (appointmentData: Partial<Appointment>) => Promise<void>;
  updateAppointment: (id: string, updates: Partial<Appointment>) => Promise<void>;
  deleteAppointment: (id: string) => Promise<void>;
  selectAppointment: (id: string | null) => void;
  selectTimeSlot: (slot: Date | null) => void;
  isTimeSlotAvailable: (date: Date, duration: number) => boolean;
  getAppointmentsForDate: (date: Date) => Appointment[];
}


// Server rows (shared/schema.ts `appointments`) <-> store Appointment.
// Fields the table has no column for (type, contact name/email/phone, notes) live in `attendees[0]`.
const fromServerAppointment = (row: any): Appointment => {
  const meta = (Array.isArray(row.attendees) && row.attendees[0]) || {};
  const date = new Date(row.startTime);
  const endDate = new Date(row.endTime);
  return {
    id: String(row.id),
    title: row.title,
    contactId: row.contactId != null ? String(row.contactId) : undefined,
    contactName: meta.name || '',
    contactEmail: meta.email,
    contactPhone: meta.phone,
    date,
    endDate,
    duration: Math.max(0, Math.round((endDate.getTime() - date.getTime()) / 60000)),
    type: meta.type || 'video',
    status: row.status || 'scheduled',
    location: row.location || undefined,
    notes: row.description || undefined,
    createdAt: new Date(row.createdAt),
    updatedAt: new Date(row.updatedAt),
  };
};

const toServerAppointment = (a: Partial<Appointment>): Record<string, any> => {
  const body: Record<string, any> = {};
  if (a.title !== undefined) body.title = a.title;
  if (a.notes !== undefined) body.description = a.notes;
  if (a.date !== undefined) body.startTime = a.date;
  if (a.endDate !== undefined) body.endTime = a.endDate;
  else if (a.date !== undefined && a.duration !== undefined)
    body.endTime = new Date(new Date(a.date).getTime() + a.duration * 60000);
  if (a.status !== undefined) body.status = a.status;
  if (a.location !== undefined) body.location = a.location;
  if (a.contactId && /^\d+$/.test(a.contactId)) body.contactId = Number(a.contactId);
  if (a.contactName !== undefined || a.contactEmail !== undefined || a.type !== undefined) {
    body.attendees = [{ name: a.contactName, email: a.contactEmail, phone: a.contactPhone, type: a.type }];
  }
  return body;
};

const apiRequest = async (url: string, init?: RequestInit) => {
  const response = await fetch(url, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...(init?.headers || {}) },
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body.error || body.message || `Request failed (${response.status})`);
  return body;
};

export const useAppointmentStore = create<AppointmentState>((set, get) => ({
  appointments: {},
  selectedAppointment: null,
  selectedSlot: null,
  isLoading: false,
  error: null,

  fetchAppointments: async () => {
    set({ isLoading: true, error: null });

    try {
      const rows = await apiRequest('/api/appointments');
      const appointmentsMap = (Array.isArray(rows) ? rows : []).map(fromServerAppointment).reduce(
        (acc, appointment) => {
          acc[appointment.id] = appointment;
          return acc;
        },
        {} as Record<string, Appointment>
      );

      set({ appointments: appointmentsMap, isLoading: false });
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to fetch appointments', isLoading: false });
    }
  },

  createAppointment: async (appointmentData) => {
    set({ isLoading: true, error: null });

    try {
      const draft: Partial<Appointment> = {
        ...appointmentData,
        date: appointmentData.date || new Date(),
        duration: appointmentData.duration || 30,
        type: appointmentData.type || 'video',
        status: appointmentData.status || 'scheduled',
      };
      const saved = await apiRequest('/api/appointments', {
        method: 'POST',
        body: JSON.stringify(toServerAppointment(draft)),
      });
      const newAppointment: Appointment = {
        id: String(saved.id),
        title: appointmentData.title || '',
        contactId: appointmentData.contactId,
        contactName: appointmentData.contactName || '',
        contactEmail: appointmentData.contactEmail,
        contactPhone: appointmentData.contactPhone,
        date: appointmentData.date || new Date(),
        endDate: appointmentData.endDate || new Date(),
        duration: appointmentData.duration || 30,
        type: appointmentData.type || 'video',
        status: appointmentData.status || 'scheduled',
        location: appointmentData.location,
        notes: appointmentData.notes,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const { appointments } = get();
      set({
        appointments: {
          ...appointments,
          [newAppointment.id]: newAppointment,
        },
        isLoading: false,
        selectedSlot: null,
      });
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to create appointment', isLoading: false });
    }
  },

  updateAppointment: async (id, updates) => {
    set({ isLoading: true, error: null });

    try {
      const { appointments } = get();
      const existingAppointment = appointments[id];

      if (!existingAppointment) {
        throw new Error('Appointment not found');
      }

      await apiRequest(`/api/appointments/${id}`, {
        method: 'PUT',
        body: JSON.stringify(toServerAppointment(updates)),
      });

      const updatedAppointment: Appointment = {
        ...existingAppointment,
        ...updates,
        updatedAt: new Date(),
      };

      set({
        appointments: {
          ...appointments,
          [id]: updatedAppointment,
        },
        isLoading: false,
      });
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to update appointment', isLoading: false });
    }
  },

  deleteAppointment: async (id) => {
    set({ isLoading: true, error: null });

    try {
      await apiRequest(`/api/appointments/${id}`, { method: 'DELETE' });
      const { appointments } = get();
      const { [id]: deleted, ...remainingAppointments } = appointments;

      set({
        appointments: remainingAppointments,
        selectedAppointment: null,
        isLoading: false,
      });
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to delete appointment', isLoading: false });
    }
  },

  selectAppointment: (id) => {
    set({ selectedAppointment: id });
  },

  selectTimeSlot: (slot) => {
    set({ selectedSlot: slot });
  },

  isTimeSlotAvailable: (date, duration) => {
    const { appointments } = get();
    const endTime = new Date(date.getTime() + duration * 60000);

    return !Object.values(appointments).some((appointment) => {
      const appointmentStart = appointment.date;
      const appointmentEnd = appointment.endDate;

      // Check if the requested time slot overlaps with any existing appointment
      return (
        (date >= appointmentStart && date < appointmentEnd) ||
        (endTime > appointmentStart && endTime <= appointmentEnd) ||
        (date <= appointmentStart && endTime >= appointmentEnd)
      );
    });
  },

  getAppointmentsForDate: (date) => {
    const { appointments } = get();

    return Object.values(appointments)
      .filter((appointment) => {
        const appointmentDate = appointment.date;
        return (
          appointmentDate.getFullYear() === date.getFullYear() &&
          appointmentDate.getMonth() === date.getMonth() &&
          appointmentDate.getDate() === date.getDate()
        );
      })
      .sort((a, b) => a.date.getTime() - b.date.getTime());
  },
}));
