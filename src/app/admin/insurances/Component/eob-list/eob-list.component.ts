import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { InsuranceService } from '../../../../service/patient/insurance.service';
import { PatientService } from '../../../../service/patient/patients-service';
import { Patient } from '../../../../models/patients.model';
import { ButtonComponent } from '../../../../shared/button/button.component';
import { TosterService } from '../../../../service/toaster/tostr.service';
import { EOB, EOBSearch } from '../../../../models/insurance.model';


@Component({
  selector: 'app-eob-list',
  standalone: false,
  templateUrl: './eob-list.component.html',
  styleUrl: './eob-list.component.scss'
})
export class EobListComponent implements OnInit {
  private insuranceService = inject(InsuranceService);
  private patientService = inject(PatientService);
  private router = inject(Router);
  private fb = inject(FormBuilder);
  private notificationService = inject(TosterService);

  eobs = signal<EOB[]>([]);
  patients = signal<Patient[]>([]);
  filteredEOBs = signal<EOB[]>([]);
  isLoading = signal(true);

  // Filter form
  filterForm: FormGroup = this.fb.group({
    search: [''],
    patientId: [''],
    payerName: [''],
    status: [''],
    isElectronic: [''],
    dateFrom: [''],
    dateTo: ['']
  });

  // Computed values
  totalEOBs = computed(() => this.filteredEOBs().length);
  electronicEOBs = computed(() => this.filteredEOBs().filter(eob => eob.isElectronic).length);
  paperEOBs = computed(() => this.filteredEOBs().filter(eob => !eob.isElectronic).length);
  totalPaid = computed(() => this.filteredEOBs().reduce((sum, eob) => sum + eob.totalPaid, 0));

  ngOnInit(): void {
    this.loadData();
    this.setupFilters();
  }

  loadData(): void {
    this.isLoading.set(true);
    
    this.insuranceService.getEOBs().subscribe({
      next: (eobs) => {
        this.eobs.set(eobs);
        this.filteredEOBs.set(eobs);
        this.isLoading.set(false);
      },
      error: () => {
        this.notificationService.error( 'Failed to load EOBs');
        this.isLoading.set(false);
      }
    });

    this.patientService.getPatientsByTherapist('therapist-1').subscribe({
      next: (patients) => {
        this.patients.set(patients);
      }
    });
  }

  setupFilters(): void {
    this.filterForm.valueChanges.subscribe(() => {
      this.applyFilters();
    });
  }

  applyFilters(): void {
    const formValue = this.filterForm.value;
    const searchCriteria: EOBSearch = {
      patientId: formValue.patientId || undefined,
      payerName: formValue.payerName || undefined,
      dateFrom: formValue.dateFrom ? new Date(formValue.dateFrom) : undefined,
      dateTo: formValue.dateTo ? new Date(formValue.dateTo) : undefined,
      status: formValue.status || undefined,
      isElectronic: formValue.isElectronic !== '' ? formValue.isElectronic === 'true' : undefined
    };

    this.insuranceService.searchEOBs(searchCriteria).subscribe({
      next: (filteredEOBs) => {
        this.filteredEOBs.set(filteredEOBs);
      }
    });
  }

  clearFilters(): void {
    this.filterForm.reset();
    this.filteredEOBs.set(this.eobs());
  }

  viewEOB(eobId: string): void {
    this.router.navigate(['/insurance/eob', eobId]);
  }

  generateReport(eobId: string): void {
    this.insuranceService.generateEOBReport(eobId).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `EOB-${eobId}.pdf`;
        link.click();
        window.URL.revokeObjectURL(url);
        this.notificationService.success('EOB report downloaded');
      },
      error: () => {
        this.notificationService.error('Failed to generate EOB report');
      }
    });
  }

  getPatientName(patientId: string): string {
    const patient = this.patients().find(p => p.id === patientId);
    return patient ? `${patient.firstName} ${patient.lastName}` : 'Unknown Patient';
  }

  getStatusColor(status: string): string {
    switch (status) {
      case 'received': return 'text-blue-700 bg-blue-100';
      case 'reviewed': return 'text-yellow-700 bg-yellow-100';
      case 'posted': return 'text-green-700 bg-green-100';
      case 'appealed': return 'text-purple-700 bg-purple-100';
      default: return 'text-gray-700 bg-gray-100';
    }
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  }
}