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

export const useAppointmentStore = create<AppointmentState>((set, get) => ({
  appointments: {},
  selectedAppointment: null,
  selectedSlot: null,
  isLoading: false,
  error: null,

  fetchAppointments: async () => {
    set({ isLoading: true, error: null });
    
    try {
      // Mock data - in a real app, this would be an API call
      const mockAppointments: Appointment[] = [
        {
          id: '1',
          title: 'Client Strategy Meeting',
          contactId: '1',
          contactName: 'John Doe',
          contactEmail: 'john.doe@example.com',
          contactPhone: '(555) 123-4567',
          date: new Date(Date.now() + 86400000), // Tomorrow
          endDate: new Date(Date.now() + 86400000 + 3600000), // 1 hour later
          duration: 60,
          type: 'video',
          status: 'scheduled',
          notes: 'Discuss Q4 strategy and upcoming product launches',
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: '2',
          title: 'Product Demo',
          contactId: '2',
          contactName: 'Jane Smith',
          contactEmail: 'jane.smith@example.com',
          contactPhone: '(555) 987-6543',
          date: new Date(Date.now() + 172800000), // Day after tomorrow
          endDate: new Date(Date.now() + 172800000 + 1800000), // 30 minutes later
          duration: 30,
          type: 'video',
          status: 'scheduled',
          location: '',
          notes: 'Demo the new features to potential client',
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: '3',
          title: 'Office Visit',
          contactId: '3',
          contactName: 'Robert Johnson',
          contactEmail: 'robert@example.com',
          contactPhone: '(555) 456-7890',
          date: new Date(Date.now() + 259200000), // 3 days from now
          endDate: new Date(Date.now() + 259200000 + 5400000), // 1.5 hours later
          duration: 90,
          type: 'in-person',
          status: 'scheduled',
          location: '123 Business Ave, Suite 400',
          notes: 'Tour of their facilities and team meeting',
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];
      
      const appointmentsMap = mockAppointments.reduce((acc, appointment) => {
        acc[appointment.id] = appointment;
        return acc;
      }, {} as Record<string, Appointment>);
      
      set({ appointments: appointmentsMap, isLoading: false });
    } catch (error) {
      set({ error: 'Failed to fetch appointments', isLoading: false });
    }
  },

  createAppointment: async (appointmentData) => {
    set({ isLoading: true, error: null });
    
    try {
      const newAppointment: Appointment = {
        id: Date.now().toString(),
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
        updatedAt: new Date()
      };
      
      const { appointments } = get();
      set({
        appointments: {
          ...appointments,
          [newAppointment.id]: newAppointment
        },
        isLoading: false,
        selectedSlot: null
      });
    } catch (error) {
      set({ error: 'Failed to create appointment', isLoading: false });
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
      
      const updatedAppointment: Appointment = {
        ...existingAppointment,
        ...updates,
        updatedAt: new Date()
      };
      
      set({
        appointments: {
          ...appointments,
          [id]: updatedAppointment
        },
        isLoading: false
      });
    } catch (error) {
      set({ error: 'Failed to update appointment', isLoading: false });
    }
  },

  deleteAppointment: async (id) => {
    set({ isLoading: true, error: null });
    
    try {
      const { appointments } = get();
      const { [id]: deleted, ...remainingAppointments } = appointments;
      
      set({
        appointments: remainingAppointments,
        selectedAppointment: null,
        isLoading: false
      });
    } catch (error) {
      set({ error: 'Failed to delete appointment', isLoading: false });
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
    
    return !Object.values(appointments).some(appointment => {
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
    
    return Object.values(appointments).filter(appointment => {
      const appointmentDate = appointment.date;
      return (
        appointmentDate.getFullYear() === date.getFullYear() &&
        appointmentDate.getMonth() === date.getMonth() &&
        appointmentDate.getDate() === date.getDate()
      );
    }).sort((a, b) => a.date.getTime() - b.date.getTime());
  }
}));