import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environments';

export interface DropdownValue {
  id: number;
  category: string;
  code: string;
  description: string;
  sortOrder: number;
  active: boolean;
  parentValueId: number | null;
  children: DropdownValue[] | null;
}

@Injectable({
  providedIn: 'root'
})
export class DropdownService {
    private apiUrl =   `${environment.apidev}/dropdowns`;
  

  constructor(private http: HttpClient) {}

  getDropdownsByCategory(category: string): Observable<DropdownValue[]> {
    return this.http.get<DropdownValue[]>(`${this.apiUrl}/${category}`);
  }
}
