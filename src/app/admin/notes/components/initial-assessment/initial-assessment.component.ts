import { Component, inject, Input, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { InitialAssessmentService } from '../../services/initial-assessment.service';
import { PdfGeneratorService } from '../../services/pdf-generator.service';
import {
  InitialAssessmentDto,
  CreateInitialAssessmentRequest,
  CreatePatientChiefComplaintRequest,
  CreatePatientAllergyRequest,
  CreatePatientMedicationRequest,
  CreatePatientChronicConditionRequest,
  CreatePatientSurgeryRequest,
  CreatePatientFamilyHistoryRequest,
  CreatePatientSocialHabitRequest
} from '../../models/initial-assessment.model';
import { DropdownService, DropdownValue } from '../../services/dropdown.service';
import { MedicationDto, MedicationService } from '../../services/medication.service';
import { AdminService } from '../../../../service/admin/admin.service';
import { TosterService } from '../../../../service/toaster/tostr.service';
import { PopupService } from '../../../../service/popup/popup-service';

@Component({
  selector: 'app-initial-assessment',
  standalone: false,
  templateUrl: './initial-assessment.component.html',
  styleUrls: ['./initial-assessment.component.scss']
})
export class InitialAssessmentComponent implements OnChanges {
  @Input() patientId: string | null = null;

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
  public toastr = inject(TosterService);
  public loader = inject(PopupService);

  constructor(
    private assessmentService: InitialAssessmentService,
    private pdfGenerator: PdfGeneratorService,
    private dropdownService: DropdownService,
    private medicationService: MedicationService
  ) {}

  public _adminService = inject(AdminService);

  ngOnInit(): void {
    this.loadDropdowns();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['patientId'] && this.patientId) {
      this.loadAssessments();
    }
  }

  loadDropdowns(): void {
    this._adminService.getChiefComplaintdata().subscribe({
      next: (data:any) => this.chiefComplaints = data,
      error: (err:any) => console.error('Failed to load blood groups', err)
    });
    
    this.dropdownService.getDropdownsByCategory('Blood Group').subscribe({
      next: (data:any) => this.bloodGroups = data.data,
      error: (err:any) => console.error('Failed to load blood groups', err)
    });

    this.dropdownService.getDropdownsByCategory('Allergy Category').subscribe({
      next: (data:any) => this.allergyCategories = data.data,
      error: (err:any) => console.error('Failed to load allergy categories', err)
    });

    this.dropdownService.getDropdownsByCategory('Allergy Severity').subscribe({
      next: (data:any) => this.allergySeverities = data.data,
      error: (err:any) => console.error('Failed to load allergy severities', err)
    });

    this.medicationService.getAllMedications().subscribe({
      next: (data:any) => this.medications = data.data,
      error: (err:any) => console.error('Failed to load medications', err)
    });

    this.dropdownService.getDropdownsByCategory('Medication Frequency').subscribe({
      next: (data:any) => this.medicationFrequencies = data.data,
      error: (err:any) => console.error('Failed to load medication frequencies', err)
    });

    this.dropdownService.getDropdownsByCategory('Chronic Condition').subscribe({
      next: (data:any) => this.chronicConditions = data.data,
      error: (err:any) => console.error('Failed to load chronic conditions', err)
    });

    this.dropdownService.getDropdownsByCategory('Surgery Type').subscribe({
      next: (data:any) => this.surgeryTypes = data.data,
      error: (err:any) => console.error('Failed to load surgery types', err)
    });

    this.dropdownService.getDropdownsByCategory('Smoking Status').subscribe({
      next: (data:any) => this.smokingStatuses = data.data,
      error: (err:any) => console.error('Failed to load smoking statuses', err)
    });

    this.dropdownService.getDropdownsByCategory('Alcohol Status').subscribe({
      next: (data:any) => this.alcoholStatuses = data.data,
      error: (err:any) => console.error('Failed to load alcohol statuses', err)
    });

    this.dropdownService.getDropdownsByCategory('Alcohol Frequency').subscribe({
      next: (data:any) => this.alcoholFrequencies = data.data,
      error: (err:any) => console.error('Failed to load alcohol frequencies', err)
    });

    this.dropdownService.getDropdownsByCategory('Beverage Status').subscribe({
      next: (data:any) => this.beverageStatuses = data.data,
      error: (err:any) => console.error('Failed to load beverage statuses', err)
    });

    this.dropdownService.getDropdownsByCategory('Drugusage Status').subscribe({
      next: (data:any) => this.drugUsageStatuses = data.data,
      error: (err:any) => console.error('Failed to load drug usage statuses', err)
    });
  }

  calculateBMI(): void {
    if (this.assessmentForm.weight && this.assessmentForm.height) {
      const heightInMeters = this.assessmentForm.height / 100;
      this.assessmentForm.bmi = parseFloat((this.assessmentForm.weight / (heightInMeters * heightInMeters)).toFixed(2));
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

    this.assessmentService.getInitialAssessmentsByPatientId(this.patientId).subscribe({
      next: (assessments) => {
        this.assessments = assessments;
        this.loading = false;
      },
      error: (err) => {
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
      this.assessmentService.createInitialAssessment(this.assessmentForm).subscribe({
        next: (assessment) => {
          this.assessments.unshift(assessment);
          this.selectedAssessment = assessment;
          this.isCreating = false;
          this.loading = false;
          this.loader.hide();
          this.toastr.success('Assessment created successfully');
        },
        error: (err) => {
          this.error = 'Failed to create assessment';
          this.loading = false;
          this.loader.hide();
          this.toastr.error('Failed to create assessment');
        }
      });
    } else if (this.isEditing && this.selectedAssessment) {
      this.assessmentService.updateInitialAssessment(this.selectedAssessment.id, this.assessmentForm).subscribe({
        next: (assessment) => {
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
        error: (err) => {
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

    this.assessmentService.deleteInitialAssessment(this.assessmentToDelete.id).subscribe({
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
      error: (err) => {
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
    this.assessmentService.publishDraft(this.publishIds).subscribe({
      next: (assessment) => {
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
      error: (err) => {
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