import { Component, Input, OnChanges, SimpleChanges, OnInit, DoCheck, Inject, ChangeDetectorRef, OnDestroy } from '@angular/core';
import { NgForm } from '@angular/forms';
import { AdminService } from '../../service/admin/admin.service';
import { ActivatedRoute } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { PopupService } from '../../service/popup/popup-service';
import { Subject, debounceTime, distinctUntilChanged, takeUntil } from 'rxjs';

type DropdownType = 'allergy' | 'medication' | 'medicationfrequency' | 'condition' | 'complaint' | 'smokingstatus' | 
                   'alcoholstatus' | 'beveragestatus' | 'drugusagestatus' | 'bloodgroup' | 
                   'severity' | 'alcoholfrequency' | 'surgerytype' | 'allergycategory' |'medicalcondition';
type SortDirection = 'asc' | 'desc';
type DropdownOption = { id: number; value: string; parentid: number; };
interface ComplaintOption {
  id: number;
  name: string;
  description: string;
}

@Component({
  selector: 'app-patients',
  templateUrl: './patients.component.html',
  styleUrls: ['./patients.component.scss'],
  standalone: false
})
export class PatientsComponent implements OnInit, OnChanges, DoCheck, OnDestroy {
  originalAssessmentData: any = null;
  isDirty: boolean = false;
  modifiedFields: Set<string> = new Set();
  private destroy$ = new Subject<void>();
  public saveInProgress = false;
  private autoSaveEnabled = true;
  private lastSaveTime = 0;
  private readonly SAVE_DEBOUNCE_TIME = 2000; // 2 seconds
  private readonly MIN_SAVE_INTERVAL = 5000; // 5 seconds minimum between saves

  constructor(
    private adminservice: AdminService,
    private activate: ActivatedRoute,
    private _toastr: ToastrService,
    private _loader: PopupService,
    private cdr: ChangeDetectorRef
  ) { }

  @Input() assessmentData: any;

  // Patient and UI state
  assId!: string;
  patId!: string;
  isshowvital: boolean = true;
  isshowSymptoms: boolean = true;
  isshowMedical: boolean = true;
  isshowSocial: boolean = true;
  painScaleErrors: { [key: number]: boolean } = {};

  // File upload
  fileUrl: string[] = [];
  isUpload: boolean = false;

  //load
  saveStatus: 'saved' | 'saving' | 'unsaved' = 'unsaved';
  isSaving = false;
  isLoading = false;

  // Dropdown options
  allergyOptions: DropdownOption[] = [];
  medicationOptions: DropdownOption[] = [];
  medicationfreqencyOptions:DropdownOption[]=[];
  chronicConditionOptions: DropdownOption[] = [];
  smokingOptions: DropdownOption[] = [];
  alcoholOptions: DropdownOption[] = [];
  beverageOptions: DropdownOption[] = [];
  drugUsageOptions: DropdownOption[] = [];
  bloodGroupOptions: DropdownOption[] = [];
  severityOptions: DropdownOption[] = [];
  alcoholfrequencyOptions: DropdownOption[] = [];
  surgeryTypeOptions: DropdownOption[] = [];
  allergyCategoryOptions: DropdownOption[] = [];
  medicalConditionOptions:DropdownOption[] = [];
  allergyOptionsByCategory: { [categoryId: number]: any[] } = {};
  // chiefComplaintOptions: string[] = [
  //   'Fever', 'Cough', 'Headache', 'Cold', 'Body Pain',
  //   'Fatigue', 'Vomiting', 'Stomach Ache', 'Dizziness', 'Chest Pain'
  // ];
  chiefComplaintOptions: ComplaintOption[] = [];
  complaintTemplates: { [key: string]: string } = {};

  // Selected items for display
  selectedMedicationNames: string[] = [];
  selectedAllergyNames: string[] = [];
  selectedConditionNames: string[] = [];
  selectedAllergyCategoryId: number | null = null;
  filteredAllergyOptions: DropdownOption[] = [];
  // Patient data structure
  patientData = {
    patientId: '',
    assessmentId: '',
    isDraft: false,
    isFileUpload: this.isUpload,
    fileUrl: this.fileUrl,
    
    // Vital signs
    systolic: null as number | null,
    diastolic: null as number | null,
    heartRate: null as number | null,
    pulse: null as number | null,
    respiratoryRate: null as number | null,
    temperature: null as number | null,
    bloodSugar: null as number | null,
    spO2: null as number | null,
    weight: null as number | null,
    height: null as number | null,
    bmi: '',
    bloodGroupId: null as number | null,

    // Symptoms
     chiefComplaints: [] as {
    id?: number;               // Add this to match API
    complaintId: number;       // From API
    complaint: string;         // From API (instead of complaintName)
    painScale: number | null;
    notes: string;
    onsetDate: string | null;
  }[],

    // Allergies
    allergySeverities: [] as {
      allergyId: number;  // Required
      severityId: number | null;
      allergyCategoryId: number | null;
      reactionDetails: string;
      firstObserved: string | null;
      lastObserved: string | null;
      allergyName?: string;
      severityName?: string;
      allergyCategoryName?: string;
    }[],

    // Medications
    medications: [] as {
      medicationId: number;
      dosage: string;
      frequency: string;
      startDate: string | null;
      endDate: string | null;
      reason: string;
    }[],

    // Conditions
    chronicConditions: [] as {
      conditionId: number;
      diagnosisDate: string | null;
      treatmentDetails: string;
      isControlled: boolean | null;
    }[],

    // Surgical history
    surgicalHistory: [] as {
      procedure: string;
      date: string | null;
      hospital: string;
      surgeonName: string;
      surgeryTypeId: number | null;
      hadComplications: boolean | null;
      complicationDetails: string;
    }[],

    // Family history
    familyHistoryConditions: [] as {
      conditionId: number;
      relationship: string;
      ageAtDiagnosis: number | null;
      isDeceased: boolean | null;
      causeOfDeath: string;
    }[],

    // Social habits
    socialHabits: [] as {
      smokingStatusId?: number | null;
      cigarettesPerDay?: number | null;
      yearsSmoking?: number | null;
      hasQuitSmoking?: boolean | null;
      smokingQuitDate?: string | null;
      alcoholStatusId?: number | null;
      alcoholFrequencyId?: number | null;
      yearsDrinking?: number | null;
      beverageStatusId?: number | null;
      cupsPerDay?: number | null;
      drugUsageStatusId?: number | null;
      drugDetails?: string | null;
    }[]
  };

  // Form models for complex additions
  newAllergy = {
    allergyId: null as number | null,  // Can be null when empty
    severityId: null as number | null,
    allergyCategoryId: null as number | null,
    reactionDetails: '',
    firstObserved: null as string | null,
    lastObserved: null as string | null
  };

  

  newMedication = {
    medicationId: null as number | null,
    dosage: '',
    frequency: '',
    startDate: null as string | null,
    endDate: null as string | null,
    reason: ''
  };

  newCondition = {
    conditionId: null as number | null,
    diagnosisDate: null as string | null,
    treatmentDetails: '',
    isControlled: null as boolean | null
  };

  newFamilyHistory = {
  conditionId: null as number | null,  // Changed to match DTO and use ID
  relationship: '',
  ageAtDiagnosis: null as number | null,
  isDeceased: null as boolean | null,  // Changed to allow null
  causeOfDeath: ''
};

  newSurgery = {
    procedure: '',
    date: null as string | null,
    hospital: '',
    surgeonName: '',
    surgeryTypeId: null as number | null,
    hadComplications: false,
    complicationDetails: ''
  };

  // UI state for dropdowns
  showBpWarning = false;
  isDiastolicEnabled = false;

  filteredOptions = {
    allergy: [] as DropdownOption[],
    medication: [] as DropdownOption[],
    medicationfrequency:[] as DropdownOption[],
    condition: [] as DropdownOption[],
    complaint: [] as ComplaintOption[],
    smokingstatus: [] as DropdownOption[],
    alcoholstatus: [] as DropdownOption[],
    beveragestatus: [] as DropdownOption[],
    drugusagestatus: [] as DropdownOption[],
    bloodgroup: [] as DropdownOption[],
    severity: [] as DropdownOption[],
    alcoholfrequency: [] as DropdownOption[],
    surgerytype: [] as DropdownOption[],
    allergycategory: [] as DropdownOption[],
    medicalcondition:[] as DropdownOption[]
  };

  isDropdownOpen = {
    allergy: false,
    medication: false,
    medicationfrequency:false,
    condition: false,
    complaint: false,
    smokingstatus: false,
    alcoholstatus: false,
    beveragestatus: false,
    drugusagestatus: false,
    bloodgroup: false,
    severity: false,
    alcoholfrequency: false,
    surgerytype: false,
    allergycategory: false,
    medicalcondition:false
  };

  searchInputs = {
    allergy: '',
    medication: '',
    medicationfrequency:'',
    condition: '',
    complaint: '',
    smokingstatus: '',
    alcoholstatus: '',
    beveragestatus: '',
    drugusagestatus: '',
    bloodgroup: '',
    severity: '',
    alcoholfrequency: '',
    surgerytype: '',
    allergycategory: '',
    medicalcondition:''
  };

  showAddButtons = {
    allergy: false,
    medication: false,
    medicationfrequency:false,
    condition: false,
    complaint: false,
    smokingstatus: false,
    alcoholstatus: false,
    beveragestatus: false,
    drugusagestatus: false,
    bloodgroup: false,
    severity: false,
    alcoholfrequency: false,
    surgerytype: false,
    allergycategory: false,
    medicalcondition:false
  };

  // complaintTemplates: { [key: string]: string } = {
  //   'Fever': 'Patient reports elevated body temperature, chills, and weakness.',
  //   'Cough': 'Patient experiencing dry cough for the past few days.',
  //   'Headache': 'Patient has recurring headaches, mostly in the frontal region.',
  //   'Cold': 'Symptoms include runny nose, sneezing, and mild throat irritation.',
  //   'Body Pain': 'Patient complains of generalized muscle ache and fatigue.',
  //   'Fatigue': 'Persistent tiredness, possibly related to poor sleep or infection.',
  //   'Vomiting': 'Patient has had multiple episodes of vomiting, no blood seen.',
  //   'Stomach Ache': 'Abdominal discomfort, localized to lower quadrant.',
  //   'Dizziness': 'Feeling lightheaded or unstable, especially when standing.',
  //   'Chest Pain': 'Discomfort in chest area, further evaluation needed.'
  // };

  ngOnInit(): void {
  this._loader.show(); // Show loader immediately
  
  // 1. Initialize core data structures
  this.initializeSocialHabits();
  
  this.activate.params.pipe(
  takeUntil(this.destroy$)
).subscribe({
  next: async (params) => {  // Note the async keyword here
    try {
      this._loader.show();
      this.assId = params['id'];
      this.patId = params['patientId'];
      this.patientData.assessmentId = this.assId;
      this.patientData.patientId = this.patId;
      // First load the assessment data
      const data = await this.adminservice.getPatientAssessment(this.assId).toPromise();
      this.assessmentData = data;
      
      // Then load dropdowns after data is ready
      await this.loadDropdowns();
      
      // Finally prepopulate after dropdowns are loaded
      this.prepopulateData();
      this.setupAutoSave();
      this._loader.hide();
    } catch (err) {
      this._loader.hide();
      this._toastr.error('Failed to load patient data');
      console.error('Error loading patient data:', err);
    }
  },
  error: err => {
    this._loader.hide();
    this._toastr.error('Failed to load patient parameters');
  }
});

  // 6. File upload subscription
  this.adminservice.fileUrl$.pipe(
    takeUntil(this.destroy$)
  ).subscribe({
    next: url => {
      if (url) {
        this.fileUrl = [url];
        this.isUpload = true;
        this.patientData.fileUrl = [url];
        this.patientData.isFileUpload = true;
        this.markFieldChanged('fileUrl');
        this.cdr.detectChanges();
      }
    },
    error: err => {
      console.error('File URL subscription error:', err);
    }
  });

  this.loadChiefComplaints();
}

loadChiefComplaints(): void {
  this.adminservice.getChiefComplaintdata().subscribe({
    next: (complaints: ComplaintOption[]) => {
      this.chiefComplaintOptions = complaints;
      
      // Create mapping for templates
      this.complaintTemplates = complaints.reduce((acc, curr) => {
        acc[curr.id.toString()] = curr.description || '';
        return acc;
      }, {} as { [key: string]: string });

      console.log('Loaded complaints:', complaints);
    },
    error: (error) => {
      console.error('Failed to load chief complaints:', error);
      this._toastr.error('Could not load chief complaints');
    }
  });
}


private async loadInitialAssessmentData(): Promise<void> {
  try {
    const data = await this.adminservice.getPatientAssessment(this.assId).toPromise();
    
    if (!data) {
      throw new Error('No assessment data returned');
    }
    
    this.assessmentData = data;
    this.prepopulateData(); // This sets originalAssessmentData
    
    console.log('Initial assessment data loaded', {
      assessmentId: this.assId,
      data: this.assessmentData
    });
    
  } catch (error) {
    console.error('Failed to load initial data:', error);
    this._toastr.error('Could not load patient assessment');
    
    // Initialize empty state
    this.assessmentData = null;
    this.originalAssessmentData = null;
    this.resetForm();
  }
}

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private setupAutoSave(): void {
    debugger
    // Auto-save when form becomes dirty after user stops typing
    this.destroy$.pipe(
      debounceTime(this.SAVE_DEBOUNCE_TIME),
      distinctUntilChanged(),
      takeUntil(this.destroy$)
    ).subscribe(() => {
      if (this.isDirty && this.autoSaveEnabled && !this.saveInProgress) {
        const now = Date.now();
        if (now - this.lastSaveTime >= this.MIN_SAVE_INTERVAL) {
          this.autoSaveAssessment();
        }
      }
    });
  }

  private autoSaveAssessment(): void {
    debugger
  if (this.saveInProgress || !this.autoSaveEnabled) return;
  
  this.saveInProgress = true;
  this.lastSaveTime = Date.now();

  // Create copy with draft flag
  const draftData = {...this.patientData, isDraft: true};
  
  this._toastr.info('Auto-saving draft...', '', {
    timeOut: 1000,
    progressBar: false
  });

  this.adminservice.savePatientAssessment(draftData).subscribe({
    next: (res) => {
      this.saveInProgress = false;
      this.isDirty = false;
      this.cdr.detectChanges();
    },
    error: (err) => {
      this.saveInProgress = false;
      console.error('Auto-save failed:', err);
    }
  });
}

  public triggerAutoSave(): void {
    this.destroy$.next();
  }

  ngOnChanges(changes: SimpleChanges): void {
  if (!changes['assessmentData']) return;

  try {
    const previousData = changes['assessmentData'].previousValue;
    const currentData = changes['assessmentData'].currentValue;

    // Deep compare to avoid unnecessary processing
    if (JSON.stringify(previousData) === JSON.stringify(currentData)) {
      console.debug('Assessment data changed but content is identical');
      return;
    }

    if (!currentData) {
      console.warn('Received empty assessment data - resetting form');
      this.resetForm();
      return;
    }

    console.log('Assessment data changed - prepopulating', {
      previous: previousData ? 'exists' : 'null',
      current: currentData ? 'exists' : 'null'
    });

    // Process new data
    this.prepopulateData();
    
    // Reset tracking states
    this.isDirty = false;
    this.modifiedFields.clear();
    this.lastSaveTime = Date.now();

    // Force UI update if needed
    this.cdr.detectChanges();

  } catch (error) {
    console.error('Error processing assessment data change:', error);
    this._toastr.error('Failed to process patient data changes');
    this.resetForm();
  }
}

  private initializeSocialHabits(): void {
  if (!this.patientData.socialHabits || this.patientData.socialHabits.length === 0) {
    this.patientData.socialHabits = [{
      smokingStatusId: null,
      cigarettesPerDay: null,
      yearsSmoking: null,
      hasQuitSmoking: null,
      smokingQuitDate: null,
      alcoholStatusId: null,
      alcoholFrequencyId: null,
      yearsDrinking: null,
      beverageStatusId: null,
      cupsPerDay: null,
      drugUsageStatusId: null,
      drugDetails: null
    }];
  }
}

  private prepopulateData(): void {
        
  if (!this.assessmentData) {
    console.warn('Cannot prepopulate - no assessment data provided');
    return;
  }

  const apiData = this.assessmentData;

  // Map API response to component's expected structure
  this.patientData = {
    patientId:this.patientData.patientId,
    assessmentId: this.patientData.assessmentId,
    isDraft: apiData.isDraft || false,
    isFileUpload: apiData.isFileUpload || false,
    fileUrl: apiData.uploadedFilePath ? [apiData.uploadedFilePath] : [],
    
    // Vital signs
    systolic: apiData.vitals?.systolic || null,
    diastolic: apiData.vitals?.diastolic || null,
    heartRate: apiData.vitals?.heartRate || null,
    pulse: apiData.vitals?.pulse || null,
    respiratoryRate: apiData.vitals?.respiratoryRate || null,
    temperature: apiData.vitals?.temperature || null,
    bloodSugar: apiData.vitals?.bloodSugar || null,
    spO2: apiData.vitals?.spO2 || null,
    weight: apiData.vitals?.weight || null,
    height: apiData.vitals?.height || null,
    bmi: apiData.vitals?.bmi || '',
    bloodGroupId: apiData.vitals?.bloodGroupId || null,

    // Symptoms
    chiefComplaints: apiData.chiefComplaints?.map((c: any) => ({
      id: c.id,
      complaintId: c.complaintId,
      complaint: c.complaint,
      painScale: c.painScale || null,
      notes: c.notes || '',
      onsetDate: c.onsetDate ? this.formatDateForInput(c.onsetDate) : null
    })) || [],

    // Allergies (mapped from allergies to allergySeverities)
    allergySeverities: apiData.allergies?.map((a: any) => ({
      allergyId: a.allergyId || null,
      allergyCategoryId: a.allergyCategoryId || null,
      severityId: a.severityId || null,
      reactionDetails: a.reactionDetails || '',
      firstObserved: a.firstObserved || null,
      lastObserved: a.lastObserved || null,
      allergyName: a.allergy,
    severityName: a.severity,
    allergyCategoryName: a.allergyCategory
    })) || [],

    // Medications
    medications: apiData.medications?.map((m: any) => ({
      medicationId: m.medicationId || null,
      dosage: m.dosage || '',
      frequency: m.frequency || '',
      startDate: m.startDate || null,
      endDate: m.endDate || null,
      reason: m.reason || ''
    })) || [],

    // Conditions (mapped from chronicConditions)
    chronicConditions: apiData.chronicConditions?.map((c: any) => ({
      conditionId: c.conditionId || null,
      diagnosisDate: c.diagnosisDate || null,
      treatmentDetails: c.treatmentDetails || '',
      isControlled: c.isControlled || null
    })) || [],

    // Surgical history
    surgicalHistory: apiData.surgeries?.map((s: any) => ({
      procedure: s.procedure || '',
      date: s.date || null,
      hospital: s.hospital || '',
      surgeonName: s.surgeonName || '',
      surgeryTypeId: s.surgeryTypeId || null,
      hadComplications: s.hadComplications || false,
      complicationDetails: s.complicationDetails || ''
    })) || [],

    // Family history
    familyHistoryConditions: apiData.familyHistory?.map((f: any) => ({
      conditionId: f.conditionId || null,
      relationship: f.relationship || '',
      ageAtDiagnosis: f.ageAtDiagnosis || null,
      isDeceased: f.isDeceased || null,
      causeOfDeath: f.causeOfDeath || ''
    })) || [],

    // Social habits
    socialHabits: apiData.socialHabits?.map((s: any) => ({
      smokingStatusId: s.smokingStatusId || null,
      cigarettesPerDay: s.cigarettesPerDay || null,
      yearsSmoking: s.yearsSmoking || null,
      hasQuitSmoking: s.hasQuitSmoking || null,
      smokingQuitDate: s.smokingQuitDate || null,
      alcoholStatusId: s.alcoholStatusId || null,
      alcoholFrequencyId: s.alcoholFrequencyId || null,
      yearsDrinking: s.yearsDrinking || null,
      beverageStatusId: s.beverageStatusId || null,
      cupsPerDay: s.cupsPerDay || null,
      drugUsageStatusId: s.drugUsageStatusId || null,
      drugDetails: s.drugDetails || null
    })) || [{}]
  };

  // Initialize selected names arrays
  this.selectedAllergyNames = this.patientData.allergySeverities
    .map(item => this.getOptionLabel('allergy', item.allergyId));
  this.selectedMedicationNames = this.patientData.medications
    .map(item => this.getOptionLabel('medication', item.medicationId));
  this.selectedConditionNames = this.patientData.chronicConditions
    .map(item => this.getOptionLabel('condition', item.conditionId));

  // Set original baseline for dirty checking
  this.originalAssessmentData = JSON.parse(JSON.stringify(this.patientData));

  console.log("patientdata",this.originalAssessmentData);
}

  private formatDateForInput(dateString: string): string {
  try {
    // Handle both ISO format (2025-08-06T00:00:00) and already formatted dates
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      // If not a valid date, try parsing as is (might already be in YYYY-MM-DD format)
      return dateString.split('T')[0];
    }
    return date.toISOString().split('T')[0];
  } catch (e) {
    console.error('Error formatting date:', dateString, e);
    return '';
  }
}

  private loadDropdowns(): void {
    // First load all static dropdowns
    // Load dropdowns in parallel for better performance
     const dropdownRequests = [
      this.adminservice.getMedicationdata(), // 0 - medications
      this.adminservice.getDropdowndata('MedicationFrequency'), // 1 - medicationfrequency
      this.adminservice.getDropdowndata('ChronicCondition'), // 2 - conditions
      this.adminservice.getDropdowndata('SmokingStatus'), // 3 - smoking
      this.adminservice.getDropdowndata('AlcoholStatus'), // 4 - alcohol
      this.adminservice.getDropdowndata('BeverageStatus'), // 5 - beverage
      this.adminservice.getDropdowndata('DrugusageStatus'), // 6 - drug
      this.adminservice.getDropdowndata('BloodGroup'), // 7 - bloodGroup
      this.adminservice.getDropdowndata('AllergySeverity'), // 8 - severity
      this.adminservice.getDropdowndata('AlcoholFrequency'), // 9 - alcoholfrequency
      this.adminservice.getDropdowndata('SurgeryType'), // 10 - surgery
      this.adminservice.getDropdowndata('MedicalCondition'), // 11 - medical
      this.adminservice.getDropdowndata('AllergyCategory') // 12 - allergyCategory
    ];

    // Use forkJoin for parallel loading
    import('rxjs').then(({ forkJoin }) => {
      forkJoin(dropdownRequests).subscribe({
    next: (responses) => {
      // Assign responses by index to ensure correct mapping
      this.medicationOptions = responses[0] || [];
      this.medicationfreqencyOptions = responses[1] || [];
      this.chronicConditionOptions = responses[2] || [];
      this.smokingOptions = responses[3] || [];
      this.alcoholOptions = responses[4] || [];
      this.beverageOptions = responses[5] || [];
      this.drugUsageOptions = responses[6] || [];
      this.bloodGroupOptions = responses[7] || [];
      this.severityOptions = responses[8] || [];
      this.alcoholfrequencyOptions = responses[9] || [];
      this.surgeryTypeOptions = responses[10] || [];
      this.medicalConditionOptions = responses[11] || [];
      this.allergyCategoryOptions = responses[12] || [];
      
      this.cdr.detectChanges();
    },
        error: (err) => {
          console.error('Error loading dropdowns:', err);
          this._toastr.error('Failed to load form options');
        }
      });
    });
  }

  // Call this when a category is selected in the UI
  public onCategorySelected(categoryId: number): void {
    this.selectedAllergyCategoryId = categoryId;
    this.newAllergy.allergyCategoryId = categoryId; // Make sure this is set
    
    // Clear any existing allergy selection
    this.newAllergy.allergyId = null;
    this.searchInputs.allergy = '';
    
    // Load allergies for this category
    this.loadAllergiesByCategory(categoryId);
  }

  private loadAllergiesByCategory(categoryId: number): void {
  
  this.adminservice.getAllergyDataByCategory('Allergy', categoryId).subscribe({
    next: (allergies) => {
      // Store the allergies by category for caching
      this.allergyOptionsByCategory[categoryId] = allergies || [];
      
      // Set the current allergy options
      this.allergyOptions = this.allergyOptionsByCategory[categoryId];
      this.filteredAllergyOptions = this.allergyOptions;
      this.filteredOptions.allergy = [...this.allergyOptions];
      
      
    },
    error: (err) => {
      console.error('Error loading allergies:', err);
      this._toastr.error('Failed to load allergy options');
    }
  });
}

// Add this to your component to debug the current state
printCurrentAllergyState(): void {
  console.log('Current Allergy State:');
  console.log('Selected Category ID:', this.newAllergy.allergyCategoryId);
  console.log('Selected Allergy ID:', this.newAllergy.allergyId);
  console.log('Allergy Options:', this.allergyOptions);
  console.log('Filtered Options:', this.filteredOptions.allergy);
  console.log('Allergy Options by Category:', this.allergyOptionsByCategory);
}

onAllergyFocus(): void {
  if (!this.newAllergy.allergyCategoryId) {
    this._toastr.warning('Please select an allergy category first');
    this.isDropdownOpen.allergy = false;
    return;
  }
  
  // Ensure we have options for this category
  if (!this.allergyOptionsByCategory[this.newAllergy.allergyCategoryId]) {
    this.loadAllergiesByCategory(this.newAllergy.allergyCategoryId);
  } else {
    this.allergyOptions = this.allergyOptionsByCategory[this.newAllergy.allergyCategoryId];
    this.filteredOptions.allergy = this.filterAllergies(this.allergyOptions);
    this.isDropdownOpen.allergy = this.filteredOptions.allergy.length > 0;
  }
}

  private filterAllergies(allergies: any[]): any[] {
    // Your filtering logic here based on search input
    return allergies.filter(allergy => 
      allergy.value.toLowerCase().includes(this.searchInputs.allergy.toLowerCase()))
  }

  filterOptions(type: DropdownType, searchTerm: string): void {
  this.isDropdownOpen[type] = true;
  
  if (type === 'allergy') {
    let baseOptions = this.filteredAllergyOptions;
    
    if (searchTerm.trim() !== '') {
      baseOptions = baseOptions.filter(option =>
        option.value.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    this.filteredOptions[type] = baseOptions;
  } 
  else if (type === 'complaint') {
    const sourceOptions = this.getSourceOptions(type) as ComplaintOption[];
    
    if (searchTerm.trim() === '') {
      this.filteredOptions[type] = sourceOptions.slice(0, 100);
    } else {
      const filtered = sourceOptions.filter(opt => {
        const matchesName = opt.name.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesDesc = opt.description?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false;
        return matchesName || matchesDesc;
      });
      this.filteredOptions[type] = filtered.slice(0, 100);
    }

    this.showAddButtons[type] = !!searchTerm.trim() &&
      !this.filteredOptions[type].some(opt => 
        opt.name.toLowerCase() === searchTerm.toLowerCase()
      );
  }
  else {
    const sourceOptions = this.getSourceOptions(type);
    this.filteredOptions[type] = searchTerm.trim() === ''
      ? sourceOptions.slice(0, 100)
      : sourceOptions.filter((opt: DropdownOption) =>
          opt.value.toLowerCase().includes(searchTerm.toLowerCase())
        ).slice(0, 100);
    
    this.showAddButtons[type] = !!searchTerm.trim() &&
      !this.filteredOptions[type].some((opt: DropdownOption) =>
        opt.value.toLowerCase() === searchTerm.toLowerCase()
      );
  }
}

  private getSourceOptions(type: DropdownType): any[] {
    switch (type) {
      case 'complaint': return this.chiefComplaintOptions;
      case 'allergy': return this.allergyOptions;
      case 'medication': return this.medicationOptions;
      case 'medicationfrequency': return this.medicationfreqencyOptions;
      case 'condition': return this.chronicConditionOptions;
      case 'smokingstatus': return this.smokingOptions;
      case 'alcoholstatus': return this.alcoholOptions;
      case 'beveragestatus': return this.beverageOptions;
      case 'drugusagestatus': return this.drugUsageOptions;
      case 'bloodgroup': return this.bloodGroupOptions;
      case 'severity': return this.severityOptions;
      case 'alcoholfrequency': return this.alcoholfrequencyOptions;
      case 'surgerytype': return this.surgeryTypeOptions;
      case 'allergycategory': return this.allergyCategoryOptions;
      case 'medicalcondition':return this.medicalConditionOptions;
      default: return [];
    }
  }

  loadInitialOptions(type: DropdownType): void {
    this.filteredOptions[type] = this.getSourceOptions(type).slice(0, 100);
  }

  sortOptions(type: DropdownType, direction: SortDirection = 'asc'): void {
  if (type === 'complaint') {
    this.filteredOptions[type] = [...this.filteredOptions[type] as ComplaintOption[]].sort((a, b) =>
      direction === 'asc' 
        ? a.name.localeCompare(b.name) 
        : b.name.localeCompare(a.name)
    );
  } else {
    this.filteredOptions[type] = [...this.filteredOptions[type] as DropdownOption[]].sort((a, b) =>
      direction === 'asc' 
        ? a.value.localeCompare(b.value) 
        : b.value.localeCompare(a.value)
    );
  }
}

  selectOption(type: DropdownType, option: DropdownOption | ComplaintOption | string): void {
    if (type === 'complaint') {
  // First verify we have a ComplaintOption
  if (typeof option === 'string') {
    console.error('Expected complaint object but got string');
    return;
  }

  // Safe type assertion after verification
  const selectedComplaint = option as ComplaintOption;
  
  if (!this.patientData.chiefComplaints?.some(c => c.complaintId === selectedComplaint.id)) {
    this.patientData.chiefComplaints.push({ 
      complaintId: selectedComplaint.id,
      complaint: selectedComplaint.name,
      painScale: null,
      notes: selectedComplaint.description || '',
      onsetDate: null
    });
  }
} else if (['smokingstatus', 'alcoholstatus', 'beveragestatus', 'drugusagestatus'].includes(type)) {
      this.ensureSocialHabitExists();
      const dropdownOption = option as DropdownOption;
      
      switch (type) {
        case 'smokingstatus':
          this.patientData.socialHabits[0].smokingStatusId = dropdownOption.id;
          break;
        case 'alcoholstatus':
          this.patientData.socialHabits[0].alcoholStatusId = dropdownOption.id;
          break;
        case 'beveragestatus':
          this.patientData.socialHabits[0].beverageStatusId = dropdownOption.id;
          break;
        case 'drugusagestatus':
          this.patientData.socialHabits[0].drugUsageStatusId = dropdownOption.id;
          break;
      }
    } else if (type === 'bloodgroup') {
      this.patientData.bloodGroupId = (option as DropdownOption).id;
    }

    this.isDropdownOpen[type] = false;
    this.searchInputs[type] = '';
  }

  ensureSocialHabitExists(): void {
    if (this.patientData.socialHabits.length === 0) {
      this.initializeSocialHabits();
    }
  }

  addNewItem(type: DropdownType): void {
    const newItem = this.searchInputs[type].trim();
    if (!newItem) return;

    if (type === 'complaint') {
    // Generate a temporary negative ID for new items (will be replaced by server)
    const newId = -Math.floor(Math.random() * 10000);
    
    // Create the new complaint option
    const newComplaint: ComplaintOption = {
      id: newId,
      name: newItem,
      description: this.complaintTemplates[newId.toString()] || ''
    };

    // Add to dropdown options
    this.chiefComplaintOptions.unshift(newComplaint);
    
    // Add to patient data if not already present
    if (!this.patientData.chiefComplaints.some(c => c.complaint === newItem)) {
      this.patientData.chiefComplaints.push({
        complaintId: newId,
        complaint: newItem,
        painScale: null,
        notes: newComplaint.description,
        onsetDate: null
      });
    }

    // Update templates mapping
    if (!this.complaintTemplates[newId.toString()]) {
      this.complaintTemplates[newId.toString()] = '';
    }

    // Reset search input
    this.searchInputs[type] = '';
    this.showAddButtons[type] = false;
    
    // Trigger change detection and auto-save
    this.markFieldChanged('chiefComplaints');
    this.triggerAutoSave();
  } else {
      const optionsField = this.getOptionsField(type);
      const optionsArray = this[optionsField] as DropdownOption[];
      
      const newOption: DropdownOption = {
        id: this.generateNewId(),
        value: newItem,
        parentid: 0 // Add appropriate parentid if needed
      };
      
      optionsArray.unshift(newOption);
      
      // Handle type-specific logic
      if (type === 'allergy') {
        if (!this.newAllergy.allergyCategoryId) {
          this._toastr.warning('Please select an allergy category first');
          return;
        }

        newOption.parentid = this.newAllergy.allergyCategoryId;
        
        // Add to both main options and filtered options
        this.allergyOptions.unshift(newOption);
        this.filteredAllergyOptions.unshift(newOption);
        
        // Select the new allergy
        this.newAllergy.allergyId = newOption.id;
        this.searchInputs.allergy = newItem;
        
        this.markFieldChanged('allergySeverities');
      } 
      else if (type === 'medication') {
        this.medicationOptions.unshift(newOption);
        this.filteredOptions.medication.unshift(newOption);
        
        // Select the new medication
        this.newMedication.medicationId = newOption.id;
        this.searchInputs.medication = newItem;
        
        this.markFieldChanged('medications');
      } 
      else if (type === 'condition') {
        this.chronicConditionOptions.unshift(newOption);
        this.filteredOptions.condition.unshift(newOption);
        
        // Select the new condition
        this.newCondition.conditionId = newOption.id;
        this.searchInputs.condition = newItem;
        
        this.markFieldChanged('chronicConditions');
      }
      else if (type === 'surgerytype') {
        this.surgeryTypeOptions.unshift(newOption);
        this.filteredOptions.surgerytype.unshift(newOption);
        
        // Select the new surgery type
        this.newSurgery.surgeryTypeId = newOption.id;
        this.searchInputs.surgerytype = newItem;
        
        this.markFieldChanged('surgicalHistory');
      }
    }

    this.searchInputs[type] = '';
    this.showAddButtons[type] = false;
  }

    private generateNewId(): number {
    return Math.floor(Math.random() * 1000000) + 1;
  }

  private getOptionsField(type: DropdownType): keyof this {
  switch (type) {
    case 'allergy': return 'allergyOptions';
    case 'medication': return 'medicationOptions';
    case 'medicationfrequency': return 'medicationfreqencyOptions'; 
    case 'condition': return 'chronicConditionOptions';
    case 'smokingstatus': return 'smokingOptions';
    case 'alcoholstatus': return 'alcoholOptions';
    case 'beveragestatus': return 'beverageOptions';
    case 'drugusagestatus': return 'drugUsageOptions';
    case 'bloodgroup': return 'bloodGroupOptions';
    case 'severity': return 'severityOptions';
    case 'alcoholfrequency': return 'alcoholfrequencyOptions';
    case 'surgerytype': return 'surgeryTypeOptions';
    case 'allergycategory': return 'allergyCategoryOptions';
    default: throw new Error(`Invalid type: ${type}`);
  }
}

  selectComplaint(complaint: ComplaintOption): void {
  if (!this.patientData.chiefComplaints.some(c => c.complaintId === complaint.id)) {
    this.patientData.chiefComplaints.push({ 
      complaintId: complaint.id,
      complaint: complaint.name,
      painScale: null,
      notes: complaint.description || '',
      onsetDate: null
    });
  }
  this.isDropdownOpen['complaint'] = false;
  this.searchInputs['complaint'] = '';
}

  addAllergy(): void {
  if (this.newAllergy.allergyId !== null) {  // Explicit null check
    this.patientData.allergySeverities.push({
      allergyId: this.newAllergy.allergyId,  // We know it's not null here
      severityId: this.newAllergy.severityId,
      allergyCategoryId: this.newAllergy.allergyCategoryId,
      reactionDetails: this.newAllergy.reactionDetails,
      firstObserved: this.newAllergy.firstObserved,
      lastObserved: this.newAllergy.lastObserved
    });
    
    this.selectedAllergyNames.push(this.getOptionLabel('allergy', this.newAllergy.allergyId));
    
    this.newAllergy = {
      allergyId: null,
      severityId: null,
      allergyCategoryId: null,
      reactionDetails: '',
      firstObserved: null,
      lastObserved: null
    };
    
    this.markFieldChanged('allergySeverities');
    this.triggerAutoSave();
  }
}

  addMedication(): void {
  if (this.newMedication.medicationId !== null) {
    this.patientData.medications.push({
      medicationId: this.newMedication.medicationId,
      dosage: this.newMedication.dosage,
      frequency: this.newMedication.frequency,
      startDate: this.newMedication.startDate,
      endDate: this.newMedication.endDate,
      reason: this.newMedication.reason
    });
    
    this.selectedMedicationNames.push(this.getOptionLabel('medication', this.newMedication.medicationId));
    
    this.newMedication = {
      medicationId: null,
      dosage: '',
      frequency: '',
      startDate: null,
      endDate: null,
      reason: ''
    };
    
    this.markFieldChanged('medications');
    this.triggerAutoSave();
  }
}

  addCondition(): void {
  if (this.newCondition.conditionId !== null) {
    this.patientData.chronicConditions.push({
      conditionId: this.newCondition.conditionId,
      diagnosisDate: this.newCondition.diagnosisDate,
      treatmentDetails: this.newCondition.treatmentDetails,
      isControlled: this.newCondition.isControlled
    });
    
    this.selectedConditionNames.push(this.getOptionLabel('condition', this.newCondition.conditionId));
    
    // Reset form
    this.newCondition = {
      conditionId: null,
      diagnosisDate: null,
      treatmentDetails: '',
      isControlled: null
    };
    
    this.searchInputs.condition = '';
    this.markFieldChanged('chronicConditions');
    this.triggerAutoSave();
  }
}

  addFamilyHistory(): void {
  if (this.newFamilyHistory.conditionId !== null) {  // Check for null instead of empty string
    this.patientData.familyHistoryConditions.push({
      conditionId: this.newFamilyHistory.conditionId,
      relationship: this.newFamilyHistory.relationship,
      ageAtDiagnosis: this.newFamilyHistory.ageAtDiagnosis,
      isDeceased: this.newFamilyHistory.isDeceased,
      causeOfDeath: this.newFamilyHistory.causeOfDeath
    });
    
    // Reset form
    this.newFamilyHistory = {
      conditionId: null,
      relationship: '',
      ageAtDiagnosis: null,
      isDeceased: null,
      causeOfDeath: ''
    };
    
    this.searchInputs.medicalcondition = '';
    this.markFieldChanged('familyHistoryConditions');
    this.triggerAutoSave();
  }
}

  addSurgery(): void {
    if (this.newSurgery.procedure.trim()) {
      this.patientData.surgicalHistory.push({...this.newSurgery});
      this.newSurgery = {
        procedure: '',
        date: null,
        hospital: '',
        surgeonName: '',
        surgeryTypeId: null,
        hadComplications: false,
        complicationDetails: ''
      };
      
      this.markFieldChanged('surgicalHistory');
      this.triggerAutoSave();
    }
  }

  removeItem(type: 'allergySeverities' | 'medications' | 'chronicConditions' | 'chiefComplaints' | 'surgicalHistory' | 'familyHistoryConditions', index: number): void {
    this.patientData[type].splice(index, 1);
    if (type === 'medications') this.selectedMedicationNames.splice(index, 1);
    if (type === 'allergySeverities') this.selectedAllergyNames.splice(index, 1);
    if (type === 'chronicConditions') this.selectedConditionNames.splice(index, 1);
    
    this.markFieldChanged(type);
    this.triggerAutoSave();
  }

  onBpInputChange(): void {
    const systolic = this.patientData.systolic;
    const diastolic = this.patientData.diastolic;
    this.isDiastolicEnabled = !!systolic;
    this.showBpWarning = !!diastolic && !!systolic && diastolic > systolic;
    if (this.showBpWarning) this.patientData.diastolic = null;
    
    this.markFieldChanged('vitals');
    this.triggerAutoSave();
  }

  getBpClass(field: 'systolic' | 'diastolic'): string {
    const value = this.patientData[field];
    if (!value) return 'border-secondary';
    if (field === 'systolic') return value < 90 || value > 140 ? 'border-danger' : value >= 120 ? 'border-warning' : 'border-success';
    if (field === 'diastolic') return value < 60 || value > 90 ? 'border-danger' : value >= 80 ? 'border-warning' : 'border-success';
    return 'border-secondary';
  }

  getVitalClass(field: keyof typeof this.patientData): string {
    const value = +(this.patientData[field] || 0);
    if (!value) return 'border-secondary';
    switch (field) {
      case 'pulse':
      case 'heartRate': return value < 60 || value > 100 ? 'border-danger' : value >= 90 ? 'border-warning' : 'border-success';
      case 'bloodSugar': return value < 70 || value > 140 ? 'border-danger' : value >= 110 ? 'border-warning' : 'border-success';
      case 'bmi': 
        const bmiValue = parseFloat(this.patientData.bmi || '0');
        return bmiValue < 18.5 || bmiValue > 30 ? 'border-danger' : bmiValue >= 25 ? 'border-warning' : 'border-success';
      default: return 'border-secondary';
    }
  }

  calculateBMI(): void {
    const weight = this.patientData.weight;
    const height = this.patientData.height;
    this.patientData.bmi = weight && height ? (weight / ((height / 100) ** 2)).toFixed(1) : '';
    
    this.markFieldChanged('vitals');
    this.triggerAutoSave();
  }

  getTooltip(field: string): string {
    switch (field) {
      case 'bloodPressure': return 'Normal BP is Systolic 90–120 mmHg and Diastolic 60–80 mmHg.';
      case 'pulse': return 'Normal pulse rate is 60–100 bpm.';
      case 'heartRate': return 'Ideal heart rate is 60–100 bpm at rest.';
      case 'bloodSugar': return 'Normal fasting sugar: 70–100 mg/dL.';
      case 'bmi': return 'BMI should be between 18.5 and 24.9.';
      case 'weight': return 'Weight in kilograms (kg).';
      case 'height': return 'Height in centimeters (cm).';
      default: return '';
    }
  }

  getOptionLabel(
  type: 'allergy' | 'medication' | 'condition' | 'severity' | 'surgerytype' | 'allergycategory' | 'medicalcondition' | 'bloodgroup',
  id: number | null | undefined
  ): string {
  // Handle null/undefined cases
  if (id == null) {
    return 'Not specified';
  }

  // Get the correct options array based on type
  const options: DropdownOption[] =
    type === 'allergy' ? this.allergyOptions :
    type === 'medication' ? this.medicationOptions :
    type === 'condition' ? this.chronicConditionOptions :
    type === 'severity' ? this.severityOptions :
    type === 'allergycategory' ? this.allergyCategoryOptions :
    type === 'surgerytype' ? this.surgeryTypeOptions:
    type === 'bloodgroup' ? this.bloodGroupOptions :
    this.medicalConditionOptions;

  // Find and return the matching value
  const foundOption = options.find(opt => opt.id === id);
  return foundOption?.value || 'Unknown';
}

  isComplaintSelected(complaintOption: ComplaintOption): boolean {
    return this.patientData.chiefComplaints?.some(c => c.complaintId === complaintOption.id) ?? false;
}

  openDropdown() {
  this.isDropdownOpen.bloodgroup = true;
  this.filterOptions('bloodgroup', this.searchInputs.bloodgroup);
  
  // Optional: Scroll into view if needed
  setTimeout(() => {
    const dropdown = document.querySelector('.bloodgroup-dropdown');
    dropdown?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }, 0);
}

  closeDropdown(type: DropdownType): void {
    setTimeout(() => this.isDropdownOpen[type] = false, 200);
  }

  selectMedication(option: any) {
  if (this.isMedicationSelected(option)) {
    // Deselect if clicking the same item
    this.newMedication.medicationId = null;
    this.searchInputs.medication = '';
  } else {
    // Select new medication
    this.newMedication.medicationId = option.id;
    this.searchInputs.medication = option.value;
  }
  this.closeDropdown('medication');
}

isMedicationSelected(option: any): boolean {
  return this.newMedication.medicationId === option.id;
}

selectFrequency(option: any, type: 'medication' | 'alcohol'): void {
  if (type === 'medication') {
    if (this.newMedication.frequency === option.value) {
      this.newMedication.frequency = '';
      this.searchInputs.medicationfrequency = '';
    } else {
      this.newMedication.frequency = option.value;
      this.searchInputs.medicationfrequency = option.value;
    }
    this.closeDropdown('medicationfrequency');
  } else if (type === 'alcohol') {
    // Changed from this.alcoholForm to this.patientData.socialHabits[0]
    if (this.patientData.socialHabits[0]?.alcoholFrequencyId === option.id) {
      this.patientData.socialHabits[0].alcoholFrequencyId = null;
      this.searchInputs.alcoholfrequency = '';
    } else {
      this.patientData.socialHabits[0].alcoholFrequencyId = option.id;
      this.searchInputs.alcoholfrequency = option.value;
    }
    this.closeDropdown('alcoholfrequency');
  }
}

isFrequencySelected(option: any, type: 'medication' | 'alcohol'): boolean {
  if (type === 'medication') {
    return this.newMedication.frequency === option.value;
  } else {
    // Check against socialHabits alcohol frequency
    return this.patientData.socialHabits[0]?.alcoholFrequencyId === option.id;
  }
}


selectCondition(option: DropdownOption): void {
  if (this.isConditionSelected(option)) {
    // Deselect if clicking the same item
    this.newCondition.conditionId = null;
    this.searchInputs.condition = '';
  } else {
    // Select new condition
    this.newCondition.conditionId = option.id;
    this.searchInputs.condition = option.value;
  }
  this.closeDropdown('condition');
}

isConditionSelected(option: DropdownOption): boolean {
  return this.newCondition.conditionId === option.id;
}

selectMedicalCondition(option: DropdownOption): void {
  this.newFamilyHistory.conditionId = option.id;
  this.searchInputs.medicalcondition = option.value;
  this.isDropdownOpen.medicalcondition = false;
}

isMedicalConditionSelected(option: DropdownOption): boolean {
  return this.newFamilyHistory.conditionId === option.id;
}

  saveAssessment(isDraft: boolean = false): void {
  if (this.saveInProgress) {
    this._toastr.warning('Save already in progress, please wait...');
    return;
  }

  // Validate patientId exists
  if (!this.patientData.patientId) {
    this._toastr.error('Patient ID is required');
    return;
  }

  // Prepare the data to be sent based on save type
  const dataToSend = {
    ...this.patientData,
    isDraft: isDraft,
    // For final submissions, exclude assessmentId
    assessmentId: isDraft ? this.patientData.assessmentId : undefined
  };

  // Clean up empty social habits if needed
  if (dataToSend.socialHabits.length > 0) {
    const hasValues = Object.values(dataToSend.socialHabits[0]).some(
      val => val !== null && val !== undefined && val !== ''
    );
    if (!hasValues) {
      dataToSend.socialHabits = [];
    }
  }

  if (this.showBpWarning) {
    this._toastr.warning('Diastolic pressure cannot be greater than systolic');
    return;
  }

  this.saveInProgress = true;
  this._loader.show();
  
  this.adminservice.savePatientAssessment(dataToSend).subscribe({
    next: (res) => {
      this.saveInProgress = false;
      this._loader.hide();
      
      if (isDraft) {
        this._toastr.success('Draft saved successfully');
        // Update assessmentId if this was a new draft and server returned one
        if (res.assessmentId && !this.patientData.assessmentId) {
          this.patientData.assessmentId = res.assessmentId;
          this.assId = res.assessmentId;
        }
      } else {
        this._toastr.success('Assessment submitted successfully');
        this.originalAssessmentData = JSON.parse(JSON.stringify(this.patientData));
        this.isDirty = false;
        this.modifiedFields.clear();
        
        // For final submission, clear the assessmentId from local data
        this.patientData.assessmentId = '';
        this.assId = '';
      }
      this.cdr.detectChanges();
    },
    error: (err) => {
      this.saveInProgress = false;
      this._loader.hide();
      this._toastr.error(`Error saving ${isDraft ? 'draft' : 'assessment'}`);
    }
  });
}

    selectSurgeryType(option: any): void {
    this.newSurgery.surgeryTypeId = option.id;
    this.searchInputs.surgerytype = option.value;
    this.isDropdownOpen.surgerytype = false;
  }


  isSurgeryTypeSelected(option: any): boolean {
    return this.newSurgery.surgeryTypeId === option.id;
  }


  resetForm(form?: NgForm): void {
  if (!this.originalAssessmentData) {
    console.warn('Cannot reset form - no original assessment data available');
    return;
  }

  try {
    // 1. Reset modified fields from tracked changes
    this.modifiedFields.forEach(field => {
      if (field in this.originalAssessmentData) {
        (this.patientData as any)[field] = this.deepCopy(this.originalAssessmentData[field]);
      } else {
        console.warn(`Field ${field} not found in original data`);
      }
    });

    // 2. Reset UI selections
    this.selectedAllergyNames = this.patientData.allergySeverities
      .map(item => this.getOptionLabel('allergy', item.allergyId))
      .filter(Boolean); // Remove any undefined/null values

    this.selectedMedicationNames = this.patientData.medications
      .map(item => this.getOptionLabel('medication', item.medicationId))
      .filter(Boolean);

    this.selectedConditionNames = this.patientData.chronicConditions
      .map(item => this.getOptionLabel('condition', item.conditionId))
      .filter(Boolean);

    // 3. Reset form controls if NgForm provided
    if (form) {
      setTimeout(() => {
        form.resetForm({
          ...this.patientData,
          // Special cases for reactive form controls
          bloodGroupId: this.patientData.bloodGroupId,
          socialHabits: this.patientData.socialHabits[0] || {}
        });
      }, 0);
    }

    // 4. Reinitialize dynamic sections
    this.initializeSocialHabits();
    this.filteredAllergyOptions = [...this.allergyOptions];
    
    // 5. Reset state flags
    this.isDirty = false;
    this.modifiedFields.clear();
    this.painScaleErrors = {};

    console.log('Form reset successfully', {
      originalData: this.originalAssessmentData,
      currentData: this.patientData
    });

  } catch (error) {
    console.error('Error resetting form:', error);
    this._toastr.error('Failed to reset form data');
    
    // Fallback: Hard reset
    if (this.originalAssessmentData) {
      this.patientData = this.deepCopy(this.originalAssessmentData);
      this.cdr.detectChanges();
    }
  }
}

private deepCopy<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}

  markFieldChanged(field: string): void {
    this.modifiedFields.add(field);
  }

  validatePainScale(event: Event, index: number) {
  const input = event.target as HTMLInputElement;
  let value = parseInt(input.value, 10);
  
  // Handle empty/NaN case
  if (isNaN(value)) {
    this.painScaleErrors[index] = false;
    return;
  }

  // Enforce range
  if (value < 0) {
    value = 0;
    input.value = '0';
  } else if (value > 10) {
    value = 10;
    input.value = '10';
  }

  // Update the model
  this.patientData.chiefComplaints[index].painScale = value;
  this.painScaleErrors[index] = false;
  this.markFieldChanged('chiefComplaints');
  this.triggerAutoSave();
}

preventInvalidInput(event: KeyboardEvent) {
  // Allow: backspace, delete, tab, escape, enter, numbers, and decimal point
  if ([46, 8, 9, 27, 13, 110].includes(event.keyCode) ||
      // Allow: Ctrl+A, Ctrl+C, Ctrl+V, Ctrl+X
      (event.keyCode === 65 && event.ctrlKey === true) ||
      (event.keyCode === 67 && event.ctrlKey === true) ||
      (event.keyCode === 86 && event.ctrlKey === true) ||
      (event.keyCode === 88 && event.ctrlKey === true) ||
      // Allow: home, end, left, right
      (event.keyCode >= 35 && event.keyCode <= 39)) {
    return;
  }
  
  // Prevent if not a number
  if (event.shiftKey || (event.keyCode < 48 || event.keyCode > 57)) {
    event.preventDefault();
  }
}

  selectAllergyCategory(option: DropdownOption): void {
  // Check if clicking the already selected category
  if (this.newAllergy.allergyCategoryId === option.id) {
    // Deselect the category
    this.newAllergy.allergyCategoryId = null;
    this.searchInputs.allergycategory = '';
    
    // Clear allergy selection and options
    this.newAllergy.allergyId = null;
    this.searchInputs.allergy = '';
    this.allergyOptions = [];
    this.filteredOptions.allergy = [];
  } else {
    // Select new category
    this.newAllergy.allergyCategoryId = option.id;
    this.searchInputs.allergycategory = option.value;
    
    // Clear any existing allergy selection
    this.newAllergy.allergyId = null;
    this.searchInputs.allergy = '';
    
    // Load allergies for this category
    this.loadAllergiesByCategory(option.id);
  }
  
  this.isDropdownOpen.allergycategory = false;
}

clearAllergyCategory(): void {
  this.newAllergy.allergyCategoryId = null;
  this.searchInputs.allergycategory = '';
  
  // Clear allergy selection and options
  this.newAllergy.allergyId = null;
  this.searchInputs.allergy = '';
  this.allergyOptions = [];
  this.filteredOptions.allergy = [];
  
  // Close dropdowns
  this.isDropdownOpen.allergycategory = false;
  this.isDropdownOpen.allergy = false;
}

private filterAllergiesByCategory(categoryId: number): void {
  if (!this.allergyOptions || this.allergyOptions.length === 0) {
    console.warn('No allergy options available');
    this.filteredAllergyOptions = [];
    return;
  }

  this.filteredAllergyOptions = this.allergyOptions.filter(
    allergy => allergy.parentid === categoryId
  );

  // Update the display options but DON'T open the dropdown here
  this.filteredOptions.allergy = [...this.filteredAllergyOptions];
}

isAllergyCategorySelected(option: any): boolean {
  return this.newAllergy.allergyCategoryId === option.id;
}



selectAllergy(option: DropdownOption): void {
  if (this.isAllergySelected(option)) {
    // Deselect if already selected
    this.newAllergy.allergyId = null;
    this.searchInputs.allergy = '';
  } else {
    // Select new allergy
    this.newAllergy.allergyId = option.id;
    this.searchInputs.allergy = option.value;
  }
  this.closeDropdown('allergy');
}

isAllergySelected(option: DropdownOption): boolean {
  return this.newAllergy.allergyId === option.id;
}

selectSeverity(option: DropdownOption): void {
  if (this.isSeveritySelected(option)) {
    // Deselect if already selected
    this.newAllergy.severityId = null;
    this.searchInputs.severity = '';
  } else {
    // Select new severity
    this.newAllergy.severityId = option.id;
    this.searchInputs.severity = option.value;
  }
  this.closeDropdown('severity');
}

isSeveritySelected(option: DropdownOption): boolean {
  return this.newAllergy.severityId === option.id;
}

// Helper methods to check status
isNeverSmoker(): boolean {
  const socialHabit = this.patientData.socialHabits[0];
  if (!socialHabit?.smokingStatusId) return false;
  
  const smokingOption = this.smokingOptions.find(opt => opt.id === socialHabit.smokingStatusId);
  return smokingOption?.value === 'Never Smoked';
}

isNeverDrinker(): boolean {
  const socialHabit = this.patientData.socialHabits[0];
  if (!socialHabit?.alcoholStatusId) return false;
  
  const alcoholOption = this.alcoholOptions.find(opt => opt.id === socialHabit.alcoholStatusId);
  return alcoholOption?.value === 'Never';
}

isNonBeverageConsumer(): boolean {
  const socialHabit = this.patientData.socialHabits[0];
  if (!socialHabit?.beverageStatusId) return false;
  
  const beverageOption = this.beverageOptions.find(opt => opt.id === socialHabit.beverageStatusId);
  return beverageOption?.value === 'Does not consume';
}

isNeverDrugUser(): boolean {
  const socialHabit = this.patientData.socialHabits[0];
  if (!socialHabit?.drugUsageStatusId) return false;
  
  const drugOption = this.drugUsageOptions.find(opt => opt.id === socialHabit.drugUsageStatusId);
  return drugOption?.value === 'Never used';
}

// Change handlers
onSmokingStatusChange(): void {
  if (this.isNeverSmoker()) {
    // Clear smoking-related fields
    const socialHabit = this.patientData.socialHabits[0];
    if (socialHabit) {
      socialHabit.cigarettesPerDay = null;
      socialHabit.yearsSmoking = null;
      socialHabit.hasQuitSmoking = null;
      socialHabit.smokingQuitDate = null;
    }
  }
  this.markFieldChanged('socialHabits');
  this.triggerAutoSave();
}

onAlcoholStatusChange(): void {
  if (this.isNeverDrinker()) {
    // Clear alcohol-related fields
    const socialHabit = this.patientData.socialHabits[0];
    if (socialHabit) {
      socialHabit.alcoholFrequencyId = null;
      socialHabit.yearsDrinking = null;
    }
  }
  this.markFieldChanged('socialHabits');
  this.triggerAutoSave();
}

onBeverageStatusChange(): void {
  if (this.isNonBeverageConsumer()) {
    // Clear beverage-related fields
    const socialHabit = this.patientData.socialHabits[0];
    if (socialHabit) {
      socialHabit.cupsPerDay = null;
    }
  }
  this.markFieldChanged('socialHabits');
  this.triggerAutoSave();
}

onDrugUsageStatusChange(): void {
  if (this.isNeverDrugUser()) {
    // Clear drug-related fields
    const socialHabit = this.patientData.socialHabits[0];
    if (socialHabit) {
      socialHabit.drugDetails = null;
    }
  }
  this.markFieldChanged('socialHabits');
  this.triggerAutoSave();
}



  ngDoCheck(): void {
  console.log('--- ngDoCheck triggered ---');
  
  // Ensure social habits are always properly initialized
  if (!this.assessmentData?.socialHabits || this.assessmentData.socialHabits.length === 0) {
    this.initializeSocialHabits();
  }
  
  // Validate each social habit object
  if (this.assessmentData?.socialHabits) {
    this.assessmentData.socialHabits.forEach((habit: any, index: number) => {
      if (!habit || typeof habit !== 'object') {
        this.assessmentData.socialHabits[index] = {
          smokingStatusId: null,
          cigarettesPerDay: null,
          alcoholStatusId: null,
          alcoholFrequencyId: null,
          beverageStatusId: null,
          cupsPerDay: null,
          drugUsageStatusId: null,
          drugDetails: null
        };
      }
    });
  }

  if (!this.originalAssessmentData) {
    console.log('No original assessment data to compare with');
    return;
  }

  const fieldsToCheck: (keyof typeof this.patientData)[] = [
    'systolic', 'diastolic', 'heartRate', 'pulse', 'respiratoryRate',
    'temperature', 'bloodSugar', 'spO2', 'weight', 'height', 'bmi',
    'bloodGroupId', 'chiefComplaints', 'allergySeverities', 'medications',
    'chronicConditions', 'surgicalHistory', 'familyHistoryConditions',
    'socialHabits', 'fileUrl', 'isFileUpload'
  ];

  console.log('Checking dirty fields...');
  
  const wasDirty = this.isDirty;
  this.isDirty = fieldsToCheck.some((field: keyof typeof this.patientData) => {
    const current = JSON.stringify(this.patientData[field]);
    const original = JSON.stringify(this.originalAssessmentData[field]);
    const isDifferent = current !== original;
    
    if (isDifferent) {
      console.log(`Field changed: ${field}`, {
        current: this.patientData[field],
        original: this.originalAssessmentData[field]
      });
      this.modifiedFields.add(field as string);
    }
    
    return isDifferent;
  });
  
  console.log(`Dirty state - Was: ${wasDirty}, Now: ${this.isDirty}`);
  
  if (!wasDirty && this.isDirty) {
    console.log('New changes detected, triggering auto-save');
    this.triggerAutoSave();
  }
}

  // Utility methods for better UX
  getSaveButtonText(): string {
    if (this.saveInProgress) return 'Saving...';
    if (this.isDirty) return 'Save Changes';
    return 'Save Assessment';
  }

  isSaveDisabled(): boolean {
    return this.saveInProgress || this.showBpWarning;
  }

  getAutoSaveStatus(): string {
    if (this.saveInProgress) return 'Saving...';
    if (this.isDirty) return 'Unsaved changes';
    return 'All changes saved';
  }

  onFormChange(): void {
    this.saveStatus = 'unsaved';
    this.isDirty = true;
    this.cdr.detectChanges();
  }

  getFormCompletionPercentage(): number {
    let totalFields = 0;
    let filledFields = 0;

    const countFields = (obj: any) => {
      for (const key in obj) {
        if (typeof obj[key] === 'object' && obj[key] !== null) {
          countFields(obj[key]);
        } else {
          totalFields++;
          if (obj[key] !== null && obj[key] !== '' && obj[key] !== false) {
            filledFields++;
          }
        }
      }
    };

    countFields(this.patientData);
    return totalFields > 0 ? Math.round((filledFields / totalFields) * 100) : 0;
  }
}