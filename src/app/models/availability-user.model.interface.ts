export enum UserRole {
  SUPER_ADMIN = 'Super Admin',
  CLIENT_ADMIN = 'Admin',
  THERAPIST = 'Therapist',
  PATIENT = 'Patient'
}

export interface User {
  id: string;
  email: string;
  firstName: string;
  userName?:string;
  lastName: string;
  role: UserRole;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  profileImage?: string;
  phone?: string;
  dateOfBirth?: Date;
  address?: Address;
  emergencyContact?: EmergencyContact;
  preferences?: UserPreferences;
  userId?:string;
  // Multi-tenant fields
  clientId?: string; // For CLIENT_ADMIN, THERAPIST, PATIENT roles
  superAdminId?: string; // For tracking which super admin created this user
}

export interface Client {
  id: string;
  name: string;
  type: 'solo_provider' | 'organization';
  email: string;
  phone: string;
  address: Address;
  subscription: ClientSubscription;
  settings: ClientSettings;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string; // SuperAdmin ID
}

export interface ClientSubscription {
  plan: 'starter' | 'professional' | 'enterprise';
  status: 'active' | 'suspended' | 'cancelled';
  startDate: Date;
  endDate?: Date;
  maxTherapists: number;
  maxPatients: number;
  features: string[];
}

export interface ClientSettings {
  enabledModules: ModuleAccess[];
  branding?: ClientBranding;
  timezone: string;
  language: string;
  notifications: NotificationSettings;
}

export interface ModuleAccess {
  module: 'appointments' | 'patients' | 'notes' | 'billing' | 'insurance' | 'reports';
  enabled: boolean;
  permissions: string[];
}

export interface ClientBranding {
  logo?: string;
  primaryColor: string;
  secondaryColor: string;
  companyName: string;
}

export interface NotificationSettings {
  email: boolean;
  sms: boolean;
  push: boolean;
  appointmentReminders: boolean;
  billingAlerts: boolean;
}

export interface Address {
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

export interface EmergencyContact {
  name: string;
  relationship: string;
  phone: string;
  email?: string;
}

export interface UserPreferences {
  notifications: {
    email: boolean;
    sms: boolean;
    push: boolean;
  };
  timezone: string;
  language: string;
  theme: 'light' | 'dark' | 'auto';
}

export interface TherapistProfile extends User {
  role: UserRole.THERAPIST;
  clientId: string; // Required for therapists
  licenseNumber: string;
  specializations: string[];
  yearsOfExperience: number;
  education: Education[];
  certifications: Certification[];
  bio: string;
  hourlyRate: number;
  availableHours: AvailableHours;
}

export interface PatientProfile extends User {
  role: UserRole.PATIENT;
  clientId: string; // Required - links patient to specific client
  therapistId?: string;
  insuranceInfo?: InsuranceInfo;
  referralSource?: string;
  medicalHistory?: MedicalHistory;
}

export interface ClientAdminProfile extends User {
  role: UserRole.CLIENT_ADMIN;
  clientId: string; // Required for client admins
  permissions: AdminPermission[];
}

export interface SuperAdminProfile extends User {
  role: UserRole.SUPER_ADMIN;
  permissions: SuperAdminPermission[];
}

export interface AdminPermission {
  module: string;
  actions: string[]; // ['create', 'read', 'update', 'delete']
}

export interface SuperAdminPermission {
  scope: 'global' | 'client_management' | 'billing' | 'system';
  actions: string[];
}

export interface Education {
  degree: string;
  institution: string;
  year: number;
  field: string;
}

export interface Certification {
  name: string;
  issuingOrganization: string;
  issueDate: Date;
  expirationDate?: Date;
  credentialId?: string;
}

export interface AvailableHours {
  monday: TimeSlot[];
  tuesday: TimeSlot[];
  wednesday: TimeSlot[];
  thursday: TimeSlot[];
  friday: TimeSlot[];
  saturday: TimeSlot[];
  sunday: TimeSlot[];
}

export interface TimeSlot {
  start: string; // HH:mm format
  end: string;   // HH:mm format
}

export interface InsuranceInfo {
  provider: string;
  policyNumber: string;
  groupNumber?: string;
  subscriberId: string;
  subscriberName: string;
  relationshipToSubscriber: string;
  effectiveDate: Date;
  expirationDate?: Date;
}

export interface MedicalHistory {
  currentMedications: Medication[];
  allergies: string[];
  previousTherapy: boolean;
  previousTherapyDetails?: string;
  mentalHealthHistory: string[];
  medicalConditions: string[];
  substanceUse?: SubstanceUse;
}

export interface Medication {
  name: string;
  dosage: string;
  frequency: string;
  prescribedBy: string;
  startDate: Date;
  endDate?: Date;
}

export interface SubstanceUse {
  alcohol: 'none' | 'occasional' | 'moderate' | 'heavy';
  tobacco: 'none' | 'former' | 'current';
  drugs: 'none' | 'former' | 'current';
  details?: string;
}

// Type aliases for backward compatibility
export type Therapist = TherapistProfile;
export type Patient = PatientProfile;
export type ClientAdmin = ClientAdminProfile;
export type SuperAdmin = SuperAdminProfile;




export enum AppointmentType {
  INITIAL_CONSULTATION = 'initial_consultation',
  THERAPY_SESSION = 'therapy_session',
  FOLLOW_UP = 'follow_up',
  GROUP_SESSION = 'group_session',
  ASSESSMENT = 'assessment',
  TELEHEALTH = 'telehealth',
  EMERGENCY = 'emergency'
}