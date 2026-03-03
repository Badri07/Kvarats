import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { SOAPNoteDto, CreateSOAPNoteRequest } from '../models/soap-note.model';
import { environment } from '../../../../environments/environments';

@Injectable({
  providedIn: 'root'
})
export class SoapNoteService {
  
  private apiUrl = `${environment.apidev}/soapnotes`;

  constructor(private http: HttpClient) { }

  getAllSOAPNotes(): Observable<SOAPNoteDto[]> {
    return this.http.get<SOAPNoteDto[]>(this.apiUrl);
  }

  getSOAPNotesByPatientId(patientId: string): Observable<SOAPNoteDto[]> {
    return this.http.get<SOAPNoteDto[]>(`${this.apiUrl}/patient/${patientId}`);
  }

  getSOAPNoteById(id: string): Observable<SOAPNoteDto> {
    return this.http.get<SOAPNoteDto>(`${this.apiUrl}/${id}`);
  }

  getLatestSOAPNoteByPatientId(patientId: string): Observable<SOAPNoteDto> {
    return this.http.get<SOAPNoteDto>(`${this.apiUrl}/patient/${patientId}/latest`);
  }

  getSOAPNoteVersions(patientId: string): Observable<SOAPNoteDto[]> {
    return this.http.get<SOAPNoteDto[]>(`${this.apiUrl}/patient/${patientId}/versions`);
  }

  createSOAPNote(request: CreateSOAPNoteRequest): Observable<SOAPNoteDto> {
    return this.http.post<SOAPNoteDto>(this.apiUrl, request);
  }

  updateSOAPNote(id: string, request: CreateSOAPNoteRequest): Observable<SOAPNoteDto> {
    return this.http.put<SOAPNoteDto>(`${this.apiUrl}/${id}`, request);
  }

  deleteSOAPNote(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }

  publishDraft(id: string): Observable<SOAPNoteDto> {
    return this.http.post<SOAPNoteDto>(`${this.apiUrl}/${id}/publish`, {});
  }

  getDraftSOAPNotes(): Observable<SOAPNoteDto[]> {
    return this.http.get<SOAPNoteDto[]>(`${this.apiUrl}/drafts`);
  }
}
