export interface UserAdminModel {
  username: string;
  email: string;
  roleId: number;
  firstName: string;
  lastName: string;
  contactNumber: string;
  address: string;
  department: string;
  specialization: string;
  qualifications: string;
  experience: string;
  createdBy: string;
}


export interface DropdownModel{
  id:number,
  value:string
}



export interface Client {
  firstName: string;
  middleName?: string;
  lastName: string;
  phoneNumber: string;
  email: string;
  street: string;
  city: string;
  state: string;
  postalCode: string;
  ssn: string;
  copay: number;
  clientNotes: string;
  dob: string;
  gender: string;
  pronoun: string;
  emailNotification: boolean;
  textNotification: boolean;
  createdBy: string;
  insurances: Insurance[];
  creditCardTransactions: CreditCardTransaction[];
}

export interface Insurance {
  insuranceCarrierName: string;
  policyHolderName: string;
  relationship: string;
  policyHolderDOB: string;
  memberId: string;
  groupNumber: string;
}

export interface CreditCardTransaction {
  transactionType: string;
  accountNumber: string;
}


export interface Billing{

  minIncome: string,
  maxIncome: string,
  discountPercentage: string

}
export interface UploadedFile {
  assessmentId: string;
  version: number;
  uploadedAt: string;
  uploadedFileName: string;
}