import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { SOAPNoteDto, CreateSOAPNoteRequest } from '../models/soap-note.model';
import { environment } from '../../../../environments/environments';

@Injectable({
  providedIn: 'root'
})
export class SoapNoteService {
  
  private apiUrl = `${environment.apidev}/soapnotes`;

  constructor(private http: HttpClient) { }

  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('tokenPatients');
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
  }

  getAllSOAPNotes(): Observable<SOAPNoteDto[]> {
    return this.http.get<SOAPNoteDto[]>(this.apiUrl, {
      headers: this.getAuthHeaders()
    });
  }

  getSOAPNotesByPatientId(patientId: string): Observable<SOAPNoteDto[]> {
    return this.http.get<SOAPNoteDto[]>(
      `${this.apiUrl}/GetPatientSOAPNotesByPatientId`,
      {
        headers: this.getAuthHeaders(),
        params: { patientId: patientId }
      }
    );
  }


  getSOAPNoteById(id: string): Observable<SOAPNoteDto> {
    return this.http.get<SOAPNoteDto>(`${this.apiUrl}/${id}`, {
      headers: this.getAuthHeaders()
    });
  }

  getLatestSOAPNoteByPatientId(patientId: string): Observable<SOAPNoteDto> {
    return this.http.get<SOAPNoteDto>(`${this.apiUrl}/GetPatientLatestSOAPNoteByPatientId`, {
      headers: this.getAuthHeaders(),
      params: { patientId: patientId }
    });
  }

  getSOAPNoteVersions(patientId: string): Observable<SOAPNoteDto[]> {
    return this.http.get<SOAPNoteDto[]>(`${this.apiUrl}/GetPatientSOAPNoteVersions`, {
      headers: this.getAuthHeaders(),
      params: { patientId: patientId }
    });
  }

  createSOAPNote(request: CreateSOAPNoteRequest): Observable<SOAPNoteDto> {
    return this.http.post<SOAPNoteDto>(this.apiUrl, request, {
      headers: this.getAuthHeaders()
    });
  }

  updateSOAPNote(id: string, request: CreateSOAPNoteRequest): Observable<SOAPNoteDto> {
    return this.http.put<SOAPNoteDto>(`${this.apiUrl}/${id}`, request, {
      headers: this.getAuthHeaders()
    });
  }

  deleteSOAPNote(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`, {
      headers: this.getAuthHeaders()
    });
  }

  publishDraft(id: string): Observable<SOAPNoteDto> {
    return this.http.post<SOAPNoteDto>(`${this.apiUrl}/${id}/publish`, {}, {
      headers: this.getAuthHeaders()
    });
  }

  getDraftSOAPNotes(): Observable<SOAPNoteDto[]> {
    return this.http.get<SOAPNoteDto[]>(`${this.apiUrl}/drafts`, {
      headers: this.getAuthHeaders()
    });
  }

  shareSoapNotesToPatient(shareId: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/sharetopatients`,
      { shareId: shareId },
      { headers: this.getAuthHeaders() }
    );
  }
}
