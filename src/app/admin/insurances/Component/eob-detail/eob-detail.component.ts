import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { InsuranceService } from '../../../../service/patient/insurance.service';
import { PatientService } from '../../../../service/patient/patients-service';
import { EOB } from '../../../../models/insurance.model';
import { Patient } from '../../../../models/patients.model';
import { ButtonComponent } from '../../../../shared/button/button.component';
import { TosterService } from '../../../../service/toaster/tostr.service';

@Component({
  selector: 'app-eob-detail',
  standalone: false,
  templateUrl: './eob-detail.component.html',
  styleUrl: './eob-detail.component.scss'
})
export class EobDetailComponent implements OnInit {
  private insuranceService = inject(InsuranceService);
  private patientService = inject(PatientService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private notificationService = inject(TosterService);

  eob = signal<EOB | null>(null);
  patient = signal<Patient | null>(null);
  isLoading = signal(true);

  ngOnInit(): void {
    const eobId = this.route.snapshot.paramMap.get('id');
    if (eobId) {
      this.loadEOB(eobId);
    }
  }

  loadEOB(eobId: string): void {
    this.insuranceService.getEOBById(eobId).subscribe({
      next: (eob) => {
        this.eob.set(eob || null);
        if (eob) {
          this.loadPatient(eob.patientId);
        }
        this.isLoading.set(false);
      },
      error: () => {
        this.notificationService.error( 'Failed to load EOB');
        this.isLoading.set(false);
      }
    });
  }

  loadPatient(patientId: string): void {
    this.patientService.getPatientById(patientId).subscribe({
      next: (patient) => {
        this.patient.set(patient || null);
      }
    });
  }

  downloadReport(): void {
    const eob = this.eob();
    if (!eob) return;

    this.insuranceService.generateEOBReport(eob.id).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `EOB-${eob.claimNumber}.pdf`;
        link.click();
        window.URL.revokeObjectURL(url);
        this.notificationService.success( 'EOB report downloaded');
      },
      error: () => {
        this.notificationService.error('Failed to download EOB report');
      }
    });
  }

  goBack(): void {
    this.router.navigate(['/insurance/eob']);
  }

  getStatusColor(): string {
    const eob = this.eob();
    if (!eob) return 'bg-gray-100 text-gray-700';

    switch (eob.status) {
      case 'received': return 'bg-blue-100 text-blue-700';
      case 'reviewed': return 'bg-yellow-100 text-yellow-700';
      case 'posted': return 'bg-green-100 text-green-700';
      case 'appealed': return 'bg-purple-100 text-purple-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  }
}