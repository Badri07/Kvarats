import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CalendarHeaderComponent } from '../calendar-header/calendar-header.component';
import { DayViewComponent } from '../day-view/day-view.component';
import { WeekViewComponent } from '../week-view/week-view.component';
import { AppointmentModalComponent } from '../appointment-modal/appointment-modal.component';
import { AppointmentSidebarComponent } from '../appointment-sidebar/appointment-sidebar.component';
import { CalendarEvent, AvailabilityDto,CalendarView,Appointment,Patient,Diagnosis,ServiceItem,CreateAppointmentRequest } from '../../../../models/CalendarEvent.model';
import { DateUtils } from '../../../../models/utlis/date.utlis';
import { AuthService } from '../../../../service/auth/auth.service';
import { TherapistAppointmentService } from '../../../../service/scheduler/Appointment.service';

@Component({
  selector: 'app-therapistcalendar',
  standalone: false,
  templateUrl: './calendar.component.html',
  styleUrl: './calendar.component.scss'
})
export class CalendarComponent implements OnInit {
  currentDate = new Date();
  view: CalendarView = 'week';
  appointments: Appointment[] = [];
  selectedAppointment: CalendarEvent | null = null;
  isModalOpen = false;
  editingAppointment: CalendarEvent | null = null;
  initialDate?: Date;
  initialHour?: number;
  patients: Patient[] = [];
  diagnoses: Diagnosis[] = [];
  services: ServiceItem[] = [];
  loading = false;

  constructor(
    private appointmentService: TherapistAppointmentService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.loadInitialData();
  }

  get calendarEvents(): CalendarEvent[] {
    return this.appointments.map((apt) => {
      const startDate = DateUtils.timeStringToDate(apt.date, apt.startTime);
      const endDate = DateUtils.timeStringToDate(apt.date, apt.endTime);
      const duration = Math.round((endDate.getTime() - startDate.getTime()) / (1000 * 60));

      return {
        ...apt,
        startDate,
        endDate,
        duration,
      };
    });
  }

  loadInitialData(): void {
    this.loading = true;
    const clientId = this.authService.getClientId();

    if (!clientId) {
      // console.error('No client ID found');
      this.loading = false;
      return;
    }

    Promise.all([
      this.appointmentService.getMyAppointments().toPromise(),
      this.appointmentService.getMyPatientsList().toPromise(),
      this.appointmentService.getClientServices(clientId).toPromise(),
    ])
      .then(([appointmentsData, patientsData, servicesData]) => {
        this.appointments = appointmentsData || [];
        this.patients = patientsData || [];
        this.services = servicesData || [];
        this.loading = false;
      })
      .catch((error) => {
        // console.error('Failed to load initial data:', error);
        this.loading = false;
      });
  }

  loadAppointments(): void {
    this.appointmentService.getMyAppointments().subscribe({
      next: (data) => {
        this.appointments = data;
      },
      error: (error) => {
        // console.error('Failed to load appointments:', error);
      },
    });
  }

  handlePatientChange(patientId: string): void {
    if (!patientId) {
      this.diagnoses = [];
      return;
    }

    this.appointmentService.getPatientDiagnoses(patientId).subscribe({
      next: (data:any) => {
        this.diagnoses = data;
      },
      error: (error) => {
        // console.error('Failed to load patient diagnoses:', error);
        this.diagnoses = [];
      },
    });
  }

  handleTodayClick(): void {
    this.currentDate = new Date();
  }

  handleEventClick(event: CalendarEvent): void {
    this.selectedAppointment = event;
  }

  handleTimeSlotClick(data: { date: Date; hour: number }): void {
    this.initialDate = data.date;
    this.initialHour = data.hour;
    this.editingAppointment = null;
    this.isModalOpen = true;
  }

  handleNewAppointment(): void {
    this.initialDate = new Date();
    this.initialHour = 9;
    this.editingAppointment = null;
    this.isModalOpen = true;
  }

  handleEditAppointment(appointment: CalendarEvent): void {
    this.editingAppointment = appointment;
    this.initialDate = undefined;
    this.initialHour = undefined;
    this.isModalOpen = true;
  }

  handleSaveAppointment(data: CreateAppointmentRequest): void {
    if (this.editingAppointment) {
      this.appointmentService.updateAppointment(this.editingAppointment.id, data).subscribe({
        next: () => {
          this.loadAppointments();
          this.isModalOpen = false;
          this.editingAppointment = null;
        },
        error: (error) => {
          // console.error('Failed to save appointment:', error);
        },
      });
    } else {
      this.appointmentService.createAppointment(data).subscribe({
        next: () => {
          this.loadAppointments();
          this.isModalOpen = false;
        },
        error: (error) => {
          // console.error('Failed to save appointment:', error);
        },
      });
    }
  }

  handleDeleteAppointment(id: string): void {
    this.appointmentService.deleteAppointment(id).subscribe({
      next: () => {
        this.loadAppointments();
        this.selectedAppointment = null;
      },
      error: (error) => {
        // console.error('Failed to delete appointment:', error);
      },
    });
  }

  handleCloseModal(): void {
    this.isModalOpen = false;
    this.editingAppointment = null;
    this.initialDate = undefined;
    this.initialHour = undefined;
    this.diagnoses = [];
  }

  handleCloseSidebar(): void {
    this.selectedAppointment = null;
  }

  handleEditFromSidebar(appointment: CalendarEvent): void {
    this.selectedAppointment = null;
    this.handleEditAppointment(appointment);
  }
}
