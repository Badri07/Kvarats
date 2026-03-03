import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { PaymentRequestService } from '../../services/payment-request.service';
import { PatientService, Patient, Appointment, ClientService, MeetingType, SlidingScale } from '../../services/patient.service';
import { CreatePatientPaymentRequestRequest } from '../../models/payment-request.model';
import { AdminService } from '../../../../service/admin/admin.service';
import { SchedulerService } from '../../../../service/scheduler/scheduler.service';
import { TherapistAppointmentService } from '../../../../service/scheduler/Appointment.service';
import { AuthService } from '../../../../service/auth/auth.service';
import { BreadcrumbService } from '../../../../shared/breadcrumb/breadcrumb.service';
import { TosterService } from '../../../../service/toaster/tostr.service';

interface ServiceRow {
  tempId?: string;
  appointmentId?: string;
  appointmentServiceId?: string;
  serviceId: string;
  serviceName?: string;
  cptCode?: string;
  modifier?: string;
  description?: string;
  serviceDate: Date | string;
  chargedAmount: number;
  units: number;
  meetingTypeId: number;
  meetingTypeName?: string;
}

@Component({
  selector: 'app-payment-request-form',
  standalone: false,
  templateUrl: './payment-request-form.component.html',
  styleUrls: ['./payment-request-form.component.scss']
})
export class PaymentRequestFormComponent implements OnInit, OnDestroy {
  patientId = '';
  invoiceDate = new Date().toISOString().split('T')[0];
  notes = '';
  selectedAppointmentIds: string[] = [];
  selectedSlidingScaleId = '';
  manualDiscountAmount = 0;

  services: ServiceRow[] = [];

  patients: Patient[] = [];
  appointments: Appointment[] = [];
  clientServices: ClientService[] = [];
  meetingTypes: MeetingType[] = [];
  slidingScales: SlidingScale[] = [];

  loading = false;
  loadingAppointments = false;
  error = '';
  success = '';

  totalAmount = 0;
  appliedDiscountPercentage = 0;
  calculatedDiscount = 0;
  finalAmount = 0;

  isEditMode = false;
  hasPayments = false;
  paymentRequestId: string | null = null;
  pageTitle = 'Create Payment Request';

  isEditPreviewLoaded = false;


  private subscriptions: Subscription = new Subscription();
  private loadedCount = 0;
  private totalToLoad = 4;
  private paymentDataLoaded = false;

  constructor(
    private paymentRequestService: PaymentRequestService,
    private patientService: PatientService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  public breadcrumbService = inject(BreadcrumbService);
  
  ngOnInit(): void {
    this.route.params.subscribe(params => {
      if (params['id']) {
        this.isEditMode = true;
        this.paymentRequestId = params['id'];
        this.pageTitle = 'Edit Payment Request';
        this.breadcrumbService.setBreadcrumbs([
          { label: 'Billing Payments', url: 'billing/payments' },
          { label: 'Edit Payment Request', url: '' },
        ]);
        // First load lookup data, then load payment request
        this.loadLookupData();
      } else {
        this.breadcrumbService.setBreadcrumbs([
          { label: 'Billing Payments', url: 'billing/payments' },
          { label: 'Payment Request', url: 'billing/payment-requests/new' },
        ]);
        this.loadLookupData();
        this.loadMeetingTypes('Meeting Type');
      }
    });
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  public _appointmentService = inject(TherapistAppointmentService)

  loadLookupData(): void {
    this.loading = true;
    this.error = '';
    this.loadedCount = 0;

    this.loadPatients();
    this.loadClientServices();
    this.loadMeetingTypes('Meeting Type');
    this.loadSlidingScales();
  }

  private checkAllLoadedAndLoadPaymentRequest(): void {
    this.loadedCount++;
    
    if (this.loadedCount === this.totalToLoad && !this.paymentDataLoaded && this.isEditMode && this.paymentRequestId) {
      this.loadPaymentRequestData();
    } else if (this.loadedCount === this.totalToLoad) {
      this.loading = false;
    }
  }

  loadPaymentRequestData(): void {
  if (!this.paymentRequestId) return;

  this.loading = true;

  this.paymentRequestService
    .getPaymentRequestById(this.paymentRequestId)
    .subscribe({
      next: (paymentData: any) => {
        console.log('Edit mode payment data:', paymentData);
        this.patchFormValues(paymentData);
        this.paymentDataLoaded = true;
        this.loading = false;
      },
      error: () => {
        this.error = 'Failed to load payment request data';
        this.loading = false;
      }
    });
}


  patchFormValues(paymentData: any): void {
  // ================= BASIC FIELDS =================
  this.patientId = paymentData.patientId;
  this.invoiceDate = paymentData.invoiceDate
  ? paymentData.invoiceDate.split('T')[0]
  : '';


  this.notes = paymentData.notes || '';

  // ================= RESET DISCOUNT STATE =================
  // IMPORTANT: do NOT assume discountAmount = manual discount
  this.manualDiscountAmount = 0;
  this.selectedSlidingScaleId = '';
  this.appliedDiscountPercentage = 0;

  // ================= DISCOUNT SOURCE RESOLUTION =================
  // Case 1️⃣: Sliding scale applied
  if (paymentData.slidingScaleId) {
    this.selectedSlidingScaleId = paymentData.slidingScaleId;
    this.appliedDiscountPercentage =
      paymentData.slidingScalePercentage || 0;

    // Manual discount must remain 0
    this.manualDiscountAmount = 0;
  }
  // Case 2️⃣: Manual discount applied (no sliding scale)
  else if (paymentData.discountAmount > 0) {
    this.manualDiscountAmount = Math.abs(paymentData.discountAmount);
    this.appliedDiscountPercentage = 0;
  }

  // ================= SERVICES =================
  this.services = paymentData.services.map((service: any) => ({
    tempId: this.generateTempId(),
    appointmentId: service.appointmentId,
    appointmentServiceId: service.appointmentServiceId,
    serviceId: service.serviceId,
    serviceName: service.serviceName,
    cptCode: service.cptCode,
    modifier: service.modifier || '',
    description: service.description,
    serviceDate: new Date(service.serviceDate).toISOString().split('T')[0],
    chargedAmount: service.chargedAmount,
    units: service.units,
    meetingTypeId: service.meetingTypeId || 0,
    meetingTypeName: service.meetingTypeName
  }));

  // ================= APPOINTMENTS =================
  this.selectedAppointmentIds = this.services
    .map(s => s.appointmentId)
    .filter((id): id is string => !!id);

  // ================= EDIT MODE PREVIEW =================
  // 🔥 TRUST BACKEND VALUES – DO NOT RECALCULATE
  this.totalAmount = paymentData.totalAmount || 0;
  this.calculatedDiscount = Math.abs(paymentData.discountAmount) || 0;
  this.finalAmount = paymentData.finalAmount || 0;

  // ================= LOCK STATE =================
  // 🔒 Prevent edits if payments exist
  this.hasPayments =
    paymentData.transactions &&
    paymentData.transactions.length > 0;

  // ================= LOAD APPOINTMENTS =================
  if (this.patientId) {
    this.loadAppointmentsForPatient();
  }

  // ================= MARK PREVIEW READY =================
  // 🔥 Allows calculateTotals() ONLY after user changes something
  this.isEditPreviewLoaded = true;
}



  loadAppointmentsForPatient(): void {
    debugger
    this.loadingAppointments = true;
    const appointmentsSubscription = this.patientService.getUnpaidAppointmentsByPatientId(this.patientId).subscribe({
      next: (appointments) => {
        this.appointments = appointments || [];
        this.loadingAppointments = false;
      },
      error: (err) => {
        this.appointments = [];
        this.loadingAppointments = false;
      }
    });

    this.subscriptions.add(appointmentsSubscription);
  }

  loadPatients(): void {
    const patientsSubscription = this.patientService.getAllPatients().subscribe({
      next: (response: any) => {
        if (response?.items) {
          this.patients = response.items;
        } else {
          this.patients = [];
        }
        this.checkAllLoadedAndLoadPaymentRequest();
      },
      error: (err: any) => {
        this.error = 'Failed to load patients.';
        this.patients = [];
        this.checkAllLoadedAndLoadPaymentRequest();
      }
    });

    this.subscriptions.add(patientsSubscription);
  }

  public _authService = inject(AuthService);
  loadClientServices(): void {
    var get_Client_Service: any = this._authService.getClientId();
    const servicesSubscription = this._appointmentService.getClientServices(get_Client_Service).subscribe({
      next: (services: any) => {
        this.clientServices = services || [];
        this.checkAllLoadedAndLoadPaymentRequest();
      },
      error: (err: any) => {
        this.clientServices = [];
        this.checkAllLoadedAndLoadPaymentRequest();
      }
    });

    this.subscriptions.add(servicesSubscription);
  }

  public _schedulerService = inject(SchedulerService)

  loadMeetingTypes(category: any): void {
    this._schedulerService
      .getDropdownsByCategory(category)
      .subscribe({
      next: (meetingTypes: any) => {
        this.meetingTypes = meetingTypes || [];
        this.checkAllLoadedAndLoadPaymentRequest();
      },
      error: (err: any) => {
        this.meetingTypes = [];
        this.checkAllLoadedAndLoadPaymentRequest();
      }
    });
  }

  public _adminService = inject(AdminService)
 
  loadSlidingScales(): void {
    var get_Client_id: any = this._authService.getClientId();
    const slidingScalesSubscription = this._adminService.getSlidingScale(get_Client_id).subscribe({
      next: (slidingScales: any) => {
        this.slidingScales = slidingScales.data || [];
        this.checkAllLoadedAndLoadPaymentRequest();
      },
      error: (err: any) => {
        this.slidingScales = [];
        this.checkAllLoadedAndLoadPaymentRequest();
      }
    });

    this.subscriptions.add(slidingScalesSubscription);
  }

  onPatientChange(): void {
    if (!this.patientId) {
      this.appointments = [];
      this.selectedAppointmentIds = [];
      return;
    }

    this.loadingAppointments = true;
    this.error = '';
    
    const appointmentsSubscription = this.patientService.getUnpaidAppointmentsByPatientId(this.patientId).subscribe({
      next: (appointments) => {
        this.appointments = appointments || [];
        this.loadingAppointments = false;
      },
      error: (err) => {
        this.error = 'Failed to load patient appointments';
        this.loadingAppointments = false;
      }
    });

    this.subscriptions.add(appointmentsSubscription);
  }

  toggleAppointmentSelection(appointmentId: string): void {
    const index = this.selectedAppointmentIds.indexOf(appointmentId);
    if (index > -1) {
      this.selectedAppointmentIds.splice(index, 1);
    } else {
      this.selectedAppointmentIds.push(appointmentId);
    }
  }

  toggleAllAppointments(checked: boolean): void {
    if (checked) {
      this.selectedAppointmentIds = this.appointments.map(a => a.id);
    } else {
      this.selectedAppointmentIds = [];
    }
  }

  importFromAppointments(): void {
    if (this.selectedAppointmentIds.length === 0) {
      this.error = 'Please select at least one appointment';
      return;
    }

    const selectedAppointments = this.appointments.filter(a =>
      this.selectedAppointmentIds.includes(a.id)
    );

    selectedAppointments.forEach(appointment => {
      appointment.services.forEach(service => {
        const matchingService = this.findMatchingClientService(service);
        
        this.services.push({
          tempId: this.generateTempId(),
          appointmentId: appointment.id,
          appointmentServiceId: service.id,
          serviceId: matchingService?.id || service.serviceId,
          serviceName: service.serviceName,
          cptCode: service.serviceCode,
          modifier: service.modifier || '',
          description: service.serviceName,
          serviceDate: this.formatDateForInput(appointment.date),
          chargedAmount: service.chargeAmount,
          units: service.units,
          meetingTypeId: appointment.meetingTypeId || 0,
          meetingTypeName: appointment.meetingType
        });
      });
    });

    this.calculateTotals();
    this.success = `Imported services from ${this.selectedAppointmentIds.length} appointment(s)`;
    setTimeout(() => this.success = '', 3000);
  }

  findMatchingClientService(appointmentService: any): any {
    let match = this.clientServices.find((cs: any) => {
      return cs.id === appointmentService.serviceId ||
             cs.serviceId === appointmentService.serviceId ||
             cs.value === appointmentService.serviceId;
    });
    
    if (!match) {
      match = this.clientServices.find(cs => {
        const csName = cs.label || cs.label || cs.description || '';
        const appName = appointmentService.serviceName || '';
        return csName.toLowerCase() === appName.toLowerCase();
      });
    }
    
    if (!match) {
      match = this.clientServices.find(cs => 
        cs.metadata?.code === appointmentService.serviceCode
      );
    }
    
    return match;
  }

  formatDateForInput(date: Date | string): string {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  addManualService(): void {
    const newService: ServiceRow = {
      tempId: this.generateTempId(),
      serviceId: '',
      cptCode: '',
      modifier: '',
      description: '',
      serviceDate: new Date().toISOString().split('T')[0],
      chargedAmount: 0,
      units: 1,
      meetingTypeId: 0
    };
    this.services.push(newService);
  }

  removeService(index: number): void {
    this.services.splice(index, 1);
    this.calculateTotals();
  }

  onServiceChange(service: ServiceRow): void {
  if (!service.serviceId) return;

  const clientService = this.clientServices.find(
    s => s.id === service.serviceId
  );

  console.log('Selected service:', clientService);

  if (!clientService) return;

  // ✅ Correct field mappings (MATCHES YOUR REAL DATA)
  service.serviceName = clientService.label;
  service.cptCode = clientService.metadata?.code || '';
  service.description = clientService.description || clientService.label;

  // ✅ PRICE COMES FROM `price`
  service.chargedAmount = clientService.price || 0;

  this.calculateTotals();
}


  onSlidingScaleChange(): void {
  // Clear manual discount when sliding scale is chosen
  this.manualDiscountAmount = 0;
  this.calculateTotals();
}



  calculateTotals(): void {
  // 🔒 EDIT MODE GUARD
  // Do NOT recalculate while patching backend values
  if (this.isEditMode && !this.isEditPreviewLoaded) {
    return;
  }

  // ================= 1️⃣ TOTAL =================
  this.totalAmount = this.services.reduce(
    (sum, service) => sum + (service.chargedAmount * service.units),
    0
  );

  // ================= 2️⃣ DISCOUNT =================
  // Backend-aligned logic
  if (this.manualDiscountAmount > 0) {
    // Manual override ONLY
    this.calculatedDiscount = this.manualDiscountAmount;
    this.appliedDiscountPercentage = 0;
  } else if (this.selectedSlidingScaleId) {
    const scale = this.slidingScales.find(
      s => s.id === this.selectedSlidingScaleId
    );
    this.appliedDiscountPercentage = scale?.discountPercentage || 0;
    this.calculatedDiscount =
      (this.totalAmount * this.appliedDiscountPercentage) / 100;
  } else {
    this.appliedDiscountPercentage = 0;
    this.calculatedDiscount = 0;
  }

  // ================= 3️⃣ CLAMP =================
  this.calculatedDiscount = Math.min(
    this.calculatedDiscount,
    this.totalAmount
  );

  // ================= 4️⃣ FINAL =================
  this.finalAmount = this.totalAmount - this.calculatedDiscount;
}



  onManualDiscountChange(): void {
  if (this.manualDiscountAmount > 0) {
    this.selectedSlidingScaleId = '';
    this.appliedDiscountPercentage = 0;
  }
  this.calculateTotals();
}


  validateForm(): boolean {
    if (!this.patientId) {
      this.error = 'Please select a patient';
      return false;
    }

    if (this.services.length === 0) {
      this.error = 'Please add at least one service';
      return false;
    }

    for (let i = 0; i < this.services.length; i++) {
      const service = this.services[i];
      if (!service.serviceId) {
        this.error = `Service at row ${i + 1} is missing service selection`;
        return false;
      }
      if (service.chargedAmount <= 0) {
        this.error = `Service at row ${i + 1} must have a charge amount greater than 0`;
        return false;
      }
      if (service.units < 1) {
        this.error = `Service at row ${i + 1} must have at least 1 unit`;
        return false;
      }
      if (!service.meetingTypeId) {
        this.error = `Service at row ${i + 1} is missing meeting type`;
        return false;
      }
    }

    return true;
  }

  public _tostr = inject(TosterService);
  onSubmit(): void {
  this.error = '';
  this.success = '';

  // 🔒 HARD GUARD – do not allow submit if payments exist
  if (this.isEditMode && this.hasPayments) {
    this.error = 'This payment request already has payments and cannot be modified.';
    this._tostr.error(this.error);
    return;
  }

  if (!this.validateForm()) {
    return;
  }

  // ================= BUILD REQUEST =================
  const request: CreatePatientPaymentRequestRequest = {
    patientId: this.patientId,
    invoiceDate: new Date(this.invoiceDate),

    // 🔥 Sliding scale ONLY when manual discount is NOT used
    slidingScaleId:
      this.manualDiscountAmount > 0
        ? null
        : this.selectedSlidingScaleId || null,

    // 🔥 Manual discount ONLY
    discountAmount:
      this.manualDiscountAmount > 0
        ? this.manualDiscountAmount
        : 0,

    notes: this.notes,

    services: this.services.map(s => ({
      appointmentId: s.appointmentId,
      appointmentServiceId: s.appointmentServiceId,
      serviceId: s.serviceId,
      cptCode: s.cptCode || '',
      modifier: s.modifier || '',
      description: s.description || '',
      serviceDate:
        typeof s.serviceDate === 'string'
          ? new Date(s.serviceDate)
          : s.serviceDate,
      chargedAmount: s.chargedAmount,
      units: s.units,
      meetingTypeId: s.meetingTypeId
    })),

    appointmentIds: this.selectedAppointmentIds
  };

  this.loading = true;

  // ================= UPDATE =================
  if (this.isEditMode && this.paymentRequestId) {
    this.paymentRequestService
      .updatePaymentRequest(this.paymentRequestId, request)
      .subscribe({
        next: () => {
          this.loading = false;
          this._tostr.success('Payment request updated successfully!');
          this.router.navigate(['/billing/payments']);
        },
        error: () => {
          this.loading = false;
          this.error = 'Failed to update payment request. Please try again.';
          this._tostr.error(this.error);
        }
      });
  }

  // ================= CREATE =================
  else {
    const sub = this.paymentRequestService
      .createPaymentRequest(request)
      .subscribe({
        next: () => {
          this.loading = false;
          this._tostr.success('Payment request created successfully!');
          this.router.navigate(['/billing/payments']);
        },
        error: () => {
          this.loading = false;
          this.error = 'Failed to create payment request. Please try again.';
          this._tostr.error(this.error);
        }
      });

    this.subscriptions.add(sub);
  }
}


  getPatientName(patientId: string): string {
    const patient = this.patients.find(p => p.id === patientId);
    return patient ? `${patient.firstName} ${patient.lastName}` : '';
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  }

  formatDate(date: Date | string): string {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  private generateTempId(): string {
    return `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // For appointments listing in form UI
  formatTo12Hour(time: string): string {
  if (!time) return '';

  const [hourStr, minute] = time.split(':');
  let hour = Number(hourStr);
  const period = hour >= 12 ? 'PM' : 'AM';

  hour = hour % 12;
  hour = hour === 0 ? 12 : hour;

  return `${hour}:${minute} ${period}`;
}

}