import { Injectable, signal } from '@angular/core';
import { Observable, of, delay, throwError } from 'rxjs';
import { 
  Note, 
  NoteType, 
  NoteStatus, 
  NoteTemplate, 
  NoteSearch,
  NoteAudit 
} from '../../models/note.model';

@Injectable({
  providedIn: 'root'
})
export class NotesService {
  private notes = signal<any[]>([
    {
      id: '1',
      clientId: 'client-1',
      therapistId: 'therapist-1',
      appointmentId: '1',
      type: NoteType.SOAP,
      status: NoteStatus.COMPLETED,
      title: 'Session Note - January 15, 2025',
      content: {
        subjective: 'Client reports feeling anxious about upcoming work presentation. Sleep has been disrupted for the past week.',
        objective: 'Client appeared tense, fidgeting with hands. Speech was rapid. Made good eye contact.',
        assessment: 'Client is experiencing situational anxiety related to work stress. Coping skills need reinforcement.',
        plan: 'Continue weekly sessions. Practice deep breathing exercises. Schedule follow-up in one week.'
      },
      tags: ['anxiety', 'work-stress', 'coping-skills'],
      isConfidential: false,
      createdAt: new Date(2025, 0, 15),
      updatedAt: new Date(2025, 0, 15),
      version: 1
    },
    {
      id: '2',
      clientId: 'client-2',
      therapistId: 'therapist-1',
      type: NoteType.INTAKE,
      status: NoteStatus.DRAFT,
      title: 'Initial Intake Assessment',
      content: {
        subjective: 'Client seeking therapy for depression and relationship issues.',
        objective: 'Client appeared well-groomed, cooperative, and engaged.',
        assessment: 'Initial assessment indicates moderate depression with relationship stressors.',
        plan: 'Begin weekly individual therapy sessions focusing on CBT techniques.'
      },
      tags: ['intake', 'depression', 'relationships'],
      isConfidential: false,
      createdAt: new Date(2025, 0, 10),
      updatedAt: new Date(2025, 0, 10),
      version: 1
    }
  ]);

  private templates = signal<NoteTemplate[]>([
    {
      id: 'template-1',
      name: 'SOAP Note Template',
      type: NoteType.SOAP,
      description: 'Standard SOAP note format for therapy sessions',
      content: {
        subjective: '',
        objective: '',
        assessment: '',
        plan: ''
      },
      fields: [
        {
          id: 'subjective',
          name: 'subjective',
          label: 'Subjective',
          type: 'textarea',
          required: true,
          placeholder: 'What the client reports...'
        },
        {
          id: 'objective',
          name: 'objective',
          label: 'Objective',
          type: 'textarea',
          required: true,
          placeholder: 'Observable behaviors and presentation...'
        },
        {
          id: 'assessment',
          name: 'assessment',
          label: 'Assessment',
          type: 'textarea',
          required: true,
          placeholder: 'Clinical assessment and diagnosis...'
        },
        {
          id: 'plan',
          name: 'plan',
          label: 'Plan',
          type: 'textarea',
          required: true,
          placeholder: 'Treatment plan and next steps...'
        }
      ],
      isDefault: true,
      createdBy: 'therapist-1',
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: 'template-2',
      name: 'DAP Note Template',
      type: NoteType.DAP,
      description: 'Data, Assessment, Plan format for progress notes',
      content: {
        data: '',
        assessment: '',
        plan: ''
      },
      fields: [
        {
          id: 'data',
          name: 'data',
          label: 'Data',
          type: 'textarea',
          required: true,
          placeholder: 'Objective data and observations...'
        },
        {
          id: 'assessment',
          name: 'assessment',
          label: 'Assessment',
          type: 'textarea',
          required: true,
          placeholder: 'Clinical assessment...'
        },
        {
          id: 'plan',
          name: 'plan',
          label: 'Plan',
          type: 'textarea',
          required: true,
          placeholder: 'Treatment plan...'
        }
      ],
      isDefault: false,
      createdBy: 'therapist-1',
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ]);

  getNotes(): Observable<Note[]> {
    return of(this.notes()).pipe(delay(300));
  }

  getNotesByClient(clientId: string): Observable<Note[]> {
    return of(this.notes().filter(note => note.clientId === clientId)).pipe(delay(300));
  }

  getNotesByTherapist(therapistId: string): Observable<Note[]> {
    return of(this.notes().filter(note => note.therapistId === therapistId)).pipe(delay(300));
  }

  getNoteById(id: string): Observable<Note | undefined> {
    return of(this.notes().find(note => note.id === id)).pipe(delay(300));
  }

  searchNotes(criteria: NoteSearch): Observable<Note[]> {
    let filteredNotes = this.notes();

    if (criteria.query) {
      const query = criteria.query.toLowerCase();
      filteredNotes = filteredNotes.filter(note => 
        note.title.toLowerCase().includes(query) ||
        JSON.stringify(note.content).toLowerCase().includes(query) ||
        note.tags.some((tag:any) => tag.toLowerCase().includes(query))
      );
    }

    if (criteria.clientId) {
      filteredNotes = filteredNotes.filter(note => note.clientId === criteria.clientId);
    }

    if (criteria.therapistId) {
      filteredNotes = filteredNotes.filter(note => note.therapistId === criteria.therapistId);
    }

    if (criteria.type) {
      filteredNotes = filteredNotes.filter(note => note.type === criteria.type);
    }

    if (criteria.status) {
      filteredNotes = filteredNotes.filter(note => note.status === criteria.status);
    }

    if (criteria.dateFrom) {
      filteredNotes = filteredNotes.filter(note => note.createdAt >= criteria.dateFrom!);
    }

    if (criteria.dateTo) {
      filteredNotes = filteredNotes.filter(note => note.createdAt <= criteria.dateTo!);
    }

    if (criteria.tags && criteria.tags.length > 0) {
      filteredNotes = filteredNotes.filter(note => 
        criteria.tags!.some(tag => note.tags.includes(tag))
      );
    }

    return of(filteredNotes).pipe(delay(300));
  }

  createNote(note: Omit<Note, 'id' | 'createdAt' | 'updatedAt' | 'version'>): Observable<Note> {
    const newNote: Note = {
      ...note,
      id: this.generateId(),
      createdAt: new Date(),
      updatedAt: new Date(),
      version: 1
    };

    this.notes.update(notes => [...notes, newNote]);
    return of(newNote).pipe(delay(500));
  }

  updateNote(id: string, updates: Partial<Note>): Observable<Note> {
    const currentNotes = this.notes();
    const index = currentNotes.findIndex(note => note.id === id);
    
    if (index === -1) {
      return throwError(() => new Error('Note not found'));
    }

    const currentNote = currentNotes[index];
    const updatedNote = {
      ...currentNote,
      ...updates,
      updatedAt: new Date(),
      version: currentNote.version + 1,
      previousVersionId: currentNote.id
    };

    this.notes.update(notes => {
      const newNotes = [...notes];
      newNotes[index] = updatedNote;
      return newNotes;
    });

    return of(updatedNote).pipe(delay(500));
  }

  deleteNote(id: string): Observable<boolean> {
    this.notes.update(notes => notes.filter(note => note.id !== id));
    return of(true).pipe(delay(500));
  }

  signNote(id: string, signedBy: string): Observable<Note> {
    return this.updateNote(id, {
      status: NoteStatus.SIGNED,
      signedAt: new Date(),
      signedBy
    });
  }

  lockNote(id: string): Observable<Note> {
    return this.updateNote(id, {
      status: NoteStatus.LOCKED,
      lockedAt: new Date()
    });
  }

  getTemplates(): Observable<NoteTemplate[]> {
    return of(this.templates()).pipe(delay(300));
  }

  getTemplatesByType(type: NoteType): Observable<NoteTemplate[]> {
    return of(this.templates().filter(template => template.type === type)).pipe(delay(300));
  }

  getTemplateById(id: string): Observable<NoteTemplate | undefined> {
    return of(this.templates().find(template => template.id === id)).pipe(delay(300));
  }

  createTemplate(template: Omit<NoteTemplate, 'id' | 'createdAt' | 'updatedAt'>): Observable<NoteTemplate> {
    const newTemplate: NoteTemplate = {
      ...template,
      id: this.generateId(),
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.templates.update(templates => [...templates, newTemplate]);
    return of(newTemplate).pipe(delay(500));
  }

  updateTemplate(id: string, updates: Partial<NoteTemplate>): Observable<NoteTemplate> {
    const currentTemplates = this.templates();
    const index = currentTemplates.findIndex(template => template.id === id);
    
    if (index === -1) {
      return throwError(() => new Error('Template not found'));
    }

    const updatedTemplate = {
      ...currentTemplates[index],
      ...updates,
      updatedAt: new Date()
    };

    this.templates.update(templates => {
      const newTemplates = [...templates];
      newTemplates[index] = updatedTemplate;
      return newTemplates;
    });

    return of(updatedTemplate).pipe(delay(500));
  }

  deleteTemplate(id: string): Observable<boolean> {
    this.templates.update(templates => templates.filter(template => template.id !== id));
    return of(true).pipe(delay(500));
  }

  private generateId(): string {
    return Math.random().toString(36).substr(2, 9);
  }
}