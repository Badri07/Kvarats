import { ChangeDetectorRef, Component } from '@angular/core';
import { AbstractControl, FormArray, FormBuilder, FormGroup, ValidationErrors, Validators } from '@angular/forms';
import { AdminService } from '../../service/admin/admin.service';
import { Client, Billing } from '../../models/useradmin-model';
import { TosterService } from '../../service/toaster/tostr.service';
import { PopupService } from '../../service/popup/popup-service';
import { AuthService } from '../../service/auth/auth.service';
import { BreadcrumbService } from '../../shared/breadcrumb/breadcrumb.service';
import { forkJoin, switchMap, tap } from 'rxjs';
import { of } from 'rxjs';
import { ActivatedRoute, Route, Router } from '@angular/router';


type PatientTab = 'patient-info' | 'notification';


export function emailWithComValidator(control: AbstractControl): ValidationErrors | null {
  const email = control.value;
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

  if (!email) return null;

  return emailRegex.test(email) ? null : { invalidComEmail: true };
}


@Component({
  selector: 'app-add-patients',
  standalone: false,
  templateUrl: './add-patients.component.html',
  styleUrl: './add-patients.component.scss'
})
export class AddPatientsComponent {
  tabs: PatientTab[] = ['patient-info', 'notification'];
  selectedTab: PatientTab = 'patient-info';

  isshowpopup: boolean = false;
  clientForm!: FormGroup;
  clientFormSubmitted: boolean = false;
  patientId:any;
  countries: any[] = [];
  states: any[] = [];
  cities: any[] = [];
  zipCodes: any[] = [];
  BillingCountry: string = '';
  billingStates: any[] = [];
  billingCities: any[] = [];
  billingZipCodes: any[] = [];

  get_CountryCode!:string;
  selectedCountry: string = '';
  selectedCountryCode: string = '';
  selectedStateCode!: string | null | undefined;
  selectedCity!: string | null | undefined;

  insuranceCarriers: any[] = [];
  isEditMode = false;
  selectedPatientId: string | null = null;
  isAdd: boolean = false;
actionType: 'Add' | 'Update' = 'Add';

  

  constructor(
    private fb: FormBuilder,
    private _adminservice: AdminService,
    private _toastr: TosterService,
    private _loader: PopupService,
    private _authservice: AuthService,
    private breadcrumbService:BreadcrumbService,
    private route: ActivatedRoute,
    private cdRef: ChangeDetectorRef,
    private router: Router
     
  ) {}

  ngAfterViewChecked(): void {
    this.updateSlider();
  }

  ngOnInit(): void {
   
    this.patientId = this.route.snapshot.paramMap.get('id');
    if (this.patientId) {
      this.isEditMode = true;
      this.editPatient(this.patientId);
      console.log("patientIdpatientIdpatientId",this.patientId);
      
    }
      this.clientForm = this.fb.group({
        patientCode: [''],
        firstName: ['', Validators.required],
        lastName: ['', Validators.required],
        email: ['', [Validators.required, Validators.email,emailWithComValidator]],
        phoneNumber: [null, [Validators.required]],
        dateOfBirth: ['', Validators.required],
        gender: ['', Validators.required],
        socialSecurityNumber: [''],
        country: ['', Validators.required],
        state: ['', Validators.required],
        city: ['', Validators.required],
        phoneCode: [''],
        postalCode: ['', Validators.required],
        billingCountry: ['',Validators.required],
        billingState: ['',Validators.required],
        billingCity: ['',Validators.required],
        billingPostalCode: ['',Validators.required],
        address: ['', Validators.required],
        countryDataId: [null],
        billingAddress: ['',Validators.required],
        billingCountryId: [null],
        billingSameAsCurrent: [false],
        emailNotification: [false],
        textNotification: [false],
      });
  
      this.getCountries();
      const isEdit = !!this.patientId;
  
    this.breadcrumbService.setBreadcrumbs([
      {
        label: isEdit ? 'Edit Patients' : 'Add Patients',
        url: 'patients/add-patients'
      }
    ]);
    this.breadcrumbService.setVisible(true);
  
    //if (isEdit) {
    //  this.editPatient(this.patientId);
    //}
    this.breadcrumbService.setVisible(true);
    
    this.clientForm.get('billingSameAsCurrent')?.valueChanges.subscribe(value => {
      this.onBillingSameToggle();
    });

    this.clientForm.get('address')?.valueChanges.subscribe(address => {
  const billingSameAsCurrent = this.clientForm.get('billingSameAsCurrent')?.value;
  if (billingSameAsCurrent) {
    this.clientForm.get('billingAddress')?.setValue(address, { emitEvent: false });
  }
});


  }

onBillingSameToggle() {
  const isSame = this.clientForm.get('billingSameAsCurrent')?.value;
  console.log('[1] Toggle changed. isSame:', isSame);

  const billingFields = [
    'billingAddress',
    'billingCountry',
    'billingState',
    'billingCity',
    'billingPostalCode'
  ];

  if (isSame) {
    const primaryValues = {
      address: this.clientForm.get('address')?.value,
      country: this.clientForm.get('country')?.value,
      state: this.clientForm.get('state')?.value,
      city: this.clientForm.get('city')?.value,
      postalCode: this.clientForm.get('postalCode')?.value
    };
    this.billingStates = [...this.states];
    this.billingCities = [...this.cities];
    this.billingZipCodes = [...this.zipCodes];
    console.log('[4] Billing dropdowns refreshed:', {
      states: this.billingStates.length,
      cities: this.billingCities.length,
      zips: this.billingZipCodes.length
    });

    const matchedValues = {
      country: this.countries.find(c => 
        c.country === primaryValues.country?.country || 
        c.country === primaryValues.country
      ),
      
      state: this.billingStates.find(s => 
        s.stateCode === primaryValues.state ||
        s.stateName === primaryValues.state
      ),
      
      city: this.billingCities.find(c => 
        c.cityName === primaryValues.city
      ),
      
      postal: this.findMatchingPostalCode(primaryValues.postalCode)
    };
    console.log('[5] Matched Objects:', matchedValues);

    this.clientForm.patchValue({
      billingAddress: primaryValues.address,
      billingCountry: matchedValues.country || primaryValues.country,
      billingState: matchedValues.state?.stateCode || primaryValues.state,
      billingCity: matchedValues.city?.cityName || primaryValues.city,
      billingPostalCode: this.getPostalCodeValue(matchedValues.postal, primaryValues.postalCode)
    }, { emitEvent: false });

    this.cdRef.detectChanges();
    console.log('[6] Patched values:', {
      country: this.clientForm.get('billingCountry')?.value,
      state: this.clientForm.get('billingState')?.value,
      city: this.clientForm.get('billingCity')?.value,
      postal: this.clientForm.get('billingPostalCode')?.value
    });

    billingFields.forEach(control => {
      this.clientForm.get(control)?.disable({ emitEvent: false });
    });

  } else {
    billingFields.forEach(control => {
      this.clientForm.get(control)?.enable({ emitEvent: false });
    });
    this.clientForm.patchValue({
      billingAddress: '',
      billingCountry: null,
      billingState: null,
      billingCity: null,
      billingPostalCode: null
    }, { emitEvent: false });
    
    this.billingStates = [];
    this.billingCities = [];
    this.billingZipCodes = [];
  }
}

private findMatchingPostalCode(postalValue: any): any {
  if (!postalValue) return null;
  
  if (typeof postalValue === 'string') {
    return this.billingZipCodes.find(z => z.zipCode === postalValue);
  }
  
  if (postalValue.zipCode) {
    return this.billingZipCodes.find(z => z.zipCode === postalValue.zipCode);
  }
  
  return this.billingZipCodes.find(z => z.zipCode === postalValue) || postalValue;
}

private getPostalCodeValue(matchedPostal: any, originalPostal: any): any {
  if (matchedPostal?.zipCode) return matchedPostal.zipCode;
  if (matchedPostal) return matchedPostal;
  
  if (typeof originalPostal === 'object') {
    return originalPostal?.zipCode || '';
  }
  
  return originalPostal || '';
}

  onCountryChange() {
    
    const selectedCountryObj: any = this.clientForm.value.billingCountry;
    if (selectedCountryObj) {
      this.selectedCountry = selectedCountryObj.country;
      this.selectedCountryCode = selectedCountryObj.mobilePrefixCode;
        this.get_CountryCode = selectedCountryObj.mobilePrefixCode;
      this.clientForm.get('phoneCode')?.setValue(this.get_CountryCode);
      this.getStates();
      this.cities = [];
      this.zipCodes = [];
    }
  }

  onAddressCountryChange() {
    debugger
    const selectedCountryObj: any = this.clientForm.value.country;
    if (selectedCountryObj) {
      this.selectedCountry = selectedCountryObj.country;
      this.selectedCountryCode = selectedCountryObj.mobilePrefixCode;
      this.get_CountryCode = selectedCountryObj.mobilePrefixCode;
      this.clientForm.get('phoneCode')?.setValue(this.get_CountryCode);
      this.getStates();
      this.cities = [];
      this.zipCodes = [];
    }
  }

  onStateChange() {
    this.selectedStateCode = this.clientForm.value.billingState;
    this.getCities();
    this.zipCodes = [];
  }

  onCityChange() {
    this.selectedCity = this.clientForm.value.billingCity;
    this.getZipCodes();
  }

  onAddressStateChange() {
    this.selectedStateCode = this.clientForm.value.state;
    this.getCities();
    this.zipCodes = [];
  }

  onAddressCityChange() {
    this.selectedCity = this.clientForm.value.city;
    this.getZipCodes();
  }

  onBillingCountryChange() {
  const selectedCountryObj = this.clientForm.get('billingCountry')?.value;
  const countryName = selectedCountryObj?.country;
  if (!countryName) return;

  this._authservice.getStates(countryName).subscribe(states => {
    this.billingStates = states;
    this.clientForm.get('billingState')?.reset();
    this.clientForm.get('billingCity')?.reset();
    this.clientForm.get('billingPostalCode')?.reset();
    this.billingCities = [];
    this.billingZipCodes = [];
  });
}


onBillingStateChange() {
  const selectedCountryObj = this.clientForm.get('billingCountry')?.value;
  const selectedStateCode = this.clientForm.get('billingState')?.value;
  const selectedCountry = selectedCountryObj?.country;

  if (!selectedCountry || !selectedStateCode) return;

  this._authservice.getCities(selectedCountry, selectedStateCode).subscribe(cities => {
    this.billingCities = cities;
    this.clientForm.get('billingCity')?.reset();
    this.clientForm.get('billingPostalCode')?.reset(); 
    this.billingZipCodes = [];
  });
}


onBillingCityChange() {
  const selectedCountryObj = this.clientForm.get('billingCountry')?.value;
  const selectedStateCode = this.clientForm.get('billingState')?.value;
  const selectedCity = this.clientForm.get('billingCity')?.value;
  const countryName = selectedCountryObj?.country;

  if (!countryName || !selectedStateCode || !selectedCity) return;

  this._authservice.getZipCodes(countryName, selectedStateCode, selectedCity).subscribe(zips => {
    console.log('Billing zips:', zips); 
    this.billingZipCodes = zips;
    this.clientForm.get('billingPostalCode')?.reset();
  });
}




  getCountries() {
    this._authservice.getCountries().subscribe(res => {
      this.countries = res;
    });
  }

  getStates() {
    if (this.selectedCountry) {
      this._authservice.getStates(this.selectedCountry).subscribe(res => {
        this.states = res;
      });
    }
  }

  getCities() {
    if (this.selectedCountry && this.selectedStateCode) {
      this._authservice.getCities(this.selectedCountry, this.selectedStateCode).subscribe(res => {
        this.cities = res;
      });
    }
  }

  getZipCodes() {
    if (this.selectedCountry && this.selectedStateCode && this.selectedCity) {
      this._authservice.getZipCodes(this.selectedCountry, this.selectedStateCode, this.selectedCity).subscribe(res => {
        this.zipCodes = res;
      });
    }
  }

  addpatient() {
    this.isshowpopup = true;
  }

  closeModal() {
    this.isshowpopup = false;
  }

  setTab(tab: PatientTab) {
    this.selectedTab = tab;

    if (tab === 'patient-info') {
    this.editPatient(this.patientId);  
  }

    const slider = document.querySelector('.slider') as HTMLElement;
    const tabElements = document.querySelectorAll('.tab');
    const tabIndex: Record<PatientTab, number> = {
      'patient-info': 0,
      'notification': 1
    };

    if (slider && tabElements[tabIndex[tab]]) {
      const tabEl = tabElements[tabIndex[tab]] as HTMLElement;
      slider.style.left = `${tabEl.offsetLeft}px`;
      slider.style.width = `${tabEl.offsetWidth}px`;
    }

  }

  onNext() {
    const currentIndex = this.tabs.indexOf(this.selectedTab);
    if (currentIndex < this.tabs.length - 1) {
      this.setTab(this.tabs[currentIndex + 1]);
    } 
  }

  onBack() {
    const currentIndex = this.tabs.indexOf(this.selectedTab);
    if (currentIndex > 0) {
      this.setTab(this.tabs[currentIndex - 1]);
    }
  }

  saveForm() { 
    debugger
    if(this.clientForm.invalid && this.patientId ==null){
      this.clientFormSubmitted = true;
      this.selectedTab ='patient-info';
      return
    }
  if (this.patientId != null || undefined) {
    console.log('Performing update');
    this.onUpdatePatient();
    return;
  }
  console.log('Performing create');
    const formValue = this.clientForm.getRawValue();
    const selectedZip = this.zipCodes.find(
  (zip: any) => zip.zipCode === formValue.postalCode);
const selectedBillingZip = this.billingZipCodes.find(
  (zip: any) => zip.zipCode === formValue.billingPostalCode
);
    const payload: any = {
      patientCode: formValue.patientCode || '',
      firstName: formValue.firstName,
      lastName: formValue.lastName,
      email: formValue.email,
      phoneNumber: formValue.phoneNumber,
      dateOfBirth: formValue.dateOfBirth,
      gender: formValue.gender,
      address: formValue.address,
      billingAddress: formValue.billingSameAsCurrent ? formValue.address : formValue.billingAddress,
      countryDataId: Number(selectedZip.id),
      billingCountryId: formValue.billingSameAsCurrent
    ? selectedZip?.id || 0
    : selectedBillingZip?.id || 0,
      isBillingAddressSameAsAddress:formValue.billingSameAsCurrent,
      socialSecurityNumber: formValue.socialSecurityNumber,
      emailNotification: formValue.emailNotification,
      textNotification: formValue.textNotification,
    };
    delete payload.billingSameAsCurrent;
    this._loader.show();
    this._adminservice.AddPatients(payload).subscribe({
      next: (res: Client) => {
        this._toastr.success(res.message);
        this._loader.hide();
        this.clientForm.reset();
        this.clientFormSubmitted = false;
        this.router.navigate([
      '/admin/patients/list-patients'
    ],{state: { reload: true }});
         
      },
      error: (err: any) => {
         const errorMessage = err.error?.message;
          this._toastr.error(errorMessage);
          this._loader.hide();
      }
    });
  }

  updateSlider() {
    setTimeout(() => {
      const tabs = document.querySelectorAll('.tab');
      const slider = document.querySelector('.slider') as HTMLElement;
      const activeTab = Array.from(tabs).find(tab => tab.classList.contains('active')) as HTMLElement;
      if (activeTab && slider) {
        slider.style.left = `${activeTab.offsetLeft}px`;
        slider.style.width = `${activeTab.offsetWidth}px`;
      }
    });
  }

  get clientFormUser(): { [key: string]: AbstractControl } {
    return this.clientForm.controls;
  }

  get insurances(): FormArray {
    return this.clientForm.get('insurances') as FormArray;
  }

  removeInsurance(index: number) {
    this.insurances.removeAt(index);
  }


  // loadInsuranceCarriers() {
  //   this._authservice.getInsuranceCarriers().subscribe({
  //     next: (res) => {
  //       this.insuranceCarriers = res;
  //     },
  //     error: (err) => console.error('Error loading insurance carriers:', err)
  //   });
  // }


   editPatient(id: string): void {
    debugger
    this.isEditMode = true;
    this.patientId = id;
    this.actionType = 'Update';
    console.log('EditPatient - Setting edit mode:', {
    isEditMode: this.isEditMode,
    patientId: this.patientId,
    actionType: this.actionType
  });
    forkJoin([
      this._authservice.getCountries(),
      this._adminservice.getPatientById(id),
    ]).pipe(
      switchMap(([countries, patient]: [any[], any]) => {
        if (!patient) {
          throw new Error('Patient not found');
        }
        this.countries = countries;
        this.selectedCountry = patient.data.country;
        const selectedCountry = countries.find((c: any) => 
          c.country === patient.data.country
        );
        const billingCountry = this.countries.find((c: any) => 
            c.country === (patient.data.billingCountry as string)
          );
        
        // console.log('Patient billing country ID:', patient.data.billingCountryId);
        // console.log('Patient billing country IDPatient billing country IDPatient billing country ID', patient.data);
        // console.log('Matched billing country:', billingCountry.data);
        
        // console.log('Patient country:', patient.data.country);
        // console.log('Available countries:', countries);
        // console.log('Selected country:', selectedCountry);

        const formattedDob = patient.data.dateOfBirth ? 
          (patient.data.dateOfBirth as string).split('T')[0] : null;
        const initialValues = {
          firstName: patient.data.firstName as string,
          lastName: patient.data.lastName as string,
          email: patient.data.email as string,
          phoneNumber: patient.data.phoneNumber as string,
          dateOfBirth: formattedDob,
          gender: patient.data.gender as string,
          phoneCode: patient.data.mobilePrefixCode,
          country: selectedCountry,
          countryDataId: patient.data.countryDataId,
          address: patient.data.address as string,
          billingAddress: patient.data.billingAddress as string,
          billingCountry: billingCountry?.country || patient.data.billingCountry || '',
          socialSecurityNumber: patient.data.socialSecurityNumber as string,
          textNotification: patient.data.textNotification as boolean,
          emailNotification: patient.data.emailNotification as boolean,
          billingSameAsCurrent: patient.data.isBillingAddressSameAsAddress as boolean,
          billingCountryId:patient.data.billingCountryId
        };
        console.log('Patching initial values:', initialValues);
        this.clientForm.patchValue(initialValues);
        console.log('Loading primary address dropdowns...');
        return this.loadAddressDropdowns(
          patient.data.country as string,
          patient.data.state as string,
          patient.data.city as string,
          patient.data.zip as string
        ).pipe(
          switchMap(() => {
            console.log('Primary address dropdowns loaded');
            if (patient.isBillingAddressSameAsAddress) {
              console.log('Billing same as primary - copying values');
              this.billingStates = [...this.states];
              this.billingCities = [...this.cities];
              this.billingZipCodes = [...this.zipCodes];
              
              const billingValues = {
                billingState: this.clientForm.get('state')?.value,
                billingCity: this.clientForm.get('city')?.value,
                billingPostalCode: this.clientForm.get('postalCode')?.value
              };
              console.log('Copying billing values:', billingValues);
              
              this.clientForm.patchValue(billingValues);
            } else {
              console.log('Loading separate billing address dropdowns');
              return this.loadBillingAddressDropdowns(
                patient.data.billingCountry as string,
                patient.data.billingState as string,
                patient.data.billingCity as string,
                patient.data.billingZip as string
              );
            }
            return of(null);
          })
        );
      })
    ).subscribe({
      next: () => {
        console.log('Patient edit initialization complete');
        this.isEditMode = true;
        this.isAdd = true;
        this.actionType = 'Update';
        
        if (this.clientForm.get('billingSameAsCurrent')?.value) {
          console.log('Disabling billing fields');
          ['billingAddress', 'billingCountry', 'billingState', 'billingCity', 'billingPostalCode']
            .forEach(control => this.clientForm.get(control)?.disable());
        }
                console.log('Final form state after edit:', {
          billingSameAsCurrent: this.clientForm.get('billingSameAsCurrent')?.value,
          billingCountry: this.clientForm.get('billingCountry')?.value,
          billingPostalCode: this.clientForm.get('billingPostalCode')?.value,
          billingStates: this.billingStates.length,
          billingZipCodes: this.billingZipCodes.length
        });
      },
      error: (error) => {
        console.error('Error loading patient data:', error);
      }
    });
  }

 
private loadAddressDropdowns(
  country: string,
  stateName: string,
  cityName: string,
  zipCode: string
) {
  return this._authservice.getStates(country).pipe(
    switchMap(states => {
      this.states = states;
      const selectedState = states.find((s:any) => 
        s.stateName?.toLowerCase() === stateName?.toLowerCase() ||
        s.stateCode?.toLowerCase() === stateName?.toLowerCase()
      );
      this.clientForm.get('state')?.setValue(selectedState?.stateCode || null);
      this.selectedStateCode = selectedState?.stateCode;

      if (!this.selectedStateCode) return of(null);

      return this._authservice.getCities(country, this.selectedStateCode).pipe(
        switchMap(cities => {
          this.cities = cities;
          const selectedCity = cities.find((c:any) => 
            c.cityName?.toLowerCase() === cityName?.toLowerCase()
          );
          this.clientForm.get('city')?.setValue(selectedCity?.cityName || null);
          this.selectedCity = selectedCity?.cityName;

          if (!this.selectedCity) return of(null);

          return this._authservice.getZipCodes(
            country,
            this.selectedStateCode || '', 
            this.selectedCity || ''
          ).pipe(
            tap(zipCodes => {
              this.zipCodes = zipCodes;
              const selectedZip = this.findMatchingZip(zipCodes, zipCode);
              this.clientForm.get('postalCode')?.setValue(
                selectedZip?.zipCode || zipCode || ''
              );
            })
          );
        })
      );
    })
  );
}

private loadBillingAddressDropdowns(
  country: string,
  stateName: string,
  cityName: string,
  zipCode: string
) {
  return this._authservice.getStates(country).pipe(
    switchMap(states => {
      this.billingStates = states;
      const selectedState = states.find((s: any) =>
        s.stateName?.toLowerCase() === stateName?.toLowerCase() ||
        s.stateCode?.toLowerCase() === stateName?.toLowerCase()
      );

      console.log("selectedState",selectedState);
      this.clientForm.get('billingState')?.setValue(selectedState?.stateCode || null);
      const billingStateCode = selectedState?.stateCode || '';

      if (!billingStateCode) return of(null);
      console.log("billingStateCode",billingStateCode);
      return this._authservice.getCities(country, billingStateCode).pipe(
        switchMap(cities => {
          this.billingCities = cities;
          const selectedCity = cities.find((c: any) =>
            c.cityName?.toLowerCase() === cityName?.toLowerCase()
          );
          this.clientForm.get('billingCity')?.setValue(selectedCity?.cityName || null);
          const billingCityName = selectedCity?.cityName || '';

          if (!billingCityName) return of(null);

          return this._authservice.getZipCodes(
            country,
            billingStateCode,
            billingCityName
          ).pipe(
            tap(zipCodes => {
              this.billingZipCodes = zipCodes;
              const selectedZip = this.findMatchingZip(zipCodes, zipCode);
              this.clientForm.get('billingPostalCode')?.setValue(
                selectedZip?.zipCode || zipCode || ''
              );
            })
          );
        })
      );
    })
  );
}


private findMatchingZip(zipCodes: any[], zipValue: string): any {
  if (!zipValue) return null;
    return zipCodes.find(z => {
    if (z.zipCode && z.zipCode.toString() === zipValue.toString()) return true;
        if (typeof z === 'string' && z === zipValue) return true;
        if (z.code && z.code.toString() === zipValue.toString()) return true;
    if (z.postalCode && z.postalCode.toString() === zipValue.toString()) return true;
    return false;
  });
}


onUpdatePatient(): void {
  const formValue = this.clientForm.getRawValue();
  const countryDataId = formValue.postalCode?.id || 
                       this.zipCodes.find(z => z.zipCode === formValue.postalCode)?.id;
  const billingCountryId = formValue.billingSameAsCurrent
    ? countryDataId
    : formValue.billingPostalCode?.id || 
      this.billingZipCodes.find(z => z.zipCode === formValue.billingPostalCode)?.id;
  const updatePayload:any = {
    id: this.patientId,
    active: true,
    firstName: formValue.firstName,
    lastName: formValue.lastName,
    email: formValue.email,
    phoneNumber: formValue.phoneNumber,
    phoneCode: formValue.mobilePrefixCode,
    dateOfBirth: formValue.dateOfBirth ? new Date(formValue.dateOfBirth) : null,
    gender: formValue.gender,
    socialSecurityNumber: formValue.socialSecurityNumber,
    address: formValue.address,
    countryDataId: countryDataId,
    state: formValue.state?.stateCode || formValue.state,
    city: formValue.city?.cityName || formValue.city,
    zip: formValue.postalCode?.zipCode || formValue.postalCode,
    isBillingAddressSameAsAddress: formValue.billingSameAsCurrent,
    billingAddress: formValue.billingSameAsCurrent ? formValue.address : formValue.billingAddress,
    billingCountryId: billingCountryId,
    billingState: formValue.billingState?.stateCode || formValue.billingState,
    billingCity: formValue.billingCity?.cityName || formValue.billingCity,
    billingZip: formValue.billingPostalCode?.zipCode || formValue.billingPostalCode,
    emailNotification: formValue.emailNotification,
    textNotification: formValue.textNotification,
  };

  this._loader.show();
  console.log('Final Update Payload:', updatePayload);
  this._adminservice.updatepatient(updatePayload).subscribe({
    next: (response) => {
      this._toastr.success(response.message);
      this._loader.hide();
      this.clientForm.reset();
       this.router.navigate([
      '/admin/patients/list-patients'
    ]);
    },
    error: (error) => {
      this._loader.hide();
      console.error('Update failed', error);
       this._toastr.success(error.message);
    }
  });
}
private getCountryIdFromName(country: any): number | undefined {
  if (!country) return undefined;
    if (typeof country === 'number') return country;
    if (typeof country === 'string') {
    const found = this.countries.find(c => c.country === country);
    return found?.id;
  }
    if (typeof country === 'object') {
    return country.id || this.countries.find(c => c.country === country.country)?.id;
  }
  
  return undefined;
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





}
