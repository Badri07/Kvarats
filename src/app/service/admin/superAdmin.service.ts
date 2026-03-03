import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Inject, Injectable, PLATFORM_ID, signal } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, catchError, map, Observable, throwError } from 'rxjs';
import { environment } from '../../../environments/environments';

@Injectable({
  providedIn: 'root'
})
export class SuperAdminService {


    private categoryNameSubject = new BehaviorSubject<string | null>(null);
    categoryName$ = this.categoryNameSubject.asObservable();

  setCategoryName(categoryName: string): void {
    this.categoryNameSubject.next(categoryName);
  }

      constructor(
    private http: HttpClient, 
    @Inject(PLATFORM_ID) private platformId: string,
    private router: Router
  ) { }

      savecategories(data: any): Observable<any> {
        debugger
        return this.http.post(`${environment.apidev}/Dropdowns/categories`, data).pipe(
          map((response: any) => {
            
            return response;
          }),
          catchError(error => {
            console.error('Error during getting user list:', error);
            return throwError(() => error);
          })
        );
      }

updateCategory(categoryId: string, data: any): Observable<any> {
  const url = `${environment.apidev}/Dropdowns/categories/${categoryId}`;
  return this.http.put(url, data).pipe(
    map((response: any) => response?.data || response),
    catchError(error => {
      console.error('Error updating category:', error);
      return throwError(() => error);
    })
  );
}

DeleteCategory(categoryId: string): Observable<any> {
  const url = `${environment.apidev}/Dropdowns/categories/${categoryId}`;
  return this.http.delete(url).pipe(
    map((response: any) => response?.data || response),
    catchError(error => {
      console.error('Error updating category:', error);
      return throwError(() => error);
    })
  );
}


      

      createDropdownValue(data: any): Observable<any> {
        debugger
        return this.http.post(`${environment.apidev}/Dropdowns/values`, data).pipe(
          map((response: any) => {
            
            return response;
          }),
          catchError(error => {
            console.error('Error during getting user list:', error);
            return throwError(() => error);
          })
        );
      }

    updateDropdownValue(id: number, data: any): Observable<any> {
  return this.http.put(`${environment.apidev}/Dropdowns/values/${id}`, data).pipe(
    map((response: any) => {
      return response;
    }),
    catchError(error => {
      console.error('Error during updating dropdown value:', error);
      return throwError(() => error);
    })
  );
}


deleteDropdownValue(id: number): Observable<any> {
  return this.http.delete(`${environment.apidev}/Dropdowns/values/${id}`).pipe(
    map((response: any) => {
      return response;
    }),
    catchError(error => {
      console.error('Error during deleting dropdown value:', error);
      return throwError(() => error);
    })
  );
}



  UploadFile(file: File): Observable<any> {
  const formData = new FormData();
  formData.append('file', file, file.name);

  return this.http.post(`${environment.apidev}/CountriesData/import-Countries-csv`, formData).pipe(
    map((response: any) => {
      return response;
    }),
    catchError(error => {
      console.error('Error during file upload:', error);
      return throwError(() => error);
    })
  );
}

  UploadFileMedication(file: File): Observable<any> {
  const formData = new FormData();
  formData.append('file', file, file.name);

  return this.http.post(`${environment.apidev}/Medications/import-medications-csv`, formData).pipe(
    map((response: any) => {
      return response;
    }),
    catchError(error => {
      console.error('Error during file upload:', error);
      return throwError(() => error);
    })
  );
}
  UploadFileDiagnoses(file: File): Observable<any> {
  const formData = new FormData();
  formData.append('file', file, file.name);

  return this.http.post(`${environment.apidev}/Dropdowns/import-diagnoses-csv`, formData).pipe(
    map((response: any) => {
      return response;
    }),
    catchError(error => {
      console.error('Error during file upload:', error);
      return throwError(() => error);
    })
  );
}

  UploadFileCheifComplaint(file: File): Observable<any> {
  const formData = new FormData();
  formData.append('file', file, file.name);

  return this.http.post(`${environment.apidev}/ChiefComplaints/import-chief-complaints-csv`, formData).pipe(
    map((response: any) => {
      return response;
    }),
    catchError(error => {
      console.error('Error during file upload:', error);
      return throwError(() => error);
    })
  );
}

// In your AdminService
getClient(id: string): Observable<any> {
  return this.http.get<{ data: any }>(`${environment.apidev}/Clients/${id}`).pipe(
    map(response => response.data)
  );
}

updateClient(id: string, updates: any): Observable<any> {
  return this.http.put<{ data: any }>(
    `${environment.apidev}/Clients/${id}`,
    updates
  ).pipe(
    map(response => {
      const updatedClient = response.data;
      // Update local state if needed
      return updatedClient;
    }),
    catchError(error => {
      console.error('Error while updating client:', error);
      return throwError(() => new Error('Failed to update client'));
    })
  );
}

deleteClient(id: string): Observable<any> {
  return this.http.delete<{ data: any }>(
    `${environment.apidev}/Clients/${id}`
  ).pipe(
    map(response => response.data),
    catchError(error => {
      console.error('Error while deleting client:', error);
      return throwError(() => new Error('Failed to delete client'));
    })
  );
}

addClient(clientData: any): Observable<any> {
  return this.http.post<{ data: any }>(
    `${environment.apidev}/Clients`,
    clientData
  ).pipe(
    map(response => response.data),
    catchError(error => {
      console.error('Error while adding client:', error);
      return throwError(() => new Error('Failed to add client'));
    })
  );
}
     

 getSuperAdminDashboard(): Observable<any> {
    return this.http.get(
      `${environment.apidev}/Dashboard/GetSuperAdminDashboard`
    ).pipe(
      map((response: any) => {
        return this.transformDashboardResponse(response);
      }),
      catchError(error => {
        console.error('Error while fetching dashboard data:', error);
        return throwError(() => new Error('Failed to fetch dashboard data'));
      })
    );
  }

  private transformDashboardResponse(response: any): any {
    return {
      success: response.success,
      message: response.message,
      data: {
        totalClients: response.data?.totalClients || 0,
        totalClientsThisMonth: response.data?.totalClientsThisMonth || 0,
        totalMultiProviders: response.data?.totalMultiProviders || 0,
        totalMultiProvidersThisMonth: response.data?.totalMultiProvidersThisMonth || 0,
        totalSoloProviders: response.data?.totalSoloProviders || 0,
        totalSoloProvidersThisMonth: response.data?.totalSoloProvidersThisMonth || 0,
        recentClients: response.data?.recentClients || []
      },
      errors: response.errors
    };
  }

  
// In your admin.service.ts
getClientSubscriptions(clientId: string):Observable<any> {
  return this.http.get(`${environment.apidev}/Services/GetClientServices`, {
    params: { clientId } // or however your API expects the clientId
  });
}

subscribeService(clientData: any): Observable<any> {
  return this.http.post<{ data: any }>(
    `${environment.apidev}/Services/subscribe-clientservice`,
    clientData
  ).pipe(
    map(response => response.data),
    catchError(error => {
      console.error('Error while adding client:', error);
      return throwError(() => new Error('Failed to add client'));
    })
  );
}

unsubscribeService(serviceId: string, clientId: string) {
  return this.http.delete(`${environment.apidev}/Services/unsubscribe/${serviceId}`, {
    params: { clientId } 
  });
}
}



