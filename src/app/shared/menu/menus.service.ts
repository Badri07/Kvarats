import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environments';

export interface Menu {
  id: string;
  name: string;
  url: string;
  icon: string;
  parentMenuId?: string | null;
  parentMenu?: Menu | null;
  submenus?: Menu[];
}


@Injectable({
  providedIn: 'root'
})

export class MenuService {

  private apiUrl = `${environment.apidev}/Menus`;

  constructor(private http: HttpClient) { }

  getMenus(): Observable<Menu[]> {
    return this.http.get<Menu[]>(this.apiUrl);
  }
}
