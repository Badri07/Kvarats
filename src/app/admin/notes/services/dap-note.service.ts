import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { DAPNoteDto, CreateDAPNoteRequest } from '../models/dap-note.model';
import { environment } from '../../../../environments/environments';

@Injectable({
  providedIn: 'root'
})
export class DapNoteService {
      
  private apiUrl =   `${environment.apidev}/dapnotes`;

  constructor(private http: HttpClient) { }

  getAllDAPNotes(): Observable<DAPNoteDto[]> {
    return this.http.get<DAPNoteDto[]>(this.apiUrl);
  }

  getDAPNotesByPatientId(patientId: string): Observable<DAPNoteDto[]> {
    return this.http.get<DAPNoteDto[]>(`${this.apiUrl}/patient/${patientId}`);
  }

  getDAPNoteById(id: string): Observable<DAPNoteDto> {
    return this.http.get<DAPNoteDto>(`${this.apiUrl}/${id}`);
  }

  createDAPNote(request: CreateDAPNoteRequest): Observable<DAPNoteDto> {
    return this.http.post<DAPNoteDto>(this.apiUrl, request);
  }

  updateDAPNote(id: string, request: CreateDAPNoteRequest): Observable<DAPNoteDto> {
    return this.http.put<DAPNoteDto>(`${this.apiUrl}/${id}`, request);
  }

  deleteDAPNote(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }

  publishDraft(id: string): Observable<DAPNoteDto> {
    return this.http.post<DAPNoteDto>(`${this.apiUrl}/${id}/publish`, {});
  }

  getDraftDAPNotes(): Observable<DAPNoteDto[]> {
    return this.http.get<DAPNoteDto[]>(`${this.apiUrl}/drafts`);
  }
}
