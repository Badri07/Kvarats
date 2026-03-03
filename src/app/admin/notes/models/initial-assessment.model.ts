export interface InitialAssessmentDto {
  id: string;
  patientId: string;
  patientName: string;
  version: number;
  isLatest: boolean;
  isDraft: boolean;
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
  createdByName: string;
  chiefComplaints: PatientChiefComplaintDto[];
  allergies: PatientAllergyDto[];
  medications: PatientMedicationDto[];
  chronicConditions: PatientChronicConditionDto[];
  surgeries: PatientSurgeryDto[];
  familyHistory: PatientFamilyHistoryDto[];
  socialHabits: PatientSocialHabitDto[];
}

export interface PatientChiefComplaintDto {
  id: number;
  chiefComplaintId: number;
  chiefComplaintName: string;
  painScale?: number;
  notes: string;
  onsetDate?: string;
}

export interface PatientAllergyDto {
  id: number;
  allergyLookupId: number;
  allergyName: string;
  allergyCategoryId: number;
  allergyCategoryName: string;
  severityId?: number;
  severityName?: string;
  reactionDetails?: string;
  firstObserved?: string;
  lastObserved?: string;
}

export interface PatientMedicationDto {
  id: number;
  medicationId: number;
  medicationName: string;
  dosage?: string;
  frequency?: string;
  startDate?: string;
  endDate?: string;
  reason?: string;
}

export interface PatientChronicConditionDto {
  id: number;
  chronicConditionLookupId: number;
  chronicConditionName: string;
  diagnosisDate?: string;
  treatmentDetails?: string;
  isControlled?: boolean;
}

export interface PatientSurgeryDto {
  id: number;
  procedure: string;
  surgeryDate?: string;
  hospital?: string;
  surgeonName?: string;
  surgeryTypeId?: number;
  surgeryTypeName?: string;
  hadComplications?: boolean;
  complicationDetails?: string;
}

export interface PatientFamilyHistoryDto {
  id: number;
  conditionId?: number;
  conditionName?: string;
  relationship?: string;
  ageAtDiagnosis?: number;
  isDeceased?: boolean;
  causeOfDeath?: string;
}

export interface PatientSocialHabitDto {
  id: number;
  smokingStatusId?: number;
  smokingStatusName?: string;
  cigarettesPerDay?: number;
  yearsSmoking?: number;
  hasQuitSmoking?: boolean;
  smokingQuitDate?: string;
  alcoholStatusId?: number;
  alcoholStatusName?: string;
  alcoholFrequencyId?: number;
  alcoholFrequencyName?: string;
  yearsDrinking?: number;
  beverageStatusId?: number;
  beverageStatusName?: string;
  cupsPerDay?: number;
  drugUsageStatusId?: number;
  drugUsageStatusName?: string;
  drugDetails?: string;
}

export interface CreateInitialAssessmentRequest {
  patientId: string;
  isDraft?: boolean;
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
  chiefComplaints: CreatePatientChiefComplaintRequest[];
  allergies: CreatePatientAllergyRequest[];
  medications: CreatePatientMedicationRequest[];
  chronicConditions: CreatePatientChronicConditionRequest[];
  surgeries: CreatePatientSurgeryRequest[];
  familyHistory: CreatePatientFamilyHistoryRequest[];
  socialHabits: CreatePatientSocialHabitRequest[];
}

export interface CreatePatientChiefComplaintRequest {
  chiefComplaintId: number;
  painScale?: number;
  notes?: string;
  onsetDate?: string;
}

export interface CreatePatientAllergyRequest {
  allergyLookupId: number;
  allergyCategoryId: number;
  severityId?: number;
  reactionDetails?: string;
  firstObserved?: string;
  lastObserved?: string;
}

export interface CreatePatientMedicationRequest {
  medicationId: number;
  dosage?: string;
  frequency?: string;
  startDate?: string;
  endDate?: string;
  reason?: string;
}

export interface CreatePatientChronicConditionRequest {
  chronicConditionLookupId: number;
  diagnosisDate?: string;
  treatmentDetails?: string;
  isControlled?: boolean;
}

export interface CreatePatientSurgeryRequest {
  procedure: string;
  surgeryDate?: string;
  hospital?: string;
  surgeonName?: string;
  surgeryTypeId?: number;
  hadComplications?: boolean;
  complicationDetails?: string;
}

export interface CreatePatientFamilyHistoryRequest {
  conditionId?: number;
  relationship?: string;
  ageAtDiagnosis?: number;
  isDeceased?: boolean;
  causeOfDeath?: string;
}

export interface CreatePatientSocialHabitRequest {
  smokingStatusId?: number;
  cigarettesPerDay?: number;
  yearsSmoking?: number;
  hasQuitSmoking?: boolean;
  smokingQuitDate?: string;
  alcoholStatusId?: number;
  alcoholFrequencyId?: number;
  yearsDrinking?: number;
  beverageStatusId?: number;
  cupsPerDay?: number;
  drugUsageStatusId?: number;
  drugDetails?: string;
}
