export interface Insurance {
  id: string;
  clientId: string;
  patientId: string;
  isPrimary: boolean;
  provider: string;
  policyNumber: string;
  groupNumber?: string;
  subscriberId: string;
  subscriberName: string;
  subscriberDateOfBirth: Date;
  relationshipToSubscriber: 'self' | 'spouse' | 'child' | 'other';
  effectiveDate: Date;
  expirationDate?: Date;
  copay?: number;
  deductible?: number;
  coinsurance?: number;
  outOfPocketMax?: number;
  planType: 'hmo' | 'ppo' | 'epo' | 'pos' | 'hdhp' | 'other';
  networkStatus: 'in-network' | 'out-of-network' | 'unknown';
  authorizationRequired: boolean;
  referralRequired: boolean;
  mentalHealthCoverage: boolean;
  notes?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface InsuranceVerification {
  id: string;
  insuranceId: string;
  verificationDate: Date;
  verifiedBy: string;
  eligibilityStatus: 'active' | 'inactive' | 'pending' | 'terminated';
  benefitsRemaining?: number;
  deductibleMet?: number;
  lastServiceDate?: Date;
  authorizationNumber?: string;
  notes?: string;
}

export interface InsuranceClaim {
  id: string;
  insuranceId: string;
  patientId: string;
  providerId: string;
  serviceDate: Date;
  submissionDate: Date;
  claimNumber?: string;
  totalAmount: number;
  allowedAmount?: number;
  paidAmount?: number;
  adjustmentAmount?: number;
  patientResponsibility?: number;
  status: 'submitted' | 'pending' | 'approved' | 'denied' | 'paid' | 'appealed' | 'resubmitted';
  denialReason?: string;
  denialCode?: string;
  eobDate?: Date;
  checkNumber?: string;
  remittanceDate?: Date;
  services: ClaimService[];
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ClaimService {
  id: string;
  cptCode: string;
  description: string;
  serviceDate: Date;
  units: number;
  chargedAmount: number;
  allowedAmount?: number;
  paidAmount?: number;
  adjustmentAmount?: number;
  denialCode?: string;
  modifiers?: string[];
  placeOfService: string;
  diagnosis: string[];
}

export interface Superbill {
  id: string;
  patientId: string;
  providerId: string;
  serviceDate: Date;
  createdDate: Date;
  status: 'draft' | 'finalized' | 'submitted' | 'paid';
  patientInfo: SuperbillPatientInfo;
  providerInfo: SuperbillProviderInfo;
  services: SuperbillService[];
  diagnosis: DiagnosisCode[];
  totalAmount: number;
  paymentMethod?: 'cash' | 'check' | 'card' | 'insurance';
  paymentAmount?: number;
  balanceAmount?: number;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface SuperbillPatientInfo {
  name: string;
  dateOfBirth: Date;
  address: string;
  phone: string;
  insuranceInfo?: {
    provider: string;
    policyNumber: string;
    groupNumber?: string;
    subscriberId: string;
  };
}

export interface SuperbillProviderInfo {
  name: string;
  npi: string;
  taxId: string;
  address: string;
  phone: string;
  licenseNumber: string;
}

export interface SuperbillService {
  id: string;
  cptCode: string;
  description: string;
  units: number;
  rate: number;
  amount: number;
  modifiers?: string[];
}

export interface DiagnosisCode {
  code: string;
  description: string;
  isPrimary: boolean;
}

export interface EligibilityCheck {
  id: string;
  mentalHealthCoverage:string;
  patientId: string;
  patient?: any | null; 
  insuranceId: string;
  insuranceCarrier?: any | null;
  insuranceCarrierId?: string;
  insurancePlanTypeName?: string | null;
  policyNumber: string;
  groupNumber: string;
  subscriberId?: string | null;
  subscriberName?: string | null;
  subscriberDateOfBirth?: string | null; 
  relationship: string;
  expiryDate?: string | null;
  
  coPay: number;
  coinsurance: number;
  checkDate: Date;
  status:  'completed';
  eligibilityStatus: 'active' | 'inactive' | 'terminated';
  effectiveDate?: Date;
  terminationDate?: Date;
  planType?: string;
  networkStatus?: 'in-network' | 'out-of-network' | 'unknown';
  copay?: number;
  deductible?: number;
  deductibleMet?: number;
  outOfPocketMax?: number;
  outOfPocketMet?: number;
  mentalHealthBenefits?: boolean;
  authorizationRequired?: boolean;
  visitLimit?: number;
  visitsUsed?: number;
  errorMessage?: string;
  createdAt: string;
  createdBy: string;
  updatedAt: string;
  updatedBy?: string | null;
}

export interface ERA {
  id: string;
  clientId: string;
  payerName: string;
  payerIdentifier: string;
  checkNumber: string;
  checkDate: Date;
  totalPaymentAmount: number;
  paymentMethod: string;
  traceNumber: string;
  claims: ERAClaim[];
  status: string;
  receivedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface ERAClaim {
  id: string;
  claimId: string;
  patientControlNumber: string;
  patientName: string;
  serviceDate: Date;
  totalChargeAmount: number;
  totalPaymentAmount: number;
  totalPatientResponsibility: number;
  claimStatus: string;
  services: ERAService[];
  adjustments: ERAAdjustment[];
  remarks: ERARemark[];
}

export interface ERAService {
  id: string;
  procedureCode: string;
  serviceDate: Date;
  units: number;
  chargedAmount: number;
  allowedAmount: number;
  paidAmount: number;
  deductibleAmount: number;
  coinsuranceAmount: number;
  copayAmount: number;
  modifiers?: string[];
  adjustments: ERAAdjustment[];
  remarks: ERARemark[];
}

export interface ERAAdjustment {
  id: string;
  adjustmentCode: string;
  adjustmentReason: string;
  adjustmentAmount: number;
  adjustmentType: string;
}

export interface ERARemark {
  code: string;
  description: string;
}

export interface ERAProcessingResult {
  success: boolean;
  eraId: string;
  claimsProcessed: number;
  claimsMatched: number;
  claimsUnmatched: number;
  totalPaymentAmount: number;
  errors: string[];
  warnings: string[];
}

// EOB (Explanation of Benefits) related types
export interface EOB {
  id: string;
  clientId: string;
  patientId: string;
  claimId: string;
  eraId: string;
  payerName: string;
  payerAddress: string;
  subscriberName: string;
  subscriberId: string;
  patientName: string;
  providerName: string;
  providerNPI: string;
  claimNumber: string;
  serviceDate: Date;
  receivedDate: Date;
  processedDate: Date;
  totalCharges: number;
  totalAllowed: number;
  totalPaid: number;
  totalPatientResponsibility: number;
  deductibleAmount: number;
  coinsuranceAmount: number;
  copayAmount: number;
  services: EOBService[];
  remarks: string[];
  appealRights: string;
  status: string;
  isElectronic: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface EOBService {
  id: string;
  procedureCode: string;
  description: string;
  serviceDate: Date;
  units: number;
  chargedAmount: number;
  allowedAmount: number;
  paidAmount: number;
  deductibleAmount: number;
  coinsuranceAmount: number;
  copayAmount: number;
  modifiers?: string[];
  denialCode?: string;
  denialReason?: string;
  remarks: string[];
}

// Search interfaces
export interface EOBSearch {
  patientId?: string;
  claimId?: string;
  payerName?: string;
  dateFrom?: Date;
  dateTo?: Date;
  status?: string;
  isElectronic?: boolean;
}

// CPT Code interface for billing
export interface CPTCode {
  code: string;
  description: string;
  rate?: number;
  category?: string;
  duration?: number;
  isActive?: boolean;
}

// ERA Search interface
export interface ERASearch {
  payerName?: string;
  checkNumber?: string;
  dateFrom?: Date;
  dateTo?: Date;
  status?: string;
  paymentMethod?: string;
}

// ICD10 Code interface
export interface ICD10Code {
  code: string;
  description: string;
  category?: string;
  isActive?: boolean;
}

// Insurance Provider interface
export interface InsuranceProvider {
  id: string;
  name: string;
  address: string;
  phone: string;
  email?: string;
  contactPerson?: string;
  payerCode?: string;
  website?: string;
  electronicSubmission?: boolean;
  isActive: boolean;
}

export interface ClaimStats {
  totalClaims: number;
  submittedClaims: number;
  paidClaims: number;
  approvedClaims: number;
  deniedClaims: number;
  pendingClaims: number;
  totalAmount: number;
  paidAmount: number;
  totalPaid: number;
  totalBilled: number;
  deniedAmount: number;
  pendingAmount: number;
  averageProcessingTime: number;
  denialRate: number;
}

export interface PrimaryInsurancePayload {
  id: string;        // UUID for the insurance
  patientId: string; // UUID for the patient
  isPrimary: boolean;
}
