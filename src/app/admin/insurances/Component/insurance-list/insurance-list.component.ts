import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

import { Insurance } from '../../../../models/insurance-model';




import { InsuranceService } from '../../../../service/patient/insurance.service';
import { PatientService } from '../../../../service/patient/patients-service';
import { Superbill, SuperbillService, DiagnosisCode, CPTCode, ICD10Code } from '../../../../models/insurance.model';
import { Patient } from '../../../../models/patients.model';
import { TosterService } from '../../../../service/toaster/tostr.service';
@Component({
  selector: 'app-insurance-list',
  standalone: false,
  templateUrl: './insurance-list.component.html',
  styleUrl: './insurance-list.component.scss'
})
export class InsuranceListComponent implements OnInit {
  private insuranceService = inject(InsuranceService);
  private patientService = inject(PatientService);
  private router = inject(Router);
  private notificationService = inject(TosterService);

  // Expose global objects to template
  public Math = Math;
  public Number = Number;

  insurances = signal<Insurance[]>([]);
  patients = signal<Patient[]>([]);
  isLoading = signal(true);
  showDeleteModal = signal(false);
  insuranceToDelete = signal<Insurance | null>(null);
  isDeleting = signal(false);

  // Computed values
  totalInsurances = computed(() => this.insurances().length);
  activeInsurances = computed(() => this.insurances().filter(ins => ins.isActive).length);
  primaryInsurances = computed(() => this.insurances().filter(ins => ins.isPrimary).length);
  secondaryInsurances = computed(() => this.insurances().filter(ins => !ins.isPrimary).length);
  inNetworkPlans = computed(() => this.insurances().filter(ins => ins.networkStatus === 'in-network').length);

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.isLoading.set(true);

    this.insuranceService.getInsurances().subscribe({
      next: (insurances) => {
        this.insurances.set(insurances);
        this.isLoading.set(false);
      },
      error: () => {
        this.notificationService.error( 'Failed to load insurance plans');
        this.isLoading.set(false);
      }
    });

    this.patientService.getPatientsByTherapist('therapist-1').subscribe({
      next: (patients) => {
        this.patients.set(patients);
      }
    });
  }

  createInsurance(): void {
    this.router.navigate(['/insurance/new']);
  }

  viewInsurance(insuranceId: string): void {
    this.router.navigate(['/insurance', insuranceId]);
  }

  editInsurance(insuranceId: string): void {
    this.router.navigate(['/insurance', insuranceId, 'edit']);
  }

  confirmDelete(insurance: Insurance): void {
    this.insuranceToDelete.set(insurance);
    this.showDeleteModal.set(true);
  }

  deleteInsurance(): void {
    const insurance = this.insuranceToDelete();
    if (!insurance) return;

    this.isDeleting.set(true);
    this.insuranceService.deleteInsurance(insurance.id).subscribe({
      next: () => {
        this.notificationService.success( 'Insurance plan deleted successfully');
        this.loadData();
        this.showDeleteModal.set(false);
        this.insuranceToDelete.set(null);
        this.isDeleting.set(false);
      },
      error: () => {
        this.notificationService.error( 'Failed to delete insurance plan');
        this.isDeleting.set(false);
      }
    });
  }

  setPrimaryInsurance(insurance: Insurance): void {
    this.insuranceService.setPrimaryInsurance(insurance.patientId, insurance.id).subscribe({
      next: () => {
        this.notificationService.success( 'Primary insurance updated');
        this.loadData();
      },
      error: () => {
        this.notificationService.error('Failed to update primary insurance');
      }
    });
  }

  checkEligibility(insuranceId: string): void {
    this.router.navigate(['/insurance/eligibility/check'], { queryParams: { insuranceId } });
  }

  getPatientName(patientId: string): string {
    const patient = this.patients().find(p => p.id === patientId);
    return patient ? `${patient.firstName} ${patient.lastName}` : 'Unknown Patient';
  }

  getStatusColor(status: string | boolean): string {
    if (typeof status === 'boolean') {
      return status ? 'text-green-700 bg-green-100' : 'text-red-700 bg-red-100';
    }
    
    switch (status) {
      case 'active': return 'text-green-700 bg-green-100';
      case 'inactive': return 'text-red-700 bg-red-100';
      default: return 'text-gray-700 bg-gray-100';
    }
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  }

  getNetworkStatusColor(status: string): string {
    switch (status) {
      case 'in-network': return 'network-in-network';
      case 'out-of-network': return 'network-out-of-network';
      case 'unknown': return 'network-unknown';
      default: return 'network-unknown';
    }
  }
}