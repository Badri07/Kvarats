export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  status: 'available' | 'busy' | 'away' | 'offline';
  availableFrom?: string;
  availableTo?: string;
  appointments: Appointment[];
}

export interface Appointment {
  id: string;
  timeSlotId: string;
  title: string;
  duration: number; // in minutes
  type: string;
  color: string;
}

export interface TimeSlot {
  id: string;
  time: string;
  displayTime: string;
  hour: number;
  minute: number;
}

export interface TherapistOption {
  id: string;
  value: string;
}

export interface AppointmentTypeOption {
  id: string;
  value: string;
}

export interface PatientOption {
  id: string;
  firstName: string;
  lastName: string;
}

export interface MeetingTypeOption {
  id: string;
  value: string;
}

export interface SchedulerClickEvent {
  userId: string;
  userName: string;
  date: string;
  timeSlot: TimeSlot;
  isAddEvent: boolean;
}