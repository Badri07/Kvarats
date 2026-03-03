import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Patient, PaginatedPatients } from '../models/patient.model';
import { environment } from '../../../../environments/environments';

@Injectable({
  providedIn: 'root'
})
export class PatientService {
    private apiUrl =   `${environment.apidev}/patients`;
  constructor(private http: HttpClient) { }

   getPatientsByClientId(clientId: string, pageNumber: number = 1, pageSize: number = 10, searchTerm: string = ''): Observable<PaginatedPatients> {
    let params = new HttpParams()
      .set('pageNumber', pageNumber.toString())
      .set('pageSize', pageSize.toString());

    if (searchTerm) {
      params = params.set('searchTerm', searchTerm);
    }

    return this.http.get<PaginatedPatients>(`${this.apiUrl}/client/${clientId}`, { params });
  }

  getPatientById(patientId: string): Observable<Patient> {
    return this.http.get<Patient>(`${this.apiUrl}/${patientId}`);
  }
}
