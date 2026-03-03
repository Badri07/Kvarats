import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { DischargeSummaryDto, CreateDischargeSummaryRequest } from '../models/discharge-summary.model';
import { environment } from '../../../../environments/environments';

@Injectable({
  providedIn: 'root'
})
export class DischargeSummaryService {
    private apiUrl =   `${environment.apidev}/dischargesummaries`;

  constructor(private http: HttpClient) {}

  getAllDischargeSummaries(): Observable<DischargeSummaryDto[]> {
    return this.http.get<DischargeSummaryDto[]>(this.apiUrl);
  }

  getDischargeSummariesByPatientId(patientId: string): Observable<DischargeSummaryDto[]> {
    return this.http.get<DischargeSummaryDto[]>(`${this.apiUrl}/patient/${patientId}`);
  }

  getDischargeSummaryById(id: string): Observable<DischargeSummaryDto> {
    return this.http.get<DischargeSummaryDto>(`${this.apiUrl}/${id}`);
  }

  createDischargeSummary(request: CreateDischargeSummaryRequest): Observable<DischargeSummaryDto> {
    return this.http.post<DischargeSummaryDto>(this.apiUrl, request);
  }

  updateDischargeSummary(id: string, request: CreateDischargeSummaryRequest): Observable<DischargeSummaryDto> {
    return this.http.put<DischargeSummaryDto>(`${this.apiUrl}/${id}`, request);
  }

  deleteDischargeSummary(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  publishDraft(id: string): Observable<DischargeSummaryDto> {
    return this.http.post<DischargeSummaryDto>(`${this.apiUrl}/${id}/publish`, {});
  }

  getDraftDischargeSummaries(): Observable<DischargeSummaryDto[]> {
    return this.http.get<DischargeSummaryDto[]>(`${this.apiUrl}/drafts`);
  }
}
