import { Component, ElementRef, inject, ViewChild } from '@angular/core';
import { AbstractControl, FormControl, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { TosterService } from '../../../service/toaster/tostr.service';
import { PopupService } from '../../../service/popup/popup-service';
import { AuthService } from '../../../service/auth/auth.service';
import { LoginResponse } from '../../../models/user-model';
import { PatientService } from '../../../service/patient/patients-service';

@Component({
  selector: 'app-patient-login',
  standalone: false,
  templateUrl: './patient-login.component.html',
  styleUrl: './patient-login.component.scss'
})
export class PatientLoginComponent {
 

  isshowupload:boolean =false;
  isTransitionEnabled = true;
  loginSubmitted:boolean =false;


   imageList: string[] = [
  'images/undraw_doctor_aum1.svg',
  '/images/undraw_doctors_djoj.svg',
  '/images/undraw_medical-care_7m9g.svg',
  '/images/undraw_medical-research_pze7.svg'];

  currentIndex = 0;
  intervalId: any; 


  public _patientService = inject(PatientService);
  public router = inject(Router);
  public toastr = inject(TosterService);
  public authservice = inject(AuthService);

  constructor(private _loader:PopupService
  ){

  }
 ngAfterViewInit() {
  setTimeout(() => this.startAutoSlide(),500);
  }  
  startAutoSlide() {
    setInterval(() => {
      this.currentIndex++;
      this.isTransitionEnabled = true;
      if (this.currentIndex === this.imageList.length) {
        this.isTransitionEnabled = true;
        setTimeout(() => {
          this.isTransitionEnabled = false;
          this.currentIndex = 0;
        }, 1000);
      }
    }, 3000);
  }

  public patientsLoginForm = new FormGroup({
    usernameOrEmail: new FormControl("",[Validators.required,Validators.email]),
    password:new FormControl("",Validators.required),
  })

  showInitialPopup = false;
  showPdfUploadPopup = false;


  
userChoice!: string;

openPdfUpload(data:string) {
  debugger
  this.userChoice = data;
}

openAssessmentForm(data:string) {
  debugger
  this.userChoice = data;
}

  closeAll() {
    this.showInitialPopup = false;
    this.isshowupload = false;
  }

  selectedFiles: { name: string; status: string }[] = [];

onFileSelected(event: Event): void {
  debugger
  const input = event.target as HTMLInputElement;
  if (input.files) {
    for (let i = 0; i < input.files.length; i++) {
      const file = input.files[i];
      const allowedTypes = ['application/pdf', 'application/vnd.ms-excel', 'image/jpeg'];
      const isValid = allowedTypes.includes(file.type) && file.size <= 10 * 1024 * 1024;

      this.selectedFiles.push({
        name: file.name,
        status: isValid ? 'Success' : 'Failed',
      });
    }
  }
}

 onloginSubmit() {
  debugger
  if(this.patientsLoginForm.invalid){
    this.loginSubmitted = true;
    return
  }
  else{
 const data: any = {
      usernameOrEmail: this.patientsLoginForm.get('usernameOrEmail')?.value,
      password: this.patientsLoginForm.get('password')?.value
    };

    this._patientService.patientLogIn(data).subscribe({
      next: (res: any) => {
        // console.log("res",res.message);
         this._loader.hide();
        let getToken = res.data.token;
        const user: any = res.user;
        this.toastr.success(res.message);
        localStorage.setItem('tokenPatients', getToken!);
        var getUserRole = this.authservice.getPatientRole();
        if (getUserRole === 'Patient') {
          this.router.navigate(['/patient/dashboard']);
        }
      },
      error: ((err:any) => {
         this._loader.hide();
        if (err.status === 401) {
          const errorMessage = err.error?.message;
          this.toastr.error(errorMessage);
        } else {
          const errorMessage = err.error?.message;
          this.toastr.error(errorMessage);
        }
      })
    });

}
}
  prevImage() {
  this.currentIndex = (this.currentIndex - 1 + this.imageList.length) % this.imageList.length;
}

nextImage() {
  this.currentIndex = (this.currentIndex + 1) % this.imageList.length;
}


get loginUser():{[key:string]:AbstractControl}{
    return this.patientsLoginForm.controls
  }

  showPassword: boolean = false;

togglePasswordVisibility() {
  this.showPassword = !this.showPassword;
}

PasswordValue: any = '';

onPasswordInput(){
  const control = this.patientsLoginForm.get('password');
  this.PasswordValue = control?.value || '';
}
}
