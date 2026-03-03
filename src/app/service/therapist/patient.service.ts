import { Injectable, signal } from '@angular/core';
import { Observable, of, delay, throwError, map } from 'rxjs';
import { AppointmentTherapist, AppointmentSlot, AppointmentStatus, AppointmentType, BookingRequest, CancellationRequest, Patient, RescheduleRequest } from '../../models/therapist-interface';

@Injectable({
  providedIn: 'root'
})
export class PatientService {
  private patients = signal<Patient[]>([
    // Lotus Hospital Patients
    {
      id: 'patient-lotus-1',
      firstName: 'John',
      lastName: 'Smith',
      email: 'john.smith@email.com',
      phone: '(555) 123-4567',
      dateOfBirth: new Date(1985, 5, 15),
      clientId: 'client-lotus',
      therapistId: 'therapist-lotus-1',
      status: 'active',
      emergencyContact: {
        name: 'Jane Smith',
        phone: '(555) 987-6543',
        relationship: 'Spouse'
      },
      createdAt: new Date(2024, 0, 15),
      updatedAt: new Date(2024, 0, 15)
    },
    {
      id: 'patient-lotus-2',
      firstName: 'Sarah',
      lastName: 'Johnson',
      email: 'sarah.johnson@email.com',
      phone: '(555) 234-5678',
      dateOfBirth: new Date(1990, 8, 22),
      clientId: 'client-lotus',
      therapistId: 'therapist-lotus-1',
      status: 'active',
      emergencyContact: {
        name: 'Mike Johnson',
        phone: '(555) 876-5432',
        relationship: 'Brother'
      },
      createdAt: new Date(2024, 1, 10),
      updatedAt: new Date(2024, 1, 10)
    },
    // Apollo Hospital Patients
    {
      id: 'patient-apollo-1',
      firstName: 'Michael',
      lastName: 'Brown',
      email: 'michael.brown@email.com',
      phone: '(555) 345-6789',
      dateOfBirth: new Date(1978, 11, 3),
      clientId: 'client-apollo',
      therapistId: 'therapist-apollo-1',
      status: 'active',
      createdAt: new Date(2024, 2, 5),
      updatedAt: new Date(2024, 2, 5)
    },
    // Solo Provider Patients
    {
      id: 'patient-solo-1',
      firstName: 'Emma',
      lastName: 'Davis',
      email: 'emma.davis@email.com',
      phone: '(555) 456-7890',
      dateOfBirth: new Date(1992, 3, 18),
      clientId: 'client-solo-1',
      therapistId: 'solo-provider-1',
      status: 'active',
      createdAt: new Date(2024, 3, 1),
      updatedAt: new Date(2024, 3, 1)
    }
  ]);

  getPatients(): Observable<Patient[]> {
    return of(this.patients()).pipe(delay(300));
  }

  getPatientsByClient(clientId: string): Observable<Patient[]> {
    return of(this.patients().filter(p => p.clientId === clientId)).pipe(delay(300));
  }

  getPatientsByTherapist(therapistId: string, clientId?: string): Observable<Patient[]> {
    let filtered = this.patients().filter(p => p.therapistId === therapistId);
    if (clientId) {
      filtered = filtered.filter(p => p.clientId === clientId);
    }
    return of(filtered).pipe(delay(300));
  }

  getPatientById(id: string): Observable<Patient | undefined> {
    return of(this.patients().find(p => p.id === id)).pipe(delay(300));
  }

  createPatient(patient: Omit<Patient, 'id' | 'createdAt' | 'updatedAt'>): Observable<Patient> {
    const newPatient: Patient = {
      ...patient,
      id: this.generateId(),
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.patients.update(patients => [...patients, newPatient]);
    return of(newPatient).pipe(delay(500));
  }

  updatePatient(id: string, updates: Partial<Patient>): Observable<Patient> {
    const currentPatients = this.patients();
    const index = currentPatients.findIndex(p => p.id === id);
    
    if (index === -1) {
      return throwError(() => new Error('Patient not found'));
    }

    const updatedPatient = {
      ...currentPatients[index],
      ...updates,
      updatedAt: new Date()
    };

    this.patients.update(patients => {
      const newPatients = [...patients];
      newPatients[index] = updatedPatient;
      return newPatients;
    });

    return of(updatedPatient).pipe(delay(500));
  }

  deletePatient(id: string): Observable<boolean> {
    this.patients.update(patients => patients.filter(p => p.id !== id));
    return of(true).pipe(delay(500));
  }

//   private generateId(): string {
//     return Math.random().toString(36).substr(2, 9);
//   }

    private appointments = signal<AppointmentTherapist[]>([
    {
      id: '1',
      clientId: 'client-1',
      therapistId: 'therapist-1',
      startTime: new Date(2025, 0, 15, 10, 0), // Jan 15, 2025, 10:00 AM
      endTime: new Date(2025, 0, 15, 11, 0),
      status: AppointmentStatus.CONFIRMED,
      type: AppointmentType.THERAPY_SESSION,
      title: 'Weekly Therapy Session',
      isRecurring: true,
      reminderSent: false,
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: '2',
      clientId: 'client-2',
      therapistId: 'therapist-1',
      startTime: new Date(2025, 0, 16, 14, 0), // Jan 16, 2025, 2:00 PM
      endTime: new Date(2025, 0, 16, 15, 0),
      status: AppointmentStatus.SCHEDULED,
      type: AppointmentType.INITIAL_CONSULTATION,
      title: 'Initial Consultation',
      isRecurring: false,
      reminderSent: false,
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: '3',
      clientId: 'client-3',
      therapistId: 'therapist-1',
      startTime: new Date(2025, 0, 17, 9, 0), // Jan 17, 2025, 9:00 AM
      endTime: new Date(2025, 0, 17, 10, 0),
      status: AppointmentStatus.COMPLETED,
      type: AppointmentType.FOLLOW_UP,
      title: 'Follow-up Session',
      isRecurring: false,
      reminderSent: true,
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ]);

  getAppointments(): Observable<AppointmentTherapist[]> {
    return of(this.appointments()).pipe(delay(300));
  }

  getAppointmentsByClient(clientId: string): Observable<AppointmentTherapist[]> {
    return of(this.appointments().filter(apt => apt.clientId === clientId)).pipe(delay(300));
  }

  getAppointmentsByTherapist(therapistId: string): Observable<AppointmentTherapist[]> {
    return of(this.appointments().filter(apt => apt.therapistId === therapistId)).pipe(delay(300));
  }

  getAppointmentsByDateRange(startDate: Date, endDate: Date): Observable<AppointmentTherapist[]> {
    return of(this.appointments().filter(apt => 
      apt.startTime >= startDate && apt.startTime <= endDate
    )).pipe(delay(300));
  }

  getAppointmentById(id: string): Observable<AppointmentTherapist | undefined> {
    return of(this.appointments().find(apt => apt.id === id)).pipe(delay(300));
  }

  createAppointment(appointment: Omit<AppointmentTherapist, 'id' | 'createdAt' | 'updatedAt'>): Observable<AppointmentTherapist> {
    const newAppointment: AppointmentTherapist = {
      ...appointment,
      id: this.generateId(),
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.appointments.update(appointments => [...appointments, newAppointment]);
    return of(newAppointment).pipe(delay(500));
  }

  updateAppointment(id: string, updates: Partial<AppointmentTherapist>): Observable<AppointmentTherapist> {
    const currentAppointments = this.appointments();
    const index = currentAppointments.findIndex(apt => apt.id === id);
    
    if (index === -1) {
      throw new Error('Appointment not found');
    }

    const updatedAppointment = {
      ...currentAppointments[index],
      ...updates,
      updatedAt: new Date()
    };

    this.appointments.update(appointments => {
      const newAppointments = [...appointments];
      newAppointments[index] = updatedAppointment;
      return newAppointments;
    });

    return of(updatedAppointment).pipe(delay(500));
  }

  deleteAppointment(id: string): Observable<boolean> {
    this.appointments.update(appointments => 
      appointments.filter(apt => apt.id !== id)
    );
    return of(true).pipe(delay(500));
  }

  bookAppointment(request: BookingRequest): Observable<AppointmentTherapist> {
    const appointment: Omit<AppointmentTherapist, 'id' | 'createdAt' | 'updatedAt'> = {
      clientId: request.clientId,
      therapistId: request.therapistId,
      startTime: request.preferredDate,
      endTime: new Date(request.preferredDate.getTime() + request.duration * 60000),
      status: AppointmentStatus.SCHEDULED,
      type: request.appointmentType,
      title: this.getAppointmentTitle(request.appointmentType),
      notes: request.notes,
      isRecurring: false,
      reminderSent: false
    };

    return this.createAppointment(appointment);
  }

  rescheduleAppointment(request: RescheduleRequest): Observable<AppointmentTherapist> {
    return this.updateAppointment(request.appointmentId, {
      startTime: request.newStartTime,
      endTime: request.newEndTime,
      status: AppointmentStatus.RESCHEDULED,
      notes: `Rescheduled: ${request.reason}`
    });
  }

  cancelAppointment(request: CancellationRequest): Observable<AppointmentTherapist> {
    return this.updateAppointment(request.appointmentId, {
      status: AppointmentStatus.CANCELLED,
      cancelledAt: new Date(),
      cancellationReason: request.reason
    });
  }

  getAvailableSlots(therapistId: string, date: Date, duration: number = 60): Observable<AppointmentSlot[]> {
    // Mock available slots - in real app, this would check therapist availability
    const slots: AppointmentSlot[] = [];
    const startHour = 9;
    const endHour = 17;
    
    for (let hour = startHour; hour < endHour; hour++) {
      const slotStart = new Date(date);
      slotStart.setHours(hour, 0, 0, 0);
      
      const slotEnd = new Date(slotStart);
      slotEnd.setMinutes(slotEnd.getMinutes() + duration);
      
      // Check if slot conflicts with existing appointments
      const hasConflict = this.appointments().some(apt => 
        apt.therapistId === therapistId &&
        apt.status !== AppointmentStatus.CANCELLED &&
        ((slotStart >= apt.startTime && slotStart < apt.endTime) ||
         (slotEnd > apt.startTime && slotEnd <= apt.endTime))
      );

      slots.push({
        id: this.generateId(),
        startTime: slotStart,
        endTime: slotEnd,
        start: slotStart,
        end: slotEnd,
        available: !hasConflict,
        therapistId
      });
    }

    return of(slots).pipe(delay(300));
  }

  sendReminder(appointmentId: string): Observable<boolean> {
    return this.updateAppointment(appointmentId, { reminderSent: true })
      .pipe(map(() => true));
  }

  markNoShow(appointmentId: string, reason?: string): Observable<AppointmentTherapist> {
    return this.updateAppointment(appointmentId, {
      status: AppointmentStatus.NO_SHOW,
      noShowReason: reason
    });
  }

  completeAppointment(appointmentId: string): Observable<AppointmentTherapist> {
    return this.updateAppointment(appointmentId, {
      status: AppointmentStatus.COMPLETED
    });
  }

  private generateId(): string {
    return Math.random().toString(36).substr(2, 9);
  }

  private getAppointmentTitle(type: AppointmentType): string {
    const titles = {
      [AppointmentType.INITIAL_CONSULTATION]: 'Initial Consultation',
      [AppointmentType.THERAPY_SESSION]: 'Therapy Session',
      [AppointmentType.FOLLOW_UP]: 'Follow-up Session',
      [AppointmentType.GROUP_SESSION]: 'Group Session',
      [AppointmentType.ASSESSMENT]: 'Assessment',
      [AppointmentType.TELEHEALTH]: 'Telehealth Session',
      [AppointmentType.EMERGENCY]: 'Emergency Session'
    };
    return titles[type] || 'Appointment';
  }
}