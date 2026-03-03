export interface SOAPNoteDto {
  id: string;
  patientId: string;
  patientName: string;
  therapistId: string;
  therapistName: string;
  version: number;
  isLatest: boolean;
  isDraft: boolean;
  subjective: string;
  objective: string;
  assessment: string;
  plan: string;
  sessionDate: string;
  sessionDurationMinutes: number;
  sessionType?: string;
  createdAt: string;
  isSharedToPatients?: boolean;
}

export interface CreateSOAPNoteRequest {
  patientId: string;
  isDraft?: boolean;
  subjective: string;
  objective: string;
  assessment: string;
  plan: string;
  sessionDate?: string;
  sessionDurationMinutes?: number;
  sessionType?: string;
}
