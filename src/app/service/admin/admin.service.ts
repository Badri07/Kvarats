import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Inject, Injectable, PLATFORM_ID } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, catchError, map, Observable, shareReplay, throwError } from 'rxjs';
import { Billing, Client, DropdownModel } from '../../models/useradmin-model';
import { environment } from '../../../environments/environments';
import { LeaveRequest } from '../../models/user-model';
import { ToastrService } from 'ngx-toastr';


@Injectable({
  providedIn: 'root'
})
export class AdminService {

   private patientsCache$!: Observable<any>;

  constructor(private http:HttpClient, @Inject(PLATFORM_ID) private platformId: string,private router:Router,

) { }




 private fileUrlSubject = new BehaviorSubject<string | null>(null);

  fileUrl$ = this.fileUrlSubject.asObservable();

  setFileUrl(url: string) {
    this.fileUrlSubject.next(url);
  }

  clearFileUrl() {
    this.fileUrlSubject.next(null);
  }


  getAllClaims() {
     return this.http.get(`${environment.apidev}/InsuranceAndClaims/GetClaimsList`).pipe(
      map((response: any) => {
        return response?.data || response;
      }),
      catchError(error => {
        console.error('Error during sign in:', error);
        return throwError(() => error);
      })
    )
  }


  getAllVersions(id?: string): Observable<any> {
  let params = new HttpParams();
  if (id) {
    params = params.set('patientId', id);
  }
  return this.http.get(`${environment.apidev}/PatientAssessment/GetAssessmentHistory`,{ params }).pipe(
    map((response: any) => {
      return response?.data || response;
    }),
    catchError(error => {
      console.error('Error during getting user list:', error);
      return throwError(() => error);
    })
  );
}


    AddSlidingScale(data:Billing) {
     return this.http.post(`${environment.apidev}/Billing/AddSlidingScale`,data).pipe(
      map((response: any) => {
        return response?.data || response;
      }),
      catchError(error => {
        console.error('Error during sign in:', error);
        return throwError(() => error);
      })
    )
  }


getAllTransaction() {
  return this.http.get<any[]>(`${environment.apidev}/Appointment/GetTransactions`).pipe(
    map((response: any) => {
      return response?.data || response;
    }),
    catchError(error => {
      console.error('Error while fetching transactions:', error);
      return throwError(() => error);
    })
  );
}

getDepartment(): Observable<any> {
    return this.http.get(`${environment.apidev}/Dropdowns/departments`).pipe(
      map((response: any) => {
        return response?.data || response;
      }),
      catchError(error => {
        console.error('Error during sign in:', error);
        return throwError(() => error);
      })
    );
}
getSpecializations(parentId: number): Observable<any> {
  const params = new HttpParams().set('departmentId', parentId.toString());
  return this.http.get(`${environment.apidev}/Dropdowns/departments`, {
    params
  }).pipe(
    map((response: any) => response?.data || response),
    catchError(error => {
      console.error('Error fetching specializations:', error);
      return throwError(() => error);
    })
  );
}
// Domain/QuickBooks/authorize
saveAdduser(data: any): Observable<any> {
  return this.http.post(`${environment.apidev}/User/addusers`, data).pipe(
    map((response: any) => {
      // Optional: Adjust based on exact response format
      if (!response || response.message?.includes('successfully') === false) {
        throw new Error(response.message || 'User creation failed');
      }
      return response; // Return full response or just the message
    }),
    catchError(error => {
      console.error('Error during getting user list:', error);
      return throwError(() => error);
    })
  );
}

AddPatients(data:Client):Observable<any>{
  return this.http.post(`${environment.apidev}/Patients`,data).pipe(
    map((response: any) => {
      return response?.data || response;
    }),
    catchError(error => {
      console.error('Error during getting user list:', error);
      return throwError(() => error);
    })
  )
}
updatepatient(data:Client):Observable<any>{
  return this.http.put(`${environment.apidev}/Patients`,data).pipe(
    map((response: any) => {
      return response?.data || response;
    }),
    catchError(error => {
      console.error('Error during getting user list:', error);
      return throwError(() => error);
    })
  )
}

getUserById(userId: string): Observable<any> {
  return this.http.get(`${environment.apidev}/User/getuser/${userId}`).pipe(
    map((response: any) => response?.data || response),
    catchError(error => {
      console.error('Error fetching user by ID:', error);
      return throwError(() => error);
    })
  );
}
getClientList(): Observable<any> {
  return this.http.get(`${environment.apidev}/Client/GetClientList`).pipe(
    map((response: any) => response?.data || response),
    catchError(error => {
      console.error('Error fetching user by ID:', error);
      return throwError(() => error);
    })
  );
}
updateUser(id: string, data: any): Observable<any> {
  return this.http.put(`${environment.apidev}/User/EditUser/${id}`, data).pipe(
    map((response: any) => {
      return response?.data || response;
    }),
    catchError(error => {
      console.error('Error during updating user:', error);
      return throwError(() => error);
    })
  )
}

deleteUser(userId: string): Observable<any> {

  return this.http.delete(
    `${environment.apidev}/User/deleteuser/${userId}`
  ).pipe(
    map((response: any) => response?.data || response),
    catchError((error) => {
      console.error('Error during deleting user:', error);
      return throwError(() => error);
    })
  );
}




AddUserLeave(data:LeaveRequest):Observable<any>{

  return this.http.post(`${environment.apidev}/UserLeavesAndAvailability/AddOrUpdateLeave`,data).pipe(
    map((response: any) => {
      return response?.data || response;
    }),
    catchError(error => {
      console.error('Error during getting user list:', error);
      return throwError(() => error);
    })
  )
}

getUserLeave():Observable<any>{

  return this.http.get(`${environment.apidev}/UserLeavesAndAvailability/GetAllUserLeaves`).pipe(
    map((response: any) => {
      return response?.data || response;
    }),
    catchError(error => {
      console.error('Error during getting user list:', error);
      return throwError(() => error);
    })
  )
}

getLeavesByUser(userId: string): Observable<any[]> {
  return this.http.get<any[]>(`${environment.apidev}/UserLeavesAndAvailability/GetLeavesByUser/${userId}`)
    .pipe(
      map((response: any) => response?.data || response),
      catchError(error => {
        console.error('Error fetching user availability:', error);
        return throwError(() => error);
      })
    );
}

getExistingList():Observable<any>{

  return this.http.get(`${environment.apidev}/UserLeavesAndAvailability/GetAllUserAvailabilities`).pipe(
    map((response: any) => {
      return response?.data || response;
    }),
    catchError(error => {
      console.error('Error during getting user list:', error);
      return throwError(() => error);
    })
  )
}

deleteLeave(userId: string): Observable<any> {
  return this.http.delete(`${environment.apidev}/UserLeavesAndAvailability/DeleteLeave/${userId}`
  ).pipe(
    map((response: any) => response?.data || response),
    catchError(error => {
      console.error('Error during delete leave:', error);
      return throwError(() => error);
    })
  );
}

getAvailabilityByUser(userId: string): Observable<any[]> {
  return this.http.get<any[]>(`${environment.apidev}/UserLeavesAndAvailability/GetAvailabilityByUser/${userId}`)
    .pipe(
      map((response: any) => response?.data || response),
      catchError(error => {
        console.error('Error fetching user availability:', error);
        return throwError(() => error);
      })
    );
}


availabilitDeleteLeave(userId: string): Observable<any> {


  return this.http.delete(`${environment.apidev}/UserLeavesAndAvailability/DeleteUserAvailability/${userId}`
  ).pipe(
    map((response: any) => response?.data || response),
    catchError(error => {
      console.error('Error during delete leave:', error);
      return throwError(() => error);
    })
  );
}

saveAppointmentWithTransaction(data: any): Observable<any> {
  return this.http.post(`${environment.apidev}/Appointment/SaveAppointmentWithTransaction`, data).pipe(
    map((response: any) => response?.data || response),
    catchError(error => {
      console.error('Error during saving appointment with transaction:', error);
      return throwError(() => error);
    })
  );
}


getAppointment(){

  return this.http.get(`${environment.apidev}/Appointment/GetAllAppointmentsWithTransactions`).pipe(
    map((response: any) => response?.data || response),
    catchError(error => {
      console.error('Error during saving appointment with transaction:', error);
      return throwError(() => error);
    })
  );
}

getDropdowndata(category: string): Observable<any> {

  return this.http.get(`${environment.apidev}/Dropdowns/GetDropdowns?category=${category}`).pipe(
    map((response: any) => response?.data || response),
    catchError(error => {
      console.error('Error fetching dropdown data:', error);
      return throwError(() => error);
    })
  );
}

getAllergyDataByCategory(category: string, categoryId: number): Observable<any> {
  const params = new HttpParams()
    .set('category', category)
    .set('id', categoryId.toString());

  return this.http.get(`${environment.apidev}/Dropdowns/GetAllergies`, { params }).pipe(
    map((response: any) => response?.data || response),
    catchError(error => {
      console.error('Error fetching allergy data:', error);
      return throwError(() => error);
    })
  );
}


getMedicationdata(): Observable<any> {

  return this.http.get(`${environment.apidev}/Dropdowns/GetMedications`).pipe(
    map((response: any) => response?.data || response),
    catchError(error => {
      console.error('Error fetching dropdown data:', error);
      return throwError(() => error);
    })
  );
}


getPatientsList(): Observable<any> {
    if (!this.patientsCache$) {
      this.patientsCache$ = this.http.get(`${environment.apidev}/Patients/GetAllPatientsList`).pipe(
        map((response: any) => {
          return response?.data || response;
        }),
        catchError(error => {
          console.error('Error during getting user list:', error);
          return throwError(() => error);
        }),
        shareReplay(1) 
      );
    }
    return this.patientsCache$;
  }

getPatientById(Id: string) {
   const params = new HttpParams().set('Id', Id);
  return this.http.get(`${environment.apidev}/Patients/GetPatientById`,{params});
}



getAllUserAppointments(): Observable<any> {

  return this.http.get(`${environment.apidev}/Appointment/GetAllUserAppointments`).pipe(
    map((response: any) => {
      return response?.data || response;
    }),
    catchError(error => {
      console.error('Error during getting user list:', error);
      return throwError(() => error);
    })
  );
}

savePatientAssessment(data: any): Observable<any> {

  return this.http.post(`${environment.apidev}/PatientAssessment/AddPatientAssessment`, data).pipe(
    catchError(error => {
      console.error('Error saving assessment:', error);
      return throwError(() => error);
    })
  );
}

//quickbooks
getQuickBooksStatus(realmId: string) {
   const params = new HttpParams().set('realmId', realmId);
  return this.http.get(`${environment.apidev}/QuickBooks/connection-status`,{params});
}

disconnectQuickBooks(realmId: string) {
  const params = new HttpParams().set('realmId',realmId)
  return this.http.delete(`${environment.apidev}/QuickBooks/DisconnectQuickBooks`,{params});
}


addClient(data: any): Observable<any> {
   return this.http.post(`${environment.apidev}/Client/AddClient`,data).pipe(
    map((response: any) => {
      return response?.data || response;
    }),
    catchError(error => {
      console.error('Error during getting user list:', error);
      return throwError(() => error);
    })
  );
}

addPatientToQuickBooks(patientId: string): Observable<any> {
  return this.http.post(`${environment.apidev}/QuickBooks/AddPatientToQuickBooks`, {}, {
    params: { patientId }
  }).pipe(
    map((response: any) => response?.data || response),
    catchError(error => {
      console.error('Error syncing patient to QuickBooks:', error);
      return throwError(() => error);
    })
  );
}

createQuickBooksInvoice(payload: any): Observable<any> {
  return this.http.post(`${environment.apidev}/QuickBooks/CreateInvoice`, payload).pipe(
    map((response: any) => response?.data || response),
    catchError(error => {
      console.error('Error creating QuickBooks Invoice:', error);
      return throwError(() => error);
    })
  );
}

getPatientsWithCompletedAssessment(): Observable<any> {
  
  return this.http.get(`${environment.apidev}/PatientAssessment/PatientsWithCompletedAssessment`).pipe(
    map((response: any) => {
      return response?.data || response;
    }),
    catchError(error => {
      console.error('Error during getting patients with completed assessment:', error);
      return throwError(() => error);
    })
  );
}

getPatientAssessment(assessmentId: string): Observable<any> {
  return this.http.get(`${environment.apidev}/PatientAssessment/GetPatientAssessment`, { params: { assessmentId } }).pipe(
    map((response: any) => response?.data || response),
    catchError(error => {
      console.error('Error fetching patient assessment:', error);
      return throwError(() => error);
    })
  );
}


getInsuranceCarriers(): Observable<any[]> {
    return this.http.get<any[]>(`${environment.apidev}/Dropdowns/GetInsuranceCarriers`);
  }

getSlidingScales(): Observable<any[]> {
  return this.http.get<any[]>(`${environment.apidev}/Billing/GetSlidingScales`);
}  

getPatientsWithUnbilledTransactions() {
  return this.http.get<any[]>(`${environment.apidev}/Billing/GetPatientsWithUnbilledTransactions`);
}

getTransactionById(id: string) {
  
  return this.http.get<any[]>(`${environment.apidev}/Appointment/GetTransactionById`, {
    params: { id }
  });
} 

  getPatientsWithInvoices() {
    return this.http.get<any[]>(`${environment.apidev}/Billing/GetPatientsWithInvoices`);
  }

  getInvoicesByPatientId(patientId: string) {
    return this.http.get<any[]>(`${environment.apidev}/Billing/GetInvoices?patientId=${patientId}`);
  }

  getInvoiceById(id: number) {
  let params = new HttpParams();
  if (id) {
    params = params.set('id', id);
  }
  return this.http.get(`${environment.apidev}/Billing/GetInvoiceById`, { params }).pipe(
    map((response: any) => {
      return response?.data || response;
    }),
    catchError(error => {
      console.error('Error during getting user list:', error);
      return throwError(() => error);
    })
  );
  }

createInvoice(data: any) {
  return this.http.post(`${environment.apidev}/Billing/CreateInvoice`, data);
}

fileUpload(formData: FormData, folder: string): Observable<any> {
  const url = `${environment.apidev}/FileUpload/upload`;

  return this.http.post(`${url}?folder=${folder}`, formData).pipe(
    map((response: any) => response?.data || response),
    catchError(error => {
      console.error('Error during file upload:', error);
      return throwError(() => error);
    })
  );
}

getAssesmentFiles(patientId: number): Observable<any> {
  const params = new HttpParams().set('patientId', patientId.toString());
  return this.http.get(`${environment.apidev}/PatientAssessment/GetAssessmentFiles`, {
    params
  }).pipe(
    map((response: any) => response?.data || response),
    catchError(error => {
      console.error('Error fetching AssesmentFiles:', error);
      return throwError(() => error);
    })
  );
}
getAssesmentFilesById(assessmentId: number): Observable<any> {
  const params = new HttpParams().set('assessmentId', assessmentId.toString());
  return this.http.get(`${environment.apidev}/PatientAssessment/GetFileAssessmentById`,{params}).pipe(
    map((response: any) => response?.data || response),
    catchError(error => {
      console.error('Error fetching AssesmentFiles:', error);
      return throwError(() => error);
    })
  );
}

deletePatient(patientId: string): Observable<any> {
  return this.http.delete(`${environment.apidev}/Patients/${patientId}`).pipe(
    map((response: any) => response?.data || response),
    catchError(error => {
      console.error('Error deleting patient:', error);
      return throwError(() => error);
    })
  );
}



//billing
getSlidingScale(): Observable<any> {
  return this.http.get(`${environment.apidev}/Billing/GetSlidingScales`).pipe(
    map((response: any) => {
      return response?.data || response;
    }),
    catchError(error => {
      console.error('Error during getting patients with completed assessment:', error);
      return throwError(() => error);
    })
  );
}


getSlidingScaleById(patientId: string): Observable<any> {
  return this.http.get(`${environment.apidev}/Billing/GetSlidingScaleById/${patientId}`).pipe(
    map((response: any) => response?.data || response),
    catchError(error => {
      console.error('Error getting Sliding scale patient:', error);
      return throwError(() => error);
    })
  );
}


UpdateSlidingScale(data: any): Observable<any> {
  return this.http.put(`${environment.apidev}/Billing/UpdateSlidingScale`, data).pipe(
    map((response: any) => response?.data || response),
    catchError(error => {
      console.error('Error updating Sliding scale:', error);
      return throwError(() => error);
    })
  );
}

deleteSlidingScale(patientId: string): Observable<any> {
  return this.http.delete(`${environment.apidev}/Billing/DeleteSlidingScale/${patientId}`).pipe(
    map((response: any) => response?.data || response),
    catchError(error => {
      console.error('Error deleting patient:', error);
      return throwError(() => error);
    })
  );
}


}
