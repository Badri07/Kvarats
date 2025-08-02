import { Injectable } from "@angular/core";
import { BehaviorSubject, Subject } from "rxjs";

export interface AppointmentDefaults {
  therapistId: string;
  date: Date;
  startTime: string;
  endTime: string;
}

@Injectable({
  providedIn: 'root'
})
export class PopupService {

  showPopup$ = new Subject<void>();
  closePopup$ = new Subject<void>();

  private loaderSubject = new BehaviorSubject<boolean>(false);
  public loaderState$ = this.loaderSubject.asObservable();

  private appointmentDefaultsSubject = new BehaviorSubject<AppointmentDefaults | null>(null);
  appointmentDefaults$ = this.appointmentDefaultsSubject.asObservable(); // ✅ Expose as observable

  show() {
    this.loaderSubject.next(true);
  }

  hide() {
    this.loaderSubject.next(false);
  }

  // ✅ Setter for default values when clicking on slot
  setAppointmentDefaults(defaults: AppointmentDefaults | null): void {
    this.appointmentDefaultsSubject.next(defaults);
  }
}
