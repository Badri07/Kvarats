import { Component, inject, Input, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProgressNoteService } from '../../services/progress-note.service';
import { PdfGeneratorService } from '../../services/pdf-generator.service';
import { ProgressNoteDto, CreateProgressNoteRequest } from '../../models/progress-note.model';
import { PopupService } from '../../../../service/popup/popup-service';
import { TosterService } from '../../../../service/toaster/tostr.service';
import { AuthService } from '../../../../service/auth/auth.service';

@Component({
  selector: 'app-progress-notes',
  standalone: false,
  templateUrl: './progress-notes.component.html',
  styleUrls: ['./progress-notes.component.scss']
})
export class ProgressNotesComponent {
  patientId: any;
  notes: ProgressNoteDto[] = [];
  selectedNote: ProgressNoteDto | null = null;
  isEditing = false;
  isCreating = false;
  loading = false;
  error: string | null = null;

  // Modal properties
  showDeleteModal = false;
  isDeleting = false;
  noteToDelete: ProgressNoteDto | null = null;

  // Publish popup properties
  showPublishPopup = false;
  publishIds: any;

  noteForm: CreateProgressNoteRequest = this.getEmptyForm();

  // Inject services
  public toastr = inject(TosterService);
  public loader = inject(PopupService);
  public authService = inject(AuthService);

  constructor(
    private progressNoteService: ProgressNoteService,
    private pdfGenerator: PdfGeneratorService
  ) {}

  ngOnInit(): void {
    this.patientId = this.authService.getPatientId();

    if (this.patientId) {
      this.loadNotes();
    }
  }

  getEmptyForm(): CreateProgressNoteRequest {
    return {
      patientId: '',
      isDraft: true,
      progressSummary: '',
      goalProgress: '',
      interventionsUsed: '',
      patientResponse: '',
      clinicalObservations: '',
      nextSteps: '',
      sessionDate: new Date().toISOString().split('T')[0],
      sessionDurationMinutes: 60,
      sessionType: '',
      progressRating: undefined,
      riskAssessment: ''
    };
  }

  loadNotes(): void {
    if (!this.patientId) return;

    this.loading = true;
    this.error = null;

    this.progressNoteService.getProgressNotesByPatientId(this.patientId).subscribe({
      next: (notes) => {
        this.notes = notes;
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Failed to load progress notes';
        this.loading = false;
        this.toastr.error('Failed to load progress notes');
      }
    });
  }

  selectNote(note: ProgressNoteDto): void {
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

  editNote(note: ProgressNoteDto): void {
    this.noteForm = {
      patientId: note.patientId,
      isDraft: note.isDraft,
      progressSummary: note.progressSummary,
      goalProgress: note.goalProgress || '',
      interventionsUsed: note.interventionsUsed || '',
      patientResponse: note.patientResponse || '',
      clinicalObservations: note.clinicalObservations || '',
      nextSteps: note.nextSteps || '',
      sessionDate: note.sessionDate.split('T')[0],
      sessionDurationMinutes: note.sessionDurationMinutes,
      sessionType: note.sessionType || '',
      progressRating: note.progressRating,
      riskAssessment: note.riskAssessment || ''
    };
    this.selectedNote = note;
    this.isEditing = true;
    this.isCreating = false;
  }

  saveNote(): void {
    this.loading = true;
    this.loader.show();

    if (this.isCreating) {
      this.progressNoteService.createProgressNote(this.noteForm).subscribe({
        next: (note) => {
          this.notes = [note, ...this.notes];
          this.selectedNote = note;
          this.isCreating = false;
          this.loading = false;
          this.loader.hide();
          this.toastr.success('Progress note created successfully');
        },
        error: (err) => {
          this.error = 'Failed to create progress note';
          this.loading = false;
          this.loader.hide();
          this.toastr.error('Failed to create progress note');
        }
      });
    } else if (this.isEditing && this.selectedNote) {
      this.progressNoteService.updateProgressNote(this.selectedNote.id, this.noteForm).subscribe({
        next: (note) => {
          const index = this.notes.findIndex(n => n.id === note.id);
          if (index !== -1) {
            this.notes[index] = note;
          }
          this.selectedNote = note;
          this.isEditing = false;
          this.loading = false;
          this.loader.hide();
          this.toastr.success('Progress note updated successfully');
        },
        error: (err) => {
          this.error = 'Failed to update progress note';
          this.loading = false;
          this.loader.hide();
          this.toastr.error('Failed to update progress note');
        }
      });
    }
  }

  cancelEdit(): void {
    this.isEditing = false;
    this.isCreating = false;
    this.noteForm = this.getEmptyForm();
  }

  confirmDelete(note: ProgressNoteDto): void {
    this.noteToDelete = note;
    this.showDeleteModal = true;
  }

  deleteNote(): void {
    this.loader.show();
    if (!this.noteToDelete) {
      this.loader.hide();
      return;
    }

    this.isDeleting = true;
    this.progressNoteService.deleteProgressNote(this.noteToDelete.id).subscribe({
      next: () => {
        this.notes = this.notes.filter(n => n.id !== this.noteToDelete!.id);
        if (this.selectedNote?.id === this.noteToDelete!.id) {
          this.selectedNote = null;
        }
        this.toastr.success('Progress note deleted successfully');
        this.loader.hide();
        this.isDeleting = false;
        this.showDeleteModal = false;
        this.noteToDelete = null;
      },
      error: (err) => {
        this.toastr.error('Failed to delete progress note');
        this.loader.hide();
        this.error = 'Failed to delete progress note';
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
    this.progressNoteService.publishDraft(this.publishIds).subscribe({
      next: (note) => {
        const index = this.notes.findIndex(n => n.id === note.id);
        if (index !== -1) {
          this.notes[index] = note;
        }
        if (this.selectedNote?.id === note.id) {
          this.selectedNote = note;
        }
        this.loader.hide();
        this.toastr.success('Progress note published successfully');
        this.showPublishPopup = false;
      },
      error: (err) => {
        this.loader.hide();
        this.toastr.error('Failed to publish progress note');
        this.error = 'Failed to publish progress note';
        this.showPublishPopup = false;
      }
    });
  }

  downloadPDF(): void {
    if (this.selectedNote) {
      this.pdfGenerator.generateProgressNotePDF(this.selectedNote);
      this.toastr.success('PDF download started');
    }
  }

  get hasPublishedNotes(): boolean {
    return this.notes.some(note => !note.isDraft);
  }
}