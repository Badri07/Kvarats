import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { CrisisNoteDto, CreateCrisisNoteRequest } from '../models/crisis-note.model';
import { environment } from '../../../../environments/environments';

@Injectable({
  providedIn: 'root'
})
export class CrisisNoteService {

  private apiUrl = `${environment.apidev}/crisisnotes`;

  constructor(private http: HttpClient) {}

  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('tokenPatients');
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
  }

  getAllCrisisNotes(): Observable<CrisisNoteDto[]> {
    return this.http.get<CrisisNoteDto[]>(this.apiUrl, {
      headers: this.getAuthHeaders()
    });
  }

  getCrisisNotesByPatientId(patientId: string): Observable<CrisisNoteDto[]> {
    return this.http.get<CrisisNoteDto[]>(`${this.apiUrl}/patient/${patientId}`, {
      headers: this.getAuthHeaders()
    });
  }

  getCrisisNoteById(id: string): Observable<CrisisNoteDto> {
    return this.http.get<CrisisNoteDto>(`${this.apiUrl}/${id}`, {
      headers: this.getAuthHeaders()
    });
  }

  createCrisisNote(request: CreateCrisisNoteRequest): Observable<CrisisNoteDto> {
    return this.http.post<CrisisNoteDto>(this.apiUrl, request, {
      headers: this.getAuthHeaders()
    });
  }

  updateCrisisNote(id: string, request: CreateCrisisNoteRequest): Observable<CrisisNoteDto> {
    return this.http.put<CrisisNoteDto>(`${this.apiUrl}/${id}`, request, {
      headers: this.getAuthHeaders()
    });
  }

  deleteCrisisNote(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`, {
      headers: this.getAuthHeaders()
    });
  }

  publishDraft(id: string): Observable<CrisisNoteDto> {
    return this.http.post<CrisisNoteDto>(`${this.apiUrl}/${id}/publish`, {}, {
      headers: this.getAuthHeaders()
    });
  }

  getDraftCrisisNotes(): Observable<CrisisNoteDto[]> {
    return this.http.get<CrisisNoteDto[]>(`${this.apiUrl}/drafts`, {
      headers: this.getAuthHeaders()
    });
  }

  shareCrisisNotesToPatient(shareId: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/sharetopatients`,
      { shareId: shareId },
      { headers: this.getAuthHeaders() }
    );
  }
}
