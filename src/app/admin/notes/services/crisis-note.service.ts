import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { CrisisNoteDto, CreateCrisisNoteRequest } from '../models/crisis-note.model';
import { environment } from '../../../../environments/environments';

@Injectable({
  providedIn: 'root'
})
export class CrisisNoteService {
  private apiUrl =   `${environment.apidev}/crisisnotes`;
  
  constructor(private http: HttpClient) {}

  getAllCrisisNotes(): Observable<CrisisNoteDto[]> {
    return this.http.get<CrisisNoteDto[]>(this.apiUrl);
  }

  getCrisisNotesByPatientId(patientId: string): Observable<CrisisNoteDto[]> {
    return this.http.get<CrisisNoteDto[]>(`${this.apiUrl}/patient/${patientId}`);
  }

  getCrisisNoteById(id: string): Observable<CrisisNoteDto> {
    return this.http.get<CrisisNoteDto>(`${this.apiUrl}/${id}`);
  }

  createCrisisNote(request: CreateCrisisNoteRequest): Observable<CrisisNoteDto> {
    return this.http.post<CrisisNoteDto>(this.apiUrl, request);
  }

  updateCrisisNote(id: string, request: CreateCrisisNoteRequest): Observable<CrisisNoteDto> {
    return this.http.put<CrisisNoteDto>(`${this.apiUrl}/${id}`, request);
  }

  deleteCrisisNote(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  publishDraft(id: string): Observable<CrisisNoteDto> {
    return this.http.post<CrisisNoteDto>(`${this.apiUrl}/${id}/publish`, {});
  }

  getDraftCrisisNotes(): Observable<CrisisNoteDto[]> {
    return this.http.get<CrisisNoteDto[]>(`${this.apiUrl}/drafts`);
  }
}
