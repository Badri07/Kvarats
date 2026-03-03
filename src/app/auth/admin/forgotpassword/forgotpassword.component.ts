import { Component, ElementRef, inject, ViewChild, ViewChildren, QueryList } from '@angular/core';
import { AbstractControl, FormArray, FormBuilder, FormControl, FormGroup, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import { AuthService } from '../../../service/auth/auth.service';
import { Router } from '@angular/router';
import { TosterService } from '../../../service/toaster/tostr.service';
import { forgotpasswordModel, loginModel, LoginResponse, registerModel } from '../../../models/user-model';
import { PopupService } from '../../../service/popup/popup-service';

export function strongPasswordValidator(): ValidatorFn {
  return (control: AbstractControl) => {
    const value = control.value || '';
    const hasUpperCase = /[A-Z]/.test(value);
    const hasLowerCase = /[a-z]/.test(value);
    const hasNumber = /[0-9]/.test(value);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(value);
    const minLength = value.length >= 8;

    const valid = hasUpperCase && hasLowerCase && hasNumber && hasSpecialChar && minLength;

    return valid
      ? null
      : {
          strongPassword: {
            hasUpperCase,
            hasLowerCase,
            hasNumber,
            hasSpecialChar,
            minLength,
          },
        };
  };
}

export const passwordMatchValidator: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
  const password = control.get('adminPassword')?.value;
  const confirmPassword = control.get('confirmPassword')?.value;

  if (password && confirmPassword && password !== confirmPassword) {
    return { passwordMismatch: true };
  }
  return null;
};

export const strictEmailValidator: ValidatorFn = (
  control: AbstractControl
): ValidationErrors | null => {
  const value = control.value;
  if (!value) return null;

  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9-]+\.[a-zA-Z]{2,}$/;
  return emailRegex.test(value) ? null : { invalidEmail: true };
};


@Component({
  selector: 'app-forgotpassword',
  standalone: false,
  templateUrl: './forgotpassword.component.html',
  styleUrl: './forgotpassword.component.scss'
})
export class ForgotpasswordComponent {
  // image:string ='/images/login.png';
  image:string ='/images/login-logo-removebg-preview.png';

  title:string ="Forgot password";

  registerSubmitted:boolean = false;
  passError!:boolean;
  isshowotpSection:boolean = false;
  isshowForm:boolean = true;

  isshowonextForm:boolean = false;
  showPasswordPopup:boolean = false;

  public useremail!:string | null | undefined;
  public otp!:string;
  public newPassword!:string;

  public registerForm = new FormGroup({
    email: new FormControl("", [
    Validators.required,
    strictEmailValidator
  ]),
    otp: new FormArray(Array.from({ length: 6 }, () => new FormControl('')))
  })

  public registerNextForm = new FormGroup({
    adminPassword: new FormControl("", [
      Validators.required,
      strongPasswordValidator()
    ]),
    confirmPassword: new FormControl("", Validators.required)
  }, {
    validators: passwordMatchValidator
  })

  @ViewChildren('otpInput') otpInputs!: QueryList<ElementRef<HTMLInputElement>>;

  constructor(
    private fb:FormBuilder,
    private authservice:AuthService,
    private toastr:TosterService,
    private router:Router,
  ){}

  imageList: string[] = [
    '/images/Login 2.png',
    '/images/Login 3.png',
    '/images/Login- 5.png'
  ];

  currentIndex = 0;
  intervalId: any;

  @ViewChild('sliderRef') sliderRef!: ElementRef;

  public userType!: any;
  isTransitionEnabled = true;
  showOtpError = false;

ngOnInit(){
  this.registerForm.valueChanges.subscribe(() => {
    this.registerForm.updateValueAndValidity({ emitEvent: false });
  });
  
  this.userType = this.authservice.getUserType();
  
  if (!this.userType) {
    this.userType = this.determineUserTypeFromContext();
  if (this.userType) {
      this.authservice.setUserType(this.userType, false);
    }
  }
}



private determineUserTypeFromContext(): string {
  const currentUrl = window.location.href;
  const currentPath = window.location.pathname;
  
  console.log('Current URL:', currentUrl);
  console.log('Current Path:', currentPath);
  if (currentUrl.includes('/superAdmin') || currentPath.includes('/superAdmin')) {
    return 'superAdmin';
  }
  else if (currentUrl.includes('/patient') || currentPath.includes('/patient')) {
    return 'patient';
  }
  else if (document.referrer) {
    if (document.referrer.includes('/superAdmin')) {
      return 'superAdmin';
    } else if (document.referrer.includes('/patient')) {
      return 'patient';
    }
  }
    return 'user';
}

  passwordsMatchValidator(group: AbstractControl): { [key: string]: any } | null {
    const password = group.get('adminPassword')?.value;
    const confirmPassword = group.get('confirmPassword')?.value;

    return password === confirmPassword ? null : { passwordMismatch: true };
  }

  strongPasswordValidator(control: AbstractControl): ValidationErrors | null {
    const value = control.value || '';

    const hasUpperCase = /[A-Z]/.test(value);
    const hasLowerCase = /[a-z]/.test(value);
    const hasNumber = /[0-9]/.test(value);
    const hasSpecialChar = /[^A-Za-z0-9]/.test(value);
    const minLength = value.length >= 8;

    if (value === '') return null;

    return {
      strongPassword: {
        hasUpperCase,
        hasLowerCase,
        hasNumber,
        hasSpecialChar,
        minLength,
      },
    };
  }

  get passwordValid() {
    const errors = this.registerNextForm.get('adminPassword')?.errors?.['strongPassword'] || {};
    return {
      hasUpperCase: errors.hasUpperCase === false,
      hasLowerCase: errors.hasLowerCase === false,
      hasNumber: errors.hasNumber === false,
      hasSpecialChar: errors.hasSpecialChar === false,
      minLength: errors.minLength === false,
    };
  }

  get showPasswordCriteria(): boolean {
    const control = this.registerNextForm.get('adminPassword');
    const errors = control?.errors?.['strongPassword'];

    const isTouched = control?.touched ?? false;
    const isDirty = control?.dirty ?? false;

    return (isTouched || isDirty) && !!errors;
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

  onRegisterSubmit(){
    if(this.registerForm.invalid){
      this.registerSubmitted = true
      return
    }
  }

  get registerNextFormUser():{[key:string]:AbstractControl}{
    return this.registerNextForm.controls
  }

  get registerUser():{[key:string]:AbstractControl}{
    return this.registerForm.controls
  }

  isPasswordMismatch() {
    const password = this.registerNextForm.get('password')?.value;
    const confirmPassword = this.registerNextForm.get('confirmPassword')?.value;
    if(password !== confirmPassword){
      this.passError = true
    }else{
      this.passError = false
    }
  }

  public _loader = inject(PopupService);

onSignin() {
  console.log("Form Valid:", this.registerForm.valid);
  console.log("Form Value:", this.registerForm.value);
  this._loader.show();
  
  if (this.registerForm.valid) {
    this.isPasswordMismatch();
    this._loader.hide();
    
    const data: forgotpasswordModel = {
      email: this.registerForm.get('email')?.value,
    };

    console.log("Request Data:", data);
    this.useremail = this.registerForm.get('email')?.value;
    
    // Ensure userType is set
    this.userType = this.authservice.getUserType() || this.determineUserTypeFromContext();
    
    this.authservice.forgotPassword(data, this.userType).subscribe({
      next: (res: any) => {
        if (res) {
          this.toastr.success(res.message);
          this._loader.hide();
          this.isshowForm = false;
          this.isshowotpSection = true;
          setTimeout(() => {
            this.focusOtpInput(0);
          }, 100);
        } else {
          this._loader.hide();
          this.toastr.error(res.message);
        }
      },
      error: (err) => {
        const errorMessage = err.error?.message;
        this._loader.hide();
        this.toastr.error(errorMessage);
      }
    });
  } else {
    this._loader.hide();
    this.registerSubmitted = true;
    return;
  }
}


resendMail() {
  this._loader.show();
  const payload: any = {
    email: this.useremail
  };

  // Ensure userType is set
  this.userType = this.authservice.getUserType() || this.determineUserTypeFromContext();

  this.authservice.forgotPassword(payload, this.userType).subscribe({
    next: (res: any) => {
      if (res) {
        this._loader.hide();
        this.toastr.success(res.message);
        this.isshowForm = false;
        this.isshowotpSection = true;
      } else {
        this.toastr.error(res.message);
      }
    },
    error: (err) => {
      this._loader.hide();
      const errorMessage = err.error?.message;
      this.toastr.error(errorMessage);
    }
  });
}


  // FIXED OTP METHODS
  isVerify() {
    const otpValue = this.getOtpValue();
    
    if (otpValue.length === 6) {
      this.showOtpError = false;
      console.log('OTP:', otpValue);
      // Proceed with OTP verification
      this.verifyOtpWithBackend(otpValue);
    } else {
      this.showOtpError = true;
      this.toastr.warning('Please enter complete 6-digit OTP');
    }
  }

verifyOtpWithBackend(otp: string) {
  
  this._loader.show();
  const payload = {
    email: this.useremail,
    otp: otp
  };
  
  this.userType = this.authservice.getUserType() || this.determineUserTypeFromContext();
  
  this.authservice.verifyPassword(payload, this.userType).subscribe({
    next: (res: any) => {
      this._loader.hide();
      if (res) {
        this.toastr.success(res.data || 'OTP verified successfully');
        this.isshowotpSection = false;
        this.isshowonextForm = true;
      }
    },
    error: (err) => {
      this._loader.hide();
      const errorMessage = err.error?.message || 'OTP verification failed';
      this.toastr.error(errorMessage);
    }
  });
}

  get otpControls() {
    return this.registerForm.get('otp') as FormArray;
  }

  getOtpValue(): string {
    return this.otpControls.controls.map(control => control.value).join('');
  }

  // FIXED OTP Navigation
  onOtpInput(event: Event, index: number) {
    const input = event.target as HTMLInputElement;
    let value = input.value;

    // Only allow numbers
    if (value && !/^\d+$/.test(value)) {
      input.value = '';
      value = '';
      return;
    }

    // Update form control
    this.otpControls.at(index).setValue(value);

    // Auto-advance to next input
    if (value && index < 5) {
      this.focusOtpInput(index + 1);
    }

    // Auto-submit when all fields are filled
    if (this.getOtpValue().length === 6) {
      this.isVerify();
    }

    this.showOtpError = false;
  }

  onOtpKeyDown(event: KeyboardEvent, index: number) {
    const input = event.target as HTMLInputElement;

    // Handle backspace
    if (event.key === 'Backspace') {
      if (!input.value && index > 0) {
        // Clear current and move to previous
        this.otpControls.at(index).setValue('');
        this.focusOtpInput(index - 1);
      } else if (input.value) {
        // Clear current but stay
        this.otpControls.at(index).setValue('');
        input.value = '';
      }
      event.preventDefault();
    }

    // Handle arrow keys
    if (event.key === 'ArrowLeft' && index > 0) {
      this.focusOtpInput(index - 1);
      event.preventDefault();
    }

    if (event.key === 'ArrowRight' && index < 5) {
      this.focusOtpInput(index + 1);
      event.preventDefault();
    }

    // Allow only numbers and control keys
    const allowedKeys = ['Backspace', 'Delete', 'Tab', 'Escape', 'Enter', 'ArrowLeft', 'ArrowRight', 'Home', 'End'];
    if (!/^\d$/.test(event.key) && !allowedKeys.includes(event.key)) {
      event.preventDefault();
    }
  }

  onOtpPaste(event: ClipboardEvent) {
    event.preventDefault();
    const clipboardData = event.clipboardData;
    const pastedText = clipboardData?.getData('text').trim();

    if (pastedText && /^\d+$/.test(pastedText)) {
      const digits = pastedText.split('').slice(0, 6);
      
      digits.forEach((digit, index) => {
        if (index < 6) {
          this.otpControls.at(index).setValue(digit);
        }
      });

      // Focus appropriate input
      if (digits.length === 6) {
        this.focusOtpInput(5); // Focus last input
      } else if (digits.length > 0) {
        this.focusOtpInput(digits.length); // Focus next empty input
      }
    }
  }

  focusOtpInput(index: number) {
    if (this.otpInputs && this.otpInputs.toArray()[index]) {
      const input = this.otpInputs.toArray()[index].nativeElement;
      input.focus();
      input.select();
    }
  }

  onOtpFocus(event: Event) {
    const input = event.target as HTMLInputElement;
    input.select();
  }

 updatePassword() {
  this._loader.show();
  this.registerSubmitted = true;
 
  if (this.registerNextForm.valid && !this.registerNextForm.errors?.['passwordMismatch']) {
    const payload = {
      email: this.useremail,
      newPassword: this.registerNextForm.get('confirmPassword')?.value
    };
    this.userType = this.authservice.getUserType() || this.determineUserTypeFromContext();
    
    this.authservice.resetPassword(payload, this.userType).subscribe({
      next: (res: any) => {
        if (res) {
          this._loader.hide();
          this.toastr.success(res.message || 'Password updated successfully');
          this.registerNextForm.reset();
          this.registerSubmitted = false;
          
                if (this.userType && this.userType.trim().toLowerCase() === 'superadmin') {
            this.router.navigate(['/superAdmin/login']);
        } else if (this.userType && this.userType.trim().toLowerCase() === 'patient') {
            this.router.navigate(['/patient/login']);
        } else {
            this.router.navigate(['/login']);
        }                                       
        } else {
          this._loader.hide();
          this.toastr.error(res.message);
        }
      },
      error: (err) => {
        this._loader.hide();
        const errorMessage = err.error?.message;
        this.toastr.error(errorMessage);
      }
    });
  } else {
    this._loader.hide();
    this.toastr.warning('Please fill all fields correctly');
  }
}

  get passwordControl() {
    return this.registerNextForm.get('adminPassword');
  }

  get isTouched(): boolean {
    return this.registerNextForm.get('adminPassword')?.touched ?? false;
  }

  navigateToLogin() {
    const route = this.getLoginRoute();
    this.router.navigate([route]);
  }

getLoginRoute(): string {
  const userType = this.userType || this.authservice.getUserType() || this.determineUserTypeFromContext();
  switch (userType) {
    case 'superAdmin': return '/superAdmin/login';
    case 'patient': return '/patient/login';
    default: return '/login';
  }
}

showPassword: boolean = false;
showConfirmPassword: boolean = false;

togglePasswordVisibility() {
  this.showPassword = !this.showPassword;
}

toggleConfirmPasswordVisibility() {
  this.showConfirmPassword = !this.showConfirmPassword;
}
}