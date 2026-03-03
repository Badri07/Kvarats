import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { InitialAssessmentDto, CreateInitialAssessmentRequest } from '../models/initial-assessment.model';
import { environment } from '../../../../environments/environments';

@Injectable({
  providedIn: 'root'
})
export class InitialAssessmentService {

  private apiUrl = `${environment.apidev}/initialassessments`;

  constructor(private http: HttpClient) { }

  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('tokenPatients');
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
  }

  getAllInitialAssessments(): Observable<InitialAssessmentDto[]> {
    return this.http.get<InitialAssessmentDto[]>(this.apiUrl, {
      headers: this.getAuthHeaders()
    });
  }

  getInitialAssessmentsByPatientId(patientId: string): Observable<InitialAssessmentDto[]> {
    return this.http.get<InitialAssessmentDto[]>(`${this.apiUrl}/patient/${patientId}`, {
      headers: this.getAuthHeaders()
    });
  }

  getInitialAssessmentById(id: string): Observable<InitialAssessmentDto> {
    return this.http.get<InitialAssessmentDto>(`${this.apiUrl}/${id}`, {
      headers: this.getAuthHeaders()
    });
  }

  getLatestInitialAssessmentByPatientId(patientId: string): Observable<InitialAssessmentDto> {
    return this.http.get<InitialAssessmentDto>(`${this.apiUrl}/patient/${patientId}/latest`, {
      headers: this.getAuthHeaders()
    });
  }

  getInitialAssessmentVersions(patientId: string): Observable<InitialAssessmentDto[]> {
    return this.http.get<InitialAssessmentDto[]>(`${this.apiUrl}/patient/${patientId}/versions`, {
      headers: this.getAuthHeaders()
    });
  }

  createInitialAssessment(request: CreateInitialAssessmentRequest): Observable<InitialAssessmentDto> {
    return this.http.post<InitialAssessmentDto>(this.apiUrl, request, {
      headers: this.getAuthHeaders()
    });
  }

  updateInitialAssessment(id: string, request: CreateInitialAssessmentRequest): Observable<InitialAssessmentDto> {
    return this.http.put<InitialAssessmentDto>(`${this.apiUrl}/${id}`, request, {
      headers: this.getAuthHeaders()
    });
  }

  deleteInitialAssessment(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`, {
      headers: this.getAuthHeaders()
    });
  }

  publishDraft(id: string): Observable<InitialAssessmentDto> {
    return this.http.post<InitialAssessmentDto>(`${this.apiUrl}/${id}/publish`, {}, {
      headers: this.getAuthHeaders()
    });
  }

  getDraftInitialAssessments(): Observable<InitialAssessmentDto[]> {
    return this.http.get<InitialAssessmentDto[]>(`${this.apiUrl}/drafts`, {
      headers: this.getAuthHeaders()
    });
  }

  shareInitialAssessmentToPatient(shareId: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/sharetopatients`,
      { shareId: shareId },
      { headers: this.getAuthHeaders() }
    );
  }
}
