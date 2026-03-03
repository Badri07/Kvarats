import { Component, inject, OnInit } from '@angular/core';
import { PatientService } from '../../service/patient/patients-service';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { PopupService } from '../../service/popup/popup-service';
import { AuthService } from '../../service/auth/auth.service';
import { TosterService } from '../../service/toaster/tostr.service';

@Component({
  selector: 'app-patient-appointment',
  standalone: false,
  templateUrl: './patient-appointment.component.html',
  styleUrls: ['./patient-appointment.component.scss']
})
export class PatientAppointmentComponent implements OnInit {
  image: string = 'images/img-appointment1.png';
  
  cities: any[] = [];
  searchForm!: FormGroup;
  appointmentForm!: FormGroup;
  therapists: any = null;
  filteredTherapists: any[] = [];
  selectedCity: any = null;  
  activeTab: string = 'appointments';
  loading: boolean = false;
  error: string = '';
  appointments: any[] = [];
  
  // Modal properties
  showAppointmentModal: boolean = false;
  selectedTherapist: any = null;
  selectedSlot: any = null;
  
  // Form dropdown options
  therapistList: any[] = [];
  PatientsListOptions: any[] = [];
  meetingTypeOptions: any[] = [];
  serviceDropdown: any[] = [];
  weekDays: string[] = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  availableStartTimes: any[] = [];
  minDate: string = '';

  public _loader = inject(PopupService);
  public _authService = inject(AuthService);

  constructor(
    private patientService: PatientService,
    private fb: FormBuilder,
    private formBuilder: FormBuilder
  ) {}

  ngOnInit(): void {
    this.initializeForms();
    this.loadCities();
    this.loadTherapistList(); // Load initial therapist list
    this.loadAppointments();
    this.fetchDropdownOptions('AppointmentType');
    this.setMinDate();
    this.getSpecialization();
    this.loadDropdowns();

    this.searchForm.get('date')?.valueChanges
      .pipe(debounceTime(300), distinctUntilChanged())
      .subscribe((val) => {
        if (val && val.length > 2) {
          this.loadCities(val);
        } else if (!val) {
          this.loadCities();
        }
      });
  }

  initializeForms() {
    this.searchForm = this.fb.group({
      date: [''],
      query: [''],
    });

    this.appointmentForm = this.formBuilder.group({
      therapistInput: ['', Validators.required],
      title: [''],
      date: ['', Validators.required],
      chiefComplaintInput:[''],
      startTime: ['', Validators.required],
      endTime: ['', Validators.required],
      meetingTypeInput: ['', Validators.required],
      ServiceInput: ['', Validators.required],
      repeatEvery: [1],
      repeatPeriod: ['Day'],
      endDate: [''],
      repeat: [false],
      repeatDays: this.formBuilder.array([]),
      notes: [''],
    });

    this.fetchDropdownOptions('Meeting Type');
    this.getServiceDropdown();
  }

  // Set minimum date to today
  setMinDate(): void {
    const today = new Date();
    this.minDate = today.toISOString().split('T')[0];
  }

     chiefComplaints: any[] = [];
loadDropdowns(): void {
    this.patientService.getChiefComplaintdata().subscribe({
      next: (data:any) => this.chiefComplaints = data,
      error: (err:any) => console.error('Failed to load blood groups', err)
    });
  }
  loadCities(cityName?: string) {
    // this._loader.show();
    // this.patientService.GetCityList(cityName).subscribe({
    //   next: (res) => {
    //     this._loader.hide();
    //     this.cities = res?.data || [];
    //   },
    //   error: (err) => {
    //     this._loader.hide();
    //     console.error('Error loading cities:', err);
    //   }
    // });
  }

  onCitySelected(event: any) {
    const selectedCityName = event.target.value;
    const city = this.cities.find(c => c.cityName === selectedCityName);

    if (city) {
      this.selectedCity = city;
      this.searchForm.patchValue({ city: city.cityName });
    } else {
      this.selectedCity = null;
      this.searchForm.patchValue({ city: selectedCityName });
    }
  }

  onSearch() {
    this._loader.show();
    const formValue = this.searchForm.value;
    const getPatientIds: any = this._authService.getPatientId();
    const specialization = formValue.query || '';
    const date = formValue.date || '';

    this.patientService.GetTherapistsAvailabilityByPatientID(
      getPatientIds, 
      date, 
      specialization
    ).subscribe({
      next: (res: any) => {
        this._loader.hide();
        console.log('Search API Response:', res);
        
        if (res.success && res.data) {
          this.therapists = res.data.map((therapist: any) => this.enrichTherapistData(therapist));
          this.filteredTherapists = this.therapists;
          console.log('Search results - Therapists loaded:', this.therapists);
          console.log('Search results - Filtered therapists:', this.filteredTherapists);
        } else {
          this.therapists = [];
          this.filteredTherapists = [];
          console.log('No therapists found with the search criteria');
        }
      },
      error: (err) => {
        this._loader.hide();
        console.error('Error searching therapists:', err);
        this.error = 'Failed to load therapists. Please try again.';
        this.therapists = [];
        this.filteredTherapists = [];
      }
    });
  }

  // Load initial therapist list
  loadTherapistList(): void {
    this._loader.show();
    this.patientService.getTherapistsByAvailability().subscribe({
      next: (res: any) => {
        this._loader.hide();
        console.log('Initial therapist list API Response:', res);
        
        if (res?.data) {
          this.therapistList = res.data.map((therapist: any) => this.enrichTherapistData(therapist));
          this.filteredTherapists = [...this.therapistList];
          console.log('Initial therapist list loaded:', this.therapistList);
          console.log('Initial filtered therapists:', this.filteredTherapists);
        } else {
          this.therapistList = [];
          this.filteredTherapists = [];
        }
      },
      error: (err) => {
        this._loader.hide();
        console.error('Error loading therapist list:', err);
        this.therapistList = [];
        this.filteredTherapists = [];
      }
    });
  }

  private enrichTherapistData(therapist: any): any {
    return {
      ...therapist,
      qualifications: therapist.qualifications || 'Certified Professional',
      department: therapist.department || 'General Therapy',
      organization: therapist.organization || 'Healthcare Center',
      location: therapist.location || 'Main Clinic',
      therapistPhoneNo: therapist.phoneNumber || 'Not available',
      isSoloProvider: therapist.isSoloProvider || false,
      availability: therapist.availability || []
    };
  }

  getInitials(name: string): string {
    if (!name) return '';
    const names = name.split(' ');
    if (names.length === 1) return names[0][0].toUpperCase();
    return (names[0][0] + names[1][0]).toUpperCase();
  }

  getDayName(day: number): string {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    return days[day] || '';
  }

  bookAppointment(therapist: any) {
    console.log('Book appointment for:', therapist);
    this.selectedTherapist = therapist;
    this.showAppointmentModal = true;
    
    // Pre-fill therapist in form
    const therapistInList = this.therapistList.find(t => t.id === therapist.therapistId);
    if (therapistInList) {
      this.appointmentForm.patchValue({
        therapistInput: therapist.therapistId,
        date: new Date().toISOString().split('T')[0]
      });
      this.onDateChange();
    }
  }

  // selectTherapistSlot(therapist: any, slot: any) {
  //   this.selectedTherapist = therapist;
  //   this.selectedSlot = slot;
  //   this.showAppointmentModal = true;
    
  //   const slotDate = new Date(slot.date);
  //   const now = new Date();
    
  //   // Validate if slot is in the past
  //   if (slotDate < now) {
  //     console.warn('Cannot select past time slot');
  //     return;
  //   }
    
  //   this.appointmentForm.patchValue({
  //     therapistInput: therapist.therapistId,
  //     date: this.formatDateForInput(slot.date),
  //     startTime: this.formatTimeForForm(slot.startTime),
  //     endTime: this.formatTimeForForm(slot.endTime)
  //   });
    
  //   // Update available time slots based on selected date
  //   this.updateAvailableTimeSlots(slot.date);
  // }

  getAvailableSlotsCount(therapist: any): number {
    const slots = this.getAvailableSlots(therapist);
    return slots.filter(slot => slot.isAvailable).length;
  }

  getAvailableSlots(therapist: any): any[] {
    if (!therapist.availability || !Array.isArray(therapist.availability)) {
      console.log('No availability data for therapist:', therapist.therapistName);
      return [];
    }

    // Convert weekly availability to specific date slots for the next 7 days
    const slots = [];
    const today = new Date();
    
    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      const dayOfWeek = date.getDay(); // 0 = Sunday, 1 = Monday, etc.
      
      const dayAvailability = therapist.availability.find((avail: any) => avail.dayOfWeek === dayOfWeek);
      
      if (dayAvailability && dayAvailability.isAvailable) {
        slots.push({
          date: date.toISOString().split('T')[0], // YYYY-MM-DD format
          startTime: dayAvailability.startTime,
          endTime: dayAvailability.endTime,
          isAvailable: dayAvailability.isAvailable && !dayAvailability.hasLeave,
          dayName: dayAvailability.dayName
        });
      }
    }

    console.log(`Generated ${slots.length} slots for ${therapist.therapistName}`);
    return slots;
  }

  // New method to format appointment date and time as requested
  formatAppointmentDateTime(dateString: string, startTime: string, endTime: string): string {
    if (!dateString || !startTime || !endTime) return 'Invalid Date & Time';
    
    try {
      const date = new Date(dateString);
      const formattedDate = date.toLocaleDateString('en-US', { 
        weekday: 'short', 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
      });
      
      const formattedStartTime = this.formatTime(startTime);
      const formattedEndTime = this.formatTime(endTime);
      
      return `${formattedDate} at ${formattedStartTime} - ${formattedEndTime}`;
    } catch (error) {
      return 'Invalid Date & Time';
    }
  }

  formatDate(dateString: string): string {
    if (!dateString) return 'Invalid Date';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', { 
        weekday: 'short', 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
      });
    } catch (error) {
      return 'Invalid Date';
    }
  }

  formatDateForInput(dateString: string): string {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      return date.toISOString().split('T')[0];
    } catch (error) {
      return '';
    }
  }

  // formatTime(timeString: string): string {
  //   if (!timeString) return 'Invalid Time';
    
  //   try {
  //     // Handle both "09:00" format and full datetime strings
  //     const timePart = timeString.includes('T') ? timeString.split('T')[1] : timeString;
  //     if (!timePart) return 'Invalid Time';
      
  //     const [hours, minutes] = timePart.split(':');
  //     const hour = parseInt(hours, 10);
  //     const minute = minutes?.substring(0, 2) || '00';
      
  //     const period = hour >= 12 ? 'PM' : 'AM';
  //     const displayHour = hour % 12 || 12;
      
  //     return `${displayHour}:${minute} ${period}`;
  //   } catch (error) {
  //     return 'Invalid Time';
  //   }
  // }

  formatTimeForForm(timeString: string): string {
    if (!timeString) return '';
    
    try {
      const timePart = timeString.includes('T') ? timeString.split('T')[1] : timeString;
      if (!timePart) return '';
      
      const [hours, minutes] = timePart.split(':');
      const hour = parseInt(hours, 10);
      const minute = minutes?.substring(0, 2) || '00';
      
      const period = hour >= 12 ? 'PM' : 'AM';
      const displayHour = hour % 12 || 12;
      
      return `${displayHour}:${minute} ${period}`;
    } catch (error) {
      return '';
    }
  }

  // Modal methods
  closeModal() {
    this.showAppointmentModal = false;
    this.selectedTherapist = null;
    this.selectedSlot = null;
    this.appointmentForm.reset({
      repeatEvery: 1,
      repeatPeriod: 'Day',
      repeat: false
    });
  }

  onBackdropClick(event: any) {
    if (event.target === event.currentTarget) {
      this.closeModal();
    }
  }

  currentDate(): Date {
    return new Date();
  }


  // updateAvailableTimeSlots(selectedDate: string): void {
  //   const now = new Date();
  //   const selected = new Date(selectedDate);
  //   const isToday = selected.toDateString() === now.toDateString();
    
  //   // Generate time slots with validation
  //   this.availableStartTimes = this.generateTimeSlots().map(slot => {
  //     if (isToday) {
  //       // For today, disable past times
  //       const [time, modifier] = slot.split(' ');
  //       let [hours, minutes] = time.split(':').map(Number);
        
  //       if (modifier === 'PM' && hours !== 12) hours += 12;
  //       if (modifier === 'AM' && hours === 12) hours = 0;
        
  //       const slotTime = new Date();
  //       slotTime.setHours(hours, minutes, 0, 0);
        
  //       return {
  //         value: slot,
  //         display: slot,
  //         disabled: slotTime < now
  //       };
  //     }
      
  //     // For future dates, all slots are available
  //     return {
  //       value: slot,
  //       display: slot,
  //       disabled: false
  //     };
  //   });
    
  //   // If no time selected yet, auto-select first available slot
  //   const currentStartTime = this.appointmentForm.get('startTime')?.value;
  //   if (!currentStartTime) {
  //     const firstAvailable = this.availableStartTimes.find(slot => !slot.disabled);
  //     if (firstAvailable) {
  //       this.appointmentForm.patchValue({ startTime: firstAvailable.value });
  //       this.onStartTimeChange();
  //     }
  //   }
  // }

  // generateTimeSlots(): string[] {
  //   const slots = [];
  //   for (let hour = 9; hour <= 16; hour++) {
  //     for (let minute = 0; minute < 60; minute += 30) {
  //       const period = hour >= 12 ? 'PM' : 'AM';
  //       const displayHour = hour % 12 || 12;
  //       slots.push(`${displayHour}:${minute.toString().padStart(2, '0')} ${period}`);
  //     }
  //   }
  //   return slots;
  // }

  // onStartTimeChange(): void {
  //   const startTime = this.appointmentForm.get('startTime')?.value;
  //   const selectedDate = this.appointmentForm.get('date')?.value;
    
  //   if (startTime && selectedDate) {
  //     const [time, modifier] = startTime.split(' ');
  //     let [hours, minutes] = time.split(':').map(Number);
      
  //     // Convert to 24-hour format for calculation
  //     if (modifier === 'PM' && hours !== 12) hours += 12;
  //     if (modifier === 'AM' && hours === 12) hours = 0;
      
  //     // Add 30 minutes for appointment duration
  //     let endHours = hours;
  //     let endMinutes = minutes + 30;
      
  //     if (endMinutes >= 60) {
  //       endHours += 1;
  //       endMinutes = 0;
  //     }
      
  //     // Convert back to 12-hour format
  //     const endModifier = endHours >= 12 ? 'PM' : 'AM';
  //     const displayEndHours = endHours % 12 || 12;
  //     const endTime = `${displayEndHours}:${endMinutes.toString().padStart(2, '0')} ${endModifier}`;
      
  //     this.appointmentForm.patchValue({ endTime });
      
  //     // Validate if the selected time is in the past
  //     this.validateSelectedDateTime(selectedDate, startTime);
  //   }
  // }

  // validateSelectedDateTime(date: string, time: string): void {
  //   const now = new Date();
  //   const selectedDateTime = new Date(`${date}T${this.convertTo24Hour(time)}`);
    
  //   if (selectedDateTime < now) {
  //     // Clear the form if past time is selected
  //     this.appointmentForm.patchValue({
  //       startTime: '',
  //       endTime: ''
  //     });
      
  //     console.warn('Cannot book appointment in the past');
  //   }
  // }

  convertTo24Hour(time12h: string): string {
    const [time, modifier] = time12h.split(' ');
    let [hours, minutes] = time.split(':');
    
    if (modifier === 'PM' && hours !== '12') {
      hours = (parseInt(hours, 10) + 12).toString();
    }
    if (modifier === 'AM' && hours === '12') {
      hours = '00';
    }
    
    return `${hours.padStart(2, '0')}:${minutes}:00`;
  }

  public toastr = inject(TosterService)
  onSubmit(): void {
    if (this.appointmentForm.invalid) {
      this.markFormGroupTouched(this.appointmentForm);
      return;
    }

    // Get patient ID from JWT token
    const patientId = this._authService.getPatientId();
    
    if (!patientId) {
      console.error('Patient ID not found in token');
      return;
    }

    this._loader.show();
    const formVal = this.appointmentForm.value;

    const toISOStringWithTime = (date: Date, timeStr: string): string => {
      const timePart = timeStr.includes('T') ? timeStr.split('T')[1] : timeStr;
      const [hours, minutes] = timePart.split(':');
      const hour = parseInt(hours, 10);
      const minute = minutes?.substring(0, 2) || '00';

      const dateTime = new Date(date);
      dateTime.setHours(hour, parseInt(minute), 0, 0);
      return dateTime.toISOString();
    };
    const selectedDate = new Date(this.selectedSlot.date);

    const payload = {
      patientId: patientId,
      userId: formVal.therapistInput,
      date: selectedDate,
      startTime: toISOStringWithTime(selectedDate, this.selectedSlot.startTime),
      endTime: toISOStringWithTime(selectedDate, this.selectedSlot.endTime),
      meetingTypeId: Number(formVal.meetingTypeInput) || 0,
      appointmentStatusId: 1,
      notes: formVal.notes,
      chiefComplaintIds : 
        [Number(formVal.chiefComplaintInput)],
      serviceIds: formVal.ServiceInput ? [formVal.ServiceInput] : [], 
      repeat: formVal.repeat || false,

      repeatEvery: formVal.repeatEvery || 0,
      repeatPeriod: formVal.repeatPeriod,
      endDate: formVal.endDate ? new Date(formVal.endDate) : null,
      repeatDays: formVal.repeatDays || [],
      title: formVal.title || `Appointment with ${this.selectedTherapist?.therapistName || 'Therapist'}`
    };

    console.log('Appointment Payload:', payload);
    this.patientService.saveAppointmentWithTransaction(payload).subscribe({
      next: (res: any) => {
        this._loader.hide();
        this.toastr.success('Appointment saved successfully!');
        this.closeModal();
        this.loadAppointments();
        this.activeTab = 'appointments';
        
        if (this.activeTab === 'therapists') {
          this.onSearch();
        }
      },
      error: (err) => {
        this._loader.hide();
        console.error('Error saving appointment:', err);
        // this.toastr.error('Failed to save appointment');
      }
    });
  }

  Specialization:any[]=[]
  getSpecialization(){
    this.patientService.getAllCategories().subscribe(res=>{
      this.Specialization = res.data
    })
  }

  loadAppointments() {
    const getPatients_id: any = this._authService.getPatientId();
    this.loading = true;
    this.patientService.getAppointmentsByPatientId(getPatients_id).subscribe({
      next: (res: any) => {
        this.loading = false;
        console.log('Full API Response:', res);
        console.log('Response data:', res?.data);
        console.log('Data type:', typeof res?.data);
        console.log('Is array?', Array.isArray(res?.data));
        
        // Handle different response structures
        if (Array.isArray(res?.data)) {
          this.appointments = res.data;
        } else if (Array.isArray(res)) {
          this.appointments = res;
        } else if (res?.data && typeof res.data === 'object') {
          // If it's an object with appointments property
          this.appointments = res.data.appointments || res.data.results || [];
        } else {
          this.appointments = [];
        }
        
        console.log('Final appointments array:', this.appointments);
        console.log('Appointments length:', this.appointments.length);
      },
      error: (err) => {
        this.loading = false;
        this.error = 'Failed to load appointments';
        console.error('Error loading appointments:', err);
      }
    });
  }

  markFormGroupTouched(formGroup: FormGroup) {
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      control?.markAsTouched();
    });
  }

  fetchDropdownOptions(category: string): void {
    this._loader.show();
    // Replace with your actual service call
    this.patientService.getDropdownsByCategory(category).subscribe({
      next: (res: any) => {
        this._loader.hide();
        const options = res?.data || [];
        const mappedOptions = options.map((item: any) => ({
          id: item.id,
          value: item.description || item.value || item.text || item.label,
        }));

        if (category === 'Meeting Type') {
          this.meetingTypeOptions = mappedOptions;
        }
      },
      error: (err) => {
        this._loader.hide();
        console.error(`Error loading ${category} options:`, err);
        
        // Fallback options
        // if (category === 'Meeting Type') {
        //   this.meetingTypeOptions = [
        //     { id: 1, value: 'In-person' },
        //     { id: 2, value: 'Virtual' },
        //     { id: 3, value: 'Phone' }
        //   ];
        // }
      }
    });
  }

  getServiceDropdown(): void {
    var get_Client_id:any = this._authService.getPatientClientId();
    this._loader.show();
    this.patientService.getItems(get_Client_id).subscribe({
      next: (res: any) => {
        this._loader.hide();
        this.serviceDropdown = res;
      },
      error: (err) => {
        this._loader.hide();
        console.error('Error loading services:', err);
        this.serviceDropdown = [];
      }
    });
  }

  onSelectPatients(): void {
    // Additional logic when patient is selected
    const patientId = this.appointmentForm.get('patientId')?.value;
    if (patientId) {
      // You can load patient details here if needed
      console.log('Patient selected:', patientId);
    }
  }

  isDaySelected(day: string): boolean {
    const repeatDays = this.appointmentForm.get('repeatDays')?.value || [];
    return repeatDays.includes(day);
  }

  toggleRepeatDay(day: string): void {
    const repeatDaysControl = this.appointmentForm.get('repeatDays');
    const currentDays: string[] = repeatDaysControl?.value || [];
    
    if (currentDays.includes(day)) {
      const updatedDays = currentDays.filter(d => d !== day);
      repeatDaysControl?.setValue(updatedDays);
    } else {
      const updatedDays = [...currentDays, day];
      repeatDaysControl?.setValue(updatedDays);
    }
  }

  getTotalAppointments(): number {
    return this.appointments?.length || 0;
  }

  getUpcomingAppointments(): number {
    if (!this.appointments) return 0;
    const now = new Date();
    return this.appointments.filter(apt => {
      const aptDate = new Date(apt.date);
      return aptDate >= now && apt.appointmentStatus?.toLowerCase() === 'scheduled';
    }).length;
  }

  getCompletedAppointments(): number {
    if (!this.appointments) return 0;
    return this.appointments.filter(apt => 
      apt.appointmentStatus?.toLowerCase() === 'completed'
    ).length;
  }

  getPendingAppointments(): number {
    if (!this.appointments) return 0;
    return this.appointments.filter(apt => 
      apt.appointmentStatus?.toLowerCase() === 'pending'
    ).length;
  }

  // Enhanced status classes with better styling
  getStatusClass(status: string): string {
    if (!status) return 'bg-gray-100 text-gray-800';
    
    const statusLower = status.toLowerCase();
    switch (statusLower) {
      case 'confirmed':
      case 'completed':
        return 'bg-green-100 text-green-800 border border-green-200';
      case 'pending':
      case 'scheduled':
        return 'bg-yellow-100 text-yellow-800 border border-yellow-200';
      case 'cancelled':
      case 'canceled':
        return 'bg-red-100 text-red-800 border border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border border-gray-200';
    }
  }

  // Reset to show all therapists
  showAllTherapists() {
    if (this.therapistList.length > 0) {
      this.filteredTherapists = [...this.therapistList];
      console.log('Showing all therapists:', this.filteredTherapists);
    } else {
      this.loadTherapistList();
    }
  }

  // Add these methods to your existing component

// generateTimeSlotsForSelectedTherapist() {
//   if (!this.selectedTherapist) {
//     console.log("No therapist selected");
//     this.generateDefaultTimeSlots();
//     return;
//   }

//   const selectedDate = this.appointmentForm.get('date')?.value;
//   if (!selectedDate) {
//     console.log("No date selected");
//     this.generateDefaultTimeSlots();
//     return;
//   }

//   const date = new Date(selectedDate);
//   const dayOfWeek = date.getDay(); // 0 = Sunday, 1 = Monday, etc.
  
//   // Find availability for the selected day
//   const dayAvailability = this.selectedTherapist.availability?.find(
//     (avail: any) => avail.dayOfWeek === dayOfWeek
//   );

//   if (!dayAvailability || !dayAvailability.isAvailable) {
//     console.log("Therapist not available on selected day");
//     this.generateDefaultTimeSlots();
//     return;
//   }

//   // Generate time slots based on therapist's working hours
//   const startTime = dayAvailability.startTime; // e.g., "09:00"
//   const endTime = dayAvailability.endTime; // e.g., "17:00"
  
//   console.log(`Generating slots for ${this.selectedTherapist.therapistName}: ${startTime} to ${endTime}`);
//   this.generateTimeSlots(startTime, endTime);
// }

// generateTimeSlots(start: string, end: string) {
//   // Normalize time format - handle both 12-hour and 24-hour formats
//   const normalizeTime = (timeStr: string): string => {
//     if (!timeStr) return '';

//     // If it's already in 24-hour format (HH:MM)
//     if (/^\d{1,2}:\d{2}$/.test(timeStr)) {
//       const [hours, minutes] = timeStr.split(':').map(Number);
//       return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
//     }

//     // If it's in 12-hour format (HH:MM AM/PM)
//     const match = timeStr.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
//     if (match) {
//       let hours = parseInt(match[1]);
//       const minutes = match[2];
//       const period = match[3].toUpperCase();

//       if (period === 'PM' && hours !== 12) hours += 12;
//       if (period === 'AM' && hours === 12) hours = 0;

//       return `${hours.toString().padStart(2, '0')}:${minutes}`;
//     }

//     return timeStr;
//   };

//   const normalizedStart = normalizeTime(start);
//   const normalizedEnd = normalizeTime(end);

//   if (!normalizedStart || !normalizedEnd) {
//     console.error('Invalid time format received');
//     this.generateDefaultTimeSlots();
//     return;
//   }

//   // Convert 24-hour format to 12-hour format for display
//   const convertTo12Hour = (time24: string): string => {
//     const [hours, minutes] = time24.split(':').map(Number);
//     const period = hours >= 12 ? 'PM' : 'AM';
//     const displayHours = hours % 12 || 12;
//     return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
//   };

//   const result: string[] = [];

//   try {
//     const [startHour, startMin] = normalizedStart.split(':').map(Number);
//     const [endHour, endMin] = normalizedEnd.split(':').map(Number);

//     let currentHour = startHour;
//     let currentMin = startMin;

//     // Generate slots until we reach the end time
//     while (currentHour < endHour || (currentHour === endHour && currentMin < endMin)) {
//       const time24 = `${currentHour.toString().padStart(2, '0')}:${currentMin
//         .toString()
//         .padStart(2, '0')}`;
//       const time12 = convertTo12Hour(time24);
//       result.push(time12);

//       // Increment by 30 minutes
//       currentMin += 30;
//       if (currentMin >= 60) {
//         currentMin = 0;
//         currentHour++;
//       }
//     }

//     // Set start times
//     this.availableStartTimes = result;

//     // Auto-select first available time if none selected
//     const currentStartTime = this.appointmentForm.get('startTime')?.value;
//     if (!currentStartTime && result.length > 0) {
//       this.appointmentForm.patchValue({ startTime: result[0] });
//       this.onStartTimeChange();
//     }

//   } catch (error) {
//     console.error('Error generating time slots:', error);
//     this.generateDefaultTimeSlots();
//   }
// }

generateDefaultTimeSlots() {
  // Default business hours: 9 AM to 5 PM
  console.log("Using default business hours");
  this.generateTimeSlots("09:00 AM", "05:00 PM");
}

// Update the existing onDateChange method
onDateChange(): void {
  const selectedDate = this.appointmentForm.get('date')?.value;
  if (selectedDate) {
    // Reset times when date changes
    this.appointmentForm.patchValue({
      startTime: '',
      endTime: ''
    });
    
    // Generate time slots based on therapist's availability for selected date
    this.generateTimeSlotsForSelectedTherapist();
  }
}

// Update the existing onStartTimeChange method
onStartTimeChange() {
  const start = this.appointmentForm.value.startTime;

  if (!start) {
    this.appointmentForm.patchValue({ endTime: '' });
    return;
  }

  const [h, m] = start.split(':').map(Number);
  const d = new Date();
  d.setHours(h, m + 30);

  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');

  this.appointmentForm.patchValue({ endTime: `${hh}:${mm}` });
}



validateSelectedDateTime(startTime: string): void {
  const selectedDate = this.appointmentForm.get('date')?.value;
  if (!selectedDate) return;

  const now = new Date();
  const selectedDateTime = new Date(`${selectedDate}T${this.convertTo24Hour(startTime)}`);
  
  if (selectedDateTime < now) {
    // Clear the form if past time is selected
    this.appointmentForm.patchValue({
      startTime: '',
      endTime: ''
    });
    
    console.warn('Cannot book appointment in the past');
  }
}

selectTherapistSlot(therapist: any, slot: any) {
  this.selectedTherapist = therapist;
  this.selectedSlot = slot;
  this.showAppointmentModal = true;

const slotDate = new Date(slot.date);
const now = new Date();

// Convert both to **numbers** (timestamps) at midnight
const slotTimestamp = slotDate.setHours(0, 0, 0, 0);
const todayTimestamp = new Date().setHours(0, 0, 0, 0);

if (slotTimestamp < todayTimestamp) {
  console.warn('Cannot book past date');
  return;
}


  // Pre-fill form with slot data
  this.appointmentForm.patchValue({
    therapistInput: therapist.therapistId,
    date: slot.date, // YYYY-MM-DD
    startTime: this.formatTime(slot.startTime), // e.g., "09:00 AM"
    endTime: this.calculateEndTime(slot.startTime)
  });

  // Generate accurate time slots for this therapist on this date
  this.generateTimeSlotsForSelectedTherapist();
}

generateTimeSlotsForSelectedTherapist() {
  if (!this.selectedTherapist || !this.selectedSlot) {
    this.availableStartTimes = [];
    return;
  }

  const selectedDateStr = this.appointmentForm.get('date')?.value;
  if (!selectedDateStr) return;

  const selectedDate = new Date(selectedDateStr);
  const dayOfWeek = selectedDate.getDay(); // 0 = Sunday

  const dayAvailability = this.selectedTherapist.availability?.find(
    (avail: any) => avail.dayOfWeek === dayOfWeek && avail.isAvailable
  );

  if (!dayAvailability) {
    this.availableStartTimes = [];
    return;
  }

  const start = dayAvailability.startTime; // "09:00"
  const end = dayAvailability.endTime;     // "17:00"

  this.generateTimeSlots(start, end);
}

// Generate 30-min slots between start and end (24-hour format expected)
generateTimeSlots(start24: string, end24: string) {
  const slots: string[] = [];
  const now = new Date();
  const today = now.toISOString().split('T')[0];
  const selectedDate = this.appointmentForm.get('date')?.value || today;
  const isToday = selectedDate === today;

  let [startHour, startMin] = start24.split(':').map(Number);
  let [endHour, endMin] = end24.split(':').map(Number);

  let currentHour = startHour;
  let currentMin = startMin;

  while (
    currentHour < endHour ||
    (currentHour === endHour && currentMin < endMin)
  ) {
    const time24 = `${currentHour.toString().padStart(2, '0')}:${currentMin
      .toString()
      .padStart(2, '0')}`;
    const time12 = this.formatTime(time24);

    // Disable past times if booking for today
    let disabled = false;
    if (isToday) {
      const slotTime = new Date();
      slotTime.setHours(currentHour, currentMin, 0, 0);
      disabled = slotTime <= now;
    }

    slots.push(time12);

    // Increment by 30 minutes
    currentMin += 30;
    if (currentMin >= 60) {
      currentMin = 0;
      currentHour += 1;
    }
  }

  this.availableStartTimes = slots;
}

// Helper: Calculate end time = start + 30 mins
calculateEndTime(startTime24: string): string {
  const [hourStr, minStr] = startTime24.split(':');
  let hour = parseInt(hourStr, 10);
  let min = parseInt(minStr, 10) + 30;

  if (min >= 60) {
    hour += 1;
    min -= 60;
  }

  const end24 = `${hour.toString().padStart(2, '0')}:${min
    .toString()
    .padStart(2, '0')}`;
  return this.formatTime(end24);
}

formatTime(time: string): string {
  const [hour, minute] = time.split(':');
  let h = parseInt(hour);
  let m = parseInt(minute);

  // If your time includes AM/PM, convert to 24-hour here
  if (time.toLowerCase().includes('pm') && h !== 12) {
    h += 12;
  }
  if (time.toLowerCase().includes('am') && h === 12) {
    h = 0;
  }

  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

}