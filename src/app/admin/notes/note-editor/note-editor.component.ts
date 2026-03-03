import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { TosterService } from '../../../service/toaster/tostr.service';
import { PopupService } from '../../../service/popup/popup-service';
import { SoapNoteService } from '../../../service/note/soap.notes.services';
import { ProgressNoteService } from '../../../service/note/progress.note.service';
import { TreatmentPlanService } from '../../../service/note/treatment.note.service';
import { Patient } from '../../../models/patients.model';
import { AdminService } from '../../../service/admin/admin.service';
import { AuthService } from '../../../service/auth/auth.service';
import { Subscription, forkJoin } from 'rxjs';
import { NoteNavigationService } from '../../../service/note/note-navigation.service';

@Component({
  selector: 'app-note-editor',
  standalone: false,
  templateUrl: './note-editor.component.html',
  styleUrl: './note-editor.component.scss'
})
export class SoapNoteComponent implements OnInit, OnDestroy {
  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private toastr = inject(TosterService);
  private loader = inject(PopupService);
  private soapNoteService = inject(SoapNoteService);
  private progressNoteService = inject(ProgressNoteService);
  private treatmentPlanService = inject(TreatmentPlanService);
  private _adminservice = inject(AdminService);
  private _authservice = inject(AuthService);
  private noteNavigationService = inject(NoteNavigationService);

  noteForm!: FormGroup;
  formSubmitted = false;
  isLoading = false;
  isEditMode = false;
  noteId: string | null = null;
  noteType: string = 'soap';
  pageTitle: string = 'Create New Clinical Note';
  currentNoteStatus: string = 'draft';

  // Multi-step navigation
  tabs = ['basic-info', 'note-content', 'review'];
  selectedTab = 'basic-info';

  private navigationSubscription!: Subscription;

  // Dropdown data
  therapistList: any[] = [];
  patientList: Patient[] = [];
  filteredPatients: Patient[] = [];
  
  // Patient pagination
  patientCurrentPage = 1;
  patientPageSize = 10;
  patientTotalCount = 0;
  patientTotalPages = 1;
  patientSearchTerm = '';

  // Track if dropdowns are loaded
  private dropdownsLoaded = false;

  ngOnInit(): void {
    this.initializeForm();
    this.loadDropdowns().then(() => {
      this.setupNavigation();
    });
  }

  ngOnDestroy(): void {
    if (this.navigationSubscription) {
      this.navigationSubscription.unsubscribe();
    }
  }

  private async loadDropdowns(): Promise<void> {
    try {
      await forkJoin([
        this.loadTherapists(),
        this.loadPatients()
      ]).toPromise();
      
      this.dropdownsLoaded = true;
      console.log('Dropdowns loaded successfully');
      console.log('Therapists:', this.therapistList);
      console.log('Patients:', this.patientList);
    } catch (error) {
      console.error('Failed to load dropdowns:', error);
      this.toastr.error('Failed to load required data');
    }
  }

  private setupNavigation(): void {
    console.log('Setting up navigation in editor component');
    
    // Subscribe to note navigation data
    this.navigationSubscription = this.noteNavigationService.noteData$.subscribe(noteData => {
      console.log('Received note data from service:', noteData);
      
      if (noteData && noteData.id) {
        this.handleNoteNavigationData(noteData);
      } else {
        this.checkUrlParameters();
      }
    });

    // Also check for existing data immediately
    const existingData = this.noteNavigationService.getNoteData();
    console.log('Existing note data from service:', existingData);
    if (existingData) {
      this.handleNoteNavigationData(existingData);
    } else {
      this.checkUrlParameters();
    }
  }

  private handleNoteNavigationData(noteData: any): void {
    console.log('Handling note navigation data:', noteData);
    
    this.noteId = noteData.id;
    this.noteType = this.normalizeNoteType(noteData.type);
    this.isEditMode = noteData.isEdit;

    console.log('Set properties:', {
      noteId: this.noteId,
      noteType: this.noteType,
      isEditMode: this.isEditMode
    });

    if (this.isEditMode && this.noteId) {
      console.log('Loading note for editing:', this.noteId, this.noteType);
      // Wait for dropdowns to load before loading the note
      if (this.dropdownsLoaded) {
        this.loadNote(this.noteId, this.noteType);
      } else {
        // If dropdowns aren't loaded yet, wait a bit and try again
        setTimeout(() => {
          if (this.dropdownsLoaded) {
            this.loadNote(this.noteId!, this.noteType);
          }
        }, 500);
      }
    } else {
      console.log('Creating new note of type:', this.noteType);
      this.noteForm.patchValue({ noteType: this.noteType });
      this.updatePageTitle();
      this.updateValidators(this.noteType);
    }
  }

  private normalizeNoteType(type: string): string {
    const typeMap: { [key: string]: string } = {
      'treatment_plan': 'treatment',
      'treatment-plans': 'treatment',
      'soap-notes': 'soap',
      'progress-notes': 'progress',
      'dap-notes': 'dap'
    };
    return typeMap[type] || type;
  }

  private checkUrlParameters(): void {
    this.route.queryParamMap.subscribe(queryParams => {
      const typeParam = queryParams.get('type');
      console.log('URL type parameter:', typeParam);
      if (typeParam && !this.noteId) {
        this.noteType = this.normalizeNoteType(typeParam);
        this.noteForm.patchValue({ noteType: this.noteType });
        this.updatePageTitle();
        this.updateValidators(this.noteType);
      }
    });
  }

  private initializeForm(): void {
    this.noteForm = this.fb.group({
      // Basic Information
      noteType: ['soap', Validators.required],
      patientId: ['', Validators.required],
      therapistId: ['', Validators.required],
      sessionDate: ['', Validators.required],
      nextSessionDate: [''],
      sessionDurationMinutes: [60],
      sessionType: ['therapy'],

      // SOAP Note fields
      subjective: [''],
      objective: [''],
      assessment: [''],
      plan: [''],
      additionalNotes: [''],

      // Progress Note fields
      progressTowardGoals: [''],
      currentStatus: [''],
      interventionsUsed: [''],
      patientResponse: [''],
      barriers: [''],
      planForNextSession: [''],

      // Treatment Plan fields
      diagnosis: [''],
      frequency: [''],
      duration: [''],
      problemStatement: [''],
      goals: [''],
      objectives: [''],
      interventions: [''],
      progressMeasurement: [''],
      notes: ['']
    });

    this.noteForm.get('noteType')?.valueChanges.subscribe(type => {
      this.noteType = type;
      this.updatePageTitle();
      this.updateValidators(type);
    });

    this.updatePageTitle();
    this.updateValidators(this.noteType);
  }

  private loadNote(id: string, type: string): void {
    console.log('Loading note with ID:', id, 'Type:', type);
    this.isLoading = true;
    this.loader.show();

    switch (type) {
      case 'soap':
        this.soapNoteService.getSOAPNoteById(id).subscribe({
          next: (response: any) => {
            console.log('SOAP note response:', response);
            // Check if response has data property or is the direct object
            const noteData = response.data || response;
            if (noteData) {
              this.populateFormFromAPI(noteData, type);
              this.currentNoteStatus = noteData.isDraft ? 'draft' : 'completed';
              console.log('Current note status:', this.currentNoteStatus);
            }
            this.isLoading = false;
            this.loader.hide();
          },
          error: (error) => {
            this.handleError('Failed to load SOAP note', error);
          }
        });
        break;

      case 'progress':
        this.progressNoteService.getProgressNoteById(id).subscribe({
          next: (response: any) => {
            console.log('Progress note response:', response);
            const noteData = response.data || response;
            if (noteData) {
              this.populateFormFromAPI(noteData, type);
              this.currentNoteStatus = noteData.isDraft ? 'draft' : 'completed';
              console.log('Current note status:', this.currentNoteStatus);
            }
            this.isLoading = false;
            this.loader.hide();
          },
          error: (error) => {
            this.handleError('Failed to load progress note', error);
          }
        });
        break;

      case 'treatment':
        this.treatmentPlanService.getTreatmentPlanById(id).subscribe({
          next: (response: any) => {
            console.log('Treatment note response:', response);
            const noteData = response.data || response;
            if (noteData) {
              this.populateFormFromAPI(noteData, type);
              this.currentNoteStatus = noteData.isDraft ? 'draft' : 'completed';
              console.log('Current note status:', this.currentNoteStatus);
            }
            this.isLoading = false;
            this.loader.hide();
          },
          error: (error) => {
            this.handleError('Failed to load treatment plan', error);
          }
        });
        break;
    }
  }

  private populateFormFromAPI(data: any, type: string): void {
    console.log('Populating form with data:', data, 'Type:', type);
    console.log('Available therapists:', this.therapistList);
    console.log('Available patients:', this.patientList);
    
    // Set basic information first
    const baseValues: any = {
      noteType: type,
      patientId: data.patientId,
      therapistId: data.therapistId,
      sessionDate: data.sessionDate ? new Date(data.sessionDate).toISOString().split('T')[0] : '',
      sessionDurationMinutes: data.sessionDurationMinutes || 60,
      sessionType: data.sessionType || 'therapy'
    };

    // Handle next session date or end date based on note type
    if (type === 'treatment') {
      baseValues.nextSessionDate = data.endDate ? new Date(data.endDate).toISOString().split('T')[0] : '';
    } else {
      baseValues.nextSessionDate = data.nextSessionDate ? new Date(data.nextSessionDate).toISOString().split('T')[0] : '';
    }

    console.log('Base values to patch:', baseValues);
    
    // Use setTimeout to ensure the form is ready and dropdowns are populated
    setTimeout(() => {
      this.noteForm.patchValue(baseValues);
      
      // Force change detection for dropdowns
      this.noteForm.get('patientId')?.updateValueAndValidity();
      this.noteForm.get('therapistId')?.updateValueAndValidity();

      console.log('Form values after patching basics:', this.noteForm.value);
      console.log('Patient ID control value:', this.noteForm.get('patientId')?.value);
      console.log('Therapist ID control value:', this.noteForm.get('therapistId')?.value);

      // Set type-specific fields based on note type
      switch (type) {
        case 'soap':
          this.noteForm.patchValue({
            subjective: data.subjective || '',
            objective: data.objective || '',
            assessment: data.assessment || '',
            plan: data.plan || '',
            additionalNotes: data.additionalNotes || ''
          });
          break;

        case 'progress':
          this.noteForm.patchValue({
            progressTowardGoals: data.progressTowardGoals || data.goalProgress || '',
            currentStatus: data.currentStatus || data.progressSummary || data.clinicalObservations || '',
            interventionsUsed: data.interventionsUsed || '',
            patientResponse: data.patientResponse || '',
            barriers: data.barriers || '',
            planForNextSession: data.planForNextSession || data.nextSteps || ''
          });
          break;

        case 'treatment':
          this.noteForm.patchValue({
            diagnosis: data.diagnosis || '',
            frequency: data.frequency || '',
            duration: data.duration || '',
            problemStatement: data.problemStatement || data.presentingProblem || '',
            goals: data.goals || data.treatmentGoals || '',
            objectives: data.objectives || '',
            interventions: data.interventions || '',
            progressMeasurement: data.progressMeasurement || '',
            notes: data.notes || data.reviewNotes || ''
          });
          break;
      }

      // Update page title and validators after populating form
      this.updatePageTitle();
      this.updateValidators(type);

      console.log('Form after complete population:', this.noteForm.value);
      console.log('Form validity:', this.noteForm.valid);
      
      // Double check if therapist is properly set
      setTimeout(() => {
        console.log('Final therapist ID value:', this.noteForm.get('therapistId')?.value);
        console.log('Therapist exists in list:', this.therapistList.find(t => t.id === data.therapistId));
      }, 100);
    }, 100);
  }

  // Load therapists dropdown - return Promise
  private loadTherapists(): Promise<void> {
    return new Promise((resolve, reject) => {
      this._adminservice.getTherapistList().subscribe({
        next: (res: any[]) => {
          this.therapistList = res || [];
          console.log('Therapists loaded:', this.therapistList);
          resolve();
        },
        error: (err) => {
          console.error('Failed to load therapists:', err);
          this.toastr.error('Failed to load therapists list');
          reject(err);
        }
      });
    });
  }

  // Load patients with pagination - return Promise
  private loadPatients(): Promise<void> {
    return new Promise((resolve, reject) => {
      const clientId: any = this._authservice.getClientId();
      this._adminservice.getPatientsList(clientId, this.patientCurrentPage, this.patientPageSize).subscribe({
        next: (response: any) => {
          const data: Patient[] = response || [];
          this.patientTotalCount = response.pagination?.totalCount || 0;
          this.patientTotalPages = Math.max(1, Math.ceil(this.patientTotalCount / this.patientPageSize));
          
          this.patientList = data;
          this.filteredPatients = [...data];
          console.log('Patients loaded:', this.patientList);
          resolve();
        },
        error: (err) => {
          console.error('Failed to fetch patient list', err);
          this.toastr.error('Failed to load patients list');
          reject(err);
        }
      });
    });
  }

  // Search patients
  onPatientSearch(searchTerm: any) {
    this.patientSearchTerm = searchTerm;
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      this.filteredPatients = this.patientList.filter((patient: any) => 
        patient.firstName?.toLowerCase().includes(term) ||
        patient.lastName?.toLowerCase().includes(term) ||
        patient.email?.toLowerCase().includes(term) ||
        patient.phoneNumber?.includes(term)
      );
    } else {
      this.filteredPatients = [...this.patientList];
    }
  }

  // Patient pagination
  onPatientPageChange(page: number): void {
    if (page >= 1 && page <= this.patientTotalPages && page !== this.patientCurrentPage) {
      this.patientCurrentPage = page;
      this.loadPatients();
    }
  }

  // Get patient display name
  getPatientDisplayName(patient: any) {
    return `${patient.firstName || ''} ${patient.lastName || ''}`.trim() || 'Unknown Patient';
  }

  // Get therapist display name
  getTherapistDisplayName(therapist: any): string {
    return `${therapist.firstName || ''} ${therapist.lastName || ''}`.trim() || 'Unknown Therapist';
  }

  // Methods for review tab display
  getSelectedPatientDisplayName() {
    const patientId = this.noteForm.get('patientId')?.value;
    if (!patientId) return 'Not selected';
    
    const patient = this.patientList.find(p => p.id === patientId);
    return this.getPatientDisplayName(patient || {});
  }

  getSelectedTherapistDisplayName(): string {
    const therapistId = this.noteForm.get('therapistId')?.value;
    if (!therapistId) return 'Not selected';
    
    const therapist = this.therapistList.find(t => t.id === therapistId);
    return this.getTherapistDisplayName(therapist || {});
  }

  private updatePageTitle(): void {
    const noteTypeLabel = this.getNoteTypeLabel(this.noteType);
    
    if (this.isEditMode) {
      this.pageTitle = `Edit ${noteTypeLabel}`;
    } else if (this.noteId) {
      this.pageTitle = `View ${noteTypeLabel}`;
    } else {
      this.pageTitle = `Create New ${noteTypeLabel}`;
    }
    console.log('Final page title:', this.pageTitle);
  }

  private updateValidators(noteType: string): void {
    // Reset all validators first
    const fields = [
      'subjective', 'objective', 'assessment', 'plan',
      'progressTowardGoals', 'currentStatus', 'interventionsUsed', 'patientResponse', 'planForNextSession',
      'diagnosis', 'frequency', 'duration', 'problemStatement', 'goals', 'objectives', 'interventions', 'progressMeasurement'
    ];

    fields.forEach(field => {
      this.noteForm.get(field)?.clearValidators();
      this.noteForm.get(field)?.updateValueAndValidity();
    });

    // Set validators based on note type
    switch (noteType) {
      case 'soap':
        this.noteForm.get('subjective')?.setValidators([Validators.required]);
        this.noteForm.get('objective')?.setValidators([Validators.required]);
        this.noteForm.get('assessment')?.setValidators([Validators.required]);
        this.noteForm.get('plan')?.setValidators([Validators.required]);
        break;
      
      case 'progress':
        this.noteForm.get('progressTowardGoals')?.setValidators([Validators.required]);
        this.noteForm.get('currentStatus')?.setValidators([Validators.required]);
        this.noteForm.get('interventionsUsed')?.setValidators([Validators.required]);
        this.noteForm.get('patientResponse')?.setValidators([Validators.required]);
        this.noteForm.get('planForNextSession')?.setValidators([Validators.required]);
        break;
      
      case 'treatment':
        this.noteForm.get('diagnosis')?.setValidators([Validators.required]);
        this.noteForm.get('frequency')?.setValidators([Validators.required]);
        this.noteForm.get('duration')?.setValidators([Validators.required]);
        this.noteForm.get('problemStatement')?.setValidators([Validators.required]);
        this.noteForm.get('goals')?.setValidators([Validators.required]);
        this.noteForm.get('objectives')?.setValidators([Validators.required]);
        this.noteForm.get('interventions')?.setValidators([Validators.required]);
        this.noteForm.get('progressMeasurement')?.setValidators([Validators.required]);
        break;
    }

    // Update validity
    fields.forEach(field => {
      this.noteForm.get(field)?.updateValueAndValidity();
    });
  }

  // Multi-step navigation
  setTab(tab: string): void {
    this.selectedTab = tab;
  }

  onNext(): void {
    const currentIndex = this.tabs.indexOf(this.selectedTab);
    if (currentIndex < this.tabs.length - 1) {
      this.selectedTab = this.tabs[currentIndex + 1];
    } else if (this.selectedTab === 'review') {
      this.onSubmit();
    }
  }

  onBack(): void {
    const currentIndex = this.tabs.indexOf(this.selectedTab);
    if (currentIndex > 0) {
      this.selectedTab = this.tabs[currentIndex - 1];
    }
  }

  onSubmit(): void {
    this.formSubmitted = true;

    if (this.noteForm.invalid) {
      this.markFormGroupTouched();
      this.toastr.error('Please fill all required fields');
      this.selectedTab = 'basic-info';
      return;
    }

    this.isLoading = true;
    this.loader.show();

    const formValue = this.noteForm.value;
    const noteType = formValue.noteType;

    if (this.isEditMode && this.noteId) {
      this.updateNote(noteType, false);
    } else {
      this.createNote(noteType, false);
    }
  }

  private createNote(noteType: string, isDraft: boolean = false): void {
    const formValue = this.noteForm.value;

    switch (noteType) {
      case 'soap':
        const soapRequest = {
          patientId: formValue.patientId,
          therapistId: formValue.therapistId,
          sessionDate: formValue.sessionDate,
          sessionDurationMinutes: formValue.sessionDurationMinutes, 
          sessionType: formValue.sessionType, 
          nextSessionDate: formValue.nextSessionDate || undefined,
          subjective: formValue.subjective,
          objective: formValue.objective,
          assessment: formValue.assessment,
          plan: formValue.plan,
          additionalNotes: formValue.additionalNotes || undefined,
          isDraft: isDraft
        };
        this.soapNoteService.createSOAPNote(soapRequest).subscribe({
          next: (response) => this.handleSuccess(
            isDraft ? 'SOAP note draft saved successfully' : 'SOAP note created successfully', 
            response
          ),
          error: (error) => this.handleError(
            isDraft ? 'Failed to save SOAP note draft' : 'Failed to create SOAP note', 
            error
          )
        });
        break;

      case 'progress':
        const progressRequest = {
          patientId: formValue.patientId,
          therapistId: formValue.therapistId,
          sessionDate: formValue.sessionDate,
          sessionDurationMinutes: formValue.sessionDurationMinutes || 60, 
          sessionType: formValue.sessionType || 'therapy', 
          nextSessionDate: formValue.nextSessionDate || undefined,
          progressSummary: formValue.currentStatus, 
          goalProgress: formValue.progressTowardGoals,
          interventionsUsed: formValue.interventionsUsed,
          patientResponse: formValue.patientResponse,
          clinicalObservations: formValue.barriers || undefined,
          nextSteps: formValue.planForNextSession,
          isDraft: isDraft
        };

        this.progressNoteService.createProgressNote(progressRequest).subscribe({
          next: (response) => this.handleSuccess(
            isDraft ? 'Progress note draft saved successfully' : 'Progress note created successfully', 
            response
          ),
          error: (error) => this.handleError(
            isDraft ? 'Failed to save progress note draft' : 'Failed to create progress note', 
            error
          )
        });
        break;

      case 'treatment':
        const treatmentRequest = {
          patientId: formValue.patientId,
          therapistId: formValue.therapistId,
          startDate: formValue.sessionDate,
          endDate: formValue.nextSessionDate || undefined,
          diagnosis: formValue.diagnosis,
          frequency: formValue.frequency,
          duration: formValue.duration,
          problemStatement: formValue.problemStatement,
          goals: formValue.goals,
          objectives: formValue.objectives,
          interventions: formValue.interventions,
          progressMeasurement: formValue.progressMeasurement,
          notes: formValue.notes || undefined,
          isDraft: isDraft
        };

        this.treatmentPlanService.createTreatmentPlan(treatmentRequest).subscribe({
          next: (response) => this.handleSuccess(
            isDraft ? 'Treatment plan draft saved successfully' : 'Treatment plan created successfully', 
            response
          ),
          error: (error) => this.handleError(
            isDraft ? 'Failed to save treatment plan draft' : 'Failed to create treatment plan', 
            error
          )
        });
        break;
    }
  }

  private updateNote(noteType: string, isDraft: boolean = false): void {
    const formValue = this.noteForm.value;
    console.log('Updating note:', this.noteId, 'Type:', noteType, 'IsDraft:', isDraft);

    switch (noteType) {
      case 'soap':
        const soapRequest = {
          patientId: formValue.patientId,
          therapistId: formValue.therapistId,
          sessionDate: formValue.sessionDate,
          sessionDurationMinutes: formValue.sessionDurationMinutes,
          sessionType: formValue.sessionType,
          nextSessionDate: formValue.nextSessionDate || undefined,
          subjective: formValue.subjective,
          objective: formValue.objective,
          assessment: formValue.assessment,
          plan: formValue.plan,
          additionalNotes: formValue.additionalNotes || undefined,
          isDraft: isDraft
        };

        console.log('SOAP Update Request:', soapRequest);
        this.soapNoteService.updateSOAPNote(this.noteId!, soapRequest).subscribe({
          next: (response) => this.handleSuccess(
            isDraft ? 'SOAP note draft updated successfully' : 'SOAP note updated successfully', 
            response
          ),
          error: (error) => this.handleError(
            isDraft ? 'Failed to update SOAP note draft' : 'Failed to update SOAP note', 
            error
          )
        });
        break;

      case 'progress':
        const progressRequest:any = {
          patientId: formValue.patientId,
          therapistId: formValue.therapistId,
          sessionDate: formValue.sessionDate,
          sessionDurationMinutes: formValue.sessionDurationMinutes,
          sessionType: formValue.sessionType,
          nextSessionDate: formValue.nextSessionDate || undefined,
          progressSummary: formValue.currentStatus,
          goalProgress: formValue.progressTowardGoals,
          interventionsUsed: formValue.interventionsUsed,
          patientResponse: formValue.patientResponse,
          clinicalObservations: formValue.barriers || undefined,
          nextSteps: formValue.planForNextSession,
          isDraft: isDraft
        };

        console.log('Progress Update Request:', progressRequest);
        this.progressNoteService.updateProgressNote(this.noteId!, progressRequest).subscribe({
          next: (response) => this.handleSuccess(
            isDraft ? 'Progress note draft updated successfully' : 'Progress note updated successfully', 
            response
          ),
          error: (error) => this.handleError(
            isDraft ? 'Failed to update progress note draft' : 'Failed to update progress note', 
            error
          )
        });
        break;

      case 'treatment':
        const treatmentRequest = {
          
          patientId: formValue.patientId,
          therapistId: formValue.therapistId,
          startDate: formValue.sessionDate,
          endDate: formValue.nextSessionDate || undefined,
          diagnosis: formValue.diagnosis,
          frequency: formValue.frequency,
          duration: formValue.duration,
          problemStatement: formValue.problemStatement,
          goals: formValue.goals,
          objectives: formValue.objectives,
          interventions: formValue.interventions,
          progressMeasurement: formValue.progressMeasurement,
          notes: formValue.notes || undefined,
          isDraft: isDraft
        };

        console.log('Treatment Update Request:', treatmentRequest);
        this.treatmentPlanService.updateTreatmentPlan(this.noteId!, treatmentRequest).subscribe({
          next: (response) => this.handleSuccess(
            isDraft ? 'Treatment plan draft updated successfully' : 'Treatment plan updated successfully', 
            response
          ),
          error: (error) => this.handleError(
            isDraft ? 'Failed to update treatment plan draft' : 'Failed to update treatment plan', 
            error
          )
        });
        break;
    }
  }

  private handleSuccess(message: string, response: any): void {
    this.isLoading = false;
    this.loader.hide();
    this.toastr.success(response.message || message);
    this.noteNavigationService.clearNoteData();
    this.router.navigate(['/notes/noteslist']);
  }

  private handleError(defaultMessage: string, error: any): void {
    this.isLoading = false;
    this.loader.hide();
    console.error('Error:', error);
    const errorMessage = error.error?.message || defaultMessage;
    this.toastr.error(errorMessage);
  }

  // Save as draft functionality
  saveDraft(): void {
    this.formSubmitted = true;

    const basicFieldsValid = this.noteForm.get('patientId')?.valid && 
                            this.noteForm.get('therapistId')?.valid && 
                            this.noteForm.get('sessionDate')?.valid;

    if (!basicFieldsValid) {
      this.markFormGroupTouched();
      this.toastr.error('Please fill basic information (Patient, Therapist, and Date)');
      this.selectedTab = 'basic-info';
      return;
    }

    this.isLoading = true;
    this.loader.show();

    const formValue = this.noteForm.value;
    const noteType = formValue.noteType;

    if (this.isEditMode && this.noteId) {
      this.updateNote(noteType, true);
    } else {
      this.createNote(noteType, true);
    }
  }

  // Check if edit is allowed (only for draft notes)
  canEdit(): boolean {
    return this.isEditMode && this.currentNoteStatus === 'draft';
  }

  cancel(): void {
    if (this.noteForm.dirty) {
      const confirmLeave = confirm('You have unsaved changes. Are you sure you want to leave?');
      if (!confirmLeave) return;
    }
    this.noteNavigationService.clearNoteData();
    this.router.navigate(['/notes/noteslist']);
  }

  private markFormGroupTouched(): void {
    Object.keys(this.noteForm.controls).forEach(key => {
      const control = this.noteForm.get(key);
      if (control && control.invalid) {
        control.markAsTouched();
      }
    });
  }

  getNoteTypeLabel(type: string): string {
    const labels: { [key: string]: string } = {
      'soap': 'SOAP Note',
      'progress': 'Progress Note',
      'treatment': 'Treatment Plan',
      'treatment_plan': 'Treatment Plan',
      'dap': 'DAP Note'
    };
    return labels[type] || type;
  }

  getSubmitButtonText(): string {
    const noteTypeLabel = this.getNoteTypeLabel(this.noteType);
    if (this.isEditMode) {
      return this.currentNoteStatus === 'draft' ? `Update ${noteTypeLabel}` : `Finalize ${noteTypeLabel}`;
    } else {
      return `Create ${noteTypeLabel}`;
    }
  }

  // Get button text for draft save
  getDraftButtonText(): string {
    return this.isEditMode ? 'Update Draft' : 'Save Draft';
  }
}