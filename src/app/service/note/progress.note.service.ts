import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environments';
import { Note } from '../../models/note.model';

export interface ProgressNote {
  id: string;
  patientId: string;
  therapistId: string;
  sessionDate: string;
  nextSessionDate?: string;
  progressTowardGoals: string;
  currentStatus: string;
  interventionsUsed: string;
  patientResponse: string;
  barriers?: string;
  planForNextSession: string;
  status?: string;
  createdAt?: string;
  updatedAt?: string;
}
export interface CreateProgressNoteRequest {
  patientId: string;
  therapistId: string;
  sessionDate: string;
  nextSessionDate?: string;
  progressTowardGoals: string;
  currentStatus: string;
  interventionsUsed: string;
  patientResponse: string;
  barriers?: string;
  planForNextSession: string;
}
export interface UpdateProgressNoteRequest {
  patientId: string;
  therapistId: string;
  sessionDate: string;
  nextSessionDate?: string;
  progressTowardGoals: string;
  currentStatus: string;
  interventionsUsed: string;
  patientResponse: string;
  barriers?: string;
  planForNextSession: string;
}
export interface ApiResponse<T> {
  map(arg0: (soapNote: any) => Note): unknown;
  data: T;
  message: string;
  success: boolean;
  errors?: string[];
}

@Injectable({
  providedIn: 'root'
})

export class ProgressNoteService {
    
  private apiUrl = `${environment.apidev}/ProgressNotes`;

  constructor(private http: HttpClient) { }

  getAllProgressNotesById(patientId?: string): Observable<ApiResponse<ProgressNote[]>> {
    const url = patientId ? `${this.apiUrl}/patient/${patientId}` : this.apiUrl;
    return this.http.get<ApiResponse<ProgressNote[]>>(url);
  }

    getAllProgressNotes(): Observable<ApiResponse<ProgressNote[]>> {
    const url =  `${this.apiUrl}`;
    return this.http.get<ApiResponse<ProgressNote[]>>(url);
  }

  getProgressNoteById(id: string): Observable<ApiResponse<ProgressNote>> {
    return this.http.get<ApiResponse<ProgressNote>>(`${this.apiUrl}/${id}`);
  }

  createProgressNote(request: any): Observable<ApiResponse<ProgressNote>> {
    return this.http.post<ApiResponse<ProgressNote>>(this.apiUrl, request);
  }

  draftProgressNote(id: string, request: any): Observable<ApiResponse<ProgressNote>> {
  const url = `${this.apiUrl}/ProgressNotes/${id}/publish`;
  return this.http.post<ApiResponse<ProgressNote>>(url, request);
}

  updateProgressNote(id: string, request: UpdateProgressNoteRequest): Observable<ApiResponse<ProgressNote>> {
    return this.http.put<ApiResponse<ProgressNote>>(`${this.apiUrl}/${id}`, request);
  }

  deleteProgressNote(id: string): Observable<ApiResponse<boolean>> {
    return this.http.delete<ApiResponse<boolean>>(`${this.apiUrl}/${id}`);
  }

}