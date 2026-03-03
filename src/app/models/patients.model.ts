export interface Patient {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dateOfBirth: Date;
  clientId: string; // Required - links patient to specific client
  therapistId: string;
  status: 'active' | 'inactive' | 'discharged';
  emergencyContact?: {
    name: string;
    phone: string;
    relationship: string;
  };
  insuranceInfo?: {
    provider: string;
    policyNumber: string;
    groupNumber?: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface PatientNote {
  id: string;
  patientId: string;
  therapistId: string;
  clientId: string; // Required for data isolation
  content: string;
  type: 'session' | 'general' | 'assessment';
  createdAt: Date;
}

export interface PatientVitalsCreateDto {
  patientId: string;
  bloodGroupId?: number;
  systolic?: number;
  diastolic?: number;
  heartRate?: number;
  pulse?: number;
  respiratoryRate?: number;
  temperature?: number;
  bloodSugar?: number;
  spO2?: number;
  weight?: number;
  height?: number;
  bmi?: number;
}

export interface PatientVitalsUpdateDto extends PatientVitalsCreateDto {
  id: string;
}

export interface PatientVitalsResponseDto {
  id: string;
  patientId: string;
  bloodGroupId?: number;
  bloodGroupName?: string;
  systolic?: number;
  diastolic?: number;
  heartRate?: number;
  pulse?: number;
  respiratoryRate?: number;
  temperature?: number;
  bloodSugar?: number;
  spO2?: number;
  weight?: number;
  height?: number;
  bmi?: number;
  createdAt: string;
}

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
}

export interface VitalCardConfig {
  id: string;
  title: string;
  icon: string;
  unit: string;
  color: string;
  field: keyof PatientVitalsResponseDto;
  normalRange?: string;
  chart?: any;
}
