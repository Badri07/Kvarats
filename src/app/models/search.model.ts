export interface SearchRequest {
  Query?: string;
  Location?: string;
  CountryDataId?: number;
  Specialization?: string;
  Department?: string;
  Qualifications?: string;
  IsSoloProvider?: boolean;
  Page: number;
  PageSize: number;
}

export interface AvailabilityDto {
  id: number;
  userId: string;
  userName: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  isAvailable: boolean;
  isApproved: boolean;
  approvedBy: string | null;
  approvedAt: string | null;
  createdAt: string;
  active: boolean;
}

export interface SearchResult {
  organizationId: string;
  therapistId: string;
  therapistName: string;
  therapistPhoneNo: string;
  organization: string;
  organizationPhoneNumber: string;
  organizationAddress: string;
  isSoloProvider: boolean;
  specialization: string | null;
  qualifications: string | null;
  department: string | null;
  location: string;
  rating: number | null;
  reviewCount: number | null;
  consultationFee: number | null;
  availability: AvailabilityDto[];
}

export interface SearchResponse {
  results: SearchResult[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  errors?: any;
}

export interface City {
  Id: number;
  CityName: string;
  Country: string;
  StateName: string;
  ZipCode: string;
}

export interface CreatePatientRequest {
  ClientId: string;
  FirstName: string;
  LastName?: string;
  Email: string;
  CountryDataId: number;
  PhoneNumber?: string;
  DateOfBirth?: string;
  Gender?: string;
  SocialSecurityNumber?: string;
  Address: string;
  BillingAddress?: string;
  BillingCountryId?: number;
  EmailNotification: boolean;
  TextNotification: boolean;
  IsBillingAddressSameAsAddress: boolean;
  Diagnoses?: CreatePatientDiagnosis[];
}

export interface CreatePatientDiagnosis {
  DiagnosisId: string;
  DateDiagnosed?: string;
}

export interface CountryDto {
  Id: number;
  country: string;
  MobilePrefixCode: string;
  CountryName:string;
}

export interface StateDto {
  Id: number;
  StateName: string;
  stateCode: string;
  stateName:string;
}

export interface CityDto {
  Id: number;
  cityName: string;
}

export interface ZipCodeDto {
  id: number;
  zipCode: string;
}

export interface DiagnosisDto {
  id: string;
  code: string;
  description: string;
}

export interface AssignTherapistsDto {
  PatientId: string;
  TherapistIds: string[];
}

export interface CreatePatientResponse {
  PatientId: string;
}
