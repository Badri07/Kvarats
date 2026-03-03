import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environments';

export interface TreatmentPlan {
  id: string;
  patientId: string;
  therapistId: string;
  startDate: string;
  endDate?: string;
  diagnosis: string;
  frequency: string;
  duration: string;
  problemStatement: string;
  goals: string;
  objectives: string;
  interventions: string;
  progressMeasurement: string;
  notes?: string;
  status?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateTreatmentPlanRequest {
  patientId: string;
  therapistId: string;
  startDate: string;
  endDate?: string;
  diagnosis: string;
  frequency: string;
  duration: string;
  problemStatement: string;
  goals: string;
  objectives: string;
  interventions: string;
  progressMeasurement: string;
  notes?: string;
}

export interface UpdateTreatmentPlanRequest {
  patientId: string;
  therapistId: string;
  startDate: string;
  endDate?: string;
  diagnosis: string;
  frequency: string;
  duration: string;
  problemStatement: string;
  goals: string;
  objectives: string;
  interventions: string;
  progressMeasurement: string;
  notes?: string;
}

export interface ApiResponse<T> {
  data: T;
  message: string;
  success: boolean;
  errors?: string[];
}
@Injectable({
  providedIn: 'root'
})
export class TreatmentPlanService {
  private apiUrl = `${environment.apidev}/TreatmentPlans`;

  constructor(private http: HttpClient) { }

  getAllTreatmentPlans(patientId?: string): Observable<ApiResponse<TreatmentPlan[]>> {
    const url = patientId ? `${this.apiUrl}/patient/${patientId}` : this.apiUrl;
    return this.http.get<ApiResponse<TreatmentPlan[]>>(url);
  }

  getTreatmentList():Observable<any>{
    return this.http.get(`${this.apiUrl}`)
  }

  getTreatmentPlanById(id: string): Observable<ApiResponse<TreatmentPlan>> {
    return this.http.get<ApiResponse<TreatmentPlan>>(`${this.apiUrl}/${id}`);
  }

  createTreatmentPlan(request: CreateTreatmentPlanRequest): Observable<ApiResponse<TreatmentPlan>> {
    return this.http.post<ApiResponse<TreatmentPlan>>(this.apiUrl, request);
  }

  updateTreatmentPlan(id: string, request: UpdateTreatmentPlanRequest): Observable<ApiResponse<TreatmentPlan>> {
    return this.http.put<ApiResponse<TreatmentPlan>>(`${this.apiUrl}/${id}`, request);
  }

  deleteTreatmentPlan(id: string): Observable<ApiResponse<boolean>> {
    return this.http.delete<ApiResponse<boolean>>(`${this.apiUrl}/${id}`);
  }
}