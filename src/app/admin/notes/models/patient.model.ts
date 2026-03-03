export interface Patient {
  id: string;
  firstName: string;
  lastName: string;
  fullName: string;
  dateOfBirth?: string;
  gender?: string;
  email?: string;
  phoneNumber?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  clientId: string;
  clientName?: string;
  active: boolean;
  createdAt: string;
  soapNotesCount?: number;
  dapNotesCount?: number;
}

export interface PaginatedPatients {
  data: Patient[];
  pageNumber: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
}
