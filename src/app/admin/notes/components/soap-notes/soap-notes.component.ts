import { Component, inject, Input, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SoapNoteService } from '../../services/soap-note.service';
import { PdfGeneratorService } from '../../services/pdf-generator.service';
import { SOAPNoteDto, CreateSOAPNoteRequest } from '../../models/soap-note.model';
import { TosterService } from '../../../../service/toaster/tostr.service';
import { PopupService } from '../../../../service/popup/popup-service';
import { ShareService } from '../../services/share.service';

@Component({
  selector: 'app-soap-notes',
  standalone: false,
  templateUrl: './soap-notes.component.html',
  styleUrls: ['./soap-notes.component.scss']
})
export class SoapNotesComponent implements OnChanges {
  @Input() patientId: string | null = null;

  notes: SOAPNoteDto[] = [];
  selectedNote: SOAPNoteDto | null = null;
  isEditing = false;
  isCreating = false;
  loading = false;
  error: string | null = null;

  // Delete modal properties
  showDeleteModal = false;
  noteToDelete: SOAPNoteDto | null = null;
  isDeleting = false;

  noteForm: CreateSOAPNoteRequest = {
    patientId: '',
    isDraft: true,
    subjective: '',
    objective: '',
    assessment: '',
    plan: '',
    sessionDurationMinutes: 60
  };

  constructor(
    private soapNoteService: SoapNoteService,
    private pdfGenerator: PdfGeneratorService,
    private shareService: ShareService
  ) {}

  ngOnInit() {
    this.loadNotes();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['patientId'] && this.patientId) {
      this.loadNotes();
    }
  }

  loadNotes(): void {
  if (!this.patientId) return;

  this.loading = true;
  this.error = null;

  // reset state when patient changes
  this.selectedNote = null;
  this.isEditing = false;
  this.isCreating = false;

  this.soapNoteService
    .getSOAPNotesByPatientId(this.patientId)
    .subscribe({
      next: (notes) => {
        this.notes = notes;
        this.loading = false;
      },
      error: () => {
        this.error = 'Failed to load SOAP notes';
        this.loading = false;
      }
    });
}


  selectNote(note: SOAPNoteDto): void {
    this.selectedNote = note;
    console.log(this.selectedNote);
    this.isEditing = false;
    this.isCreating = false;
  }

  startEdit(): void {
    if (!this.selectedNote) return;

    this.isEditing = true;
    this.noteForm = {
      patientId: this.selectedNote.patientId,
      isDraft: this.selectedNote.isDraft,
      subjective: this.selectedNote.subjective,
      objective: this.selectedNote.objective,
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
      subjective: '',
      objective: '',
      assessment: '',
      plan: '',
      sessionDurationMinutes: 60
    };
  }

  saveNote(): void {
    this.loading = true;
    this.error = null;

    if (this.isCreating) {
      this.soapNoteService.createSOAPNote(this.noteForm).subscribe({
        next: (note) => {
          this.notes.unshift(note);
          this.selectedNote = note;
          this.isCreating = false;
          this.loading = false;
        },
        error: (err) => {
          this.error = 'Failed to create note';
          this.loading = false;
        }
      });
    } else if (this.isEditing && this.selectedNote) {
      this.soapNoteService.updateSOAPNote(this.selectedNote.id, this.noteForm).subscribe({
        next: (note) => {
          const index = this.notes.findIndex(n => n.id === note.id);
          if (index !== -1) {
            this.notes[index] = note;
          }
          this.selectedNote = note;
          this.isEditing = false;
          this.loading = false;
        },
        error: (err) => {
          this.error = 'Failed to update note';
          this.loading = false;
        }
      });
    }
  }

  cancelEdit(): void {
    this.isEditing = false;
    this.isCreating = false;
  }

  confirmDelete(note: SOAPNoteDto): void {
    this.noteToDelete = note;
    this.showDeleteModal = true;
  }

  public toastr = inject(TosterService);
  public loader = inject(PopupService);

  deleteNote(): void {
    this.loader.show();
    if (!this.noteToDelete){
      this.loader.hide();
return;
    } 

    this.isDeleting = true;
    this.soapNoteService.deleteSOAPNote(this.noteToDelete.id).subscribe({
      next: () => {
        this.notes = this.notes.filter(n => n.id !== this.noteToDelete!.id);
         this.loader.hide();
        if (this.selectedNote?.id === this.noteToDelete!.id) {
          this.selectedNote = null;
        }
         this.loader.hide();
        this.toastr.success("SOAP note deleted successfully");
        this.isDeleting = false;
        this.showDeleteModal = false;
        this.noteToDelete = null;
      },
      error: (err) => {
        // this.error = 'Failed to delete note';
         this.loader.hide();
        this.toastr.success("Failed to delete note");
        this.isDeleting = false;
        this.showDeleteModal = false;
        this.noteToDelete = null;
      }
    });
  }

confirmPublish(): void {
  this.loader.show();
  this.soapNoteService.publishDraft(this.publishIds).subscribe({
    next: (note) => {
      this.loader.hide();
      this.toastr.success("Published successfully");
      const index = this.notes.findIndex(n => n.id === note.id);
      if (index !== -1) {
        this.notes[index] = note;
      }
      if (this.selectedNote?.id === note.id) {
        this.selectedNote = note;
      }
      this.showPublishPopup = false;
    },
    error: (err) => {
      this.loader.hide();
      this.toastr.error("Failed to Publish plan");
      this.error = 'Failed to publish plan';
      this.showPublishPopup = false;
    }
  });
}

  downloadPDF(): void {
    if (this.selectedNote) {
      this.pdfGenerator.generateSOAPNotePDF(this.selectedNote);
    }
  }
    get hasPublishedNotes(): boolean {
    return this.notes.some(note => !note.isDraft);
  }
  showPublishPopup: boolean = false;

  publishIds:any
  openPublishPopup(id:any) {
  this.showPublishPopup = true;
  this.publishIds = id;
}

//   confirmPublish(id:any) {
//   this.showPublishPopup = false;
//   this.publishDraft(id);
// }

  onShare(): void {
    if (!this.selectedNote) {
      return;
    }

    this.loading = true;

    this.shareService.shareSoapNotesToPatient(this.selectedNote.id).subscribe({      
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