import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { delay } from 'rxjs/operators';
import { environment } from '../../../../environments/environments';

@Injectable({
  providedIn: 'root'
})
export class ShareService {

  private apiUrl =  `${environment.apidev}`;

  constructor(private http: HttpClient) {}

  shareSoapNotesToPatient(shareId: string): Observable<any> {
  const payload = {
    shareId: shareId
  };

  return this.http.post(
    `${this.apiUrl}/SOAPNotes/sharetopatients`,
    payload
  );
}


  shareCrisisNotesToPatient(shareId: string): Observable<any> {
  return this.http.post(`${this.apiUrl}/CrisisNotes/sharetopatients`, {
    shareId: shareId
  });
}

shareTreatmentplansToPatient(shareId: string): Observable<any> {
  return this.http.post(`${this.apiUrl}/TreatmentPlans/sharetopatients`, {
    shareId: shareId
  });
}

shareDapNotesToPatient(shareId: string): Observable<any> {
  return this.http.post(`${this.apiUrl}/DAPNotes/sharetopatients`, {
    shareId: shareId
  });
}

shareDischargeSummaryToPatient(shareId: string): Observable<any> {
  return this.http.post(`${this.apiUrl}/DischargeSummaries/sharetopatients`, {
    shareId: shareId
  });
}

shareProgressNotesToPatient(shareId: string): Observable<any> {
  return this.http.post(`${this.apiUrl}/ProgressNotes/sharetopatients`, {
    shareId: shareId
  });
}

}
