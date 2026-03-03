import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { InsuranceService } from '../../../../service/patient/insurance.service';
import { PatientService } from '../../../../service/patient/patients-service';
import { 
  Insurance, 
  InsuranceClaim, 
  Superbill, 
  EligibilityCheck,
  ClaimStats 
} from '../../../../models/insurance.model';
import { Patient } from '../../../../models/patients.model';
import { TosterService } from '../../../../service/toaster/tostr.service';
@Component({
  selector: 'app-insurance-dashboard',
  standalone: false,
  templateUrl: './insurance-dashboard.component.html',
  styleUrl: './insurance-dashboard.component.scss'
})
export class InsuranceDashboardComponent implements OnInit {
  private insuranceService = inject(InsuranceService);
  private patientService = inject(PatientService);
  private router = inject(Router);

  // Expose global objects to template
  public Math = Math;
  public Number = Number;

  insurances = signal<Insurance[]>([]);
  claims = signal<InsuranceClaim[]>([]);
  superbills = signal<Superbill[]>([]);
  eligibilityChecks = signal<EligibilityCheck[]>([]);
  patients = signal<Patient[]>([]);
  claimStats = signal<ClaimStats | null>(null);
  isLoading = signal(true);

  // Computed values
  totalInsurances = computed(() => this.insurances().length);
  activeInsurances = computed(() => this.insurances().filter(ins => ins.isActive).length);
  pendingClaims = computed(() => this.claims().filter(c => c.status === 'pending').length);
  finalizedSuperbillsCount = computed(() => this.superbills().filter(sb => sb.status === 'finalized').length);
  recentSuperbills = computed(() => 
    this.superbills()
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, 5)
  );

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.isLoading.set(true);

    // Load all insurance data
    this.insuranceService.getInsurances().subscribe({
      next: (insurances) => {
        this.insurances.set(insurances);
      }
    });

    this.insuranceService.getClaims().subscribe({
      next: (claims:any) => {
        this.claims.set(claims);
      }
    });

    this.insuranceService.getSuperbills().subscribe({
      next: (superbills) => {
        this.superbills.set(superbills);
      }
    });

    this.insuranceService.getEligibilityChecks().subscribe({
      next: (checks) => {
        this.eligibilityChecks.set(checks);
      }
    });

    this.insuranceService.getClaimStats().subscribe({
      next: (stats) => {
        this.claimStats.set(stats);
        this.isLoading.set(false);
      }
    });

    this.patientService.getPatientsByTherapist('therapist-1').subscribe({
      next: (patients) => {
        this.patients.set(patients);
      }
    });
  }

  // Navigation methods
  navigateToInsurances(): void {
    this.router.navigate(['/insurance/list']);
  }

  navigateToClaims(): void {
    this.router.navigate(['/insurance/newclaims']);
  }

  navigateToSuperbills(): void {
    this.router.navigate(['/insurance/superbills']);
  }

  navigateToEligibility(): void {
    this.router.navigate(['/insurance/eligibility']);
  }

  viewClaim(claimId: string): void {
    this.router.navigate(['/insurance/newclaims', claimId]);
  }

  viewSuperbill(superbillId: string): void {
    this.router.navigate(['/insurance/superbills', superbillId]);
  }
  // navigateToClaims(){

  // }

  viewInsurance(insuranceId: string): void {
    this.router.navigate(['/insurance', insuranceId]);
  }

  createInsurance(): void {
    this.router.navigate(['/insurance/new']);
  }

  createClaim(): void {
    this.router.navigate(['/insurance/Insurance/new']);
  }

  createSuperbill(): void {
    this.router.navigate(['/insurance/superbills/new']);
  }

  runEligibilityCheck(): void {
    this.router.navigate(['/insurance/eligibility/check']);
  }

  navigateToERAs(): void {
    this.router.navigate(['/insurance/era']);
  }

  navigateToEOBs(): void {
    this.router.navigate(['/insurance/eob']);
  }

  getPatientName(patientId: string): string {
    const patient = this.patients().find(p => p.id === patientId);
    return patient ? `${patient.firstName} ${patient.lastName}` : 'Unknown Patient';
  }

  getStatusColor(status: string): string {
    switch (status) {
      case 'active':
      case 'paid':
      case 'approved':
      case 'finalized':
        return 'text-green-700 bg-green-100';
      case 'pending':
      case 'submitted':
      case 'draft':
        return 'text-yellow-700 bg-yellow-100';
      case 'denied':
      case 'inactive':
        return 'text-red-700 bg-red-100';
      default:
        return 'text-gray-700 bg-gray-100';
    }
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  }

  // createSalesReceipt(){
  //   this.router.navigate(['admin/insurance/sales-receipt'])
  // }
}