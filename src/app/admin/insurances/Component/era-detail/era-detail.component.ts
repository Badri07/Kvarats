import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';

import { PatientService } from '../../../../service/patient/patients-service';
import { ERA } from '../../../../models/insurance.model';
import { Patient } from '../../../../models/patients.model';


import { InsuranceService } from '../../../../service/patient/insurance.service';
import { ERAProcessingResult } from '../../../../models/insurance.model';
import { ButtonComponent } from '../../../../shared/button/button.component';
import { TosterService } from '../../../../service/toaster/tostr.service';

@Component({
  selector: 'app-era-detail',
  standalone: false,
  templateUrl: './era-detail.component.html',
  styleUrl: './era-detail.component.scss'
})
export class EraDetailComponent implements OnInit {
  private insuranceService = inject(InsuranceService);
  private patientService = inject(PatientService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private notificationService = inject(TosterService);

  era = signal<ERA | null>(null);
  patients = signal<Patient[]>([]);
  isLoading = signal(true);
  isProcessing = signal(false);

  ngOnInit(): void {
    const eraId = this.route.snapshot.paramMap.get('id');
    if (eraId) {
      this.loadERA(eraId);
    }
    this.loadPatients();
  }

  loadERA(eraId: string): void {
    this.insuranceService.getERAById(eraId).subscribe({
      next: (era) => {
        this.era.set(era || null);
        this.isLoading.set(false);
      },
      error: () => {
        this.notificationService.error('Failed to load ERA');
        this.isLoading.set(false);
      }
    });
  }

  loadPatients(): void {
    this.patientService.getPatientsByTherapist('therapist-1').subscribe({
      next: (patients) => {
        this.patients.set(patients);
      }
    });
  }

  processERA(): void {
    const era = this.era();
    if (!era) return;

    this.isProcessing.set(true);
    this.insuranceService.postERAPayments(era.id).subscribe({
      next: () => {
        this.notificationService.success( 'ERA payments posted successfully');
        this.loadERA(era.id);
        this.isProcessing.set(false);
      },
      error: () => {
        this.notificationService.error('Failed to process ERA');
        this.isProcessing.set(false);
      }
    });
  }

  reconcileERA(): void {
    const era = this.era();
    if (!era) return;

    this.isProcessing.set(true);
    this.insuranceService.reconcileERA(era.id).subscribe({
      next: () => {
        this.notificationService.success( 'ERA reconciled successfully');
        this.loadERA(era.id);
        this.isProcessing.set(false);
      },
      error: () => {
        this.notificationService.error( 'Failed to reconcile ERA');
        this.isProcessing.set(false);
      }
    });
  }

  goBack(): void {
    this.router.navigate(['/insurance/era']);
  }

  getPatientName(patientName: string): string {
    // Try to match by name first, then return the name from ERA
    const patient = this.patients().find(p => 
      `${p.firstName} ${p.lastName}`.toLowerCase() === patientName.toLowerCase()
    );
    return patient ? `${patient.firstName} ${patient.lastName}` : patientName;
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

  getClaimStatusColor(status: string): string {
    switch (status) {
      case 'paid': return 'text-green-700 bg-green-100';
      case 'denied': return 'text-red-700 bg-red-100';
      case 'adjusted': return 'text-yellow-700 bg-yellow-100';
      case 'pending': return 'text-blue-700 bg-blue-100';
      default: return 'text-gray-700 bg-gray-100';
    }
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  }

  canProcess(): boolean {
    return this.era()?.status === 'received';
  }

  canReconcile(): boolean {
    return this.era()?.status === 'posted';
  }
}