import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import {
  PatientPaymentRequest,
  CreatePaymentTransactionDto,
  PatientPaymentTransaction,
  ApiResponse
} from '../models/payment.models';
import { environment } from '../../../environments/environments';

@Injectable({
  providedIn: 'root'
})
export class PaymentService {
  private apiUrl = environment.apidev;

  constructor(private http: HttpClient) {}

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem("tokenPatients");
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });
  }

  getPaymentRequestsByPatientId(patientId: string): Observable<PatientPaymentRequest[]> {
    return this.http.get<ApiResponse<PatientPaymentRequest[]>>(
      `${this.apiUrl}/PatientPaymentRequests/patient/${patientId}`,
      { headers: this.getHeaders() }
    ).pipe(
      map(response => response.data)
    );
  }

  getPaymentRequestById(id: string): Observable<PatientPaymentRequest> {
    return this.http.get<ApiResponse<PatientPaymentRequest>>(
      `${this.apiUrl}/PatientPaymentRequests/${id}`,
      { headers: this.getHeaders() }
    ).pipe(
      map(response => response.data)
    );
  }

  createPaymentTransaction(transaction: CreatePaymentTransactionDto): Observable<PatientPaymentTransaction> {
    return this.http.post<ApiResponse<PatientPaymentTransaction>>(
      `${this.apiUrl}/PatientPaymentRequests/AddPaymentTransaction`,
      transaction,
      { headers: this.getHeaders() }
    ).pipe(
      map(response => response.data)
    );
  }
}
