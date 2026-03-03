import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable, signal } from '@angular/core';
import { Inject,PLATFORM_ID } from '@angular/core';
import { catchError, map, Observable, throwError, of, delay, shareReplay, BehaviorSubject, } from 'rxjs';
import { environment } from '../../../environments/environments';
import {forgotpasswordModel, registerModel, Tokenrefresh, users} from '../../models/user-model'
import { isPlatformBrowser } from '@angular/common';
import { Router } from '@angular/router';
import { JwtHelperService } from '@auth0/angular-jwt';
import { Payment } from '../../models/patients-interface';
import { ApiResponse, Patient, PatientVitalsCreateDto, PatientVitalsResponseDto, PatientVitalsUpdateDto } from '../../models/patients.model';
import { CreateInitialAssessmentRequest, InitialAssessmentDto } from '../../admin/notes/models/initial-assessment.model';
import { DropdownValue } from '../../admin/notes/services/dropdown.service';
import { MedicationDto } from '../../admin/notes/services/medication.service';


export interface PatientFileDto {
  id: string;
  patientId: string;
  patientName: string;
  fileName: string;
  originalFileName: string;
  fileType: string;
  mimeType: string;
  fileSizeBytes: number;
  fileSizeFormatted: string;
  s3Url: string;
  category: string;
  description?: string;
  tags?: string;
  isActive: boolean;
  isConfidential: boolean;
  createdAt: string;
  createdByName: string;
}

export interface MultipleFileUploadRequest {
  patientId: string;
  category: string;
  description?: string;
  tags?: string;
  isConfidential: boolean;
}

export interface FileUploadResponse {
  id: string;
  fileName: string;
  originalFileName: string;
  fileSize: number;
  message: string;
}

export interface FileUploadError {
  fileName: string;
  error: string;
}

export interface MultipleFileUploadResponse {
  successfulUploads: FileUploadResponse[];
  failedUploads: FileUploadError[];
  totalFiles: number;
  successCount: number;
  failureCount: number;
}

export interface UpdatePatientFileRequest {
  category: string;
  description?: string;
  tags?: string;
  isConfidential: boolean;
}

export interface PresignedUrlResponse {
  url: string;
  expiresAt: string;
}

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


   PatientslogIn(data: any): Observable<any> {
  
  return this.http.post(`${environment.apidev}/Auth/patient/login/step1`, data, { headers }).pipe(
    map((response: any) => {
      return response;
    }),
    catchError(error => {
      console.error('Error during sign in:', error);
      return throwError(() => error);
    })
  );
  }

     Patientsverify2FA(data: { tempToken: string; otp: string }): Observable<any> {
    return this.http.post(`${environment.apidev}/Auth/patient/login/step2`, data, { headers }).pipe(
      map((response: any) => response),
      catchError(error => {
        console.error('Error during verify 2FA:', error);
        return throwError(() => error);
      })
    );
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

  createPaymentIntent(data: {
  amount: number;
  currency: string;
  invoiceNumber: string;
}): Observable<{ client_secret: string }> {
  return this.http.post<{ client_secret: string }>(
    '/api/payments/create-intent',
    data
  ).pipe(
    catchError(error => {
      console.error('Error creating payment intent:', error);
      throw new Error('Failed to create payment intent');
    })
  );
}

CreateSalesReceipt(): Observable<any> {

  
  // Get the token from localStorage
  const token = localStorage.getItem('tokenPatients');
  
  // Set up headers with Authorization
  const headers = new HttpHeaders({
    'Authorization': `Bearer ${token}`
  });

  return this.http.get(`${environment.apidev}/billing/CreateSalesReceipt`, { 
    headers 
  }).pipe(
    map((response: any) => response),
    catchError((error) => {
      console.error('Error creating sales receipt:', error);
      return throwError(() => error);
    })
  );
}


  GetInsuranceByPatientId(id: any): Observable<any> {
  let params = new HttpParams();
  if (id) {
    params = params.set('patientId', id);
  }
    return this.http.get(`${environment.apidev}/InsuranceAndClaims/GetInsuranceByPatientId`,{
    params
  }).pipe(
      map((response: any) => response), 
      catchError((error) => {
        console.error('Error GetInsuranceByPatientId:', error);
        return throwError(() => error);
      })
    );
  }

GetCityList(cityName?: string, id?: number): Observable<any> {

  const token = localStorage.getItem('tokenPatients');
  const headers = new HttpHeaders({
    'Authorization': `Bearer ${token}`
  });

  let params = new HttpParams();

  if (cityName) {
    params = params.set('cityName', cityName);
  }

  if (id !== undefined && id !== null) {
    params = params.set('id', id);
  }

  return this.http.get(`${environment.apidev}/Patients/GetCityList`, {
    headers,
    params
  }).pipe(
    map((response: any) => response),
    catchError((error) => {
      console.error('Error GetCityList:', error);
      return throwError(() => error);
    })
  );
}

getItems(clientId: string): Observable<any> {
  const token = localStorage.getItem('tokenPatients');
  const params = new HttpParams().set('clientId', clientId);
  const headers = new HttpHeaders({
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  });
  return this.http.get(`${environment.apidev}/Services/GetClientServices`,{headers,params}).pipe(
    map((response: any) => {
      const apiItems = response?.data || response || [];
      
      return apiItems.map((item: any) => ({
        id: item.id,
        categoryId: item.categoryId || '',
        value: item.id,
        label: item.name,
        category:item.category,
        description: item.description,
        price: item.defaultRate, // ✅ This is now properly mapped
        isActive: item.active,
        isSynced:item.isSynced,
        sortOrder: item.sortOrder || 0,
        metadata: {
          duration: item.defaultDurationMinutes,
          code: item.code 
        },
        createdAt: new Date(item.createdAt),
        updatedAt: new Date(item.updatedAt || item.createdAt)
      }));
    }),
    catchError(error => {
      console.error('Error fetching services:', error);
      return throwError(() => error);
    })
  );
}


assignTherapistToPatient(payload: { patientId: string, therapistIds: string[] }): Observable<any> {
  const token = localStorage.getItem('tokenPatients');
  const headers = new HttpHeaders({
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  });
  const url = `${environment.apidev}/Patients/AssignTherapistsToPatient`;
  return this.http.post(url, payload, { headers }); 
}

GetTherapistsAvailabilityByPatientID(patientId: string, date: string, specialization: string): Observable<any> {
  const token = localStorage.getItem('tokenPatients');
  const headers = new HttpHeaders({
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  });

  const params = {
    patientId: patientId,
    date: date,
    specialization: specialization
  };

  return this.http.get(
    `${environment.apidev}/Availabilities/GetTherapistsAvailabilityByPatientID`,
    { 
      headers: headers,
      params: params
    }
  ).pipe(
    map((response: any) => response),
    catchError((error) => {
      console.error('Error GetTherapistsAvailabilityByPatientID:', error);
      return throwError(() => error);
    })
  );
}


  getAllCategories(): Observable<any> {
      const token = localStorage.getItem('tokenPatients');
  const headers = new HttpHeaders({
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  });
   return this.http.get(`${environment.apidev}/Dropdowns/Specialization
`,{headers}).pipe(
      map((response: any) => response),
      catchError((error) => {
        console.error('Error GetInsuranceByPatientId:', error);
        return throwError(() => error);
      })
    );
  }



    private patients = signal<Patient[]>([
    // Lotus Hospital Patients
    {
      id: 'patient-lotus-1',
      firstName: 'John',
      lastName: 'Smith',
      email: 'john.smith@email.com',
      phone: '(555) 123-4567',
      dateOfBirth: new Date(1985, 5, 15),
      clientId: 'client-lotus',
      therapistId: 'therapist-lotus-1',
      status: 'active',
      emergencyContact: {
        name: 'Jane Smith',
        phone: '(555) 987-6543',
        relationship: 'Spouse'
      },
      createdAt: new Date(2024, 0, 15),
      updatedAt: new Date(2024, 0, 15)
    },
    {
      id: 'patient-lotus-2',
      firstName: 'Sarah',
      lastName: 'Johnson',
      email: 'sarah.johnson@email.com',
      phone: '(555) 234-5678',
      dateOfBirth: new Date(1990, 8, 22),
      clientId: 'client-lotus',
      therapistId: 'therapist-lotus-1',
      status: 'active',
      emergencyContact: {
        name: 'Mike Johnson',
        phone: '(555) 876-5432',
        relationship: 'Brother'
      },
      createdAt: new Date(2024, 1, 10),
      updatedAt: new Date(2024, 1, 10)
    },
    // Apollo Hospital Patients
    {
      id: 'patient-apollo-1',
      firstName: 'Michael',
      lastName: 'Brown',
      email: 'michael.brown@email.com',
      phone: '(555) 345-6789',
      dateOfBirth: new Date(1978, 11, 3),
      clientId: 'client-apollo',
      therapistId: 'therapist-apollo-1',
      status: 'active',
      createdAt: new Date(2024, 2, 5),
      updatedAt: new Date(2024, 2, 5)
    },
    // Solo Provider Patients
    {
      id: 'patient-solo-1',
      firstName: 'Emma',
      lastName: 'Davis',
      email: 'emma.davis@email.com',
      phone: '(555) 456-7890',
      dateOfBirth: new Date(1992, 3, 18),
      clientId: 'client-solo-1',
      therapistId: 'solo-provider-1',
      status: 'active',
      createdAt: new Date(2024, 3, 1),
      updatedAt: new Date(2024, 3, 1)
    }
  ]);

  getPatients(): Observable<Patient[]> {
    return of(this.patients()).pipe(delay(300));
  }

  getPatientsByClient(clientId: string): Observable<Patient[]> {
    return of(this.patients().filter(p => p.clientId === clientId)).pipe(delay(300));
  }

  getPatientsByTherapist(therapistId: string, clientId?: string): Observable<Patient[]> {
    let filtered = this.patients().filter(p => p.therapistId === therapistId);
    if (clientId) {
      filtered = filtered.filter(p => p.clientId === clientId);
    }
    return of(filtered).pipe(delay(300));
  }

  getPatientById(id: string): Observable<Patient | undefined> {
    return of(this.patients().find(p => p.id === id)).pipe(delay(300));
  }

  createPatient(patient: Omit<Patient, 'id' | 'createdAt' | 'updatedAt'>): Observable<Patient> {
    const newPatient: Patient = {
      ...patient,
      id: this.generateId(),
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.patients.update(patients => [...patients, newPatient]);
    return of(newPatient).pipe(delay(500));
  }

  updatePatient(id: string, updates: Partial<Patient>): Observable<Patient> {
    const currentPatients = this.patients();
    const index = currentPatients.findIndex(p => p.id === id);
    
    if (index === -1) {
      return throwError(() => new Error('Patient not found'));
    }

    const updatedPatient = {
      ...currentPatients[index],
      ...updates,
      updatedAt: new Date()
    };

    this.patients.update(patients => {
      const newPatients = [...patients];
      newPatients[index] = updatedPatient;
      return newPatients;
    });

    return of(updatedPatient).pipe(delay(500));
  }

  deletePatient(id: string): Observable<boolean> {
    this.patients.update(patients => patients.filter(p => p.id !== id));
    return of(true).pipe(delay(500));
  }

  private generateId(): string {
    return Math.random().toString(36).substr(2, 9);
  }


    getAllPatientsList(): Observable<any[]> {
    return this.http
      .get<any[]>(`${environment.apidev}/Patients/`)
      .pipe(
        map((patients) => patients || []),
        catchError((error) => {
          console.error('Patient list fetch error:', error);
          return of([]);
        }),
        shareReplay(1)
      );
  }

// GetPaymentRequestsByPatientId(patientId:string){
// let params = new HttpParams();
//   if (patientId) {
//     params = params.set('patientId', patientId);
//   }
//     return this.http.get(`${environment.apidev}/Billing/GetPaymentRequestsByPatientId`,{
//     params
//   }).pipe(
//       map((response: any) => response), 
//       catchError((error) => {
//         console.error('Error GetPaymentRequestsByPatientId:', error);
//         return throwError(() => error);
//       })
//     );    
//   }



    getDiagnosis(): Observable<any[]> {
    return this.http
      .get<any[]>(`${environment.apidev}/Dropdowns/diagnosis`)
      .pipe(
        map((patients) => patients || []),
        catchError((error) => {
          console.error('Patient list fetch error:', error);
          return of([]);
        }),
        shareReplay(1)
      );
  }

getQuickBookssync(id: any): Observable<any[]> {
  return this.http
    .post<any[]>(`${environment.apidev}/QuickBooks/sync/patient/${id}`, {})
    .pipe(
      map((patients) => patients || []),
      catchError((error) => {
        console.error('QuickBooks sync error:', error);
        return of([]);
      }),
      shareReplay(1)
    );
}

  getPatientFilesByPatientId(patientId: string): Observable<PatientFileDto[]> {
  const token = localStorage.getItem('tokenPatients');
  const headers = new HttpHeaders({
    'Authorization': `Bearer ${token}`
  });

  return this.http.get<PatientFileDto[]>(
    `${environment.apidev}/PatientFiles/patient/${patientId}`,
    { headers }
  );
}

getPatientFilesByCategory(patientId: string, category: string): Observable<PatientFileDto[]> {
  const token = localStorage.getItem('tokenPatients');
  const headers = new HttpHeaders({
    'Authorization': `Bearer ${token}`
  });

  return this.http.get<PatientFileDto[]>(
    `${environment.apidev}/patient/${patientId}/category/${category}`,
    { headers }
  );
}

getPatientFileById(id: string): Observable<PatientFileDto> {
  const token = localStorage.getItem('tokenPatients');
  const headers = new HttpHeaders({
    'Authorization': `Bearer ${token}`
  });

  return this.http.get<PatientFileDto>(
    `${environment.apidev}/${id}`,
    { headers }
  );
}

uploadMultipleFiles(files: File[], request: MultipleFileUploadRequest): Observable<MultipleFileUploadResponse> {
  const token = localStorage.getItem('tokenPatients');
  const headers = new HttpHeaders({
    'Authorization': `Bearer ${token}`
  });

  const formData = new FormData();
  files.forEach(file => {
    formData.append('files', file);
  });
  formData.append('patientId', request.patientId);
  formData.append('category', request.category);
  if (request.description) {
    formData.append('description', request.description);
  }
  if (request.tags) {
    formData.append('tags', request.tags);
  }
  formData.append('isConfidential', request.isConfidential.toString());

  return this.http.post<MultipleFileUploadResponse>(
    `${environment.apidev}/PatientFiles/upload-multiple`,
    formData,
    { headers }
  );
}

updatePatientFile(id: string, request: UpdatePatientFileRequest): Observable<PatientFileDto> {
  const token = localStorage.getItem('tokenPatients');
  const headers = new HttpHeaders({
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  });

  return this.http.put<PatientFileDto>(
    `${environment.apidev}/PatientFiles/${id}`,
    request,
    { headers }
  );
}



deletePatientFile(id: string): Observable<{ message: string }> {
  const token = localStorage.getItem('tokenPatients');
  const headers = new HttpHeaders({
    'Authorization': `Bearer ${token}`
  });

  return this.http.delete<{ message: string }>(
    `${environment.apidev}/PatientFiles/${id}`,
    { headers }
  );
}

downloadFile(id: string): Observable<Blob> {
  const token = localStorage.getItem('tokenPatients');
  const headers = new HttpHeaders({
    'Authorization': `Bearer ${token}`
  });

  return this.http.get(
    `${environment.apidev}/PatientFiles/${id}/download`,
    { 
      headers,
      responseType: 'blob'
    }
  );
}

getPresignedUrl(id: string, expirationMinutes: number = 60): Observable<PresignedUrlResponse> {
  const token = localStorage.getItem('tokenPatients');
  const headers = new HttpHeaders({
    'Authorization': `Bearer ${token}`
  });

  const params = new HttpParams().set('expirationMinutes', expirationMinutes.toString());
  
  return this.http.get<PresignedUrlResponse>(
    `${environment.apidev}/${id}/presigned-url`,
    { 
      headers,
      params 
    }
  );
}

searchPatientFiles(
  patientId: string,
  searchTerm?: string,
  category?: string,
  fromDate?: Date,
  toDate?: Date
): Observable<PatientFileDto[]> {
  const token = localStorage.getItem('tokenPatients');
  const headers = new HttpHeaders({
    'Authorization': `Bearer ${token}`
  });

  let params = new HttpParams();
  if (searchTerm) {
    params = params.set('searchTerm', searchTerm);
  }
  if (category) {
    params = params.set('category', category);
  }
  if (fromDate) {
    params = params.set('fromDate', fromDate.toISOString());
  }
  if (toDate) {
    params = params.set('toDate', toDate.toISOString());
  }

  return this.http.get<PatientFileDto[]>(
    `${environment.apidev}/patient/${patientId}/search`,
    { 
      headers,
      params 
    }
  );
}

getFileCategories(): Observable<string[]> {
  const token = localStorage.getItem('tokenPatients');
  const headers = new HttpHeaders({
    'Authorization': `Bearer ${token}`
  });

  return this.http.get<string[]>(
    `${environment.apidev}/PatientFiles/categories`,
    { headers }
  );
}

  private patientsCache$!: Observable<any>;
  
  // Signal-based state management
  private availabilitiesSignal = signal<any[]>([]);
  private leavesSignal = signal<any[]>([]);
  private therapistsSignal = signal<any[]>([]);


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

  // File URL Subject
  private fileUrlSubject = new BehaviorSubject<string | null>(null);
  fileUrl$ = this.fileUrlSubject.asObservable();

  setFileUrl(url: string) {
    this.fileUrlSubject.next(url);
  }

  clearFileUrl() {
    this.fileUrlSubject.next(null);
  }

  // Chief Complaint Methods
  getChiefComplaintdata(): Observable<any> {
    const token = localStorage.getItem('tokenPatients');
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    return this.http.get(
      `${environment.apidev}/ChiefComplaints`,
      { headers }
    ).pipe(
      map((response: any) => response?.data || response),
      catchError(error => {
        console.error('Error fetching chief complaints:', error);
        return throwError(() => error);
      })
    );
  }

  // Patient Assessment Methods
  getPatientAssessment(assessmentId: string): Observable<any> {
    const token = localStorage.getItem('tokenPatients');
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    const params = new HttpParams().set('assessmentId', assessmentId);

    return this.http.get(
      `${environment.apidev}/PatientAssessment/GetPatientAssessment`,
      { 
        headers,
        params 
      }
    ).pipe(
      map((response: any) => response?.data || response),
      catchError(error => {
        console.error('Error fetching patient assessment:', error);
        return throwError(() => error);
      })
    );
  }

  // Save Patient Assessment
  savePatientAssessment(data: any): Observable<any> {
    const token = localStorage.getItem('tokenPatients');
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });

    return this.http.post(
      `${environment.apidev}/InitialAssessments`,
      data,
      { headers }
    ).pipe(
      map((response: any) => response?.data || response),
      catchError(error => {
        console.error('Error saving assessment:', error);
        return throwError(() => error);
      })
    );
  }

  // Dropdown Methods
  getDropdowndata(category: string): Observable<any> {
    const token = localStorage.getItem('tokenPatients');
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    return this.http.get(
      `${environment.apidev}/Dropdowns/${category}`,
      { headers }
    ).pipe(
      map((response: any) => response?.data || response),
      catchError(error => {
        console.error(`Error fetching dropdown data for ${category}:`, error);
        return throwError(() => error);
      })
    );
  }

  // Medication Methods
  getMedicationdata(): Observable<any> {
    const token = localStorage.getItem('tokenPatients');
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    return this.http.get(
      `${environment.apidev}/Dropdowns/GetMedications`,
      { headers }
    ).pipe(
      map((response: any) => response?.data || response),
      catchError(error => {
        console.error('Error fetching medication data:', error);
        return throwError(() => error);
      })
    );
  }

  // Allergy Methods
  getAllergyDataByCategory(category: string, categoryId: number): Observable<any> {
    const token = localStorage.getItem('tokenPatients');
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    const params = new HttpParams()
      .set('category', category)
      .set('id', categoryId.toString());

    return this.http.get(
      `${environment.apidev}/Dropdowns/GetAllergies`,
      { 
        headers,
        params 
      }
    ).pipe(
      map((response: any) => response?.data || response),
      catchError(error => {
        console.error('Error fetching allergy data:', error);
        return throwError(() => error);
      })
    );
  }

  // File Upload Methods
  fileUpload(formData: FormData, folder: string): Observable<any> {
    const token = localStorage.getItem('tokenPatients');
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
      // Note: Don't set Content-Type for FormData
    });

    const url = `${environment.apidev}/FileUpload/upload`;

    return this.http.post(
      `${url}?folder=${folder}`,
      formData,
      { headers }
    ).pipe(
      map((response: any) => response?.data || response),
      catchError(error => {
        console.error('Error during file upload:', error);
        return throwError(() => error);
      })
    );
  }

  // Patient Methods
  getPatientsList(clientId: string, pageNumber: number, pageSize: number): Observable<any> {
    const token = localStorage.getItem('tokenPatients');
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    const url = `${environment.apidev}/Patients/client/${clientId}?pageNumber=${pageNumber}&pageSize=${pageSize}`;
    
    return this.http.get(
      url,
      { headers }
    ).pipe(
      map((response: any) => response?.data || {}),
      catchError(error => {
        console.error('Error during getting patient list:', error);
        return throwError(() => error);
      })
    );
  }

  // Therapist Methods
  getTherapistList(): Observable<any[]> {
    const token = localStorage.getItem('tokenPatients');
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    return this.http.get(
      `${environment.apidev}/Users/therapists`,
      { headers }
    ).pipe(
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

  // Additional dropdown methods used in your component
  getMedicationFrequencyData(): Observable<any> {
    const token = localStorage.getItem('tokenPatients');
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    return this.http.get(
      `${environment.apidev}/Dropdowns/MedicationFrequency`,
      { headers }
    ).pipe(
      map((response: any) => response?.data || response),
      catchError(error => {
        console.error('Error fetching medication frequency data:', error);
        return throwError(() => error);
      })
    );
  }

  getChronicConditionData(): Observable<any> {
    const token = localStorage.getItem('tokenPatients');
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    return this.http.get(
      `${environment.apidev}/Dropdowns/ChronicCondition`,
      { headers }
    ).pipe(
      map((response: any) => response?.data || response),
      catchError(error => {
        console.error('Error fetching chronic condition data:', error);
        return throwError(() => error);
      })
    );
  }

  getSmokingStatusData(): Observable<any> {
    const token = localStorage.getItem('tokenPatients');
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    return this.http.get(
      `${environment.apidev}/Dropdowns/SmokingStatus`,
      { headers }
    ).pipe(
      map((response: any) => response?.data || response),
      catchError(error => {
        console.error('Error fetching smoking status data:', error);
        return throwError(() => error);
      })
    );
  }

  getAlcoholStatusData(): Observable<any> {
    const token = localStorage.getItem('tokenPatients');
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    return this.http.get(
      `${environment.apidev}/Dropdowns/AlcoholStatus`,
      { headers }
    ).pipe(
      map((response: any) => response?.data || response),
      catchError(error => {
        console.error('Error fetching alcohol status data:', error);
        return throwError(() => error);
      })
    );
  }

  getBeverageStatusData(): Observable<any> {
    const token = localStorage.getItem('tokenPatients');
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    return this.http.get(
      `${environment.apidev}/Dropdowns/BeverageStatus`,
      { headers }
    ).pipe(
      map((response: any) => response?.data || response),
      catchError(error => {
        console.error('Error fetching beverage status data:', error);
        return throwError(() => error);
      })
    );
  }

  // Other existing methods with token attachment
  getDepartment(): Observable<any> {
    const token = localStorage.getItem('tokenPatients');
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    return this.http.get(
      `${environment.apidev}/Dropdowns/values/category/Department`,
      { headers }
    ).pipe(
      map((response: any) => response?.data || response),
      catchError(error => {
        console.error('Error fetching department:', error);
        return throwError(() => error);
      })
    );
  }

  getSpecializations(parentId: number): Observable<any> {
    const token = localStorage.getItem('tokenPatients');
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    const params = new HttpParams().set('departmentId', parentId.toString());

    return this.http.get(
      `${environment.apidev}/Dropdowns/values/category/Specialization`,
      { 
        headers,
        params 
      }
    ).pipe(
      map((response: any) => response?.data || response),
      catchError(error => {
        console.error('Error fetching specializations:', error);
        return throwError(() => error);
      })
    );
  }

addPatientVitals(dto: PatientVitalsCreateDto): Observable<ApiResponse<PatientVitalsResponseDto>> {
  const token = localStorage.getItem('tokenPatients');
  const headers = new HttpHeaders({
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  });

  return this.http.post<ApiResponse<PatientVitalsResponseDto>>(
    `${environment.apidev}/Patients/vitals`,
    dto,
    { headers }
  ).pipe(
    catchError(error => {
      console.error('Error adding patient vitals:', error);
      return throwError(() => error);
    })
  );
}

updatePatientVitals(dto: PatientVitalsUpdateDto): Observable<ApiResponse<PatientVitalsResponseDto>> {
  const token = localStorage.getItem('tokenPatients');
  const headers = new HttpHeaders({
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  });

  return this.http.put<ApiResponse<PatientVitalsResponseDto>>(
    `${environment.apidev}/Patients/vitals`,
    dto,
    { headers }
  ).pipe(
    catchError(error => {
      console.error('Error updating patient vitals:', error);
      return throwError(() => error);
    })
  );
}

deletePatientVitals(id: string): Observable<ApiResponse<void>> {
  const token = localStorage.getItem('tokenPatients');
  const headers = new HttpHeaders({
    'Authorization': `Bearer ${token}`
  });

  const params = new HttpParams().set('id', id);

  return this.http.delete<ApiResponse<void>>(
    `${environment.apidev}/Patients/DeletePatientVitals`,
    { 
      headers,
      params 
    }
  ).pipe(
    catchError(error => {
      console.error('Error deleting patient vitals:', error);
      return throwError(() => error);
    })
  );
}

getPatientVitalsById(id: string): Observable<ApiResponse<PatientVitalsResponseDto>> {
  const token = localStorage.getItem('tokenPatients');
  const headers = new HttpHeaders({
    'Authorization': `Bearer ${token}`
  });

  const params = new HttpParams().set('id', id);

  return this.http.get<ApiResponse<PatientVitalsResponseDto>>(
    `${environment.apidev}/Patients/GetPatientVitalsById`,
    { 
      headers,
      params 
    }
  ).pipe(
    catchError(error => {
      console.error('Error fetching patient vitals by ID:', error);
      return throwError(() => error);
    })
  );
}

getVitalsByPatientId(patientId: string): Observable<ApiResponse<PatientVitalsResponseDto[]>> {
  const token = localStorage.getItem('tokenPatients');
  const headers = new HttpHeaders({
    'Authorization': `Bearer ${token}`
  });

  const params = new HttpParams().set('patientId', patientId);

  return this.http.get<ApiResponse<PatientVitalsResponseDto[]>>(
    `${environment.apidev}/patients/GetVitalsByPatientId`,
    { 
      headers,
      params 
    }
  ).pipe(
    catchError(error => {
      console.error('Error fetching vitals by patient ID:', error);
      return throwError(() => error);
    })
  );
}

getLatestVitalsByPatientId(patientId: string): Observable<ApiResponse<PatientVitalsResponseDto>> {
  const token = localStorage.getItem('tokenPatients');
  const headers = new HttpHeaders({
    'Authorization': `Bearer ${token}`
  });

  const params = new HttpParams().set('patientId', patientId);

  return this.http.get<ApiResponse<PatientVitalsResponseDto>>(
    `${environment.apidev}/Patients/GetLatestVitalsByPatientId`,
    { 
      headers,
      params 
    }
  ).pipe(
    catchError(error => {
      console.error('Error fetching latest vitals by patient ID:', error);
      return throwError(() => error);
    })
  );
}

private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('tokenPatients');
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
  }

  getAllInitialAssessments(): Observable<InitialAssessmentDto[]> {
    const headers = this.getAuthHeaders();

    return this.http.get<InitialAssessmentDto[]>(environment.apidev, { headers }).pipe(
      catchError(error => {
        console.error('Error fetching all initial assessments:', error);
        return throwError(() => error);
      })
    );
  }

  getInitialAssessmentsByPatientId(patientId: string): Observable<InitialAssessmentDto[]> {
    const headers = this.getAuthHeaders();

    return this.http.get<InitialAssessmentDto[]>(`${environment.apidev}/initialassessments/patient/${patientId}`, { headers }).pipe(
      catchError(error => {
        console.error('Error fetching assessments by patient ID:', error);
        return throwError(() => error);
      })
    );
  }

  getInitialAssessmentById(id: string): Observable<InitialAssessmentDto> {
    const headers = this.getAuthHeaders();

    return this.http.get<InitialAssessmentDto>(`${environment.apidev}/${id}`, { headers }).pipe(
      catchError(error => {
        console.error('Error fetching assessment by ID:', error);
        return throwError(() => error);
      })
    );
  }

  getLatestInitialAssessmentByPatientId(patientId: string): Observable<InitialAssessmentDto> {
    const headers = this.getAuthHeaders();

    return this.http.get<InitialAssessmentDto>(`${environment.apidev}/patient/${patientId}/latest`, { headers }).pipe(
      catchError(error => {
        console.error('Error fetching latest assessment by patient ID:', error);
        return throwError(() => error);
      })
    );
  }

  getInitialAssessmentVersions(patientId: string): Observable<InitialAssessmentDto[]> {
    const headers = this.getAuthHeaders();

    return this.http.get<InitialAssessmentDto[]>(`${environment.apidev}/patient/${patientId}/versions`, { headers }).pipe(
      catchError(error => {
        console.error('Error fetching assessment versions:', error);
        return throwError(() => error);
      })
    );
  }

  createInitialAssessment(request: CreateInitialAssessmentRequest): Observable<InitialAssessmentDto> {
    const headers = this.getAuthHeaders();

    return this.http.post<InitialAssessmentDto>(`${environment.apidev}/initialassessments`, request, { headers }).pipe(
      catchError(error => {
        console.error('Error creating initial assessment:', error);
        return throwError(() => error);
      })
    );
  }

  updateInitialAssessment(id: string, request: CreateInitialAssessmentRequest): Observable<InitialAssessmentDto> {
    const headers = this.getAuthHeaders();

    return this.http.put<InitialAssessmentDto>(`${environment.apidev}/initialassessments/${id}`, request, { headers }).pipe(
      catchError(error => {
        console.error('Error updating initial assessment:', error);
        return throwError(() => error);
      })
    );
  }

  deleteInitialAssessment(id: string): Observable<any> {
    const headers = this.getAuthHeaders();

    return this.http.delete(`${environment.apidev}/${id}`, { headers }).pipe(
      catchError(error => {
        console.error('Error deleting initial assessment:', error);
        return throwError(() => error);
      })
    );
  }

  publishDraft(id: string): Observable<InitialAssessmentDto> {
    const headers = this.getAuthHeaders();

    return this.http.post<InitialAssessmentDto>(`${environment.apidev}/InitialAssessments/${id}/publish`, {}, { headers }).pipe(
      catchError(error => {
        console.error('Error publishing draft assessment:', error);
        return throwError(() => error);
      })
    );
  }

  getDraftInitialAssessments(): Observable<InitialAssessmentDto[]> {
    const headers = this.getAuthHeaders();

    return this.http.get<InitialAssessmentDto[]>(`${environment.apidev}/drafts`, { headers }).pipe(
      catchError(error => {
        console.error('Error fetching draft assessments:', error);
        return throwError(() => error);
      })
    );
  }

  getDropdownsByCategory(category: string): Observable<DropdownValue[]> {
  const token = localStorage.getItem('tokenPatients');
  const headers = new HttpHeaders({
    'Authorization': `Bearer ${token}`
  });

  return this.http.get<DropdownValue[]>(`${environment.apidev}/dropdowns/${category}`, { 
    headers 
  }).pipe(
    catchError(error => {
      console.error('Error fetching dropdowns by category:', error);
      return throwError(() => error);
    })
  );
}
getAllMedications(): Observable<MedicationDto[]> {
  const token = localStorage.getItem('tokenPatients');
  const headers = new HttpHeaders({
    'Authorization': `Bearer ${token}`
  });

  return this.http.get<MedicationDto[]>(`${environment.apidev}/medications`, { 
    headers 
  }).pipe(
    catchError(error => {
      console.error('Error fetching all medications:', error);
      return throwError(() => error);
    })
  );
}

  bookAppointment(appointmentData: any): Observable<any> {
      const token = localStorage.getItem('tokenPatients');
  const headers = new HttpHeaders({
    'Authorization': `Bearer ${token}`
  });

    return this.http.post(`${environment.apidev}/appointments`, appointmentData,{ 
    headers 
  });
  }

  getAppointmentsByPatientId(patientId: string): Observable<any> {
        const token = localStorage.getItem('tokenPatients');
  const headers = new HttpHeaders({
    'Authorization': `Bearer ${token}`
  });

    return this.http.get(`${environment.apidev}/appointments/patient/${patientId}`, { 
    headers 
  });
  }

    saveAppointmentWithTransaction(data: any): Observable<any> {
        const token = localStorage.getItem('tokenPatients');
  const headers = new HttpHeaders({
    'Authorization': `Bearer ${token}`
  });

    return this.http.post(`${environment.apidev}/Appointments`, data, { 
    headers 
  }).pipe(
      map((response: any) => response?.data || response),
      catchError(error => {
        console.error('Error during saving appointment with transaction:', error);
        return throwError(() => error);
      })
    );
  }

    getTherapistsByAvailability(date?: string, specialization?: string): Observable<any[]> {
    const mockTherapists: any[] = [
      {
        id: '1',
        name: 'Dr. Sarah Johnson',
        specialization: 'Physical Therapy',
        rating: 4.8,
        availableSlots: [
          { date: '2025-11-25', startTime: '09:00', endTime: '10:00', isAvailable: true },
          { date: '2025-11-25', startTime: '14:00', endTime: '15:00', isAvailable: true },
          { date: '2025-11-26', startTime: '10:00', endTime: '11:00', isAvailable: true }
        ]
      },
      {
        id: '2',
        name: 'Dr. Michael Chen',
        specialization: 'Occupational Therapy',
        rating: 4.9,
        availableSlots: [
          { date: '2025-11-25', startTime: '11:00', endTime: '12:00', isAvailable: true },
          { date: '2025-11-26', startTime: '09:00', endTime: '10:00', isAvailable: true },
          { date: '2025-11-26', startTime: '15:00', endTime: '16:00', isAvailable: true }
        ]
      },
      {
        id: '3',
        name: 'Dr. Emily Davis',
        specialization: 'Speech Therapy',
        rating: 4.7,
        availableSlots: [
          { date: '2025-11-25', startTime: '13:00', endTime: '14:00', isAvailable: true },
          { date: '2025-11-26', startTime: '11:00', endTime: '12:00', isAvailable: true }
        ]
      },
      {
        id: '4',
        name: 'Dr. James Wilson',
        specialization: 'Physical Therapy',
        rating: 4.6,
        availableSlots: [
          { date: '2025-11-25', startTime: '10:00', endTime: '11:00', isAvailable: true },
          { date: '2025-11-26', startTime: '14:00', endTime: '15:00', isAvailable: true }
        ]
      }
    ];

    let filteredTherapists = mockTherapists;

    if (specialization) {
      filteredTherapists = filteredTherapists.filter(t =>
        t.specialization.toLowerCase().includes(specialization.toLowerCase())
      );
    }

    if (date) {
      filteredTherapists = filteredTherapists.filter(t =>
        t.availableSlots.some((slot:any) => slot.date === date)
      );
    }

    return of(filteredTherapists);
  }

GetServiceItemS(clientId: string): Observable<any> {
  const token = localStorage.getItem('tokenPatients');
  const headers = new HttpHeaders({
    'Authorization': `Bearer ${token}`
  });

  const url = `${environment.apidev}/Services/GetClientServices`;
  const params = { clientId };

  return this.http.get<any>(url, { 
    headers,
    params 
  }).pipe(
    map((response) => {
      console.log('Client services fetched:', response);
      return response;
    }),
    catchError((error) => {
      console.error('Error fetching client services:', error);
      return throwError(() => error);
    })
  );
}
}
