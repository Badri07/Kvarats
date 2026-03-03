import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Inject, Injectable, PLATFORM_ID, signal } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, catchError, map, Observable, shareReplay, throwError } from 'rxjs';
import { Billing, Client, DropdownModel } from '../../models/useradmin-model';
import { environment } from '../../../environments/environments';
import { LeaveRequest } from '../../models/user-model';
import { ToastrService } from 'ngx-toastr';
import { PatientInsurance } from '../../models/patients-interface';
import { 
  Leave, 
  Availability, 
  DayOfWeek, 
  LeaveSearch,
  CreateLeaveRequest,
  UpdateLeaveRequest,
  CreateAvailabilityRequest,
  UpdateAvailabilityRequest
} from '../../models/leave.model';

export interface MenuRoleDto {
  menuId: string;
  roleIds: string[];  // array of role IDs assigned to this menu
}

export interface ClientMenuRoleAssignDto {
  clientId: string;
  menus: MenuRoleDto[];  // list of menus along with their role assignments
}

interface PagedResponse<T> {
  items: T[];
  page: number;
  pageSize: number;
  totalCount: number;
}

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  errors?: string[];
}

interface Transaction {
  id: string;
  date: string;
  patientName: string;
  invoiceNumber: string;
  amount: number;
  status: string;
  paymentMethod: string;
  transactionType?: string;
  updatedAt?: string;
  canEdit: boolean;
  canDelete: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class AdminService {
  private patientsCache$!: Observable<any>;
  
  // Signal-based state management
  private availabilitiesSignal = signal<Availability[]>([]);
  private leavesSignal = signal<Leave[]>([]);
  private therapistsSignal = signal<any[]>([]);

  constructor(
    private http: HttpClient, 
    @Inject(PLATFORM_ID) private platformId: string,
    private router: Router
  ) { }

  // Signal getters
  get availabilities() {
    return this.availabilitiesSignal.asReadonly();
  }

  get leaves() {
    return this.leavesSignal.asReadonly();
  }

  get therapists() {
    return this.therapistsSignal.asReadonly();
  }

  getDayName(dayOfWeek: DayOfWeek): string {
    const dayNames = {
      [DayOfWeek.SUNDAY]: 'Sunday',
      [DayOfWeek.MONDAY]: 'Monday',
      [DayOfWeek.TUESDAY]: 'Tuesday',
      [DayOfWeek.WEDNESDAY]: 'Wednesday',
      [DayOfWeek.THURSDAY]: 'Thursday',
      [DayOfWeek.FRIDAY]: 'Friday',
      [DayOfWeek.SATURDAY]: 'Saturday'
    };
    return dayNames[dayOfWeek];
  }

  getShortDayName(dayOfWeek: DayOfWeek): string {
    const shortNames = {
      [DayOfWeek.SUNDAY]: 'Sun',
      [DayOfWeek.MONDAY]: 'Mon',
      [DayOfWeek.TUESDAY]: 'Tue',
      [DayOfWeek.WEDNESDAY]: 'Wed',
      [DayOfWeek.THURSDAY]: 'Thu',
      [DayOfWeek.FRIDAY]: 'Fri',
      [DayOfWeek.SATURDAY]: 'Sat'
    };
    return shortNames[dayOfWeek];
  }

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
    );
  }

  

   getPatientFiles(){
    return this.http.get(`${environment.apidev}/PatientFiles`).pipe(
      map((response: any) => {
        return response?.data || response;
      }),
      catchError(error => {
        console.error('Error during sign in:', error);
        return throwError(() => error);
      })
    );
  }

  getAllVersions(id?: string): Observable<any> {
    let params = new HttpParams();
    if (id) {
      params = params.set('patientId', id);
    }
    return this.http.get(`${environment.apidev}/PatientAssessment/GetAssessmentHistory`, { params }).pipe(
      map((response: any) => {
        return response?.data || response;
      }),
      catchError(error => {
        console.error('Error during getting user list:', error);
        return throwError(() => error);
      })
    );
  }

  getDepartment(): Observable<any> {
    return this.http.get(`${environment.apidev}/Dropdowns/values/category/Department`).pipe(
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
    return this.http.get(`${environment.apidev}/Dropdowns/values/category/Specialization`, {
      params
    }).pipe(
      map((response: any) => response?.data || response),
      catchError(error => {
        console.error('Error fetching specializations:', error);
        return throwError(() => error);
      })
    );
  }

  saveAdduser(data: any): Observable<any> {
    return this.http.post(`${environment.apidev}/Users`, data).pipe(
      map((response: any) => {
        if (!response || response.message?.includes('successfully') === false) {
          throw new Error(response.message || 'User creation failed');
        }
        return response;
      }),
      catchError(error => {
        console.error('Error during getting user list:', error);
        return throwError(() => error);
      })
    );
  }

  AddPatients(data: Client): Observable<any> {
    return this.http.post(`${environment.apidev}/Patients`, data).pipe(
      map((response: any) => {
        return response;
      }),
      catchError(error => {
        console.error('Error during getting user list:', error);
        return throwError(() => error);
      })
    );
  }

  updatepatient(id:string, data: Client): Observable<any> {
    return this.http.put(`${environment.apidev}/Patients/${id}`, data).pipe(
      map((response: any) => {
        return response;
      }),
      catchError(error => {
        console.error('Error during getting user list:', error);
        return throwError(() => error);
      })
    );
  }

  getUserById(userId: string): Observable<any> {
    return this.http.get(`${environment.apidev}/Users/${userId}`).pipe(
      map((response: any) => response?.data || response),
      catchError(error => {
        console.error('Error fetching user by ID:', error);
        return throwError(() => error);
      })
    );
  }

  getClientList(): Observable<any> {
    return this.http.get(`${environment.apidev}/Clients`).pipe(
      map((response: any) => response?.data || response),
      catchError(error => {
        console.error('Error fetching user by ID:', error);
        return throwError(() => error);
      })
    );
  }

  updateUser(id: string, data: any): Observable<any> {
    return this.http.put(`${environment.apidev}/Users/${id}`, data).pipe(
      map((response: any) => {
        return response?.data || response;
      }),
      catchError(error => {
        console.error('Error during updating user:', error);
        return throwError(() => error);
      })
    );
  }

  deleteUser(userId: string): Observable<any> {
    return this.http.delete(
      `${environment.apidev}/Users/${userId}`
    ).pipe(
      map((response: any) => response?.data || response),
      catchError((error) => {
        console.error('Error during deleting user:', error);
        return throwError(() => error);
      })
    );
  }

  // LEAVE MANAGEMENT METHODS
  AddUserLeave(data: LeaveRequest): Observable<any> {
    return this.http.post(`${environment.apidev}/Leaves`, data).pipe(
      map((response: any) => {
        return response?.data || response;
      }),
      catchError(error => {
        console.error('Error during getting user list:', error);
        return throwError(() => error);
      })
    );
  }

  getUserLeave(): Observable<Leave[]> {
    return this.http.get(`${environment.apidev}/Leaves`).pipe(
      map((response: any) => {
        const leaves = response?.data || response || [];
        this.leavesSignal.set(leaves);
        return leaves;
      }),
      catchError(error => {
        console.error('Error during getting user list:', error);
        this.leavesSignal.set([]);
        return throwError(() => error);
      })
    );
  }

  getLeavesByUser(userId: string): Observable<Leave[]> {
    return this.http.get<any[]>(`${environment.apidev}/UserLeavesAndAvailability/GetLeavesByUser/${userId}`)
      .pipe(
        map((response: any) => {
          const leaves = response?.data || response || [];
          return leaves;
        }),
        catchError(error => {
          console.error('Error fetching user leaves:', error);
          return throwError(() => error);
        })
      );
  }

  // AVAILABILITY MANAGEMENT METHODS
  addOrUpdateAvailability(data: any): Observable<any> {
    return this.http.post(`${environment.apidev}/Availabilities/save`, data).pipe(
      map((response: any) => {
        return response?.data || response;
      }),
      catchError(error => {
        console.error('Error during getting user list:', error);
        return throwError(() => error);
      })
    );
  }

  getExistingList(): Observable<Availability[]> {
    return this.http.get(`${environment.apidev}/Availabilities`).pipe(
      map((response: any) => {
        const availabilities = response?.data || response || [];
        this.availabilitiesSignal.set(availabilities);
        return availabilities;
      }),
      catchError(error => {
        console.error('Error during getting user list:', error);
        this.availabilitiesSignal.set([]);
        return throwError(() => error);
      })
    );
  }

  deleteLeave(userId: string): Observable<any> {
    return this.http.delete(`${environment.apidev}/Leaves/${userId}`
    ).pipe(
      map((response: any) => response?.data || response),
      catchError(error => {
        console.error('Error during delete leave:', error);
        return throwError(() => error);
      })
    );
  }

  getAvailabilityByUser(userId: string): Observable<Availability[]> {
    return this.http.get<any[]>(`${environment.apidev}/Availabilities/user/${userId}`)
      .pipe(
        map((response: any) => {
          const availabilities = response?.data || response || [];
          return availabilities;
        }),
        catchError(error => {
          console.error('Error fetching user availability:', error);
          return throwError(() => error);
        })
      );
  }

  availabilitDeleteLeave(userId: string): Observable<any> {
    return this.http.delete(`${environment.apidev}/Availabilities/${userId}`
    ).pipe(
      map((response: any) => response?.data || response),
      catchError(error => {
        console.error('Error during delete leave:', error);
        return throwError(() => error);
      })
    );
  }

  getTherapistList(): Observable<any[]> {
    return this.http.get(`${environment.apidev}/Users/therapists`).pipe(
      map((response: any) => {
        const therapists = response?.data || response || [];
        this.therapistsSignal.set(therapists);
        return therapists;
      }),
      catchError(error => {
        console.error('Error fetching therapists:', error);
        this.therapistsSignal.set([]);
        return throwError(() => error);
      })
    );
  }

    getAllNotification(): Observable<any[]> {
    return this.http.get(`${environment.apidev}/Notifications/my-notifications`).pipe(
      map((response: any) => {
        const therapists = response?.data || response || [];
        this.therapistsSignal.set(therapists);
        return therapists;
      }),
      catchError(error => {
        console.error('Error fetching therapists:', error);
        this.therapistsSignal.set([]);
        return throwError(() => error);
      })
    );
  }

  

  // APPOINTMENT METHODS
  saveAppointmentWithTransaction(data: any): Observable<any> {
    return this.http.post(`${environment.apidev}/Appointments`, data).pipe(
      map((response: any) => response?.data || response),
      catchError(error => {
        console.error('Error during saving appointment with transaction:', error);
        return throwError(() => error);
      })
    );
  }

  updateAppointmentWithTransaction(appointmentId: string, data: any): Observable<any> {
  return this.http.put(`${environment.apidev}/Appointments/${appointmentId}`, data).pipe(
    map((response: any) => response?.data || response),
    catchError(error => {
      console.error('Error during updating appointment:', error);
      return throwError(() => error);
    })
  );
}


  DeleteAppointmentWithTransaction(appointmentId: string): Observable<any> {
  return this.http.delete(`${environment.apidev}/Appointments/${appointmentId}`).pipe(
    map((response: any) => response?.data || response),
    catchError(error => {
      console.error('Error during updating appointment:', error);
      return throwError(() => error);
    })
  );
}

  getAppointment() {
    return this.http.get(`${environment.apidev}/Appointment/GetAllAppointmentsWithTransactions`).pipe(
      map((response: any) => response?.data || response),
      catchError(error => {
        console.error('Error during saving appointment with transaction:', error);
        return throwError(() => error);
      })
    );
  }

  // DROPDOWN METHODS
  getDropdowndata(category: string): Observable<any> {
    return this.http.get(`${environment.apidev}/Dropdowns/${category}`).pipe(
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

  getChiefComplaintdata(): Observable<any> {
    return this.http.get(`${environment.apidev}/ChiefComplaints`).pipe(
      map((response: any) => response?.data || response),
      catchError(error => {
        console.error('Error fetching dropdown data:', error);
        return throwError(() => error);
      })
    );
  }

  // PATIENT METHODS
getPatientsList(id: string, pageNumber: number, pageSize: number): Observable<any> {
  const url = `${environment.apidev}/Patients/client/${id}?pageNumber=${pageNumber}&pageSize=${pageSize}`;
  return this.http.get(url).pipe(
    map((response: any) => response?.data || {}),
    catchError(error => {
      console.error('Error during getting patient list:', error);
      return throwError(() => error);
    })
  );
}

getPatientsByTherapist(therapistId: string): Observable<any> {
  const url = `${environment.apidev}/Patients/by-therapist/${therapistId}`;

  return this.http.get(url).pipe(
    map((response: any) => response?.data || []),
    catchError(error => {
      console.error('Error during getting patients by therapist:', error);
      return throwError(() => error);
    })
  );
}


getLatestNotes(): Observable<any> {
  const url = `${environment.apidev}/Patients/latest-notes`;
  return this.http.get(url).pipe(
    map((response: any) => response?.data || {}),
    catchError(error => {
      console.error('Error during getting patient list:', error);
      return throwError(() => error);
    })
  );
}

getMyPatientsList(): Observable<any> {
  const url = `${environment.apidev}/Patients/my-patients`;
  return this.http.get(url).pipe(
    map((response: any) => response?.data || {}),
    catchError(error => {
      console.error('Error during getting patient list:', error);
      return throwError(() => error);
    })
  );
}

 getPatientById(Id: string): Observable<any> {
  return this.http.get(`${environment.apidev}/Patients/${Id}`).pipe(
    map((response: any) => {
      return response?.data || response;
    }),
    catchError(error => {
      console.error('Error fetching patient by ID:', error);
      return throwError(() => error);
    })
  );
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
    return this.http.post(`${environment.apidev}/InitialAssessments`, data).pipe(
      catchError(error => {
        console.error('Error saving assessment:', error);
        return throwError(() => error);
      })
    );
  }

  // QUICKBOOKS METHODS
  getQuickBooksStatus(realmId: string) {
    const params = new HttpParams().set('realmId', realmId);
    return this.http.get(`${environment.apidev}/QuickBooks/connection-status`, { params });
  }

 
  getAuthUrl(): Observable<any> {
    return this.http.get(`${environment.apidev}/QuickBooks/auth-url`);
  }

 disconnectQuickBooks(): Observable<any> {
  return this.http.post(`${environment.apidev}/QuickBooks/disconnect`, {});
}

getConnectionStatus(): Observable<any> {
  return this.http.get(`${environment.apidev}/QuickBooks/connection-status`);
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
        return response;
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
    return this.http.get<any[]>(`${environment.apidev}/Dropdowns/Insurance Carrier`);
  }

    getInsuranceInsurancePlan(): Observable<any[]> {
    return this.http.get<any[]>(`${environment.apidev}/Dropdowns/Insurance Plan`);
  }
  

  getSlidingScales(): Observable<any[]> {
    return this.http.get<any[]>(`${environment.apidev}/Dropdowns/GetSlidingScales`);
  }

  getPatientsTransactions(
    page: number = 1,
    pageSize: number = 10,
    search?: string,
    fromDate?: Date,
    toDate?: Date,
    patientId?: string,
    statusId?: number
  ): Observable<PagedResponse<Transaction>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('pageSize', pageSize.toString());

    if (search) params = params.set('search', search);
    if (fromDate) params = params.set('fromDate', fromDate.toISOString());
    if (toDate) params = params.set('toDate', toDate.toISOString());
    if (patientId) params = params.set('patientId', patientId);
    if (statusId) params = params.set('statusId', statusId.toString());

    return this.http.get<ApiResponse<PagedResponse<Transaction>>>(
      `${environment.apidev}/Billing/GetTransactions`,
      { params }
    ).pipe(
      map(response => response.data)
    );
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
    return this.http.get(`${environment.apidev}/PatientAssessment/GetFileAssessmentById`, { params }).pipe(
      map((response: any) => response?.data || response),
      catchError(error => {
        console.error('Error fetching AssesmentFiles:', error);
        return throwError(() => error);
      })
    );
  }

  deletePatient(patientId: string): Observable<any> {
    return this.http.delete(`${environment.apidev}/Patients/${patientId}`).pipe(
      map((response: any) => response),
      catchError(error => {
        console.error('Error deleting patient:', error);
        return throwError(() => error);
      })
    );
  }

getSlidingScale(clientId: string): Observable<any> {
  const params = { clientId };

  return this.http.get(`${environment.apidev}/Dropdowns/GetSlidingScales`, { params }).pipe(
    map((response: any) => response),
    catchError(error => {
      console.error('Error during getting sliding scales:', error);
      return throwError(() => error);
    })
  );
}


  getSlidingScaleById(Id: string): Observable<any> {
    return this.http.get(`${environment.apidev}/Dropdowns/GetSlidingScaleById/${Id}`).pipe(
      map((response: any) => response?.data || response),
      catchError(error => {
        console.error('Error getting Sliding scale patient:', error);
        return throwError(() => error);
      })
    );
  }

  AddSlidingScale(data: Billing) {
    return this.http.post(`${environment.apidev}/Dropdowns/AddSlidingScale`, data).pipe(
      map((response: any) => {
        return response?.data || response;
      }),
      catchError(error => {
        console.error('Error during sign in:', error);
        return throwError(() => error);
      })
    );
  }

  UpdateSlidingScale(data: any): Observable<any> {
    return this.http.put(`${environment.apidev}/Dropdowns/UpdateSlidingScale`, data).pipe(
      map((response: any) => response?.data || response),
      catchError(error => {
        console.error('Error updating Sliding scale:', error);
        return throwError(() => error);
      })
    );
  }

  deleteSlidingScale(id: string): Observable<any> {
      const params = { id };
    return this.http.delete(`${environment.apidev}/Dropdowns/DeleteSlidingScale`,{params}).pipe(
      map((response: any) => response?.data || response),
      catchError(error => {
        console.error('Error deleting patient:', error);
        return throwError(() => error);
      })
    );
  }

  // MENU METHODS
  getMenus(): Observable<any> {
    return this.http.get(`${environment.apidev}/Menus`).pipe(
      map((response: any) => response?.data || response),
      catchError((error) => {
        console.error('Error during getting menus:', error);
        return throwError(() => error);
      })
    );
  }




  getClientMenusWithRoles(clientId: string): Observable<any> {
    return this.http.get(`${environment.apidev}/Menus/client/${clientId}`).pipe(
      map((response: any) => response?.data || response),
      catchError((error) => {
        console.error('Error fetching client menus:', error);
        return throwError(() => error);
      })
    );
  }

  assignMenusToClient(dto: ClientMenuRoleAssignDto): Observable<any> {
    return this.http.post(`${environment.apidev}/Menus/assign-to-client`, dto).pipe(
      map((response: any) => response),
      catchError((error) => {
        console.error('Error assigning menus to client:', error);
        return throwError(() => error);
      })
    );
  }

  // INSURANCE METHODS
AddMultipleInsurances(
  data: any,
  id?: number
): Observable<any> {
  const baseUrl = `${environment.apidev}/Insurances`;
  const url = id ? `${baseUrl}?id=${id}` : baseUrl;

  return this.http.post<any>(url, data).pipe(
    map((response) => response?.data ?? response),
    catchError((error) => {
      console.error('Error Add/Update Multiple Insurances:', error);
      return throwError(() => error);
    })
  );
}


  GetInsuranceByPatientId(dto: any): Observable<any> {
    return this.http.get(`${environment.apidev}/InsuranceAndClaims/GetInsuranceByPatientId`, dto).pipe(
      map((response: any) => response),
      catchError((error) => {
        console.error('Error GetInsuranceByPatientId:', error);
        return throwError(() => error);
      })
    );
  }

  GetInsurance(dto: any): Observable<any> {
    return this.http.post(`${environment.apidev}/Patients/GetInsurance`, dto).pipe(
      map((response: any) => response),
      catchError((error) => {
        console.error('Error AddMultipleInsurances:', error);
        return throwError(() => error);
      })
    );
  }

  UpadteInsurance(dto: any): Observable<any> {
    return this.http.post(`${environment.apidev}/Patients/UpadteInsurance`, dto).pipe(
      map((response: any) => response),
      catchError((error) => {
        console.error('Error AddMultipleInsurances:', error);
        return throwError(() => error);
      })
    );
  }

  DeleteInsurance(dto: any): Observable<any> {
    return this.http.post(`${environment.apidev}/Patients/UpadteInsurance`, dto).pipe(
      map((response: any) => response),
      catchError((error) => {
        console.error('Error AddMultipleInsurances:', error);
        return throwError(() => error);
      })
    );
  }

  // APPOINTMENT METHODS
  GetAppointments(): Observable<any> {
    return this.http.get(`${environment.apidev}/Appointments`).pipe(
      map((response: any) => response),
      catchError((error) => {
        console.error('Error GetInsuranceByPatientId:', error);
        return throwError(() => error);
      })
    );
  }

    GetAppointmentsTherapist(): Observable<any> {
    return this.http.get(`${environment.apidev}/Appointments/my-appointments`).pipe(
      map((response: any) => response),
      catchError((error) => {
        console.error('Error GetInsuranceByPatientId:', error);
        return throwError(() => error);
      })
    );
  }

  GetAppointmentsById(id?: string): Observable<any> {
    
    //  let params = new HttpParams();
    // if (id) {
    //   params = params.set('AppointmentId', id);
    // }
    return this.http.get(`${environment.apidev}/Appointments/${id}`).pipe(
      map((response: any) => {
        return response?.data || response;
      }),
      catchError(error => {
        console.error('Error during getting user list:', error);
        return throwError(() => error);
      })
    );
  }

   DeleteAppointmentById(id?: string): Observable<any> {
    //  let params = new HttpParams();
    // if (id) {
    //   params = params.set('AppointmentId', id);
    // }
    return this.http.delete(`${environment.apidev}/Appointments/${id}`).pipe(
      map((response: any) => {
        return response?.data || response;
      }),
      catchError(error => {
        console.error('Error during getting user list:', error);
        return throwError(() => error);
      })
    );
  }

    UpDateAppointment(id?: string): Observable<any> {
     let params = new HttpParams();
    if (id) {
      params = params.set('AppointmentId', id);
    }
    return this.http.get(`${environment.apidev}/Appointment/UpDateAppointment/`,{params}).pipe(
      map((response: any) => {
        return response?.data || response;
      }),
      catchError(error => {
        console.error('Error during getting user list:', error);
        return throwError(() => error);
      })
    );
  }

  AddServicesToQuickBooks(id: string): Observable<any> {
  return this.http.post(`${environment.apidev}/QuickBooks/sync/service/${id}`, {}).pipe(
    map((response: any) => {
      return response?.data || response;
    }),
    catchError(error => {
      console.error('Error while adding services to QuickBooks:', error);
      return throwError(() => error);
    })
  );
}



assignTherapistToPatient( therapistIds: string[]): Observable<any> {
  const url = `${environment.apidev}/Patients/AssignTherapistsToPatient`;
  return this.http.post(url, therapistIds); 
}

// superAdmin
  getAllRoles(): Observable<any> {
    return this.http.get(`${environment.apidev}/Roles`).pipe(
      map((response: any) => response),
      catchError((error) => {
        console.error('Error GetInsuranceByPatientId:', error);
        return throwError(() => error);
      })
    );
  }

  addRole(payload: { roleName: string }): Observable<any> {
    return this.http.post(`${environment.apidev}/Roles`, payload).pipe(
      map((response: any) => response),
      catchError((error) => {
        console.error('Error adding role:', error);
        return throwError(() => error);
      })
    );
  }

  // Update role
  updateRole(roleId: string, payload: { roleName: string }): Observable<any> {
    return this.http.put(`${environment.apidev}/Roles/${roleId}`, payload).pipe(
      map((response: any) => response),
      catchError((error) => {
        console.error('Error updating role:', error);
        return throwError(() => error);
      })
    );
  }

    getClientDashboard(clientId: string, currentUserId: string): Observable<any> {
    return this.http.get(`${environment.apidev}/Dashboard/GetClientDashboard?clientId=${clientId}&currentUserId=${currentUserId}`).pipe(
      map((response: any) => response),
      catchError((error) => {
        console.error('Error fetching client dashboard:', error);
        return throwError(() => error);
      })
    );
  }
  // Delete role
  deleteRole(roleId: string): Observable<any> {
    return this.http.delete(`${environment.apidev}/Roles/${roleId}`).pipe(
      map((response: any) => response),
      catchError((error) => {
        console.error('Error deleting role:', error);
        return throwError(() => error);
      })
    );
  }

  getAllCategories(): Observable<any> {
   return this.http.get(`${environment.apidev}/Dropdowns/categories
`).pipe(
      map((response: any) => response),
      catchError((error) => {
        console.error('Error GetInsuranceByPatientId:', error);
        return throwError(() => error);
      })
    );
  }

getValuesByCategories(categoryId: string | number): Observable<any> {
  return this.http.get(`${environment.apidev}/Dropdowns/values/category/${categoryId}`).pipe(
    map((response: any) => response),
    catchError((error) => {
      console.error('Error getValuesByCategories:', error);
      return throwError(() => error);
    })
  );
}

getNotification(){
   return this.http.get(`${environment.apidev}/Notifications/my-notifications`).pipe(
    map((response: any) => response),
    catchError((error) => {
      console.error('Error getNotification:', error);
      return throwError(() => error);
    })
  );
}
getNotificationById(notificationId: string){
   return this.http.get(`${environment.apidev}/Notifications/my-notifications/${notificationId}`).pipe(
    map((response: any) => response),
    catchError((error) => {
      console.error('Error getNotification:', error);
      return throwError(() => error);
    })
  );
}
getNotificationRead(notificationId: string){
   return this.http.get(`${environment.apidev}/Notifications/${notificationId}/mark-read`).pipe(
    map((response: any) => response),
    catchError((error) => {
      console.error('Error getNotification:', error);
      return throwError(() => error);
    })
  );
}

approveLeaveRequest(leaveId: string, approvalData?: any) {
  return this.http.post(`${environment.apidev}/Leaves/${leaveId}/approve`, approvalData).pipe(
    map((response: any) => response),
    catchError((error) => {
      console.error('Error approving leave:', error);
      return throwError(() => error);
    })
  );
}



getPresignedUrl(fileId: string, expirationMinutes: number = 60): Observable<ApiResponse<{ url: string; expiresAt: string }>> {
  return this.http.get<ApiResponse<{ url: string; expiresAt: string }>>(
    `${environment.apidev}/patientfiles/${fileId}/presigned-url`,
    { params: { expirationMinutes: expirationMinutes.toString() } }
  );
}


}