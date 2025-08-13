import { Component, ElementRef, ViewChild } from '@angular/core';
import { AbstractControl, AbstractControlOptions, FormBuilder, FormControl, FormGroup, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import { AuthService } from '../../../service/auth/auth.service';
import { registerModel } from '../../../models/user-model';
import { TosterService } from '../../../service/toaster/tostr.service';
import { Router } from '@angular/router';

export function emailWithComValidator(control: AbstractControl): ValidationErrors | null {
  const email = control.value;
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

  if (!email) return null;

  return emailRegex.test(email) ? null : { invalidComEmail: true };
}

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
  selector: 'app-register',
  standalone: false,
  templateUrl: './register.component.html',
  styleUrl: './register.component.scss'
})

export class RegisterComponent {

  image:string ='/images/login-logo-removebg-preview.png';
  // image:string ='/images/login.png';
  title:string ="Let's create an account";
  titleImg:string ='/images/visit-wise-logo 1.png';
  registerSubmitted = false;
  showAdminDetails = false;
  passError!:boolean;

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

  countries: any[] = [];
  mobilePrefixes: any[] = [];
  states: any[] = [];
  cities: any[] = [];
  zipCodes: any[] = [];
  get_CountryCode: string = '';

  selectedCountry:string = '';
  selectedCountryCode:string ='';
  selectedStateCode!:string  | null | undefined;
  selectedCity!:string  | null | undefined;;

  public registerForm = new FormGroup({
  name: new FormControl("", Validators.required),
  isSoloProvider: new FormControl(false, Validators.required),
  countryDataId: new FormControl("", Validators.required),
  address: new FormControl("", Validators.required),
  phoneNumber: new FormControl('', [Validators.required, Validators.pattern(/^[0-9]{10}$/)]),
  country: new FormControl('',Validators.required),
  state: new FormControl('',Validators.required),
  city: new FormControl('',Validators.required),
  adminFirstName: new FormControl("", Validators.required),
  adminLastName: new FormControl("", Validators.required),
  adminEmail: new FormControl("",[Validators.required,Validators.email,emailWithComValidator]),
  phoneCode: new FormControl(""),
  adminPassword: new FormControl("", [
    Validators.required,
    strongPasswordValidator()
  ]),
  confirmPassword: new FormControl("", Validators.required)
}, {
  validators: passwordMatchValidator
});

showPasswordPopup:boolean = false;


  constructor(private fb:FormBuilder, private authservice:AuthService,
     private toastr:TosterService,private routes:Router){}

  ngOnInit(){
    this.getCountries();
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


  get registerUser():{[key:string]:AbstractControl}{
    return this.registerForm.controls
  }

 isPasswordMismatch() {
  const password = this.registerForm.get('adminPassword')?.value;
  const confirmPassword = this.registerForm.get('confirmPassword')?.value;
  if(password !== confirmPassword){
    this.passError = true
  }else{
    this.passError = false
  }
}

get passwordValid() {
  const errors = this.registerForm.get('adminPassword')?.errors?.['strongPassword'] || {};
  return {
    hasUpperCase: errors.hasUpperCase === false,
    hasLowerCase: errors.hasLowerCase === false,
    hasNumber: errors.hasNumber === false,
    hasSpecialChar: errors.hasSpecialChar === false,
    minLength: errors.minLength === false,
  };
}
get showPasswordCriteria(): boolean {
  const control = this.registerForm.get('adminPassword');
  const errors = control?.errors?.['strongPassword'];

  const isTouched = control?.touched ?? false;
  const isDirty = control?.dirty ?? false;

  return (isTouched || isDirty) && !!errors;
}


get isTouched(): boolean {
  return this.registerForm.get('adminPassword')?.touched ?? false;
}

onRegisterSubmit() {
if(this.registerForm.invalid){
  this.registerSubmitted = true;
  return
}
else{
  const data:any = {
      name: this.registerForm.get('name')?.value,
      isSoloProvider: this.registerForm.get('isSoloProvider')?.value,
      countryDataId: Number(this.registerForm.get('countryDataId')?.value),
      address: this.registerForm.get('address')?.value,
      phoneNumber: String(this.registerForm.get('phoneNumber')?.value),
      adminFirstName: this.registerForm.get('adminFirstName')?.value,
      adminLastName: this.registerForm.get('adminLastName')?.value,
      adminEmail: this.registerForm.get('adminEmail')?.value,
      adminPassword: this.registerForm.get('confirmPassword')?.value
    };

    this.authservice.signIn(data).subscribe({
      next: (res) => {
        this.registerForm.reset();
        this.toastr.success(res.message);
        this.routes.navigate(['/login']);
        console.log("res", res);
      },
      error: (err) => {
        const errorMessage = err.error?.message;
        this.toastr.error(errorMessage);
        console.error("Registration Error:", err);
      }
    }); 
  }
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




onCountryChange() {
  const selectedCountryObj: any = this.registerForm.value.country;
  console.log(selectedCountryObj);

  if (selectedCountryObj) {
    this.selectedCountry = selectedCountryObj.country;
    this.selectedCountryCode = selectedCountryObj.mobilePrefixCode;
    this.get_CountryCode = selectedCountryObj.mobilePrefixCode;

    this.registerForm.get('phoneCode')?.setValue(this.get_CountryCode);
  }

  // this.getMobilePrefixes();
  this.getStates();
  this.cities = [];
  this.zipCodes = [];
}


onStateChange() {
  
  this.selectedStateCode = this.registerForm.value.state;
  this.getCities();
  this.zipCodes = [];
}

onCityChange() {
  
  this.selectedCity = this.registerForm.value.city;
  this.getZipCodes();
}

getMobilePrefixes() {
  if (this.selectedCountry) {
    this.authservice.getMobilePrefixes(this.selectedCountry).subscribe(res => {
      this.mobilePrefixes = res;
    });
  }
}

getStates() {
  

  if (this.selectedCountry) {
    this.authservice.getStates(this.selectedCountry).subscribe(res => {
      this.states = res;
    });
  }
}

getCities() {
  if (this.selectedCountry && this.selectedStateCode) {
    this.authservice.getCities(this.selectedCountry, this.selectedStateCode).subscribe(res => {
      this.cities = res;
    });
  }


}
getCountries() {
  this.authservice.getCountries().subscribe(res => {
    this.countries = res;
  });
}
getZipCodes() {
  if (this.selectedCountry && this.selectedStateCode && this.selectedCity) {
    this.authservice.getZipCodes(this.selectedCountry, this.selectedStateCode, this.selectedCity).subscribe(res => {
      this.zipCodes = res;
    });
  }
}

get passwordControl() {
  return this.registerForm.get('adminPassword');
}


preventAbove(event: KeyboardEvent): void {
  const input = event.target as HTMLInputElement;
  const value = input.value;

  const allowedKeys = ['Backspace', 'ArrowLeft', 'ArrowRight', 'Tab', 'Delete'];
  if (allowedKeys.includes(event.key)) return;

  if (!/^\d$/.test(event.key)) {
    event.preventDefault();
    return;
  }

  const nextValue = value + event.key;
  if (nextValue.length > 17) {
    event.preventDefault();
  }
}
showPassword: boolean = false;

togglePasswordVisibility() {
  this.showPassword = !this.showPassword;
}

PasswordValue: any = '';

onPasswordInput(){
  const control = this.registerForm.get('adminPassword');
  this.PasswordValue = control?.value || '';
}
}
