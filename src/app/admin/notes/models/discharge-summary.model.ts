export interface DischargeSummaryDto {
  id: string;
  patientId: string;
  patientName: string;
  therapistId: string;
  therapistName: string;
  version: number;
  isLatest: boolean;
  isDraft: boolean;
  reasonForTreatment: string;
  treatmentProvided: string;
  outcomeAchieved: string;
  reasonForDischarge: string;
  recommendations?: string;
  followUpInstructions?: string;
  prognosis?: string;
  referralsProvided?: string;
  treatmentStartDate: string;
  treatmentEndDate: string;
  totalSessions: number;
  primaryDiagnosis?: string;
  secondaryDiagnosis?: string;
  dischargeDate: string;
  dischargeStatus?: string;
  createdAt: string;
  isSharedToPatients?: boolean;
}

export interface CreateDischargeSummaryRequest {
  patientId: string;
  isDraft: boolean;
  reasonForTreatment: string;
  treatmentProvided: string;
  outcomeAchieved: string;
  reasonForDischarge: string;
  recommendations?: string;
  followUpInstructions?: string;
  prognosis?: string;
  referralsProvided?: string;
  treatmentStartDate: string;
  treatmentEndDate: string;
  totalSessions: number;
  primaryDiagnosis?: string;
  secondaryDiagnosis?: string;
  dischargeDate: string;
  dischargeStatus?: string;
}
