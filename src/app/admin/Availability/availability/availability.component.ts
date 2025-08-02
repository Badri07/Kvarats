import { ChangeDetectorRef, Component, ViewChild } from '@angular/core';
import { AuthService } from '../../../service/auth/auth.service';
import { AbstractControl, FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { AvailabilityModel, LeaveRequest } from '../../../models/user-model';
import { TosterService } from '../../../service/toaster/tostr.service';
import { AdminService } from '../../../service/admin/admin.service';
import { MatTableDataSource } from '@angular/material/table';
import { MatSort } from '@angular/material/sort';
import { MatPaginator } from '@angular/material/paginator';
import { Availability } from '../../../models/table-model';
import { Column, GridApi } from 'ag-grid-community';
import * as XLSX from 'xlsx';
import * as FileSaver from 'file-saver';
import { BreadcrumbService } from '../../../shared/breadcrumb/breadcrumb.service';
import { DatePipe } from '@angular/common';
import { MatDialog } from '@angular/material/dialog';

@Component({
  selector: 'app-availability',
  standalone: false,
  templateUrl: './availability.component.html',
  styleUrl: './availability.component.scss',
  providers: [DatePipe],
})
export class AvailabilityComponent {
  selectedTab: 'existing-availability' | 'availability' | 'list-leave' | 'leave' = 'existing-availability';

  isPopupOpen: boolean = true;
  isFullDay: boolean = true;
  isshowTime: boolean = true;
  availabilitySubmitted: boolean = false;
  leaveUserSubmitted: boolean = false;
  availabilityform!: FormGroup;
  Leaveform!: FormGroup;
  isEditMode = false;

  get_id: any;
  availability_get_id: any;
  therapistList: any[] = [];
  listLeave: LeaveRequest[] = [];
  ExistingList: Availability[] = [];
  userAvailabilityWithLeave: any[] = [];
  displayedColumns: string[] = ['Therapist', 'date', 'StartTime', 'EndTime', 'reason', 'actions'];
  displayedColumnsTherapist: string[] = ['Therapist', 'Day', 'StartTime', 'EndTime', 'actions'];
  leaveDataSource = new MatTableDataSource<LeaveRequest>();
  existingDataSource = new MatTableDataSource<Availability>();

  @ViewChild('leavePaginator') leavePaginator!: MatPaginator;
  @ViewChild('leaveSort') leaveSort!: MatSort;
  @ViewChild('existingPaginator') existingPaginator!: MatPaginator;
  @ViewChild('existingSort') existingSort!: MatSort;

  dayOfWeek = [
    { id: 0, name: 'Sunday' },
    { id: 1, name: 'Monday' },
    { id: 2, name: 'Tuesday' },
    { id: 3, name: 'Wednesday' },
    { id: 4, name: 'Thursday' },
    { id: 5, name: 'Friday' },
    { id: 6, name: 'Saturday' }
  ];

  selectedDays: number[] = [];

  constructor(
    private authservice: AuthService,
    private toastr: TosterService,
    private _service: AdminService,
    private fb: FormBuilder,
    private breadcrumbService: BreadcrumbService,
    private datePipe: DatePipe,
    private dialog: MatDialog,
    private cdRef: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.breadcrumbService.setBreadcrumbs([
      { label: 'Availability', url: 'appointments/availability' },
    ]);
    
    this.initializeForms();
    this.getUserLeave();
    this.getExistingList();
  }

  initializeForms() {
    this.availabilityform = this.fb.group({
      userId: ['', Validators.required],
      daysOfWeek: [[], Validators.required],
      startTime: ['', Validators.required],
      endTime: ['', Validators.required],
      isAvailable: [true]
    });

    this.Leaveform = this.fb.group({
      therapistName: ['', Validators.required],
      leaveDate: ['', Validators.required],
      startTime: [''],
      endTime: [''],
      isfullday: [false],
      reason: ['', Validators.required]
    });
  }

  ngAfterViewInit(): void {
    setTimeout(() => this.setTab(this.selectedTab));

    this.authservice.getTherapistList().subscribe({
      next: (res: any[]) => {
        this.therapistList = res;
      },
      error: (err) => {
        console.error('Failed to load therapists:', err);
      }
    });
  }

  clearAvailabilityForm(): void {
  // Enable the control before resetting
  this.availabilityform.get('daysOfWeek')?.enable();
  
  this.availabilityform.reset({
    userId: '',
    daysOfWeek: [],
    startTime: '',
    endTime: '',
    isAvailable: true
  });
  this.selectedDays = [];
  this.availabilitySubmitted = false;
  this.isEditMode = false;
  this.availability_get_id = null;
}


  setTab(tab: 'existing-availability' | 'availability' | 'list-leave' | 'leave') {
  // Clear forms when switching away from edit modes
  if (this.selectedTab === 'availability') {
    if (this.isEditMode && tab !== 'availability') {
      this.clearAvailabilityForm();
    } else if (!this.isEditMode) {
      // Enable daysOfWeek when switching to add mode
      this.availabilityform.get('daysOfWeek')?.enable();
    }
  }
  
  if (this.selectedTab === 'leave' && this.isEditMode && tab !== 'leave') {
    this.resetLeaveForm();
  }

  this.selectedTab = tab;
  const slider = document.querySelector('.slider') as HTMLElement;
  const tabElements = document.querySelectorAll('.tab');

  const tabIndex = {
    'existing-availability': 0,
    'availability': 1,
    'list-leave': 2,
    'leave': 3,
  }[tab];

  if (slider && tabElements[tabIndex]) {
    const tabEl = tabElements[tabIndex] as HTMLElement;
    slider.style.left = `${tabEl.offsetLeft}px`;
    slider.style.width = `${tabEl.offsetWidth}px`;
  }

  // Refresh data when switching to list tabs
  if (tab === 'existing-availability') {
    this.getExistingList();
  } else if (tab === 'list-leave') {
    this.getUserLeave();
  }

  this.isPopupOpen = tab === 'leave' || tab === 'availability';
}

toggleDay(dayId: number): void {
  const index = this.selectedDays.indexOf(dayId);
  if (index > -1) {
    this.selectedDays.splice(index, 1);
  } else {
    this.selectedDays.push(dayId);
  }

  // Update the form control
  this.availabilityform.get('daysOfWeek')?.setValue(this.selectedDays);
}




  onSubmitLeave() {
  this.leaveUserSubmitted = true;

  if (this.Leaveform.valid) {
    const isFullDay = this.Leaveform.get('isfullday')?.value;

    const formData: any = {
      id: this.get_id || 0, // Ensure id is passed (0 will indicate new leave)
      userId: this.Leaveform.get('therapistName')?.value,
      leaveDate: this.Leaveform.get('leaveDate')?.value,
      isFullDay: isFullDay,
      fromTime: isFullDay ? null : this.convertToTimeSpan(this.Leaveform.get('startTime')?.value),
      toTime: isFullDay ? null : this.convertToTimeSpan(this.Leaveform.get('endTime')?.value),
      reason: this.Leaveform.get('reason')?.value
    };

    const observable = this._service.AddUserLeave(formData);
    observable.subscribe({
      next: (res: LeaveRequest) => {
        this.resetLeaveForm();
        this.toastr.success(`Leave ${this.isEditMode ? 'updated' : 'saved'} successfully`);
        this.getUserLeave();
        this.setTab('list-leave');
      },
      error: (err) => {
        this.toastr.error(`Failed to ${this.isEditMode ? 'update' : 'save'} leave. Please try again.`);
        console.error('Error:', err);
      }
    });
  }
}

convertToTimeSpan(time: string): string | null {
  if (!time) return null;
  // Ensure format is HH:mm:ss (e.g., 09:00:00)
  return time.length === 5 ? `${time}:00` : time;
}


  private resetLeaveForm(): void {
    this.Leaveform.reset({
      therapistName: '',
      leaveDate: '',
      startTime: '',
      endTime: '',
      isfullday: false,
      reason: ''
    });
    this.leaveUserSubmitted = false;
    this.isEditMode = false;
    this.get_id = null;
    this.isPopupOpen = false;
  }

  getUserLeave(): void {
    this._service.getUserLeave().subscribe((res: LeaveRequest[]) => {
      this.listLeave = res;
      console.log("this.listLeave",this.listLeave);
      this.rowDataLeave = this.listLeave.map((user: any, index: number) => ({
        ...user,
        avatar: `https://randomuser.me/api/portraits/${index % 2 === 0 ? 'men' : 'women'}/${30 + index}.jpg`
      }));
      this.cdRef.detectChanges();
    });
  }

  getExistingList(): void {
    this._service.getExistingList().subscribe((res: Availability[]) => {
      this.ExistingList = res;
      this.rowData = this.ExistingList.map((user: any, index: number) => ({
        ...user,
        avatar: `https://randomuser.me/api/portraits/${index % 2 === 0 ? 'men' : 'women'}/${30 + index}.jpg`
      }));
    });
  }

  onFullDayToggle() {
  this.isFullDay = this.Leaveform.get('isfullday')?.value || false;
  this.isshowTime = !this.isFullDay;

  const startTimeControl = this.Leaveform.get('startTime');
  const endTimeControl = this.Leaveform.get('endTime');

  if (this.isFullDay) {
    // Clear time values when full day is selected
    startTimeControl?.setValue('');
    endTimeControl?.setValue('');
    startTimeControl?.clearValidators();
    endTimeControl?.clearValidators();
  } else {
    // Add validators when partial day is selected
    startTimeControl?.setValidators([Validators.required]);
    endTimeControl?.setValidators([Validators.required]);
    
    // Initialize with default times if empty
    if (!startTimeControl?.value) {
      startTimeControl?.setValue('09:00');
    }
    if (!endTimeControl?.value) {
      endTimeControl?.setValue('17:00');
    }
  }

  // Update validation status
  startTimeControl?.updateValueAndValidity();
  endTimeControl?.updateValueAndValidity();
}

  closePopup() {
    this.isPopupOpen = false;
    this.setTab(this.selectedTab === 'leave' ? 'list-leave' : 'existing-availability');
  }

onSubmit() {
  this.availabilitySubmitted = true;

  // Always sync selectedDays to the form control
  this.availabilityform.get('daysOfWeek')?.setValue(this.selectedDays);

  if (this.availabilityform.valid) {
    const startTimeRaw = this.availabilityform.get('startTime')?.value;
    const endTimeRaw = this.availabilityform.get('endTime')?.value;

    const parseTimeStringToDate = (timeStr: string): Date => {
      const [hours, minutes] = timeStr.split(':').map(Number);
      const date = new Date();
      date.setHours(hours, minutes, 0, 0);
      return date;
    };

    const startTimeDate = parseTimeStringToDate(startTimeRaw);
    const endTimeDate = parseTimeStringToDate(endTimeRaw);

    const startTime = this.datePipe.transform(startTimeDate, 'HH:mm');
    const endTime = this.datePipe.transform(endTimeDate, 'HH:mm');

    const formData = {
      id: this.availability_get_id,
      userId: this.availabilityform.get('userId')?.value,
      daysOfWeek: [...this.selectedDays],
      startTime: startTime,
      endTime: endTime,
      isAvailable: this.availabilityform.get('isAvailable')?.value
    };

    const observable = this.authservice.addAvailability(formData); // Same method for add/update

    observable.subscribe({
      next: (res) => {
        this.clearAvailabilityForm();
        this.toastr.success(`Availability ${this.isEditMode ? 'updated' : 'saved'} successfully`);
        this.getExistingList();
        this.setTab('existing-availability');
      },
      error: (err) => {
        this.toastr.error('Failed to save availability. Please try again.');
        console.error('Availability error:', err);
      }
    });
  }
}


  get availabilityUser(): { [key: string]: AbstractControl } {
    return this.availabilityform.controls;
  }

  get leaveFormUser(): { [key: string]: AbstractControl } {
    return this.Leaveform.controls;
  }

  fetchLeavesByUser(userId: string): void {
    this._service.getLeavesByUser(userId).subscribe({
      next: (leaves: LeaveRequest[]) => {
        this.listLeave = leaves;
        this.rowDataLeave = this.listLeave.map((user: any, index: number) => ({
          ...user,
          avatar: `https://randomuser.me/api/portraits/${index % 2 === 0 ? 'men' : 'women'}/${30 + index}.jpg`
        }));
        this.cdRef.detectChanges();
      },
      error: (err) => {
        this.toastr.error('Failed to fetch leaves for user');
        console.error('Error fetching leaves:', err);
      }
    });
  }

  editLeave(row: LeaveRequest): void {
  if (!row || !row.userId) {
    this.toastr.error('Invalid leave data');
    return;
  }

  this.isEditMode = true;
  this.get_id = row.id;
  
  this.fetchLeavesByUser(row.userId);

  const leaveDate = row.leaveDate ? new Date(row.leaveDate) : new Date();
  const formattedDate = this.datePipe.transform(leaveDate, 'yyyy-MM-dd');

  this.Leaveform.patchValue({
    therapistName: row.userId,
    leaveDate: formattedDate,
    reason: row.reason,
    isfullday: row.isFullDay,
    startTime: row.fromTime || '',
    endTime: row.toTime || ''
  });

  this.isshowTime = !row.isFullDay;
  this.setTab('leave'); // Use setTab instead of directly setting selectedTab
}

  deleteLeave(id: string): void {
    const confirmDelete = confirm('Are you sure you want to delete this leave?');
    if (!confirmDelete) return;

    this._service.deleteLeave(id).subscribe({
      next: () => {
        this.toastr.success('Leave deleted successfully');
        this.getUserLeave();
      },
      error: (err: any) => {
        this.toastr.error('Failed to delete leave. Please try again.');
        console.error('Delete failed:', err);
      }
    });
  }

editAvailability(row: Availability): void {
  this.isEditMode = true;
  this.availability_get_id = row.id;

  const selectedDay = this.dayOfWeek.find(day => day.name === row.dayName)?.id ?? null;
  const dayArray = selectedDay !== null ? [selectedDay] : [];

  this.selectedDays = [...dayArray];

  this.availabilityform.patchValue({
    userId: row.userId,
    daysOfWeek: dayArray,
    startTime: this.formatTimeToHHmm(row.startTime),
    endTime: this.formatTimeToHHmm(row.endTime),
    isAvailable: row.isAvailable
  });

  this.setTab('availability');
}


  private formatTimeToHHmm(time: string): string {
    if (!time) return '';
    const fullTime = time.length === 5 ? `${time}:00` : time;
    const isoString = `1970-01-01T${fullTime}`;
    const date = new Date(isoString);

    if (isNaN(date.getTime())) {
      console.error(`Invalid time format: ${time}`);
      return '';
    }

    return this.datePipe.transform(date, 'HH:mm') || '';
  }

  deleteAvailability(id: string): void {
    const confirmDelete = confirm('Are you sure you want to delete this availability?');
    if (!confirmDelete) return;

    this._service.availabilitDeleteLeave(id).subscribe({
      next: () => {
        this.toastr.success('Availability deleted successfully');
        this.getExistingList();
      },
      error: (err: any) => {
        this.toastr.error('Failed to delete availability. Please try again.');
        console.error('Delete failed:', err);
      }
    });
  }

  gridApi!: GridApi;
  gridColumnApi!: Column;
  paginationPageSize = 10;
  paginationPageSizeSelector: number[] | boolean = [10, 20, 50, 100];
  searchValue: string = '';

  defaultColDef = {
    sortable: true,
    filter: true,
    resizable: true,
  };

  rowData: any[] = [];
  rowDataLeave: any[] = [];

  gridOptions: any = {
    rowSelection: 'multiple',
    suppressRowClickSelection: true,
    onGridReady: (params: any) => {
      this.gridApi = params.api;
      this.gridColumnApi = params.columnApi;
    },
    onCellClicked: this.onGridRowClicked.bind(this),
  };

  gridOptionsLeave: any = {
    rowSelection: 'multiple',
    suppressRowClickSelection: true,
    context: { componentParent: this },
    onGridReady: (params: any) => {
      this.gridApi = params.api;
      this.gridColumnApi = params.columnApi;
    },
    onCellClicked: this.onGridRowClicked.bind(this),
  };

  columnDefs: any = [
    {
      headerCheckboxSelection: true,
      checkboxSelection: true,
      field: 'checkbox',
      width: 40,
      pinned: 'left',
      cellClass: 'no-focus-style',
    },
    {
      headerName: 'SI.No',
      field: 'position',
      valueGetter: 'node.rowIndex + 1',
      flex: 0.5,
    },
    {
      headerName: 'Therapist',
      field: 'username',
      flex: 1.2,
      cellRenderer: (params: any) => {
        return `
          <div class="flex items-center gap-2">
            <img src="${params.data.avatar}" class="rounded-full w-8 h-8" />
            <span>${params.value}</span>
          </div>
        `;
      },
    },
    {
      headerName: 'Day',
      field: 'dayName',
      flex: 1,
    },
    {
      headerName: 'StartTime',
      field: 'startTime',
      flex: 1,
    },
    {
      headerName: 'EndTime',
      field: 'endTime',
      flex: 1,
    },
    {
      headerName: 'Actions',
      field: 'actions',
      flex: 1,
      pinned: 'right',
      cellRenderer: (params: any) => {
        const div = document.createElement('div');
        div.className = 'flex gap-2';
        
        const editBtn = document.createElement('button');
        editBtn.setAttribute('data-action', 'edit');
        editBtn.innerHTML = '<i class="fa fa-edit"></i>';
        editBtn.className = 'text-primary-border-color hover:underline';
        
        const deleteBtn = document.createElement('button');
        deleteBtn.setAttribute('data-action', 'delete');
        deleteBtn.innerHTML = '<i class="fa fa-trash"></i>';
        deleteBtn.className = 'text-primary-border-color hover:underline';
        
        div.appendChild(editBtn);
        div.appendChild(deleteBtn);
        return div;
      }
    },
  ];

  columnDefsLeave: any = [
    {
      headerCheckboxSelection: true,
      checkboxSelection: true,
      field: 'checkbox',
      width: 40,
      pinned: 'left',
      cellClass: 'no-focus-style',
    },
    {
      headerName: 'SI.No',
      field: 'position',
      valueGetter: 'node.rowIndex + 1',
      flex: 0.5,
    },
    {
      headerName: 'Therapist',
      field: 'userName',
      flex: 1.2,
      cellRenderer: (params: any) => {
        return `
          <div class="flex items-center gap-2">
            <img src="${params.data.avatar}" class="rounded-full w-8 h-8" />
            <span>${params.value}</span>
          </div>
        `;
      },
    },
    {
      headerName: 'Date',
      field: 'leaveDate',
      flex: 1,
      valueFormatter: (params: any) => {
        if (!params.value) return '';
        const date = new Date(params.value);
        return this.datePipe.transform(date, 'yyyy-MM-dd');
      }
    },
    {
      headerName: 'Start Time',
      field: 'fromTime',
      flex: 1,
    },
    {
      headerName: 'End Time',
      field: 'toTime',
      flex: 1,
    },
    {
      headerName: 'Reason',
      field: 'reason',
      flex: 1,
    },
    {
      headerName: 'Actions',
      field: 'actions',
      flex: 1,
      pinned: 'right',
      cellRenderer: (params: any) => {
        const div = document.createElement('div');
        div.className = 'flex gap-2';
        
        const editBtn = document.createElement('button');
        editBtn.innerHTML = '<i class="fa fa-edit"></i>';
        editBtn.className = 'text-primary-border-color hover:underline';
        editBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          params.context.componentParent.editLeave(params.data);
        });
        
        const deleteBtn = document.createElement('button');
        deleteBtn.innerHTML = '<i class="fa fa-trash"></i>';
        deleteBtn.className = 'text-primary-border-color hover:underline';
        deleteBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          params.context.componentParent.deleteLeave(params.data.id);
        });
        
        div.appendChild(editBtn);
        div.appendChild(deleteBtn);
        return div;
      }
    }
  ];

  onGridRowClicked(event: any): void {
    const action = event.event?.target?.closest('button')?.getAttribute('data-action');
    const rowData = event.data;

    if (!action || !rowData) return;

    if (this.selectedTab === 'list-leave') {
      switch (action) {
        case 'edit':
          this.editLeave(rowData);
          break;
        case 'delete':
          this.deleteLeave(rowData.id);
          break;
      }
    } else if (this.selectedTab === 'existing-availability') {
      switch (action) {
        case 'edit':
          this.editAvailability(rowData);
          break;
        case 'delete':
          this.deleteAvailability(rowData.id);
          break;
      }
    }
  }

  onQuickFilterChanged(): void {
    if (this.gridApi) {
      this.gridApi.setGridOption('quickFilterText', this.searchValue);
    }
  }

  onExportClick() {
    const worksheet = XLSX.utils.json_to_sheet(this.rowData);
    const workbook = { Sheets: { data: worksheet }, SheetNames: ['data'] };
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([excelBuffer], { type: 'application/octet-stream' });
    FileSaver.saveAs(blob, 'userList.xlsx');
  }

  viewAvailabilityWithLeave(userId: string): void {
    this._service.getAvailabilityByUser(userId).subscribe({
      next: (res: any[]) => {
        this.userAvailabilityWithLeave = res;
        this.setTab('existing-availability');
      },
      error: (err) => {
        this.toastr.error('Failed to fetch availability details.');
        console.error('API error:', err);
      }
    });
  }
}