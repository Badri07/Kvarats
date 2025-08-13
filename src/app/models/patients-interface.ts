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
  patientId: string;
  id: string;
  policyHolderName: string;
  relationship: string;
  policyHolderDob: string; 
  memberId: string;
  groupNumber: string;
  insuranceCarrierId: number;
  coPay: number;
  insuranceCarrierName: string;
  effectiveDate: string; 
  expiryDate: string;    
}
