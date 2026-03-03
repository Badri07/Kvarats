export enum NoteType {
  SOAP = 'soap',
  DAP = 'dap',
  PROGRESS = 'progress',
  INTAKE = 'intake',
  ASSESSMENT = 'assessment',
  TREATMENT_PLAN = 'treatment_plan',
  DISCHARGE = 'discharge',
  CRISIS = 'crisis'
}

export enum NoteStatus {
  DRAFT = 'draft',
  COMPLETED = 'completed',
  SIGNED = 'signed',
  LOCKED = 'locked'
}



export interface NoteContent {
  subjective?: string;
  objective?: string;
  assessment?: string;
  plan?: string;
  data?: string;
  activity?: string;
  goals?: Goal[];
  interventions?: Intervention[];
  homework?: string[];
  nextSession?: string;
  riskAssessment?: RiskAssessment;
  customFields?: { [key: string]: any };
}

export interface Goal {
  id: string;
  description: string;
  targetDate?: Date;
  status: 'not_started' | 'in_progress' | 'completed' | 'discontinued';
  progress: number; // 0-100
  notes?: string;
}

export interface Intervention {
  id: string;
  type: string;
  description: string;
  duration?: number;
  effectiveness: 'low' | 'medium' | 'high';
  notes?: string;
}

export interface RiskAssessment {
  suicidalIdeation: 'none' | 'passive' | 'active' | 'plan' | 'intent';
  homicidalIdeation: 'none' | 'passive' | 'active' | 'plan' | 'intent';
  selfHarm: 'none' | 'thoughts' | 'recent' | 'current';
  substanceUse: 'none' | 'mild' | 'moderate' | 'severe';
  overallRisk: 'low' | 'medium' | 'high' | 'imminent';
  safetyPlan?: string;
  emergencyContacts?: string[];
}

export interface NoteTemplate {
  id: string;
  name: string;
  type: NoteType;
  description: string;
  content: Partial<NoteContent>;
  fields: TemplateField[];
  isDefault: boolean;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface TemplateField {
  id: string;
  name: string;
  label: string;
  type: 'text' | 'textarea' | 'select' | 'multiselect' | 'checkbox' | 'date' | 'number';
  required: boolean;
  options?: string[];
  defaultValue?: any;
  placeholder?: string;
  validation?: FieldValidation;
}

export interface FieldValidation {
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  min?: number;
  max?: number;
}

export interface NoteAudit {
  id: string;
  noteId: string;
  action: 'created' | 'updated' | 'signed' | 'locked' | 'viewed' | 'printed' | 'exported';
  performedBy: string;
  performedAt: Date;
  changes?: NoteChange[];
  ipAddress?: string;
  userAgent?: string;
}

export interface NoteChange {
  field: string;
  oldValue: any;
  newValue: any;
}

export interface NoteSearch {
  query?: string;
  clientId?: string;
  therapistId?: string;
  type?: NoteType;
  status?: NoteStatus;
  dateFrom?: Date;
  dateTo?: Date;
  tags?: string[];
  hasRiskAssessment?: boolean;
}

export interface NoteStats {
  totalNotes: number;
  notesByType: { [key in NoteType]: number };
  notesByStatus: { [key in NoteStatus]: number };
  averageCompletionTime: number;
  mostUsedTemplates: TemplateUsage[];
}

export interface TemplateUsage {
  templateId: string;
  templateName: string;
  usageCount: number;
  percentage: number;
}

// Add this to your note.model.ts
export interface Note {
  id: string;
  clientId: string; // Required for data isolation
  therapistId: string;
  appointmentId?: string;
  type: NoteType;
  status: NoteStatus;
  title: string;
  content: NoteContent;
  tags: string[];
  isConfidential: boolean;
  
  updatedAt: Date;
  signedAt?: Date;
  signedBy?: string;
  lockedAt?: Date;
  version: number;
  previousVersionId?: string;
  patientId: string;
  patientName: string;
  therapistName: string;
  
  isLatest: boolean;
  isDraft: boolean;
  subjective: string;
  objective: string;
  assessment: string;
  plan: string;
  sessionDate: string;
  sessionDurationMinutes: number;
  sessionType: string | null;
  createdAt: Date;
}
