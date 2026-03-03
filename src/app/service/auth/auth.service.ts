import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Inject, Injectable, PLATFORM_ID } from '@angular/core';
import { BehaviorSubject, catchError, map, Observable, throwError } from 'rxjs';
import { environment } from '../../../environments/environments';
import {forgotpasswordModel, registerModel, Tokenrefresh, users} from '../../models/user-model'
import { isPlatformBrowser } from '@angular/common';
import { Router } from '@angular/router';
import { JwtHelperService } from '@auth0/angular-jwt';
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
export class AuthService {


  constructor(private http:HttpClient, @Inject(PLATFORM_ID) private platformId: string,private router:Router) { }

  private jwtHelper = new JwtHelperService();

  // signIn(data:registerModel):Observable<any>{
  //     return this.http.post(`${environment.apidev}/Auth/register`,data,{ headers })
  // }


 // auth.service.ts
private currentUserType = new BehaviorSubject<string | null>(
  this.getStoredUserType()
);

private getStoredUserType(): string | null {
  // Check sessionStorage first, then localStorage as fallback
  return sessionStorage.getItem('userType') || localStorage.getItem('userType') || null;
}

setUserType(userType: string, remember: boolean = false): void {
  this.currentUserType.next(userType);
  if (remember) {
    localStorage.setItem('userType', userType);
    // Also set in sessionStorage for immediate access
    sessionStorage.setItem('userType', userType);
  } else {
    sessionStorage.setItem('userType', userType);
  }
}

getUserType(): string | null {
  return this.currentUserType.value;
}

clearUserType(): void {
  this.currentUserType.next(null);
  sessionStorage.removeItem('userType');
  localStorage.removeItem('userType');
}


public getDecodedToken(): any {
  const token = localStorage.getItem('token');
  if (token) {
    return this.jwtHelper.decodeToken(token);
  }
  return null;
}



  // patients
    public getPatientDecodedToken(): any {
    
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
  public getPatientId(): string {
    const decoded = this.getPatientDecodedToken();
    return decoded?.nameid || null;
  }
   public getPatientClientId(): string {
    const decoded = this.getPatientDecodedToken();
    return decoded?.ClientId || null;
  }
  // patients
  public getPatientUsername(): string  {
    const decoded = this.getPatientDecodedToken();
    return decoded?.unique_name || null;;
  }

  // patients
   public getPatientEmail(): string {
    const decoded = this.getPatientDecodedToken();
    return  decoded?.email || null;
  }

  public getUserRole(): string  {
    const decoded = this.getDecodedToken();
    return decoded?.role ;
  }

   public getSoloProvider(): string  {
    const decoded = this.getDecodedToken();
    return decoded?.IsSoloProvider ;
  }

   public getClientId(): string | null {
    const decoded = this.getDecodedToken();
    return decoded?.ClientId || null;
  }

  public getCurrentUserName(): string | null {
    const decoded = this.getDecodedToken();
    return decoded?.unique_name || null;
  }
  

  public getUserId(): string {
    const decoded = this.getDecodedToken();
    return decoded?.nameid || null;
  }


  //  public getUserId(): string | null {
  //   const decoded = this.getDecodedToken();
  //   return decoded?.userId || null;
  // }
  public getUsername(): string | null {
    const decoded = this.getDecodedToken();
    return decoded?.unique_name || null;;
  }

  public getUserEmail(): string | null {
    const decoded = this.getDecodedToken();
    return  decoded?.email || null;
  }


  public isTokenExpired(): boolean {
    const token = localStorage.getItem('token');
    return this.jwtHelper.isTokenExpired(token || '');
  }

   getAuthHeaders(): HttpHeaders {

    if (isPlatformBrowser(this.platformId)) {
      const token = localStorage.getItem('token');
      if (token) {
        headers.set('Authorization', `Bearer ${token}`);
      }
    }
    return headers;
  }

  signIn(data: registerModel): Observable<any> {
  return this.http.post(`${environment.apidev}/Auth/register`, data).pipe(
    map((response: any) => {
      return response;
    }),
    catchError(error => {
      console.error('Error during sign in:', error);
      return throwError(() => error);
    })
  );
  }



 logIn(data: any): Observable<any> {
  
  return this.http.post(`${environment.apidev}/Auth/login/step1`, data, { headers }).pipe(
    map((response: any) => {
      return response;
    }),
    catchError(error => {
      console.error('Error during sign in:', error);
      return throwError(() => error);
    })
  );
  }

  SuperAdminlogIn(data: any): Observable<any> {
  
  return this.http.post(`${environment.apidev}/Auth/superadmin/login/step1`, data, { headers }).pipe(
    map((response: any) => {
      return response;
    }),
    catchError(error => {
      console.error('Error during sign in:', error);
      return throwError(() => error);
    })
  );
  }

  
  enable2FA(data: { challengeToken: string; role: string }): Observable<any> {
    return this.http.post(`${environment.apidev}/Auth/enable-2fa`, data, { headers }).pipe(
      map((response: any) => response),
      catchError(error => {
        console.error('Error during enable 2FA:', error);
        return throwError(() => error);
      })
    );
  }

  private soloProviderSubject = new BehaviorSubject<boolean>(false);
  soloProvider$ = this.soloProviderSubject.asObservable();
  setSoloProvider(value: boolean) {
    this.soloProviderSubject.next(value);
  }

  verify2FA(data: { tempToken: string; otp: string }): Observable<any> {
    return this.http.post(`${environment.apidev}/Auth/login/step2`, data, { headers }).pipe(
      map((response: any) => response),
      catchError(error => {
        console.error('Error during verify 2FA:', error);
        return throwError(() => error);
      })
    );
  }

   SuperAdminverify2FA(data: { tempToken: string; otp: string }): Observable<any> {
    return this.http.post(`${environment.apidev}/Auth/superadmin/login/step2`, data, { headers }).pipe(
      map((response: any) => response),
      catchError(error => {
        console.error('Error during verify 2FA:', error);
        return throwError(() => error);
      })
    );
  }


  // Generate new recovery codes (after 2FA setup)
generateRecoveryCodes(data: { challengeToken: string }): Observable<any> {
  return this.http.post(`${environment.apidev}/Auth/generate-recovery-codes`, data, { headers }).pipe(
    map((response: any) => response),
    catchError(error => {
      console.error('Error generating recovery codes:', error);
      return throwError(() => error);
    })
  );
}

// Verify recovery code (login with recovery code instead of OTP)
verifyRecoveryCode(data: { challengeToken: string; code: string }): Observable<any> {
  return this.http.post(`${environment.apidev}/Auth/verify-recovery-code`, data, { headers }).pipe(
    map((response: any) => response),
    catchError(error => {
      console.error('Error verifying recovery code:', error);
      return throwError(() => error);
    })
  );
}

 

  getRefreshToken(data: { refreshToken: string }): Observable<any>{
     return this.http.post(`${environment.apidev}/Auth/refreshtoken`, data).pipe(
    map((response: any) => {
      return response?.data || response;
    }),
    catchError(error => {
      console.error('Error during sign in:', error);
      return throwError(() => error);
    })
  );
  }

  // addAvailability(data: registerModel): Observable<any> {

  // const getToken = localStorage.getItem('token');
  // const headers = new HttpHeaders({
  //   'Content-Type': 'application/json',
  //   'Authorization': `Bearer ${getToken}`
  // });

  // return this.http.post(`${environment.apidev}/UserLeavesAndAvailability/AddOrUpdateMultipleAvailability`, data, { headers }).pipe(
  //   map((response: any) => {
  //     return response?.data || response;
  //   }),
  //   catchError(error => {
  //     console.error('Error during sign in:', error);
  //     return throwError(() => error);
  //   })
  // );
  // }  

getUserList(clientId?: string): Observable<any[]> {
  return this.http.get<any[]>(`${environment.apidev}/Users/client/${clientId}`,).pipe(
    map((response: any) => response?.data || response),
    catchError(error => {
      console.error('Error during getting user list:', error);
      return throwError(() => error);
    })
  );
}

getRoleList(): Observable<any> {
  

  return this.http.get(`${environment.apidev}/Roles`).pipe(
    map((response: any) => {
      return response?.data || response;
    }),
    catchError(error => {
      console.error('Error during getting user list:', error);
      return throwError(() => error);
    })
  );
}

getTherapistList(userId?: string): Observable<any> {
  let params = new HttpParams();
  if (userId) {
    params = params.set('clientId', userId);
  }
  return this.http.get(`${environment.apidev}/Users/therapists`, { params }).pipe(
    map((response: any) => {
      return response?.data || response;
    }),
    catchError(error => {
      console.error('Error during getting user list:', error);
      return throwError(() => error);
    })
  );
}
forgotPassword(data: forgotpasswordModel, userType?: string): Observable<any> {
  let endpoint: string;
  
  switch(userType?.toLowerCase()) {
    case 'super admin':
    case 'superadmin':
      endpoint = `${environment.apidev}/Auth/superadmin/send-password-reset-otp`;
      break;
    case 'patient':
      endpoint = `${environment.apidev}/Auth/patient/send-password-reset-otp`;
      break;
    default:
      endpoint = `${environment.apidev}/Auth/user/send-password-reset-otp`;
  }
  
  return this.http.post(endpoint, data, { headers }).pipe(
    map((response: any) => {
      return response;
    }),
    catchError(error => {
      console.error('Error during forgot password:', error);
      return throwError(() => error);
    })
  );
}

verifyPassword(data: forgotpasswordModel, userType?: string): Observable<any> {
  let endpoint: string;
  
  switch(userType?.toLowerCase()) {
    case 'superadmin':
    case 'super admin':
      endpoint = `${environment.apidev}/Auth/superadmin/verify-otp`;
      break;
    case 'patient':
      endpoint = `${environment.apidev}/Auth/patient/verify-otp`;
      break;
    default:
      endpoint = `${environment.apidev}/Auth/user/verify-otp`;
  }
  
  return this.http.post(endpoint, data, {headers}).pipe(
    map((response: any) => {
      return response?.data || response;
    }),
    catchError(error => {
      console.error('Error during OTP verification:', error);
      return throwError(() => error);
    })
  );
}

resetPassword(data: forgotpasswordModel, userType?: string): Observable<any> {
  let endpoint: string;
  
  switch(userType?.toLowerCase()) {
    case 'superadmin':
    case 'super admin':
      endpoint = `${environment.apidev}/Auth/superadmin/reset-password`;
      break;
    case 'patient':
      endpoint = `${environment.apidev}/Auth/patient/reset-password`;
      break;
    default:
      endpoint = `${environment.apidev}/Auth/user/reset-password`;
  }
  
  return this.http.post(endpoint, data, {headers}).pipe(
    map((response: any) => {
      return response?.data || response;
    }),
    catchError(error => {
      console.error('Error during password reset:', error);
      return throwError(() => error);
    })
  );
}

logout(){
  const userRole = this.getUserRole();
  localStorage.removeItem('token');
  localStorage.removeItem('tokenPatients');
  localStorage.removeItem('user');
  localStorage.removeItem('quickbooks_popup_shown');
  localStorage.removeItem('quickbooks_popup_dismissed');
  this.clearUserType();
  
  switch(userRole?.toLowerCase()) {
    case 'superadmin':
      this.router.navigate(['/superAdmin/login']);
      break;
    case 'patient':
      this.router.navigate(['/patient/login']);
      break;
    case 'admin':
    default:
      this.router.navigate(['/login']);
  }
}
  
   Patientslogout(){
    localStorage.removeItem('tokenPatients');
    localStorage.removeItem('user');
    this.router.navigate(['/patient/login']);
  }

  getTokenInfo() {
    if (isPlatformBrowser(this.platformId) && localStorage.getItem('token') !== 'undefined') {
      const token = localStorage.getItem('token');


      if (token) {
        return JSON.parse(atob(token.split('.')[1]));
      }
    }
    return null;
  }

   refreshToken(): Observable<any> {
    const token = localStorage.getItem('token');
    return this.http.get(`${environment.apidev}/Auth/refreshtoken`, {
      headers: { Authorization: `Bearer ${token}` },
    });
  }


//dropdown
 getCountries(): Observable<any> {
    return this.http.get(`${environment.apidev}/CountriesData/GetCountries`);
  }


getMobilePrefixes(country: string): Observable<any> {
    return this.http.get(`${environment.apidev}/CountriesData/GetMobilePrefix`, {
      params: { country }
    });
  }

  // Get States by Country
  getStates(country: string): Observable<any> {
    return this.http.get(`${environment.apidev}/CountriesData/GetStates`, {
      params: { country }
    });
  }

  // Get Cities by Country and State Code
  getCities(country: string, stateCode: string): Observable<any> {
    return this.http.get(`${environment.apidev}/CountriesData/GetCities`, {
      params: { country, stateCode }
    });
  }

  getDateFormat(userId:string): Observable<any> {
  return this.http.get(`${environment.apidev}/Auth/get-date-format/${userId}`);
}

  // Get Zip Codes by Country, State Code, and City
  getZipCodes(country: string, stateCode: string, city: string): Observable<any> {
    return this.http.get(`${environment.apidev}/CountriesData/GetZipCodes`, {
      params: { country, stateCode, city }
    });
  }

  getInsuranceCarriers(): Observable<any> {
    return this.http.get(`${environment.apidev}/Dropdowns/GetInsuranceCarriers`);
  }
}





// const params = new HttpParams()
//   .set('usernameOrEmail',data.usernameOrEmail || '')
//   .set('password',data.password || '')

