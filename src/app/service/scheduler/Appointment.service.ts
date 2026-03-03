import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import {
  Appointment,
  CreateAppointmentRequest,
  AvailabilityDto,
  Diagnosis,
  ServiceItem,
  Patient,
  Therapist,
} from '../../models/CalendarEvent.model';
import { environment } from '../../../environments/environments';

@Injectable({
  providedIn: 'root'
})
export class TherapistAppointmentService {
  private apiUrl = environment.apidev;

  constructor(private http: HttpClient) {}

  getAvailabilitiesByUserId(userId: string): Observable<AvailabilityDto[]> {
    return this.http.get<any>(`${this.apiUrl}/Availabilities/user/${userId}`)
      .pipe(map(response => response.data || response));
  }

  createAppointment(request: CreateAppointmentRequest): Observable<Appointment> {
    return this.http.post<any>(`${this.apiUrl}/Appointments`, request)
      .pipe(map(response => response.data || response));
  }

  updateAppointment(id: string, request: CreateAppointmentRequest): Observable<Appointment> {
    return this.http.put<any>(`${this.apiUrl}/Appointments/${id}`, request)
      .pipe(map(response => response.data || response));
  }

  deleteAppointment(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/Appointments/${id}`);
  }

  getMyAppointments(): Observable<Appointment[]> {
    return this.http.get<any>(`${this.apiUrl}/Appointments/my-appointments`)
      .pipe(map(response => response.data || response));
  }

  getAppointmentById(id: string): Observable<Appointment> {
    return this.http.get<any>(`${this.apiUrl}/Appointments/${id}`)
      .pipe(map(response => response.data || response));
  }

  getPatients(clientId: string): Observable<Patient[]> {
    const params = new HttpParams().set('clientId', clientId);
    return this.http.get<any>(`${this.apiUrl}/Patients`, { params })
      .pipe(map(response => response.data || response));
  }

  getMyPatientsList(): Observable<any> {
    const url = `${environment.apidev}/Patients/my-patients`;
    return this.http.get(url).pipe(
      map((response: any) => response?.data || {}),
      catchError(error => {
        console.error('Error during getting patient list:', error);
        return throwError(() => error);
      })
    );
  }

  getTherapists(clientId: string): Observable<Therapist[]> {
    const params = new HttpParams().set('clientId', clientId);
    return this.http.get<any>(`${this.apiUrl}/Users`, { params })
      .pipe(map(response => response.data || response));
  }

  getPatientDiagnoses(patientId: string): Observable<Diagnosis[]> {
    const params = new HttpParams().set('patientId', patientId);
    return this.http.get<any>(`${this.apiUrl}/Patients/GetPatientDiagnoses`, { params })
      .pipe(map(response => response.data || response));
  }

  getClientServices(clientId: string): Observable<ServiceItem[]> {
    const params = new HttpParams().set('clientId', clientId);
    return this.http.get<any>(`${this.apiUrl}/Services/GetClientServices`, { params })
      .pipe(map(response => {
        const apiItems = response?.data || response || [];
        return apiItems.map((item: any) => ({
          id: item.id,
          categoryId: item.categoryId || '',
          value: item.id,
          label: item.name,
          category: item.category,
          serviceId: item.serviceId,
          description: item.description,
          price: item.defaultRate,
          isActive: item.active,
          isSynced: item.isSynced,
          sortOrder: item.sortOrder || 0,
          metadata: {
            duration: item.defaultDurationMinutes,
            code: item.code
          },
          createdAt: new Date(item.createdAt),
          updatedAt: new Date(item.updatedAt || item.createdAt)
        }));
      }));
  }
}
