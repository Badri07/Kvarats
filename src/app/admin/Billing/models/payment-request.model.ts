export interface PatientPaymentRequestDto {
  id: string;
  patientId: string;
  patientName?: string;
  invoiceDate: Date;
  totalAmount: number;
  discountAmount: number;
  finalAmount: number;
  status: string;
  notes?: string;
  services: PaymentRequestServiceDto[];
  diagnoses: PaymentRequestDiagnosisDto[];
  transactions: PatientPaymentTransactionDto[];
  createdAt: Date;
  updatedAt?: Date;
}

export interface PaymentRequestServiceDto {
  id: string;
  paymentRequestId: string;
  appointmentId?: string;
  appointmentServiceId?: string;
  serviceId: string;
  cptCode: string;
  modifier?: string;
  description: string;
  serviceDate: Date;
  chargedAmount: number;
  units: number;
  meetingTypeId?: string;
  meetingTypeName?: string;
}

export interface PaymentRequestDiagnosisDto {
  id: string;
  paymentRequestId: string;
  appointmentId?: string;
  patientDiagnosisId: string;
  diagnosisCode: string;
  diagnosisDescription?: string;
  isPrimary: boolean;
  diagnosisDate: Date;
}

export interface PatientPaymentTransactionDto {
  id: string;
  paymentRequestId: string;
  amountPaid: number;
  paymentMethod: string;
  transactionReference?: string;
  notes?: string;
  paymentDate: Date;
  isSuccessful: boolean;
  createdAt: Date;
}

export interface CreatePatientPaymentRequestRequest {
  patientId: string;
  invoiceDate: Date;
   slidingScaleId?: string | null;
  discountAmount: number;
  notes?: string;
  services: CreatePaymentServiceRequest[];
  appointmentIds: string[];
}

export interface CreatePaymentServiceRequest {
  serviceId: string;
  appointmentId?: string;
  appointmentServiceId?: string;
  cptCode?: string;
  modifier?: string;
  description?: string;
  serviceDate: Date | string;
  chargedAmount: number;
  units: number;
  meetingTypeId: number;
}

export interface UpdatePatientPaymentRequestRequest {
  invoiceDate: Date;
  discountAmount: number;
  status: string;
  notes?: string;
  services: CreatePaymentServiceRequest[];
}

export interface CreatePaymentTransactionRequest {
  paymentRequestId: string;
  amountPaid: number;
  paymentMethod: string;
  transactionReference?: string;
  notes?: string;
  paymentDate: Date;
}

export interface PaymentRequestSummaryDto {
  patientId: string;
  patientName: string;
  totalRequests: number;
  totalAmount: number;
  totalPaid: number;
  totalOutstanding: number;
  pendingRequests: number;
  paidRequests: number;
  lastPaymentDate?: Date;
}

export interface ApiResponse<T> {
  data: T;
  message: string;
  success: boolean;
  statusCode: number;
}
