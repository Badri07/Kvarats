import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormArray, AbstractControl } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { InsuranceService } from '../../../../service/patient/insurance.service';
import { PatientService } from '../../../../service/patient/patients-service';
import { Superbill, SuperbillService, DiagnosisCode, CPTCode, ICD10Code } from '../../../../models/insurance.model';
import { Patient } from '../../../../models/patients.model';
import { TosterService } from '../../../../service/toaster/tostr.service';

@Component({
  selector: 'app-superbill-form',
  standalone: false,
  templateUrl: './superbill-form.component.html',
  styleUrl: './superbill-form.component.scss'
})
export class SuperbillFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private insuranceService = inject(InsuranceService);
  private patientService = inject(PatientService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private notificationService = inject(TosterService);

  // Expose global objects to template
  public Number = Number;


  tabs: string[] = ['basic-info', 'diagnosis-review'];
  selectedTab: string = 'basic-info';


  isLoading = signal(false);
  isEditMode = signal(false);
  superbillId = signal<string | null>(null);
  patients = signal<Patient[]>([]);
  cptCodes = signal<CPTCode[]>([]);
  icd10Codes = signal<ICD10Code[]>([]);
  superbillForm!: FormGroup;

  // Computed values
  totalAmount = computed(() => {
    const services = this.servicesArray.value as SuperbillService[];
    return services.reduce((total, service) => total + (service.amount || 0), 0);
  });

  balanceAmount = computed(() => {
    const total = this.totalAmount();
    const paid = Number(this.superbillForm?.get('paymentAmount')?.value || 0);
    return total - paid;
  });

  get servicesArray(): FormArray {
    return this.superbillForm?.get('services') as FormArray;
  }

  get diagnosisArray(): FormArray {
    return this.superbillForm?.get('diagnosis') as FormArray;
  }

  ngOnInit(): void {
    this.initializeForm();
    this.loadData();
    this.checkRouteParams();
  }

  private initializeForm(): void {
    this.superbillForm = this.fb.group({
      patientId: ['', Validators.required],
      serviceDate: [new Date().toISOString().split('T')[0], Validators.required],
      services: this.fb.array([this.createServiceFormGroup()]),
      diagnosis: this.fb.array([this.createDiagnosisFormGroup()]),
      paymentMethod: [''],
      paymentAmount: [''],
      notes: ['']
    });
  }

  loadData(): void {
    this.patientService.getPatientsByTherapist('therapist-1').subscribe({
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
      this.superbillId.set(id);
      this.isEditMode.set(true);
      this.loadSuperbill(id);
    }
  }

  // Add these methods to your component
getServiceFormGroup(index: number): FormGroup {
  return this.servicesArray.at(index) as FormGroup;
}

getDiagnosisFormGroup(index: number): FormGroup {
  return this.diagnosisArray.at(index) as FormGroup;
}

  loadSuperbill(id: string): void {
    this.isLoading.set(true);
    this.insuranceService.getSuperbillById(id).subscribe({
      next: (superbill) => {
        if (superbill) {
          this.populateForm(superbill);
        }
        this.isLoading.set(false);
      },
      error: () => {
        this.notificationService.error( 'Failed to load superbill');
        this.isLoading.set(false);
      }
    });
  }

  populateForm(superbill: Superbill): void {
    // Clear existing arrays
    while (this.servicesArray.length) {
      this.servicesArray.removeAt(0);
    }
    while (this.diagnosisArray.length) {
      this.diagnosisArray.removeAt(0);
    }

    // Populate services
    superbill.services.forEach(service => {
      this.servicesArray.push(this.createServiceFormGroup(service));
    });

    // Populate diagnosis
    superbill.diagnosis.forEach(diagnosis => {
      this.diagnosisArray.push(this.createDiagnosisFormGroup(diagnosis));
    });

    // Patch the main form values
    this.superbillForm.patchValue({
      patientId: superbill.patientId,
      serviceDate: superbill.serviceDate.toISOString().split('T')[0],
      paymentMethod: superbill.paymentMethod || '',
      paymentAmount: superbill.paymentAmount || '',
      notes: superbill.notes || ''
    });
  }

  createServiceFormGroup(service?: SuperbillService): FormGroup {
    return this.fb.group({
      cptCode: [service?.cptCode || '', Validators.required],
      description: [service?.description || ''],
      units: [service?.units || 1, [Validators.required, Validators.min(1)]],
      rate: [service?.rate || 0, [Validators.required, Validators.min(0)]],
      amount: [{value: service?.amount || 0, disabled: true}],
      modifiers: [service?.modifiers?.join(', ') || '']
    });
  }

  createDiagnosisFormGroup(diagnosis?: DiagnosisCode): FormGroup {
    return this.fb.group({
      code: [diagnosis?.code || '', Validators.required],
      description: [diagnosis?.description || ''],
      isPrimary: [diagnosis?.isPrimary || false]
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
        rate: cptCode.rate || 0
      });
      this.updateServiceAmount(index);
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

  updateServiceAmount(index: number): void {
    const serviceGroup = this.servicesArray.at(index) as FormGroup;
    const units = Number(serviceGroup.get('units')?.value || 0);
    const rate = Number(serviceGroup.get('rate')?.value || 0);
    const amount = units * rate;
    
    serviceGroup.patchValue({ amount });
  }

  onSubmit(): void {
    if (this.superbillForm.invalid) {
      this.markFormGroupTouched();
      return;
    }

    this.isLoading.set(true);
    const formValue = this.superbillForm.value;
    const patient = this.patients().find(p => p.id === formValue.patientId);

    if (!patient) {
      this.notificationService.error( 'Patient not found');
      this.isLoading.set(false);
      return;
    }

    const superbillData: Omit<Superbill, 'id' | 'createdAt' | 'updatedAt'> = {
      patientId: formValue.patientId,
      providerId: 'provider-1',
      serviceDate: new Date(formValue.serviceDate),
      createdDate: new Date(),
      status: 'draft',
      patientInfo: {
        name: `${patient.firstName} ${patient.lastName}`,
        dateOfBirth: patient.dateOfBirth,
        address: '123 Patient St, City, ST 12345',
        phone: patient.phone
      },
      providerInfo: {
        name: 'Dr. Sarah Johnson',
        npi: '1234567890',
        taxId: '12-3456789',
        address: '456 Medical Plaza, Anytown, ST 12345',
        phone: '(555) 987-6543',
        licenseNumber: 'LIC123456'
      },
      services: formValue.services.map((service: any) => ({
        id: Math.random().toString(36).substr(2, 9),
        cptCode: service.cptCode,
        description: service.description,
        units: Number(service.units),
        rate: Number(service.rate),
        amount: Number(service.amount),
        modifiers: service.modifiers ? service.modifiers.split(',').map((m: string) => m.trim()) : undefined
      })),
      diagnosis: formValue.diagnosis.map((diag: any) => ({
        code: diag.code,
        description: diag.description,
        isPrimary: diag.isPrimary
      })),
      totalAmount: this.totalAmount(),
      paymentMethod: formValue.paymentMethod || undefined,
      paymentAmount: formValue.paymentAmount ? Number(formValue.paymentAmount) : undefined,
      balanceAmount: this.balanceAmount(),
      notes: formValue.notes || undefined
    };

    const operation = this.isEditMode()
      ? this.insuranceService.updateSuperbill(this.superbillId()!, superbillData)
      : this.insuranceService.createSuperbill(superbillData);

    operation.subscribe({
      next: () => {
        this.notificationService.success(
          `Superbill ${this.isEditMode() ? 'updated' : 'created'} successfully`
        );
        this.router.navigate(['/insurance/superbills']);
      },
      error: () => {
        this.notificationService.error(
          `Failed to ${this.isEditMode() ? 'update' : 'create'} superbill`
        );
        this.isLoading.set(false);
      }
    });
  }

  onCancel(): void {
    this.router.navigate(['/insurance/superbills']);
  }

  private markFormGroupTouched(): void {
    Object.keys(this.superbillForm.controls).forEach(key => {
      this.superbillForm.get(key)?.markAsTouched();
    });
    
    this.servicesArray.controls.forEach(control => {
      Object.keys(control.value).forEach(key => {
        control.get(key)?.markAsTouched();
      });
    });
    
    this.diagnosisArray.controls.forEach(control => {
      Object.keys(control.value).forEach(key => {
        control.get(key)?.markAsTouched();
      });
    });
  }

  isFieldInvalid(fieldName: string, index?: number, arrayType: 'services' | 'diagnosis' = 'services'): boolean {
    if (index !== undefined) {
      let control: AbstractControl | null = null;
      
      if (arrayType === 'services') {
        control = this.servicesArray.at(index)?.get(fieldName);
      } else {
        control = this.diagnosisArray.at(index)?.get(fieldName);
      }
      
      return !!(control && control.invalid && control.touched);
    }
    
    const field = this.superbillForm.get(fieldName);
    return !!(field && field.invalid && field.touched);
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  }

  setTab(tab: string) {
    this.selectedTab = tab;
  }

  onNext() {
    const currentIndex = this.tabs.indexOf(this.selectedTab);
    if (currentIndex < this.tabs.length - 1) {
      this.setTab(this.tabs[currentIndex + 1]);
    } 
  }

  onBack() {
    const currentIndex = this.tabs.indexOf(this.selectedTab);
    if (currentIndex > 0) {
      this.setTab(this.tabs[currentIndex - 1]);
    }
  }


  

  getFieldError(fieldName: string, index?: number, arrayType: 'services' | 'diagnosis' = 'services'): string {
    if (index !== undefined) {
      let control: AbstractControl | null = null;
      
      if (arrayType === 'services') {
        control = this.servicesArray.at(index)?.get(fieldName);
      } else {
        control = this.diagnosisArray.at(index)?.get(fieldName);
      }
      
      if (!control || !control.errors || !control.touched) return '';
      
      if (control.errors['required']) return `${fieldName} is required`;
      return '';
    }
    
    const field = this.superbillForm.get(fieldName);
    if (!field || !field.errors || !field.touched) return '';
    
    if (field.errors['required']) return `${fieldName} is required`;
    return '';
  }
  
  
}