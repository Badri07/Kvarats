export interface ProgressNoteDto {
  id: string;
  patientId: string;
  patientName: string;
  therapistId: string;
  therapistName: string;
  version: number;
  isLatest: boolean;
  isDraft: boolean;
  progressSummary: string;
  goalProgress?: string;
  interventionsUsed?: string;
  patientResponse?: string;
  clinicalObservations?: string;
  nextSteps?: string;
  sessionDate: string;
  sessionDurationMinutes: number;
  sessionType?: string;
  progressRating?: number;
  riskAssessment?: string;
  createdAt: string;
  isSharedToPatients?: boolean;
}

export interface CreateProgressNoteRequest {
  patientId: string;
  isDraft: boolean;
  progressSummary: string;
  goalProgress?: string;
  interventionsUsed?: string;
  patientResponse?: string;
  clinicalObservations?: string;
  nextSteps?: string;
  sessionDate: string;
  sessionDurationMinutes: number;
  sessionType?: string;
  progressRating?: number;
  riskAssessment?: string;
}
