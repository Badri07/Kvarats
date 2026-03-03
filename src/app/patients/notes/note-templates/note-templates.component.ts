import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-note-templates',
  standalone: true,
  imports: [CommonModule],
  template: '<div class="p-6"><h1>Note Templates</h1><p>Manage and customize note templates for different types of therapy notes.</p></div>'
})
export class NoteTemplatesComponent {}