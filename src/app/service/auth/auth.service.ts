import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Inject, Injectable, PLATFORM_ID } from '@angular/core';
import { catchError, map, Observable, throwError } from 'rxjs';
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

   public getDecodedToken(): any {
    debugger
    const token = localStorage.getItem('token');
    if (token) {
      return this.jwtHelper.decodeToken(token);
    }
    return null;
  }


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
  public getPatientId(): string {
    const decoded = this.getPatientDecodedToken();
    return decoded?.sub || null;
  }
  // patients
  public getPatientUsername(): string  {
    const decoded = this.getPatientDecodedToken();
    return decoded?.UserName || null;;
  }
  // patients
   public getPatientEmail(): string {
    const decoded = this.getPatientDecodedToken();
    return  decoded?.email || null;
  }
  public getUserRole(): string | null {
    const decoded = this.getDecodedToken();
    return decoded?.role || null;
  }

   public getClientId(): string | null {
    const decoded = this.getDecodedToken();
    return decoded?.ClientId || null;
  }


  //  public getUserId(): string | null {
  //   const decoded = this.getDecodedToken();
  //   return decoded?.userId || null;
  // }
  public getUsername(): string | null {
    const decoded = this.getDecodedToken();
    return decoded?.UserName || null;;
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
  
  return this.http.post(`${environment.apidev}/Auth/login`, data, { headers }).pipe(
    map((response: any) => {
      return response;
    }),
    catchError(error => {
      console.error('Error during sign in:', error);
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
  let params = new HttpParams();
  if (clientId) {
    params = params.set('clientId', clientId);
  }

  return this.http.get<any[]>(`${environment.apidev}/User/getallusers`, { params }).pipe(
    map((response: any) => response?.data || response),
    catchError(error => {
      console.error('Error during getting user list:', error);
      return throwError(() => error);
    })
  );
}

getRoleList(): Observable<any> {
  

  return this.http.get(`${environment.apidev}/Client/getallroles`).pipe(
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
  return this.http.get(`${environment.apidev}/User/getalltherapists`, { params }).pipe(
    map((response: any) => {
      return response?.data || response;
    }),
    catchError(error => {
      console.error('Error during getting user list:', error);
      return throwError(() => error);
    })
  );
}

forgotPassword(data:forgotpasswordModel):Observable<any>{
  return this.http.post(`${environment.apidev}/Auth/SendPasswordResetOtp`,data,{headers}).pipe(
    map((response: any) => {
      return response;
    }),
    catchError(error => {
      console.error('Error during getting user list:', error);
      return throwError(() => error);
    })
  )
}

verifyPassword(data:forgotpasswordModel):Observable<any>{
  return this.http.post(`${environment.apidev}/Auth/VerifyOtp`,data,{headers}).pipe(
    map((response: any) => {
      return response?.data || response;
    }),
    catchError(error => {
      console.error('Error during getting user list:', error);
      return throwError(() => error);
    })
  )
}


resetPassword(data:forgotpasswordModel):Observable<any>{
  return this.http.post(`${environment.apidev}/Auth/ResetPassword`,data,{headers}).pipe(
    map((response: any) => {
      return response?.data || response;
    }),
    catchError(error => {
      console.error('Error during getting user list:', error);
      return throwError(() => error);
    })
  )
}

  logout(){
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    this.router.navigate(['/login']);
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
    return this.http.get(`${environment.apidev}/Dropdowns/GetCountries`);
  }


getMobilePrefixes(country: string): Observable<any> {
    return this.http.get(`${environment.apidev}/Dropdowns/GetMobilePrefix`, {
      params: { country }
    });
  }

  // Get States by Country
  getStates(country: string): Observable<any> {
    return this.http.get(`${environment.apidev}/Dropdowns/GetStates`, {
      params: { country }
    });
  }

  // Get Cities by Country and State Code
  getCities(country: string, stateCode: string): Observable<any> {
    return this.http.get(`${environment.apidev}/Dropdowns/GetCities`, {
      params: { country, stateCode }
    });
  }

  // Get Zip Codes by Country, State Code, and City
  getZipCodes(country: string, stateCode: string, city: string): Observable<any> {
    return this.http.get(`${environment.apidev}/Dropdowns/GetZipCodes`, {
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
