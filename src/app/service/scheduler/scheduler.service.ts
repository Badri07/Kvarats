import { Injectable } from '@angular/core';
import { BehaviorSubject, catchError, map, Observable, of, shareReplay, Subject, throwError } from 'rxjs';
import { User, TimeSlot, Appointment } from '../../models/scheduler.interface';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { environment } from '../../../environments/environments';
import { Slot } from '../../models/scheduler';

@Injectable({ providedIn: 'root' })
export class SchedulerService {

  private usersSubject = new BehaviorSubject<User[]>([]);
  users$ = this.usersSubject.asObservable();

  appointments$: Observable<Appointment[]> = this.users$.pipe(
    map((users) =>
      users
        .map((user) => user.appointments || [])
        .reduce((all, appts) => all.concat(appts), [])
    )
  );

  selectedDate = new Date();

  constructor(private http: HttpClient) {
   // this.loadUsers(this.selectedDate);
  }

  getExistingList(date: Date): Observable<User[]> {

    const dateString = date.getFullYear() + '-' +
                   (date.getMonth() + 1).toString().padStart(2, '0') + '-' +
                   date.getDate().toString().padStart(2, '0');

    return this.http
      .get(`${environment.apidev}/Appointment/GetSchedulerUsersByDate?date=${dateString}`)
      .pipe(
        map((response: any) => response?.data || response),
        catchError((error) => throwError(() => error))
      );
  }

  getCheckUserAvailability(data:Slot){
     return this.http.post(`${environment.apidev}/Appointment/CheckUserAvailabilityForSlot`,data).pipe(
      map((response: any) => {
        return response?.data || response;
      }),
      catchError(error => {
        console.error('Error during sign in:', error);
        return throwError(() => error);
      })
    )
  }
  loadUsers(date: Date): void {
  this.getExistingList(date).subscribe(
    (users) => this.usersSubject.next(users),
    (error) => console.error('Error', error)
  );
}

  getUsers(): Observable<User[]> {
    return this.users$;
  }


  getAppointments(): Observable<Appointment[]> {
    return this.appointments$;
  }

  generateTimeSlots(): TimeSlot[] {
  const slots: any[] = [];

  for (let hour = 0; hour < 24; hour++) {
    for (let minute = 0; minute < 60; minute += 30) {
      const time24 = `${hour.toString().padStart(2, '0')}:${minute
        .toString()
        .padStart(2, '0')}`;

      const hour12 = hour % 12 === 0 ? 12 : hour % 12;
      const ampm = hour < 12 ? 'AM' : 'PM';
      const time12 = `${hour12}:${minute.toString().padStart(2, '0')} ${ampm}`;

      slots.push({ id: `${hour}-${minute}`, time: time12, hour, minute });
    }
  }

  return slots;
}


private handleError = (error: any): Observable<User[]> => {
    console.error('An error occurred:', error);
    return of([]);
  };

  getSchedulerUsersByDate(date: string): Observable<User[]> {
    if (!date) {
      // Defensive fallback (optional)
      console.warn(
        'SchedulerService: date is empty or null, skipping request.'
      );
      return of([]); // Return empty observable array
    }

    const params = new HttpParams().set('date', date);

    return this.http
      .get<User[]>(`${environment.apidev}/Appointment/GetSchedulerUsersByDate`, {

        params,
      })
      .pipe(
        map((users) => users || []), // Always return an array
        catchError(this.handleError), // Graceful error handling
        shareReplay(1) // Cache response
      );
  }

  getDropdownsByCategory(category: string): Observable<any[]> {
  if (!category) {
    console.warn('SchedulerService: category is empty or null, skipping request.');
    return of([]);
  }

  const params = new HttpParams().set('category', category);

  return this.http
    .get<any[]>(`${environment.apidev}/Dropdowns/GetDropdowns`, {
      params,
    })
    .pipe(
      map((items) => items || []),
      catchError((error) => {
        console.error('Dropdown fetch error:', error);
        return of([]);
      }),
      shareReplay(1)
    );
}

  getAllPatientsList(): Observable<any[]> {
  return this.http
    .get<any[]>(`${environment.apidev}/Patients/GetAllPatientsList`, {
    })
    .pipe(
      map((patients) => patients || []),
      catchError((error) => {
        console.error('Patient list fetch error:', error);
        return of([]);
      }),
      shareReplay(1)
    );
}






//subject 

 private availabilityStatusSubject = new Subject<any>();

  availabilityStatus$ = this.availabilityStatusSubject.asObservable();

  setAvailabilityStatus(data: any) {
    this.availabilityStatusSubject.next(data);
  }


  private therapistListSubject = new BehaviorSubject<User[]>([]);
  therapistList$ = this.therapistListSubject.asObservable();

  setTherapistList(list: User[]) {
    this.therapistListSubject.next(list);
  }
}
