import { Component, HostListener, ViewChild } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AdminService } from '../../service/admin/admin.service';
import { AuthService } from '../../service/auth/auth.service';
import { PopupService } from '../../service/popup/popup-service';
import { Subject, Subscription } from 'rxjs';


type PatientTab = 'schedule' | 'transactions' ;


@Component({
  selector: 'app-calendar',
  standalone: false,
  templateUrl: './calendar.component.html',
  styleUrl: './calendar.component.scss'
})
export class CalendarComponent {

  form!: FormGroup;
  clientFormSubmitted:boolean = false;

  selectedTab: PatientTab  = 'schedule';
  therapistList: any[] = [];

  appointmentForm!: FormGroup;
  transactionForm!: FormGroup

  today = new Date();
  selectedDate = '';
  isModalOpen = false;

  clientForm!:FormGroup;

    constructor(private fb: FormBuilder,
    private adminService: AdminService,
    private authservice:AuthService,
    private _popupservice:PopupService
  ) {}

  isShowPopup:boolean = false;


   ngOnInit(): void {



 this.form = this.fb.group({
      title: ['', Validators.required],
      startTime: ['', Validators.required],
      endTime: ['', Validators.required],
      location: [''],
      description: [''],
      calendarId: ['', Validators.required],
      date:[''],
      enddate:['']
});
this.appointmentForm = this.fb.group({
  therapistInput: ['', Validators.required],
  patientId: ['1', Validators.required],
  date: ['', Validators.required],
  startTime: ['', Validators.required],
  endTime: ['', Validators.required],
  appointmentTypeInput: ['', Validators.required],
  meetingTypeInput: ['', Validators.required],
  appointmentStatusInput: ['', Validators.required],
  repeatPeriod: ['', Validators.required],
  notes: ['', Validators.required],
  spaces: ['', Validators.required],
  location: ['', Validators.required],
  repeat: ['', Validators.required],
});

    this.transactionForm = this.fb.group({
  transactionTypeInput: ['', Validators.required],
  serviceTypeInput: ['', Validators.required],
  commissionCodeInput: ['', Validators.required],
  amount: ['', Validators.required]
});


     this.getAppointment();
     this.getTherapistList();
  }


 calendars = [
    { id: '1', summary: 'Work' },
    { id: '2', summary: 'Personal' },
  ];

  isPanelOpen = false;
  panelTop = 0;
  panelLeft = 0;

  popupDate = '';
  popupStartTime = '';
  popupEndTime = '';

  handleDateClick(arg: any) {
    this.openPanel(arg);
  }

openPanel(event: any) {
  this.isPanelOpen = true;

  const calendarEl = document.querySelector('full-calendar') as HTMLElement;
  const rect = calendarEl.getBoundingClientRect();

  const panelWidth = 500;
  const topOffset = rect.top + window.scrollY + 20;
  const leftOffset = rect.left + (rect.width / 2) - (panelWidth / 2);

  this.panelTop = topOffset;
  this.panelLeft = leftOffset;

  const clickedDate = event.startStr;
  const startDate = clickedDate.slice(0, 10);
  const startTime = clickedDate.slice(11, 16);
  const endTime = event.endStr.slice(11, 16);

  this.form.patchValue({
    date: startDate,
    startTime: startTime,
    endTime: endTime,
    enddate: startDate
  });
}


getAppointment(){
  this.adminService.getAppointment().subscribe((res:any)=>{
    console.log(res);
  })
}

  closePanel() {
    this.isPanelOpen = false;
  }

  saveAppointment() {
    console.log('Saved:', {
      date: this.popupDate,
      startTime: this.popupStartTime,
      endTime: this.popupEndTime
    });
    this.closePanel();
  }

  @HostListener('document:click', ['$event'])
  handleOutsideClick(event: MouseEvent) {
    const panel = document.querySelector('.floating-panel');
    const target = event.target as HTMLElement;
    if (this.isPanelOpen && panel && !panel.contains(target)) {
      this.closePanel();
    }
  }



customDayCellClass(arg: any) {
  const classes = [];
  const today = new Date();

  if (arg.date < today.setHours(0, 0, 0, 0)) {
    classes.push('fc-day-disabled');
  }

  const isToday = arg.date.toDateString() === new Date().toDateString();
  if (isToday) {
    classes.push('fc-today-highlight');
  }

  return classes;
}






  currentDate: string = new Date().toISOString().split('T')[0];








closeModal(){
this.isShowPopup = false;
}

goToTransaction(): void {
  if (this.appointmentForm.invalid) {
    this.appointmentForm.markAllAsTouched();
    return;
  }
  this.selectedTab = 'transactions';
}

setTab(tab: PatientTab) {
  this.selectedTab = tab;

  const slider = document.querySelector('.slider') as HTMLElement;
  const tabElements = document.querySelectorAll('.tab');
  const tabIndex: Record<PatientTab, number> = {
    'schedule': 0,
    'transactions': 1,
  };

  if (slider && tabElements[tabIndex[tab]]) {
    const tabEl = tabElements[tabIndex[tab]] as HTMLElement;
    slider.style.left = `${tabEl.offsetLeft}px`;
    slider.style.width = `${tabEl.offsetWidth}px`;
  }
}


   get clientFormUser():{[key:string]:AbstractControl}{
    return this.clientForm.controls
  }


addAppointment() {
 this.isShowPopup = true;
}
onsubmit(): void {
  // Validate transaction tab too


  const appointment = {
    therapistId: this.appointmentForm.value.therapistInput,
    patientId: this.appointmentForm.value.patientId,
    date: this.appointmentForm.value.date,
    startTime: this.appointmentForm.value.startTime,
    endTime: this.appointmentForm.value.endTime,
    appointmentTypeId: Number(this.appointmentForm.value.appointmentTypeInput) || 0,
    meetingTypeId: Number(this.appointmentForm.value.meetingTypeInput) || 0,
    appointmentStatusId: Number(this.appointmentForm.value.appointmentStatusInput) || 0
  };

  const transaction = {
    appointmentId: 0,
    transactionTypeId: Number(this.transactionForm.value.transactionTypeInput) || 0,
    serviceTypeId: Number(this.transactionForm.value.serviceTypeInput) || 0,
    commissionCodeId: Number(this.transactionForm.value.commissionCodeInput) || 0,
    amount: Number(this.transactionForm.value.amount) || 0
  };

  const payload = { appointment, transaction };

  this.adminService.saveAppointmentWithTransaction(payload).subscribe(
    res => {
      this.isShowPopup = false;
    },
    err => console.error(err)
  );
}



  getTherapistList(){
     this.authservice.getTherapistList().subscribe({
      next: (res: any[]) => {
        this.therapistList = res;
        console.log('Therapists:', res);
      },
      error: (err) => {
        console.error('Failed to load therapists:', err);
      }
    });
  }
}
