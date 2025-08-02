import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnInit,
  OnChanges,
  SimpleChanges,
  inject,
} from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  Validators,
  FormArray,
  NgForm,
} from '@angular/forms';
import {
  SchedulerClickEvent,
  AppointmentTypeOption,
  PatientOption,
  MeetingTypeOption,
  User,
} from '../../../models/scheduler';
import { SchedulerService } from '../../../service/scheduler/scheduler.service';
import { DatePipe } from '@angular/common';
import moment from 'moment';
import { AdminService } from '../../../service/admin/admin.service';
import { TosterService } from '../../../service/toaster/tostr.service';
import { Router } from '@angular/router';


@Component({
  selector: 'app-scheduler-header',
  templateUrl: './scheduler-header.component.html',
  styleUrls: ['./scheduler-header.component.scss'],
  standalone: false,
   providers: [DatePipe]
})
export class SchedulerHeaderComponent {
 @Input() show: boolean = false;
  @Input() schedulerEvent: SchedulerClickEvent | null = null;
  @Output() close = new EventEmitter<void>();
  @Output() submit = new EventEmitter<any>();

  appointmentForm!: FormGroup;
  selectedTab: string = 'schedule';
  weekDays = [
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday',
    'Sunday',
  ];

  therapistList: User[] = [];
  availableStartTimes: string[] = [];
  availableEndTimes: string[] = [];
  appointmentTypeOptions: AppointmentTypeOption[] = [];
  meetingTypeOptions: MeetingTypeOption[] = [];
  PatientsListOptions: PatientOption[] = [];

  // appointmentTypeOptions: AppointmentTypeOption[] = [
  //   { id: '1', value: 'Initial Consultation' },
  //   { id: '2', value: 'Follow-up' },
  //   { id: '3', value: 'Emergency' },
  // ];

  // PatientsListOptions: PatientOption[] = [
  //   { id: '1', firstName: 'John', lastName: 'Doe' },
  //   { id: '2', firstName: 'Jane', lastName: 'Smith' },
  //   { id: '3', firstName: 'Bob', lastName: 'Wilson' },
  // ];

  // meetingTypeOptions: MeetingTypeOption[] = [
  //   { id: '1', value: 'In-Person' },
  //   { id: '2', value: 'Video Call' },
  //   { id: '3', value: 'Phone Call' },
  // ];

  // Transaction tab properties
  totalAmount: number = 0;
  useInsurance: boolean = false;
  selectedInsuranceId: any = '';
  selectedSlidingScaleId: string = '';
  copayAmount: number = 0;
  insuranceClaimAmount: number = 0;
  patientPaysAmount: number = 0;
  transactionNotes: string = '';

   insuranceList: any[] = [];
   selectedInsurance: any = null;

   slidingScalesList:any=[];
   selectedPatient:any;

  public _service = inject(AdminService);
  public toastr = inject(TosterService);
  constructor(
    private formBuilder: FormBuilder,
    private schedulerService: SchedulerService,
    private datePipe: DatePipe,
    private router: Router
  ) {}

  ngOnInit() {
    debugger



  this.schedulerService.therapistList$.subscribe((list) => {
    this.therapistList = list;
    console.log("therapistList therapistList therapistList ",this.therapistList);
    
  });

  this.schedulerService.availabilityStatus$.subscribe((response) => {
  if (response) {
    console.log("response",response);
    
    const matchedTherapist = this.therapistList.find(
      (therapist) => therapist.name === response.userName
    );

    this.appointmentForm.patchValue({
      therapistInput: matchedTherapist?.id ?? '',
      date: response.date,
      startTime: response.startTime,
      endTime: response.endTime
    });

    console.log("this.appointmentForm.value",this.appointmentForm.value);
    

    if (matchedTherapist) {
      // Optional: trigger time slot generation
      this.generateTimeSlotsForSelectedTherapist();
    }
  }
});

this._service.getSlidingScales().subscribe(data => this.slidingScalesList = data);

 if (this.appointmentForm?.get('patientId')) {
    console.log("this.appointmentForm.get('patientId')", this.appointmentForm.get('patientId')?.value);
  } else {
    console.warn('appointmentForm or patientId is not available yet');
  }


        this.appointmentForm = this.formBuilder.group({
      therapistInput: [null, Validators.required],
      appointmentTypeInput: ['', Validators.required],
      patientId: ['', Validators.required],
      date: ['', Validators.required],
      startTime: ['', Validators.required],
      endTime: ['', Validators.required],
      meetingTypeInput: ['', Validators.required],
      repeatEvery: [1],
      repeatPeriod: ['Day'],
      endDate: [''],
      repeat: [false],
      repeatDays: this.formBuilder.array([]),
      notes: [''],
    });
    this.fetchDropdownOptions('AppointmentType');
    this.fetchDropdownOptions('MeetingType');
    this.fetchAllPatients();


    this.appointmentForm.get('patientId')?.valueChanges.subscribe((patientId: string) => {
  this.selectedPatient = this.PatientsListOptions.find(p => p.id === patientId);
  this.insuranceList = this.selectedPatient?.insurances || [];
  this.selectedInsurance = null;
  if (this.selectedPatient?.slidingScaleId) {
    this.appointmentForm.patchValue({ slidingScaleId: this.selectedPatient.slidingScaleId });
    this.selectedSlidingScaleId = this.selectedPatient.slidingScaleId;
    this.recalculateInsuranceClaim();
  }
});
  }

  setTab(tab: string) {
    this.selectedTab = tab;
  }

  // ngOnChanges(changes: SimpleChanges) {
  //   if (changes['schedulerEvent'] && this.schedulerEvent?.date) {
  //     this.fetchTherapistsByDate(new Date(this.schedulerEvent.date)).then(() =>
  //       // this.populateFormFromSchedulerEvent()
  //     );
  //   }
  // }

 



 




  fetchDropdownOptions(category: string): void {
    this.schedulerService
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

  fetchAllPatients(): void {
    this.schedulerService.getAllPatientsList().subscribe((patients) => {
      this.PatientsListOptions = patients;
      this.appointmentForm.get('patientId');
    });
  }

  // getTherapistList(){
  //   this.
  // }
  generateTimeSlots(start: string, end: string) {
    const result: string[] = [];
    const [startHour, startMin] = start.split(':').map(Number);
    const [endHour, endMin] = end.split(':').map(Number);

    let current = new Date(2000, 0, 1, startHour, startMin);
    const endDate = new Date(2000, 0, 1, endHour, endMin);

    while (current <= endDate) {
      const formatted = moment(current).format('hh:mm A');
      result.push(formatted);
      current.setMinutes(current.getMinutes() + 30);
    }

    this.availableStartTimes = result.slice(0, -1);
    this.availableEndTimes = result.slice(1);
  }

  // populateFormFromSchedulerEvent() {
  //   debugger
  //   if (!this.schedulerEvent) return;

  //   const { userId, userName, timeSlot, date, isAddEvent } =
  //     this.schedulerEvent;

  //   // Only populate therapist and time if it's not from Add Event button
  //   if (!isAddEvent) {
  //     const therapist = this.therapistList.find((t) => t.id === userId);
  //     if (therapist?.availableFrom && therapist.availableTo) {
  //       this.generateTimeSlots(therapist.availableFrom, therapist.availableTo);
  //     }

  //     // Convert times to same format used in dropdowns (e.g., "hh:mm A")
  //     const startTime = moment(timeSlot.time, 'HH:mm').format('hh:mm A');
  //     const endTime = moment(
  //       this.calculateEndTime(timeSlot.time, 30),
  //       'HH:mm'
  //     ).format('hh:mm A');

  //    this.appointmentForm.patchValue({
  //       therapistInput: userId,
  //       date,
  //       startTime,
  //       endTime,
  //     });

     
      
  //   } else {
  //     // For Add Event, only populate the date
  //     // Clear time slots when it's an Add Event
  //     this.availableStartTimes = [];
  //     this.availableEndTimes = [];

  //     // this.appointmentForm.patchValue({
  //     //   date,
  //     // });
  //   }

  //    console.log("this.appointmentForm.value",this.appointmentForm.value);
  // }

  calculateEndTime(startTime: string, durationMinutes: number): string {
    const [hours, minutes] = startTime.split(':').map(Number);
    const startDate = new Date(2000, 0, 1, hours, minutes);
    const endDate = new Date(startDate.getTime() + durationMinutes * 60000);
    return `${endDate.getHours().toString().padStart(2, '0')}:${endDate
      .getMinutes()
      .toString()
      .padStart(2, '0')}`;
  }

  onBackdropClick(event: MouseEvent) {
    if (event.target === event.currentTarget) {
      this.closeModal();
    }
  }

  closeModal() {
     this.appointmentForm.patchValue({
      therapistInput:  '',
      date: '',
      startTime: '',
      endTime: ''
    });
        this.close.emit();

  }

  onStartTimeChange(): void {
    const startTime = this.appointmentForm.get('startTime')?.value;
    if (!startTime) return;

    const startMoment = moment(startTime, 'hh:mm A');
    const endMoment = startMoment.clone().add(30, 'minutes');
    const formattedEnd = endMoment.format('hh:mm A');

    this.availableEndTimes = [formattedEnd];
    this.appointmentForm.get('endTime')?.setValue(formattedEnd);
  }

onSubmit(): void {
  const formVal = this.appointmentForm.value;

  const selectedDate = new Date(formVal.date);

  const toISOStringWithTime = (date: Date, timeStr: string): string => {
    const [time, modifier] = timeStr.split(' ');
    let [hours, minutes] = time.split(':').map(Number);

    if (modifier === 'PM' && hours !== 12) hours += 12;
    if (modifier === 'AM' && hours === 12) hours = 0;

    const dateTime = new Date(date);
    dateTime.setHours(hours, minutes, 0, 0);

    return dateTime.toISOString();
  };

  const payload = {
    patientId: formVal.patientId,
    userId: formVal.therapistInput,
    date: selectedDate,
    startTime: toISOStringWithTime(selectedDate, formVal.startTime),
    endTime: toISOStringWithTime(selectedDate, formVal.endTime),
    appointmentTypeId: Number(formVal.appointmentTypeInput) || 0,
    meetingTypeId: Number(formVal.meetingTypeInput) || 0,
    appointmentStatusId: Number(formVal.appointmentStatusInput) || 0,
    totalAmount: this.totalAmount || 0,
    patientPaysAmount: this.patientPaysAmount || 0,
    copayAmount: this.copayAmount || 0,
    insuranceClaimAmount: this.insuranceClaimAmount || 0,
    slidingScaleDiscountPercentage: (this.getSlidingScaleDiscount().toFixed(2)),
    insuranceId: this.selectedInsuranceId ?? null,
    notes: formVal.notes,
    transactionNotes: this.transactionNotes,
    repeat: formVal.repeat || false,
    repeatEvery: formVal.repeatEvery || 0,
    repeatPeriod: formVal.repeatPeriod,
    endDate: formVal.endDate ? new Date(formVal.endDate) : null,
    repeatDays: formVal.repeatDays || []
  };

  this._service.saveAppointmentWithTransaction(payload).subscribe(
    res => {
      this.toastr.success('Appointment saved successfully!');
      const currentUrl = this.router.url;
      this.router.navigateByUrl('/', { skipLocationChange: true }).then(() => {
      this.router.navigate([currentUrl]);
  });
    },
    err => {
      console.error(err);
      this.toastr.error('Failed to save appointment');
    }
  );
}


  markFormGroupTouched(formGroup: FormGroup) {
    Object.keys(formGroup.controls).forEach((key) => {
      const control = formGroup.get(key);
      control?.markAsTouched();
      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      }
    });
  }

  get repeatDaysArray(): FormArray {
    return this.appointmentForm.get('repeatDays') as FormArray;
  }

  isDaySelected(day: string): boolean {
    return this.repeatDaysArray.value.includes(day);
  }

  toggleRepeatDay(day: string) {
    const index = this.repeatDaysArray.value.indexOf(day);
    if (index > -1) {
      this.repeatDaysArray.removeAt(index);
    } else {
      this.repeatDaysArray.push(this.formBuilder.control(day));
    }
  }

  getSelectedRepeatDays(): string[] {
    
    return this.repeatDaysArray.value;
  }

onInsuranceToggle(event: any) {

  this.useInsurance = event.target.checked;
 
  if (this.useInsurance) {

    const patientId = this.appointmentForm.get('patientId')?.value;

    if (patientId) {

      // Find the selected patient and their insurances

      this.selectedPatient = this.PatientsListOptions.find(p => p.id === patientId);

      this.insuranceList = this.selectedPatient?.insurances || [];

      // Auto-select the first insurance if available

      if (this.insuranceList.length > 0) {

        this.selectedInsuranceId = this.insuranceList[0].id;

        this.selectedInsurance = this.insuranceList[0];

        this.copayAmount = this.selectedInsurance.coPay || 0;

      }

    }

  } else {

    this.selectedInsuranceId = null;

    this.selectedInsurance = null;

    this.insuranceClaimAmount = 0;

    this.copayAmount = 0;

  }
 
  this.recalculateInsuranceClaim();

}
 
onInsuranceChange(event: Event): void {

  const target = event.target as HTMLSelectElement;

  const selectedInsuranceId = target.value;

  this.selectedInsurance = this.insuranceList.find(ins => ins.id === selectedInsuranceId);

  if (this.selectedInsurance) {

    this.copayAmount = this.selectedInsurance.coPay || 0;

    this.recalculateInsuranceClaim();

    this.updateTransactionNotes();

  }

}
 

 

 
 
  updateTransactionNotes(): void {
    if (this.selectedInsurance) {
      this.transactionNotes = (this.insuranceClaimAmount > 0 || this.copayAmount > 0)
        ? 'Partially covered by insurance'
        : 'Fully paid by patient';
    } else {
      this.transactionNotes = (this.patientPaysAmount > 0)
        ? 'Paid by patient'
        : '';
    }
  }
 
  recalculateInsuranceClaim(): void {
  let slidingDiscount = 0;
  const selectedScale = this.slidingScalesList.find((scale:any) => scale.id === this.selectedSlidingScaleId);
 
  if (selectedScale) {
    slidingDiscount = (this.totalAmount * selectedScale.discountPercentage) / 100;
  }
 
  if (this.selectedInsurance) {
    const calculatedInsuranceClaim = this.totalAmount - (this.copayAmount || 0) - slidingDiscount;
    this.insuranceClaimAmount = Math.max(0, parseFloat(calculatedInsuranceClaim.toFixed(2)));
    this.patientPaysAmount = 0;
  } else {
    const patientTotal = this.totalAmount - slidingDiscount;
    this.patientPaysAmount = Math.max(0, parseFloat(patientTotal.toFixed(2)));
    this.insuranceClaimAmount = 0;
    this.copayAmount = 0;
    this.selectedInsurance = null;
  }
 
  // Don't recalculate or override totalAmount!
  this.updateTransactionNotes();
}
 

  // recalculateInsuranceClaim() {
  //   if (this.useInsurance && this.totalAmount > 0) {
  //     let discountAmount = 0;

  //     // Apply sliding scale discount if selected
  //     if (this.selectedSlidingScaleId) {
  //       const selectedScale = this.slidingScalesList.find(
  //         (s:any) => s.id === this.selectedSlidingScaleId
  //       );
  //       if (selectedScale) {
  //         discountAmount =
  //           (this.totalAmount * selectedScale.discountPercentage) / 100;
  //       }
  //     }

  //     const adjustedAmount = this.totalAmount - discountAmount;
  //     this.insuranceClaimAmount = Math.max(
  //       0,
  //       adjustedAmount - this.copayAmount
  //     );
  //   } else {
  //     this.insuranceClaimAmount = 0;
  //     this.patientPaysAmount = this.totalAmount;
  //   }
  // }
therapist:any
generateTimeSlotsForSelectedTherapist() {
  const selectedId = this.appointmentForm.get('therapistInput')?.value;
  this.therapist = this.therapistList.find((t) => t.id === selectedId);

  if (this.therapist) {
    const today = new Date();
    this.therapist.date = today.toISOString();

    // Format as 'YYYY-MM-DD' for form input
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    const formattedForInput = `${yyyy}-${mm}-${dd}`;

    // Patch form
    this.appointmentForm.patchValue({ date: formattedForInput });

    console.log("Patched Therapist Date:", formattedForInput);

    if (this.therapist.availableFrom && this.therapist.availableTo) {
      this.generateTimeSlots(this.therapist.availableFrom, this.therapist.availableTo);
    } else {
      this.availableStartTimes = [];
      this.availableEndTimes = [];
    }
  } else {
    this.availableStartTimes = [];
    this.availableEndTimes = [];
  }
}


parseTime(date: string, time: string): Date {
    const [hour, minute] = time.split(':').map(Number);
    const dt = new Date(date);
    dt.setHours(hour, minute, 0, 0);
    return dt;
  }
 
  getSlidingScaleDiscount(): number {
    if (!this.selectedSlidingScaleId) {
        console.warn('No sliding scale selected');
        return 0;
    }
   
    const selectedScale = this.slidingScalesList.find((scale:any) => scale.id === this.selectedSlidingScaleId);
   
    if (!selectedScale) {
        console.warn('Selected scale not found in list', {
            selectedId: this.selectedSlidingScaleId,
            availableIds: this.slidingScalesList.map((s:any) => s.id)
        });
        return 0;
    }
   
    const discount = selectedScale.discountPercentage || 0;
    console.log('Raw discount value:', discount);
   
    return parseFloat(discount.toFixed(1));
}
 

 onchangePatient(){
  
 }
}
