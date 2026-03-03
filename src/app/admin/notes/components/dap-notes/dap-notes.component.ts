import { Component, Input, OnChanges, SimpleChanges, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DapNoteService } from '../../services/dap-note.service';
import { PdfGeneratorService } from '../../services/pdf-generator.service';
import { DAPNoteDto, CreateDAPNoteRequest } from '../../models/dap-note.model';
import { TosterService } from '../../../../service/toaster/tostr.service';
import { PopupService } from '../../../../service/popup/popup-service';
import { ShareService } from '../../services/share.service';

@Component({
  selector: 'app-dap-notes',
  standalone: false,
  templateUrl: './dap-notes.component.html',
  styleUrls: ['./dap-notes.component.scss']
})
export class DapNotesComponent implements OnChanges {
  @Input() patientId: string | null = null;

  notes: DAPNoteDto[] = [];
  selectedNote: DAPNoteDto | null = null;
  isEditing = false;
  isCreating = false;
  loading = false;
  error: string | null = null;

  // Modal properties
  showDeleteModal = false;
  isDeleting = false;
  noteToDelete: DAPNoteDto | null = null;

  // Publish popup properties
  showPublishPopup = false;
  publishIds: any;

  noteForm: CreateDAPNoteRequest = {
    patientId: '',
    isDraft: true,
    data: '',
    assessment: '',
    plan: '',
    sessionDurationMinutes: 60
  };

  // Inject services
  public toastr = inject(TosterService);
  public loader = inject(PopupService);

  constructor(
    private dapNoteService: DapNoteService,
    private pdfGenerator: PdfGeneratorService,
    private shareService: ShareService
  ) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['patientId'] && this.patientId) {
      this.loadNotes();
    }
  }

  loadNotes(): void {
    if (!this.patientId) return;

    this.loading = true;
    this.error = null;

    this.dapNoteService.getDAPNotesByPatientId(this.patientId).subscribe({
      next: (notes) => {
        this.notes = notes;
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Failed to load notes';
        this.loading = false;
        this.toastr.error('Failed to load DAP notes');
      }
    });
  }

  selectNote(note: DAPNoteDto): void {
    this.selectedNote = note;
    this.isEditing = false;
    this.isCreating = false;
  }

  startEdit(): void {
    if (!this.selectedNote) return;

    this.isEditing = true;
    this.noteForm = {
      patientId: this.selectedNote.patientId,
      isDraft: this.selectedNote.isDraft,
      data: this.selectedNote.data,
      assessment: this.selectedNote.assessment,
      plan: this.selectedNote.plan,
      sessionDate: this.selectedNote.sessionDate,
      sessionDurationMinutes: this.selectedNote.sessionDurationMinutes,
      sessionType: this.selectedNote.sessionType
    };
  }

  startCreate(): void {
    this.isCreating = true;
    this.isEditing = false;
    this.selectedNote = null;
    this.noteForm = {
      patientId: this.patientId!,
      isDraft: true,
      data: '',
      assessment: '',
      plan: '',
      sessionDurationMinutes: 60
    };
  }

  saveNote(): void {
    this.loading = true;
    this.error = null;
    this.loader.show();

    if (this.isCreating) {
      this.dapNoteService.createDAPNote(this.noteForm).subscribe({
        next: (note) => {
          this.notes.unshift(note);
          this.selectedNote = note;
          this.isCreating = false;
          this.loading = false;
          this.loader.hide();
          this.toastr.success('DAP note created successfully');
        },
        error: (err) => {
          this.error = 'Failed to create note';
          this.loading = false;
          this.loader.hide();
          this.toastr.error('Failed to create DAP note');
        }
      });
    } else if (this.isEditing && this.selectedNote) {
      this.dapNoteService.updateDAPNote(this.selectedNote.id, this.noteForm).subscribe({
        next: (note) => {
          const index = this.notes.findIndex(n => n.id === note.id);
          if (index !== -1) {
            this.notes[index] = note;
          }
          this.selectedNote = note;
          this.isEditing = false;
          this.loading = false;
          this.loader.hide();
          this.toastr.success('DAP note updated successfully');
        },
        error: (err) => {
          this.error = 'Failed to update note';
          this.loading = false;
          this.loader.hide();
          this.toastr.error('Failed to update DAP note');
        }
      });
    }
  }

  cancelEdit(): void {
    this.isEditing = false;
    this.isCreating = false;
  }

  confirmDelete(note: DAPNoteDto): void {
    this.noteToDelete = note;
    this.showDeleteModal = true;
  }

  deleteNote(): void {
    if (!this.noteToDelete) {
      this.loader.hide();
      return;
    }

    this.isDeleting = true;
    this.loader.show();

    this.dapNoteService.deleteDAPNote(this.noteToDelete.id).subscribe({
      next: () => {
        this.notes = this.notes.filter(n => n.id !== this.noteToDelete!.id);
        if (this.selectedNote?.id === this.noteToDelete!.id) {
          this.selectedNote = null;
        }
        this.isDeleting = false;
        this.showDeleteModal = false;
        this.noteToDelete = null;
        this.loader.hide();
        this.toastr.success('DAP note deleted successfully');
      },
      error: (err) => {
        this.error = 'Failed to delete note';
        this.isDeleting = false;
        this.showDeleteModal = false;
        this.noteToDelete = null;
        this.loader.hide();
        this.toastr.error('Failed to delete DAP note');
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
    this.dapNoteService.publishDraft(this.publishIds).subscribe({
      next: (note) => {
        const index = this.notes.findIndex(n => n.id === note.id);
        if (index !== -1) {
          this.notes[index] = note;
        }
        if (this.selectedNote?.id === note.id) {
          this.selectedNote = note;
        }
        this.loader.hide();
        this.toastr.success('DAP note published successfully');
        this.showPublishPopup = false;
      },
      error: (err) => {
        this.loader.hide();
        this.toastr.error('Failed to publish DAP note');
        this.error = 'Failed to publish DAP note';
        this.showPublishPopup = false;
      }
    });
  }

  downloadPDF(): void {
    if (this.selectedNote) {
      this.pdfGenerator.generateDAPNotePDF(this.selectedNote);
      this.toastr.success('PDF download started');
    }
  }

  get hasPublishedNotes(): boolean {
    return this.notes.some(note => !note.isDraft);
  }

  onShare(): void {
    if (!this.selectedNote) {
      return;
    }
    this.loading = true;
    this.shareService.shareDapNotesToPatient(this.selectedNote.id).subscribe({      
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