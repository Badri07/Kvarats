import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  SearchRequest,
  SearchResponse,
  ApiResponse,
  City,
  CountryDto,
  StateDto,
  CityDto,
  ZipCodeDto,
  DiagnosisDto,
  CreatePatientRequest,
  AssignTherapistsDto,
  CreatePatientResponse
} from '../../models/search.model';
import { environment } from '../../../environments/environments';

@Injectable({
  providedIn: 'root'
})
export class PatientsRegistrationService {
  private baseUrl = `${environment.apidev}`;

  constructor(private http: HttpClient) {}

  getCityList(id?: number, cityName?: string): Observable<ApiResponse<City[]>> {
    let params = new HttpParams();
    if (id) {
      params = params.set('id', id.toString());
    }
    if (cityName) {
      params = params.set('cityName', cityName);
    }
    return this.http.get<ApiResponse<City[]>>(`${this.baseUrl}/Patients/GetCityList`, { params });
  }

  searchTherapists(searchRequest: SearchRequest): Observable<ApiResponse<SearchResponse>> {
    return this.http.post<ApiResponse<SearchResponse>>(
      `${this.baseUrl}/Patients/GetTherapistList`,
      searchRequest
    );
  }

  getCountries(): Observable<ApiResponse<CountryDto[]>> {
    return this.http.get<ApiResponse<CountryDto[]>>(`${this.baseUrl}/CountriesData/GetCountries`);
  }

  getStates(country: string): Observable<ApiResponse<StateDto[]>> {
    const params = new HttpParams().set('country', country);
    return this.http.get<ApiResponse<StateDto[]>>(`${this.baseUrl}/CountriesData/GetStates`, { params });
  }

  getCities(country: string, stateCode: string): Observable<ApiResponse<CityDto[]>> {
    const params = new HttpParams()
      .set('country', country)
      .set('stateCode', stateCode);
    return this.http.get<ApiResponse<CityDto[]>>(`${this.baseUrl}/CountriesData/GetCities`, { params });
  }

  getZipCodes(country: string, stateCode: string, city: string): Observable<ApiResponse<ZipCodeDto[]>> {
    const params = new HttpParams()
      .set('country', country)
      .set('stateCode', stateCode)
      .set('city', city);
    return this.http.get<ApiResponse<ZipCodeDto[]>>(`${this.baseUrl}/CountriesData/GetZipCodes`, { params });
  }

  getDiagnoses(): Observable<ApiResponse<DiagnosisDto[]>> {
    return this.http.get<ApiResponse<DiagnosisDto[]>>(`${this.baseUrl}/Dropdowns/diagnosis`);
  }

  createPatient(request: CreatePatientRequest): Observable<ApiResponse<CreatePatientResponse>> {
    return this.http.post<ApiResponse<CreatePatientResponse>>(`${this.baseUrl}/Patients`, request);
  }

  assignTherapists(dto: AssignTherapistsDto): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/AssignTherapistsToPatient`, dto);
  }
}
