import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';

import { InsuranceClaim } from '../../../../models/insurance.model';
import { ERAProcessingResult } from '../../../../models/insurance.model';
import { ButtonComponent } from '../../../../shared/button/button.component';
import { TosterService } from '../../../../service/toaster/tostr.service';
import { PatientService } from '../../../../service/patient/patients-service';
import { ERA } from '../../../../models/insurance.model';
import { Patient } from '../../../../models/patients.model';
import { InsuranceService } from '../../../../service/patient/insurance.service';
import { SchedulerService } from '../../../../service/scheduler/scheduler.service';

@Component({
  selector: 'app-claims',
  standalone: false,
  templateUrl: './claims.component.html',
  styleUrl: './claims.component.scss'
})
export class ClaimsComponent implements OnInit {
  private insuranceService = inject(InsuranceService);
  private patientService = inject(PatientService);
  private router = inject(Router);
  private fb = inject(FormBuilder);
  private notificationService = inject(TosterService);

  public Math = Math;

  claims = signal<InsuranceClaim[]>([]);
  patients = signal<Patient[]>([]);
  filteredClaims = signal<InsuranceClaim[]>([]);
  isLoading = signal(true);
  showDeleteModal = signal(false);
  claimToDelete = signal<InsuranceClaim | null>(null);
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
  totalClaims = computed(() => this.filteredClaims().length);
  pendingClaims = computed(() => this.filteredClaims().filter(c => c.status === 'pending' || c.status === 'submitted').length);
  approvedClaims = computed(() => this.filteredClaims().filter(c => c.status === 'approved' || c.status === 'paid').length);
  deniedClaims = computed(() => this.filteredClaims().filter(c => c.status === 'denied').length);
  totalBilled = computed(() => this.filteredClaims().reduce((sum, c) => sum + (c.totalAmount || 0), 0));
  totalPaid = computed(() => this.filteredClaims().reduce((sum, c) => sum + (c.paidAmount || 0), 0));

  ngOnInit(): void {
    this.loadData();
    this.setupFilters();
    this.fetchAllPatients();
  }

loadData(): void {
  this.isLoading.set(true);
  
  this.insuranceService.getClaims().subscribe({
    next: (res: any) => {
      // console.log("All claims API Response:", res);
      
      if (res && res.success) {
        this.claims.set(res.data || []);
        this.filteredClaims.set(res.data || []);
        // console.log("All claims loaded:", this.claims().length, "claims");
      } else {
        // console.error("All claims API returned unsuccessful response:", res);
        // this.notificationService.error('Failed to load claimsss');
        this.claims.set([]);
        this.filteredClaims.set([]);
      }
      this.isLoading.set(false);
    },
    error: (error) => {
      console.error("All claims API Error:", error);
      // this.notificationService.error('Failed to load claimssss');
      this.isLoading.set(false);
      this.claims.set([]);
      this.filteredClaims.set([]);
    }
  });

  this.patientService.getPatientsByTherapist('therapist-1').subscribe({
    next: (patients) => {
      // this.patients.set(patients);
    },
    error: (error) => {
      console.error("Failed to load patients:", error);
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
    let filtered = this.claims();

    if (formValue.search) {
      const query = formValue.search.toLowerCase();
      filtered = filtered.filter(claim => 
        claim.claimNumber?.toLowerCase().includes(query) ||
        this.getPatientName(claim.patientId).toLowerCase().includes(query)
      );
    }

    if (formValue.patientId) {
      filtered = filtered.filter(claim => claim.patientId === formValue.patientId);
    }

    if (formValue.status) {
      filtered = filtered.filter(claim => claim.status === formValue.status);
    }

    if (formValue.dateFrom) {
      filtered = filtered.filter(claim => new Date(claim.serviceDate) >= new Date(formValue.dateFrom));
    }

    if (formValue.dateTo) {
      const toDate = new Date(formValue.dateTo);
      toDate.setHours(23, 59, 59, 999); // Include the entire day
      filtered = filtered.filter(claim => new Date(claim.serviceDate) <= toDate);
    }

    this.filteredClaims.set(filtered);
  }

  clearFilters(): void {
    this.filterForm.reset();
    this.filteredClaims.set(this.claims());
  }

  createClaim(): void {
    this.router.navigate(['/insurance/Insurance/new']);
  }

 showViewModal = signal(false);
selectedClaim = signal<any>(null);
isLoadingClaim = signal(false);

viewClaim(claimId: string): void {
  console.log("Claim ID:", claimId);
  this.isLoadingClaim.set(true);
  this.showViewModal.set(true);
  
  this.insuranceService.getClaimsByClaimsId(claimId).subscribe({
    next: (res: any) => {
      console.log("Raw claim details response:", res);
      console.log("Response type:", typeof res);
      console.log("Is array?", Array.isArray(res));
      
      // Handle different response formats
      let claimData = null;
      
      // Format 1: Wrapped response {success, message, data}
      if (res && res.success && res.data) {
        console.log("✅ Wrapped format detected");
        claimData = res.data;
      }
      // Format 2: Raw object response (direct claim data)
      else if (res && res.id) {
        console.log("✅ Raw object format detected");
        claimData = res;
      }
      // Format 3: Array response (shouldn't happen for single claim)
      else if (Array.isArray(res) && res.length > 0) {
        console.log("✅ Array format detected - taking first item");
        claimData = res[0];
      }
      else {
        console.error("❌ Unexpected response format:", res);
        this.notificationService.error('Failed to load claim details');
        this.showViewModal.set(false);
        this.isLoadingClaim.set(false);
        return;
      }
      
      this.selectedClaim.set(claimData);
      this.isLoadingClaim.set(false);
    },
    error: (error) => {
      console.error("Error loading claim:", error);
      console.error("Error status:", error.status);
      console.error("Error message:", error.message);
      this.notificationService.error('Failed to load claim details');
      this.isLoadingClaim.set(false);
      this.showViewModal.set(false);
    }
  });
}

closeViewModal(): void {
  this.showViewModal.set(false);
  this.selectedClaim.set(null);
}


formatDate(dateString: string | null): string {
  if (!dateString) return 'N/A';
  return new Date(dateString).toLocaleDateString();
}
  editClaim(claimId: string): void {
    this.router.navigate(['/insurance/Insurance/new', claimId, 'edit']);
  }

  submitClaim(claimId: string): void {
    this.insuranceService.submitClaim(claimId).subscribe({
      next: (res: any) => {
        if (res.success) {
          this.notificationService.success('Claim submitted successfully');
          this.loadData();
        } else {
          this.notificationService.error('Failed to submit claim');
        }
      },
      error: (error) => {
        this.notificationService.error('Failed to submit claim');
      }
    });
  }

  confirmDelete(claim: InsuranceClaim): void {
    this.claimToDelete.set(claim);
    this.showDeleteModal.set(true);
  }

  deleteClaim(): void {
    const claim = this.claimToDelete();
    if (!claim) return;

    this.isDeleting.set(true);
    this.insuranceService.deleteClaim(claim.id).subscribe({
      next: (res: any) => {
        if (res.success) {
          this.notificationService.success('Claim deleted successfully');
          this.loadData();
        } else {
          this.notificationService.error('Failed to delete claim');
        }
        this.showDeleteModal.set(false);
        this.claimToDelete.set(null);
        this.isDeleting.set(false);
      },
      error: (error) => {
        this.notificationService.error('Failed to delete claim');
        this.isDeleting.set(false);
      }
    });
  }

getPatientName(patientId: string): string {
  const patient = this.patientList.find(p => p.id === patientId);
  return patient ? `${patient.firstName} ${patient.lastName}` : 'Unknown Patient';
}


  getStatusColor(status: string): string {
    switch (status) {
      case 'submitted':
      case 'pending':
        return 'text-yellow-700 bg-yellow-100';
      case 'approved':
      case 'paid':
        return 'text-green-700 bg-green-100';
      case 'denied':
        return 'text-red-700 bg-red-100';
      case 'appealed':
        return 'text-blue-700 bg-blue-100';
      case 'resubmitted':
        return 'text-purple-700 bg-purple-100';
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

  canEdit(claim: InsuranceClaim): boolean {
    return claim.status === 'pending' || claim.status === 'denied' || claim.status === 'submitted';
  }

  canSubmit(claim: InsuranceClaim): boolean {
    return claim.status === 'pending';
  }

  canDelete(claim: InsuranceClaim): boolean {
    return claim.status === 'pending' || claim.status === 'submitted';
  }

  public _schedulerService = inject(SchedulerService);
  patientList: any[] = [];
  claimsList: any[] = [];

  fetchAllPatients(): void {
    this._schedulerService.getAllPatientsList().subscribe((res: any) => {
      if (res.success) {
        this.patientList = res.data.patients || [];
        this.patients.set(res.data.patients || []);
      }
    });
  }

  onSelectPatients(data: Event) {
    const selectElement = data.target as HTMLSelectElement;
    this.getClaimsByPatientId(selectElement.value);
  }

getClaimsByPatientId(id: string) {
  if (!id) {
    // If no patient ID is selected, reset to show all claims
    this.filteredClaims.set(this.claims());
    return;
  }
  this.isLoading.set(true);
  this.insuranceService.getClaimsById(id).subscribe({
    next: (res: any) => {
      // console.log("Claims by patient API Response:", res);
      let claimsData = [];
      if (Array.isArray(res)) {
        claimsData = res;
      } 
    
      else if (res && res.success && Array.isArray(res.data)) {
        claimsData = res.data;
      }
      else {
        this.notificationService.error('Failed to load claims');
        claimsData = [];
      }
      this.claimsList = claimsData;
      this.filteredClaims.set(claimsData);
      console.log("Updated filteredClaims with:", this.filteredClaims().length, "claims");
      this.isLoading.set(false);
    },
    error: (error) => {
      this.notificationService.error('Failed to load claims');
      this.isLoading.set(false);
      this.claimsList = [];
      this.filteredClaims.set([]);
    }
  });
}
}