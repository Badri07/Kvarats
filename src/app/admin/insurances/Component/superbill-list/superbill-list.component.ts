import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';



import { InsuranceService } from '../../../../service/patient/insurance.service';
import { PatientService } from '../../../../service/patient/patients-service';
import { Superbill, SuperbillService, DiagnosisCode, CPTCode, ICD10Code } from '../../../../models/insurance.model';
import { Patient } from '../../../../models/patients.model';
import { TosterService } from '../../../../service/toaster/tostr.service';

@Component({
  selector: 'app-superbill-list',
  standalone: false,
  templateUrl: './superbill-list.component.html',
  styleUrl: './superbill-list.component.scss'
})
export class SuperbillListComponent implements OnInit {
  private insuranceService = inject(InsuranceService);
  private patientService = inject(PatientService);
  private router = inject(Router);
  private fb = inject(FormBuilder);
  private notificationService = inject(TosterService);

  superbills = signal<Superbill[]>([]);
  patients = signal<Patient[]>([]);
  filteredSuperbills = signal<Superbill[]>([]);
  isLoading = signal(true);
  showDeleteModal = signal(false);
  superbillToDelete = signal<Superbill | null>(null);
  isDeleting = signal(false);

  // Filter form
  filterForm: FormGroup = this.fb.group({
    search: [''],
    patientId: [''],
    status: [''],
    dateFrom: [''],
    dateTo: ['']
  });

  // Computed values
  totalSuperbills = computed(() => this.filteredSuperbills().length);
  draftSuperbills = computed(() => this.filteredSuperbills().filter(sb => sb.status === 'draft').length);
  finalizedSuperbills = computed(() => this.filteredSuperbills().filter(sb => sb.status === 'finalized').length);
  totalBilled = computed(() => this.filteredSuperbills().reduce((sum, sb) => sum + sb.totalAmount, 0));

  ngOnInit(): void {
    this.loadData();
    this.setupFilters();
  }

  loadData(): void {
    this.isLoading.set(true);
    
    this.insuranceService.getSuperbills().subscribe({
      next: (superbills) => {
        this.superbills.set(superbills);
        this.filteredSuperbills.set(superbills);
        this.isLoading.set(false);
      },
      error: () => {
        this.notificationService.error( 'Failed to load superbills');
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
    let filtered = this.superbills();

    if (formValue.search) {
      const query = formValue.search.toLowerCase();
      filtered = filtered.filter(superbill => 
        this.getPatientName(superbill.patientId).toLowerCase().includes(query) ||
        superbill.services.some(service => 
          service.cptCode.toLowerCase().includes(query) ||
          service.description.toLowerCase().includes(query)
        )
      );
    }

    if (formValue.patientId) {
      filtered = filtered.filter(superbill => superbill.patientId === formValue.patientId);
    }

    if (formValue.status) {
      filtered = filtered.filter(superbill => superbill.status === formValue.status);
    }

    if (formValue.dateFrom) {
      filtered = filtered.filter(superbill => superbill.serviceDate >= new Date(formValue.dateFrom));
    }

    if (formValue.dateTo) {
      filtered = filtered.filter(superbill => superbill.serviceDate <= new Date(formValue.dateTo));
    }

    this.filteredSuperbills.set(filtered);
  }

  clearFilters(): void {
    this.filterForm.reset();
    this.filteredSuperbills.set(this.superbills());
  }

  createSuperbill(): void {
    this.router.navigate(['/insurance/superbills/new']);
  }

  viewSuperbill(superbillId: string): void {
    this.router.navigate(['/insurance/superbills', superbillId]);
  }

  editSuperbill(superbillId: string): void {
    this.router.navigate(['/insurance/superbills', superbillId, 'edit']);
  }

  finalizeSuperbill(superbillId: string): void {
    this.insuranceService.finalizeSuperbill(superbillId).subscribe({
      next: () => {
        this.notificationService.success( 'Superbill finalized successfully');
        this.loadData();
      },
      error: () => {
        this.notificationService.error( 'Failed to finalize superbill');
      }
    });
  }

  confirmDelete(superbill: Superbill): void {
    this.superbillToDelete.set(superbill);
    this.showDeleteModal.set(true);
  }

  deleteSuperbill(): void {
    const superbill = this.superbillToDelete();
    if (!superbill) return;

    this.isDeleting.set(true);
    this.insuranceService.deleteSuperbill(superbill.id).subscribe({
      next: () => {
        this.notificationService.success( 'Superbill deleted successfully');
        this.loadData();
        this.showDeleteModal.set(false);
        this.superbillToDelete.set(null);
        this.isDeleting.set(false);
      },
      error: () => {
        this.notificationService.error( 'Failed to delete superbill');
        this.isDeleting.set(false);
      }
    });
  }

  getPatientName(patientId: string): string {
    const patient = this.patients().find(p => p.id === patientId);
    return patient ? `${patient.firstName} ${patient.lastName}` : 'Unknown Patient';
  }

  getStatusColor(status: string): string {
    switch (status) {
      case 'draft': return 'text-gray-700 bg-gray-100';
      case 'finalized': return 'text-green-700 bg-green-100';
      case 'submitted': return 'text-blue-700 bg-blue-100';
      case 'paid': return 'text-purple-700 bg-purple-100';
      default: return 'text-gray-700 bg-gray-100';
    }
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  }

  canEdit(superbill: Superbill): boolean {
    return superbill.status === 'draft';
  }

  canFinalize(superbill: Superbill): boolean {
    return superbill.status === 'draft';
  }

  canDelete(superbill: Superbill): boolean {
    return superbill.status === 'draft';
  }
}