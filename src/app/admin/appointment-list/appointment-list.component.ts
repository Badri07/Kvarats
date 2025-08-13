import { Component, inject } from '@angular/core';
import { AuthService } from '../../service/auth/auth.service';
import { ColDef, Column, GridApi, GridReadyEvent } from 'ag-grid-community';
import { AdminService } from '../../service/admin/admin.service';
import * as XLSX from 'xlsx';
import * as FileSaver from 'file-saver';
import { BreadcrumbService } from '../../shared/breadcrumb/breadcrumb.service';
import { SchedulerService } from '../../service/scheduler/scheduler.service';
import {
  SchedulerClickEvent,
  AppointmentTypeOption,
  PatientOption,
  MeetingTypeOption,
  User,
} from '../../models/scheduler';
import { FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';
import moment from 'moment';
import { DatePipe } from '@angular/common';
import { Router } from '@angular/router';
import { TosterService } from '../../service/toaster/tostr.service';

@Component({
  selector: 'app-appointment-list',
  standalone: false,
  providers: [DatePipe],
  templateUrl: './appointment-list.component.html',
  styleUrl: './appointment-list.component.scss'
})
export class AppointmentListComponent {
rowData: any[] = [];
  columnDefs: ColDef[] = [];
  searchValue: string = '';
  gridApi!: GridApi;
    gridColumnApi!: Column; paginationPageSize = 10;
    paginationPageSizeSelector: number[] | boolean = [10, 20, 50, 100];
    show: boolean = false;

    


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
  
 totalAmount: number = 0;
  useInsurance: boolean = false;
  selectedInsuranceId: any = null;
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
  public _adminservice = inject(AdminService);
  public authService = inject(AuthService);
  public toastr = inject(TosterService);
  constructor(
    private formBuilder: FormBuilder,
    private schedulerService: SchedulerService,
    private datePipe: DatePipe,
    private router: Router,private breadcrumbService: BreadcrumbService
  ) {}
  ngOnInit() {
       this.breadcrumbService.setBreadcrumbs([
      {
        label: 'Appointment List',
        url: 'Appointment/list'
      }
    ]);
    this.breadcrumbService.setVisible(true);

  this.columnDefs = [
  { field: 'patientName', headerName: 'Patient Name', sortable: true, filter: true },
  { field: 'therapist', headerName: 'Therapist', sortable: true, filter: true },
  { field: 'date', headerName: 'Date', sortable: true, filter: true },
  { field: 'startTime', headerName: 'Start Time', sortable: true, filter: true },
  { field: 'endTime', headerName: 'End Time', sortable: true, filter: true },
  { field: 'appointmentType', headerName: 'Appointment Type', sortable: true, filter: true },
  { field: 'meetingType', headerName: 'Meeting Type', sortable: true, filter: true },
  { field: 'appointmentStatus', headerName: 'Appointment Status', sortable: true, filter: true },
  {
    headerName: 'Actions',
    field: 'actions',
    flex: 1,
    filter: false,
    pinned: 'right',
    cellRenderer: (params: any) => {
      return `
        <div class="flex gap-2">
          <button class="text-primary-border-color  hover:underline" data-action="edit">
            <i class="fa fa-edit"></i>
          </button>
        </div>
      `;
    },
  }
];
    this.getAppointment();
    this.getAllTherapist();

    


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


 if (this.appointmentForm?.get('patientId')) {
    console.log("this.appointmentForm.get('patientId')", this.appointmentForm.get('patientId')?.value);
  } else {
    console.warn('appointmentForm or patientId is not available yet');
  }
  }

 
  onQuickFilterChanged(): void {
    if (this.gridApi) {
      this.gridApi.setGridOption('quickFilterText', this.searchValue);
    }
  }

  defaultColDef = {
    sortable: true,
    filter: true,
    resizable: true,
};

  onGridReady(params: GridReadyEvent) {
    params.api.sizeColumnsToFit();
  }

  gridOptions:any = {
  rowSelection: 'multiple',
  suppressRowClickSelection: true,
  onGridReady: (params: any) => {
    this.gridApi = params.api;
    this.gridColumnApi = params.columnApi;
  },
};

getAllTherapist(){
  debugger
  this.authService.getTherapistList().subscribe(res=>{
     this.therapistList = res;
    console.log("therapistList therapistList therapistList ",this.therapistList);
  })

  //   this.authService.getTherapistList.subscribe((this) => {
  //   this.therapistList = list;
  //   console.log("therapistList therapistList therapistList ",this.therapistList);
    
  // });

}
    onExportClick() {
      const worksheet = XLSX.utils.json_to_sheet(this.rowData);
      const workbook = { Sheets: { data: worksheet }, SheetNames: ['data'] };
      const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
      const blob = new Blob([excelBuffer], { type: 'application/octet-stream' });
      FileSaver.saveAs(blob, 'userList.xlsx');
    }
  

    getAppointment(){
      this._adminservice.GetAppointments().subscribe(res=>{
        console.log("res",res);
        this.rowData = res.data
      })
    }

get_id:any;
onCellClicked(event: any): void {
  debugger
  if (event.colDef.field !== 'actions') return;
  this.get_id = event.data.id;
  const clickedEl = event.eventPath?.[0] || event.target;
  if (!this.get_id || !clickedEl) return;
  const classList = clickedEl.classList;
  if (classList.contains('fa-edit')) {
    this.onEdit();
    this.show = true;
  } else if (classList.contains('fa-trash')) {
    // this.onDelete(id);
    // this.getUserId = id;
  }
}

onEdit() {
  debugger
  this._adminservice.GetAppointmentsById(this.get_id).subscribe(res => {
    
      const data = res;
      console.log("datadatadata",data);
      
      this.getAllTherapist();
       const matchedTherapist = this.therapistList.find(
      (therapist) => therapist.id === data.userId
    );
    console.log("matchedTherapist",matchedTherapist);
    
    
    this.appointmentForm.patchValue({
      therapistInput: data.userId,          // userId from payload
      patientId: data.patientId,
      date: data.date,
      startTime: data.startTime,
      endTime: data.endTime,
      appointmentTypeInput: data.appointmentTypeId,
      meetingTypeInput: data.meetingTypeId,
      repeat: data.repeat,
      repeatEvery: data.repeatEvery || 1,
      repeatPeriod: data.repeatPeriod || 'Day',
      endDate: data.endDate || '',
      notes: data.notes,
    });

    // handle repeatDays if needed (null in your payload)
    if (data.repeatDays && Array.isArray(data.repeatDays)) {
      const repeatDaysFormArray = this.appointmentForm.get('repeatDays') as FormArray;
      repeatDaysFormArray.clear();
      data.repeatDays.forEach((day: any) => {
        repeatDaysFormArray.push(this.formBuilder.control(day));
      });
    }

    this.show = true;
    
  });
}


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
        // this.close.emit();
        this.show = false;

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
    this.schedulerService.getAllPatientsList().subscribe((patients:any) => {
      this.PatientsListOptions = patients.data;
      console.log("PatientsListOptionsPatientsListOptionsPatientsListOptions",this.PatientsListOptions);      
      this.appointmentForm.get('patientId');
    });
  }


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
 
  this.updateTransactionNotes();
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

  setTab(tab: string) {
    this.selectedTab = tab;
  }

    get repeatDaysArray(): FormArray {
    return this.appointmentForm.get('repeatDays') as FormArray;
  }


  onInsuranceToggle(event: any) {
  debugger
  this.useInsurance = event.target.checked;
  if (this.useInsurance) {
    const patientId = this.appointmentForm.get('patientId')?.value;
    if (patientId) {
      this.selectedPatient = this.PatientsListOptions.find(p => p.id === patientId);
      this.insuranceList = this.selectedPatient?.insurances || [];
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

   toggleRepeatDay(day: string) {
    const index = this.repeatDaysArray.value.indexOf(day);
    if (index > -1) {
      this.repeatDaysArray.removeAt(index);
    } else {
      this.repeatDaysArray.push(this.formBuilder.control(day));
    }
  }

  isDaySelected(day: string): boolean {
    return this.repeatDaysArray.value.includes(day);
  }

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


    onSubmit(){

    }
}
