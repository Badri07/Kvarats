import { Component, Input, OnChanges, SimpleChanges, OnInit, DoCheck, Inject, ChangeDetectorRef, OnDestroy, inject } from '@angular/core';
import { NgForm } from '@angular/forms';
import { AdminService } from '../../../service/admin/admin.service';
import { ActivatedRoute } from '@angular/router';
import { PopupService } from '../../../service/popup/popup-service';
import { Subject, debounceTime, distinctUntilChanged, takeUntil } from 'rxjs';
import { AuthService } from '../../../service/auth/auth.service';
import { PatientService } from '../../../service/patient/patients-service';
import { CreateInitialAssessmentRequest, InitialAssessmentDto } from '../../../admin/notes/models/initial-assessment.model';
import { TosterService } from '../../../service/toaster/tostr.service';
import { DropdownService, DropdownValue } from '../../../admin/notes/services/dropdown.service';
import { MedicationDto, MedicationService } from '../../../admin/notes/services/medication.service';
import { InitialAssessmentService } from '../../../admin/notes/services/initial-assessment.service';
import { PdfGeneratorService } from '../../../admin/notes/services/pdf-generator.service';

type DropdownType = 'allergy' | 'medication' | 'medicationfrequency' | 'condition' | 'complaint' | 'smokingstatus' | 
                   'alcoholstatus' | 'beveragestatus' | 'drugusagestatus' | 'bloodgroup' | 
                   'severity' | 'alcoholfrequency' | 'surgerytype' | 'allergycategory' |'medicalcondition';
type SortDirection = 'asc' | 'desc';
type DropdownOption = { id: number; value: string; parentid: number; description:string };
interface ComplaintOption {
  id: number;
  name: string;
  description: string;
}

@Component({
  selector: 'app-patients-notes',
  standalone: false,
  templateUrl: './patients-notes.component.html',
  styleUrl: './patients-notes.component.scss'
})
export class PatientsNotesComponent {
  patientId: string | null = null;

  assessments: InitialAssessmentDto[] = [];
  selectedAssessment: InitialAssessmentDto | null = null;
  isEditing = false;
  isCreating = false;
  loading = false;
  error: string | null = null;
  activeSection: string = 'vitals';

  // Modal properties
  showDeleteModal = false;
  isDeleting = false;
  assessmentToDelete: InitialAssessmentDto | null = null;

  // Publish popup properties
  showPublishPopup = false;
  publishIds: any;

  assessmentForm: CreateInitialAssessmentRequest = this.getEmptyForm();

  bloodGroups: DropdownValue[] = [];
  chiefComplaints: any[] = [];
  allergyCategories: DropdownValue[] = [];
  allergySeverities: DropdownValue[] = [];
  medications: MedicationDto[] = [];
  medicationFrequencies: DropdownValue[] = [];
  chronicConditions: DropdownValue[] = [];
  surgeryTypes: DropdownValue[] = [];
  smokingStatuses: DropdownValue[] = [];
  alcoholStatuses: DropdownValue[] = [];
  alcoholFrequencies: DropdownValue[] = [];
  beverageStatuses: DropdownValue[] = [];
  drugUsageStatuses: DropdownValue[] = [];

  // Inject services
  public loader = inject(PopupService);
  public toastr = inject(TosterService);
  public _adminService = inject(PatientService);
  public _authService = inject(AuthService);

  constructor(
    private assessmentService: InitialAssessmentService,
    private pdfGenerator: PdfGeneratorService,
    private dropdownService: DropdownService,
    private medicationService: MedicationService
  ) {}

  ngOnInit(): void {
    this.patientId = this._authService.getPatientId();
    this.loadDropdowns();
    this.loadAssessments();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['patientId'] && this.patientId) {
      this.loadAssessments();
    }
  }

  // Helper methods for enhanced display
  getBMICategory(bmi: number): string {
    if (!bmi) return '';
    if (bmi < 18.5) return 'Underweight';
    if (bmi < 25) return 'Normal weight';
    if (bmi < 30) return 'Overweight';
    return 'Obese';
  }

  getSeverityBadgeClass(severity: string): string {
    if (!severity) return 'bg-gray-100 text-gray-800';
    switch (severity.toLowerCase()) {
      case 'mild':
        return 'bg-green-100 text-green-800';
      case 'moderate':
        return 'bg-yellow-100 text-yellow-800';
      case 'severe':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }

  loadDropdowns(): void {
    this._adminService.getChiefComplaintdata().subscribe({
      next: (data: any) => this.chiefComplaints = data,
      error: (err: any) => console.error('Failed to load chief complaints', err)
    });
    
    this._adminService.getDropdownsByCategory('Blood Group').subscribe({
      next: (data: any) => this.bloodGroups = data.data,
      error: (err: any) => console.error('Failed to load blood groups', err)
    });

    this._adminService.getDropdownsByCategory('Allergy Category').subscribe({
      next: (data: any) => this.allergyCategories = data.data,
      error: (err: any) => console.error('Failed to load allergy categories', err)
    });

    this._adminService.getDropdownsByCategory('Allergy Severity').subscribe({
      next: (data: any) => this.allergySeverities = data.data,
      error: (err: any) => console.error('Failed to load allergy severities', err)
    });

    this._adminService.getAllMedications().subscribe({
      next: (data: any) => this.medications = data.data,
      error: (err: any) => console.error('Failed to load medications', err)
    });

    this._adminService.getDropdownsByCategory('Medication Frequency').subscribe({
      next: (data: any) => this.medicationFrequencies = data.data,
      error: (err: any) => console.error('Failed to load medication frequencies', err)
    });

    this._adminService.getDropdownsByCategory('Chronic Condition').subscribe({
      next: (data: any) => this.chronicConditions = data.data,
      error: (err: any) => console.error('Failed to load chronic conditions', err)
    });

    this._adminService.getDropdownsByCategory('Surgery Type').subscribe({
      next: (data: any) => this.surgeryTypes = data.data,
      error: (err: any) => console.error('Failed to load surgery types', err)
    });

    this._adminService.getDropdownsByCategory('Smoking Status').subscribe({
      next: (data: any) => this.smokingStatuses = data.data,
      error: (err: any) => console.error('Failed to load smoking statuses', err)
    });

    this._adminService.getDropdownsByCategory('Alcohol Status').subscribe({
      next: (data: any) => this.alcoholStatuses = data.data,
      error: (err: any) => console.error('Failed to load alcohol statuses', err)
    });

    this._adminService.getDropdownsByCategory('Alcohol Frequency').subscribe({
      next: (data: any) => this.alcoholFrequencies = data.data,
      error: (err: any) => console.error('Failed to load alcohol frequencies', err)
    });

    this._adminService.getDropdownsByCategory('Beverage Status').subscribe({
      next: (data: any) => this.beverageStatuses = data.data,
      error: (err: any) => console.error('Failed to load beverage statuses', err)
    });

    this._adminService.getDropdownsByCategory('Drugusage Status').subscribe({
      next: (data: any) => this.drugUsageStatuses = data.data,
      error: (err: any) => console.error('Failed to load drug usage statuses', err)
    });
  }

  calculateBMI(): void {
    if (this.assessmentForm.weight && this.assessmentForm.height) {
      const heightInMeters = this.assessmentForm.height / 100;
      this.assessmentForm.bmi = parseFloat((this.assessmentForm.weight / (heightInMeters * heightInMeters)).toFixed(2));
    } else {
      this.assessmentForm.bmi = undefined;
    }
  }

  getEmptyForm(): CreateInitialAssessmentRequest {
    return {
      patientId: '',
      isDraft: true,
      chiefComplaints: [],
      allergies: [],
      medications: [],
      chronicConditions: [],
      surgeries: [],
      familyHistory: [],
      socialHabits: []
    };
  }

  loadAssessments(): void {
    if (!this.patientId) return;

    this.loading = true;
    this.error = null;

    this._adminService.getInitialAssessmentsByPatientId(this.patientId).subscribe({
      next: (assessments: any) => {
        this.assessments = assessments;
        this.loading = false;
      },
      error: (err: any) => {
        this.error = 'Failed to load assessments';
        this.loading = false;
        this.toastr.error('Failed to load assessments');
      }
    });
  }

  selectAssessment(assessment: InitialAssessmentDto): void {
    this.selectedAssessment = assessment;
    this.isEditing = false;
    this.isCreating = false;
    this.activeSection = 'vitals';
  }

  startEdit(): void {
    if (!this.selectedAssessment) return;

    this.isEditing = true;
    this.assessmentForm = {
      patientId: this.selectedAssessment.patientId,
      isDraft: this.selectedAssessment.isDraft,
      bloodGroupId: this.selectedAssessment.bloodGroupId,
      systolic: this.selectedAssessment.systolic,
      diastolic: this.selectedAssessment.diastolic,
      heartRate: this.selectedAssessment.heartRate,
      pulse: this.selectedAssessment.pulse,
      respiratoryRate: this.selectedAssessment.respiratoryRate,
      temperature: this.selectedAssessment.temperature,
      bloodSugar: this.selectedAssessment.bloodSugar,
      spO2: this.selectedAssessment.spO2,
      weight: this.selectedAssessment.weight,
      height: this.selectedAssessment.height,
      bmi: this.selectedAssessment.bmi,
      chiefComplaints: this.selectedAssessment.chiefComplaints.map(cc => ({
        chiefComplaintId: cc.chiefComplaintId,
        painScale: cc.painScale,
        notes: cc.notes,
        onsetDate: cc.onsetDate
      })),
      allergies: this.selectedAssessment.allergies.map(a => ({
        allergyLookupId: a.allergyLookupId,
        allergyCategoryId: a.allergyCategoryId,
        severityId: a.severityId,
        reactionDetails: a.reactionDetails,
        firstObserved: a.firstObserved,
        lastObserved: a.lastObserved
      })),
      medications: this.selectedAssessment.medications.map(m => ({
        medicationId: m.medicationId,
        dosage: m.dosage,
        frequency: m.frequency,
        startDate: m.startDate,
        endDate: m.endDate,
        reason: m.reason
      })),
      chronicConditions: this.selectedAssessment.chronicConditions.map(cc => ({
        chronicConditionLookupId: cc.chronicConditionLookupId,
        diagnosisDate: cc.diagnosisDate,
        treatmentDetails: cc.treatmentDetails,
        isControlled: cc.isControlled
      })),
      surgeries: this.selectedAssessment.surgeries.map(s => ({
        procedure: s.procedure,
        surgeryDate: s.surgeryDate,
        hospital: s.hospital,
        surgeonName: s.surgeonName,
        surgeryTypeId: s.surgeryTypeId,
        hadComplications: s.hadComplications,
        complicationDetails: s.complicationDetails
      })),
      familyHistory: this.selectedAssessment.familyHistory.map(fh => ({
        conditionId: fh.conditionId,
        relationship: fh.relationship,
        ageAtDiagnosis: fh.ageAtDiagnosis,
        isDeceased: fh.isDeceased,
        causeOfDeath: fh.causeOfDeath
      })),
      socialHabits: this.selectedAssessment.socialHabits.map(sh => ({
        smokingStatusId: sh.smokingStatusId,
        cigarettesPerDay: sh.cigarettesPerDay,
        yearsSmoking: sh.yearsSmoking,
        hasQuitSmoking: sh.hasQuitSmoking,
        smokingQuitDate: sh.smokingQuitDate,
        alcoholStatusId: sh.alcoholStatusId,
        alcoholFrequencyId: sh.alcoholFrequencyId,
        yearsDrinking: sh.yearsDrinking,
        beverageStatusId: sh.beverageStatusId,
        cupsPerDay: sh.cupsPerDay,
        drugUsageStatusId: sh.drugUsageStatusId,
        drugDetails: sh.drugDetails
      }))
    };
  }

  startCreate(): void {
    this.isCreating = true;
    this.isEditing = false;
    this.selectedAssessment = null;
    this.assessmentForm = this.getEmptyForm();
    this.assessmentForm.patientId = this.patientId!;
    this.activeSection = 'vitals';
  }

  saveAssessment(): void {
    this.loading = true;
    this.error = null;
    this.loader.show();

    if (this.isCreating) {
      this._adminService.createInitialAssessment(this.assessmentForm).subscribe({
        next: (assessment: any) => {
          this.assessments.unshift(assessment);
          this.selectedAssessment = assessment;
          this.isCreating = false;
          this.loading = false;
          this.loader.hide();
          this.toastr.success('Assessment created successfully');
        },
        error: (err: any) => {
          this.error = 'Failed to create assessment';
          this.loading = false;
          this.loader.hide();
          this.toastr.error('Failed to create assessment');
        }
      });
    } else if (this.isEditing && this.selectedAssessment) {
      this._adminService.updateInitialAssessment(this.selectedAssessment.id, this.assessmentForm).subscribe({
        next: (assessment: any) => {
          const index = this.assessments.findIndex(a => a.id === assessment.id);
          if (index !== -1) {
            this.assessments[index] = assessment;
          }
          this.selectedAssessment = assessment;
          this.isEditing = false;
          this.loading = false;
          this.loader.hide();
          this.toastr.success('Assessment updated successfully');
        },
        error: (err: any) => {
          this.error = 'Failed to update assessment';
          this.loading = false;
          this.loader.hide();
          this.toastr.error('Failed to update assessment');
        }
      });
    }
  }

  cancelEdit(): void {
    this.isEditing = false;
    this.isCreating = false;
  }

  confirmDelete(assessment: InitialAssessmentDto): void {
    this.assessmentToDelete = assessment;
    this.showDeleteModal = true;
  }

  deleteAssessment(): void {
    if (!this.assessmentToDelete) return;

    this.isDeleting = true;
    this.loader.show();

    this._adminService.deleteInitialAssessment(this.assessmentToDelete.id).subscribe({
      next: () => {
        this.assessments = this.assessments.filter(a => a.id !== this.assessmentToDelete!.id);
        if (this.selectedAssessment?.id === this.assessmentToDelete!.id) {
          this.selectedAssessment = null;
        }
        this.isDeleting = false;
        this.showDeleteModal = false;
        this.assessmentToDelete = null;
        this.loader.hide();
        this.toastr.success('Assessment deleted successfully');
      },
      error: (err: any) => {
        this.error = 'Failed to delete assessment';
        this.isDeleting = false;
        this.showDeleteModal = false;
        this.assessmentToDelete = null;
        this.loader.hide();
        this.toastr.error('Failed to delete assessment');
      }
    });
  }

  // Publish functionality
  openPublishPopup(id: any) {
    this.showPublishPopup = true;
    this.publishIds = id;
  }

  confirmPublish(): void {
    this.loader.show();
    this._adminService.publishDraft(this.publishIds).subscribe({
      next: (assessment: any) => {
        const index = this.assessments.findIndex(a => a.id === assessment.id);
        if (index !== -1) {
          this.assessments[index] = assessment;
        }
        if (this.selectedAssessment?.id === assessment.id) {
          this.selectedAssessment = assessment;
        }
        this.loader.hide();
        this.toastr.success('Assessment published successfully');
        this.showPublishPopup = false;
      },
      error: (err: any) => {
        this.loader.hide();
        this.toastr.error('Failed to publish assessment');
        this.error = 'Failed to publish assessment';
        this.showPublishPopup = false;
      }
    });
  }

  addChiefComplaint(): void {
    this.assessmentForm.chiefComplaints.push({
      chiefComplaintId: 0,
      notes: ''
    });
  }

  removeChiefComplaint(index: number): void {
    this.assessmentForm.chiefComplaints.splice(index, 1);
  }

  addAllergy(): void {
    this.assessmentForm.allergies.push({
      allergyLookupId: 0,
      allergyCategoryId: 0
    });
  }

  removeAllergy(index: number): void {
    this.assessmentForm.allergies.splice(index, 1);
  }

  addMedication(): void {
    this.assessmentForm.medications.push({
      medicationId: 0
    });
  }

  removeMedication(index: number): void {
    this.assessmentForm.medications.splice(index, 1);
  }

  addChronicCondition(): void {
    this.assessmentForm.chronicConditions.push({
      chronicConditionLookupId: 0
    });
  }

  removeChronicCondition(index: number): void {
    this.assessmentForm.chronicConditions.splice(index, 1);
  }

  addSurgery(): void {
    this.assessmentForm.surgeries.push({
      procedure: ''
    });
  }

  removeSurgery(index: number): void {
    this.assessmentForm.surgeries.splice(index, 1);
  }

  addFamilyHistory(): void {
    this.assessmentForm.familyHistory.push({});
  }

  removeFamilyHistory(index: number): void {
    this.assessmentForm.familyHistory.splice(index, 1);
  }

  addSocialHabit(): void {
    this.assessmentForm.socialHabits.push({});
  }

  removeSocialHabit(index: number): void {
    this.assessmentForm.socialHabits.splice(index, 1);
  }

  setActiveSection(section: string): void {
    this.activeSection = section;
  }

  downloadPDF(): void {
    if (this.selectedAssessment) {
      this.pdfGenerator.generateInitialAssessmentPDF(this.selectedAssessment);
      this.toastr.success('PDF download started');
    }
  }

  getAllergyTypes(categoryId: number): any[] {
    const category = this.allergyCategories.find(c => c.id === categoryId);
    return category?.children || [];
  }
  
}