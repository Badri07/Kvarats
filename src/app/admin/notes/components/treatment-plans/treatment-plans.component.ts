import { Component, Input, OnChanges, SimpleChanges, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TreatmentPlanService } from '../../services/treatment-plan.service';
import { PdfGeneratorService } from '../../services/pdf-generator.service';
import { TreatmentPlanDto, CreateTreatmentPlanRequest } from '../../models/treatment-plan.model';
import { TosterService } from '../../../../service/toaster/tostr.service';
import { PopupService } from '../../../../service/popup/popup-service';
import { ShareService } from '../../services/share.service';

@Component({
  selector: 'app-treatment-plans',
  standalone: false,
  templateUrl: './treatment-plans.component.html',
  styleUrls: ['./treatment-plans.component.scss']
})
export class TreatmentPlansComponent implements OnChanges {
  @Input() patientId: string | null = null;

  plans: TreatmentPlanDto[] = [];
  selectedPlan: TreatmentPlanDto | null = null;
  isEditing = false;
  isCreating = false;
  loading = false;
  error: string | null = null;

  // Modal properties
  showDeleteModal = false;
  isDeleting = false;
  planToDelete: TreatmentPlanDto | null = null;

  // Publish popup properties
  showPublishPopup = false;
  publishIds: any;

  planForm: CreateTreatmentPlanRequest = this.getEmptyForm();

  // Inject services
  public toastr = inject(TosterService);
  public loader = inject(PopupService);

  constructor(
    private treatmentPlanService: TreatmentPlanService,
    private pdfGenerator: PdfGeneratorService,
    private shareService: ShareService
  ) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['patientId'] && this.patientId) {
      this.loadPlans();
    }
  }

  getEmptyForm(): CreateTreatmentPlanRequest {
    return {
      patientId: '',
      isDraft: true,
      presentingProblem: '',
      treatmentGoals: '',
      interventions: '',
      objectives: '',
      targetSymptoms: '',
      strengths: '',
      barriers: '',
      startDate: '',
      estimatedEndDate: '',
      estimatedSessions: undefined,
      nextReviewDate: '',
      reviewNotes: ''
    };
  }

  loadPlans(): void {
    if (!this.patientId) return;

    this.loading = true;
    this.error = null;

    this.treatmentPlanService.getTreatmentPlansByPatientId(this.patientId).subscribe({
      next: (plans) => {
        this.plans = plans;
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Failed to load treatment plans';
        this.loading = false;
        this.toastr.error('Failed to load treatment plans');
      }
    });
  }

  selectPlan(plan: TreatmentPlanDto): void {
    this.selectedPlan = plan;
    this.isEditing = false;
    this.isCreating = false;
  }

  createNewPlan(): void {
    this.planForm = this.getEmptyForm();
    this.planForm.patientId = this.patientId || '';
    this.isCreating = true;
    this.isEditing = false;
    this.selectedPlan = null;
  }

  editPlan(plan: TreatmentPlanDto): void {
    this.planForm = {
      patientId: plan.patientId,
      isDraft: plan.isDraft,
      presentingProblem: plan.presentingProblem,
      treatmentGoals: plan.treatmentGoals,
      interventions: plan.interventions,
      objectives: plan.objectives || '',
      targetSymptoms: plan.targetSymptoms || '',
      strengths: plan.strengths || '',
      barriers: plan.barriers || '',
      startDate: plan.startDate ? plan.startDate.split('T')[0] : '',
      estimatedEndDate: plan.estimatedEndDate ? plan.estimatedEndDate.split('T')[0] : '',
      estimatedSessions: plan.estimatedSessions,
      nextReviewDate: plan.nextReviewDate ? plan.nextReviewDate.split('T')[0] : '',
      reviewNotes: plan.reviewNotes || ''
    };
    this.selectedPlan = plan;
    this.isEditing = true;
    this.isCreating = false;
  }

  savePlan(): void {
    this.loading = true;
    this.loader.show();

    if (this.isCreating) {
      this.treatmentPlanService.createTreatmentPlan(this.planForm).subscribe({
        next: (plan) => {
          this.plans = [plan, ...this.plans];
          this.selectedPlan = plan;
          this.isCreating = false;
          this.loading = false;
          this.loader.hide();
          this.toastr.success('Treatment plan created successfully');
        },
        error: (err) => {
          this.error = 'Failed to create treatment plan';
          this.loading = false;
          this.loader.hide();
          this.toastr.error('Failed to create treatment plan');
        }
      });
    } else if (this.isEditing && this.selectedPlan) {
      this.treatmentPlanService.updateTreatmentPlan(this.selectedPlan.id, this.planForm).subscribe({
        next: (plan) => {
          const index = this.plans.findIndex(p => p.id === plan.id);
          if (index !== -1) {
            this.plans[index] = plan;
          }
          this.selectedPlan = plan;
          this.isEditing = false;
          this.loading = false;
          this.loader.hide();
          this.toastr.success('Treatment plan updated successfully');
        },
        error: (err) => {
          this.error = 'Failed to update treatment plan';
          this.loading = false;
          this.loader.hide();
          this.toastr.error('Failed to update treatment plan');
        }
      });
    }
  }

  confirmDelete(plan: TreatmentPlanDto): void {
    this.planToDelete = plan;
    this.showDeleteModal = true;
  }

  deletePlan(): void {
    if (!this.planToDelete) return;

    this.isDeleting = true;
    this.loader.show();

    this.treatmentPlanService.deleteTreatmentPlan(this.planToDelete.id).subscribe({
      next: () => {
        this.plans = this.plans.filter(p => p.id !== this.planToDelete!.id);
        if (this.selectedPlan?.id === this.planToDelete!.id) {
          this.selectedPlan = null;
        }
        this.isDeleting = false;
        this.showDeleteModal = false;
        this.planToDelete = null;
        this.loader.hide();
        this.toastr.success('Treatment plan deleted successfully');
      },
      error: (err) => {
        this.error = 'Failed to delete treatment plan';
        this.isDeleting = false;
        this.showDeleteModal = false;
        this.planToDelete = null;
        this.loader.hide();
        this.toastr.error('Failed to delete treatment plan');
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
    this.treatmentPlanService.publishDraft(this.publishIds).subscribe({
      next: (plan) => {
        const index = this.plans.findIndex(p => p.id === plan.id);
        if (index !== -1) {
          this.plans[index] = plan;
        }
        if (this.selectedPlan?.id === plan.id) {
          this.selectedPlan = plan;
        }
        this.loader.hide();
        this.toastr.success('Treatment plan published successfully');
        this.showPublishPopup = false;
      },
      error: (err) => {
        this.loader.hide();
        this.toastr.error('Failed to publish treatment plan');
        this.error = 'Failed to publish treatment plan';
        this.showPublishPopup = false;
      }
    });
  }

  cancelEdit(): void {
    this.isEditing = false;
    this.isCreating = false;
    this.planForm = this.getEmptyForm();
  }

  downloadPDF(): void {
    if (this.selectedPlan) {
      this.pdfGenerator.generateTreatmentPlanPDF(this.selectedPlan);
      this.toastr.success('PDF download started');
    }
  }

  get hasPublishedPlans(): boolean {
    return this.plans.some(plan => !plan.isDraft);
  }

  onShare(): void {
    if (!this.selectedPlan) {
      return;
    }
    this.loading = true;
    this.shareService.shareTreatmentplansToPatient(this.selectedPlan.id).subscribe({      
      next: (res) => {
        this.toastr.success(res.message || 'Notes shared to patient successfully');
        this.loading = false;
      },
      error: () => {
        this.toastr.error('Failed to share');
        this.loading = false;
      }
    });
  }
}