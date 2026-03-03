import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ProgressNoteDto, CreateProgressNoteRequest } from '../models/progress-note.model';
import { environment } from '../../../../environments/environments';

@Injectable({
  providedIn: 'root'
})
export class ProgressNoteService {

  private apiUrl = `${environment.apidev}/progressnotes`;

  constructor(private http: HttpClient) {}

  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('tokenPatients');
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
  }

  getAllProgressNotes(): Observable<ProgressNoteDto[]> {
    return this.http.get<ProgressNoteDto[]>(this.apiUrl, {
      headers: this.getAuthHeaders()
    });
  }

  getProgressNotesByPatientId(patientId: string): Observable<ProgressNoteDto[]> {
    return this.http.get<ProgressNoteDto[]>(`${this.apiUrl}/patient/${patientId}`, {
      headers: this.getAuthHeaders()
    });
  }

  getProgressNoteById(id: string): Observable<ProgressNoteDto> {
    return this.http.get<ProgressNoteDto>(`${this.apiUrl}/${id}`, {
      headers: this.getAuthHeaders()
    });
  }

  createProgressNote(request: CreateProgressNoteRequest): Observable<ProgressNoteDto> {
    return this.http.post<ProgressNoteDto>(this.apiUrl, request, {
      headers: this.getAuthHeaders()
    });
  }

  updateProgressNote(id: string, request: CreateProgressNoteRequest): Observable<ProgressNoteDto> {
    return this.http.put<ProgressNoteDto>(`${this.apiUrl}/${id}`, request, {
      headers: this.getAuthHeaders()
    });
  }

  deleteProgressNote(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`, {
      headers: this.getAuthHeaders()
    });
  }

  publishDraft(id: string): Observable<ProgressNoteDto> {
    return this.http.post<ProgressNoteDto>(`${this.apiUrl}/${id}/publish`, {}, {
      headers: this.getAuthHeaders()
    });
  }

  getDraftProgressNotes(): Observable<ProgressNoteDto[]> {
    return this.http.get<ProgressNoteDto[]>(`${this.apiUrl}/drafts`, {
      headers: this.getAuthHeaders()
    });
  }

  shareProgressNotesToPatient(shareId: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/sharetopatients`,
      { shareId: shareId },
      { headers: this.getAuthHeaders() }
    );
  }
}
