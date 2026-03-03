import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../../environments/environments';

export interface Patient {
  id: string;
  patientCode: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  dateOfBirth?: Date;
  gender: string;
}

export interface Appointment {
  id: string;
  patientId: string;
  date: Date;
  startTime: string;
  endTime: string;
  meetingType: string;
  appointmentStatus: string;
  meetingTypeId:any;
  services: AppointmentService[];
  diagnoses: AppointmentDiagnosis[];
}

export interface AppointmentService {
  id: string;
  appointmentId: string;
  serviceId: string;
  serviceName: string;
  serviceCode: string;
  chargeAmount: number;
  units: number;
  modifier?: string;
}

export interface AppointmentDiagnosis {
  id: string;
  appointmentId: string;
  diagnosisId: string;
  diagnosisCode: string;
  diagnosisDescription?: string;
  isPrimary: boolean;
}

export interface ClientService {
  id: string;
  serviceId?: string;

  // Display
  label: string;
  description?: string;

  // Pricing
  price: number;

  // Extra info
  metadata?: {
    code?: string;        // CPT code
    duration?: number;
  };

  // Optional / system fields
  categoryId?: string;
  value?: string;
  isSynced?: boolean;
  sortOrder?: number;
  createdAt?: string | null;
  updatedAt?: string | null;
}


export interface MeetingType {
  id: number;
  code: string;
  description:string;

}

export interface SlidingScale {
  id: string;
  minIncome: number;
  maxIncome: number;
  discountPercentage: number;
}

interface ApiResponse<T> {
  data: T;
  message: string;
  success: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class PatientService {
  private apiUrl = `${environment.apidev}`;

  constructor(private http: HttpClient) {}

  getAllPatients(): Observable<Patient[]> {
    return this.http.get<ApiResponse<Patient[]>>(`${this.apiUrl}/Patients/GetAllPatientsWithoutInsurance?pageNumber=1&pageSize=25
`)
      .pipe(map(response => response.data));
  }

  getPatientById(id: string): Observable<Patient> {
    return this.http.get<ApiResponse<Patient>>(`${this.apiUrl}/Patients/${id}`)
      .pipe(map(response => response.data));
  }

getPatientAppointments(patientId: string): Observable<Appointment[]> {
  return this.http.get<Appointment[]>(`${this.apiUrl}/Appointments/patient/${patientId}`);
}

getUnpaidAppointmentsByPatientId(patientId: string): Observable<Appointment[]> {
  return this.http
    .get<ApiResponse<Appointment[]>>(
      `${this.apiUrl}/Appointments/GetUnpaidAppointmentsByPatientId`,
      { params: { patientId } }
    )
    .pipe(
      map(response => response.data ?? [])
    );
}


  getClientServices(): Observable<ClientService[]> {
    return this.http.get<ApiResponse<ClientService[]>>(`${this.apiUrl}/Services/GetClientServices`)
      .pipe(map(response => response.data));
  }



  getSlidingScales(): Observable<SlidingScale[]> {
    return this.http.get<ApiResponse<SlidingScale[]>>(`${this.apiUrl}/SlidingScales`)
      .pipe(map(response => response.data));
  }
}
