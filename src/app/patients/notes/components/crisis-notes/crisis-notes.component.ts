import { Component, inject, Input, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CrisisNoteService } from '../../services/crisis-note.service';
import { PdfGeneratorService } from '../../services/pdf-generator.service';
import { CrisisNoteDto, CreateCrisisNoteRequest } from '../../models/crisis-note.model';
import { PopupService } from '../../../../service/popup/popup-service';
import { TosterService } from '../../../../service/toaster/tostr.service';
import { AuthService } from '../../../../service/auth/auth.service';

@Component({
  selector: 'app-crisis-notes',
  standalone: false,
  templateUrl: './crisis-notes.component.html',
  styleUrls: ['./crisis-notes.component.scss']
})
export class CrisisNotesComponent {
  public authService = inject(AuthService);

  notes: CrisisNoteDto[] = [];
  selectedNote: CrisisNoteDto | null = null;
  isEditing = false;
  isCreating = false;
  loading = false;
  error: string | null = null;

  // Modal properties
  showDeleteModal = false;
  isDeleting = false;
  noteToDelete: CrisisNoteDto | null = null;

  // Publish popup properties
  showPublishPopup = false;
  publishIds: any;

  patientId: any;

  noteForm: CreateCrisisNoteRequest = this.getEmptyForm();

  // Inject services
  public toastr = inject(TosterService);
  public loader = inject(PopupService);

  constructor(
    private crisisNoteService: CrisisNoteService,
    private pdfGenerator: PdfGeneratorService
  ) {}

  

  getEmptyForm(): CreateCrisisNoteRequest {
    return {
      patientId: '',
      isDraft: true,
      crisisDescription: '',
      immediateActions: '',
      riskAssessment: '',
      safetyPlan: '',
      triggersIdentified: '',
      copingStrategies: '',
      supportSystemActivated: '',
      followUpPlan: '',
      referralsProvided: '',
      crisisDate: new Date().toISOString().split('T')[0],
      crisisDurationMinutes: 60,
      crisisType: '',
      crisisSeverity: '',
      suicidalRisk: '',
      homicidalRisk: '',
      selfHarmRisk: '',
      emergencyContactsNotified: false,
      emergencyContactsDetails: ''
    };
  }


  ngOnInit(): void {
    this.patientId = this.authService.getPatientId();

    if (this.patientId) {
      this.loadNotes();
    }
  }

  loadNotes(): void {
    if (!this.patientId) return;

    this.loading = true;
    this.error = null;

    this.crisisNoteService.getCrisisNotesByPatientId(this.patientId).subscribe({
      next: (notes) => {
        this.notes = notes;
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Failed to load crisis notes';
        this.loading = false;
        this.toastr.error('Failed to load crisis notes');
      }
    });
  }

  selectNote(note: CrisisNoteDto): void {
    this.selectedNote = note;
    this.isEditing = false;
    this.isCreating = false;
  }

  createNewNote(): void {
    this.noteForm = this.getEmptyForm();
    this.noteForm.patientId = this.patientId || '';
    this.isCreating = true;
    this.isEditing = false;
    this.selectedNote = null;
  }

  editNote(note: CrisisNoteDto): void {
    this.noteForm = {
      patientId: note.patientId,
      isDraft: note.isDraft,
      crisisDescription: note.crisisDescription,
      immediateActions: note.immediateActions,
      riskAssessment: note.riskAssessment,
      safetyPlan: note.safetyPlan,
      triggersIdentified: note.triggersIdentified || '',
      copingStrategies: note.copingStrategies || '',
      supportSystemActivated: note.supportSystemActivated || '',
      followUpPlan: note.followUpPlan || '',
      referralsProvided: note.referralsProvided || '',
      crisisDate: note.crisisDate.split('T')[0],
      crisisDurationMinutes: note.crisisDurationMinutes,
      crisisType: note.crisisType || '',
      crisisSeverity: note.crisisSeverity || '',
      suicidalRisk: note.suicidalRisk || '',
      homicidalRisk: note.homicidalRisk || '',
      selfHarmRisk: note.selfHarmRisk || '',
      emergencyContactsNotified: note.emergencyContactsNotified,
      emergencyContactsDetails: note.emergencyContactsDetails || ''
    };
    this.selectedNote = note;
    this.isEditing = true;
    this.isCreating = false;
  }

  saveNote(): void {
    this.loading = true;
    this.loader.show();

    if (this.isCreating) {
      this.crisisNoteService.createCrisisNote(this.noteForm).subscribe({
        next: (note) => {
          this.notes = [note, ...this.notes];
          this.selectedNote = note;
          this.isCreating = false;
          this.loading = false;
          this.loader.hide();
          this.toastr.success('Crisis note created successfully');
        },
        error: (err) => {
          this.error = 'Failed to create crisis note';
          this.loading = false;
          this.loader.hide();
          this.toastr.error('Failed to create crisis note');
        }
      });
    } else if (this.isEditing && this.selectedNote) {
      this.crisisNoteService.updateCrisisNote(this.selectedNote.id, this.noteForm).subscribe({
        next: (note) => {
          const index = this.notes.findIndex(n => n.id === note.id);
          if (index !== -1) {
            this.notes[index] = note;
          }
          this.selectedNote = note;
          this.isEditing = false;
          this.loading = false;
          this.loader.hide();
          this.toastr.success('Crisis note updated successfully');
        },
        error: (err) => {
          this.error = 'Failed to update crisis note';
          this.loading = false;
          this.loader.hide();
          this.toastr.error('Failed to update crisis note');
        }
      });
    }
  }

  cancelEdit(): void {
    this.isEditing = false;
    this.isCreating = false;
    this.noteForm = this.getEmptyForm();
  }

  confirmDelete(note: CrisisNoteDto): void {
    this.noteToDelete = note;
    this.showDeleteModal = true;
  }

  deleteNote(): void {
    this.loader.show();
    if (!this.noteToDelete){
      this.loader.hide();
      return;
    } 
    
    this.isDeleting = true;
    this.crisisNoteService.deleteCrisisNote(this.noteToDelete.id).subscribe({
      next: () => {
        this.notes = this.notes.filter(n => n.id !== this.noteToDelete!.id);
        if (this.selectedNote?.id === this.noteToDelete!.id) {
          this.selectedNote = null;
        }
        this.toastr.success("Crisis note deleted successfully");
        this.loader.hide();
        this.isDeleting = false;
        this.showDeleteModal = false;
        this.noteToDelete = null;
      },
      error: (err) => {
        this.toastr.error("Failed to delete crisis note");
        this.loader.hide();
        this.error = 'Failed to delete crisis note';
        this.isDeleting = false;
        this.showDeleteModal = false;
        this.noteToDelete = null;
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
    this.crisisNoteService.publishDraft(this.publishIds).subscribe({
      next: (note) => {
        const index = this.notes.findIndex(n => n.id === note.id);
        if (index !== -1) {
          this.notes[index] = note;
        }
        if (this.selectedNote?.id === note.id) {
          this.selectedNote = note;
        }
        this.loader.hide();
        this.toastr.success('Crisis note published successfully');
        this.showPublishPopup = false;
      },
      error: (err) => {
        this.loader.hide();
        this.toastr.error('Failed to publish crisis note');
        this.error = 'Failed to publish crisis note';
        this.showPublishPopup = false;
      }
    });
  }

  downloadPDF(): void {
    if (this.selectedNote) {
      this.pdfGenerator.generateCrisisNotePDF(this.selectedNote);
      this.toastr.success('PDF download started');
    }
  }

  get hasPublishedNotes(): boolean {
    return this.notes.some(note => !note.isDraft);
  }
}