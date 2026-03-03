export interface DropdownCategory {
  id: string;
  name: string;
  description: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface DropdownItem {
  id: string;
  categoryId: string;
  value: string;
  label: string;
  description?: string;
  category?:string;
  price?: number;
  isActive: boolean;
  isSynced?: boolean;
  sortOrder: number;
  metadata?: { [key: string]: any };
  createdAt: Date;
  updatedAt: Date;
}


export interface DropdownSearch {
  query?: string;
  categoryId?: string;
  isActive?: boolean;
}

// Predefined categories for the application
export enum DropdownCategoryType {
  APPOINTMENT_TYPES = 'appointment_types',
  APPOINTMENT_STATUS = 'appointment_status',
  NOTE_TYPES = 'note_types',
  NOTE_STATUS = 'note_status',
  PATIENT_STATUS = 'patient_status',
  INSURANCE_PROVIDERS = 'insurance_providers',
  INSURANCE_PLAN_TYPES = 'insurance_plan_types',
  NETWORK_STATUS = 'network_status',
  PAYMENT_METHODS = 'payment_methods',
  INVOICE_STATUS = 'invoice_status',
  CLAIM_STATUS = 'claim_status',
  SUPERBILL_STATUS = 'superbill_status',
  RELATIONSHIP_TYPES = 'relationship_types',
  SPECIALIZATIONS = 'specializations',
  EDUCATION_DEGREES = 'education_degrees',
  CERTIFICATION_TYPES = 'certification_types',
  MEDICATION_FREQUENCIES = 'medication_frequencies',
  SUBSTANCE_USE_LEVELS = 'substance_use_levels',
  RISK_LEVELS = 'risk_levels',
  CPT_CODES = 'cpt_codes',
  ICD10_CODES = 'icd10_codes',
  MODIFIERS = 'modifiers',
  PLACE_OF_SERVICE = 'place_of_service'
}

export interface DropdownStats {
  totalCategories: number;
  totalItems: number;
  activeItems: number;
  inactiveItems: number;
  categoriesWithItems: number;
  emptyCategories: number;
}

export interface CreateDropdownItemRequest {
  categoryId?: string;
  value?: string;
  label: string;
  description?: string;
  isActive: boolean;
  sortOrder: number;
  metadata?: { [key: string]: any };
}

export interface UpdateDropdownItemRequest extends CreateDropdownItemRequest {
  id?: string;
}