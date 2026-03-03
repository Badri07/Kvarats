import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { inject, signal, computed, OnInit } from '@angular/core';
import { PatientService } from '../../../service/patient/patients-service';
import { Patient } from '../../../models/patients.model';
import { TosterService } from '../../../service/toaster/tostr.service';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AppointmentType } from '../../../models/appointment.model';
import { PopupService } from '../../../service/popup/popup-service';
import { AdminService } from '../../../service/admin/admin.service';
import { AuthService } from '../../../service/auth/auth.service';
import { SoapNoteService } from '../../../service/note/soap.notes.services';
import { ProgressNoteService } from '../../../service/note/progress.note.service';
import { TreatmentPlanService } from '../../../service/note/treatment.note.service';
import { BreadcrumbService } from '../../../shared/breadcrumb/breadcrumb.service';

@Component({
  selector: 'app-notes-dashboard',
  standalone: false,
  templateUrl: './notes-dashboard.component.html',
  styleUrl: './notes-dashboard.component.scss'
})
export class NotesDashboardComponent implements OnInit {
  private patientService = inject(PatientService);
  private soapNoteService = inject(SoapNoteService);
  private progressNoteService = inject(ProgressNoteService);
  private treatmentPlanService = inject(TreatmentPlanService);
  private router = inject(Router);

  notes = signal<any[]>([]);
  templates = signal<any[]>([]);
  patients = signal<Patient[]>([]);
  isLoading = signal(true);

  // Computed values for stats
  totalNotes = computed(() => this.notes().length);
  completedNotes = computed(() => this.notes().filter(n => 
    n.status === 'completed' || n.status === 'signed' || !n.isDraft
  ).length);
  pendingNotes = computed(() => this.notes().filter(n => 
    n.status === 'draft' || n.isDraft
  ).length);
  treatmentPlans = computed(() => this.notes().filter(n => 
    n.type === 'treatment_plan' || n.type === 'treatment'
  ).length);
  completionRate = computed(() => {
    const total = this.totalNotes();
    const completed = this.completedNotes();
    return total > 0 ? Math.round((completed / total) * 100) : 0;
  });

  // Recent notes (last 5)
  recentNotes = computed(() => 
    this.notes()
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5)
  );

  public fb = inject(FormBuilder);
  scheduleForm: FormGroup = this.fb.group({
    appointmentType: [AppointmentType.THERAPY_SESSION, Validators.required],
    title: [''],
    notes: [''],
    meetingTypeInput: ['']
  });
  uploadForm!: FormGroup;

  constructor(
    private _toastr: TosterService,
    private _loader: PopupService,
  ) {}

  public breadcrumbService = inject(BreadcrumbService)
  ngOnInit(): void {

    this.breadcrumbService.setBreadcrumbs([
      { label: 'Notes', url: 'notes' },
      { label: '', url: '' },
    ]);

    this.uploadForm = this.fb.group({
      files: [null]
    });
    this.loadData();
  }
patientList:any[]=[];
  loadData(): void {
    this.isLoading.set(true);
    // Load patients first
    this.patientService.getPatients().subscribe({
      next: (patients) => {
        console.log("Patients loaded:", patients);
        this.patients.set(patients);
        this.patientList = patients
        this.loadAllNotes();
        this.isLoading.set(false);
      },
      error: (error) => {
        console.error("Failed to load patients:", error);
        this.isLoading.set(false);
      }
    });
  }

  loadAllNotes(): void {
    const allNotes: any[] = [];
    let loadedCount = 0;
    const totalServices = 3;

    const checkCompletion = () => {
      loadedCount++;
      if (loadedCount === totalServices) {
        console.log("All notes loaded:", allNotes);
        this.notes.set(allNotes);
        this.isLoading.set(false);
      }
    };

    this._adminservice.getLatestNotes().subscribe({
      next: (soapNotes: any[]) => {
        console.log("SOAP notes:", soapNotes);
        const mappedSOAPNotes = soapNotes.map(note => this.mapSOAPToNote(note));
        allNotes.push(...mappedSOAPNotes);
        checkCompletion();
      },
      error: (error) => {
        console.error("Failed to load SOAP notes:", error);
        checkCompletion();
      }
    });

    // // Load Progress Notes
    // this.progressNoteService.getAllProgressNotes().subscribe({
    //   next: (progressNotes: any) => {
    //     console.log("Progress notes:", progressNotes);
    //     const mappedProgressNotes = Array.isArray(progressNotes) 
    //       ? progressNotes.map(note => this.mapProgressToNote(note))
    //       : [];
    //     allNotes.push(...mappedProgressNotes);
    //     checkCompletion();
    //   },
    //   error: (error) => {
    //     console.error("Failed to load progress notes:", error);
    //     checkCompletion();
    //   }
    // });

    // // Load Treatment Plans
    // this.treatmentPlanService.getTreatmentList().subscribe({
    //   next: (treatmentNotes: any[]) => {
    //     console.log("Treatment notes:", treatmentNotes);
    //     const mappedTreatmentNotes = Array.isArray(treatmentNotes)
    //       ? treatmentNotes.map(note => this.mapTreatmentToNote(note))
    //       : [];
    //     allNotes.push(...mappedTreatmentNotes);
    //     checkCompletion();
    //   },
    //   error: (error) => {
    //     console.error("Failed to load treatment notes:", error);
    //     checkCompletion();
    //   }
    // });
  }

  private mapSOAPToNote(soapNote: any): any {
    return {
      id: soapNote.id,
      clientId: soapNote.patientId,
      therapistId: soapNote.therapistId,
      type: 'soap',
      status: this.getNoteStatus(soapNote.isDraft),
      title: `${soapNote.patientName} - SOAP Note - ${new Date(soapNote.sessionDate).toLocaleDateString()}`,
      content: {
        subjective: soapNote.subjective,
        objective: soapNote.objective,
        assessment: soapNote.assessment,
        plan: soapNote.plan
      },
      tags: soapNote.sessionType ? [soapNote.sessionType] : [],
      isConfidential: false,
      createdAt: new Date(soapNote.createdAt),
      updatedAt: new Date(soapNote.updatedAt || soapNote.createdAt),
      version: soapNote.version || 1,
      // Additional fields for display
      patientName: soapNote.patientName,
      therapistName: soapNote.therapistName,
      sessionDate: soapNote.sessionDate,
      sessionDurationMinutes: soapNote.sessionDurationMinutes,
      sessionType: soapNote.sessionType,
      isLatest: soapNote.isLatest,
      isDraft: soapNote.isDraft
    };
  }

  private mapProgressToNote(progressNote: any): any {
    return {
      id: progressNote.id,
      clientId: progressNote.patientId,
      therapistId: progressNote.therapistId,
      type: 'progress',
      status: this.getNoteStatus(progressNote.isDraft),
      title: `${progressNote.patientName} - Progress Note - ${new Date(progressNote.sessionDate).toLocaleDateString()}`,
      content: {
        progressSummary: progressNote.progressSummary,
        clinicalObservations: progressNote.clinicalObservations,
        patientResponse: progressNote.patientResponse,
        nextSteps: progressNote.nextSteps
      },
      tags: progressNote.sessionType ? [progressNote.sessionType] : [],
      isConfidential: false,
      createdAt: new Date(progressNote.createdAt),
      updatedAt: new Date(progressNote.updatedAt || progressNote.createdAt),
      version: progressNote.version || 1,
      patientName: progressNote.patientName,
      therapistName: progressNote.therapistName,
      sessionDate: progressNote.sessionDate,
      sessionDurationMinutes: progressNote.sessionDurationMinutes,
      sessionType: progressNote.sessionType,
      isLatest: progressNote.isLatest,
      isDraft: progressNote.isDraft,
      progressSummary: progressNote.progressSummary,
      goalProgress: progressNote.goalProgress,
      interventionsUsed: progressNote.interventionsUsed,
      patientResponse: progressNote.patientResponse,
      clinicalObservations: progressNote.clinicalObservations,
      nextSteps: progressNote.nextSteps
    };
  }

  private mapTreatmentToNote(treatmentNote: any): any {
    return {
      id: treatmentNote.id,
      clientId: treatmentNote.patientId,
      therapistId: treatmentNote.therapistId,
      type: 'treatment_plan',
      status: this.getNoteStatus(treatmentNote.isDraft),
      title: `${treatmentNote.patientName} - Treatment Plan - ${new Date(treatmentNote.startDate).toLocaleDateString()}`,
      content: {
        presentingProblem: treatmentNote.presentingProblem,
        objectives: treatmentNote.objectives,
        treatmentGoals: treatmentNote.treatmentGoals,
        interventions: treatmentNote.interventions
      },
      tags: [],
      isConfidential: false,
      createdAt: new Date(treatmentNote.createdAt),
      updatedAt: new Date(treatmentNote.updatedAt || treatmentNote.createdAt),
      version: treatmentNote.version || 1,
      patientName: treatmentNote.patientName,
      therapistName: treatmentNote.therapistName,
      sessionDate: treatmentNote.startDate,
      isLatest: treatmentNote.isLatest,
      isDraft: treatmentNote.isDraft,
      presentingProblem: treatmentNote.presentingProblem,
      treatmentGoals: treatmentNote.treatmentGoals,
      interventions: treatmentNote.interventions,
      objectives: treatmentNote.objectives,
      startDate: treatmentNote.startDate,
      estimatedEndDate: treatmentNote.estimatedEndDate,
      estimatedSessions: treatmentNote.estimatedSessions
    };
  }

  private getNoteStatus(isDraft: boolean): string {
    return isDraft ? 'draft' : 'completed';
  }

  createNewNote(): void {
    this.router.navigate(['/notes/new']);
  }

  createSOAPNote(): void {
    this.router.navigate(['/notes/new'], { queryParams: { type: 'soap' } });
  }

  createProgressNote(): void {
    this.router.navigate(['/notes/new'], { queryParams: { type: 'progress' } });
  }

  createTreatmentPlan(): void {
    this.router.navigate(['/notes/new'], { queryParams: { type: 'treatment_plan' } });
  }

  // createAssessment(): void {
  //   this.showInitialPopup = true;
  // }

  viewNote(noteId: string): void {
    this.router.navigate(['/notes', noteId]);
  }

  viewAllNotes(): void {
    this.router.navigate(['/notes/noteslist']);
  }

  useTemplate(templateId: string): void {
    this.router.navigate(['/notes/new'], { queryParams: { template: templateId } });
  }

  manageTemplates(): void {
    this.router.navigate(['/notes/templates']);
  }

  getClientName(clientId: string): string {
    debugger
    const patient = this.patients().find(p => p.id === clientId);
    return patient ? `${patient.firstName} ${patient.lastName}` : 'Unknown Client';
  }

  getNoteTypeLabel(type: string): string {
    const labels: { [key: string]: string } = {
      'soap': 'SOAP',
      'dap': 'DAP',
      'progress': 'Progress',
      'intake': 'Intake',
      'assessment': 'Assessment',
      'treatment_plan': 'Treatment Plan',
      'treatment': 'Treatment Plan',
      'discharge': 'Discharge',
      'crisis': 'Crisis'
    };
    return labels[type] || type;
  }

  showInitialPopup = false;
  isshowupload: boolean = false;
  userChoice!: string;
  
  selectedFiles: { name: string; status: string }[] = [];
  fileListToUpload!: FileList;
  uploadError: string | null = null;

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;

    if (input.files && input.files.length > 0) {
      const allowedTypes = [
        'application/pdf',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'image/jpeg'
      ];
      const maxSize = 10 * 1024 * 1024;
      const files = Array.from(input.files);

      this.uploadError = null;

      for (const file of files) {
        if (!allowedTypes.includes(file.type)) {
          this.uploadError = `File type not allowed: ${file.name}`;
          input.value = '';
          return;
        }
        if (file.size > maxSize) {
          this.uploadError = `File too large (max 10MB): ${file.name}`;
          input.value = '';
          return;
        }
      }

      this.selectedFiles = files.map(file => ({
        name: file.name,
        status: 'Pending'
      }));

      this.uploadForm.patchValue({ files: input.files });
      this.uploadForm.get('files')?.updateValueAndValidity();
      this.fileListToUpload = input.files;
    }
  }

  private _adminservice = inject(AdminService)
  private _authservice = inject(AuthService)

  openPdfUpload() {
    this.userChoice = 'uploadPdf';
    this.showInitialPopup = false;
    this.isshowupload = true;
  }

  setPatientId!: any;
  setAssesmentId!: any;

  openAssessmentForm() {

  }

  uploadedUrl!: string;

  upload(): void {
    if (!this.fileListToUpload || this.fileListToUpload.length === 0) {
      alert("At least one file must be uploaded.");
      return;
    }
    this._loader.show();
    const formData = new FormData();
    Array.from(this.fileListToUpload).forEach(file => {
      formData.append('files', file);
    });

    const folder = 'patientassessment';

    this._adminservice.fileUpload(formData, folder).subscribe({
      next: (res) => {
        console.log('Success:', res);
        console.log('Success:', res.urls);
        this.uploadedUrl = res?.urls;
        this._loader.hide();
        this.selectedFiles = this.selectedFiles.map(f => ({
          ...f,
          status: 'Success'
        }));

        const patientData: any = {
          patientId: this.setPatientId,
          assessmentId: this.setAssesmentId,
          isFileUpload: true,
          fileUrl: this.uploadedUrl,
        };
        this._adminservice.savePatientAssessment(patientData).subscribe({
          next: (res) => {
            console.log('Assessment saved successfully', res);
            this._toastr.success(res.data.message);
            this.isshowupload = false;
            this.showInitialPopup = false;
          },
          error: (err) => {
            this._loader.hide();
            const errorMessage = err.error?.message;
            this._toastr.error(errorMessage);
          }
        });
      },
      error: (err) => {
        console.error('Upload failed:', err);
        this.selectedFiles = this.selectedFiles.map(f => ({
          ...f,
          status: 'Failed'
        }));
      }
    });
  }

  closeAll() {
    this.showInitialPopup = false;
    this.isshowupload = false;
  }

  createAssessment() {
      this.router.navigate(['patients/assessment']);
  }

  createDischargeSummary(){

  }

  createDAPNote(){

  }

  createCrisisNote(){
    
  }

  // createDAPNote(){

  // }


  cancelPdf() {
    this.isshowupload = false;
  }
}