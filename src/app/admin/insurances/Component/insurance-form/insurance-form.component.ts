import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { PatientService } from '../../../../service/patient/patients-service';
import { AuthService } from '../../../../service/auth/auth.service';
import { InsuranceService } from '../../../../service/patient/insurance.service';
import { Patient } from '../../../../models/patients.model';
import { TosterService } from '../../../../service/toaster/tostr.service';
import { Insurance } from '../../../../models/insurance-model';
import { AdminService } from '../../../../service/admin/admin.service';
import { SchedulerService } from '../../../../service/scheduler/scheduler.service';
import { InsuranceCarrier } from '../../../../models/useradmin-model';
import {
  SchedulerClickEvent,
  AppointmentTypeOption,
  PatientOption,
  MeetingTypeOption,
  User,
} from '../../../../models/scheduler';

@Component({
  selector: 'app-insurance-form',
  standalone: false,
  templateUrl: './insurance-form.component.html',
  styleUrl: './insurance-form.component.scss'
})
export class InsuranceFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private insuranceService = inject(InsuranceService);
  private patientService = inject(PatientService);
  private authService = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private notificationService = inject(TosterService);

  tabs: string[] = ['insurance-info', 'coverage-details'];
  selectedTab: string = 'insurance-info';

  isLoading = signal(false);
  isEditMode = signal(false);
  insuranceId = signal<string | null>(null);
  patients = signal<Patient[]>([]);

  insuranceForm: FormGroup = this.fb.group({
    patientId: [''],
    provider: [''],
    policyNumber: [''],
    groupNumber: [''],
    subscriberId: [''],
    subscriberName: [''],
    subscriberDateOfBirth: [''],
    relationshipToSubscriber: ['self'],
    effectiveDate: [''],
    expirationDate: [''],
    copay: [''],
    deductible: [''],
    coinsurance: [''],
    outOfPocketMax: [''],
    planType: ['ppo'],
    networkStatus: ['in-network'],
    authorizationRequired: [false],
    referralRequired: [false],
    mentalHealthCoverage: [true],
    notes: ['']
  });

  // US Insurance Providers
  usInsuranceProviders = [
    'Aetna',
    'Anthem',
    'Blue Cross Blue Shield',
    'Cigna',
    'Humana',
    'Kaiser Permanente',
    'Medicaid',
    'Medicare',
    'Molina Healthcare',
    'UnitedHealthcare',
    'Other'
  ];

  ngOnInit(): void {
    this.loadPatients();
    this.checkRouteParams();
    // this.getInsuranceCarrier();
    this.fetchDropdownOptions('InsurancePlanType');
  }

  checkRouteParams(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.insuranceId.set(id);
      this.isEditMode.set(true);
      this.loadInsurance(id);
    }
  }

  insuranceArr:any[]=[];
  public _adminService = inject(AdminService);
  public _scheduleService = inject(SchedulerService);
  loadPatients(): void {
    this._scheduleService.getAllPatientsList().subscribe({
      next: (patients:any) => {
        // console.log("patientssssw",patients.data.patients);
        this.patients.set(patients.data.patients);
      }
    });
  }

  onSelectPatients(data:Event){
   
    const selectElement = data.target as HTMLSelectElement;
   console.log("selectElement",selectElement.value);
   this.getInsurancePlan(selectElement.value);
  }
  insurancePlanIds:any[] =[];
  public _patientService = inject(PatientService);
  public _schedulerService = inject(SchedulerService);

    appointmentTypeOptions: AppointmentTypeOption[] = [];
    meetingTypeOptions: MeetingTypeOption[] = [];
  getInsurancePlan(id:string){
    this._patientService.GetInsuranceByPatientId(id).subscribe(res=>{
      this.insurancePlanIds = res.data
      console.log("insurancePlanIdsinsurancePlanIds",this.insurancePlanIds);
      
    })
  }
   getInsuranceCarrier(){
      this._adminService.getInsuranceCarriers().subscribe((res:InsuranceCarrier[])=>{
        this.insuranceArr = res
        console.log("insuranceArrinsuranceArrinsuranceArr",res);
      })
    }

    fetchDropdownOptions(category: string): void {
    this._schedulerService
      .getDropdownsByCategory(category)
      .subscribe((options: any[]) => {
        const mappedOptions = options.map((item) => ({
          id: item.id,
          value: item.name || item.value || item.text || item.label,
        }));

        if (category === 'InsurancePlanType') {
          this.appointmentTypeOptions = mappedOptions;
        }
      });
  }

  loadInsurance(id: string): void {
    this.isLoading.set(true);
    this.insuranceService.getInsuranceById(id).subscribe({
      next: (insurance) => {
        if (insurance) {
          this.populateForm(insurance);
        }
        this.isLoading.set(false);
      },
      error: () => {
        this.notificationService.error( 'Failed to load insurance plan');
        this.isLoading.set(false);
      }
    });
  }

  populateForm(insurance: Insurance): void {
    this.insuranceForm.patchValue({
      patientId: insurance.patientId,
      provider: insurance.provider,
      policyNumber: insurance.policyNumber,
      groupNumber: insurance.groupNumber || '',
      subscriberId: insurance.subscriberId,
      subscriberName: insurance.subscriberName,
      subscriberDateOfBirth: insurance.subscriberDateOfBirth.toISOString().split('T')[0],
      relationshipToSubscriber: insurance.relationshipToSubscriber,
      effectiveDate: insurance.effectiveDate.toISOString().split('T')[0],
      expirationDate: insurance.expirationDate?.toISOString().split('T')[0] || '',
      copay: insurance.copay || '',
      deductible: insurance.deductible || '',
      coinsurance: insurance.coinsurance || '',
      outOfPocketMax: insurance.outOfPocketMax || '',
      planType: insurance.planType,
      networkStatus: insurance.networkStatus,
      authorizationRequired: insurance.authorizationRequired,
      referralRequired: insurance.referralRequired,
      mentalHealthCoverage: insurance.mentalHealthCoverage,
      notes: insurance.notes || ''
    });
  }

  onSubmit(): void {
    if (this.insuranceForm.invalid) {
      this.markFormGroupTouched();
      return;
    }

    this.isLoading.set(true);
    const formValue = this.insuranceForm.value;

    const insuranceData: Omit<Insurance, 'id' | 'createdAt' | 'updatedAt'> = {
      clientId: this.authService.getClientId()!,
      patientId: formValue.patientId,
      isPrimary: false, // Will be set separately if needed
      provider: formValue.provider,
      policyNumber: formValue.policyNumber,
      groupNumber: formValue.groupNumber || undefined,
      subscriberId: formValue.subscriberId,
      subscriberName: formValue.subscriberName,
      subscriberDateOfBirth: new Date(formValue.subscriberDateOfBirth),
      relationshipToSubscriber: formValue.relationshipToSubscriber,
      effectiveDate: new Date(formValue.effectiveDate),
      expirationDate: formValue.expirationDate ? new Date(formValue.expirationDate) : undefined,
      copay: formValue.copay ? Number(formValue.copay) : undefined,
      deductible: formValue.deductible ? Number(formValue.deductible) : undefined,
      coinsurance: formValue.coinsurance ? Number(formValue.coinsurance) : undefined,
      outOfPocketMax: formValue.outOfPocketMax ? Number(formValue.outOfPocketMax) : undefined,
      planType: formValue.planType,
      networkStatus: formValue.networkStatus,
      authorizationRequired: formValue.authorizationRequired,
      referralRequired: formValue.referralRequired,
      mentalHealthCoverage: formValue.mentalHealthCoverage,
      notes: formValue.notes || undefined,
      isActive: true
    };

    const operation = this.isEditMode()
      ? this.insuranceService.updateInsurance(this.insuranceId()!, insuranceData)
      : this.insuranceService.createInsurance(insuranceData);

    operation.subscribe({
      next: () => {
        this.notificationService.success(
         
          `Insurance plan ${this.isEditMode() ? 'updated' : 'created'} successfully`
        );
        this.router.navigate(['/insurance']);
      },
      error: () => {
        this.notificationService.error(
        
          `Failed to ${this.isEditMode() ? 'update' : 'create'} insurance plan`
        );
        this.isLoading.set(false);
      }
    });
  }

  onCancel(): void {
    this.router.navigate(['/insurance/claims']);
  }

  private markFormGroupTouched(): void {
    Object.keys(this.insuranceForm.controls).forEach(key => {
      this.insuranceForm.get(key)?.markAsTouched();
    });
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.insuranceForm.get(fieldName);
    return !!(field && field.invalid && field.touched);
  }

  getFieldError(fieldName: string): string {
    const field = this.insuranceForm.get(fieldName);
    if (!field || !field.errors || !field.touched) return '';

    if (field.errors['required']) return `${fieldName} is required`;
    if (field.errors['email']) return 'Please enter a valid email address';
    
    return '';
  }

  public _toastr = inject(TosterService); 

    saveInsuranceForm(){
    
    if (this.insuranceForm.invalid) {
    // this.patientsInusranceFormSubmitted = true;
    return;
  }
  const formValue = this.insuranceForm.value;
  console.log("formValueformValueformValue",formValue);
  
const payload: any[] = [
  {
    PatientId: formValue.patientId, 
    PolicyHolderName: formValue.subscriberName,              
    Relationship: formValue.relationshipToSubscriber,     
    MemberId: formValue.subscriberId,                         
    policyNumber: formValue.policyNumber,
    GroupNumber: formValue.groupNumber,   
    insurancePlanId: Number(formValue.planType),                 
    InsuranceCarrierId: Number(formValue.provider),                   
    CoPay: Number(formValue.copay),
    Deductible: Number(formValue.deductible),
    Coinsurance: Number(formValue.coinsurance),
    OutOfPocketMax: Number(formValue.outOfPocketMax),
    NetworkStatus: formValue.networkStatus,
    AuthorizationRequired: formValue.authorizationRequired,
    ReferralRequired: formValue.referralRequired,
    MentalHealthCoverage: formValue.mentalHealthCoverage,
    Notes: formValue.notes,
    policyHolderDob: formValue.subscriberDateOfBirth 
      ? new Date(formValue.subscriberDateOfBirth).toISOString() 
      : null,
    effectiveDate: formValue.effectiveDate 
      ? new Date(formValue.effectiveDate).toISOString() 
      : null,
    expiryDate: formValue.expirationDate 
      ? new Date(formValue.expirationDate).toISOString() 
      : null
  }
];



  this._adminService.AddMultipleInsurances(payload).subscribe({
    next: (res: any) => {
      if (res.success) {
        this._toastr.success(res.message);
        // this.showInsurancePopup = false;
        // Optionally refresh the grid data
        // this.getAllPatients();
      } else {
        // this.showInsurancePopup = false;
        this._toastr.error(res.errors);
      }
    },
    error: (err) => {
      // this.showInsurancePopup = false;
      const backendError = err?.error; 
      const errorMsg = Array.isArray(backendError?.errors) 
        ? backendError.errors.join(', ') 
        : backendError?.message || 'Something went wrong';
      this._toastr.error(errorMsg);
    }
  });
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
}