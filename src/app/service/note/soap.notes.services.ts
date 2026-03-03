import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
// import { ApiResponse } from '../models/api-response.model';
// import { SOAPNote, CreateSOAPNoteRequest, UpdateSOAPNoteRequest } from '../models/soap-note.model';
import { environment } from '../../../environments/environments';

export interface SOAPNote {
  id: string;
  patientId: string;
  therapistId: string;
  sessionDate: string;
  nextSessionDate?: string;
  subjective: string;
  objective: string;
  assessment: string;
  plan: string;
  additionalNotes?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateSOAPNoteRequest {
  patientId: string;
  therapistId: string;
  sessionDate: string;
  nextSessionDate?: string;
  subjective: string;
  objective: string;
  assessment: string;
  plan: string;
  additionalNotes?: string;
}

export interface UpdateSOAPNoteRequest {
  patientId: string;
  therapistId: string;
  sessionDate: string;
  nextSessionDate?: string;
  subjective: string;
  objective: string;
  assessment: string;
  plan: string;
  additionalNotes?: string;
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
export class SoapNoteService {

  private apiUrl = `${environment.apidev}/SOAPNotes`;
  constructor(private http: HttpClient) { }

  getAllSOAPNotes(): Observable<any> {
    const url = `${this.apiUrl}`;
    return this.http.get(url);
  }

  getSOAPNoteById(id: string): Observable<ApiResponse<SOAPNote>> {
    return this.http.get<ApiResponse<SOAPNote>>(`${this.apiUrl}/${id}`);
  }

  createSOAPNote(request: CreateSOAPNoteRequest): Observable<ApiResponse<SOAPNote>> {
    return this.http.post<ApiResponse<SOAPNote>>(this.apiUrl, request);
  }


   createSOAPNoteById(id: string, request: any): Observable<ApiResponse<SOAPNote>> {
    return this.http.post<ApiResponse<SOAPNote>>(`${this.apiUrl}/${id}/publish`, request);
   }


   DraftSOAPNote(request: CreateSOAPNoteRequest): Observable<ApiResponse<SOAPNote>> {
    return this.http.post<ApiResponse<SOAPNote>>(this.apiUrl, request);
  }

  updateSOAPNote(id: string, request: UpdateSOAPNoteRequest): Observable<ApiResponse<SOAPNote>> {
    return this.http.put<ApiResponse<SOAPNote>>(`${this.apiUrl}/${id}`, request);
  }

  deleteSOAPNote(id: string): Observable<ApiResponse<boolean>> {
    return this.http.delete<ApiResponse<boolean>>(`${this.apiUrl}/${id}`);
  }
}