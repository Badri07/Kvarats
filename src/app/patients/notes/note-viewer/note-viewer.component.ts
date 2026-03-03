import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { NotesService } from '../../../service/note/notes.service';
import { PatientService } from '../../../service/patient/patients-service';
import { Note, NoteType, NoteStatus, NoteSearch, NoteTemplate, NoteContent } from '../../../models/note.model';
import { Patient } from '../../../models/patients.model';
import { TosterService } from '../../../service/toaster/tostr.service';

@Component({
  selector: 'app-note-viewer',
  standalone: false,
  templateUrl: './note-viewer.component.html',
  styleUrl: './note-viewer.component.scss'
})
export class NoteViewerComponent implements OnInit {
  private notesService = inject(NotesService);
  private patientService = inject(PatientService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private notificationService = inject(TosterService);

  note = signal<Note | null>(null);
  patient = signal<Patient | null>(null);
  isLoading = signal(true);
  showDeleteModal = signal(false);
  isDeleting = signal(false);

  ngOnInit(): void {
    const noteId = this.route.snapshot.paramMap.get('id');
    if (noteId) {
      this.loadNote(noteId);
    }
  }

  loadNote(noteId: string): void {
    this.notesService.getNoteById(noteId).subscribe({
      next: (note) => {
        if (note) {
          this.note.set(note);
          this.loadPatient(note.clientId);
        } else {
          this.notificationService.error( 'Note not found');
          this.router.navigate(['/notes']);
        }
      },
      error: () => {
        this.notificationService.error( 'Failed to load note');
        this.router.navigate(['/notes']);
      }
    });
  }

  loadPatient(patientId: string): void {
    this.patientService.getPatientById(patientId).subscribe({
      next: (patient) => {
        this.patient.set(patient || null);
        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
      }
    });
  }

  editNote(): void {
    const note = this.note();
    if (note) {
      this.router.navigate(['/notes', note.id, 'edit']);
    }
  }

  duplicateNote(): void {
    const note = this.note();
    if (!note) return;

    const duplicatedNote = {
      ...note,
      title: `${note.title} (Copy)`,
      status: NoteStatus.DRAFT,
      signedAt: undefined,
      signedBy: undefined,
      lockedAt: undefined
    };

    delete (duplicatedNote as any).id;
    delete (duplicatedNote as any).createdAt;
    delete (duplicatedNote as any).updatedAt;
    delete (duplicatedNote as any).version;

    this.notesService.createNote(duplicatedNote).subscribe({
      next: (newNote) => {
        this.notificationService.success('Note duplicated successfully');
        this.router.navigate(['/notes', newNote.id, 'edit']);
      },
      error: () => {
        this.notificationService.error( 'Failed to duplicate note');
      }
    });
  }

  signNote(): void {
    const note = this.note();
    if (!note) return;

    this.notesService.signNote(note.id, 'therapist-1').subscribe({
      next: (updatedNote) => {
        this.note.set(updatedNote);
        this.notificationService.success('Note signed successfully');
      },
      error: () => {
        this.notificationService.error( 'Failed to sign note');
      }
    });
  }

  confirmDelete(): void {
    this.showDeleteModal.set(true);
  }

  deleteNote(): void {
    const note = this.note();
    if (!note) return;

    this.isDeleting.set(true);
    this.notesService.deleteNote(note.id).subscribe({
      next: () => {
        this.notificationService.success('Note deleted successfully');
        this.router.navigate(['/notes']);
      },
      error: () => {
        this.notificationService.error( 'Failed to delete note');
        this.isDeleting.set(false);
      }
    });
  }

  goBack(): void {
    this.router.navigate(['/notes']);
  }

  canEdit(): boolean {
    const note = this.note();
    return note ? (note.status === NoteStatus.DRAFT || note.status === NoteStatus.COMPLETED) : false;
  }

  canSign(): boolean {
    const note = this.note();
    return note ? note.status === NoteStatus.COMPLETED : false;
  }

  canDelete(): boolean {
    const note = this.note();
    return note ? note.status === NoteStatus.DRAFT : false;
  }

  getStatusColor(): string {
    const note = this.note();
    if (!note) return 'bg-gray-100 text-gray-700';

    switch (note.status) {
      case NoteStatus.DRAFT: return 'bg-gray-100 text-gray-700';
      case NoteStatus.COMPLETED: return 'bg-green-100 text-green-700';
      case NoteStatus.SIGNED: return 'bg-blue-100 text-blue-700';
      case NoteStatus.LOCKED: return 'bg-purple-100 text-purple-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  }

  getNoteTypeLabel(): string {
    const note = this.note();
    if (!note) return '';

    const labels: Record<string, string> = {
      'soap': 'SOAP Note',
      'dap': 'DAP Note',
      'progress': 'Progress Note',
      'intake': 'Intake Assessment',
      'assessment': 'Clinical Assessment',
      'treatment_plan': 'Treatment Plan',
      'discharge': 'Discharge Summary',
      'crisis': 'Crisis Note'
    };
    return labels[note.type] || note.type;
  }
}