import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { environment } from '../../../environments/environments';
import { catchError, map } from 'rxjs/operators';

export interface Menu {
  id: string;
  name: string;
  url: string;
  icon: string;
  parentMenuId?: string | null;
  parentMenu?: Menu | null;
  submenus?: Menu[];
  isActive:boolean;
  activeUrls?: string[];
}


@Injectable({
  providedIn: 'root'
})

export class MenuService {

  private apiUrl = `${environment.apidev}/Menus/my-menus`;

  constructor(private http: HttpClient) { }

  getMenus(): Observable<Menu[]> {
  return this.http.get<{ success: boolean; message: string; data: Menu[]; errors?: any }>(this.apiUrl)
    .pipe(
      map(response => response.data || [])
    );
}

  //  getUserMenu(): Observable<any> {
  //   return this.http.get(`${environment.apidev}/Menus/GetUserMenus`).pipe(
  //     map((response: any) => response?.data || response),
  //     catchError((error) => {
  //       console.error('Error during getting menus:', error);
  //       return throwError(() => error);
  //     })
  //   );
  // } 

    getSuperAdminMenus(): Observable<any> {
    return this.http.get(`${environment.apidev}/Menus/superadmin-menus`).pipe(
      map((response: any) => response?.data || response),
      catchError((error) => {
        console.error('Error during getting menus:', error);
        return throwError(() => error);
      })
    );
  }
}
