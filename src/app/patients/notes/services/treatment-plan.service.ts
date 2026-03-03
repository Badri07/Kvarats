import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { TreatmentPlanDto, CreateTreatmentPlanRequest } from '../models/treatment-plan.model';
import { environment } from '../../../../environments/environments';

@Injectable({
  providedIn: 'root'
})
export class TreatmentPlanService {

  private apiUrl = `${environment.apidev}/treatmentplans`;

  constructor(private http: HttpClient) {}

  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('tokenPatients');
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
  }

  getAllTreatmentPlans(): Observable<TreatmentPlanDto[]> {
    return this.http.get<TreatmentPlanDto[]>(this.apiUrl, {
      headers: this.getAuthHeaders()
    });
  }

  getTreatmentPlansByPatientId(patientId: string): Observable<TreatmentPlanDto[]> {
    return this.http.get<TreatmentPlanDto[]>(`${this.apiUrl}/patient/${patientId}`, {
      headers: this.getAuthHeaders()
    });
  }

  getTreatmentPlanById(id: string): Observable<TreatmentPlanDto> {
    return this.http.get<TreatmentPlanDto>(`${this.apiUrl}/${id}`, {
      headers: this.getAuthHeaders()
    });
  }

  createTreatmentPlan(request: CreateTreatmentPlanRequest): Observable<TreatmentPlanDto> {
    return this.http.post<TreatmentPlanDto>(this.apiUrl, request, {
      headers: this.getAuthHeaders()
    });
  }

  updateTreatmentPlan(id: string, request: CreateTreatmentPlanRequest): Observable<TreatmentPlanDto> {
    return this.http.put<TreatmentPlanDto>(`${this.apiUrl}/${id}`, request, {
      headers: this.getAuthHeaders()
    });
  }

  deleteTreatmentPlan(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`, {
      headers: this.getAuthHeaders()
    });
  }

  publishDraft(id: string): Observable<TreatmentPlanDto> {
    return this.http.post<TreatmentPlanDto>(`${this.apiUrl}/${id}/publish`, {}, {
      headers: this.getAuthHeaders()
    });
  }

  getDraftTreatmentPlans(): Observable<TreatmentPlanDto[]> {
    return this.http.get<TreatmentPlanDto[]>(`${this.apiUrl}/drafts`, {
      headers: this.getAuthHeaders()
    });
  }

  shareTreatmentplansToPatient(shareId: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/sharetopatients`,
      { shareId: shareId },
      { headers: this.getAuthHeaders() }
    );
  }
}
