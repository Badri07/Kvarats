export interface DAPNoteDto {
  id: string;
  patientId: string;
  patientName: string;
  therapistId: string;
  therapistName: string;
  version: number;
  isLatest: boolean;
  isDraft: boolean;
  data: string;
  assessment: string;
  plan: string;
  sessionDate: string;
  sessionDurationMinutes: number;
  sessionType?: string;
  createdAt: string;
}

export interface CreateDAPNoteRequest {
  patientId: string;
  isDraft?: boolean;
  data: string;
  assessment: string;
  plan: string;
  sessionDate?: string;
  sessionDurationMinutes?: number;
  sessionType?: string;
}
