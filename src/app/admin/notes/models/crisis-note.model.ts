export interface CrisisNoteDto {
  id: string;
  patientId: string;
  patientName: string;
  therapistId: string;
  therapistName: string;
  version: number;
  isLatest: boolean;
  isDraft: boolean;
  crisisDescription: string;
  immediateActions: string;
  riskAssessment: string;
  safetyPlan: string;
  triggersIdentified?: string;
  copingStrategies?: string;
  supportSystemActivated?: string;
  followUpPlan?: string;
  referralsProvided?: string;
  crisisDate: string;
  crisisDurationMinutes: number;
  crisisType?: string;
  crisisSeverity?: string;
  suicidalRisk?: string;
  homicidalRisk?: string;
  selfHarmRisk?: string;
  emergencyContactsNotified: boolean;
  emergencyContactsDetails?: string;
  createdAt: string;
  isSharedToPatients?: boolean;
}

export interface CreateCrisisNoteRequest {
  patientId: string;
  isDraft: boolean;
  crisisDescription: string;
  immediateActions: string;
  riskAssessment: string;
  safetyPlan: string;
  triggersIdentified?: string;
  copingStrategies?: string;
  supportSystemActivated?: string;
  followUpPlan?: string;
  referralsProvided?: string;
  crisisDate: string;
  crisisDurationMinutes: number;
  crisisType?: string;
  crisisSeverity?: string;
  suicidalRisk?: string;
  homicidalRisk?: string;
  selfHarmRisk?: string;
  emergencyContactsNotified: boolean;
  emergencyContactsDetails?: string;
}
