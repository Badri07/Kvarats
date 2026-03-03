export interface PatientPaymentRequestDto {
  id: string;
  patientId: string;
  invoiceDate: Date;
  totalAmount: number;
  discountAmount: number;
  finalAmount: number;
  status: string;
  notes: string;
  services: PatientPaymentRequestServiceDto[];
  transactions: PatientPaymentTransactionDto[];
  balance: number;
}

export interface PatientPaymentRequestServiceDto {
  id: string;
  serviceId: string;
  cptCode?: string;
  description?: string;
  serviceDate: Date;
  chargedAmount: number;
  units: number;
  meetingTypeInput: number;
}

export interface PatientPaymentTransactionDto {
  id: string;
  amountPaid: number;
  paymentMethod?: string;
  transactionReference?: string;
  notes?: string;
  paymentDate: Date;
  isSuccessful: boolean;
}

export interface PaymentSubmissionDto {
  paymentRequestId: string;
  amountPaid: number;
  paymentMethod: string;
  transactionReference?: string;
  paymentScreenshot?: File;
  notes?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data?: T;
}