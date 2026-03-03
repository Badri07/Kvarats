import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { TreatmentPlanDto, CreateTreatmentPlanRequest } from '../models/treatment-plan.model';
import { environment } from '../../../../environments/environments';

@Injectable({
  providedIn: 'root'
})
export class TreatmentPlanService {
  private apiUrl = `${environment.apidev}/treatmentplans`;

  constructor(private http: HttpClient) {}

  getAllTreatmentPlans(): Observable<TreatmentPlanDto[]> {
    return this.http.get<TreatmentPlanDto[]>(this.apiUrl);
  }

  getTreatmentPlansByPatientId(patientId: string): Observable<TreatmentPlanDto[]> {
    return this.http.get<TreatmentPlanDto[]>(`${this.apiUrl}/patient/${patientId}`);
  }

  getTreatmentPlanById(id: string): Observable<TreatmentPlanDto> {
    return this.http.get<TreatmentPlanDto>(`${this.apiUrl}/${id}`);
  }

  createTreatmentPlan(request: CreateTreatmentPlanRequest): Observable<TreatmentPlanDto> {
    return this.http.post<TreatmentPlanDto>(this.apiUrl, request);
  }

  updateTreatmentPlan(id: string, request: CreateTreatmentPlanRequest): Observable<TreatmentPlanDto> {
    return this.http.put<TreatmentPlanDto>(`${this.apiUrl}/${id}`, request);
  }

  deleteTreatmentPlan(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  publishDraft(id: string): Observable<TreatmentPlanDto> {
    return this.http.post<TreatmentPlanDto>(`${this.apiUrl}/${id}/publish`, {});
  }

  getDraftTreatmentPlans(): Observable<TreatmentPlanDto[]> {
    return this.http.get<TreatmentPlanDto[]>(`${this.apiUrl}/drafts`);
  }
}
