export interface PatientPaymentRequest {
  id: string;
  patientId: string;
  patientName: string;
  invoiceDate: string;
  totalAmount: number;
  discountAmount: number;
  finalAmount: number;
  amountPaid: number;
  amountDue: number;
  status: 'pending' | 'paid' | 'partially_paid' | 'cancelled';
  notes?: string;
  createdAt: string;
  createdByName: string;
  slidingScaleId?: string;
  slidingScalePercentage?: number;
  services: PatientPaymentRequestService[];
  diagnoses: PatientPaymentRequestDiagnosis[];
  transactions: PatientPaymentTransaction[];
}


export interface PatientPaymentRequestService {
  id: string;
  paymentRequestId: string;
  appointmentId?: string;
  appointmentServiceId?: string;
  serviceId: string;
  serviceName: string;
  serviceCode?: string;
  cptCode?: string;
  modifier?: string;
  description?: string;
  serviceDate: string;
  chargedAmount: number;
  units: number;
  meetingTypeId: number;
  meetingTypeName?: string;
}


export interface PatientPaymentRequestDiagnosis {
  id: string;
  paymentRequestId: string;
  appointmentId?: string;
  appointmentDiagnosisId?: string;
  patientDiagnosisId: string;
  patientDiagnosis?: PatientDiagnosis;
  diagnosisCode: string;
  diagnosisDescription?: string;
  isPrimary: boolean;
  diagnosisDate: string;
  createdAt: string;
  createdBy: string;
}

export interface PatientPaymentTransaction {
  id: string;
  paymentRequestId: string;
  amountPaid: number;
  paymentMethod?: string;
  transactionReference?: string;
  notes?: string;
  paymentDate: string;
  isSuccessful: boolean;
  failureReason?: string;
  createdAt: string;
  createdByName: string;
  quickBooksSalesReceiptId?: string;
  quickBooksSynced?: boolean;
  receipts: PatientPaymentTransactionReceipt[];
}


export interface PatientPaymentTransactionReceipt {
  id: string;
  paymentTransactionId: string;
  receiptUrl: string;
  contentType?: string;
  uploadedAt: string;
  uploadedBy: string;
}

export interface Patient {
  id: string;
  patientName: string;
  email?: string;
  phoneNumber?: string;
}

export interface ClientService {
  id: string;
  name: string;
  code?: string;
  description?: string;
  price: number;
}

export interface PatientDiagnosis {
  id: string;
  diagnosisCode: string;
  diagnosisName?: string;
}

export interface LookupDataValue {
  id: number;
  value: string;
  displayText: string;
}

export interface CreatePaymentTransactionDto {
  paymentRequestId: string;
  amountPaid: number;
  paymentMethod: string;
  transactionReference?: string;
  notes?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  errors?: string[];
}
