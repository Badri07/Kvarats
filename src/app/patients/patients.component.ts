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

  logo:string ='/images/LogoLatest.png';

   public authservice = inject(AuthService);


    ngOnInit(): void {
    this.getUserDetails();
  }

toggleMenu(event: Event) {
  event.stopPropagation();
  this.menuOpen = !this.menuOpen;
}

goToProfile() {
  this.menuOpen = false;
  // this.router.navigate(['/profile']);
}

goToSettings() {
  this.menuOpen = false;
  // this.router.navigate(['/settings']);
}

logout(){
    this.authservice.Patientslogout();
  }

@HostListener('document:click', ['$event'])
onClickOutside(event: Event) {
  this.menuOpen = false;
}


userName!:string;
email!:string;
getUserDetails(){
  debugger
  this.userName = this.authService.getPatientUsername();
  this.email = this.authService.getPatientEmail();
}
}
