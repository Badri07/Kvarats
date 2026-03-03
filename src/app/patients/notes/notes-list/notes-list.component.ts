import { Component, ElementRef, QueryList, ViewChild, ViewChildren, AfterViewInit, Input, inject } from '@angular/core';
import { AuthService } from '../../../service/auth/auth.service';

// Define a union type for all possible tabs
type AllTabs = 'soap' | 'dap' | 'assessment' | 'crisis' | 'treatment' | 'progress' | 'discharge';

@Component({
  selector: 'app-notes-list',
  standalone: false,
  templateUrl: './notes-list.component.html',
  styleUrl: './notes-list.component.scss'
})
export class NotesListComponent implements AfterViewInit {
  
  activeTab: AllTabs = 'soap';
  selectedPatientId: string | null = null;
  selectedPatientName: string | null = null;
  
  // Animated tabs properties
  sliderLeft = '0px';
  sliderWidth = '0px';
  patientId: any;

  @ViewChildren('tabItem', { read: ElementRef }) tabItems!: QueryList<ElementRef>;

  ngAfterViewInit() {
    // Wait for tab rendering then update slider position
    setTimeout(() => this.updateSliderPosition(0), 0);
  }

  setActiveTab(tabId: AllTabs, index: number) {
    this.activeTab = tabId;
    this.updateSliderPosition(index);
  }

  updateSliderPosition(index: number) {
    const tabs = document.querySelectorAll('.tab');
    if (tabs[index]) {
      const tabEl = tabs[index] as HTMLElement;
      this.sliderLeft = tabEl.offsetLeft + 'px';
      this.sliderWidth = tabEl.offsetWidth + 'px';
    }
  }

  onPatientSelected(event: any): void {
    this.selectedPatientId = event.patientId;
    this.selectedPatientName = event.patientName;
    // Reset to first tab (SOAP Notes) when selecting a new patient
    this.activeTab = 'soap';
    setTimeout(() => this.updateSliderPosition(0), 0);
  }

  getTabTitle(): string {
    switch (this.activeTab) {
      case 'soap': return 'SOAP Notes';
      case 'dap': return 'DAP Notes';
      case 'assessment': return 'Initial Assessment';
      case 'crisis': return 'Crisis Notes';
      case 'treatment': return 'Treatment Plans';
      case 'progress': return 'Progress Notes';
      case 'discharge': return 'Discharge Summary';
      default: return 'Clinical Notes';
    }
  }

  goBackToPatients(): void {
    this.selectedPatientId = null;
    this.selectedPatientName = null;
    this.activeTab = 'soap';
  }

  clearPatientSelection(): void {
    this.selectedPatientId = null;
    this.selectedPatientName = null;
    this.activeTab = 'soap';
  }
}