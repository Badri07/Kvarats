import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { DischargeSummaryDto, CreateDischargeSummaryRequest } from '../models/discharge-summary.model';
import { environment } from '../../../../environments/environments';

@Injectable({
  providedIn: 'root'
})
export class DischargeSummaryService {

  private apiUrl = `${environment.apidev}/dischargesummaries`;

  constructor(private http: HttpClient) {}

  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('tokenPatients');
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
  }

  getAllDischargeSummaries(): Observable<DischargeSummaryDto[]> {
    return this.http.get<DischargeSummaryDto[]>(this.apiUrl, {
      headers: this.getAuthHeaders()
    });
  }

  getDischargeSummariesByPatientId(patientId: string): Observable<DischargeSummaryDto[]> {
    return this.http.get<DischargeSummaryDto[]>(`${this.apiUrl}/patient/${patientId}`, {
      headers: this.getAuthHeaders()
    });
  }

  getDischargeSummaryById(id: string): Observable<DischargeSummaryDto> {
    return this.http.get<DischargeSummaryDto>(`${this.apiUrl}/${id}`, {
      headers: this.getAuthHeaders()
    });
  }

  createDischargeSummary(request: CreateDischargeSummaryRequest): Observable<DischargeSummaryDto> {
    return this.http.post<DischargeSummaryDto>(this.apiUrl, request, {
      headers: this.getAuthHeaders()
    });
  }

  updateDischargeSummary(id: string, request: CreateDischargeSummaryRequest): Observable<DischargeSummaryDto> {
    return this.http.put<DischargeSummaryDto>(`${this.apiUrl}/${id}`, request, {
      headers: this.getAuthHeaders()
    });
  }

  deleteDischargeSummary(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`, {
      headers: this.getAuthHeaders()
    });
  }

  publishDraft(id: string): Observable<DischargeSummaryDto> {
    return this.http.post<DischargeSummaryDto>(`${this.apiUrl}/${id}/publish`, {}, {
      headers: this.getAuthHeaders()
    });
  }

  getDraftDischargeSummaries(): Observable<DischargeSummaryDto[]> {
    return this.http.get<DischargeSummaryDto[]>(`${this.apiUrl}/drafts`, {
      headers: this.getAuthHeaders()
    });
  }

  shareDischargeSummaryToPatient(shareId: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/sharetopatients`,
      { shareId: shareId },
      { headers: this.getAuthHeaders() }
    );
  }
}
