export enum AppointmentStatus {
  SCHEDULED = 'scheduled',
  CONFIRMED = 'confirmed',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  NO_SHOW = 'no_show',
  RESCHEDULED = 'rescheduled'
}

export enum AppointmentType {
  INITIAL_CONSULTATION = 'initial_consultation',
  THERAPY_SESSION = 'therapy_session',
  FOLLOW_UP = 'follow_up',
  GROUP_SESSION = 'group_session',
  ASSESSMENT = 'assessment',
  TELEHEALTH = 'telehealth',
  EMERGENCY = 'emergency'
}

export interface Appointment {
  id: string;
  clientId: string; // Required for data isolation
  therapistId: string;
  startTime: Date;
  endTime: Date;
  status: AppointmentStatus;
  type: AppointmentType;
  title?: string;
  description?: string;
  location?: string;
  isRecurring: boolean;
  recurringPattern?: RecurringPattern;
  parentAppointmentId?: string; // For recurring appointments
  notes?: string;
  reminderSent: boolean;
  telehealth?: TelehealthInfo;
  createdAt: Date;
  updatedAt: Date;
  cancelledAt?: Date;
  cancellationReason?: string;
  noShowReason?: string;
}

export interface RecurringPattern {
  frequency: 'daily' | 'weekly' | 'biweekly' | 'monthly';
  interval: number; // Every X days/weeks/months
  daysOfWeek?: number[]; // 0-6, Sunday = 0
  endDate?: Date;
  occurrences?: number; // Total number of occurrences
}

export interface TelehealthInfo {
  platform: 'zoom' | 'teams' | 'google_meet' | 'custom';
  meetingUrl: string;
  meetingId?: string;
  password?: string;
  dialInNumber?: string;
}

export interface AppointmentSlot {
  id: string;
  startTime: Date;  // Keep for service compatibility
  endTime: Date;    // Keep for service compatibility
  start: Date;      // Add for template compatibility
  end: Date;        // Add for template compatibility
  available: boolean;
  therapistId: string;
}

export interface TimeSlot {
  start: Date;
  end: Date;
  available: boolean;
}

export interface BookingRequest {
  clientId: string;
  therapistId: string;
  preferredDate: Date;
  preferredTime: string;
  appointmentType: AppointmentType;
  duration: number; // in minutes
  notes?: string;
  isUrgent: boolean;
}

export interface RescheduleRequest {
  appointmentId: string;
  newStartTime: Date;
  newEndTime: Date;
  reason: string;
  requestedBy: 'client' | 'therapist';
}

export interface CancellationRequest {
  appointmentId: string;
  reason: string;
  cancelledBy: 'client' | 'therapist';
  refundRequested?: boolean;
}

export interface WaitlistEntry {
  id: string;
  clientId: string;
  therapistId: string;
  preferredDates: Date[];
  preferredTimes: string[];
  appointmentType: AppointmentType;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  createdAt: Date;
  notified: boolean;
}

export interface AppointmentReminder {
  id: string;
  appointmentId: string;
  type: 'email' | 'sms' | 'push';
  scheduledFor: Date;
  sent: boolean;
  sentAt?: Date;
  template: string;
}

export interface AppointmentStats {
  totalAppointments: number;
  completedAppointments: number;
  cancelledAppointments: number;
  noShowAppointments: number;
  completionRate: number;
  averageDuration: number;
  mostPopularTimeSlots: TimeSlotStats[];
}

export interface TimeSlotStats {
  timeSlot: string;
  count: number;
  percentage: number;
}