import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, catchError, map, Observable, throwError } from 'rxjs';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from '../../../environments/environments';

@Injectable({ 
  providedIn: 'root' 
})
export class ProfileService {
  private http = inject(HttpClient);
  
  private profileSubject = new BehaviorSubject<any>({});
  profile$ = this.profileSubject.asObservable();

  constructor() {}

  /**
   * Get current user's profile data
   */
  getProfile(): Observable<any> {
    return this.http.get<any>(
      `${environment.apidev}/SuperAdmins/me`
    ).pipe(
       map((response: any) => {
        return response?.data || response;
      }),
      catchError(error => {
        console.error('Error while fetching profile:', error);
        return throwError(() => new Error('Failed to fetch profile'));
      })
    );
  }

    getAdminProfile(): Observable<any> {
    return this.http.get<any>(
      `${environment.apidev}/Users/me`
    ).pipe(
       map((response: any) => {
        return response?.data || response;
      }),
      catchError(error => {
        console.error('Error while fetching profile:', error);
        return throwError(() => new Error('Failed to fetch profile'));
      })
    );
  }

  /**
   * Upload file to server - matches your curl command format
   */
  uploadFile(file: File): Observable<any> {
    const formData = new FormData();
    // Use 'files' as the form field name to match your curl command
    formData.append('files', file, file.name);
    
    // Get the auth token from localStorage or your auth service
    const token = localStorage.getItem('access_token'); // Adjust based on your token storage
    
    const headers = new HttpHeaders({
      'accept': 'text/plain',
      'Authorization': `Bearer ${token}`
      // Don't set Content-Type - let browser set it with boundary
    });

    return this.http.post<any>(
      `${environment.apidev}/FileUpload/upload?folder=superadmin`,
      formData,
      { headers }
    ).pipe(
      map((response: any) => {
        return response;
      }),
      catchError(error => {
        console.error('Error while uploading file:', error);
        return throwError(() => new Error('Failed to upload file'));
      })
    );
  }

  /**
   * Update profile - corrected endpoint to /profile/${id}
   */
  updateProfile(id: number, profileData: any): Observable<any> {
    return this.http.put(
      `${environment.apidev}/SuperAdmins/${id}`, 
      profileData
    ).pipe(
      map((response: any) => {
        return response?.data || response;
      }),
      catchError(error => {
        console.error('Error while updating profile:', error);
        return throwError(() => new Error('Failed to update profile'));
      })
    );
  }

  updateAdminProfile(id: number, profileData: any): Observable<any> {
    return this.http.put(
      `${environment.apidev}/Users/${id}`, 
      profileData
    ).pipe(
      map((response: any) => {
        return response?.data || response;
      }),
      catchError(error => {
        console.error('Error while updating profile:', error);
        return throwError(() => new Error('Failed to update profile'));
      })
    );
  }
}