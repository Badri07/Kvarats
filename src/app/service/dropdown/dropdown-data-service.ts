import { Injectable } from '@angular/core';
import { BehaviorSubject, catchError, map, Observable, of, throwError } from 'rxjs';
import { CountriesData, LookupData, Medication } from '../../models/dropdown-data-model';
import { environment } from '../../../environments/environments';
import { HttpClient, HttpParams } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class DropdownDataService {
  private countriesSubject = new BehaviorSubject<CountriesData[]>([
    {
      id: 1,
      country: 'United States',
      mobilePrefixCode: '+1',
      stateName: 'California',
      stateCode: 'CA',
      cityName: 'Los Angeles',
      zipCode: '90210',
      active: true
    },
    {
      id: 2,
      country: 'United Kingdom',
      mobilePrefixCode: '+44',
      stateName: 'England',
      stateCode: 'EN',
      cityName: 'London',
      zipCode: 'SW1A 1AA',
      active: true
    }
  ]);

  private lookupSubject = new BehaviorSubject<LookupData[]>([
    { id: 1, category: 'Allergy', value: 'Peanut Allergy', active: true },
    { id: 2, category: 'Allergy', value: 'Shellfish Allergy', active: true },
    { id: 3, category: 'ChronicCondition', value: 'Diabetes', active: true },
    { id: 4, category: 'SmokingStatus', value: 'Non-Smoker', active: true }
  ]);

  private medicationSubject = new BehaviorSubject<Medication[]>([
    { id: 1, name: 'Aspirin', active: true },
    { id: 2, name: 'Ibuprofen', active: true },
    { id: 3, name: 'Acetaminophen', active: true }
  ]);

  constructor(private http:HttpClient) { }
  getCountries(page: number = 1, pageSize: number = 100): Observable<any> {
    const params = new HttpParams()
      .set('page', page)
      .set('pageSize', pageSize);

    return this.http.get<any>(`${environment.apidev}/Dropdowns/GetAllCountriesData`, { params });
  }

  // createCountry(country: CountriesData): Observable<CountriesData> {
  //   const countries = this.countriesSubject.value;
  //   const newCountry = { ...country, id: this.getNextId(countries), active: true };
  //   this.countriesSubject.next([...countries, newCountry]);
  //   return of(newCountry);
  // }

     createCountry(country: CountriesData) {
       return this.http.post(`${environment.apidev}/Dropdowns/AddOrUpdateCountriesData`,country).pipe(
        map((response: any) => {
          return response?.data || response;
        }),
        catchError(error => {
          console.error('Error during sign in:', error);
          return throwError(() => error);
        })
      )
    }

 updateCountry(country: CountriesData): Observable<CountriesData> {
 const url = `${environment.apidev}/Dropdowns/AddOrUpdateCountriesData`;
  return this.http.post<Medication>(url, country).pipe(
    map((response: any) => response?.data || response),
    catchError((error) => {
      console.error('Error updating medication:', error);
      return throwError(() => error);
    })
  );
}


 deleteCountry(id: number): Observable<any> {
  const params = new HttpParams().set('id', id.toString());
  return this.http.delete<any>(`${environment.apidev}/Dropdowns/DeleteCountriesDataById`, { params });
}





getParentLookupData(): Observable<LookupData[]> {
 return this.http.get(`${environment.apidev}/Dropdowns/GetParentLookupData`).pipe(
        map((response: any) => {
          return response?.data || response;
        }),
        catchError(error => {
          console.error('Error during sign in:', error);
          return throwError(() => error);
        })
      )   
  
  }


  // Lookup Data Methods
 getLookupData(page: number = 1, pageSize: number = 100): Observable<LookupData[]> {
 const params = new HttpParams()
      .set('page', page)
      .set('pageSize', pageSize);
    return this.http.get<any>(`${environment.apidev}/Dropdowns/GetAllLookupData`, { params });  }

  createLookup(lookup: LookupData): Observable<LookupData> {
    return this.http.post(`${environment.apidev}/Dropdowns/AddLookupData`,lookup).pipe(
        map((response: any) => {
          return response?.data || response;
        }),
        catchError(error => {
          console.error('Error during sign in:', error);
          return throwError(() => error);
        })
      )
  }

  updateLookup(lookup: LookupData): Observable<LookupData> {
    const url = `${environment.apidev}/Dropdowns/UpdateLookupData`;
  return this.http.post<Medication>(url, lookup).pipe(
    map((response: any) => response?.data || response),
    catchError((error) => {
      console.error('Error updating medication:', error);
      return throwError(() => error);
    })
  );
  }

  deleteLookup(id: number): Observable<boolean> {
  const params = new HttpParams().set('id', id.toString());
  return this.http.delete<any>(`${environment.apidev}/Dropdowns/DeleteLookupData`, { params });
  }

  // Medication Methods
  getMedications(page: number = 1, pageSize: number = 100): Observable<Medication[]> {
     const params = new HttpParams()
      .set('page', page)
      .set('pageSize', pageSize);
    return this.http.get<any>(`${environment.apidev}/Dropdowns/GetAllMedications`, { params });
  }

  createMedication(medication: Medication): Observable<Medication> {
    return this.http.post(`${environment.apidev}/Dropdowns/AddOrUpdateMedication`,medication).pipe(
        map((response: any) => {
          return response?.data || response;
        }),
        catchError(error => {
          console.error('Error during sign in:', error);
          return throwError(() => error);
        })
      )
  }

 updateMedication(medication: Medication): Observable<Medication> {
  const url = `${environment.apidev}/Dropdowns/AddOrUpdateMedication`;
  return this.http.post<Medication>(url, medication).pipe(
    map((response: any) => response?.data || response),
    catchError((error) => {
      console.error('Error updating medication:', error);
      return throwError(() => error);
    })
  );
}


  deleteMedication(id: number): Observable<boolean> {
    const params = new HttpParams().set('id', id.toString());
  return this.http.delete<any>(`${environment.apidev}/Dropdowns/DeleteMedicationById`, { params });
  }

  private getNextId(items: any[]): number {
    return Math.max(...items.map(item => item.id || 0), 0) + 1;
  }
}