import { Component, ElementRef, inject, ViewChild } from '@angular/core';
import { AbstractControl, FormControl, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { finalize } from 'rxjs';

import { TosterService } from '../../../service/toaster/tostr.service';
import { PopupService } from '../../../service/popup/popup-service';
import { AuthService } from '../../../service/auth/auth.service';
import { PatientService } from '../../../service/patient/patients-service';

@Component({
  selector: 'app-patient-login',
  standalone: false,
  templateUrl: './patient-login.component.html',
  styleUrl: './patient-login.component.scss'
})
export class PatientLoginComponent {

  /* -------------------- FORM -------------------- */
  patientsLoginForm = new FormGroup({
    usernameOrEmail: new FormControl('', [Validators.required, Validators.email]),
    password: new FormControl('', Validators.required)
  });

  loginSubmitted = false;

  /* -------------------- STEP -------------------- */
  step: 'login' | 'emailOtp' = 'login';

  /* -------------------- OTP -------------------- */
  otpDigits: string[] = ['', '', '', '', '', ''];
  otpCode = '';
  tempToken!: string;

  /* -------------------- UI -------------------- */
  showPassword = false;
  PasswordValue = '';

  /* -------------------- SLIDER -------------------- */
  @ViewChild('sliderRef') sliderRef!: ElementRef;

  imageList: string[] = [
    '/images/undraw_doctor_aum1.svg',
    '/images/undraw_doctors_djoj.svg',
    '/images/undraw_medical-care_7m9g.svg',
    '/images/undraw_medical-research_pze7.svg'
  ];

  currentIndex = 0;
  isTransitionEnabled = true;

  /* -------------------- SERVICES -------------------- */
  private router = inject(Router);
  private toastr = inject(TosterService);
  private authservice = inject(AuthService);
  private patientService = inject(PatientService);
  private loader = inject(PopupService);

  /* -------------------- INIT -------------------- */
  ngOnInit(): void {
    this.authservice.setUserType('patient', true);
  }

  ngAfterViewInit(): void {
    setTimeout(() => this.startAutoSlide(), 500);
  }

  startAutoSlide(): void {
    setInterval(() => {
      this.currentIndex++;
      this.isTransitionEnabled = true;

      if (this.currentIndex === this.imageList.length) {
        setTimeout(() => {
          this.isTransitionEnabled = false;
          this.currentIndex = 0;
        }, 1000);
      }
    }, 3000);
  }

  /* -------------------- PASSWORD -------------------- */
  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  onPasswordInput(): void {
    this.PasswordValue = this.patientsLoginForm.get('password')?.value || '';
  }

  /* -------------------- LOGIN (STEP 1) -------------------- */
  onloginSubmit(): void {
    this.loginSubmitted = true;

    if (this.patientsLoginForm.invalid) {
      return;
    }

    this.loader.show();

    const payload = {
      email: this.patientsLoginForm.value.usernameOrEmail,
      password: this.patientsLoginForm.value.password
    };

    this.patientService.PatientslogIn(payload)
      .pipe(finalize(() => this.loader.hide()))
      .subscribe({
        next: (res: any) => {
          if (!res.success) {
            this.toastr.error(res.message || 'Login failed');
            return;
          }

          this.tempToken = res.data.tempToken;
          this.toastr.success('OTP has been sent to your email');
          this.step = 'emailOtp';
        },
        error: (err) => {
          this.toastr.error(err?.error?.message || 'Login failed');
        }
      });
  }

  /* -------------------- OTP INPUT -------------------- */
  handle2FAInput(event: Event, index: number): void {
    const input = event.target as HTMLInputElement;
    const value = input.value;

    if (!/^\d$/.test(value) && value !== '') {
      input.value = '';
      return;
    }

    this.otpDigits[index] = value;
    this.otpCode = this.otpDigits.join('');

    if (value && index < 5) {
      const next = input.parentElement?.querySelectorAll('input')[index + 1] as HTMLInputElement;
      next?.focus();
    }

    if (!value && index > 0) {
      const prev = input.parentElement?.querySelectorAll('input')[index - 1] as HTMLInputElement;
      prev?.focus();
    }
  }

  onOtpKeyDown(event: KeyboardEvent, index: number): void {
    if (event.key === 'Enter') {
      event.preventDefault();
      if (this.otpCode.length === 6) {
        this.verifyOtp();
      }
      return;
    }

    if (
      !/^\d$/.test(event.key) &&
      !['Backspace', 'Delete', 'Tab', 'ArrowLeft', 'ArrowRight'].includes(event.key)
    ) {
      event.preventDefault();
    }
  }

  /* -------------------- VERIFY OTP (STEP 2) -------------------- */
  verifyOtp(): void {
    if (this.otpCode.length !== 6) {
      this.toastr.error('Enter valid OTP');
      return;
    }

    this.loader.show();

    const payload = {
      tempToken: this.tempToken,
      otp: this.otpCode
    };

    this.patientService.Patientsverify2FA(payload)
      .pipe(finalize(() => this.loader.hide()))
      .subscribe({
        next: (res: any) => {
          if (!res.success) {
            this.toastr.error(res.message || 'Invalid OTP');
            return;
          }

          localStorage.setItem('tokenPatients', res.data.token);
          this.toastr.success('Login successful');
          this.router.navigate(['/patient/dashboard']);
        },
        error: (err) => {
          this.toastr.error(err?.error?.message || 'Invalid OTP');
        }
      });
  }

  /* -------------------- RESEND OTP -------------------- */
  resendOtp(): void {
    if (this.patientsLoginForm.invalid) {
      this.toastr.error('Email or password missing');
      return;
    }

    this.loader.show();

    const payload = {
      email: this.patientsLoginForm.value.usernameOrEmail,
      password: this.patientsLoginForm.value.password
    };

    this.patientService.PatientslogIn(payload)
      .pipe(finalize(() => this.loader.hide()))
      .subscribe({
        next: (res: any) => {
          if (!res.success) {
            this.toastr.error(res.message || 'Failed to resend OTP');
            return;
          }

          this.tempToken = res.data.tempToken;
          this.toastr.success('OTP has been resent to your email');
        },
        error: (err) => {
          this.toastr.error(err?.error?.message || 'Failed to resend OTP');
        }
      });
  }

  /* -------------------- CLOSE MODAL -------------------- */
  closeOtpModal(): void {
    this.step = 'login';
    this.otpDigits = ['', '', '', '', '', ''];
    this.otpCode = '';
  }

  /* -------------------- HELPERS -------------------- */
  get loginUser(): { [key: string]: AbstractControl } {
    return this.patientsLoginForm.controls;
  }
}
