import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ProgressNoteDto, CreateProgressNoteRequest } from '../models/progress-note.model';
import { environment } from '../../../../environments/environments';

@Injectable({
  providedIn: 'root'
})
export class ProgressNoteService {
  private apiUrl =   `${environment.apidev}/progressnotes`;


  constructor(private http: HttpClient) {}

  getAllProgressNotes(): Observable<ProgressNoteDto[]> {
    return this.http.get<ProgressNoteDto[]>(this.apiUrl);
  }

  getProgressNotesByPatientId(patientId: string): Observable<ProgressNoteDto[]> {
    return this.http.get<ProgressNoteDto[]>(`${this.apiUrl}/patient/${patientId}`);
  }

  getProgressNoteById(id: string): Observable<ProgressNoteDto> {
    return this.http.get<ProgressNoteDto>(`${this.apiUrl}/${id}`);
  }

  createProgressNote(request: CreateProgressNoteRequest): Observable<ProgressNoteDto> {
    return this.http.post<ProgressNoteDto>(this.apiUrl, request);
  }

  updateProgressNote(id: string, request: CreateProgressNoteRequest): Observable<ProgressNoteDto> {
    return this.http.put<ProgressNoteDto>(`${this.apiUrl}/${id}`, request);
  }

  deleteProgressNote(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  publishDraft(id: string): Observable<ProgressNoteDto> {
    return this.http.post<ProgressNoteDto>(`${this.apiUrl}/${id}/publish`, {});
  }

  getDraftProgressNotes(): Observable<ProgressNoteDto[]> {
    return this.http.get<ProgressNoteDto[]>(`${this.apiUrl}/drafts`);
  }
}
