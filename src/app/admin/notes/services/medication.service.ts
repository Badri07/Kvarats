import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
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
      
  private apiUrl =   `${environment.apidev}/medications`;

  constructor(private http: HttpClient) {}

  getAllMedications(): Observable<MedicationDto[]> {
    return this.http.get<MedicationDto[]>(this.apiUrl);
  }
}
