import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { PatientService } from '../../../../service/patient/patients-service';
import { ERA,ERASearch } from '../../../../models/insurance.model';
import { Patient } from '../../../../models/patients.model';
import { InsuranceService } from '../../../../service/patient/insurance.service';
import { ERAProcessingResult } from '../../../../models/insurance.model';
import { ButtonComponent } from '../../../../shared/button/button.component';
import { TosterService } from '../../../../service/toaster/tostr.service';

@Component({
  selector: 'app-era-list',
  standalone: false,
  templateUrl: './era-list.component.html',
  styleUrl: './era-list.component.scss'
})
export class EraListComponent implements OnInit {
  private insuranceService = inject(InsuranceService);
  private router = inject(Router);
  private fb = inject(FormBuilder);
  private notificationService = inject(TosterService);

  eras = signal<ERA[]>([]);
  filteredERAs = signal<ERA[]>([]);
  isLoading = signal(true);

  // Filter form
  filterForm: FormGroup = this.fb.group({
    search: [''],
    payerName: [''],
    status: [''],
    paymentMethod: [''],
    dateFrom: [''],
    dateTo: ['']
  });

  // Computed values
  totalERAs = computed(() => this.filteredERAs().length);
  receivedERAs = computed(() => this.filteredERAs().filter(era => era.status === 'received').length);
  processedERAs = computed(() => this.filteredERAs().filter(era => era.status === 'processed').length);
  totalPayments = computed(() => this.filteredERAs().reduce((sum, era) => sum + era.totalPaymentAmount, 0));

  ngOnInit(): void {
    this.loadData();
    this.setupFilters();
  }

  loadData(): void {
    this.isLoading.set(true);
    
    this.insuranceService.getERAs().subscribe({
      next: (eras) => {
        this.eras.set(eras);
        this.filteredERAs.set(eras);
        this.isLoading.set(false);
      },
      error: () => {
        this.notificationService.error( 'Failed to load ERAs');
        this.isLoading.set(false);
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
    const searchCriteria: ERASearch = {
      payerName: formValue.payerName || undefined,
      checkNumber: formValue.search || undefined,
      dateFrom: formValue.dateFrom ? new Date(formValue.dateFrom) : undefined,
      dateTo: formValue.dateTo ? new Date(formValue.dateTo) : undefined,
      status: formValue.status || undefined,
      paymentMethod: formValue.paymentMethod || undefined
    };

    this.insuranceService.searchERAs(searchCriteria).subscribe({
      next: (filteredERAs) => {
        this.filteredERAs.set(filteredERAs);
      }
    });
  }

  clearFilters(): void {
    this.filterForm.reset();
    this.filteredERAs.set(this.eras());
  }

  uploadERA(): void {
    this.router.navigate(['/insurance/era/upload']);
  }

  viewERA(eraId: string): void {
    this.router.navigate(['/insurance/era', eraId]);
  }

  processERA(eraId: string): void {
    this.insuranceService.postERAPayments(eraId).subscribe({
      next: () => {
        this.notificationService.success( 'ERA payments posted successfully');
        this.loadData();
      },
      error: () => {
        this.notificationService.error( 'Failed to process ERA');
      }
    });
  }

  reconcileERA(eraId: string): void {
    this.insuranceService.reconcileERA(eraId).subscribe({
      next: () => {
        this.notificationService.success( 'ERA reconciled successfully');
        this.loadData();
      },
      error: () => {
        this.notificationService.error( 'Failed to reconcile ERA');
      }
    });
  }

  getStatusColor(status: string): string {
    switch (status) {
      case 'received': return 'text-blue-700 bg-blue-100';
      case 'processed': return 'text-yellow-700 bg-yellow-100';
      case 'posted': return 'text-green-700 bg-green-100';
      case 'reconciled': return 'text-purple-700 bg-purple-100';
      default: return 'text-gray-700 bg-gray-100';
    }
  }

  getPaymentMethodColor(method: string): string {
    switch (method) {
      case 'ACH': return 'text-green-700 bg-green-100';
      case 'CHECK': return 'text-blue-700 bg-blue-100';
      case 'WIRE': return 'text-purple-700 bg-purple-100';
      default: return 'text-gray-700 bg-gray-100';
    }
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  }

  canProcess(era: ERA): boolean {
    return era.status === 'received';
  }

  canReconcile(era: ERA): boolean {
    return era.status === 'posted';
  }

  getClaimsCountByStatus(era: ERA, status: string): number {
    return era.claims.filter(c => c.claimStatus === status).length;
  }
}