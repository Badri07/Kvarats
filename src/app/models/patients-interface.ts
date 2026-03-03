export interface InvoicePatients {
  invoiceNumber: string;
  appointmentDate: string; 
  totalAmount: number;
  amountPaid: number;
  remainingBalance: number;
  invoiceStatus: 'Pending' | 'Paid' | 'Cancelled' | string;
  transactionType: 'SelfPay' | 'Insurance' | string;
  transactionStatus: 'Pending' | 'Completed' | 'Failed' | string;
  dueDate: string;
  notes: string;
}


export interface Payment {
  patientId: string;
  invoiceNumber: string;
  amount: number;
  paymentMethod: string;
  paymentReference: string;
  paymentDate: string; 
  notes: string;
  cardLastFour?: string | null;  
  billingZip?: string;    
  email?: string;
}

export interface PatientInsurance {
  PatientId?: string;
  Id?: string;
  PolicyHolderName?: string;
  Relationship?: string;
  PolicyHolderDob?: Date | null;
  MemberId?: string;
  GroupNumber?: string;
  InsuranceCarrierId?: number;
  CoPay?: number;
  InsuranceCarrierName?: string;
  EffectiveDate?: Date | null;
  ExpiryDate?: Date | null;    
}


export interface Patient {
  id?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  dateOfBirth?: Date;
  clientId?: string;
  therapistId?: string;
  quickBookSync?:boolean;
  status?: 'active' | 'inactive' | 'discharged';
  emergencyContact?: {
    name?: string;
    phone?: string;
    relationship?: string;
  };
  insuranceInfo?: {
    provider: string;
    policyNumber: string;
    groupNumber?: string;
  };
  createdAt?: Date;
  updatedAt?: Date;
}