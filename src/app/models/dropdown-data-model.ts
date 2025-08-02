export interface CountriesData {
  id?: number;
  country: string;
  mobilePrefixCode: string;
  stateName: string;
  stateCode: string;
  cityName: string;
  zipCode: string;
  createdAt?: Date;
  createdBy?: string;
  updatedAt?: Date;
  updatedBy?: string;
  active?: boolean;
}

export interface LookupData {
  id?: number;
  category: string;
  value: string;
  parentId?: number;
  active?: boolean;
  parentName?:string
}

export interface Medication {
  id?: number;
  name: string;
  createdAt?: Date;
  createdBy?: string;
  updatedAt?: Date;
  updatedBy?: string;
  active?: boolean;
  genericName?: string;
  drugClass?:string;
}

export type DropdownDataType = 'countries' | 'lookup' | 'medication';