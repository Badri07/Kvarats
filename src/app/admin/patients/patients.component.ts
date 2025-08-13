import { Component, Input, OnChanges, SimpleChanges, OnInit, DoCheck, Inject, ChangeDetectorRef, OnDestroy } from '@angular/core';
import { FormGroup, FormBuilder } from '@angular/forms';
import { NgForm } from '@angular/forms';
import { AdminService } from '../../service/admin/admin.service';
import { ActivatedRoute } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { PopupService } from '../../service/popup/popup-service';
import { Subject, debounceTime, distinctUntilChanged, takeUntil } from 'rxjs';

type DropdownType = 'allergy' | 'medication' | 'condition' | 'complaint' | 'smokingstatus' | 
                   'alcoholstatus' | 'beveragestatus' | 'drugusagestatus' | 'bloodgroup' | 
                   'severity' | 'frequency' | 'surgerytype' | 'allergycategory' |'medicalcondition';
type SortDirection = 'asc' | 'desc';
type DropdownOption = { 
  id: number; 
  value: string; 
  name?: string;
  parentid: number; 
};
type ComplaintOption = string;

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
  private readonly SAVE_DEBOUNCE_TIME = 2000;
  private readonly MIN_SAVE_INTERVAL = 5000;

  // Form properties
  assessmentForm: FormGroup;
  chiefComplaintsArray: any;
  surgicalHistoryArray: any;
  socialHabitsArray: any;

  // Status properties
  saveStatus: 'saved' | 'saving' | 'unsaved' = 'unsaved';
  isSaving = false;
  isLoading = false;

  constructor(
    private adminservice: AdminService,
    private activate: ActivatedRoute,
    private _toastr: ToastrService,
    private _loader: PopupService,
    private cdr: ChangeDetectorRef,
    private fb: FormBuilder
  ) { 
    this.chiefComplaintsArray = this.fb.array([]);
    this.surgicalHistoryArray = this.fb.array([]);
    this.socialHabitsArray = this.fb.array([]);
    this.assessmentForm = this.fb.group({});
  }

  @Input() assessmentData: any;

  // Patient and UI state
  patId!: string;
  isshowvital: boolean = true;
  isshowSymptoms: boolean = true;
  isshowMedical: boolean = true;
  isshowSocial: boolean = true;
  painScaleErrors: { [key: number]: boolean } = {};

  // File upload
  fileUrl: string[] = [];
  isUpload: boolean = false;

  // Dropdown options
  allergyOptions: DropdownOption[] = [];
  medicationOptions: DropdownOption[] = [];
  chronicConditionOptions: DropdownOption[] = [];
  smokingOptions: DropdownOption[] = [];
  alcoholOptions: DropdownOption[] = [];
  beverageOptions: DropdownOption[] = [];
  drugUsageOptions: DropdownOption[] = [];
  bloodGroupOptions: DropdownOption[] = [];
  severityOptions: DropdownOption[] = [];
  frequencyOptions: DropdownOption[] = [];
  surgeryTypeOptions: DropdownOption[] = [];
  allergyCategoryOptions: DropdownOption[] = [];
  medicalConditionOptions: DropdownOption[] = [];
  familyHistoryOptions: DropdownOption[] = [];
  allergyOptionsByCategory: { [categoryId: number]: any[] } = {};
  chiefComplaintOptions: string[] = [
    'Fever', 'Cough', 'Headache', 'Cold', 'Body Pain',
    'Fatigue', 'Vomiting', 'Stomach Ache', 'Dizziness', 'Chest Pain'
  ];

  // Selected items for display
  selectedMedicationNames: string[] = [];
  selectedAllergyNames: string[] = [];
  selectedConditionNames: string[] = [];
  selectedAllergyCategoryId: number | null = null;
  filteredAllergyOptions: DropdownOption[] = [];

  // Patient data structure
  patientData = {
    patientId: '',
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
      complaint: string;
      painScale: number | null;
      notes: string;
      onsetDate: string | null;
    }[],

    // Allergies
    allergySeverities: [] as {
      allergyId: number;
      severityId: number | null;
      allergyCategoryId: number | null;
      reactionDetails: string;
      firstObserved: string | null;
      lastObserved: string | null;
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
    allergyId: null as number | null,
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
    conditionId: null as number | null,
    relationship: '',
    ageAtDiagnosis: null as number | null,
    isDeceased: null as boolean | null,
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
    condition: [] as DropdownOption[],
    complaint: [] as ComplaintOption[],
    smokingstatus: [] as DropdownOption[],
    alcoholstatus: [] as DropdownOption[],
    beveragestatus: [] as DropdownOption[],
    drugusagestatus: [] as DropdownOption[],
    bloodgroup: [] as DropdownOption[],
    severity: [] as DropdownOption[],
    frequency: [] as DropdownOption[],
    surgerytype: [] as DropdownOption[],
    allergycategory: [] as DropdownOption[],
    medicalcondition: [] as DropdownOption[]
  };

  isDropdownOpen = {
    allergy: false,
    medication: false,
    condition: false,
    complaint: false,
    smokingstatus: false,
    alcoholstatus: false,
    beveragestatus: false,
    drugusagestatus: false,
    bloodgroup: false,
    severity: false,
    frequency: false,
    surgerytype: false,
    allergycategory: false,
    medicalcondition: false
  };

  searchInputs = {
    allergy: '',
    medication: '',
    condition: '',
    complaint: '',
    smokingstatus: '',
    alcoholstatus: '',
    beveragestatus: '',
    drugusagestatus: '',
    bloodgroup: '',
    severity: '',
    frequency: '',
    surgerytype: '',
    allergycategory: '',
    medicalcondition: ''
  };

  showAddButtons = {
    allergy: false,
    medication: false,
    condition: false,
    complaint: false,
    smokingstatus: false,
    alcoholstatus: false,
    beveragestatus: false,
    drugusagestatus: false,
    bloodgroup: false,
    severity: false,
    frequency: false,
    surgerytype: false,
    allergycategory: false,
    medicalcondition: false
  };

  complaintTemplates: { [key: string]: string } = {
    'Fever': 'Patient reports elevated body temperature, chills, and weakness.',
    'Cough': 'Patient experiencing dry cough for the past few days.',
    'Headache': 'Patient has recurring headaches, mostly in the frontal region.',
    'Cold': 'Symptoms include runny nose, sneezing, and mild throat irritation.',
    'Body Pain': 'Patient complains of generalized muscle ache and fatigue.',
    'Fatigue': 'Persistent tiredness, possibly related to poor sleep or infection.',
    'Vomiting': 'Patient has had multiple episodes of vomiting, no blood seen.',
    'Stomach Ache': 'Abdominal discomfort, localized to lower quadrant.',
    'Dizziness': 'Feeling lightheaded or unstable, especially when standing.',
    'Chest Pain': 'Discomfort in chest area, further evaluation needed.'
  };

  ngOnInit(): void {
    this._loader.show();
    this.familyHistoryOptions = this.medicalConditionOptions;
    
    this.initializeSocialHabits();
    
    this.activate.params.pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: params => {
        this.patId = params['id'];
        this.patientData.patientId = this.patId;
        
        this.loadInitialAssessmentData().then(() => {
          this.loadDropdowns();
          this.setupAutoSave();
          this._loader.hide();
        });
      },
      error: err => {
        this._loader.hide();
        this._toastr.error('Failed to load patient parameters');
        console.error('Route param error:', err);
      }
    });

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
  }

  private async loadInitialAssessmentData(): Promise<void> {
    try {
      const data = await this.adminservice.getPatientAssessment(this.patId).toPromise();
      
      if (!data) {
        throw new Error('No assessment data returned');
      }
      
      this.assessmentData = data;
      this.prepopulateData();
      
      console.log('Initial assessment data loaded', {
        patientId: this.patId,
        data: this.assessmentData
      });
      
    } catch (error) {
      console.error('Failed to load initial data:', error);
      this._toastr.error('Could not load patient assessment');
      
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
    if (this.saveInProgress || !this.autoSaveEnabled) return;
    
    this.saveInProgress = true;
    this.saveStatus = 'saving';
    this.lastSaveTime = Date.now();

    const draftData = {...this.patientData, isDraft: true};
    
    this._toastr.info('Auto-saving draft...', '', {
      timeOut: 1000,
      progressBar: false
    });

    this.adminservice.savePatientAssessment(draftData).subscribe({
      next: (res) => {
        this.saveInProgress = false;
        this.isDirty = false;
        this.saveStatus = 'saved';
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.saveInProgress = false;
        this.saveStatus = 'unsaved';
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

      this.prepopulateData();
      
      this.isDirty = false;
      this.modifiedFields.clear();
      this.lastSaveTime = Date.now();

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

    const assessmentData = JSON.parse(JSON.stringify(this.assessmentData));

    assessmentData.allergySeverities = assessmentData.allergySeverities || [];
    assessmentData.medications = assessmentData.medications || [];
    assessmentData.chronicConditions = assessmentData.chronicConditions || [];
    assessmentData.surgicalHistory = assessmentData.surgicalHistory || [];
    assessmentData.familyHistoryConditions = assessmentData.familyHistoryConditions || [];
    assessmentData.chiefComplaints = assessmentData.chiefComplaints || [];
    assessmentData.socialHabits = assessmentData.socialHabits || [{}];
    assessmentData.fileUrl = assessmentData.fileUrl || [];

    this.patientData = {
      patientId: this.patientData.patientId,
      isDraft: false,
      isFileUpload: assessmentData.fileUrl?.length > 0 || false,
      fileUrl: assessmentData.fileUrl,
      
      systolic: assessmentData.systolic || null,
      diastolic: assessmentData.diastolic || null,
      heartRate: assessmentData.heartRate || null,
      pulse: assessmentData.pulse || null,
      respiratoryRate: assessmentData.respiratoryRate || null,
      temperature: assessmentData.temperature || null,
      bloodSugar: assessmentData.bloodSugar || null,
      spO2: assessmentData.spO2 || null,
      weight: assessmentData.weight || null,
      height: assessmentData.height || null,
      bmi: assessmentData.bmi || '',
      bloodGroupId: assessmentData.bloodGroupId || null,

      chiefComplaints: assessmentData.chiefComplaints.map((c: any) => ({
        complaint: c.complaint || '',
        painScale: c.painScale || null,
        notes: c.notes || this.complaintTemplates[c.complaint] || '',
        onsetDate: c.onsetDate || null
      })),

      allergySeverities: assessmentData.allergySeverities.map((a: any) => ({
        allergyId: a.allergyId || null,
        severityId: a.severityId || null,
        allergyCategoryId: a.allergyCategoryId || null,
        reactionDetails: a.reactionDetails || '',
        firstObserved: a.firstObserved || null,
        lastObserved: a.lastObserved || null
      })),

      medications: assessmentData.medications.map((m: any) => ({
        medicationId: m.medicationId || null,
        dosage: m.dosage || '',
        frequency: m.frequency || '',
        startDate: m.startDate || null,
        endDate: m.endDate || null,
        reason: m.reason || ''
      })),

      chronicConditions: assessmentData.chronicConditions.map((c: any) => ({
        conditionId: c.conditionId || null,
        diagnosisDate: c.diagnosisDate || null,
        treatmentDetails: c.treatmentDetails || '',
        isControlled: c.isControlled || null
      })),

      surgicalHistory: assessmentData.surgicalHistory.map((s: any) => ({
        procedure: s.procedure || '',
        date: s.date || null,
        hospital: s.hospital || '',
        surgeonName: s.surgeonName || '',
        surgeryTypeId: s.surgeryTypeId || null,
        hadComplications: s.hadComplications || false,
        complicationDetails: s.complicationDetails || ''
      })),

      familyHistoryConditions: assessmentData.familyHistoryConditions.map((f: any) => ({
        conditionId: f.conditionId || null,
        relationship: f.relationship || '',
        ageAtDiagnosis: f.ageAtDiagnosis || null,
        isDeceased: f.isDeceased || null,
        causeOfDeath: f.causeOfDeath || ''
      })),

      socialHabits: assessmentData.socialHabits.map((s: any) => ({
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
      }))
    };

    this.selectedAllergyNames = this.patientData.allergySeverities
      .map(item => this.getOptionLabel('allergy', item.allergyId));
    this.selectedMedicationNames = this.patientData.medications
      .map(item => this.getOptionLabel('medication', item.medicationId));
    this.selectedConditionNames = this.patientData.chronicConditions
      .map(item => this.getOptionLabel('condition', item.conditionId));

    this.originalAssessmentData = JSON.parse(JSON.stringify(this.patientData));
    console.log('Original assessment data initialized:', this.originalAssessmentData);
  }

  private loadDropdowns(): void {
    const dropdownRequests = [
      this.adminservice.getMedicationdata(),
      this.adminservice.getDropdowndata('ChronicCondition'),
      this.adminservice.getDropdowndata('SmokingStatus'),
      this.adminservice.getDropdowndata('AlcoholStatus'),
      this.adminservice.getDropdowndata('BeverageStatus'),
      this.adminservice.getDropdowndata('DrugusageStatus'),
      this.adminservice.getDropdowndata('BloodGroup'),
      this.adminservice.getDropdowndata('AllergySeverity'),
      this.adminservice.getDropdowndata('AlcoholFrequency'),
      this.adminservice.getDropdowndata('SurgeryType'),
      this.adminservice.getDropdowndata('MedicalCondition'),
      this.adminservice.getDropdowndata('AllergyCategory')
    ];

    import('rxjs').then(({ forkJoin }) => {
      forkJoin(dropdownRequests).subscribe({
        next: ([medications, conditions, smoking, alcohol, beverage, drug, bloodGroup, severity, frequency, surgery, medical, allergyCategory]) => {
          this.medicationOptions = medications || [];
          this.chronicConditionOptions = conditions || [];
          this.smokingOptions = smoking || [];
          this.alcoholOptions = alcohol || [];
          this.beverageOptions = beverage || [];
          this.drugUsageOptions = drug || [];
          this.bloodGroupOptions = bloodGroup || [];
          this.severityOptions = severity || [];
          this.frequencyOptions = frequency || [];
          this.surgeryTypeOptions = surgery || [];
          this.medicalConditionOptions = medical || [];
          this.allergyCategoryOptions = allergyCategory || [];
          this.familyHistoryOptions = this.medicalConditionOptions;
          
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error('Error loading dropdowns:', err);
          this._toastr.error('Failed to load form options');
        }
      });
    });
  }

  public onCategorySelected(categoryId: number): void {
    this.selectedAllergyCategoryId = categoryId;
    this.newAllergy.allergyCategoryId = categoryId;
    this.newAllergy.allergyId = null;
    this.searchInputs.allergy = '';
    this.loadAllergiesByCategory(categoryId);
  }

  private loadAllergiesByCategory(categoryId: number): void {
    this.adminservice.getAllergyDataByCategory('Allergy', categoryId).subscribe({
      next: (allergies) => {
        this.allergyOptionsByCategory[categoryId] = allergies || [];
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
    
    if (!this.allergyOptionsByCategory[this.newAllergy.allergyCategoryId]) {
      this.loadAllergiesByCategory(this.newAllergy.allergyCategoryId);
    } else {
      this.allergyOptions = this.allergyOptionsByCategory[this.newAllergy.allergyCategoryId];
      this.filteredOptions.allergy = this.filterAllergies(this.allergyOptions);
      this.isDropdownOpen.allergy = this.filteredOptions.allergy.length > 0;
    }
  }

  private filterAllergies(allergies: any[]): any[] {
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
    } else {
      const sourceOptions = this.getSourceOptions(type);
      this.filteredOptions[type] = searchTerm.trim() === ''
        ? sourceOptions.slice(0, 100)
        : sourceOptions.filter((opt: any) =>
          opt.value.toLowerCase().includes(searchTerm.toLowerCase())
        ).slice(0, 100);
    }

    this.showAddButtons[type] = !!searchTerm.trim() &&
      !this.filteredOptions[type].some((opt: any) =>
        opt.value.toLowerCase() === searchTerm.toLowerCase()
      );
  }

  private getSourceOptions(type: DropdownType): any[] {
    switch (type) {
      case 'complaint': return this.chiefComplaintOptions;
      case 'allergy': return this.allergyOptions;
      case 'medication': return this.medicationOptions;
      case 'condition': return this.chronicConditionOptions;
      case 'smokingstatus': return this.smokingOptions;
      case 'alcoholstatus': return this.alcoholOptions;
      case 'beveragestatus': return this.beverageOptions;
      case 'drugusagestatus': return this.drugUsageOptions;
      case 'bloodgroup': return this.bloodGroupOptions;
      case 'severity': return this.severityOptions;
      case 'frequency': return this.frequencyOptions;
      case 'surgerytype': return this.surgeryTypeOptions;
      case 'allergycategory': return this.allergyCategoryOptions;
      case 'medicalcondition': return this.medicalConditionOptions;
      default: return [];
    }
  }

  loadInitialOptions(type: DropdownType): void {
    this.filteredOptions[type] = this.getSourceOptions(type).slice(0, 100);
  }

  sortOptions(type: DropdownType, direction: SortDirection = 'asc'): void {
    if (type === 'complaint') {
      this.filteredOptions[type] = [...this.filteredOptions[type] as string[]].sort((a, b) =>
        direction === 'asc' ? a.localeCompare(b) : b.localeCompare(a)
      );
    } else {
      this.filteredOptions[type] = [...this.filteredOptions[type] as DropdownOption[]].sort((a, b) =>
        direction === 'asc' ? a.value.localeCompare(b.value) : b.value.localeCompare(a.value)
      );
    }
  }

  selectOption(type: DropdownType, option: DropdownOption | string): void {
    if (type === 'complaint') {
      const complaint = option as string;
      if (!this.patientData.chiefComplaints?.some(c => c.complaint === complaint)) {
        this.patientData.chiefComplaints.push({ 
          complaint, 
          painScale: null,
          notes: this.complaintTemplates[complaint] || '',
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
      if (!this.patientData.chiefComplaints?.some(c => c.complaint === newItem)) {
        this.patientData.chiefComplaints.push({ 
          complaint: newItem, 
          painScale: null,
          notes: this.complaintTemplates[newItem] || '',
          onsetDate: null
        });
        this.chiefComplaintOptions.unshift(newItem);
        if (!this.complaintTemplates[newItem]) this.complaintTemplates[newItem] = '';
      }
    } else {
      const optionsField = this.getOptionsField(type);
      const optionsArray = this[optionsField] as DropdownOption[];
      
      const newOption: DropdownOption = {
        id: this.generateNewId(),
        value: newItem,
        parentid: 0
      };
      
      optionsArray.unshift(newOption);
      
      if (type === 'allergy') {
        if (!this.newAllergy.allergyCategoryId) {
          this._toastr.warning('Please select an allergy category first');
          return;
        }

        newOption.parentid = this.newAllergy.allergyCategoryId;
        this.allergyOptions.unshift(newOption);
        this.filteredAllergyOptions.unshift(newOption);
        this.newAllergy.allergyId = newOption.id;
        this.searchInputs.allergy = newItem;
        this.markFieldChanged('allergySeverities');
      } 
      else if (type === 'medication') {
        this.medicationOptions.unshift(newOption);
        this.filteredOptions.medication.unshift(newOption);
        this.newMedication.medicationId = newOption.id;
        this.searchInputs.medication = newItem;
        this.markFieldChanged('medications');
      } 
      else if (type === 'condition') {
        this.chronicConditionOptions.unshift(newOption);
        this.filteredOptions.condition.unshift(newOption);
        this.newCondition.conditionId = newOption.id;
        this.searchInputs.condition = newItem;
        this.markFieldChanged('chronicConditions');
      }
      else if (type === 'surgerytype') {
        this.surgeryTypeOptions.unshift(newOption);
        this.filteredOptions.surgerytype.unshift(newOption);
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
      case 'condition': return 'chronicConditionOptions';
      case 'smokingstatus': return 'smokingOptions';
      case 'alcoholstatus': return 'alcoholOptions';
      case 'beveragestatus': return 'beverageOptions';
      case 'drugusagestatus': return 'drugUsageOptions';
      case 'bloodgroup': return 'bloodGroupOptions';
      case 'severity': return 'severityOptions';
      case 'frequency': return 'frequencyOptions';
      case 'surgerytype': return 'surgeryTypeOptions';
      case 'allergycategory': return 'allergyCategoryOptions';
      default: throw new Error(`Invalid type: ${type}`);
    }
  }

  selectComplaint(complaint: string): void {
    if (!this.patientData.chiefComplaints.some(c => c.complaint === complaint)) {
      this.patientData.chiefComplaints.push({ 
        complaint, 
        painScale: null,
        notes: this.complaintTemplates[complaint] || '',
        onsetDate: null
      });
    }
    this.isDropdownOpen['complaint'] = false;
    this.searchInputs['complaint'] = '';
  }

  addAllergy(): void {
    if (this.newAllergy.allergyId !== null) {
      this.patientData.allergySeverities.push({
        allergyId: this.newAllergy.allergyId,
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
    if (this.newFamilyHistory.conditionId !== null) {
      this.patientData.familyHistoryConditions.push({
        conditionId: this.newFamilyHistory.conditionId,
        relationship: this.newFamilyHistory.relationship,
        ageAtDiagnosis: this.newFamilyHistory.ageAtDiagnosis,
        isDeceased: this.newFamilyHistory.isDeceased,
        causeOfDeath: this.newFamilyHistory.causeOfDeath
      });
      
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
    if (id == null) {
      return 'Not specified';
    }

    const options: DropdownOption[] =
      type === 'allergy' ? this.allergyOptions :
      type === 'medication' ? this.medicationOptions :
      type === 'condition' ? this.chronicConditionOptions :
      type === 'severity' ? this.severityOptions :
      type === 'allergycategory' ? this.allergyCategoryOptions :
      type === 'surgerytype' ? this.surgeryTypeOptions:
      type === 'bloodgroup' ? this.bloodGroupOptions :
      this.medicalConditionOptions;

    const foundOption = options.find(opt => opt.id === id);
    return foundOption?.value || 'Unknown';
  }

  isComplaintSelected(complaint: string): boolean {
    return this.patientData.chiefComplaints?.some(c => c.complaint === complaint) ?? false;
  }

  openDropdown() {
    this.isDropdownOpen.bloodgroup = true;
    this.filterOptions('bloodgroup', this.searchInputs.bloodgroup);
    
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
      this.newMedication.medicationId = null;
      this.searchInputs.medication = '';
    } else {
      this.newMedication.medicationId = option.id;
      this.searchInputs.medication = option.value;
    }
    this.closeDropdown('medication');
  }

  isMedicationSelected(option: any): boolean {
    return this.newMedication.medicationId === option.id;
  }

  selectFrequency(option: any) {
    if (this.isFrequencySelected(option)) {
      this.newMedication.frequency = '';
      this.searchInputs.frequency = '';
    } else {
      this.newMedication.frequency = option.value;
      this.searchInputs.frequency = option.value;
    }
    this.closeDropdown('frequency');
  }

  isFrequencySelected(option: any): boolean {
    return this.newMedication.frequency === option.value;
  }

  selectCondition(option: DropdownOption): void {
    if (this.isConditionSelected(option)) {
      this.newCondition.conditionId = null;
      this.searchInputs.condition = '';
    } else {
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

    this.patientData.isDraft = isDraft;

    if (this.patientData.socialHabits.length > 0) {
      const hasValues = Object.values(this.patientData.socialHabits[0]).some(
        val => val !== null && val !== undefined && val !== ''
      );
      if (!hasValues) {
        this.patientData.socialHabits = [];
      }
    }

    if (this.showBpWarning) {
      this._toastr.warning('Diastolic pressure cannot be greater than systolic');
      return;
    }

    this.saveInProgress = true;
    this.saveStatus = 'saving';
    this._loader.show();
    
    this.adminservice.savePatientAssessment(this.patientData).subscribe({
      next: (res) => {
        this.saveInProgress = false;
        this.saveStatus = 'saved';
        this._loader.hide();
        
        if (isDraft) {
          this._toastr.success('Draft saved successfully');
        } else {
          this._toastr.success('Assessment saved successfully');
          this.originalAssessmentData = JSON.parse(JSON.stringify(this.patientData));
          this.isDirty = false;
          this.modifiedFields.clear();
        }
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.saveInProgress = false;
        this.saveStatus = 'unsaved';
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
      this.modifiedFields.forEach(field => {
        if (field in this.originalAssessmentData) {
          (this.patientData as any)[field] = JSON.parse(JSON.stringify(this.originalAssessmentData[field]));
        } else {
          console.warn(`Field ${field} not found in original data`);
        }
      });

      this.selectedAllergyNames = this.patientData.allergySeverities
        .map(item => this.getOptionLabel('allergy', item.allergyId))
        .filter(Boolean);

      this.selectedMedicationNames = this.patientData.medications
        .map(item => this.getOptionLabel('medication', item.medicationId))
        .filter(Boolean);

      this.selectedConditionNames = this.patientData.chronicConditions
        .map(item => this.getOptionLabel('condition', item.conditionId))
        .filter(Boolean);

      if (form) {
        setTimeout(() => {
          form.resetForm({
            ...this.patientData,
            bloodGroupId: this.patientData.bloodGroupId,
            socialHabits: this.patientData.socialHabits[0] || {}
          });
        }, 0);
      }

      this.initializeSocialHabits();
      this.filteredAllergyOptions = [...this.allergyOptions];
      
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
      
      if (this.originalAssessmentData) {
        this.patientData = JSON.parse(JSON.stringify(this.originalAssessmentData));
        this.cdr.detectChanges();
      }
    }
  }

  markFieldChanged(field: string): void {
    this.modifiedFields.add(field);
    this.saveStatus = 'unsaved';
    this.isDirty = true;
  }

  validatePainScale(event: Event, index: number) {
    const input = event.target as HTMLInputElement;
    let value = parseInt(input.value, 10);
    
    if (isNaN(value)) {
      this.painScaleErrors[index] = false;
      return;
    }

    if (value < 0) {
      value = 0;
      input.value = '0';
    } else if (value > 10) {
      value = 10;
      input.value = '10';
    }

    this.patientData.chiefComplaints[index].painScale = value;
    this.painScaleErrors[index] = false;
    this.markFieldChanged('chiefComplaints');
    this.triggerAutoSave();
  }

  preventInvalidInput(event: KeyboardEvent) {
    if ([46, 8, 9, 27, 13, 110].includes(event.keyCode) ||
        (event.keyCode === 65 && event.ctrlKey === true) ||
        (event.keyCode === 67 && event.ctrlKey === true) ||
        (event.keyCode === 86 && event.ctrlKey === true) ||
        (event.keyCode === 88 && event.ctrlKey === true) ||
        (event.keyCode >= 35 && event.keyCode <= 39)) {
      return;
    }
    
    if (event.shiftKey || (event.keyCode < 48 || event.keyCode > 57)) {
      event.preventDefault();
    }
  }

  selectAllergyCategory(option: DropdownOption): void {
    if (this.newAllergy.allergyCategoryId === option.id) {
      this.newAllergy.allergyCategoryId = null;
      this.searchInputs.allergycategory = '';
      this.newAllergy.allergyId = null;
      this.searchInputs.allergy = '';
      this.allergyOptions = [];
      this.filteredOptions.allergy = [];
    } else {
      this.newAllergy.allergyCategoryId = option.id;
      this.searchInputs.allergycategory = option.value;
      this.newAllergy.allergyId = null;
      this.searchInputs.allergy = '';
      this.loadAllergiesByCategory(option.id);
    }
    
    this.isDropdownOpen.allergycategory = false;
  }

  clearAllergyCategory(): void {
    this.newAllergy.allergyCategoryId = null;
    this.searchInputs.allergycategory = '';
    this.newAllergy.allergyId = null;
    this.searchInputs.allergy = '';
    this.allergyOptions = [];
    this.filteredOptions.allergy = [];
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

    this.filteredOptions.allergy = [...this.filteredAllergyOptions];
  }

  isAllergyCategorySelected(option: any): boolean {
    return this.newAllergy.allergyCategoryId === option.id;
  }

  selectAllergy(option: DropdownOption): void {
    if (this.isAllergySelected(option)) {
      this.newAllergy.allergyId = null;
      this.searchInputs.allergy = '';
    } else {
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
      this.newAllergy.severityId = null;
      this.searchInputs.severity = '';
    } else {
      this.newAllergy.severityId = option.id;
      this.searchInputs.severity = option.value;
    }
    this.closeDropdown('severity');
  }

  isSeveritySelected(option: DropdownOption): boolean {
    return this.newAllergy.severityId === option.id;
  }

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

  onSmokingStatusChange(): void {
    if (this.isNeverSmoker()) {
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
      const socialHabit = this.patientData.socialHabits[0];
      if (socialHabit) {
        socialHabit.drugDetails = null;
      }
    }
    this.markFieldChanged('socialHabits');
    this.triggerAutoSave();
  }

  getPatientInitials(): string {
    return 'PA';
  }

  getBMICategory(): string {
    const bmi = parseFloat(this.patientData.bmi || '0');
    if (!bmi) return '';
    
    if (bmi < 18.5) return 'Underweight';
    if (bmi < 25) return 'Normal';
    if (bmi < 30) return 'Overweight';
    return 'Obese';
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

  trackByIndex(index: number, item: any): number {
    return index;
  }

  ngDoCheck(): void {
    console.log('--- ngDoCheck triggered ---');
    
    if (!this.assessmentData?.socialHabits || this.assessmentData.socialHabits.length === 0) {
      this.initializeSocialHabits();
    }
    
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
      this.saveStatus = 'unsaved';
      this.triggerAutoSave();
    }
  }

  validateSocialHabitsData(data: any): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!data || typeof data !== 'object') {
      errors.push('Social habits data is invalid');
      return { isValid: false, errors };
    }

    if (data.smokingStatusId && data.cigarettesPerDay && data.cigarettesPerDay < 0) {
      errors.push('Cigarettes per day cannot be negative');
    }

    if (data.smokingStatusId && data.yearsSmoking && data.yearsSmoking < 0) {
      errors.push('Years smoking cannot be negative');
    }

    if (data.alcoholStatusId && data.yearsDrinking && data.yearsDrinking < 0) {
      errors.push('Years drinking cannot be negative');
    }

    if (data.beverageStatusId && data.cupsPerDay && data.cupsPerDay < 0) {
      errors.push('Cups per day cannot be negative');
    }

    return { isValid: errors.length === 0, errors };
  }

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

  validateBloodPressure(): void {
    if (this.patientData.systolic && this.patientData.diastolic) {
      this.showBpWarning = this.patientData.diastolic > this.patientData.systolic;
    } else {
      this.showBpWarning = false;
    }
  }

  addChiefComplaint(): void {
    this.chiefComplaintsArray.push(this.fb.control({
      complaint: '',
      painScale: null,
      notes: '',
      onsetDate: null
    }));
    this.onFormChange();
  }

  removeChiefComplaint(index: number): void {
    this.chiefComplaintsArray.removeAt(index);
    this.onFormChange();
  }

  addSurgicalHistory(): void {
    this.surgicalHistoryArray.push(this.fb.control({
      procedure: '',
      date: null,
      hospital: '',
      surgeonName: '',
      surgeryTypeId: null,
      hadComplications: false,
      complicationDetails: ''
    }));
    this.onFormChange();
  }

  removeSurgicalHistory(index: number): void {
    this.surgicalHistoryArray.removeAt(index);
    this.onFormChange();
  }

  addSocialHabit(): void {
    this.socialHabitsArray.push(this.fb.control({
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
    }));
    this.onFormChange();
  }

  toggleAllergy(allergyValue: string | number): void {
    const allergyId = typeof allergyValue === 'string' ? parseInt(allergyValue) : allergyValue;
    const index = this.patientData.allergySeverities.findIndex(a => a.allergyId === allergyId);
    if (index >= 0) {
      this.patientData.allergySeverities.splice(index, 1);
    } else {
      this.patientData.allergySeverities.push({
        allergyId,
        severityId: null,
        allergyCategoryId: null,
        reactionDetails: '',
        firstObserved: null,
        lastObserved: null
      });
    }
    this.onFormChange();
  }

  toggleMedication(medicationValue: string | number): void {
    const medicationId = typeof medicationValue === 'string' ? parseInt(medicationValue) : medicationValue;
    const index = this.patientData.medications.findIndex(m => m.medicationId === medicationId);
    if (index >= 0) {
      this.patientData.medications.splice(index, 1);
    } else {
      this.patientData.medications.push({
        medicationId,
        dosage: '',
        frequency: '',
        startDate: null,
        endDate: null,
        reason: ''
      });
    }
    this.onFormChange();
  }

  toggleChronicCondition(conditionValue: string | number): void {
    const conditionId = typeof conditionValue === 'string' ? parseInt(conditionValue) : conditionValue;
    const index = this.patientData.chronicConditions.findIndex(c => c.conditionId === conditionId);
    if (index >= 0) {
      this.patientData.chronicConditions.splice(index, 1);
    } else {
      this.patientData.chronicConditions.push({
        conditionId,
        diagnosisDate: null,
        treatmentDetails: '',
        isControlled: null
      });
    }
    this.onFormChange();
  }

  toggleFamilyHistory(conditionId: number): void {
    const index = this.patientData.familyHistoryConditions.findIndex(f => f.conditionId === conditionId);
    if (index >= 0) {
      this.patientData.familyHistoryConditions.splice(index, 1);
    } else {
      this.patientData.familyHistoryConditions.push({
        conditionId,
        relationship: '',
        ageAtDiagnosis: null,
        isDeceased: null,
        causeOfDeath: ''
      });
    }
    this.onFormChange();
  }

  isFamilyHistorySelected(conditionId: number): boolean {
    return this.patientData.familyHistoryConditions.some(f => f.conditionId === conditionId);
  }
}