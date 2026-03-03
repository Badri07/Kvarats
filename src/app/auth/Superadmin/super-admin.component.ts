import { Component, ElementRef, ViewChild } from '@angular/core';
import { AbstractControl, FormControl, FormGroup, ValidationErrors, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { finalize } from 'rxjs';

import { AuthService } from '../../service/auth/auth.service';
import { TosterService } from '../../service/toaster/tostr.service';
import { PopupService } from '../../service/popup/popup-service';

/* -------------------- EMAIL VALIDATOR -------------------- */
export function emailWithComValidator(control: AbstractControl): ValidationErrors | null {
  const email = control.value;
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  if (!email) return null;
  return emailRegex.test(email) ? null : { invalidComEmail: true };
}

@Component({
  selector: 'app-super-admin',
  standalone: false,
  templateUrl: './super-admin.component.html',
  styleUrl: './super-admin.component.scss'
})
export class SuperAdminComponent {

  /* -------------------- FORM -------------------- */
  loginForm = new FormGroup({
    usernameOrEmail: new FormControl('', [
      Validators.required,
      Validators.email,
      emailWithComValidator
    ]),
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

  imageList = [
    '/images/Login 2.png',
    '/images/Login 3.png',
    '/images/Login- 5.png'
  ];

  currentIndex = 0;
  isTransitionEnabled = true;

  constructor(
    private authService: AuthService,
    private router: Router,
    private toastr: TosterService,
    private loader: PopupService
  ) {}

  /* -------------------- INIT -------------------- */
  ngOnInit(): void {
    this.authService.setUserType('superAdmin', true);
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
    this.PasswordValue = this.loginForm.get('password')?.value || '';
  }

  /* -------------------- LOGIN (STEP 1) -------------------- */
  onloginSubmit(): void {
    this.loginSubmitted = true;

    if (this.loginForm.invalid) {
      return;
    }

    this.loader.show();

    const payload = {
      email: this.loginForm.value.usernameOrEmail,
      password: this.loginForm.value.password
    };

    this.authService.SuperAdminlogIn(payload)
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

    this.authService.SuperAdminverify2FA(payload)
      .pipe(finalize(() => this.loader.hide()))
      .subscribe({
        next: (res: any) => {
          if (!res.success) {
            this.toastr.error(res.message || 'Invalid OTP');
            return;
          }

          localStorage.setItem('token', res.data.token);
          this.authService.setUserType('superAdmin', true);
          this.toastr.success('Login successful');
          this.router.navigate(['/dashboard']);
        },
        error: (err) => {
          this.toastr.error(err?.error?.message || 'Invalid OTP');
        }
      });
  }

  /* -------------------- RESEND OTP -------------------- */
  resendOtp(): void {
    if (this.loginForm.invalid) {
      this.toastr.error('Email or password missing');
      return;
    }

    this.loader.show();

    const payload = {
      email: this.loginForm.value.usernameOrEmail,
      password: this.loginForm.value.password
    };

    this.authService.SuperAdminlogIn(payload)
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
    return this.loginForm.controls;
  }
}
