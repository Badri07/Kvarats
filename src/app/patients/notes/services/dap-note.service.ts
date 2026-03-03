import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { DAPNoteDto, CreateDAPNoteRequest } from '../models/dap-note.model';
import { environment } from '../../../../environments/environments';

@Injectable({
  providedIn: 'root'
})
export class DapNoteService {
      
  private apiUrl = `${environment.apidev}/dapnotes`;

  constructor(private http: HttpClient) { }

  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('tokenPatients');
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
  }

  getAllDAPNotes(): Observable<DAPNoteDto[]> {
    return this.http.get<DAPNoteDto[]>(this.apiUrl, {
      headers: this.getAuthHeaders()
    });
  }

  getDAPNotesByPatientId(patientId: string): Observable<DAPNoteDto[]> {
    return this.http.get<DAPNoteDto[]>(`${this.apiUrl}/patient/${patientId}`, {
      headers: this.getAuthHeaders()
    });
  }

  getDAPNoteById(id: string): Observable<DAPNoteDto> {
    return this.http.get<DAPNoteDto>(`${this.apiUrl}/${id}`, {
      headers: this.getAuthHeaders()
    });
  }

  createDAPNote(request: CreateDAPNoteRequest): Observable<DAPNoteDto> {
    return this.http.post<DAPNoteDto>(this.apiUrl, request, {
      headers: this.getAuthHeaders()
    });
  }

  updateDAPNote(id: string, request: CreateDAPNoteRequest): Observable<DAPNoteDto> {
    return this.http.put<DAPNoteDto>(`${this.apiUrl}/${id}`, request, {
      headers: this.getAuthHeaders()
    });
  }

  deleteDAPNote(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`, {
      headers: this.getAuthHeaders()
    });
  }

  publishDraft(id: string): Observable<DAPNoteDto> {
    return this.http.post<DAPNoteDto>(`${this.apiUrl}/${id}/publish`, {}, {
      headers: this.getAuthHeaders()
    });
  }

  getDraftDAPNotes(): Observable<DAPNoteDto[]> {
    return this.http.get<DAPNoteDto[]>(`${this.apiUrl}/drafts`, {
      headers: this.getAuthHeaders()
    });
  }

  shareDapNotesToPatient(shareId: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/sharetopatients`,
      { shareId: shareId },
      { headers: this.getAuthHeaders() }
    );
  }
}
