import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable, signal } from '@angular/core';
import { Inject,PLATFORM_ID } from '@angular/core';
import { catchError, map, Observable, throwError, of, delay, } from 'rxjs';
import { environment } from '../../../environments/environments';
import { PatientPaymentRequestDto, ApiResponse } from '../../models/payment.models';
import { Router } from '@angular/router';

const headers = new HttpHeaders({
  'Content-Type': 'application/json'
});

@Injectable({
  providedIn: 'root'
})
export class PaymentService {


  constructor(private http:HttpClient, @Inject(PLATFORM_ID) private platformId: string,private router:Router) { }

  // Mock data for demonstration
  private mockPaymentRequests: PatientPaymentRequestDto[] = [
    {
      id: '1',
      patientId: 'patient-1',
      invoiceDate: new Date('2024-01-15'),
      totalAmount: 450.00,
      discountAmount: 50.00,
      finalAmount: 400.00,
      status: 'Paid',
      notes: 'Regular consultation and therapy session',
      balance: 0,
      services: [
        {
          id: 'service-1',
          serviceId: 'srv-001',
          cptCode: '99213',
          description: 'Office consultation',
          serviceDate: new Date('2024-01-15'),
          chargedAmount: 250.00,
          units: 1,
          meetingTypeInput: 1
        },
        {
          id: 'service-2',
          serviceId: 'srv-002',
          cptCode: '90837',
          description: 'Psychotherapy session',
          serviceDate: new Date('2024-01-15'),
          chargedAmount: 200.00,
          units: 1,
          meetingTypeInput: 2
        }
      ],
      transactions: [
        {
          id: 'txn-1',
          amountPaid: 400.00,
          paymentMethod: 'Credit Card',
          transactionReference: 'TXN-001-2024',
          notes: 'Payment processed successfully',
          paymentDate: new Date('2024-01-16'),
          isSuccessful: true
        }
      ]
    },
    {
      id: '2',
      patientId: 'patient-1',
      invoiceDate: new Date('2024-01-22'),
      totalAmount: 300.00,
      discountAmount: 0.00,
      finalAmount: 300.00,
      status: 'Partial',
      notes: 'Follow-up therapy session',
      balance: 150.00,
      services: [
        {
          id: 'service-3',
          serviceId: 'srv-003',
          cptCode: '90834',
          description: 'Individual psychotherapy',
          serviceDate: new Date('2024-01-22'),
          chargedAmount: 300.00,
          units: 1,
          meetingTypeInput: 1
        }
      ],
      transactions: [
        {
          id: 'txn-2',
          amountPaid: 150.00,
          paymentMethod: 'Check',
          transactionReference: 'CHK-002-2024',
          notes: 'Partial payment received',
          paymentDate: new Date('2024-01-23'),
          isSuccessful: true
        }
      ]
    },
    {
      id: '3',
      patientId: 'patient-1',
      invoiceDate: new Date('2024-01-29'),
      totalAmount: 175.00,
      discountAmount: 25.00,
      finalAmount: 150.00,
      status: 'Pending',
      notes: 'Therapy session with family counseling',
      balance: 150.00,
      services: [
        {
          id: 'service-4',
          serviceId: 'srv-004',
          cptCode: '90847',
          description: 'Family therapy session',
          serviceDate: new Date('2024-01-29'),
          chargedAmount: 175.00,
          units: 1,
          meetingTypeInput: 3
        }
      ],
      transactions: []
    }
  ];

  // getPaymentRequestsByPatientId(patientId: string): Observable<ApiResponse<PatientPaymentRequestDto[]>> {
  //   // Simulate API call with delay
  //   return of({
  //     success: true,
  //     message: 'Payment requests retrieved successfully',
  //     data: this.mockPaymentRequests.filter(pr => pr.patientId === patientId)
  //   }).pipe(delay(500));
  // }

  getPaymentRequestsByPatientId(id?: string): Observable<ApiResponse<PatientPaymentRequestDto[]>> {  
    console.log("patientid",id);
  let params = new HttpParams();
  if (id) {
    params = params.set('patientId', id);
  }
  // Get the token from localStorage
  const token = localStorage.getItem('tokenPatients');
  
  // Set up headers with Authorization
  const headers = new HttpHeaders({
    'Authorization': `Bearer ${token}`
  });

  return this.http.get(`${environment.apidev}/Billing/GetPaymentRequestsByPatientId`, { 
    params, 
    headers 
  }).pipe(
    map((response: any) => {
      return response?.data || response;
    }),
    catchError(error => {
      console.error('Error during getting GetInvoicesByPatient list:', error);
      return throwError(() => error);
    })
  );
}

  getPaymentRequestById(id: string): Observable<ApiResponse<PatientPaymentRequestDto>> {
  if (!id) {
    return throwError(() => new Error('Payment request ID is required'));
  }

  // Get the token from localStorage
  const token = localStorage.getItem('tokenPatients');

  // Set up headers with Authorization
  const headers = new HttpHeaders({
    'Authorization': `Bearer ${token}`
  });

  // Set up query params
  const params = new HttpParams().set('id', id);

  return this.http.get<ApiResponse<PatientPaymentRequestDto>>(
    `${environment.apidev}/Billing/GetPaymentRequestById`,
    { params, headers }
  ).pipe(
    map((response: ApiResponse<PatientPaymentRequestDto>) => response),
    catchError(error => {
      console.error('Error fetching payment request by ID:', error);
      return throwError(() => error);
    })
  );
}

}