// note-navigation.service.ts
import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface NoteNavigationData {
  id: string;
  type: string;
  isEdit: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class NoteNavigationService {
 private noteDataSubject = new BehaviorSubject<any>(null);
  public noteData$ = this.noteDataSubject.asObservable();

  setNoteData(data: any): void {
    console.log('Setting note data in service:', data);
    this.noteDataSubject.next(data);
  }

  getNoteData(): any {
    const data = this.noteDataSubject.value;
    console.log('Getting note data from service:', data);
    return data;
  }

  clearNoteData(): void {
    console.log('Clearing note data in service');
    this.noteDataSubject.next(null);
  }
}