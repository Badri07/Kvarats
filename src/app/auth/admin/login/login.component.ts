import { Component, ElementRef, ViewChild } from '@angular/core';
import { AbstractControl, FormControl, FormGroup, ValidationErrors, Validators } from '@angular/forms';
import { AuthService } from '../../../service/auth/auth.service';
import { loginModel, LoginResponse } from '../../../models/user-model';
import { Router } from '@angular/router';
import { TosterService } from '../../../service/toaster/tostr.service';
import { PopupService } from '../../../service/popup/popup-service';

export function emailWithComValidator(control: AbstractControl): ValidationErrors | null {
  const email = control.value;
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

  if (!email) return null;

  return emailRegex.test(email) ? null : { invalidComEmail: true };
}

@Component({
  selector: 'app-login',
  standalone: false,
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent {

  
  image:string ='/images/login-logo-removebg-preview.png';
  // image:string ='/images/login.png';
  title:string ="Sign in to your account";
  titleImg:string ='/images/Calendarly Logo.svg';

  loginSubmitted:boolean =false;

  

  public loginForm = new FormGroup({
    usernameOrEmail: new FormControl("",[Validators.required,Validators.email,emailWithComValidator]),
    password:new FormControl("",Validators.required),
  })


  constructor(
    private authservice:AuthService,
    private router:Router,
    private toastr:TosterService,
    private _loader:PopupService
  ){}


  imageList: string[] = [
  '/images/login-logo-removebg-preview.png',
  '/images/Login 2.png',
  '/images/Login 3.png',
  '/images/Login- 5.png'
];

currentIndex = 0;
  intervalId: any;


  @ViewChild('sliderRef') sliderRef!: ElementRef;


  isTransitionEnabled = true;


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

  onloginSubmit() {
  if (this.loginForm.invalid) {
    this.loginSubmitted = true;
    return;
  } else {
    this._loader.show();
    const data: any = {
      usernameOrEmail: this.loginForm.get('usernameOrEmail')?.value,
      password: this.loginForm.get('password')?.value
    };

    this.authservice.logIn(data).subscribe({
      next: (res: any) => {
        // console.log("res",res.message);
         this._loader.hide();
        let getToken = res.data.token;
        const user: any = res.user;
        this.toastr.success(res.message);
        localStorage.setItem('token', getToken!);
        var getUserRole = this.authservice.getUserRole();
        if (getUserRole === 'SuperAdmin' || getUserRole === 'Admin') {
          this.router.navigate(['/admin/dashboard']);
        } else {
          this.router.navigate(['/therapist/dashboard']);
        }
      },
      error: (err) => {
         this._loader.hide();
        if (err.status === 401) {
          const errorMessage = err.error?.message;
          this.toastr.error(errorMessage);
        } else {
          const errorMessage = err.error?.message;
          this.toastr.error(errorMessage);
        }
      }
    });
  }
}


  get loginUser():{[key:string]:AbstractControl}{
    return this.loginForm.controls
  }


  // imageslider

prevImage() {
  this.currentIndex = (this.currentIndex - 1 + this.imageList.length) % this.imageList.length;
}

nextImage() {
  this.currentIndex = (this.currentIndex + 1) % this.imageList.length;
}

showPassword: boolean = false;

togglePasswordVisibility() {
  this.showPassword = !this.showPassword;
}

PasswordValue: any = '';

onPasswordInput(){
  const control = this.loginForm.get('password');
  this.PasswordValue = control?.value || '';
}
}
