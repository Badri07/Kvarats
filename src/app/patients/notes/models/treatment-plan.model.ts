export interface TreatmentPlanDto {
  id: string;
  patientId: string;
  patientName: string;
  therapistId: string;
  therapistName: string;
  version: number;
  isLatest: boolean;
  isDraft: boolean;
  presentingProblem: string;
  treatmentGoals: string;
  interventions: string;
  objectives?: string;
  targetSymptoms?: string;
  strengths?: string;
  barriers?: string;
  startDate?: string;
  estimatedEndDate?: string;
  estimatedSessions?: number;
  nextReviewDate?: string;
  reviewNotes?: string;
  createdAt: string;
}

export interface CreateTreatmentPlanRequest {
  patientId: string;
  isDraft: boolean;
  presentingProblem: string;
  treatmentGoals: string;
  interventions: string;
  objectives?: string;
  targetSymptoms?: string;
  strengths?: string;
  barriers?: string;
  startDate?: string;
  estimatedEndDate?: string;
  estimatedSessions?: number;
  nextReviewDate?: string;
  reviewNotes?: string;
}
