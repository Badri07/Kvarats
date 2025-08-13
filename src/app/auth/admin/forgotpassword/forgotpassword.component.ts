import { Component, ElementRef, ViewChild } from '@angular/core';
import { AbstractControl, FormArray, FormBuilder, FormControl, FormGroup, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import { AuthService } from '../../../service/auth/auth.service';
import { Router } from '@angular/router';
import { TosterService } from '../../../service/toaster/tostr.service';
import { forgotpasswordModel, loginModel, LoginResponse, registerModel } from '../../../models/user-model';
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

  registerSubmitted:boolean =false;
  passError!:boolean;
  isshowotpSection:boolean = false;
  isshowForm:boolean = true;

  isshowonextForm:boolean = false;
  showPasswordPopup:boolean = false;

   public useremail!:string | null | undefined;
   public otp!:string;
   public newPassword!:string;


  public registerForm = new FormGroup({
  email: new FormControl("",[Validators.required,Validators.email]),
  otp: new FormArray(Array.from({ length: 6 }, () => new FormControl('')))
  })

  
  public registerNextForm = new FormGroup({
    // email:new FormControl("",[Validators.required]),
    adminPassword: new FormControl("", [
    Validators.required,
    strongPasswordValidator()
  ]),
  confirmPassword: new FormControl("", Validators.required)
}, {
  validators: passwordMatchValidator
  })

  constructor(private fb:FormBuilder,
    private authservice:AuthService,
    private toastr:TosterService,
    private router:Router,

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

    ngOnInit(){
    this.registerForm.valueChanges.subscribe(() => {
    this.registerForm.updateValueAndValidity({ emitEvent: false });
  });
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


// onSignin() {

//   if(this.registerForm.get('email')?.invalid){
// this.registerSubmitted = true;
// return
//   }

//   if (this.registerForm.valid) {
//     const data: forgotpasswordModel = {
//       email: this.registerForm.get('email')?.value
//     };

//     this.useremail = data.email;

//     this.authservice.forgotPassword(data).subscribe({
//       next: (res: any) => {
//         if (res.status === 200) {
//           this.toastr.success('Password reset link sent to your email');
//           this.isshowForm = false;
//           this.isshowotpSection = true;
//         } else {
//           this.toastr.error(res.message || 'Unexpected error occurred');
//         }
//       },
//       error: (err) => {
//         this.toastr.error('Password reset failed. Please try again.');
//         console.error("Forgot Password Error:", err);
//       }
//     });
//   } else {
//     this.toastr.warning('Please enter a valid email');
//   }
// }

onSignin() {
  debugger;
  console.log("Form Valid:", this.registerForm.valid);
  console.log("Form Value:", this.registerForm.value);
  if (this.registerForm.valid) {
    this.isPasswordMismatch();
    const data: forgotpasswordModel = {
      email: this.registerForm.get('email')?.value,
    };

    console.log("Request Data:", data);
    this.useremail = this.registerForm.get('email')?.value
    this.authservice.forgotPassword(data).subscribe({
      next: (res: any) => {
         if (res.success === true) {
        this.toastr.success(res.message);
        this.isshowForm = false;
        this.isshowotpSection = true;
        } else {
          this.toastr.error(res.message);
        }
      },
      error: (err) => {
         const errorMessage = err.error?.message;
         this.toastr.error(errorMessage);
        // console.error("Forgot Password Error:", err);
      }
    });
  } else {
    // console.warn("Form is invalid");
    this.registerSubmitted = true;
    return;
  }
}

resendMail() {
  const payload: any = {
    email: this.useremail
  };

  this.authservice.forgotPassword(payload).subscribe({
    next: (res: any) => {
      if (res.success === true) {
        this.toastr.success(res.message);
        this.isshowForm = false;
        this.isshowotpSection = true;
      } else {
        this.toastr.error(res.message);
      }
    },
    error: (err) => {
      const errorMessage = err.error?.message;
      this.toastr.error(errorMessage);
    }
  });
}


isVerify() {
  const get_otp = this.otpControls.value.join('');
  const payload:any = { otp: get_otp };

  this.authservice.verifyPassword(payload).subscribe({
    next: (res: any) => {
      if (res.success === true) {
         this.toastr.success(res.message);
        this.isshowotpSection = false;
        this.isshowonextForm = true;
      } else {
        this.toastr.error(res.message);
      }
    },
    error: (err) => {
      const errorMessage = err.error?.message;
      this.toastr.error(errorMessage);
    }
  });
}

updatePassword() {
  this.registerSubmitted = true;
 
  if (this.registerNextForm.valid && !this.registerNextForm.errors?.['passwordMismatch']) {
    const payload = {
      email: this.useremail,
      newPassword: this.registerNextForm.get('confirmPassword')?.value
    };
 
    this.authservice.resetPassword(payload).subscribe({
      next: (res: any) => {
        if (res.success === true) {
         this.toastr.success(res.message);
          this.registerNextForm.reset();
          this.registerSubmitted = false;
          this.router.navigate(['/login']);
 
        } else {
        this.toastr.error(res.message);
        }
      },
      error: (err) => {
      const errorMessage = err.error?.message;
      this.toastr.error(errorMessage);
      }
    });
  } else {
    this.toastr.warning('Please fill all fields correctly');
  }
}


get otpControls() {
  return this.registerForm.get('otp') as FormArray;
}

moveToNext(event: Event, index: number) {
  const input = event.target as HTMLInputElement;
  const value = input.value;

  if (value && index < 5) {
    const nextInput = input.parentElement?.querySelectorAll('input')[index + 1] as HTMLInputElement;
    nextInput?.focus();
  }

  if (!value && index > 0) {
    const prevInput = input.parentElement?.querySelectorAll('input')[index - 1] as HTMLInputElement;
    prevInput?.focus();
  }
}

get passwordControl() {
  return this.registerNextForm.get('adminPassword');
}
get isTouched(): boolean {
  return this.registerNextForm.get('adminPassword')?.touched ?? false;
}
}
