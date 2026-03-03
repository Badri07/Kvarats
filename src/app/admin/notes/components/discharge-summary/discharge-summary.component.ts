import { Component, inject, Input, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DischargeSummaryService } from '../../services/discharge-summary.service';
import { PdfGeneratorService } from '../../services/pdf-generator.service';
import { DischargeSummaryDto, CreateDischargeSummaryRequest } from '../../models/discharge-summary.model';
import { PopupService } from '../../../../service/popup/popup-service';
import { TosterService } from '../../../../service/toaster/tostr.service';
import { ShareService } from '../../services/share.service';

@Component({
  selector: 'app-discharge-summary',
  standalone: false,
  templateUrl: './discharge-summary.component.html',
  styleUrls: ['./discharge-summary.component.scss']
})
export class DischargeSummaryComponent implements OnChanges {
  @Input() patientId: string | null = null;

  summaries: DischargeSummaryDto[] = [];
  selectedSummary: DischargeSummaryDto | null = null;
  isEditing = false;
  isCreating = false;
  loading = false;
  error: string | null = null;

  // Modal properties
  showDeleteModal = false;
  isDeleting = false;
  summaryToDelete: DischargeSummaryDto | null = null;

  // Publish popup properties
  showPublishPopup = false;
  publishIds: any;

  summaryForm: CreateDischargeSummaryRequest = this.getEmptyForm();

  // Inject services
  public toastr = inject(TosterService);
  public loader = inject(PopupService);

  constructor(
    private dischargeSummaryService: DischargeSummaryService,
    private pdfGenerator: PdfGeneratorService,
    private shareService: ShareService
  ) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['patientId'] && this.patientId) {
      this.loadSummaries();
    }
  }

  getEmptyForm(): CreateDischargeSummaryRequest {
    return {
      patientId: '',
      isDraft: true,
      reasonForTreatment: '',
      treatmentProvided: '',
      outcomeAchieved: '',
      reasonForDischarge: '',
      recommendations: '',
      followUpInstructions: '',
      prognosis: '',
      referralsProvided: '',
      treatmentStartDate: '',
      treatmentEndDate: '',
      totalSessions: 0,
      primaryDiagnosis: '',
      secondaryDiagnosis: '',
      dischargeDate: new Date().toISOString().split('T')[0],
      dischargeStatus: ''
    };
  }

  loadSummaries(): void {
    if (!this.patientId) return;

    this.loading = true;
    this.error = null;

    this.dischargeSummaryService.getDischargeSummariesByPatientId(this.patientId).subscribe({
      next: (summaries) => {
        this.summaries = summaries;
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Failed to load discharge summaries';
        this.loading = false;
        this.toastr.error('Failed to load discharge summaries');
      }
    });
  }

  selectSummary(summary: DischargeSummaryDto): void {
    this.selectedSummary = summary;
    this.isEditing = false;
    this.isCreating = false;
  }

  createNewSummary(): void {
    this.summaryForm = this.getEmptyForm();
    this.summaryForm.patientId = this.patientId || '';
    this.isCreating = true;
    this.isEditing = false;
    this.selectedSummary = null;
  }

  editSummary(summary: DischargeSummaryDto): void {
    this.summaryForm = {
      patientId: summary.patientId,
      isDraft: summary.isDraft,
      reasonForTreatment: summary.reasonForTreatment,
      treatmentProvided: summary.treatmentProvided,
      outcomeAchieved: summary.outcomeAchieved,
      reasonForDischarge: summary.reasonForDischarge,
      recommendations: summary.recommendations || '',
      followUpInstructions: summary.followUpInstructions || '',
      prognosis: summary.prognosis || '',
      referralsProvided: summary.referralsProvided || '',
      treatmentStartDate: summary.treatmentStartDate.split('T')[0],
      treatmentEndDate: summary.treatmentEndDate.split('T')[0],
      totalSessions: summary.totalSessions,
      primaryDiagnosis: summary.primaryDiagnosis || '',
      secondaryDiagnosis: summary.secondaryDiagnosis || '',
      dischargeDate: summary.dischargeDate.split('T')[0],
      dischargeStatus: summary.dischargeStatus || ''
    };
    this.selectedSummary = summary;
    this.isEditing = true;
    this.isCreating = false;
  }

  saveSummary(): void {
    this.loading = true;
    this.loader.show();

    if (this.isCreating) {
      this.dischargeSummaryService.createDischargeSummary(this.summaryForm).subscribe({
        next: (summary) => {
          this.summaries = [summary, ...this.summaries];
          this.selectedSummary = summary;
          this.isCreating = false;
          this.loading = false;
          this.loader.hide();
          this.toastr.success('Discharge summary created successfully');
        },
        error: (err) => {
          this.error = 'Failed to create discharge summary';
          this.loading = false;
          this.loader.hide();
          this.toastr.error('Failed to create discharge summary');
        }
      });
    } else if (this.isEditing && this.selectedSummary) {
      this.dischargeSummaryService.updateDischargeSummary(this.selectedSummary.id, this.summaryForm).subscribe({
        next: (summary) => {
          const index = this.summaries.findIndex(s => s.id === summary.id);
          if (index !== -1) {
            this.summaries[index] = summary;
          }
          this.selectedSummary = summary;
          this.isEditing = false;
          this.loading = false;
          this.loader.hide();
          this.toastr.success('Discharge summary updated successfully');
        },
        error: (err) => {
          this.error = 'Failed to update discharge summary';
          this.loading = false;
          this.loader.hide();
          this.toastr.error('Failed to update discharge summary');
        }
      });
    }
  }

  cancelEdit(): void {
    this.isEditing = false;
    this.isCreating = false;
    this.summaryForm = this.getEmptyForm();
  }

  confirmDelete(summary: DischargeSummaryDto): void {
    this.summaryToDelete = summary;
    this.showDeleteModal = true;
  }

  deleteSummary(): void {
    this.loader.show();
    if (!this.summaryToDelete) {
      this.loader.hide();
      return;
    }

    this.isDeleting = true;
    this.dischargeSummaryService.deleteDischargeSummary(this.summaryToDelete.id).subscribe({
      next: () => {
        this.summaries = this.summaries.filter(s => s.id !== this.summaryToDelete!.id);
        if (this.selectedSummary?.id === this.summaryToDelete!.id) {
          this.selectedSummary = null;
        }
        this.toastr.success('Discharge summary deleted successfully');
        this.loader.hide();
        this.isDeleting = false;
        this.showDeleteModal = false;
        this.summaryToDelete = null;
      },
      error: (err) => {
        this.toastr.error('Failed to delete discharge summary');
        this.loader.hide();
        this.error = 'Failed to delete discharge summary';
        this.isDeleting = false;
        this.showDeleteModal = false;
        this.summaryToDelete = null;
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
    this.dischargeSummaryService.publishDraft(this.publishIds).subscribe({
      next: (summary) => {
        const index = this.summaries.findIndex(s => s.id === summary.id);
        if (index !== -1) {
          this.summaries[index] = summary;
        }
        if (this.selectedSummary?.id === summary.id) {
          this.selectedSummary = summary;
        }
        this.loader.hide();
        this.toastr.success('Discharge summary published successfully');
        this.showPublishPopup = false;
      },
      error: (err) => {
        this.loader.hide();
        this.toastr.error('Failed to publish discharge summary');
        this.error = 'Failed to publish discharge summary';
        this.showPublishPopup = false;
      }
    });
  }

  downloadPDF(): void {
    if (this.selectedSummary) {
      this.pdfGenerator.generateDischargeSummaryPDF(this.selectedSummary);
      this.toastr.success('PDF download started');
    }
  }

  get hasPublishedSummaries(): boolean {
    return this.summaries.some(summary => !summary.isDraft);
  }

  onShare(): void {
    if (!this.selectedSummary) {
      return;
    }
    this.loading = true;
    this.shareService.shareDischargeSummaryToPatient(this.selectedSummary.id).subscribe({      
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