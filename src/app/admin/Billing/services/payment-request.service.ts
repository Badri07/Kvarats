import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import {
  PatientPaymentRequestDto,
  CreatePatientPaymentRequestRequest,
  UpdatePatientPaymentRequestRequest,
  CreatePaymentTransactionRequest,
  PatientPaymentTransactionDto,
  PaymentRequestSummaryDto,
  ApiResponse
} from '../models/payment-request.model';
import { environment } from '../../../../environments/environments';

@Injectable({
  providedIn: 'root'
})
export class PaymentRequestService {
  private apiUrl = `${environment.apidev}/PatientPaymentRequests`;

  constructor(private http: HttpClient) {}

  getAllPaymentRequests(): Observable<PatientPaymentRequestDto[]> {
    return this.http
      .get<ApiResponse<PatientPaymentRequestDto[]>>(this.apiUrl)
      .pipe(map(response => response.data));
  }

  getPaymentRequestsByPatientId(patientId: string): Observable<PatientPaymentRequestDto[]> {
    return this.http
      .get<ApiResponse<PatientPaymentRequestDto[]>>(`${this.apiUrl}/patient/${patientId}`)
      .pipe(map(response => response.data));
  }

  markPaymentRequestCompleted(requestId: string): Observable<void> {
  return this.http
    .post<ApiResponse<null>>(
      `${this.apiUrl}/${requestId}/mark-completed`,
      {}
    )
    .pipe(map(() => void 0));
}


  getPaymentRequestById(id: string): Observable<PatientPaymentRequestDto> {
    return this.http
      .get<ApiResponse<PatientPaymentRequestDto>>(`${this.apiUrl}/${id}`)
      .pipe(map(response => response.data));
  }

  createPaymentRequest(request: CreatePatientPaymentRequestRequest): Observable<PatientPaymentRequestDto> {
    return this.http
      .post<ApiResponse<PatientPaymentRequestDto>>(this.apiUrl, request)
      .pipe(map(response => response.data));
  }

  createPaymentRequestFromAppointment(appointmentId: string): Observable<PatientPaymentRequestDto> {
    return this.http
      .post<ApiResponse<PatientPaymentRequestDto>>(
        `${this.apiUrl}/from-appointment/${appointmentId}`,
        {}
      )
      .pipe(map(response => response.data));
  }

  createPaymentRequestFromAppointments(appointmentIds: string[]): Observable<PatientPaymentRequestDto> {
    return this.http
      .post<ApiResponse<PatientPaymentRequestDto>>(
        `${this.apiUrl}/from-appointments`,
        appointmentIds
      )
      .pipe(map(response => response.data));
  }

  updatePaymentRequest(id: string, request: any): Observable<PatientPaymentRequestDto> {
    return this.http
      .put<ApiResponse<PatientPaymentRequestDto>>(`${this.apiUrl}/${id}`, request)
      .pipe(map(response => response.data));
  }

  deletePaymentRequest(id: string): Observable<void> {
    return this.http
      .delete<ApiResponse<void>>(`${this.apiUrl}/${id}`)
      .pipe(map(() => undefined));
  }

  addPaymentTransaction(request: CreatePaymentTransactionRequest): Observable<PatientPaymentTransactionDto> {
    return this.http
      .post<ApiResponse<PatientPaymentTransactionDto>>(
        `${this.apiUrl}/${request.paymentRequestId}/transactions`,
        request
      )
      .pipe(map(response => response.data));
  }

  getPaymentTransactions(paymentRequestId: string): Observable<PatientPaymentTransactionDto[]> {
    return this.http
      .get<ApiResponse<PatientPaymentTransactionDto[]>>(
        `${this.apiUrl}/${paymentRequestId}/transactions`
      )
      .pipe(map(response => response.data));
  }

  markAsCompleted(id: string): Observable<void> {
    return this.http
      .post<ApiResponse<void>>(`${this.apiUrl}/${id}/mark-completed`, {})
      .pipe(map(() => undefined));
  }

  markAsCancelled(id: string): Observable<void> {
    return this.http
      .post<ApiResponse<void>>(`${this.apiUrl}/${id}/mark-cancelled`, {})
      .pipe(map(() => undefined));
  }

  getPatientPaymentSummary(patientId: string): Observable<PaymentRequestSummaryDto> {
    return this.http
      .get<ApiResponse<PaymentRequestSummaryDto>>(
        `${this.apiUrl}/patient/${patientId}/summary`
      )
      .pipe(map(response => response.data));
  }

  getPaymentRequestsByStatus(status: string): Observable<PatientPaymentRequestDto[]> {
    return this.http
      .get<ApiResponse<PatientPaymentRequestDto[]>>(`${this.apiUrl}/status/${status}`)
      .pipe(map(response => response.data));
  }

  getOutstandingPaymentRequests(): Observable<PatientPaymentRequestDto[]> {
    return this.http
      .get<ApiResponse<PatientPaymentRequestDto[]>>(`${this.apiUrl}/outstanding`)
      .pipe(map(response => response.data));
  }

  getOverduePaymentRequests(daysOverdue: number = 30): Observable<PatientPaymentRequestDto[]> {
    const params = new HttpParams().set('daysOverdue', daysOverdue.toString());
    return this.http
      .get<ApiResponse<PatientPaymentRequestDto[]>>(`${this.apiUrl}/overdue`, { params })
      .pipe(map(response => response.data));
  }

  getPaymentRequestsByDateRange(startDate: Date, endDate: Date): Observable<PatientPaymentRequestDto[]> {
    const params = new HttpParams()
      .set('startDate', startDate.toISOString())
      .set('endDate', endDate.toISOString());

    return this.http
      .get<ApiResponse<PatientPaymentRequestDto[]>>(`${this.apiUrl}/date-range`, { params })
      .pipe(map(response => response.data));
  }

  getPatientAmountDue(patientId: string): Observable<any> {
    return this.http
      .get<ApiResponse<any>>(`${this.apiUrl}/patient/${patientId}/amount-due`)
      .pipe(map(response => response.data));
  }

  deletePaymentTransaction(transactionId: string): Observable<void> {
    return this.http
      .delete<ApiResponse<void>>(`${this.apiUrl}/transactions/${transactionId}`)
      .pipe(map(() => undefined));
  }
}