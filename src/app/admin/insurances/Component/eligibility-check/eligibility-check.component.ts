import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { DatePipe } from '@angular/common';
import { InsuranceService } from '../../../../service/patient/insurance.service';
import { PatientService } from '../../../../service/patient/patients-service';
import { Insurance, EligibilityCheck } from '../../../../models/insurance.model';
import { Patient } from '../../../../models/patients.model';
import { ButtonComponent } from '../../../../shared/button/button.component';
import { TosterService } from '../../../../service/toaster/tostr.service';
import { SchedulerService } from '../../../../service/scheduler/scheduler.service';
import { AdminService } from '../../../../service/admin/admin.service';
import { InsuranceCarrier } from '../../../../models/useradmin-model';
import { BreadcrumbService } from '../../../../shared/breadcrumb/breadcrumb.service';

@Component({
  selector: 'app-eligibility-check',
  standalone: false,
  templateUrl: './eligibility-check.component.html',
  styleUrl: './eligibility-check.component.scss',
  providers: [DatePipe]
})
export class EligibilityCheckComponent implements OnInit {
  private fb = inject(FormBuilder);
  private insuranceService = inject(InsuranceService);
  private patientService = inject(PatientService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private notificationService = inject(TosterService);

  patients = signal<Patient[]>([]);
  insurances = signal<Insurance[]>([]);
  patientInsurances = signal<Insurance[]>([]);
  isLoading = signal(false);
  isChecking = signal(false);
  eligibilityResult = signal<EligibilityCheck | null>(null);

  currentDateTime: string | null = null;

  public breadcrumbService = inject(BreadcrumbService)

  eligibilityForm: FormGroup = this.fb.group({
    patientId: ['', Validators.required],
    insuranceId: ['', Validators.required]
  });

  ngOnInit(): void {
    this.loadData();
    this.checkQueryParams();
    this.setupFormSubscriptions();
    this.fetchAllPatients();
    this.getInsuranceCarrier();
    // this.getInsurancePlan();

       this.breadcrumbService.setBreadcrumbs([
  
  {
    label: 'Claim Dashboard',
    url: 'insurance/claims'
  },
  {
    label: '',
    url: ''
  },
    ]);
    this.breadcrumbService.setVisible(true);

  }

  today = new Date();
  status:string = 'Completed';

constructor(private datePipe: DatePipe){
  const now = new Date();
  this.currentDateTime = this.datePipe.transform(now, 'MMM d, y - h:mm a');
}
  public _schedulerService = inject(SchedulerService);
  public _adminservice = inject(AdminService);
  public _patientService = inject(PatientService);
  patientList:any[]=[];
  fetchAllPatients(): void {
    this._schedulerService.GetPatientWithInsurance().subscribe((patients:any) => {
     this.patientList = patients.data.patients;
     console.log("patientListpatientListpatientList",this.patientList);
     this.patients.set(patients.data.patients);
    });
  }

  onSelectPatients(data:Event){
   
    const selectElement = data.target as HTMLSelectElement;
   console.log("selectElement",selectElement.value);
   this.getInsurancePlan(selectElement.value);
  }
  insurancePlanIds:any[] =[];
  getInsurancePlan(id:string){
    this._patientService.GetInsuranceByPatientId(id).subscribe(res=>{
      this.insurancePlanIds = res.data
    })
  }
  loadData(): void {
    this.patientService.getPatientsByTherapist('therapist-1').subscribe({
      next: (patients) => {
        console.log("patientspatientspatients",patients);
        this.patients.set(patients);
      }
    });

    this.insuranceService.getInsurances().subscribe({
      next: (insurances) => {
        console.log("insuranceServiceinsuranceServiceinsuranceService",insurances);
        
        this.insurances.set(insurances);
      }
    });
  }

  checkQueryParams(): void {
    const insuranceId = this.route.snapshot.queryParamMap.get('insuranceId');
    if (insuranceId) {
      const insurance = this.insurances().find(ins => ins.id === insuranceId);
      if (insurance) {
        this.eligibilityForm.patchValue({
          patientId: insurance.patientId,
          insuranceId: insuranceId
        });
        this.updatePatientInsurances(insurance.patientId);
      }
    }
  }

  setupFormSubscriptions(): void {
    this.eligibilityForm.get('patientId')?.valueChanges.subscribe(patientId => {
      if (patientId) {
        this.updatePatientInsurances(patientId);
        this.eligibilityForm.patchValue({ insuranceId: '' });
      }
    });
  }

  updatePatientInsurances(patientId: string): void {
    const patientInsurances = this.insurances().filter(ins => ins.patientId === patientId);
    this.patientInsurances.set(patientInsurances);
  }

onSubmit(): void {
  
  if (this.eligibilityForm.invalid) {
    this.markFormGroupTouched();
    return;
  }

  // Force insuranceId to always be a string
  const insuranceValue = this.eligibilityForm.get('insuranceId')?.value;
  const insuranceId: string = typeof insuranceValue === 'object'
    ? String(insuranceValue.id)
    : String(insuranceValue);

  // Validate against available plan IDs
  const selectedInsurance = this.insurancePlanIds.find(ins => ins.id === insuranceId);
  if (!selectedInsurance) {
    this.notificationService.error('Insurance not found');
    return;
  }

  this.isChecking.set(true);
  this.eligibilityResult.set(null);

  // Send the insuranceId as a proper string
  this.insuranceService.checkEligibility(insuranceId).subscribe({
    next: (result: any) => {
      this.eligibilityResult.set(result);
      console.log("result", result);
      this.notificationService.success('Eligibility check completed');
      this.isChecking.set(false);
    },
    error: () => {
      this.notificationService.error('Failed to check eligibility');
      this.isChecking.set(false);
    }
  });
}



  runNewCheck(): void {
    this.eligibilityResult.set(null);
    this.eligibilityForm.reset();
  }

  goBack(): void {
    this.router.navigate(['/insurance/claims']);
  }

  getPatientName(patientId: string): string {
    
    const patient = this.patientList.find(p => p.id === patientId);
    return patient ? `${patient.firstName} ${patient.lastName}` : 'Unknown Patient';
  }

  getInsuranceName(insuranceId: string): string {
    
    const insurance = this.insuranceArr.find((ins: any) => (console.log("ins",ins), ins.id === insuranceId));
    return insurance ? insurance.name : 'Unknown Insurance';
  }
insuranceArr:any[]=[];
  getInsuranceCarrier(){
  this._adminservice.getInsuranceCarriers().subscribe((res:InsuranceCarrier[])=>{
    this.insuranceArr = res
    console.log("insuranceArrinsuranceArrinsuranceArr",res);
   })
    }

  getStatusColor(status: string): string {
    switch (status) {
      case 'active': return 'text-green-700 bg-green-100';
      case 'inactive': return 'text-red-700 bg-red-100';
      case 'terminated': return 'text-red-700 bg-red-100';
      case 'pending': return 'text-yellow-700 bg-yellow-100';
      default: return 'text-gray-700 bg-gray-100';
    }
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  }

  private markFormGroupTouched(): void {
    Object.keys(this.eligibilityForm.controls).forEach(key => {
      this.eligibilityForm.get(key)?.markAsTouched();
    });
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.eligibilityForm.get(fieldName);
    return !!(field && field.invalid && field.touched);
  }
}