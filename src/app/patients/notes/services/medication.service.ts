import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environments';

export interface MedicationDto {
  id: number;
  name: string;
  genericName?: string;
  drugClass?: string;
  createdAt: string;
  active: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class MedicationService {

  private apiUrl = `${environment.apidev}/medications`;

  constructor(private http: HttpClient) {}

  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('tokenPatients');
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
  }

  getAllMedications(): Observable<MedicationDto[]> {
    return this.http.get<MedicationDto[]>(this.apiUrl, {
      headers: this.getAuthHeaders()
    });
  }
}
