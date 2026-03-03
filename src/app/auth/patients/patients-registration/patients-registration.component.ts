import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';
import { PatientsRegistrationService } from '../../../service/patient/patients.registration.service';
import {
  SearchRequest,
  SearchResult,
  City,
  CreatePatientRequest,
  CreatePatientDiagnosis,
  AvailabilityDto,
  CountryDto,
  StateDto,
  CityDto,
  ZipCodeDto,
  DiagnosisDto
} from '../../../models/search.model';
import { Router } from '@angular/router';
import { TosterService } from '../../../service/toaster/tostr.service';
import { PopupService } from '../../../service/popup/popup-service';
import { PatientService } from '../../../service/patient/patients-service';

// Validator functions
export function emailWithComValidator(control: AbstractControl): ValidationErrors | null {
  const email = control.value;
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

  if (!email) return null;

  return emailRegex.test(email) ? null : { invalidEmail: true };
}

export function phoneNumberValidator(control: AbstractControl): ValidationErrors | null {
  const phone = control.value;
  if (!phone) return null;

    const digitsOnly = phone.replace(/\D/g, '');
  
  if (digitsOnly.length < 10) {
    return { invalidPhoneNumber: 'Phone number must have at least 10 digits' };
  }
  
  if (digitsOnly.length > 17) {
    return { invalidPhoneNumber: 'Phone number cannot exceed 17 digits' };
  }

  return null;
}
export function ssnValidator(control: AbstractControl): ValidationErrors | null {
  const ssn = control.value;
  if (!ssn) return null;

  const ssnRegex = /^\d{3}-\d{2}-\d{4}$/;
  return ssnRegex.test(ssn) ? null : { invalidSSN: true };
}

@Component({
  selector: 'app-patients-registration',
  standalone: false,
  templateUrl: './patients-registration.component.html',
  styleUrl: './patients-registration.component.scss'
})
export class PatientsRegistrationComponent {
  currentStep = 1;
  formSubmitted = false;

  searchFilters: SearchRequest = {
    Query: '',
    Location: '',
    CountryDataId: undefined,
    Specialization: '',
    Department: '',
    Qualifications: '',
    IsSoloProvider: undefined,
    Page: 1,
    PageSize: 10
  };

  therapists: SearchResult[] = [];
  cities: City[] = [];
  selectedTherapist: any | null = null;
  totalPages = 0;
  isLoading = false;
  searchPerformed = false;

  patientData: CreatePatientRequest = {
    ClientId: '',
    FirstName: '',
    LastName: '',
    Email: '',
    CountryDataId: 0,
    PhoneNumber: '',
    DateOfBirth: '',
    Gender: '',
    SocialSecurityNumber: '',
    Address: '',
    BillingAddress: '',
    BillingCountryId: undefined,
    EmailNotification: true,
    TextNotification: false,
    IsBillingAddressSameAsAddress: true,
    // Diagnoses: []
  };

  countries: CountryDto[] = [];
  states: StateDto[] = [];
  citiesList: CityDto[] = [];
  zipCodes: ZipCodeDto[] = [];

  billingCountries: CountryDto[] = [];
  billingStates: StateDto[] = [];
  billingCitiesList: CityDto[] = [];
  billingZipCodes: ZipCodeDto[] = [];

  // diagnosesList: DiagnosisDto[] = [];

  selectedCountry = '';
  selectedState = '';
  selectedCity = '';

  selectedBillingCountry = '';
  selectedBillingState = '';
  selectedBillingCity = '';

  registrationSuccess = false;
  registrationError = '';
  isSubmitting = false;

  constructor(private apiService: PatientsRegistrationService) {}

  ngOnInit(): void {
    this.loadCities();
    this.loadCountries();
    // this.loadDiagnoses();
  }

  loadCities(): void {
    this.apiService.getCityList().subscribe({
      next: (response:any) => {
        if (response.success) {
          this.cities = response.data;
        }
      },
      error: (error) => {
        console.error('Error loading cities:', error);
      }
    });
  }

  loadCountries(): void {
    this.apiService.getCountries().subscribe({
      next: (response:any) => {
        if (response.success) {
          this.countries = response.data;
          this.billingCountries = response.data;
        }
      },
      error: (error) => {
        console.error('Error loading countries:', error);
      }
    });
  }

  // loadDiagnoses(): void {
  //   this.apiService.getDiagnoses().subscribe({
  //     next: (response) => {
  //       if (response.success) {
  //         this.diagnosesList = response.data;
  //       }
  //     },
  //     error: (error) => {
  //       console.error('Error loading diagnoses:', error);
  //     }
  //   });
  // }

  onCountryChange(): void {
    this.selectedState = '';
    this.selectedCity = '';
    this.states = [];
    this.citiesList = [];
    this.zipCodes = [];
    this.patientData.CountryDataId = 0;

    if (this.selectedCountry) {
      this.apiService.getStates(this.selectedCountry).subscribe({
        next: (response) => {
          if (response.success) {
            this.states = response.data;
          }
        },
        error: (error) => {
          console.error('Error loading states:', error);
        }
      });
    }
  }

  onStateChange(): void {
    this.selectedCity = '';
    this.citiesList = [];
    this.zipCodes = [];
    this.patientData.CountryDataId = 0;

    if (this.selectedCountry && this.selectedState) {
      this.apiService.getCities(this.selectedCountry, this.selectedState).subscribe({
        next: (response) => {
          if (response.success) {
            this.citiesList = response.data;
          }
        },
        error: (error) => {
          console.error('Error loading cities:', error);
        }
      });
    }
  }

  onCityChange(): void {
    this.zipCodes = [];
    this.patientData.CountryDataId = 0;

    if (this.selectedCountry && this.selectedState && this.selectedCity) {
      this.apiService.getZipCodes(this.selectedCountry, this.selectedState, this.selectedCity).subscribe({
        next: (response) => {
          if (response.success) {
            this.zipCodes = response.data;
          }
        },
        error: (error) => {
          console.error('Error loading zip codes:', error);
        }
      });
    }
  }

  onBillingCountryChange(): void {
    this.selectedBillingState = '';
    this.selectedBillingCity = '';
    this.billingStates = [];
    this.billingCitiesList = [];
    this.billingZipCodes = [];
    this.patientData.BillingCountryId = undefined;

    if (this.selectedBillingCountry) {
      this.apiService.getStates(this.selectedBillingCountry).subscribe({
        next: (response) => {
          if (response) {
            this.billingStates = response.data;
          }
        },
        error: (error) => {
          console.error('Error loading billing states:', error);
        }
      });
    }
  }

  onBillingStateChange(): void {
    this.selectedBillingCity = '';
    this.billingCitiesList = [];
    this.billingZipCodes = [];
    this.patientData.BillingCountryId = undefined;

    if (this.selectedBillingCountry && this.selectedBillingState) {
      this.apiService.getCities(this.selectedBillingCountry, this.selectedBillingState).subscribe({
        next: (response) => {
          if (response) {
            this.billingCitiesList = response.data;
          }
        },
        error: (error) => {
          console.error('Error loading billing cities:', error);
        }
      });
    }
  }

  onBillingCityChange(): void {
    this.billingZipCodes = [];
    this.patientData.BillingCountryId = undefined;

    if (this.selectedBillingCountry && this.selectedBillingState && this.selectedBillingCity) {
      this.apiService.getZipCodes(this.selectedBillingCountry, this.selectedBillingState, this.selectedBillingCity).subscribe({
        next: (response) => {
          if (response) {
            this.billingZipCodes = response.data;
          }
        },
        error: (error) => {
          console.error('Error loading billing zip codes:', error);
        }
      });
    }
  }

  onBillingAddressSameChange(): void {
    if (this.patientData.IsBillingAddressSameAsAddress) {
      this.patientData.BillingAddress = '';
      this.patientData.BillingCountryId = undefined;
      this.selectedBillingCountry = '';
      this.selectedBillingState = '';
      this.selectedBillingCity = '';
      this.billingStates = [];
      this.billingCitiesList = [];
      this.billingZipCodes = [];
    }
  }

  // addDiagnosis(): void {
  //   this.patientData.Diagnoses.push({
  //     DiagnosisId: '',
  //     DateDiagnosed: new Date().toISOString().split('T')[0]
  //   });
  // }

  // removeDiagnosis(index: number): void {
  //   this.patientData.Diagnoses.splice(index, 1);
  // }

  searchTherapists(): void {
    this.isLoading = true;
    this.searchPerformed = true;

    this.apiService.searchTherapists(this.searchFilters).subscribe({
      next: (response) => {
        this.isLoading = false;
        if (response.success) {
          this.therapists = response.data.results;
          this.totalPages = response.data.totalPages;
        }
      },
      error: (error) => {
        this.isLoading = false;
        console.error('Error searching therapists:', error);
      }
    });
  }

  selectedTherapistids:any;
  selectedTherapistPatientsIds:any;

selectTherapist(therapist: any): void {
  this.selectedTherapist = therapist;
  this.selectedTherapistids = therapist.therapistId;
  this.selectedTherapistPatientsIds = therapist.therapistId;
  this.patientData.ClientId = therapist.organizationId;
  
  // Auto-scroll to the selected provider summary
  setTimeout(() => {
    const summaryElement = document.querySelector('.bg-white.rounded-2xl.shadow-lg');
    if (summaryElement) {
      summaryElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, 100);
}

  // goToStep(step: number): void {
  //   if (step === 2 && !this.selectedTherapist) {
  //     return;
  //   }
  //   this.currentStep = step;
  // }

  changePage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.searchFilters.Page = page;
      this.searchTherapists();
    }
  }

  resetSearch(): void {
    this.searchFilters = {
      Query: '',
      Location: '',
      CountryDataId: undefined,
      Specialization: '',
      Department: '',
      Qualifications: '',
      IsSoloProvider: undefined,
      Page: 1,
      PageSize: 10
    };
    this.therapists = [];
    this.selectedTherapist = null;
    this.searchPerformed = false;
  }

  public router = inject(Router);
  public toastr = inject(TosterService);
  public loader = inject(PopupService);

  // Format SSN
  formatSSN(event: Event) {
    const input = event.target as HTMLInputElement;
    let value = input.value.replace(/\D/g, '');
    
    if (value.length > 3 && value.length <= 5) {
      value = value.replace(/(\d{3})(\d+)/, '$1-$2');
    } else if (value.length > 5) {
      value = value.replace(/(\d{3})(\d{2})(\d+)/, '$1-$2-$3');
    }

    input.value = value;
    this.patientData.SocialSecurityNumber = value;
  }

  // Format Phone Number
  formatUSPhone(event: Event) {
    const input = event.target as HTMLInputElement;
    let value = input.value.replace(/\D/g, '');
    
    if (value.length > 17) {
      value = value.slice(0, 10);
    }
    
    if (value.length > 6) {
      value = value.replace(/(\d{3})(\d{3})(\d+)/, '$1-$2-$3');
    } else if (value.length > 3) {
      value = value.replace(/(\d{3})(\d+)/, '$1-$2');
    }

    input.value = value;
    this.patientData.PhoneNumber = value;
  }

isFieldValid(fieldName: string): boolean {
  if (!this.formSubmitted) return true;
  
  switch (fieldName) {
    case 'firstName':
      return !!this.patientData.FirstName?.trim();
    case 'lastName':
      return !!this.patientData.LastName?.trim();
    case 'email':
      return !!this.patientData.Email?.trim() && emailWithComValidator({ value: this.patientData.Email } as AbstractControl) === null;
    case 'phoneNumber':
      return !this.patientData.PhoneNumber || phoneNumberValidator({ value: this.patientData.PhoneNumber } as AbstractControl) === null;
    case 'dateOfBirth':
      return !!this.patientData.DateOfBirth;
    case 'gender':
      return !!this.patientData.Gender;
    
    case 'country':
      return !!this.selectedCountry;
    case 'state':
      return !!this.selectedState;
    case 'city':
      return !!this.selectedCity;
    case 'zipCode':
      return !!this.patientData.CountryDataId && this.patientData.CountryDataId > 0;
    case 'address':
      return !!this.patientData.Address?.trim();
    default:
      return true;
  }
}

getFieldError(fieldName: string): string {
  if (!this.formSubmitted) return '';

  switch (fieldName) {
    case 'firstName':
      return !this.patientData.FirstName?.trim() ? 'First name is required' : '';
    case 'lastName':
      return !this.patientData.LastName?.trim() ? 'Last name is required' : '';
    case 'email':
      if (!this.patientData.Email?.trim()) return 'Email is required';
      if (emailWithComValidator({ value: this.patientData.Email } as AbstractControl)) return 'Please enter a valid email address';
      return '';
    case 'phoneNumber':
      if (this.patientData.PhoneNumber && this.patientData.PhoneNumber.trim() !== '') {
        const digitsOnly = this.patientData.PhoneNumber.replace(/\D/g, '');
        if (digitsOnly.length < 10) return 'Phone number must have at least 10 digits';
        if (digitsOnly.length > 17) return 'Phone number cannot exceed 17 digits';
      }
      return '';
    case 'dateOfBirth':
      return !this.patientData.DateOfBirth ? 'Date of birth is required' : '';
    case 'gender':
      return !this.patientData.Gender ? 'Gender is required' : '';
   
    case 'country':
      return !this.selectedCountry ? 'Country is required' : '';
    case 'state':
      return !this.selectedState ? 'State is required' : '';
    case 'city':
      return !this.selectedCity ? 'City is required' : '';
    case 'zipCode':
      return !this.patientData.CountryDataId || this.patientData.CountryDataId === 0 ? 'Zip code is required' : '';
    case 'address':
      return !this.patientData.Address?.trim() ? 'Street address is required' : '';
    // ... other cases
    default:
      return '';
  }
}

validateForm(): boolean {
  return !!(
    this.patientData.ClientId &&
    this.patientData.FirstName?.trim() &&
    this.patientData.LastName?.trim() &&
    this.patientData.Email?.trim() &&
    emailWithComValidator({ value: this.patientData.Email } as AbstractControl) === null &&
    this.patientData.DateOfBirth &&
    this.patientData.Gender &&
    this.selectedCountry &&
    this.selectedState &&
    this.selectedCity &&
    this.patientData.CountryDataId &&
    this.patientData.CountryDataId > 0 &&
    this.patientData.Address?.trim() &&
    (!this.patientData.PhoneNumber || phoneNumberValidator({ value: this.patientData.PhoneNumber } as AbstractControl) === null) &&
   
    (this.patientData.IsBillingAddressSameAsAddress ? true : 
      (this.patientData.BillingAddress?.trim() && this.patientData.BillingCountryId))
  );
}

public patientService = inject(PatientService);
submitRegistration(): void {
  if (!this.selectedTherapist) {
    this.toastr.error('Please select a provider before completing registration');
    return;
  }

  this.loader.show();
  this.formSubmitted = true;
  
  if (!this.validateForm()) {
    this.toastr.error('Please fill all required fields correctly');
    this.loader.hide();
    return;
  }

  this.registrationError = '';
  this.isSubmitting = true;

  const submitData = {
    ...this.patientData,
    userId: this.selectedTherapistids,
    BillingAddress: this.patientData.IsBillingAddressSameAsAddress 
      ? this.patientData.Address 
      : this.patientData.BillingAddress,
    BillingCountryId: this.patientData.IsBillingAddressSameAsAddress 
      ? this.patientData.CountryDataId 
      : this.patientData.BillingCountryId
  };

  this.apiService.createPatient(submitData).subscribe({
    next: (response) => {
      this.loader.hide();
      if (response) {
        const patientId:any = response.data;
        if (this.selectedTherapistids && this.selectedTherapistids.length > 0) {
          this.assignTherapistsToPatient(patientId, this.selectedTherapistPatientsIds);
        } else {
          this.completeRegistration();
        }
      } else {
        this.loader.hide();
        this.handleRegistrationError('Failed to create patient');
      }
    },
    error: (error) => {
      this.loader.hide();
      this.handleRegistrationError(error.error?.message || 'An error occurred while creating the patient');
      console.error('Error creating patient:', error);
    }
  });
}

assignTherapistsToPatient(patientId: string, therapistIds: string[]): void {
  const payload:any = {
    patientId: patientId,
    therapistIds: [therapistIds]
  };

  this.patientService.assignTherapistToPatient(payload).subscribe({
    next: (response) => {
      this.completeRegistration();
      console.log('Therapists assigned successfully:', response);
    },
    error: (error) => {
      console.error('Error assigning therapists:', error);
      this.toastr.warning('Patient created but therapists assignment failed');
      this.completeRegistration();
    }
  });
}

completeRegistration(): void {
  this.loader.hide();
  this.isSubmitting = false;
  this.registrationSuccess = true;
  this.currentStep = 3;
  this.toastr.success('Registration completed successfully!');
}


handleRegistrationError(errorMessage: string): void {
  this.isSubmitting = false;
  this.loader.hide();
  this.toastr.error(errorMessage);
  this.registrationError = errorMessage;
}

  startNewRegistration(): void {
   this.router.navigate(['/patient/login'])
  }

  getDayOfWeekOrder(day: string): number {
    const order: { [key: string]: number } = {
      'Monday': 1,
      'Tuesday': 2,
      'Wednesday': 3,
      'Thursday': 4,
      'Friday': 5,
      'Saturday': 6,
      'Sunday': 7
    };
    return order[day] || 8;
  }

  getDayName(dayOfWeek: number): string {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[dayOfWeek] || 'Unknown';
  }

  getSortedAvailability(availability: AvailabilityDto[]): AvailabilityDto[] {
    return [...availability]
      .filter((a:any) => a.active)
      .sort((a:any, b:any) => a.dayOfWeek - b.dayOfWeek);
  }

  formatTime(dateString: string): string {
    try {
      const date = new Date(dateString);
      return date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });
    } catch {
      return dateString;
    }
  }
phoneNumberValidator(control: AbstractControl): ValidationErrors | null {
  const phone = control.value;
    if (!phone || phone.trim() === '') {
    return null;
  }

  const digitsOnly = phone.replace(/\D/g, '');
  
  if (digitsOnly.length < 10 || digitsOnly.length > 17) {
    return { invalidPhoneNumber: true };
  }

  return null;
}
validateStep1(): void {
  this.formSubmitted = true;
  
  if (this.validateStep1Form()) {
    this.currentStep = 2;
    this.formSubmitted = false; // Reset for step 2
  } else {
    // Scroll to top to show validation errors
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}

validateStep1Form(): boolean {
  return !!(
    this.patientData.FirstName?.trim() &&
    this.patientData.LastName?.trim() &&
    this.patientData.Email?.trim() &&
    emailWithComValidator({ value: this.patientData.Email } as AbstractControl) === null &&
    this.patientData.DateOfBirth &&
    this.patientData.Gender &&
    this.selectedCountry &&
    this.selectedState &&
    this.selectedCity &&
    this.patientData.CountryDataId &&
    this.patientData.CountryDataId > 0 &&
    this.patientData.Address?.trim() &&
    (!this.patientData.PhoneNumber || phoneNumberValidator({ value: this.patientData.PhoneNumber } as AbstractControl) === null) &&
    (this.patientData.IsBillingAddressSameAsAddress ? true : 
      (this.selectedBillingCountry && 
       this.selectedBillingState && 
       this.selectedBillingCity && 
       this.patientData.BillingCountryId &&
       this.patientData.BillingAddress?.trim()))
  );
}

hasValidationErrors(): boolean {
  return !this.validateStep1Form();
}

goToStep(step: number): void {
  if (step === 2 && !this.validateStep1Form()) {
    this.formSubmitted = true;
    window.scrollTo({ top: 0, behavior: 'smooth' });
    return;
  }
  
  if (step === 3 && !this.selectedTherapist) {
    this.toastr.error('Please select a provider before proceeding');
    return;
  }
  
  this.currentStep = step;
}
}
