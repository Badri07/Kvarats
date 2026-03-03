// error.service.ts
import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { BehaviorSubject, catchError, map, Observable, throwError } from 'rxjs';
import { environment } from '../../../environments/environments';

export interface ErrorInfo {
  message: string;
  timestamp: Date;
  url?: string;
  status?: number;
}

@Injectable({
  providedIn: 'root'
})
export class ErrorService {
  private showErrorModal = new BehaviorSubject<boolean>(false);
  private errorInfo = new BehaviorSubject<ErrorInfo>({ 
    message: '', 
    timestamp: new Date() 
  });

  showErrorModal$ = this.showErrorModal.asObservable();
  errorInfo$ = this.errorInfo.asObservable();

  showError(message: string, url?: string, status?: number) {

    if (status === 409) {
      return;
    }

    this.errorInfo.next({
      message,
      timestamp: new Date(),
      url,
      status
    });

    this.showErrorModal.next(true);
  }


  hideError() {
    this.showErrorModal.next(false);
  }

  getCurrentError(): ErrorInfo {
    return this.errorInfo.value;
  }


  public http = inject (HttpClient);
  NotificationsSendAlertMail(clientData: any): Observable<any> {
    return this.http.post<{ data: any }>(
      `${environment.apidev}/Notifications/SendAlertMail`,
      clientData
    ).pipe(
      map(response => response.data),
      catchError(error => {
        console.error('Error while adding client:', error);
        return throwError(() => new Error('Failed to add client'));
      })
    );
  }
}