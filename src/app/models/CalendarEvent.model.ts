export interface Appointment {
  id: string;
  clientId: string;
  clientName: string;
  patientId: string;
  patientName: string;
  userId: string;
  therapistName: string;
  date: Date;
  startTime: string;
  endTime: string;
  meetingTypeId: number;
  meetingType: string;
  appointmentStatusId: number;
  appointmentStatus: string;
  notes: string;
  createdAt: Date;
  active: boolean;
  diagnoses: AppointmentDiagnosis[];
  services: AppointmentService[];
}

export interface AppointmentDiagnosis {
  id: string;
  appointmentId: string;
  diagnosisId: string;
  diagnosisCode: string;
  diagnosisDescription: string;
  isPrimary: boolean;
  dateDiagnosed: Date;
}

export interface AppointmentService {
  id: string;
  appointmentId: string;
  serviceId: string;
  serviceName: string;
  serviceCode: string;
  chargeAmount: number;
  units: number;
  modifier?: string;
  notes?: string;
}

export interface CreateAppointmentRequest {
  patientId: string;
  userId: string;
  date: Date;
  startTime: Date;
  meetingTypeInput:string;
  endTime: Date;
  meetingTypeId: number;
  appointmentStatusId?: number;
  notes?: string;
  repeat?: boolean;
  repeatEvery?: number;
  chiefComplaintId?:string,
  repeatPeriod?: string;
  endDate?: Date;
  repeatDays?: string[];
  serviceIds?: string[];
  diagnoses?: CreateAppointmentDiagnosis[];
}

export interface CreateAppointmentDiagnosis {
  diagnosisId: string;
  isPrimary?: boolean;
}

export interface AvailabilityDto {
  id: number;
  userId: string;
  userName: string;
  dayOfWeek: number;
  startTime: string;
  hasLeave?:any;
  leaveInfo?:any;
  endTime: string;
  isAvailable: boolean;
  isApproved: boolean;
  approvedBy?: string;
  approvedAt?: Date;
  createdAt: Date;
  active: boolean;
}

export interface Diagnosis {
  id: string;
  code: string;
  description: string;
  isPrimary?: boolean;
  diagnosisDescription:string;
}

export interface ServiceItem {
  id: string;
  categoryId: string;
  value: string;
  label: string;
  category: string;
  serviceId: string;
  description: string;
  price: number;
  isActive: boolean;
  isSynced: boolean;
  sortOrder: number;
  metadata: {
    duration?: number;
    code?: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface Patient {
  id: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  active: boolean;
}

export interface Therapist {
  id: string;
  firstName: string;
  lastName: string;
  email?: string;
  role: string;
  active: boolean;
}

export type CalendarView = 'day' | 'week' | 'month';

export interface CalendarEvent extends Appointment {
  startDate: Date;
  endDate: Date;
  duration: number;
}

export interface TimeSlot {
  hour: number;
  minute: number;
  display: string;
}
