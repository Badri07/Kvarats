import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Inject, Injectable, PLATFORM_ID } from '@angular/core';
import { catchError, map, Observable, throwError } from 'rxjs';
import { environment } from '../../../environments/environments';
import {forgotpasswordModel, registerModel, Tokenrefresh, users} from '../../models/user-model'
import { isPlatformBrowser } from '@angular/common';
import { Router } from '@angular/router';
import { JwtHelperService } from '@auth0/angular-jwt';


// const Tokenheaders = new HttpHeaders({
//   'Content-Type': 'application/json',
//   'Authorization': `Bearer ${getToken}`
// });

@Injectable({
  providedIn: 'root'
})
export class PatientAuth {

  constructor(private http:HttpClient, @Inject(PLATFORM_ID) private platformId: string,private router:Router) { }

  private jwtHelper = new JwtHelperService();  
  
  
  // patients
    public getPatientDecodedToken(): any {
    debugger
    const token = localStorage.getItem('tokenPatients');
    if (token) {
      return this.jwtHelper.decodeToken(token);
    }
    return null;
  }

    // patients
    public getPatientRole(): string | null {
    const decoded = this.getPatientDecodedToken();
    return decoded?.role || null;
  }
  // patients
  public getPatientId(): string | null {
    const decoded = this.getPatientDecodedToken();
    return decoded?.sub || null;
  }
  // patients
  public getPatientUsername(): string | null {
    const decoded = this.getPatientDecodedToken();
    return decoded?.UserName || null;;
  }

}