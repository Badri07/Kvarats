import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Inject, Injectable, PLATFORM_ID } from '@angular/core';
import { catchError, map, Observable, throwError } from 'rxjs';
import { environment } from '../../../environments/environments';
import {forgotpasswordModel, registerModel, Tokenrefresh, users} from '../../models/user-model'
import { isPlatformBrowser } from '@angular/common';
import { Router } from '@angular/router';
import { JwtHelperService } from '@auth0/angular-jwt';
import { Payment } from '../../models/patients-interface';

const headers = new HttpHeaders({
  'Content-Type': 'application/json'
});

// const Tokenheaders = new HttpHeaders({
//   'Content-Type': 'application/json',
//   'Authorization': `Bearer ${getToken}`
// });

@Injectable({
  providedIn: 'root'
})
export class PatientService {

  constructor(private http:HttpClient, @Inject(PLATFORM_ID) private platformId: string,private router:Router) { }


  GetInvoicesByPatient(id?: string): Observable<any> {
  let params = new HttpParams();
  if (id) {
    params = params.set('patientId', id);
  }
  return this.http.get(`${environment.apidev}/Patients/GetInvoicesByPatient`,{ params }).pipe(
    map((response: any) => {
      return response?.data || response;
    }),
    catchError(error => {
      console.error('Error during getting GetInvoicesByPatient list:', error);
      return throwError(() => error);
    })
  );
}

AddPaymentsByPatient(data:Payment):Observable<any> {
     return this.http.post(`${environment.apidev}/Patients/AddPaymentsByPatient`,data).pipe(
      map((response: any) => {
        return response?.data || response;
      }),
      catchError(error => {
        console.error('Error during sign in:', error);
        return throwError(() => error);
      })
    )
  
  }


  patientLogIn(data: any): Observable<any> {
  return this.http.post(`${environment.apidev}/Auth/patient-login`, data, { headers }).pipe(
    map((response: any) => {
      return response;
    }),
    catchError(error => {
      console.error('Error during sign in:', error);
      return throwError(() => error);
    })
  );
  }
}
