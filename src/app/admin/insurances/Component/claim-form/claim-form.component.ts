import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormArray } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { InsuranceService } from '../../../../service/patient/insurance.service';
import { AuthService } from '../../../../service/auth/auth.service';
import { Insurance, ClaimService, CPTCode, ICD10Code } from '../../../../models/insurance.model';
import { TosterService } from '../../../../service/toaster/tostr.service';
import { PatientService } from '../../../../service/patient/patients-service';
import { Patient } from '../../../../models/patients.model';
import { SchedulerService } from '../../../../service/scheduler/scheduler.service';
import { AppointmentTypeOption, MeetingTypeOption } from '../../../../models/scheduler';
import { AdminService } from '../../../../service/admin/admin.service';
import { BreadcrumbService } from '../../../../shared/breadcrumb/breadcrumb.service';

type ClaimTab = 'claim-details' | 'diagnosis-review';

@Component({
  selector: 'app-claim-form',
  standalone: false,
  templateUrl: './claim-form.component.html',
  styleUrl: './claim-form.component.scss'
})
export class ClaimFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private insuranceService = inject(InsuranceService);
  private patientService = inject(PatientService);
  private authService = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private notificationService = inject(TosterService);

  selectedSlidingScaleId: string | null = null;
  slidingScalesList:any=[];
  totalAmounts: number = 0;

  // Expose Number to template
  public Number = Number;

  isLoading = signal(false);
  isSaving = signal(false);
  isEditMode = signal(false);
  claimId = signal<string | null>(null);
  formSubmitted = false;

  tabs: ClaimTab[] = ['claim-details', 'diagnosis-review'];
  selectedTab: ClaimTab = 'claim-details';

  patients = signal<Patient[]>([]);
  patientInsurances = signal<Insurance[]>([]);
  cptCodes = signal<CPTCode[]>([]);
  icd10Codes = signal<ICD10Code[]>([]);

  claimForm: FormGroup = this.fb.group({
    patientId: ['', Validators.required],
    insuranceId: ['', Validators.required],
    serviceDate: ['', Validators.required],
    services: this.fb.array([]),
    diagnosis: this.fb.array([]),
    notes: ['']
  });

  // Computed values
  totalAmount(): number {
    
    const services = this.servicesArray.value;
    let total = services.reduce((sum: number, service: any) => {
      const amount = Number(service.chargedAmount) || 0;
      const units = Number(service.units) || 1;
      return sum + amount * units;

    }, 0);

    // Apply sliding scale discount
    const discountPercentage = this.getSelectedDiscountPercentage();
    if (discountPercentage > 0) {
      total = total * (1 - discountPercentage / 100);
    }

    return total;
  }

  getSelectedDiscountPercentage(): number {
    const selectedScale = this.slidingScalesList.find((scale:any) => scale.id === this.selectedSlidingScaleId);
    return selectedScale ? selectedScale.discountPercentage : 0;
  }
  // Calculate discounted amount based on selected sliding scale
//  discountedAmount(): number {
//   const total = this.totalAmount();
//   const discountPercentage = this.getSelectedDiscountPercentage();
//   return total - (total * discountPercentage / 100);
// }

  // Update other computed amounts to use the discounted amount
  // copayAmount:any = computed(() => {
  //   const discounted = this.discountedAmount();
  //   // Your copay calculation logic here, for example:
  //   return discounted * 0.1; // 10% copay
  // });

  // insuranceClaimAmount:any = computed(() => {
  //   const discounted = this.discountedAmount();
  //   // Your insurance claim calculation logic here, for example:
  //   return discounted * 0.8; // 80% insurance coverage
  // });

  // patientPaysAmount:any = computed(() => {
  //   const discounted = this.discountedAmount();
  //   return discounted - this.copayAmount() - this.insuranceClaimAmount();
  // });

  get servicesArray(): FormArray {
    return this.claimForm.get('services') as FormArray;
  }

  get diagnosisArray(): FormArray {
    return this.claimForm.get('diagnosis') as FormArray;
  }

  selectedInsurance: any = null;
  transactionNotes: string = '';

  patientList: any[] = [];
  public _schedulerService = inject(SchedulerService);
  public _patientService = inject(PatientService);
  public _adminService = inject(AdminService);

  insurancePlanIds: any[] = [];
  meetingTypeOptions: MeetingTypeOption[] = [];
  appointmentTypeOptions: AppointmentTypeOption[] = [];

    public breadcrumbService = inject(BreadcrumbService)
  

  ngOnInit(): void {
    this.loadData();
    this.checkRouteParams();
    this.setupFormSubscriptions();
    this.fetchAllPatients();
    this.fetchDropdownOptions('AppointmentType');
    this.fetchDropdownOptions('MeetingType');
    // Initialize with one service and diagnosis only if not in edit mode
    if (!this.isEditMode()) {
      if (this.servicesArray.length === 0) {
        this.addService();
      }
      if (this.diagnosisArray.length === 0) {
        this.addDiagnosis();
      }
    }
this._adminService.getSlidingScales().subscribe(data => this.slidingScalesList = data);
    // Subscribe to services changes to update totalAmounts
    this.servicesArray.valueChanges.subscribe(() => {
      this.totalAmounts = this.totalAmount();
    });

      this.breadcrumbService.setBreadcrumbs([
  
  {
    label: 'Claim Dashboard',
    url: 'insurance/claims'
  },
  {
    label: 'Eligibility Check',
    url: 'insurance/eligibility/check'
  },
  {
    label: '',
    url: ''
  }
    ]);
    this.breadcrumbService.setVisible(true);

  }

  loadData(): void {
    this.patientService.getPatientsByClient(this.authService.getClientId()!).subscribe({
      next: (patients) => {
        this.patients.set(patients);
      }
    });

    this.insuranceService.getCPTCodes().subscribe({
      next: (codes) => {
        this.cptCodes.set(codes);
      }
    });

    this.insuranceService.getICD10Codes().subscribe({
      next: (codes) => {
        this.icd10Codes.set(codes);
      }
    });
  }

  checkRouteParams(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.claimId.set(id);
      this.isEditMode.set(true);
      this.loadClaim(id);
    } else {
      // Set default service date to today
      this.claimForm.patchValue({
        serviceDate: new Date().toISOString().split('T')[0]
      });
    }
  }

  setupFormSubscriptions(): void {
    this.claimForm.get('patientId')?.valueChanges.subscribe(patientId => {
      if (patientId) {
        this.loadPatientInsurances(patientId);
        this.claimForm.patchValue({ insuranceId: '' });
      }
    });
  }

  loadPatientInsurances(patientId: string): void {
    this.insuranceService.getInsurancesByPatient(patientId).subscribe({
      next: (insurances) => {
        this.patientInsurances.set(insurances);
      }
    });
  }

  loadClaim(id: string): void {
    this.isLoading.set(true);
    this.insuranceService.getClaimById(id).subscribe({
      next: (claim) => {
        if (claim) {
          this.populateForm(claim);
        }
        this.isLoading.set(false);
      },
      error: () => {
        this.notificationService.error('Failed to load claim');
        this.isLoading.set(false);
      }
    });
  }

  populateForm(claim: any): void {
    this.claimForm.patchValue({
      patientId: claim.patientId,
      insuranceId: claim.insuranceId,
      serviceDate: claim.serviceDate.toISOString().split('T')[0],
      notes: claim.notes || ''
    });

    // Load patient insurances
    this.loadPatientInsurances(claim.patientId);

    // Clear existing arrays
    while (this.servicesArray.length) {
      this.servicesArray.removeAt(0);
    }
    while (this.diagnosisArray.length) {
      this.diagnosisArray.removeAt(0);
    }

    // Populate services
    claim.services.forEach((service: any) => {
      this.servicesArray.push(this.createServiceFormGroup(service));
    });

    // Populate diagnosis from services
    const uniqueDiagnosis:any = [...new Set(claim.services.flatMap((s: any) => s.diagnosis))];
    uniqueDiagnosis.forEach((code: string, index: number) => {
      this.diagnosisArray.push(this.createDiagnosisFormGroup(code, index === 0));
    });
  }

  clientFormSubmitted:boolean = false;

 private createServiceFormGroup(service?: any): FormGroup {
  return this.fb.group({
    cptCode: [service?.cptCode || service?.cptName || '', Validators.required],
    description: [service?.description || ''],
    serviceDate: [
      service?.serviceDate 
        ? new Date(service.serviceDate).toISOString().split('T')[0] 
        : new Date().toISOString().split('T')[0], 
      Validators.required
    ],
    units: [service?.units || 1, [Validators.required, Validators.min(1)]],
    chargedAmount: [service?.chargedAmount || service?.amount || 0, [Validators.required, Validators.min(0)]],
    placeOfService: [service?.placeOfService || '11', Validators.required],
    modifiers: [service?.modifiers || ''],
    meetingTypeInput: [service?.meetingTypeInput || service?.meetingType || service?.type || '']
  });

}
  createDiagnosisFormGroup(code?: string, isPrimary: boolean = false): FormGroup {
    return this.fb.group({
      code: [code || '', Validators.required],
      description: [''],
      isPrimary: [isPrimary]
    });
  }

  addService(): void {
    this.servicesArray.push(this.createServiceFormGroup());
  }

  removeService(index: number): void {
    if (this.servicesArray.length > 1) {
      this.servicesArray.removeAt(index);
    }
  }

  addDiagnosis(): void {
    this.diagnosisArray.push(this.createDiagnosisFormGroup());
  }

  removeDiagnosis(index: number): void {
    if (this.diagnosisArray.length > 1) {
      this.diagnosisArray.removeAt(index);
    }
  }

  onCPTCodeChange(index: number, event: Event): void {
    const target = event.target as HTMLSelectElement;
    const cptCode = this.cptCodes().find(code => code.code === target.value);
    
    if (cptCode) {
      const serviceGroup = this.servicesArray.at(index) as FormGroup;
      serviceGroup.patchValue({
        description: cptCode.description,
        chargedAmount: cptCode.rate || 0
      });
    }
  }

  onICD10CodeChange(index: number, event: Event): void {
    const target = event.target as HTMLSelectElement;
    const icd10Code = this.icd10Codes().find(code => code.code === target.value);
    
    if (icd10Code) {
      const diagnosisGroup = this.diagnosisArray.at(index) as FormGroup;
      diagnosisGroup.patchValue({
        description: icd10Code.description
      });
    }
  }

  validateCurrentTab(): boolean {
    this.formSubmitted = true;
    
    switch (this.selectedTab) {
      case 'claim-details':
        // Ensure all controls are valid, fallback to false if undefined
        const patientIdValid = this.claimForm.get('patientId')?.valid ?? false;
        const insuranceIdValid = this.claimForm.get('insuranceId')?.valid ?? false;
        const serviceDateValid = this.claimForm.get('serviceDate')?.valid ?? false;
        const servicesValid = this.servicesArray?.valid ?? false;
        return patientIdValid && insuranceIdValid && serviceDateValid && servicesValid;

      case 'diagnosis-review':
        // Ensure diagnosis array is valid, fallback to false if undefined
        return this.diagnosisArray?.valid ?? false;

      default:
        return true;
    }
  }

  setTab(tab: ClaimTab): void {
    if (this.validateCurrentTab()) {
      this.selectedTab = tab;
    }
  }

  onNext(): void {
    if (this.validateCurrentTab()) {
      const currentIndex = this.tabs.indexOf(this.selectedTab);
      if (currentIndex < this.tabs.length - 1) {
        this.selectedTab = this.tabs[currentIndex + 1];
      } 
    }
  }

  onBack(): void {
    const currentIndex = this.tabs.indexOf(this.selectedTab);
    if (currentIndex > 0) {
      this.selectedTab = this.tabs[currentIndex - 1];
    }
  }

  
  setProviderId:any;
  setInsuranceId:any;
  onSubmit(): void {
    
    this.formSubmitted = true;
    console.log('Form submitted');

  console.log("formValue.insuranceId",this.claimForm.get('insuranceId')?.value);
  
    if (this.selectedTab !== 'diagnosis-review') {
    this.onNext();
    return;
  }

    if (this.claimForm.invalid) {
      console.warn('Form invalid:', this.claimForm.value);
      this.markFormGroupTouched();
      this.notificationService.error('Please fill in all required fields');
      return;
    }

    this.isSaving.set(true);
    const formValue = this.claimForm.value;
    console.log('Form value:', formValue);

      console.log("formValue.patientId || !this.setInsuranceId",formValue.patientId || !this.setInsuranceId);

const patient = this.patients().find((p:any) => {
  console.log("ppp", p);
  return p.id === formValue.patientId;
});
    console.log('Selected patient:', patient);
    // this.patients().forEach((item,value)=>{
    //   console.log("setInsuranceIdsetInsuranceIdsetInsuranceId",item,value);
    // })
    
    
      const insurance = this.patientInsurances().find(ins =>{
        console.log("insususus",ins);
        
ins.id === formValue.insuranceId})

console.log("this.setInsuranceIdthisthis.setInsuranceIdthis.setInsuranceId.setInsuranceId",this.setInsuranceId);

    
   
    // if (formValue.patientId || !this.setInsuranceId) {
    //   console.error('Patient or insurance not found');
    //   this.notificationService.error('Patient or insurance not found');
    //   this.isSaving.set(false);
    //   return;
    // }

    const claimServices: ClaimService[] = formValue.services.map((service: any) => {
      const mappedService = {
        id: this.setserviceId,
        cptCode:this.setcptCode,
        description: service.description,
        serviceDate: new Date(service.serviceDate),
        units: Number(service.units),
        chargedAmount: Number(service.chargedAmount),
        placeOfService: service.placeOfService,
        // diagnosis: formValue.diagnosis.map((diag: any) => diag.code),
         modifiers: service.modifiers
          ? service.modifiers.split(',').map((m: string) => m.trim()).filter((m: string) => m)
          : undefined,
        meetingTypeInput: service.meetingTypeInput
      };
      console.log('Mapped service item:', mappedService);
      return mappedService;
    });

    const claimData: any = {
      insuranceId:formValue.insuranceId,
      patientId: formValue.patientId,
      providerId: this.setProviderId,
      serviceDate: new Date(formValue.serviceDate),
      submissionDate: new Date(),
      totalAmount: this.totalAmount(),
      status: 'pending',
      services: claimServices,
      notes: formValue.notes || undefined
    };
    console.log('Final claim data to submit:', claimData);

    const operation = this.isEditMode()
      ? this.insuranceService.updateClaim(this.claimId()!, claimData)
      : this.insuranceService.createClaim(claimData);

    operation.subscribe({
      next: () => {
        console.log('Claim operation successful');
        this.notificationService.success(
          `Claim ${this.isEditMode() ? 'updated' : 'created'} successfully`
        );
        this.router.navigate(['/insurance/newclaims']);
      },
      error: (err) => {
        console.error('Claim operation failed:', err);
        this.notificationService.error(
          `Failed to ${this.isEditMode() ? 'update' : 'create'} claim`
        );
        this.isSaving.set(false);
      }
    });
  }

  onCancel(): void {
    this.router.navigate(['/insurance/claims']);
  }

  getPatientName(patientId: string): string {
    const patient = this.patients().find(p => p.id === patientId);
    return patient ? `${patient.firstName} ${patient.lastName}` : 'Unknown';
  }

  getInsuranceName(insuranceId: string): string {
    const insurance = this.patientInsurances().find(ins =>{
      this.setInsuranceId = ins.id
      ins.id === insuranceId})
    
    return insurance ? insurance.provider : 'Unknown';
  }

  private markFormGroupTouched(): void {
    Object.keys(this.claimForm.controls).forEach(key => {
      this.claimForm.get(key)?.markAsTouched();
    });
    
    this.servicesArray.controls.forEach(control => {
      Object.keys((control as FormGroup).controls).forEach(key => {
        control.get(key)?.markAsTouched();
      });
    });
    
    this.diagnosisArray.controls.forEach(control => {
      Object.keys((control as FormGroup).controls).forEach(key => {
        control.get(key)?.markAsTouched();
      });
    });
  }

  isFieldInvalid(fieldName: string, index?: number): boolean {
    if (index !== undefined) {
      const control = this.servicesArray.at(index)?.get(fieldName) || this.diagnosisArray.at(index)?.get(fieldName);
      return !!(control && control.invalid && (control.touched || this.formSubmitted));
    }
    
    const field = this.claimForm.get(fieldName);
    return !!(field && field.invalid && (field.touched || this.formSubmitted));
  }

  getFieldError(fieldName: string, index?: number): string {
    let field;
    if (index !== undefined) {
      field = this.servicesArray.at(index)?.get(fieldName) || this.diagnosisArray.at(index)?.get(fieldName);
    } else {
      field = this.claimForm.get(fieldName);
    }
    
    if (!field || !field.errors || (!field.touched && !this.formSubmitted)) return '';

    if (field.errors['required']) return `${this.formatFieldName(fieldName)} is required`;
    if (field.errors['min']) return `${this.formatFieldName(fieldName)} must be at least ${field.errors['min'].min}`;
    
    return '';
  }

  formatFieldName(fieldName: string): string {
    return fieldName
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, str => str.toUpperCase());
  }

  formatCurrency(amount: any): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  }

  serviceProviderArr:any[]=[];
   
  getClaimsByPatients(id: string) {
  
  this.insuranceService.GetPendingPaymentsByPatientId(id).subscribe(res => {
    console.log("API Response:", res);
    
    const serviceFormGroups = res.data.map((claim: any) => {
      console.log("Processing claim:", claim);
      this.setserviceId = claim.serviceId;
      this.setcptCode = claim.cptCode;
      
      const meetingTypeOption = this.meetingTypeOptions.find(option => {
        return option.value.toLowerCase() === claim.meetingTypeName?.toLowerCase();
      });

      console.log("Found meeting type option:", meetingTypeOption);

      return this.fb.group({
        cptCode: [claim.cptName || claim.cptCode || '', Validators.required],
        description: [claim.serviceDescription || '', Validators.required],
        serviceDate: [
          claim.serviceDate || claim.createdAt
            ? new Date(claim.serviceDate || claim.createdAt).toISOString().split('T')[0] 
            : new Date().toISOString().split('T')[0], 
          Validators.required
        ],
        units: [claim.units || 1, [Validators.required, Validators.min(1)]],
        chargedAmount: [claim.servicePrice || claim.servicePrice || 0, [Validators.required, Validators.min(0)]],
        placeOfService: [claim.placeOfService || '11', Validators.required],
        modifiers: [claim.modifiers || ''],
        meetingTypeInput: [meetingTypeOption?.id || '', Validators.required],
        notes: [claim?.notes || '', Validators.required]
      });
    });
    
    // Set the form array value
    this.claimForm.setControl('services', this.fb.array(serviceFormGroups));
    
    // CORRECTED: Patch notes if available - check res.data instead of res
    if (res.data.length > 0) {
      this.claimForm.patchValue({
        notes: res.data[0].notes || ''  // Use res.data[0] instead of res[0]
      });
    }
    
    console.log("Final Form Values:", this.claimForm.value);
  });
}


addServiceWithData(serviceData: any) {
  const serviceGroup = this.createServiceFormGroup(serviceData);
  this.servicesArray.push(serviceGroup);
}

getDiscountAmount(): number {
  const discountPercentage = this.getSelectedDiscountPercentage();
  const total = this.totalAmount();
  
  console.log('Total amount:', total);
  console.log('Discount percentage:', discountPercentage);
  
  const discount = (total * discountPercentage) / 100;
  console.log('Raw discount:', discount);
  
  const roundedDiscount = parseFloat(discount.toFixed(2));
  console.log('Rounded discount:', roundedDiscount);
  
  return roundedDiscount;
}

recalculateInsuranceClaim() {
  // // Get the total amount after applying discount
  // const discountedTotal = this.discountedAmount();
  
  // // Find the selected insurance plan
  // const insuranceId = this.claimForm.get('insuranceId')?.value;
  // this.selectedInsurance = this.insurancePlanIds.find(ins => ins.id === insuranceId);
  
  // if (this.selectedInsurance) {
  //   // Calculate based on insurance coverage
  //   const copayPercentage = this.selectedInsurance.copayPercentage || 0;
  //   const coveragePercentage = this.selectedInsurance.coveragePercentage || 0;
    
  //   this.copayAmount = discountedTotal * (copayPercentage / 100);
  //   this.insuranceClaimAmount = discountedTotal * (coveragePercentage / 100);
  //   this.patientPaysAmount = discountedTotal - this.copayAmount - this.insuranceClaimAmount;
  // } else {
  //   // No insurance selected, patient pays full discounted amount
  //   this.copayAmount = 0;
  //   this.insuranceClaimAmount = 0;
  //   this.patientPaysAmount = discountedTotal;
  // }
  
  // this.updateTransactionNotes();
  // this.claimForm.updateValueAndValidity();
}

  private generateId(): string {
    return Math.random().toString(36).substr(2, 9);
  }

  // updateTransactionNotes(): void {
  //   if (this.selectedInsurance) {
  //     this.transactionNotes = (this.insuranceClaimAmount() > 0 || this.copayAmount() > 0)
  //       ? 'Partially covered by insurance'
  //       : 'Fully paid by patient';
  //   } else {
  //     this.transactionNotes = (this.patientPaysAmount() > 0)
  //       ? 'Paid by patient'
  //       : '';
  //   }
  // }

  fetchAllPatients(): void {
    this._schedulerService.GetPatientWithInsurance().subscribe((patients: any) => {
      this.patientList = patients.data.patients;
      this.patients.set(patients.data.patients);
    });
  }

  setserviceId:any;
  setcptCode:any;
  getInsurancePlan(id: string) {
    
    this._patientService.GetInsuranceByPatientId(id).subscribe(res => {
      this.insurancePlanIds = res.data;
    });
  }

  onSelectPatients(data: Event) {
    
    const selectElement = data.target as HTMLSelectElement;
    this.getInsurancePlan(selectElement.value);
    this.getClaimsByPatients(selectElement.value);
  }

  fetchDropdownOptions(category: string): void {
    this._schedulerService
      .getDropdownsByCategory(category)
      .subscribe((options: any[]) => {
        const mappedOptions = options.map((item) => ({
          id: item.id,
          value: item.name || item.value || item.text || item.label,
        }));

        if (category === 'AppointmentType') {
          this.appointmentTypeOptions = mappedOptions;
        } else if (category === 'MeetingType') {
          this.meetingTypeOptions = mappedOptions;
        }
      });
  }

//   getSelectedDiscountPercentage(): number {
//   if (!this.selectedSlidingScaleId) return 0;
//   const selectedScale = this.slidingScalesList.find(scale => scale.id === this.selectedSlidingScaleId);
//   return selectedScale ? selectedScale.discountPercentage : 0;
// }


}