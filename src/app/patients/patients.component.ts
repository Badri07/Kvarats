import { Component, HostListener, inject } from '@angular/core';
import { AuthService } from '../service/auth/auth.service';
import { PatientService } from '../service/patient/patients-service';

@Component({
  selector: 'app-patients',
  standalone: false,
  templateUrl: './patients.component.html',
  styleUrl: './patients.component.scss'
})
export class PatientsComponent {

  menuOpen: boolean = false;

  public patientService = inject(PatientService);
  public authService = inject(AuthService);

  logo: string = '/images/LogoLatest.png';

  public authservice = inject(AuthService);

  ngOnInit(): void {
    this.getUserDetails();
  }

  toggleMenu(event: Event) {
    event.stopPropagation();
    this.menuOpen = !this.menuOpen;
  }

  logout() {
    this.menuOpen = false;
    this.authservice.Patientslogout();
  }

  @HostListener('document:click', ['$event'])
  onClickOutside(event: Event) {
    this.menuOpen = false;
  }

  userName!: string;
  email!: string;

  getUserDetails() {
    this.userName = this.authService.getPatientUsername();
    this.email = this.authService.getPatientEmail();
  }

  getUserInitials(): string {
    if (!this.userName) return 'US';

    const names = this.userName.split(' ');
    if (names.length >= 2) {
      return (names[0].charAt(0) + names[1].charAt(0)).toUpperCase();
    } else if (this.userName.length >= 2) {
      return this.userName.substring(0, 2).toUpperCase();
    }
    return 'US';
  }
}