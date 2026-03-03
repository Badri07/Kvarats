import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { InitialAssessmentDto, CreateInitialAssessmentRequest } from '../models/initial-assessment.model';
import { environment } from '../../../../environments/environments';

@Injectable({
  providedIn: 'root'
})
export class InitialAssessmentService {
  private apiUrl =   `${environment.apidev}/initialassessments`;

  constructor(private http: HttpClient) { }

  getAllInitialAssessments(): Observable<InitialAssessmentDto[]> {
    return this.http.get<InitialAssessmentDto[]>(this.apiUrl);
  }

  getInitialAssessmentsByPatientId(patientId: string): Observable<InitialAssessmentDto[]> {
    return this.http.get<InitialAssessmentDto[]>(`${this.apiUrl}/patient/${patientId}`);
  }

  getInitialAssessmentById(id: string): Observable<InitialAssessmentDto> {
    return this.http.get<InitialAssessmentDto>(`${this.apiUrl}/${id}`);
  }

  getLatestInitialAssessmentByPatientId(patientId: string): Observable<InitialAssessmentDto> {
    return this.http.get<InitialAssessmentDto>(`${this.apiUrl}/patient/${patientId}/latest`);
  }

  getInitialAssessmentVersions(patientId: string): Observable<InitialAssessmentDto[]> {
    return this.http.get<InitialAssessmentDto[]>(`${this.apiUrl}/patient/${patientId}/versions`);
  }

  createInitialAssessment(request: CreateInitialAssessmentRequest): Observable<InitialAssessmentDto> {
    return this.http.post<InitialAssessmentDto>(this.apiUrl, request);
  }

  updateInitialAssessment(id: string, request: CreateInitialAssessmentRequest): Observable<InitialAssessmentDto> {
    return this.http.put<InitialAssessmentDto>(`${this.apiUrl}/${id}`, request);
  }

  deleteInitialAssessment(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }

  publishDraft(id: string): Observable<InitialAssessmentDto> {
    return this.http.post<InitialAssessmentDto>(`${this.apiUrl}/${id}/publish`, {});
  }

  getDraftInitialAssessments(): Observable<InitialAssessmentDto[]> {
    return this.http.get<InitialAssessmentDto[]>(`${this.apiUrl}/drafts`);
  }
}
