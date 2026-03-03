import {
  ChangeDetectorRef,
  Component,
  computed,
  HostListener,
  signal,
} from '@angular/core';
import {
  AbstractControl,
  FormArray,
  FormBuilder,
  FormGroup,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { AdminService } from '../../../service/admin/admin.service';
import {
  Client,
  Billing,
  InsuranceCarrier,
} from '../../../models/useradmin-model';
import { TosterService } from '../../../service/toaster/tostr.service';
import { PopupService } from '../../../service/popup/popup-service';
import { AuthService } from '../../../service/auth/auth.service';
import { BreadcrumbService } from '../../../shared/breadcrumb/breadcrumb.service';
import { catchError, forkJoin, Observable, switchMap, tap } from 'rxjs';
import { of } from 'rxjs';
import { ActivatedRoute, Route, Router } from '@angular/router';
import { SchedulerService } from '../../../service/scheduler/scheduler.service';
import { Output, EventEmitter, inject } from '@angular/core';
import {
  ColDef,
  Column,
  GridApi,
  GridReadyEvent,
  ICellRendererParams,
} from 'ag-grid-community';
import { NavigationEnd } from '@angular/router';
import * as XLSX from 'xlsx';
import * as FileSaver from 'file-saver';
import { filter, Subscription } from 'rxjs';
import {
  AppointmentType,
  UserRole,
} from '../../../models/availability-user.model.interface';
import { Patient } from '../../../models/patients-interface';
import { PatientService } from '../../../service/patient/patients-service';
import { Insurance } from '../../../models/insurance.model';
import { MeetingTypeOption } from '../../../models/scheduler';
import { DropdownDataService } from '../../../service/dropdown/dropdown-data-service';
import { DropdownService } from '../../../service/therapist/dropdown.service';
import { InsuranceService } from '../../../service/patient/insurance.service';
import { PrimaryInsurancePayload } from '../../../models/insurance-model';

type PatientTab = 'patient-info' | 'notification';

export function emailWithComValidator(
  control: AbstractControl,
): ValidationErrors | null {
  const email = control.value;
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

  if (!email) return null;

  return emailRegex.test(email) ? null : { invalidComEmail: true };
}

export interface PatientFileDto {
  id: string;
  patientId: string;
  patientName: string;
  fileName: string;
  originalFileName: string;
  fileType: string;
  mimeType: string;
  fileSizeFormatted: string;
  s3Url: string;
  category: string;
  description?: string;
  tags?: string;
  isActive: boolean;
  isConfidential: boolean;
  createdAt: string;
  createdByName: string;
}
@Component({
  selector: 'app-add-patients',
  standalone: false,
  templateUrl: './add-patients.component.html',
  styleUrl: './add-patients.component.scss',
})
export class AddPatientsComponent {
  patientsInusranceForm!: FormGroup;
  tabs: PatientTab[] = ['patient-info', 'notification'];
  selectedTab: PatientTab = 'patient-info';
  public SwitchTab: 'ListPatients' | 'AddPatients' | 'Patientfiles' =
    'ListPatients';
  isshowpopup: boolean = false;
  clientForm!: FormGroup;
  clientFormSubmitted: boolean = false;
  patientId: any;
  countries: any[] = [];
  states: any[] = [];
  cities: any[] = [];
  zipCodes: any[] = [];
  BillingCountry: string = '';
  billingStates: any[] = [];
  billingCities: any[] = [];
  billingZipCodes: any[] = [];

  get_CountryCode!: string;
  selectedCountry: string = '';
  selectedCountryCode: string = '';
  selectedStateCode!: string | null | undefined;
  selectedCity!: string | null | undefined;

  insuranceCarriers: any[] = [];
  isEditMode = false;
  selectedPatientId: string | null = null;
  isAdd: boolean = false;
  actionType: 'Add' | 'Update' = 'Add';

  patientsInsurances = signal<any[]>([]);
  showScheduleModal = signal(false);
  isBooking = signal(false);
  selectedPatient = signal<any | null>(null);
  patientsModelList = signal<Patient[]>([]);

  currentDate = signal(new Date());

  @Output() editPatientClicked = new EventEmitter<any>();
  private subscriptions = new Subscription();

  private fb = inject(FormBuilder);

  //  columnDefs: ColDef[] = [
  //   {
  //     headerCheckboxSelection: true,
  //     checkboxSelection: true,
  //     field: 'checkbox',
  //     width: 40,
  //     pinned: 'left',
  //     cellClass: 'no-focus-style'
  //   },
  //   {
  //     headerName: 'First Name',
  //     field: 'firstName',
  //     flex: 1.2,
  //     cellRenderer: (params: any) => {
  //       return `
  //         <div class="flex items-center gap-2">
  //           <img src="${params.data.avatar}" class="rounded-full w-8 h-8" />
  //           <span>${params.value}</span>
  //         </div>
  //       `;
  //     },
  //   },
  //   { field: 'lastName', headerName: 'Last Name', sortable: true, flex: 1 },
  // {
  //     headerName: 'Mobile',
  //     field: 'phoneNumber',
  //     flex: 1,
  //     cellRenderer: (params: any) =>
  //       `<i class="fa fa-phone text-green-600 mr-1"></i> ${params.value}`,
  // },
  // { field: 'email', headerName: 'Email', sortable: true, flex: 1 },
  // // { field: 'socialSecurityNumber', headerName: 'SSN', sortable: true, flex: 1 },
  // {
  //     field: 'dateOfBirth',
  //     headerName: 'DOB',
  //     sortable: true,
  //     flex: 1,
  //     valueFormatter: params => this.formatDate(params.value)
  // },
  // { field: 'gender', headerName: 'Gender', sortable: true, flex: 1 },
  // {
  //     headerName: 'Assessment',
  //     flex: 0.8,
  //     cellRenderer: (params: ICellRendererParams) => {
  //       console.log("params",params.data.assessmentId);
  //       const hasAssessment = params.data.hasAssessment;
  //       const assessmentId = params.data.assessmentId;
  //       const borderColor = hasAssessment ? 'green' : 'red';

  //       return `
  //         <button class="assessment-btn"
  //                 data-id="${assessmentId}"
  //                 style="border: 2px solid ${borderColor};
  //                        padding: 4px;
  //                        border-radius: 50%;
  //                        background: transparent;
  //                        cursor: pointer;
  //                        display: flex;
  //                        align-items: center;
  //                        justify-content: center;
  //                        width: 32px;
  //                        height: 32px;
  //                        margin-top: 5px;">
  //           <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
  //             <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3"/>
  //           </svg>
  //         </button>
  //       `;
  //     },
  //     sortable: false
  // },
  // {
  //   field: 'quickBookSync',
  //   headerName: 'QuickBook Sync',
  //   sortable: true,
  //   flex: 1,
  //   cellRenderer: (params: any) => {
  //     if (!params.value) {
  //       return `
  //         <button class="sync-btn text-white bg-red-500 hover:bg-red-600 px-2 py-1 rounded text-sm">
  //           Sync Now
  //         </button>
  //       `;
  //     }
  //     return '';
  //   }
  // }

  // ,
  // {
  //     headerName: 'Actions',
  //     field: 'actions',
  //     flex: 1,
  //     pinned: 'right',
  //     cellRenderer: (params: ICellRendererParams) => {
  //       return `
  //         <div class="flex gap-2">
  //           <button class="text-primary-border-color hover:underline" data-action="edit" title="Edit">
  //             <i class="fa fa-edit text-lg"></i>
  //           </button>
  //           <button class="text-primary-border-color hover:underline" data-action="delete" title="Delete">
  //             <i class="fa fa-trash text-lg"></i>
  //           </button>
  //         </div>
  //       `;
  //     },
  //     sortable: false
  // }
  // ];

  columnDefs: ColDef[] = [
    // S.No Column
    {
      headerName: 'S.No',
      valueGetter: 'node.rowIndex + 1',
      maxWidth: 100,
      cellStyle: { textAlign: 'center' },
    },

    // Patient Column (Avatar + Name + Age)
    {
      headerName: 'Patient',
      field: 'firstName',
      cellRenderer: (params: any) => {
        const firstName = params.data.firstName;
        const lastName = params.data.lastName;
        const age = params.data.age;

        return `
          <div style="display:flex; align-items:center; gap:10px;">
            <div style="
              width:30px;
              height:30px;
              border-radius:50%;
              background:#fb923c;
              color:white;
              display:flex;
              align-items:center;
              justify-content:center;
              font-weight:600;">
              ${firstName?.charAt(0)}${lastName?.charAt(0)}
            </div>
            <div style="font-weight:500;">
              ${firstName} ${lastName}
            </div>
          </div>
        `;
      },
    },

    // Contact Column
    {
      headerName: 'Contact',
      autoHeight: true,
      wrapText: true,
      cellRenderer: (params: any) => {
        return `
          <div>
            <div>${params.data.email}</div>
            <div style="font-size:12px; color:gray;margin-bottom: 15px;line-height: 1;">
              ${this.formatPhone(params.data.phoneNumber)}
            </div>
          </div>
        `;
      },
    },

    // Status Column
    {
      headerName: 'Status',
      field: 'active',
      headerClass: 'ag-header-center',
      cellRenderer: (params: any) => {
        const isActive = params.value;
        return `
          <span style="
            padding:4px 8px;
            border-radius:9999px;
            font-size:12px;
            background:${isActive ? '#d1fae5' : '#f3f4f6'};
            color:${isActive ? '#065f46' : '#374151'};
          ">
            ${isActive ? 'Active' : 'Inactive'}
          </span>
        `;
      },
      cellStyle: { textAlign: 'center' },
    },

    // Actions Column
    {
      headerName: 'Actions',
      minWidth: 160,
      headerClass: 'ag-header-center',
      cellRenderer: (params: any) => {
        const container = document.createElement('div');
        container.style.display = 'flex';
        container.style.justifyContent = 'center';
        container.style.alignItems = 'center';
        container.style.gap = '12px';

        const createIconButton = (
          icon: string,
          title: string,
          onClick: () => void,
          color: string,
        ) => {
          const button = document.createElement('button');
          button.innerHTML = icon;
          button.title = title;

          button.style.border = 'none';
          button.style.background = 'none';
          button.style.cursor = 'pointer';
          button.style.padding = '6px';
          button.style.borderRadius = '6px';
          button.style.color = color; // 👈 icon color
          button.style.display = 'flex';
          button.style.alignItems = 'center';
          button.style.justifyContent = 'center';

          button.onmouseenter = () => {
            button.style.backgroundColor = '#f3f4f6';
          };
          button.onmouseleave = () => {
            button.style.backgroundColor = 'transparent';
          };

          button.onclick = onClick;

          return button;
        };

        // Assign Icon (only for admin)
        if (this.isClientAdmin) {
          container.appendChild(
            createIconButton(
              `<svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
            <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2"/>
            <path d="M9 5a2 2 0 104 0h-4z"/>
            <path d="M9 14l2 2 4-4"/>
          </svg>`,
              'Assign Therapist',
              () => this.assignDetails(params.data),
              '#7c3aed',
            ),
          );
        }

        // View Icon
        container.appendChild(
          createIconButton(
            `<svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
          <path d="M15 12a3 3 0 11-6 0 3 3 0 016 0"/>
          <path d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
        </svg>`,
            'View Details',
            () => this.viewPatientDetails(params.data),
            '#2563eb',
          ),
        );

        // Edit Icon
        container.appendChild(
          createIconButton(
            `<svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
          <path d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5"/>
          <path d="M17.414 2.586a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
        </svg>`,
            'Edit Patient',
            () => this.onEditAction(params.data.id),
            '#f59e0b',
          ),
        );

        // Schedule Icon
        container.appendChild(
          createIconButton(
            `<svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
          <path d="M8 7V3m8 4V3m-9 8h10"/>
          <path d="M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
        </svg>`,
            'Schedule Appointment',
            () => this.scheduleNow(params.data.id),
            '#16a34a',
          ),
        );

        return container;
      },
    },
  ];

  scheduleForm: FormGroup = this.fb.group({
    appointmentType: [AppointmentType.THERAPY_SESSION, Validators.required],
    title: [''],
    notes: [''],
    meetingTypeInput: [''],
  });
  uploadForm!: FormGroup;

  gridApi!: GridApi;
  // Add pagination propertiespaginationPageSize = 10;
  //   gridColumnApi!: Column; paginationPageSize = 10;

  // paginationPageSizeSelector: number[] | boolean = [10, 20, 50, 100];

  isLoading = signal(false);
  constructor(
    private _toastr: TosterService,
    private _loader: PopupService,
    private breadcrumbService: BreadcrumbService,
    private route: ActivatedRoute,
    private cdRef: ChangeDetectorRef,
    private router: Router,
  ) {
    window.addEventListener('patientAction', (event: any) => {
      const patientId = event.detail;
      this.onActionClick(patientId);
    });
  }
  private _adminservice = inject(AdminService);
  private _authservice = inject(AuthService);
  currentUser!: string;
  isTherapist!: boolean;
  isClientAdmin!: boolean;

  //   isTherapist = computed(() => {
  //   console.log('Checking role for Therapist:', this.currentUser());
  //   return this.currentUser() === UserRole.THERAPIST;
  // });

  // isClientAdmin = computed(() => {
  //   console.log('Checking role for Client Admin:', this.currentUser());
  //   return this.currentUser() === UserRole.CLIENT_ADMIN;
  // });

  ngAfterViewChecked(): void {
    this.updateSlider();
  }

  isSoloProvider!: boolean;
  files: PatientFileDto[] = [];
  filteredFiles: PatientFileDto[] = [];
  searchTerm = '';
  loading = true;

  onActionClick(patientId: string) {
    console.log('Clicked patient:', patientId);
    // open menu / navigate / open modal here
  }

  ngOnInit(): void {
    debugger;
    this.route.queryParams.subscribe((params) => {
      if (params['tab']) {
        this.SwitchTab = params['tab'];
      }
    });

    this.currentUser = this._authservice.getUserRole();
    this.isTherapist = this.currentUser === UserRole.THERAPIST;
    this.isClientAdmin = this.currentUser === UserRole.CLIENT_ADMIN;
    // console.log('Current User Role:', this.currentUser);
    const getUserRole: any = this._authservice.getUserRole();
    this.isTherapists = getUserRole === 'Therapist';
    this._authservice.soloProvider$.subscribe((isSolo) => {
      this.isSoloProvider = isSolo;
      // console.log("isSoloProvider",this.isSoloProvider);
    });

    // this.getInsuranceByPatientId();

    this.getInsurancePlan();
    this.loadPatientsList();
    this.getInsuranceCarrier();
    this.loadInsurances();
    this.getTherapist();
    this.getItems();
    this.getDiagnosis();
    //  this.fetchDropdownOptions('AppointmentType');
    this.fetchDropdownOptions('MeetingType');
    this.loadFiles();

    this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe(() => {
        this.loadPatientsList();
      });
    this.uploadForm = this.fb.group({
      files: [null],
    });

    this.patientId = this.route.snapshot.paramMap.get('id');
    if (this.patientId) {
      this.isEditMode = true;
      this.editPatient(this.patientId);
      console.log('patientIdpatientIdpatientId', this.patientId);
    }
    this.clientForm = this.fb.group({
      patientCode: [''],
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      email: [
        '',
        [Validators.required, Validators.email, emailWithComValidator],
      ],
      phoneNumber: [null, [Validators.required]],
      dateOfBirth: ['', Validators.required],
      gender: ['', Validators.required],
      socialSecurityNumber: [''],
      country: ['', Validators.required],
      state: ['', Validators.required],
      city: ['', Validators.required],
      phoneCode: [''],
      postalCode: ['', Validators.required],
      billingCountry: ['', Validators.required],
      billingState: ['', Validators.required],
      billingCity: ['', Validators.required],
      billingPostalCode: ['', Validators.required],
      address: ['', Validators.required],
      // code: ['', Validators.required],
      // diagnosisId:[''],
      // dateDiagnosed: ['', Validators.required],
      // countryDataId: [null],
      billingAddress: ['', Validators.required],
      billingCountryId: [null],
      billingSameAsCurrent: [false],
      emailNotification: [false],
      textNotification: [false],
    });

    this.patientsInusranceForm = this.fb.group({
      provider: ['', Validators.required],
      policyNumber: ['', Validators.required],
      groupNumber: [''],
      subscriberId: ['', Validators.required],
      subscriberName: ['', Validators.required],
      subscriberDateOfBirth: ['', Validators.required],
      relationshipToSubscriber: ['self', Validators.required],
      effectiveDate: ['', Validators.required],
      expirationDate: [''],
      copay: [''],
      deductible: [''],
      coinsurance: [''],
      outOfPocketMax: [''],
      visitLimit: [''],
      planType: ['ppo', Validators.required],
      networkStatus: ['in-network', Validators.required],
      authorizationRequired: [false],
      referralRequired: [false],
      mentalHealthCoverage: [true],
      notes: [''],

      authNumber: [''],
      startDate: [''],
      endDate: [''],
      authNotes: [''],
      active: ['true'],

      services: this.fb.array([this.createServiceGroup()]),
    });

    this.getCountries();
    const isEdit = !!this.patientId;

    this.breadcrumbService.setBreadcrumbs([
      {
        label: isEdit ? 'Edit Patients' : 'Patients',
        url: 'patients/add-patients',
      },
    ]);
    this.breadcrumbService.setVisible(true);

    //if (isEdit) {
    //  this.editPatient(this.patientId);
    //}
    // this.breadcrumbService.setVisible(true);

    this.clientForm
      .get('billingSameAsCurrent')
      ?.valueChanges.subscribe((value) => {
        this.onBillingSameToggle();
      });

    this.clientForm.get('address')?.valueChanges.subscribe((address) => {
      const billingSameAsCurrent = this.clientForm.get(
        'billingSameAsCurrent',
      )?.value;
      if (billingSameAsCurrent) {
        this.clientForm
          .get('billingAddress')
          ?.setValue(address, { emitEvent: false });
      }
    });
  }
  DiagnosisArr: any[] = [];
  get isUserTherapist(): boolean {
    return this._authservice.getUserRole() === UserRole.THERAPIST;
  }

  get isUserClientAdmin(): boolean {
    return this._authservice.getUserRole() === UserRole.CLIENT_ADMIN;
  }

  defaultColDef = {
    sortable: true,
    filter: false,
    resizable: true,
    flex: 1,
  };

  onBillingSameToggle() {
    const isSame = this.clientForm.get('billingSameAsCurrent')?.value;
    console.log('[1] Toggle changed. isSame:', isSame);

    const billingFields = [
      'billingAddress',
      'billingCountry',
      'billingState',
      'billingCity',
      'billingPostalCode',
    ];

    if (isSame) {
      const primaryValues = {
        address: this.clientForm.get('address')?.value,
        country: this.clientForm.get('country')?.value,
        state: this.clientForm.get('state')?.value,
        city: this.clientForm.get('city')?.value,
        postalCode: this.clientForm.get('postalCode')?.value,
      };

      this.billingStates = [...this.states];
      this.billingCities = [...this.cities];
      this.billingZipCodes = [...this.zipCodes];

      console.log('[4] Billing dropdowns refreshed:', {
        states: this.billingStates.length,
        cities: this.billingCities.length,
        zips: this.billingZipCodes.length,
      });

      // FIX: Use objects instead of strings/codes
      const matchedValues = {
        country: primaryValues.country, // Already an object

        state: primaryValues.state, // Already an object

        city: primaryValues.city, // Already an object

        postal: primaryValues.postalCode, // Use the actual postalCode value
      };

      console.log('[5] Matched Objects:', matchedValues);

      // FIX: Patch with objects directly
      this.clientForm.patchValue(
        {
          billingAddress: primaryValues.address,
          billingCountry: matchedValues.country,
          billingState: matchedValues.state,
          billingCity: matchedValues.city,
          billingPostalCode: matchedValues.postal, // Use the postal code directly
        },
        { emitEvent: false },
      );

      this.cdRef.detectChanges();

      console.log('[6] Patched values:', {
        country: this.clientForm.get('billingCountry')?.value,
        state: this.clientForm.get('billingState')?.value,
        city: this.clientForm.get('billingCity')?.value,
        postal: this.clientForm.get('billingPostalCode')?.value,
      });

      billingFields.forEach((control) => {
        this.clientForm.get(control)?.disable({ emitEvent: false });
      });

      // FIX: Add a small delay to ensure dropdowns are updated
      setTimeout(() => {
        console.log(
          '[7] After timeout - billingPostalCode:',
          this.clientForm.get('billingPostalCode')?.value,
        );
        console.log(
          '[7] After timeout - billingZipCodes:',
          this.billingZipCodes,
        );
      }, 0);
    } else {
      billingFields.forEach((control) => {
        this.clientForm.get(control)?.enable({ emitEvent: false });
      });
      this.clientForm.patchValue(
        {
          billingAddress: '',
          billingCountry: null,
          billingState: null,
          billingCity: null,
          billingPostalCode: null,
        },
        { emitEvent: false },
      );

      this.billingStates = [];
      this.billingCities = [];
      this.billingZipCodes = [];
    }
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
    const country = this.clientForm.get('country')?.value;
    if (!country) return;

    this.selectedCountry = country?.country ?? country;
    this.selectedCountryCode = country?.mobilePrefixCode;
    this.get_CountryCode = country?.mobilePrefixCode;

    this.clientForm.get('phoneCode')?.setValue(this.get_CountryCode);

    console.log('✅ selectedCountry =', this.selectedCountry);

    this.getStates();
    this.cities = [];
    this.zipCodes = [];

    // ✅ Auto-update billing when same as current
    if (this.clientForm.get('billingSameAsCurrent')?.value) {
      this.copyPrimaryToBilling();
    }
  }

  onStateChange() {
    debugger;
    this.selectedStateCode = this.clientForm.value.billingState;
    this.getCities();
    this.zipCodes = [];
  }

  onCityChange() {
    debugger;
    this.selectedCity = this.clientForm.value.billingCity;
    this.getZipCodes();
  }

  onAddressStateChange() {
    const state = this.clientForm.get('state')?.value;

    console.log('📌 Raw state value:', state);

    this.selectedStateCode =
      state?.stateCode ??
      state?.code ??
      (typeof state === 'string' ? state : null);

    console.log('✅ selectedStateCode =', this.selectedStateCode);

    this.selectedCity = null;
    this.clientForm.get('city')?.setValue(null);

    this.zipCodes = [];
    this.clientForm.get('postalCode')?.setValue(null);

    this.getCities();

    // ✅ Auto-update billing when same as current
    if (this.clientForm.get('billingSameAsCurrent')?.value) {
      this.copyPrimaryToBilling();
    }
  }

  onAddressCityChange() {
    const city = this.clientForm.get('city')?.value;

    this.selectedCity =
      city?.cityName ??
      city?.city ??
      (typeof city === 'string' ? city : undefined);

    console.log('✅ selectedCity =', this.selectedCity);

    // ✅ Auto-update billing City/State/Country/Address (not ZIP)
    if (this.clientForm.get('billingSameAsCurrent')?.value) {
      this.billingStates = [...this.states];
      this.billingCities = [...this.cities];

      this.clientForm.patchValue({
        billingCountry: this.clientForm.get('country')?.value,
        billingState: this.clientForm.get('state')?.value,
        billingCity: this.clientForm.get('city')?.value,
        billingAddress: this.clientForm.get('address')?.value,
        // ❌ DO NOT update ZIP here
      });

      console.log(
        '✅ Billing City auto-updated:',
        this.clientForm.get('billingCity')?.value,
      );
    }

    // ✅ Now load ZIP API, which will update billing ZIP
    this.getZipCodes();
  }

  onBillingCountryChange() {
    debugger;
    const selectedCountryObj = this.clientForm.get('billingCountry')?.value;
    const countryName = selectedCountryObj?.country;
    if (!countryName) return;

    this._authservice.getStates(countryName).subscribe((states) => {
      this.billingStates = states.data;
      this.clientForm.get('billingState')?.reset();
      this.clientForm.get('billingCity')?.reset();
      this.clientForm.get('billingPostalCode')?.reset();
      this.billingCities = [];
      this.billingZipCodes = [];
    });
  }

  onBillingStateChange() {
    debugger;
    const selectedCountryObj = this.clientForm.get('billingCountry')?.value;
    const selectedStateCode =
      this.clientForm.get('billingState')?.value?.stateCode;
    const selectedCountry = selectedCountryObj?.country;
    if (!selectedCountry || !selectedStateCode) return;
    this._authservice
      .getCities(selectedCountry, selectedStateCode)
      .subscribe((cities) => {
        this.billingCities = cities.data;
        this.clientForm.get('billingCity')?.reset();
        this.clientForm.get('billingPostalCode')?.reset();
        this.billingZipCodes = [];
      });
  }

  onBillingCityChange() {
    debugger;
    const selectedCountryObj = this.clientForm.get('billingCountry')?.value;
    const selectedStateCode =
      this.clientForm.get('billingState')?.value?.stateCode;
    const selectedCity = this.clientForm.get('billingCity')?.value?.cityName;
    const countryName = selectedCountryObj?.country;

    if (!countryName || !selectedStateCode || !selectedCity) return;

    this._authservice
      .getZipCodes(countryName, selectedStateCode, selectedCity)
      .subscribe((zips) => {
        console.log('Billing zips:', zips);
        this.billingZipCodes = zips.data;
        this.clientForm.get('billingPostalCode')?.reset();
      });
  }

  getCountries() {
    this._authservice.getCountries().subscribe((res) => {
      this.countries = res.data;
    });
  }

  getStates() {
    if (this.selectedCountry) {
      this._authservice.getStates(this.selectedCountry).subscribe((res) => {
        this.states = res.data;
      });
    }
  }

  getCities() {
    if (this.selectedCountry && this.selectedStateCode) {
      // Extract state code safely with proper type checking
      let stateCode: string;

      if (
        typeof this.selectedStateCode === 'object' &&
        this.selectedStateCode !== null
      ) {
        // Check if it has stateCode property
        stateCode =
          (this.selectedStateCode as any).stateCode ||
          (this.selectedStateCode as any).code ||
          this.selectedStateCode;
      } else {
        stateCode = this.selectedStateCode as string;
      }

      console.log('📡 Calling cities API with:', {
        country: this.selectedCountry,
        stateCode: stateCode,
        originalStateCode: this.selectedStateCode,
      });

      this._authservice.getCities(this.selectedCountry, stateCode).subscribe({
        next: (res) => {
          console.log('✅ Cities API Response:', res);
          console.log('📊 Cities data received:', res.data);
          console.log('📈 Cities array length:', res.data?.length);

          this.cities = res.data;

          console.log('🏙️ Cities array after assignment:', this.cities);
          console.log(
            '🏙️ Cities array length after assignment:',
            this.cities?.length,
          );

          if (!this.cities || this.cities.length === 0) {
            console.warn('⚠️ Cities array is empty after API call');
          } else {
            console.log('✅ Cities loaded successfully');
          }
        },
        error: (error) => {
          console.error('❌ Cities API Error:', error);
        },
        complete: () => {
          console.log('🏁 Cities API call completed');
        },
      });
    } else {
      console.warn('⚠️ Cannot call getCities() - missing required parameters');
      this.cities = [];
    }
  }

  getZipCodes() {
    console.log('📮 getZipCodes() called');
    console.log('🔍 Current state:', {
      selectedCountry: this.selectedCountry,
      selectedStateCode: this.selectedStateCode,
      selectedCity: this.selectedCity,
      selectedStateCodeType: typeof this.selectedStateCode,
      selectedCityType: typeof this.selectedCity,
    });

    if (this.selectedCountry && this.selectedStateCode && this.selectedCity) {
      // Extract state code safely
      let stateCode: string;
      if (
        typeof this.selectedStateCode === 'object' &&
        this.selectedStateCode !== null
      ) {
        stateCode =
          (this.selectedStateCode as any).stateCode ||
          (this.selectedStateCode as any).code ||
          String(this.selectedStateCode);
      } else {
        stateCode = this.selectedStateCode as string;
      }

      // Extract city name safely
      let cityName: string;
      if (typeof this.selectedCity === 'object' && this.selectedCity !== null) {
        cityName =
          (this.selectedCity as any).cityName ||
          (this.selectedCity as any).city ||
          (this.selectedCity as any).name ||
          String(this.selectedCity);
      } else {
        cityName = this.selectedCity as string;
      }

      console.log('📡 Calling zip codes API with:', {
        country: this.selectedCountry,
        stateCode: stateCode,
        city: cityName,
        originalStateCode: this.selectedStateCode,
        originalCity: this.selectedCity,
      });

      this._authservice
        .getZipCodes(this.selectedCountry, stateCode, cityName)
        .subscribe({
          next: (res) => {
            this.zipCodes = res.data || [];

            console.log('✅ ZIP API loaded:', this.zipCodes);

            // ✅ Update PRIMARY postalCode
            const primaryZip = this.zipCodes.length ? this.zipCodes[0] : null;
            if (primaryZip) {
              this.clientForm.patchValue({ postalCode: primaryZip });
            }

            // ✅ Auto-update billing ZIP AFTER API returns
            if (this.clientForm.get('billingSameAsCurrent')?.value) {
              this.billingZipCodes = [...this.zipCodes];
              this.clientForm.patchValue({ billingPostalCode: primaryZip });

              console.log('✅ Billing ZIP auto-updated:', primaryZip);
            }
          },
        });
    } else {
      // console.warn('⚠️ Cannot call getZipCodes() - missing required parameters:', {
      //   hasCountry: !!this.selectedCountry,
      //   hasStateCode: !!this.selectedStateCode,
      //   hasCity: !!this.selectedCity
      // });

      // Clear zip codes if missing parameters
      this.zipCodes = [];
      // console.log('🗑️ Zip codes cleared due to missing parameters');
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
      notification: 1,
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
    if (this.clientForm.invalid && this.patientId == null) {
      this.clientFormSubmitted = true;
      this.selectedTab = 'patient-info';
      return;
    }
    if (this.patientId != null || undefined) {
      console.log('Performing update');
      this.onUpdatePatient();
      return;
    }

    console.log(
      'this.patientsInusranceForm.value',
      this.patientsInusranceForm.value,
    );
    const formValue = this.clientForm.getRawValue();
    console.log('this.clientForm.value', this.clientForm.value);

    const selectedZip = this.zipCodes.find(
      (zip: any) => zip.zipCode === formValue.postalCode,
    );
    const selectedBillingZip = this.billingZipCodes.find(
      (zip: any) => zip.zipCode === formValue.billingPostalCode,
    );
    const payload: any = {
      clientId: this._authservice.getClientId(),
      firstName: formValue.firstName,
      lastName: formValue.lastName,
      email: formValue.email,
      phoneNumber: formValue.phoneNumber,
      dateOfBirth: formValue.dateOfBirth,
      gender: formValue.gender,
      socialSecurityNumber: formValue.socialSecurityNumber,
      address: formValue.address,
      billingAddress: formValue.billingSameAsCurrent
        ? formValue.address
        : formValue.billingAddress,
      countryDataId: formValue.postalCode?.id || 0,
      billingCountryId: formValue.billingSameAsCurrent
        ? formValue.postalCode?.id || 0
        : formValue.billingPostalCode?.id || 0,
      emailNotification: formValue.emailNotification,
      textNotification: formValue.textNotification,
      isBillingAddressSameAsAddress: formValue.billingSameAsCurrent,
      // diagnoses: [
      //   {
      //     diagnosisId: formValue.code,
      //     dateDiagnosed: formValue.dateDiagnosed
      //       ? new Date(formValue.dateDiagnosed).toISOString()
      //       : null,
      //   },
      // ],
    };

    delete payload.billingSameAsCurrent;
    this._loader.show();
    this._adminservice.AddPatients(payload).subscribe({
      next: (res: Client) => {
        console.log('saveForm', res.message);
        this._toastr.success(res.message || 'Successfully added!');
        this.loadPatientsList();
        this._loader.hide();
        this.clientForm.reset();
        this.clientForm.patchValue({
          emailNotification: false,
          textNotification: false,
        });
        // this.clientFormSubmitted = false;
        this.SwitchTab = 'ListPatients';
        // window.location.reload();
      },
      error: (err: any) => {
        const errorMessage =
          err?.error?.Fault?.Error?.[0]?.Message || 'An unknown error occurred';
        this._toastr.error(errorMessage);
        this._loader.hide();
      },
    });
  }

  updateSlider() {
    setTimeout(() => {
      const tabs = document.querySelectorAll('.tab');
      const slider = document.querySelector('.slider') as HTMLElement;
      const activeTab = Array.from(tabs).find((tab) =>
        tab.classList.contains('active'),
      ) as HTMLElement;
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
    debugger;

    // this.isEditMode = true;
    this.patientId = id;
    this.actionType = 'Update';
    //   console.log('EditPatient - Setting edit modssse:', {
    //   isEditMode: this.isEditMode,
    //   patientId: this.patientId,
    //   actionType: this.actionType
    // });
    forkJoin([
      this._authservice.getCountries(),
      this._adminservice.getPatientById(id),
    ])
      .pipe(
        switchMap(([countries, patient]: [any, any]) => {
          if (!patient) {
            throw new Error('Patient not found');
          }
          this.countries = countries.data;
          this.selectedCountry = patient.data;
          const selectedCountry = countries.find(
            (c: any) => c.country === patient.data.country,
          );
          const billingCountry = this.countries.find(
            (c: any) => c.country === (patient.data.billingCountry as string),
          );

          // console.log('Patient billing country ID:', patient.data.billingCountryId);
          // console.log('Patient billing country IDPatient billing country IDPatient billing country ID', patient.data);
          // console.log('Matched billing country:', billingCountry.data);

          // console.log('Patient country:', patient.data.country);
          // console.log('Available countries:', countries);
          // console.log('Selected country:', selectedCountry);

          const formattedDob = patient.data.dateOfBirth
            ? (patient.data.dateOfBirth as string).split('T')[0]
            : null;
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
            billingCountry:
              billingCountry?.country || patient.data.billingCountry || '',
            socialSecurityNumber: patient.data.socialSecurityNumber as string,
            textNotification: patient.data.textNotification as boolean,
            emailNotification: patient.data.emailNotification as boolean,
            billingSameAsCurrent: patient.data
              .isBillingAddressSameAsAddress as boolean,
            billingCountryId: patient.data.billingCountryId,
          };
          console.log('Patching initial values:', initialValues);
          this.clientForm.patchValue(initialValues);
          console.log('Loading primary address dropdowns...');
          return this.loadAddressDropdowns(
            patient.data.country as string,
            patient.data.state as string,
            patient.data.city as string,
            patient.data.zip as string,
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
                  billingPostalCode: this.clientForm.get('postalCode')?.value,
                };
                console.log('Copying billing values:', billingValues);

                this.clientForm.patchValue(billingValues);
              } else {
                console.log('Loading separate billing address dropdowns');
                return this.loadBillingAddressDropdowns(
                  patient.data.billingCountry as string,
                  patient.data.billingState as string,
                  patient.data.billingCity as string,
                  patient.data.billingZip as string,
                );
              }
              return of(null);
            }),
          );
        }),
      )
      .subscribe({
        next: () => {
          console.log('Patient edit initialization complete');
          this.isEditMode = true;
          this.isAdd = true;
          this.actionType = 'Update';

          if (this.clientForm.get('billingSameAsCurrent')?.value) {
            console.log('Disabling billing fields');
            [
              'billingAddress',
              'billingCountry',
              'billingState',
              'billingCity',
              'billingPostalCode',
            ].forEach((control) => this.clientForm.get(control)?.disable());
          }
          console.log('Final form state after edit:', {
            billingSameAsCurrent: this.clientForm.get('billingSameAsCurrent')
              ?.value,
            billingCountry: this.clientForm.get('billingCountry')?.value,
            billingPostalCode: this.clientForm.get('billingPostalCode')?.value,
            billingStates: this.billingStates.length,
            billingZipCodes: this.billingZipCodes.length,
          });
        },
        error: (error) => {
          console.error('Error loading patient data:', error);
        },
      });
  }

  private loadPrimaryAddressThenBilling(patientData: any): void {
    console.log('Loading primary address dropdowns...');

    this.loadAddressDropdowns(
      patientData.country,
      patientData.state,
      patientData.city,
      patientData.zip,
    ).subscribe({
      next: () => {
        console.log('Primary address dropdowns loaded');

        // Update the form with the actual state/city/zip objects
        this.updateFormWithAddressObjects(patientData);

        // Handle billing address
        if (patientData.isBillingAddressSameAsAddress) {
          this.handleSameBillingAddress(patientData);
        } else {
          this.handleSeparateBillingAddress(patientData);
        }
      },
      error: (error) => {
        console.error('Error loading primary address dropdowns:', error);
        this.finalizeEditMode();
      },
    });
  }

  // --------------------------
  // Load states → cities → zip codes
  // --------------------------
  private loadAddressDropdowns(
    countryName: string,
    stateName: string,
    cityName: string,
    zipCode: string,
  ): Observable<any> {
    return this._authservice.getStates(countryName).pipe(
      switchMap((statesRes: any) => {
        this.states = statesRes.data || statesRes || [];
        console.log('📌 Available primary states:', this.states);

        const selectedState = this.states.find(
          (s: any) =>
            s.stateName === stateName ||
            s.state === stateName ||
            s.name === stateName,
        );

        if (!selectedState) {
          console.warn('❌ Primary state not found:', stateName);
        }

        // ✅ Patch state object
        this.clientForm.patchValue({
          state: selectedState || null,
        });

        const stateParam = selectedState?.stateCode || stateName;

        // ✅ Load cities
        return this._authservice.getCities(countryName, stateParam).pipe(
          switchMap((citiesRes: any) => {
            this.cities = citiesRes.data || citiesRes || [];
            console.log('📍 Available primary cities:', this.cities);

            const selectedCity = this.cities.find(
              (city: any) =>
                city.cityName?.toLowerCase() === cityName?.toLowerCase(),
            );

            // ✅ Patch city object
            this.clientForm.patchValue({
              city: selectedCity || null,
            });

            // ✅ IMPORTANT FIX: Load ZIP API here
            return this.loadZipCodes(
              countryName,
              stateParam,
              cityName,
              zipCode,
              false, // primary address
            );
          }),
          catchError((error) => {
            console.error('Error loading primary cities:', error);
            return of(true);
          }),
        );
      }),
      catchError((error) => {
        console.error('Error loading primary states:', error);
        return of(null);
      }),
    );
  }

  // --------------------------
  // Process city & zip code patch
  // --------------------------
  private processCitiesData(
    cityName: string,
    zipCode: string,
    stateObj: any,
  ): void {
    if (!Array.isArray(this.cities)) this.cities = [];

    const selectedCity = this.cities.find(
      (city: any) =>
        city.cityName?.toLowerCase() === cityName?.toLowerCase() ||
        city.city?.toLowerCase() === cityName?.toLowerCase() ||
        city.name?.toLowerCase() === cityName?.toLowerCase(),
    );

    // Patch city as object or fallback
    this.clientForm.patchValue({
      city: selectedCity || { cityName: cityName },
    });

    // Patch zip as object
    const selectedZip = this.zipCodes?.find(
      (z: any) => z.zipCode === zipCode,
    ) || { zipCode: zipCode };
    this.clientForm.patchValue({ postalCode: selectedZip });

    console.log('📍 Patched primary address objects:', {
      state: stateObj,
      city: selectedCity || { cityName: cityName },
      postalCode: selectedZip,
    });
  }

  private updateFormWithAddressObjects(patientData: any): void {
    // 1️⃣ Find actual state object
    const selectedStateObj = this.states.find(
      (state: any) =>
        state.stateName === patientData.state ||
        state.state === patientData.state ||
        state.name === patientData.state,
    ) || { stateName: patientData.state, stateCode: '' };

    // 2️⃣ Find actual city object
    let selectedCityObj = this.cities.find(
      (city: any) =>
        city.cityName?.toLowerCase().trim() ===
          patientData.city?.toLowerCase().trim() ||
        city.city?.toLowerCase().trim() ===
          patientData.city?.toLowerCase().trim() ||
        city.name?.toLowerCase().trim() ===
          patientData.city?.toLowerCase().trim(),
    );

    if (!selectedCityObj) {
      selectedCityObj = { cityName: patientData.city };
      this.cities.push(selectedCityObj);
    }

    // 3️⃣ Find actual postal code object
    let selectedZipObj = this.zipCodes.find(
      (zip: any) => zip.zipCode === patientData.zip || zip === patientData.zip,
    );

    if (!selectedZipObj) {
      selectedZipObj = { zipCode: patientData.zip };
      this.zipCodes.push(selectedZipObj);
    }

    console.log('📍 Patched primary address objects:', {
      state: selectedStateObj,
      city: selectedCityObj,
      postalCode: selectedZipObj,
    });

    // ✅ ✅ ✅ 4️⃣ ***THIS IS THE MISSING FIX***
    // Manually set selectedStateCode and selectedCity (change event DOES NOT fire during edit)
    this.selectedStateCode =
      selectedStateObj?.stateCode ??
      selectedStateObj?.code ??
      patientData.state;

    this.selectedCity =
      selectedCityObj?.cityName ?? selectedCityObj?.city ?? patientData.city;

    console.log('✅ [Edit] selectedStateCode set to:', this.selectedStateCode);
    console.log('✅ [Edit] selectedCity set to:', this.selectedCity);

    // 5️⃣ Patch the form
    this.clientForm.patchValue({
      state: selectedStateObj,
      city: selectedCityObj,
      postalCode: selectedZipObj,
    });
  }

  private loadBillingAddressDropdowns(
    countryName: string,
    stateName: string,
    cityName: string,
    zipCode: string,
  ): Observable<any> {
    return this._authservice.getStates(countryName).pipe(
      switchMap((statesRes: any) => {
        this.billingStates = statesRes.data || statesRes;

        if (!Array.isArray(this.billingStates)) {
          this.billingStates = [];
          return of(null);
        }

        // Find the billing state object
        const selectedBillingState = this.billingStates.find(
          (state: any) =>
            state.stateName === stateName ||
            state.state === stateName ||
            state.name === stateName,
        );

        if (selectedBillingState) {
          // Patch billing state into the form
          this.clientForm.patchValue({ billingState: selectedBillingState });

          // Load billing cities for this state
          return this._authservice
            .getCities(countryName, selectedBillingState.stateCode)
            .pipe(
              switchMap((citiesRes: any) => {
                this.billingCities = citiesRes.data || citiesRes || [];

                // Patch city if found, else leave null for now
                const selectedCityObj = this.billingCities.find(
                  (c: any) =>
                    c.cityName === cityName ||
                    c.city === cityName ||
                    c.name === cityName,
                );
                if (selectedCityObj) {
                  this.clientForm.patchValue({ billingCity: selectedCityObj });
                }

                // Load ZIP codes after cities are loaded
                return this.loadZipCodes(
                  countryName,
                  selectedBillingState.stateCode,
                  cityName,
                  zipCode,
                  true, // isBilling flag
                );
              }),
              catchError((error) => {
                console.error('Error loading billing cities:', error);
                return this.loadZipCodes(
                  countryName,
                  selectedBillingState?.stateCode,
                  cityName,
                  zipCode,
                  true,
                );
              }),
            );
        }

        return of(null);
      }),
      catchError((error) => {
        console.error('Error loading billing states:', error);
        return of(null);
      }),
    );
  }

  private copyPrimaryToBilling(): void {
    const state = this.clientForm.get('state')?.value;
    const city = this.clientForm.get('city')?.value;
    const zip = this.clientForm.get('postalCode')?.value;
    const address = this.clientForm.get('address')?.value;
    const country = this.clientForm.get('country')?.value;

    // Safety logs
    console.log('🔁 Auto-copy Primary → Billing', {
      state,
      city,
      zip,
      address,
    });

    this.billingStates = [...this.states];
    this.billingCities = [...this.cities];
    this.billingZipCodes = [...this.zipCodes];

    this.clientForm.patchValue({
      billingAddress: address,
      billingCountry: country,
      billingState: state,
      billingCity: city,
      billingPostalCode: zip,
    });
  }

  private loadZipCodes(
    country: string,
    stateCode: string,
    city: string,
    currentZip: string,
    isBilling: boolean = false,
  ): Observable<any> {
    return this._authservice.getZipCodes(country, stateCode, city).pipe(
      switchMap((zipRes: any) => {
        const zipCodesArray = zipRes.data || zipRes || [];

        if (isBilling) {
          this.billingZipCodes = zipCodesArray;
        } else {
          this.zipCodes = zipCodesArray;
        }

        // Find the matching zip code OBJECT
        const selectedZip = zipCodesArray.find(
          (z: any) => z.zipCode === currentZip || z === currentZip,
        );

        // Update form with the zip code OBJECT (not just the string)
        if (selectedZip) {
          if (isBilling) {
            this.clientForm.patchValue({ billingPostalCode: selectedZip });
          } else {
            this.clientForm.patchValue({ postalCode: selectedZip });
          }
        } else if (currentZip) {
          // If no match found, create a temporary object
          const tempZip = { zipCode: currentZip };

          if (isBilling) {
            this.clientForm.patchValue({ billingPostalCode: tempZip });
          } else {
            this.clientForm.patchValue({ postalCode: tempZip });
          }
        } else {
        }

        // Final debug logs

        return of(null);
      }),
      catchError((error) => {
        // If zip codes API fails, create a temporary object
        if (currentZip) {
          const tempZip = { zipCode: currentZip };

          if (isBilling) {
            this.billingZipCodes = [tempZip];
            this.clientForm.patchValue({ billingPostalCode: tempZip });
          } else {
            this.zipCodes = [tempZip];
            this.clientForm.patchValue({ postalCode: tempZip });
          }
        } else {
        }
        return of(null);
      }),
    );
  }

  // Add this method to your component
  compareZipCodes(zip1: any, zip2: any): boolean {
    if (!zip1 || !zip2) return false;

    // Extract zip code values for comparison
    const zip1Value = typeof zip1 === 'object' ? zip1.zipCode : zip1;
    const zip2Value = typeof zip2 === 'object' ? zip2.zipCode : zip2;

    return zip1Value === zip2Value;
  }

  onUpdatePatient(): void {
    if (this.clientForm.invalid) {
      this.clientForm.markAllAsTouched();
      this._toastr.error('Please fill all required fields.');
      return;
    }

    const formValue = this.clientForm.getRawValue();

    console.log('🧾 Selected Primary ZIP:', formValue.postalCode);
    console.log('🧾 Selected Billing ZIP:', formValue.billingPostalCode);

    // ✅ Safe extractor (handles object OR string)
    const extractZipId = (zipValue: any, zipList: any[]) => {
      if (!zipValue) return null;

      // If object with id
      if (typeof zipValue === 'object') {
        if (zipValue.id) return zipValue.id;
        if (zipValue.countryDataId) return zipValue.countryDataId;

        // If object without id, match by zipCode
        const match = zipList?.find((z: any) => z.zipCode === zipValue.zipCode);
        return match?.id ?? match?.countryDataId ?? null;
      }

      // If string
      const match = zipList?.find((z: any) => z.zipCode === zipValue);
      return match?.id ?? match?.countryDataId ?? null;
    };

    const countryDataId = extractZipId(formValue.postalCode, this.zipCodes);

    const billingCountryId = formValue.billingSameAsCurrent
      ? countryDataId
      : extractZipId(formValue.billingPostalCode, this.billingZipCodes);

    const updatePayload: any = {
      patientCode: this.patientCode || '',
      firstName: formValue.firstName,
      lastName: formValue.lastName,
      email: formValue.email,
      countryDataId: countryDataId ?? 0,
      phoneNumber: formValue.phoneNumber,
      dateOfBirth: formValue.dateOfBirth,
      gender: formValue.gender,
      socialSecurityNumber: formValue.socialSecurityNumber,
      address: formValue.address,
      billingAddress: formValue.billingSameAsCurrent
        ? formValue.address
        : formValue.billingAddress,
      billingCountryId: billingCountryId ?? 0,
      emailNotification: formValue.emailNotification,
      textNotification: formValue.textNotification,
      isBillingAddressSameAsAddress: formValue.billingSameAsCurrent,
    };

    console.log('🚀 Final Update Payload:', updatePayload);

    this._loader.show();

    this._adminservice.updatepatient(this.patientId, updatePayload).subscribe({
      next: (response) => {
        this._toastr.success(response.data);
        this._loader.hide();
        this.clientForm.reset();
        this.loadPatientsList();
        this.SwitchTab = 'ListPatients';
      },
      error: (error) => {
        this._loader.hide();
        console.error('Update failed', error);
        this._toastr.error(error?.error?.message || 'Update failed');
      },
    });
  }

  preventAbove(event: KeyboardEvent): void {
    const input = event.target as HTMLInputElement;
    const value = input.value;

    const allowedKeys = [
      'Backspace',
      'ArrowLeft',
      'ArrowRight',
      'Tab',
      'Delete',
    ];
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

  setSwitchTab(tab: 'ListPatients' | 'AddPatients' | 'Patientfiles') {
    this.SwitchTab = tab;

    // Reset edit mode if switching to AddPatients
    if (tab === 'AddPatients') {
      // this.isEditMode = false;
    }

    setTimeout(() => {
      const slider = document.querySelector('.slider') as HTMLElement;
      const tabElements = document.querySelectorAll('.tab');

      const tabIndexMap: Record<string, number> = {
        AddPatients: 0,
        ListPatients: 1,
        PatientsAssessment: 2,
      };
      const tabIndex = tabIndexMap[tab];

      if (tab === 'ListPatients') {
        this.isEditMode = false;
        this.clientForm.reset();
        this.selectedTab = 'patient-info';
      }

      if (slider && tabElements[tabIndex]) {
        const tabEl = tabElements[tabIndex] as HTMLElement;
        slider.style.left = `${tabEl.offsetLeft}px`;
        slider.style.width = `${tabEl.offsetWidth}px`;
      }
    }, 0);
  }

  gridOptions: any = {
    rowSelection: 'multiple',
    suppressRowClickSelection: true,
    onGridReady: (params: any) => {
      this.gridApi = params.api;
      // this.gridColumnApi = params.columnApi;
      this.setupAssessmentClickHandler();
    },
  };

  onGridReady(params: GridReadyEvent) {
    this.gridApi = params.api;
  }

  formatPhone(phone: string): string {
    if (!phone) return '';
    return phone.replace(/(\d{3})(\d{3})(\d{4})/, '($1) $2-$3');
  }

  selectedassessmentId: string = '';
  // selectedPatientId: string = '';

  setupAssessmentClickHandler(): void {
    if (!this.gridApi) return;

    this.gridApi.addEventListener('cellClicked', (event) => {
      const nativeEvent = event.event;
      if (!nativeEvent) return;

      const target = nativeEvent.target as HTMLElement;
      if (!target) return;

      const btn = target.closest('.assessment-btn');
      if (btn) {
        const assessmentId = btn.getAttribute('data-id');
        if (assessmentId) {
          this.selectedassessmentId = assessmentId;
          this.selectedPatientId = event.data.id; // Store patientId from row data
          this.showInitialPopup = true;
        }
      }
    });
  }

  // goToAssessment(assessmentId: string): void {

  //   this.router.navigate(['admin/patients/assessment/', assessmentId]);
  // }

  formatDate(dateString: string): string {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString();
  }
  formDateInsurance(dateString: string): string {
    const date = new Date(dateString);
    return date.toISOString().split('T')[0];
  }
  patients: any[] = [];
  patient: any = null;
  // insurances: any[] = [];
  viewMode: 'detail' | 'list' = 'detail';
  // selectedPatientId: string | null = null;
  rowData: any[] = [];

  goBackToList(): void {
    this.viewMode = 'list';
    this.patient = [];
    // this.insurances = [];
    this.loadPatientsList();
  }

  isshowPatientsDetails: boolean = true;

  viewPatientDetails(patientId: any): void {
    debugger;
    this.setPatientId = patientId.id;
    this.isshowPagination = false;
    this.patientList = false;
    this.viewMode = 'detail';
    this.isshowPatientsDetails = true;
    this._adminservice.getPatientById(this.setPatientId).subscribe({
      next: (data: any) => {
        console.log('datadatadatadata', data);

        this.patient = data;
        this.selectedInsurance.set(data.data.insurances);
        console.log('data.data.insurances', data.data.insurances);
      },
      error: (err) => {
        console.error('Failed to fetch patient details', err);
      },
    });
    console.log('patientpatientpatient', this.patient);
    this.getInsuranceByPatientId(this.setPatientId);
    // this.viewInsurance(this.setPatientId);
    //     this.patientService.getPatientInsurances(patientId).subscribe({
    //       next: (data) => {
    //         this.insurances = data;
    //       },
    //       error: (err) => {
    //         console.error('Failed to fetch insurances', err);
    //       }
    //     });
  }

  getPatientsId!: any;
  // loadPatientsList(): void {
  //     const loadPatients = this._adminservice.getPatientsList().subscribe({
  //       next: (data:Patient[]) => {
  //         data.forEach((patient: any) => {
  //           this.patientsModelList.set(data);
  //           // console.log("patientsModelList",this.patientsModelList);
  //           this.getPatientsId = patient.id;
  //         });

  //         this.patients = data.map((patient: any, index: number) => ({
  //           ...patient,
  //           avatar: `https://randomuser.me/api/portraits/${index % 2 === 0 ? 'men' : 'women'}/${30 + index}.jpg`
  //         }));
  //       },
  //       error: (err) => {
  //         console.error('Failed to fetch patient list', err);
  //       }
  //     });
  //     this.subscriptions.add(loadPatients);
  //   }

  // calculateAge(dateOfBirth: string): number {
  //   return 0;
  // }

  getStatusColor(active: boolean): string {
    return active ? 'status-active' : 'status-inactive';
  }

  // formatPhone(phone: string): string {
  //   return phone;
  // }

  synchQb(id: string) {
    this._adminservice.addPatientToQuickBooks(id).subscribe({
      next: (res) => {
        console.log('addPatientToQuickBooks response:', res);
        this._toastr.success(res.message);
        window.location.reload();
        // this.loadPatientsList();
      },
      error: (err) => {
        const errorMessage = err.error?.message;
        this._toastr.error(errorMessage);
      },
    });
  }
  viewPatient(id: string): void {}

  scheduleNow(patientId: string): void {
    console.log('this.patientList()');
    this.setPatientId = patientId;

    const patient = this.patientsModelList().find((p) => p.id === patientId);
    if (patient) {
      this.selectedPatient.set(patient);
      this.scheduleForm.patchValue({
        appointmentType: AppointmentType.THERAPY_SESSION,
        title: '',
        notes: '',
      });
      this.showScheduleModal.set(true);
    }
  }

  onExportClick() {
    const worksheet = XLSX.utils.json_to_sheet(this.rowData);
    const workbook = { Sheets: { data: worksheet }, SheetNames: ['data'] };
    const excelBuffer = XLSX.write(workbook, {
      bookType: 'xlsx',
      type: 'array',
    });
    const blob = new Blob([excelBuffer], { type: 'application/octet-stream' });
    FileSaver.saveAs(blob, 'PatientList.xlsx');
  }

  showInitialPopup = false;
  // isshowupload = false;
  isshowupload: boolean = false;
  userChoice!: string;

  closeAll() {
    this.showInitialPopup = false;
    this.isshowupload = false;
  }

  openAssessmentForm() {
    this.userChoice = 'assessmentForm';
    this.showInitialPopup = false;
    this.isshowupload = false;
    // setPatientId
    if (this.setPatientId) {
      // Get the patientId from the row data
      // const selectedRow = this.rowData.find(row => row.assessmentId === this.setPatientId);
      if (this.setPatientId) {
        this.router.navigate([
          '/patients/assessment',
          this.setPatientId,
          this.setAssesmentId,
        ]);
      }
    }
  }

  selectedFiles: { name: string; status: string }[] = [];
  fileListToUpload!: FileList;
  uploadError: string | null = null;

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;

    if (input.files && input.files.length > 0) {
      const allowedTypes = [
        'application/pdf',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'image/jpeg',
      ];
      const maxSize = 10 * 1024 * 1024; // 10 MB
      const files = Array.from(input.files);

      // Reset previous error
      this.uploadError = null;

      // Validate all files
      for (const file of files) {
        if (!allowedTypes.includes(file.type)) {
          this.uploadError = `File type not allowed: ${file.name}`;
          input.value = '';
          return;
        }
        if (file.size > maxSize) {
          this.uploadError = `File too large (max 10MB): ${file.name}`;
          input.value = '';
          return;
        }
      }

      // If validation passes, proceed
      this.selectedFiles = files.map((file) => ({
        name: file.name,
        status: 'Pending',
      }));

      this.uploadForm.patchValue({ files: input.files });
      this.uploadForm.get('files')?.updateValueAndValidity();
      this.fileListToUpload = input.files;
    }
  }

  openPdfUpload() {
    this.userChoice = 'uploadPdf';
    this.showInitialPopup = false;
    // this.showPdfUploadPopup = true;
    this.isshowupload = true;
  }

  // patientassessment:string='patientassessment'
  uploadedUrl!: string;
  upload(): void {
    if (!this.fileListToUpload || this.fileListToUpload.length === 0) {
      alert('At least one file must be uploaded.');
      return;
    }
    this._loader.show();
    const formData = new FormData();
    Array.from(this.fileListToUpload).forEach((file) => {
      formData.append('files', file);
    });

    const folder = 'patientassessment';

    this._adminservice.fileUpload(formData, folder).subscribe({
      next: (res) => {
        console.log('Success:', res);
        console.log('Success:', res.urls);
        this.uploadedUrl = res?.urls;
        this._loader.hide();
        this.selectedFiles = this.selectedFiles.map((f) => ({
          ...f,
          status: 'Success',
        }));

        const patientData: any = {
          patientId: this.setPatientId,
          assessmentId: this.setAssesmentId,
          isFileUpload: true,
          fileUrl: this.uploadedUrl,
        };
        this._adminservice.savePatientAssessment(patientData).subscribe({
          next: (res) => {
            console.log('Assessment saved successfully', res);
            this._toastr.success(res.data.message);
            this.isshowupload = false;
            this.showInitialPopup = false;
          },
          error: (err) => {
            this._loader.hide();
            const errorMessage = err.error?.message;
            this._toastr.error(errorMessage);
          },
        });
      },
      error: (err) => {
        console.error('Upload failed:', err);
        this.selectedFiles = this.selectedFiles.map((f) => ({
          ...f,
          status: 'Failed',
        }));
      },
    });
  }

  onCellClicked(event: any): void {
    const field = event.colDef?.field;
    const target = event.event?.target as HTMLElement;

    console.log('Clicked field:', field);
    console.log('Target classes:', target?.classList);

    if (field === 'quickBookSync' && target?.classList.contains('sync-btn')) {
      this._adminservice.addPatientToQuickBooks(this.getPatientsId).subscribe({
        next: (res) => {
          console.log('addPatientToQuickBooks response:', res);
          this._toastr.success(res.message);
          this.loadPatientsList();
        },
        error: (err) => {
          const errorMessage = err.error?.message;
          this._toastr.error(errorMessage);
        },
      });
    }

    if (field === 'actions' && target.closest('[data-action="edit"]')) {
      this.onEditAction(event.data);
    }

    if (field === 'actions' && target.closest('[data-action="delete"]')) {
      this.onDeleteAction(event.data);
    }
  }

  patientCode!: string;
  patientIds!: string;

  onEditAction(rowData: any): void {
    debugger;
    console.log('rowdata', rowData);

    this.SwitchTab = 'AddPatients';
    this.isEditMode = true;
    this.patientId = rowData;
    this.actionType = 'Update';

    console.log('EditPatient - Setting edit mode:', {
      isEditMode: this.isEditMode,
      patientId: this.patientId,
      actionType: this.actionType,
    });

    forkJoin([
      this._authservice.getCountries(),
      this._adminservice.getPatientById(this.patientId),
    ]).subscribe({
      next: ([countriesRes, patientRes]) => {
        try {
          this.patientCode = patientRes.patientCode;
          this.patientIds = patientRes.id;

          if (!patientRes) throw new Error('Patient data not found');

          const patientData = patientRes;
          this.countries = countriesRes.data || countriesRes;

          const selectedCountry = patientData.country
            ? this.countries.find((c: any) => c.country === patientData.country)
            : null;

          const billingCountry = patientData.billingCountry
            ? this.countries.find(
                (c: any) => c.country === patientData.billingCountry,
              )
            : null;

          const formattedDob = patientData.dateOfBirth
            ? (patientData.dateOfBirth as string).split('T')[0]
            : null;

          // const diagnosis = patientData.diagnoses?.length
          //   ? patientData.diagnoses[0]
          //   : null;

          const initialValues: any = {
            firstName: patientData.firstName || '',
            lastName: patientData.lastName || '',
            email: patientData.email || '',
            phoneNumber: patientData.phoneNumber || '',
            dateOfBirth: formattedDob,
            gender: patientData.gender?.toLowerCase() || '',
            country: selectedCountry || null,
            address: patientData.address || '',
            billingAddress: patientData.billingAddress || '',
            billingCountry: billingCountry || null,
            socialSecurityNumber: patientData.socialSecurityNumber || '',
            textNotification: patientData.textNotification || false,
            emailNotification: patientData.emailNotification || false,
            billingSameAsCurrent:
              patientData.isBillingAddressSameAsAddress || false,

            // state: patientData.state || null,
            // city: patientData.city || null,
            // postalCode: patientData.zip || null,

            // billingState: patientData.billingState || null,
            // billingCity: patientData.billingCity || null,
            // billingPostalCode: patientData.billingZip || null,

            // code: diagnosis?.diagnosisId || null,
            // diagnosisId: diagnosis?.id || null,
            // description: diagnosis?.diagnosisDescription || '',
            // dateDiagnosed: diagnosis?.dateDiagnosed
            //   ? diagnosis.dateDiagnosed.split('T')[0]
            //   : '',
          };

          this.clientForm.patchValue(initialValues);

          this.selectedCountry = patientData.country;
          this.selectedCountryCode = patientData.mobilePrefixCode;

          // ✅ Load all address dropdowns (country → state → city)
          this.loadPrimaryAddressThenBilling(patientData);

          // // ✅ ✅ ✅ IMPORTANT: CALL ZIP API AFTER DROPDOWNS ARE LOADED
          // setTimeout(() => {
          //   console.log("📌 Calling loadPrimaryZipOnEdit() after dropdowns loaded");
          //   this.loadPrimaryZipOnEdit();    // ✅ primary ZIP load

          //   if (!patientData.isBillingAddressSameAsAddress) {
          //     console.log("📌 Billing address is different → loading billing ZIP");
          //     this.loadBillingZipOnEdit();  // ✅ billing ZIP load
          //   } else {
          //     console.log("✅ Billing same as primary → no billing ZIP API needed");
          //   }

          // }, 450);
        } catch (error) {
          console.error('Error processing patient data:', error);
        }
      },
      error: (error) => {
        console.error('Error loading patient data:', error);
      },
    });
  }

  private handleSameBillingAddress(patientData: any): void {
    console.log('Billing same as primary - copying values');

    // Copy dropdown data
    this.billingStates = [...this.states];
    this.billingCities = [...this.cities];
    this.billingZipCodes = [...this.zipCodes]; // Make sure this is copied

    console.log('📦 Billing Zip Codes after copy:', this.billingZipCodes);

    // Get current form values
    const currentState = this.clientForm.get('state')?.value;
    const currentCity = this.clientForm.get('city')?.value;
    const currentPostalCode = this.clientForm.get('postalCode')?.value;

    console.log('🔍 Copying values:', {
      state: currentState,
      city: currentCity,
      postalCode: currentPostalCode,
      postalCodeType: typeof currentPostalCode,
    });

    // Find the matching zip code object from billingZipCodes
    let billingPostalCodeValue = currentPostalCode;

    // If currentPostalCode is a string, find the matching object
    if (
      typeof currentPostalCode === 'string' &&
      this.billingZipCodes.length > 0
    ) {
      const matchingZip = this.billingZipCodes.find(
        (zip) => zip.zipCode === currentPostalCode || zip === currentPostalCode,
      );
      if (matchingZip) {
        billingPostalCodeValue = matchingZip;
        console.log('✅ Found matching zip object:', matchingZip);
      } else {
        console.log('⚠️ No matching zip object found, using string value');
      }
    }

    // Copy form values
    const billingValues = {
      billingState: currentState,
      billingCity: currentCity,
      billingPostalCode: billingPostalCodeValue,
    };

    console.log('Copying billing values:', billingValues);
    this.clientForm.patchValue(billingValues);

    // Force change detection for the dropdowns
    setTimeout(() => {
      console.log(
        '🔄 After patch - billingPostalCode form value:',
        this.clientForm.get('billingPostalCode')?.value,
      );
      console.log('🔄 After patch - billingZipCodes:', this.billingZipCodes);

      // Trigger change detection
      this.billingZipCodes = [...this.billingZipCodes];
      this.cdRef.detectChanges();
    });

    // Disable billing fields
    [
      'billingAddress',
      'billingCountry',
      'billingState',
      'billingCity',
      'billingPostalCode',
    ].forEach((control) => {
      this.clientForm.get(control)?.disable();
      console.log(`🔒 Disabled: ${control}`);
    });

    this.finalizeEditMode();
  }

  private handleSeparateBillingAddress(patientData: any): void {
    console.log('Loading separate billing address dropdowns');

    [
      'billingAddress',
      'billingCountry',
      'billingState',
      'billingCity',
      'billingPostalCode',
    ].forEach((control) => this.clientForm.get(control)?.enable());

    this.loadBillingAddressDropdowns(
      patientData.billingCountry as string,
      patientData.billingState as string,
      patientData.billingCity as string,
      patientData.billingZip as string,
    ).subscribe({
      next: () => {
        console.log('Billing address dropdowns loaded');

        // ⏳ Wait briefly for city dropdown binding
        setTimeout(() => {
          this.updateBillingFormWithObjects(patientData);
          this.finalizeEditMode();
        }, 100); // 100ms delay ensures dropdown is ready
      },
      error: (error) => {
        console.error('Error loading billing address dropdowns:', error);
        this.finalizeEditMode();
      },
    });
  }

  private updateBillingFormWithObjects(patientData: any): void {
    // Find the actual billing country object
    const selectedBillingCountryObj = this.countries.find(
      (c: any) =>
        c.country?.toLowerCase().trim() ===
        patientData.billingCountry?.toLowerCase().trim(),
    );

    // Find the actual billing state object
    const selectedBillingStateObj = this.billingStates.find(
      (state: any) =>
        state.state?.toLowerCase().trim() ===
          patientData.billingState?.toLowerCase().trim() ||
        state.name?.toLowerCase().trim() ===
          patientData.billingState?.toLowerCase().trim() ||
        state.stateName?.toLowerCase().trim() ===
          patientData.billingState?.toLowerCase().trim(),
    );

    // 📍 Log available billing cities
    console.log('📍 Available billingCities:', this.billingCities);
    // ✅ Find the actual billing city object (case-insensitive match)
    const selectedBillingCityObj = this.billingCities.find(
      (city: any) =>
        city.city?.toLowerCase().trim() ===
          patientData.billingCity?.toLowerCase().trim() ||
        city.name?.toLowerCase().trim() ===
          patientData.billingCity?.toLowerCase().trim() ||
        city.cityName?.toLowerCase().trim() ===
          patientData.billingCity?.toLowerCase().trim(),
    );

    // ✅ Find the billing postal/zip object
    const selectedBillingZipObj = this.billingZipCodes?.find(
      (zip: any) =>
        zip.zipCode === patientData.billingZip ||
        zip === patientData.billingZip,
    );

    console.log('Updating billing form with objects:', {
      billingCountry: patientData.billingCountry,
      foundBillingCountry: selectedBillingCountryObj,
      billingState: patientData.billingState,
      foundBillingState: selectedBillingStateObj,
      billingCity: patientData.billingCity,
      foundBillingCity: selectedBillingCityObj,
      billingZip: patientData.billingZip,
      foundBillingZip: selectedBillingZipObj,
    });

    // ✅ Patch everything together
    const billingUpdates: any = {
      billingAddress: patientData.billingAddress || '',
      billingCountry: selectedBillingCountryObj || null,
      billingState: selectedBillingStateObj || null,
      billingCity: selectedBillingCityObj || null,
      billingPostalCode: selectedBillingZipObj || null,
    };

    this.clientForm.patchValue(billingUpdates);
    console.log('✅ Patched billing updates:', billingUpdates);
  }

  private loadPrimaryZipOnEdit() {
    const country = this.clientForm.get('country')?.value;
    const state = this.clientForm.get('state')?.value;
    const city = this.clientForm.get('city')?.value;

    const rawZip = this.clientForm.get('postalCode')?.value; // may be string
    const zipString = typeof rawZip === 'object' ? rawZip.zipCode : rawZip;

    if (!country || !state || !city) {
      console.log('⏳ Cannot load primary ZIP – missing country/state/city');
      return;
    }

    this._authservice
      .getZipCodes(country.country, state.stateCode, city.cityName)
      .subscribe((res) => {
        this.zipCodes = (res?.data ?? res ?? []).map((z: any) => ({
          id: z.id ?? z.countryDataId ?? null,
          zipCode: z.zipCode,
        }));

        console.log('✅ ZIP API loaded:', this.zipCodes);

        // ✅ Always match using zipString
        let match = this.zipCodes.find((z) => z.zipCode === zipString);

        if (!match && this.zipCodes.length === 1) {
          // sometimes API returns only one zip for city
          match = this.zipCodes[0];
        }

        console.log('📌 ZIP match for primary:', match);

        // ✅ FINAL IMPORTANT PATCH
        if (match) {
          this.clientForm.patchValue({ postalCode: match });
        }
      });
  }

  private loadBillingZipOnEdit() {
    const billingCountry = this.clientForm.get('billingCountry')?.value;
    const billingState = this.clientForm.get('billingState')?.value;
    const billingCity = this.clientForm.get('billingCity')?.value;
    const zipString = this.clientForm.get('billingPostalCode')?.value;

    if (!billingCountry || !billingState || !billingCity) {
      console.log('⏳ Billing zip cannot load — country/state/city missing');
      return;
    }

    console.log('📌 Loading billing ZIP for:', {
      billingCountry,
      billingState,
      billingCity,
    });

    this._authservice
      .getZipCodes(
        billingCountry.country,
        billingState.stateCode,
        billingCity.cityName,
      )
      .subscribe((res) => {
        this.billingZipCodes = (res?.data ?? res ?? []).map((z: any) => ({
          id: z.id ?? z.countryDataId ?? null,
          zipCode: z.zipCode,
        }));

        // match correct zip object
        const match = this.billingZipCodes.find((z) => z.zipCode === zipString);

        this.clientForm.patchValue({ billingPostalCode: match });

        console.log('✅ Billing ZIP matched & patched:', match);
      });
  }

  private finalizeEditMode(): void {
    console.log('Patient edit initialization complete');
    this.isEditMode = true;
    this.isAdd = true;
    this.actionType = 'Update';

    console.log('Final form state after edit:', {
      billingSameAsCurrent: this.clientForm.get('billingSameAsCurrent')?.value,
      billingCountry: this.clientForm.get('billingCountry')?.value,
      billingPostalCode: this.clientForm.get('billingPostalCode')?.value,
      billingStates: this.billingStates?.length,
      billingCities: this.billingCities?.length,
      formValid: this.clientForm.valid,
      formValues: this.clientForm.value,
    });
  }

  // onDeleteAction(rowData: any) {
  //   const getPatientId = rowData;
  //   const confirmed = confirm('Are you sure you want to delete this user?');
  //   if (!confirmed) return;

  //   this._adminservice.deletePatient(getPatientId).subscribe({
  //     next: (res: any) => {
  //       this._toastr.success(res.message);

  //       this.loadPatientsList();
  //       this.rowData = this.rowData.filter((row: any) => row.id !== getPatientId);
  //         this.SwitchTab='ListPatients';
  //         window.location.reload();

  //       },
  //     error: (err) => {
  //       const errorMessage = err.error?.message;
  //       this._toastr.error(errorMessage);
  //     }
  //   });
  // }
  patientList: boolean = true;
  goBack() {
    this.isshowPatientsDetails = false;
    this.patientList = true;
  }
  ngOnDestroy() {
    this.subscriptions.unsubscribe();
    if (this.gridApi) {
      this.gridApi.destroy();
    }
  }

  loadInsurances(): void {
    this._adminservice.getInsuranceCarriers().subscribe({
      next: (insurances) => {
        this.patientsInsurances.set(insurances);
      },
      error: () => {
        this._toastr.error('Failed to load insurances');
      },
    });
  }

  public _insuranceService = inject(InsuranceService);
  setPrimaryInsurance(insurance: Insurance): void {
    // const payload: PrimaryInsurancePayload = {
    //   id: insurance.id,
    //   patientId: this.setPatientId,
    //   isPrimary: true
    // };

    this._insuranceService
      .getPrimaryInsurance(insurance.id, this.setPatientId)
      .subscribe({
        next: (res) => {
          // this.toastr.success(res.message);
          if (res) {
            //  this.getInsuranceByPatientId

            this.toastr.success(res.message);
            this._adminservice.getPatientById(this.setPatientId).subscribe({
              next: (data: any) => {
                console.log('datadatadatadata', data);
                this.getInsuranceByPatientId(this.setPatientId);
                // this.patient = data.data;
                this.selectedInsurance.set(data);
                ``;
                // this.selectedInsurance.set(data?.data || []);
                // console.log("data.data.insurances",data.data.insurances);
              },
              error: (err) => {
                console.error('Failed to fetch patient details', err);
              },
            });
          } else {
            this.toastr.error(
              res.message || 'Failed to set primary insurance.',
            );
          }
        },
        error: (err) => {
          console.error('Error setting primary insurance:', err);
          this.toastr.error('An unexpected error occurred.');
        },
      });
  }

  formatUSPhone(event: Event) {
    const input = event.target as HTMLInputElement;
    let value = input.value.replace(/\D/g, '');
    if (value.length > 17) {
      value = value.slice(0, 17);
    }
    if (value.length > 6) {
      value = value.replace(/(\d{3})(\d{3})(\d+)/, '$1-$2-$3');
    } else if (value.length > 3) {
      value = value.replace(/(\d{3})(\d+)/, '$1-$2');
    }

    input.value = value;
  }

  // public _insuranceService = inject(insuranceService)
  selectedInsuranceId: any;
  editInsurance(id: any) {
    this.showInsurancePopup = true;
    this.isEditModeInsurance.set(true);
    console.log('Editing insurance with ID:', id);
    this.selectedInsuranceId = id;
    this._insuranceService.getInsuranceByIds(id).subscribe({
      next: (res: any) => {
        console.log('Full API Response:', res);

        if (res) {
          this.patchFormValues(res); // pass response directly
        }
      },
      error: (err) => {
        console.error('Error fetching insurance data:', err);
        console.error('Error details:', err.error);
      },
    });
  }

  patchFormValues(insuranceData: any) {
    this.patientsInusranceForm.patchValue({
      provider: insuranceData.insuranceCarrierId,
      planType: insuranceData.insurancePlanId,
      policyNumber: insuranceData.policyNumber,
      groupNumber: insuranceData.groupNumber,
      subscriberId: insuranceData.subscriberId || '',
      subscriberName: insuranceData.subscriberName || '',
      subscriberDateOfBirth: insuranceData.subscriberDateOfBirth
        ? insuranceData.subscriberDateOfBirth.split('T')[0]
        : null,
      effectiveDate: insuranceData.effectiveDate
        ? insuranceData.effectiveDate.split('T')[0]
        : null,
      expirationDate: insuranceData.expiryDate
        ? insuranceData.expiryDate.split('T')[0]
        : null,
      relationshipToSubscriber: insuranceData.relationship || 'self',

      copay: insuranceData.coPay || '',
      deductible: insuranceData.deductible || '',
      coinsurance: insuranceData.coinsurance || '',
      outOfPocketMax: insuranceData.outOfPocketMax || '',
      visitLimit: insuranceData.visitLimit || '',
      networkStatus: insuranceData.networkStatus || 'in-network',
      authorizationRequired: insuranceData.authorizationRequired || false,
      referralRequired: insuranceData.referralRequired || false,
      mentalHealthCoverage: insuranceData.mentalHealthCoverage || false,
      notes: insuranceData.notes || '',
    });

    // ✅ Patch Authorization if exists
    if (
      insuranceData.authorizations &&
      insuranceData.authorizations.length > 0
    ) {
      const auth = insuranceData.authorizations[0];
      this.patientsInusranceForm.patchValue({
        authNumber: auth.authorizationNumber || '',
        startDate: auth.startDate ? auth.startDate.split('T')[0] : '',
        endDate: auth.endDate ? auth.endDate.split('T')[0] : '',
        authNotes: auth.notes || '',
        active: auth.isActive || false,
      });

      // ✅ Patch services into FormArray
      this.services.clear();
      if (auth.services && auth.services.length > 0) {
        auth.services.forEach((s: any) => {
          this.services.push(
            this.fb.group({
              serviceType: [s.serviceType || ''],
              cptCode: [s.cptCode || ''],
              visitLimit: [s.visitLimit || ''],
              visitsUsed: [s.visitsUsed || ''],
            }),
          );
        });
      }
    }
  }

  deleteInsurance(insuranceId: string): void {
    if (!insuranceId) return;

    this._insuranceService.deleteInsuranceIds(insuranceId).subscribe({
      next: (res: any) => {
        if (res) {
          this.toastr.success(res.message || 'Insurance deleted successfully');
          this.getInsuranceByPatientId(this.setPatientId);
        }
      },
      error: (err) => {
        console.error('Error deleting insurance:', err);
        const errorMsg =
          err?.error?.message ||
          'An unexpected error occurred while deleting insurance.';
        this.toastr.error(errorMsg);
      },
    });
  }

  closeScheduleModal(): void {
    this.showScheduleModal.set(false);
    this.selectedPatient.set(null);
    this.scheduleForm.reset();
  }

  onSubmitSchedule(): void {
    this.setPatientId;
    const now = new Date();
    const minutes = now.getMinutes();
    const roundedMinutes = minutes <= 30 ? 30 : 0;
    const addHour = minutes > 30 ? 1 : 0;

    const slotStart = new Date(now);
    slotStart.setMinutes(roundedMinutes);
    slotStart.setSeconds(0);
    slotStart.setMilliseconds(0);
    slotStart.setHours(slotStart.getHours() + addHour);

    const slotEnd = new Date(slotStart);
    slotEnd.setMinutes(slotStart.getMinutes() + 30);

    const options: Intl.DateTimeFormatOptions = {
      hour: 'numeric',
      minute: '2-digit',
    };
    const slotString = `${slotStart.toLocaleTimeString([], options)} - ${slotEnd.toLocaleTimeString([], options)}`;

    const appointmentData = {
      ...this.scheduleForm.value,
      appointmentSlot: {
        start: slotStart.toISOString(),
        end: slotEnd.toISOString(),
        display: slotString,
      },
    };

    this._adminservice
      .saveAppointmentWithTransaction(appointmentData)
      .subscribe({
        next: (res) => {
          if (res) {
            this.toastr.success('Saved successfully');
            this.showScheduleModal.set(false);
          } else {
            this.toastr.error('Save failed');
          }
        },
        error: () => {
          this.toastr.error('Save failed');
        },
      });
  }

  formatSSN(event: Event) {
    const input = event.target as HTMLInputElement;
    let value = input.value.replace(/\D/g, '');

    if (value.length > 3 && value.length <= 6) {
      value = value.replace(/(\d{3})(\d+)/, '$1-$2');
    } else if (value.length > 6) {
      value = value.replace(/(\d{3})(\d{3})(\d+)/, '$1-$2-$3');
    }

    input.value = value;
  }

  setPatientId!: any;
  openNotes(patient: any) {
    this.setPatientId = patient.id;
    this.setAssesmentId = patient.assessmentId;
    this.showInitialPopup = true;
  }

  cancelPdf() {
    this.isshowupload = false;
  }

  showInsurancePopup: boolean = false;

  patientsInusranceFormSubmitted: boolean = false;
  insuranceArr: InsuranceCarrier[] = [];
  public toastr = inject(TosterService);

  getInsuranceCarrier() {
    this._adminservice.getInsuranceCarriers().subscribe(
      (res: any) => {
        this.insuranceArr = res?.data;
        console.log('insuranceArrinsuranceArrinsuranceArr', res);
      },
      (err: any) => {
        console.error('Failed to load insurance carriers', err);
      },
    );
  }

  public _patientService = inject(PatientService);
  selectedInsurance = signal<any[]>([]);
  //   viewInsurance(patientId: string) {
  //   // this._patientService.GetInsuranceByPatientId(patientId).subscribe({
  //   //   next: (res: any) => {
  //   //     this.selectedInsurance.set(res.data);
  //   //     this.selectedInsurance.set(res.data);
  //   //     this.selectedInsurance.set(res.data);
  //   //     // console.log("resresres",res.data.outOfPocketMax);
  //   //     // console.log("resresres",res.data.policyNumber);

  //   //     console.log("this.selectedInsurancethis.selectedInsurancethis.selectedInsurance",this.selectedInsurance);
  //   //     // console.log("this.selectedInsurancethis.selectedInsurancethis.selectedInsurance",this.selectedInsurance.insuranceCarrierName);

  //   //   },
  //   //   error: (err) => {
  //   //     console.error('Error fetching insurance data:', err);
  //   //     this.toastr.error('Failed to load insurance details.');
  //   //   }
  //   // });
  // }

  insurancePlanIds: any[] = [];
  getInsurancePlan() {
    this._adminservice.getInsuranceInsurancePlan().subscribe((res: any) => {
      this.insurancePlanIds = res.data;
    });
  }

  saveInsuranceForm() {
    if (this.patientsInusranceForm.invalid) {
      this.patientsInusranceFormSubmitted = true;
      return;
    }
    if (
      this.isEditModeInsurance() == true ||
      this.selectedInsuranceId != null
    ) {
      this.updateInsuranceForm();
      return;
    }
    const formValue = this.patientsInusranceForm.value;
    console.log('formValueformValueformValue', formValue);

    const payload = {
      patientId: this.setPatientId,
      insuranceCarrierId: Number(formValue.provider),
      insurancePlanId: Number(formValue.planType),
      policyNumber: formValue.policyNumber,
      groupNumber: formValue.groupNumber,
      subscriberId: formValue.subscriberId,
      subscriberName: formValue.subscriberName,
      subscriberDateOfBirth: formValue.subscriberDateOfBirth
        ? new Date(formValue.subscriberDateOfBirth).toISOString()
        : null,
      relationship: formValue.relationshipToSubscriber,
      effectiveDate: formValue.effectiveDate
        ? new Date(formValue.effectiveDate).toISOString()
        : null,
      expiryDate: formValue.expirationDate
        ? new Date(formValue.expirationDate).toISOString()
        : null,
      coPay: Number(formValue.copay),
      deductible: Number(formValue.deductible),
      coinsurance: Number(formValue.coinsurance),
      outOfPocketMax: Number(formValue.outOfPocketMax),
      networkStatus: formValue.networkStatus,
      authorizationRequired: formValue.authorizationRequired,
      referralRequired: formValue.referralRequired,
      mentalHealthCoverage: formValue.mentalHealthCoverage,
      isPrimary: formValue.isPrimary ?? true,
      annualVisitLimit: Number(formValue.annualVisitLimit) || 0,
      authorizations: formValue.authorizations || [],
    };

    this._adminservice.AddMultipleInsurances(payload).subscribe({
      next: (res: any) => {
        if (res) {
          this.toastr.success(res.message || 'Created successfully');
          this.showInsurancePopup = false;
          this.getInsuranceByPatientId(this.setPatientId);
          // Optionally refresh the grid data
          // this.getAllPatients();
          return;
        } else {
          this.showInsurancePopup = false;
          this.toastr.error(res.errors);
          return;
        }
      },
      error: (err) => {
        this.showInsurancePopup = false;
        const backendError = err?.error;
        const errorMsg = Array.isArray(backendError?.errors)
          ? backendError.errors.join(', ')
          : backendError?.message || 'Something went wrong';
        this.toastr.error(errorMsg);
      },
    });
  }

  insuranceList: any[] = [];

  getInsuranceByPatientId(id: string) {
    this._insuranceService.GetInsurancesByPatientId(id).subscribe({
      next: (res: any) => {
        console.log('Insurance data:', res);
        this.selectedInsurance.set(res?.data || []);
      },
      error: (err) => {
        const backendError = err?.error;
        const errorMsg =
          backendError?.message || 'Failed to load insurance data';
        this.toastr.error(errorMsg);
      },
    });
  }

  updateInsuranceForm() {
    console.log('Updating insurance with ID:', this.selectedInsuranceId);
    console.log('Form data:', this.patientsInusranceForm.value);

    const formValue = this.patientsInusranceForm.value;

    const payload: any = {
      id: this.selectedInsuranceId,
      patientId: this.setPatientId,
      PolicyHolderName: formValue.subscriberName,
      relationship: formValue.relationshipToSubscriber,
      MemberId: formValue.subscriberId,
      policyNumber: formValue.policyNumber,
      GroupNumber: formValue.groupNumber,
      insurancePlanId: Number(formValue.planType),
      InsuranceCarrierId: Number(formValue.provider),
      subscriberId: String(formValue.subscriberId),
      subscriberName: formValue.subscriberName,
      CoPay: Number(formValue.copay),
      Deductible: Number(formValue.deductible),
      Coinsurance: Number(formValue.coinsurance),
      OutOfPocketMax: Number(formValue.outOfPocketMax),
      NetworkStatus: formValue.networkStatus,
      AuthorizationRequired: formValue.authorizationRequired,
      ReferralRequired: formValue.referralRequired,
      MentalHealthCoverage: formValue.mentalHealthCoverage,
      Notes: formValue.notes,
      visitLimit: Number(formValue.visitLimit) || 0,
      subscriberDateOfBirth: formValue.subscriberDateOfBirth
        ? this.toIsoDate(formValue.subscriberDateOfBirth)
        : null,
      effectiveDate: formValue.effectiveDate
        ? this.toIsoDate(formValue.effectiveDate)
        : null,
      expiryDate: formValue.expirationDate
        ? this.toIsoDate(formValue.expirationDate)
        : null,
    };

    this._adminservice.AddMultipleInsurances(payload).subscribe({
      next: (res) => {
        console.log('Insurance updated successfully:', res);
        this._toastr.success('Updated Successfully');
        this.closeInsurancePopup();
        this.loadInsurances(); // refresh list
      },
      error: (err) => {
        console.error('Error updating insurance:', err);
        if (err.error) {
          console.error('Error response:', err.error);
          this._toastr.error(err.error.message || 'Update failed');
        } else {
          this._toastr.error('Update failed - unknown error');
        }
      },
      complete: () => {
        console.log('Update operation completed');
      },
    });
  }

  private toIsoDate(value: any): string | null {
    if (!value) return null;
    const date = new Date(value);
    return isNaN(date.getTime()) ? null : date.toISOString();
  }

  // private toIsoDate(value: any): string | null {
  //   if (!value) return null;
  //   const date = new Date(value);
  //   return isNaN(date.getTime()) ? null : date.toISOString();
  // }

  addInsurance() {
    this.showInsurancePopup = true;
  }

  closeInsurancePopup() {
    this.showInsurancePopup = false;
  }

  currentPage = 1;
  paginationPageSize = 25;
  totalPages = 1;
  pageStart = 0;
  pageEnd = 0;
  totalCount = 0;
  paginationPageSizeSelector = [20, 50, 100];

  isEditModeInsurance = signal(false);

  isshowPagination: boolean = true;
  // Load patients list
  setAssesmentId!: any;
  onPageSizeChange(newSize: number): void {
    this.paginationPageSize = newSize;
    this.currentPage = 1; // Reset to first page on size change
    this.loadPatientsList();
  }

  // Go to specific page
  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages && page !== this.currentPage) {
      this.currentPage = page;
      this.loadPatientsList();
    }
  }

  // Go to previous page
  goToPreviousPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.loadPatientsList();
    }
  }

  // Go to next page
  goToNextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.loadPatientsList();
    }
  }

  // Load patients list
  // Add these properties to your component
  searchValue: string = '';
  filteredPatients: any[] = [];
  patientListData: any[] = []; // Store the original patient list

  onQuickFilterChanged(): void {
    if (this.searchValue) {
      const searchTerm = this.searchValue.toLowerCase();
      this.filteredPatients = this.patientListData.filter(
        (patient) =>
          patient.firstName?.toLowerCase().includes(searchTerm) ||
          patient.lastName?.toLowerCase().includes(searchTerm) ||
          patient.email?.toLowerCase().includes(searchTerm) ||
          patient.phoneNumber?.includes(searchTerm),
      );
    } else {
      this.filteredPatients = [...this.patientListData];
    }

    // Debug log to see what's happening
    console.log('Filtered patients:', this.filteredPatients);
    console.log('Patient list data:', this.patientListData);
  }

  clearSearch(): void {
    this.searchValue = '';

    // Reset AG Grid search
    if (this.gridApi) {
      this.gridApi.setGridOption('quickFilterText', '');
    }

    // Reset card/grid view
    this.filteredPatients = [...this.patientListData];
  }

  isTherapists: boolean = false;
  loadPatientsList(): void {
    const get_clientId: any = this._authservice.getClientId();
    const getUserRole: any = this._authservice.getUserRole();
    const isSoloProvider: any = this._authservice.getSoloProvider();

    let loadPatients;

    if (getUserRole === 'Therapist' && !isSoloProvider) {
      loadPatients = this._adminservice.getMyPatientsList().subscribe({
        next: (response: any) => {
          console.log('API Response (Therapist):', response);
          this.setAssesmentId = response.assessmentId;

          const data: Patient[] = response || [];
          this.patientListData = data;

          if (!data || data.length === 0) {
            this.filteredPatients = [];
          } else {
            this.filteredPatients = [...data];
          }

          this.patientsModelList.set(data);

          this.patients = data.map((patient: any, index: number) => {
            const age = this.calculateAge(patient.dateOfBirth);
            return {
              ...patient,
              age,
              emergencyContact: patient.emergencyContact || null,
              quickBookSync:
                patient.quickBookSync !== undefined
                  ? patient.quickBookSync
                  : true,
              avatar: `https://randomuser.me/api/portraits/${index % 2 === 0 ? 'men' : 'women'}/${30 + index}.jpg`,
            };
          });

          if (data.length > 0) {
            this.getPatientsId = data[data.length - 1].id;
          }
        },
        error: (err) => {
          console.error('Failed to fetch patient list (Therapist)', err);
        },
      });
    } else {
      // Other roles: pagination required
      loadPatients = this._adminservice
        .getPatientsList(
          get_clientId,
          this.currentPage,
          this.paginationPageSize,
        )
        .subscribe({
          next: (response: any) => {
            console.log('API Response (Admin/Other):', response);
            this.setAssesmentId = response.assessmentId;

            const data: Patient[] = response || [];
            this.totalCount = response.pagination?.totalCount || 0;
            this.totalPages = Math.max(
              1,
              Math.ceil(this.totalCount / this.paginationPageSize),
            );
            this.pageStart =
              this.totalCount > 0
                ? (this.currentPage - 1) * this.paginationPageSize + 1
                : 0;
            this.pageEnd =
              this.totalCount > 0
                ? Math.min(
                    this.currentPage * this.paginationPageSize,
                    this.totalCount,
                  )
                : 0;

            this.patientListData = data;

            // Condition for empty data
            if (!data || data.length === 0) {
              this.filteredPatients = [];
            } else {
              this.filteredPatients = [...data];
            }

            this.patientsModelList.set(data);

            this.patients = data.map((patient: any, index: number) => {
              const age = this.calculateAge(patient.dateOfBirth);
              return {
                ...patient,
                age,
                emergencyContact: patient.emergencyContact || null,
                quickBookSync:
                  patient.quickBookSync !== undefined
                    ? patient.quickBookSync
                    : true,
                avatar: `https://randomuser.me/api/portraits/${index % 2 === 0 ? 'men' : 'women'}/${30 + index}.jpg`,
              };
            });

            if (data.length > 0) {
              this.getPatientsId = data[data.length - 1].id;
            }
          },
          error: (err) => {
            console.error('Failed to fetch patient list (Admin/Other)', err);
          },
        });
    }

    this.subscriptions.add(loadPatients);
  }

  // Add this method to calculate age from dateOfBirth
  calculateAge(dateOfBirth: string): number {
    if (!dateOfBirth) return 0;

    const birthDate = new Date(dateOfBirth);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();

    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < birthDate.getDate())
    ) {
      age--;
    }

    return age;
  }

  // Navigation to patient details
  showPatientDetails(patient: Patient): void {
    this.patient = patient;
    this.isshowPatientsDetails = true;
  }

  private markFormGroupTouched(): void {
    Object.keys(this.patientsInusranceForm.controls).forEach((key) => {
      this.patientsInusranceForm.get(key)?.markAsTouched();
    });
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.patientsInusranceForm.get(fieldName);
    return !!(field && field.invalid && field.touched);
  }

  getFieldError(fieldName: string): string {
    const field = this.patientsInusranceForm.get(fieldName);
    if (!field || !field.errors || !field.touched) return '';

    if (field.errors['required']) return `${fieldName} is required`;
    if (field.errors['email']) return 'Please enter a valid email address';

    return '';
  }

  therapistList: any[] = []; // All therapists
  selectedTherapists: any[] = []; // Selected therapist chips
  showAssignModal: boolean = false; // Popup visibility

  closeModalTherapist() {
    this.showAssignModal = false;
  }
  /** Open modal */
  getPatientId!: string;
  assignDetails(userId: any) {
    debugger;
    this.showAssignModal = true;
    this.getPatientId = userId.id;
  }

  /** Fetch therapist list from API */
  getTherapists() {
    this._adminservice.getTherapistList().subscribe({
      next: (res: any[]) => {
        this.therapistList = res || [];
      },
      error: (err) => {
        console.error('Failed to load therapists:', err);
      },
    });
  }

  /** Add therapist from dropdown */
  addTherapist(therapistId: string) {
    const therapist = this.therapistList.find((t) => t.id === therapistId);
    if (
      therapist &&
      !this.selectedTherapists.some((t) => t.id === therapist.id)
    ) {
      this.selectedTherapists.push(therapist);
    }
  }

  /** Remove therapist chip */
  removeTherapist(therapist: any) {
    this.selectedTherapists = this.selectedTherapists.filter(
      (t) => t.id !== therapist.id,
    );
  }

  /** Save selection */
  saveTherapists() {
    const patientId = this.getPatientId;
    const therapistIds: string[] = this.setTherapistIds || [];

    if (!patientId || therapistIds.length === 0) {
      console.warn('Please select at least one therapist.');
      return;
    }

    const payload: any = {
      patientId: patientId,
      therapistIds: therapistIds,
    };

    this._adminservice.assignTherapistToPatient(payload).subscribe({
      next: (res) => {
        this.loadPatientsList();
        this.selectedTherapist = '';
        this.toastr.success('Saved successfully');
        this.showAssignModal = false;
        console.log('Therapists assigned successfully:', res);
      },
      error: (err) => {
        console.error('Error assigning therapists:', err);
      },
    });
  }

  selectedTherapistId: any;
  setTherapistIds: any[] = [];
  // onTherapistChange(id: Event): void {
  //   // const selectedTherapist = this.therapistList.find(t => t.id === id);
  //   console.log('Selected Therapist:', id);
  //   // this.setTherapistIds = selectedTherapist.userId;
  // }

  // selectedValueIds:any;

  selectedTherapist: any = null;
  // setTherapistIds: string[] = [];

  onTherapistChange() {
    if (this.selectedTherapist) {
      this.setTherapistIds = [this.selectedTherapist.id]; // store the id
    } else {
      this.setTherapistIds = [];
    }
    console.log(this.setTherapistIds);
  }

  getTherapist() {
    this._authservice.getTherapistList().subscribe({
      next: (res: any[]) => {
        this.therapistList = res;
      },
      error: (err) => {
        console.error('Failed to load therapists:', err);
      },
    });
  }

  showModal: boolean = false;

  /** Toggle therapist selection */
  toggleTherapist(therapist: any) {
    const exists = this.selectedTherapists.some((t) => t.id === therapist.id);
    if (exists) {
      this.selectedTherapists = this.selectedTherapists.filter(
        (t) => t.id !== therapist.id,
      );
    } else {
      this.selectedTherapists.push(therapist);
    }
  }

  meetingTypeOptions: MeetingTypeOption[] = [];
  public schedulerService = inject(SchedulerService);
  public dropdownService = inject(DropdownService);
  fetchDropdownOptions(category: string): void {
    this.schedulerService
      .getDropdownsByCategory(category)
      .subscribe((options: any[]) => {
        const mappedOptions = options.map((item) => ({
          id: item.id,
          value: item.name || item.value || item.text || item.label,
        }));
        if (category === 'MeetingType') {
          this.meetingTypeOptions = mappedOptions;
        }
      });
  }

  appointmentTypeList: any[] = [];
  getItems() {
    this.dropdownService.getItems().subscribe((res) => {
      this.appointmentTypeList = res;
      console.log('res', res);
    });
  }

  openMenuId: number | null = null;

  toggleActionMenu(id: number) {
    this.openMenuId = this.openMenuId === id ? null : id;
  }

  closeMenu() {
    this.openMenuId = null;
  }

  @HostListener('document:click', ['$event'])
  onClickOutside(event: Event) {
    const target = event.target as HTMLElement;
    if (!target.closest('.actions-menu') && !target.closest('.three-dot-btn')) {
      this.openMenuId = null;
    }
  }
  onMenuButtonClick(event: MouseEvent, id: number) {
    event.stopPropagation();
    this.openMenuId = this.openMenuId === id ? null : id;
  }

  openModal: boolean = false;
  onAuthorizationChange(event: Event) {
    const checked = (event.target as HTMLInputElement).checked;
    if (checked) {
      this.openModal = true;
    }
  }

  get services(): FormArray {
    return this.patientsInusranceForm.get('services') as FormArray;
  }

  addService() {
    const serviceGroup = this.fb.group({
      serviceType: [''],
      cptCode: [''],
      visitLimit: [''],
      visitsUsed: [''],
    });
    this.services.push(serviceGroup);
  }

  removeService(index: number) {
    this.services.removeAt(index);
  }
  calculateRemainingVisits(index: number): number {
    const service = this.services.at(index);
    const limit = service.get('visitLimit')?.value || 0;
    const used = service.get('visitsUsed')?.value || 0;
    return Math.max(0, limit - used);
  }

  createServiceGroup(): FormGroup {
    return this.fb.group({
      serviceType: [''],
      cptCode: [''],
      visitLimit: [''],
      visitsUsed: [''],
    });
  }

  getAvatarColor(initials: string): string {
    const colors = [
      '#3498db',
      '#2ecc71',
      '#e74c3c',
      '#f39c12',
      '#9b59b6',
      '#1abc9c',
      '#34495e',
      '#d35400',
      '#c0392b',
      '#16a085',
    ];
    let hash = 0;
    for (let i = 0; i < initials.length; i++) {
      hash = initials.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  }
  getInitials(name: string, contactPerson: string): string {
    const fullName = name || contactPerson || '';
    if (!fullName.trim()) return '??';
    const names = fullName.split(' ');
    if (names.length === 1) {
      return names[0].charAt(0).toUpperCase();
    }
    return (
      names[0].charAt(0) + names[names.length - 1].charAt(0)
    ).toUpperCase();
  }

  showDeleteModal = signal(false);
  patientToDelete = signal<any>(null);
  isDeleting = signal(false);

  // Add these methods
  confirmDelete(patient: any): void {
    this.patientToDelete.set(patient);
    this.showDeleteModal.set(true);
  }

  deletePatient(): void {
    const patient = this.patientToDelete();
    if (!patient || !patient.id) {
      this._toastr.error('Invalid patient data');
      return;
    }

    this.isDeleting.set(true);
    this._adminservice.deletePatient(patient.id).subscribe({
      next: (res: any) => {
        this._toastr.success(res.message || 'Patient deleted successfully');
        this.loadPatientsList();
        this.closeDeleteModal();
        this.isDeleting.set(false);

        // Reset view states if needed
        if (this.isshowPatientsDetails && this.patient?.id === patient.id) {
          this.goBack();
        }
      },
      error: (err: any) => {
        const errorMessage = err.error?.message || 'Error deleting patient';
        this._toastr.error(errorMessage);
        console.error('Error deleting patient:', err);
        this.isDeleting.set(false);
      },
    });
  }

  loadFiles(): void {
    this._adminservice.getPatientFiles().subscribe({
      next: (data) => {
        this.files = data;
        this.filteredFiles = data;
        this.loading = false;
      },
      error: (err) => {
        console.error('Error fetching patient files', err);
        this.loading = false;
      },
    });
  }

  onSearch(): void {
    const term = this.searchTerm.toLowerCase();
    this.filteredFiles = this.files.filter(
      (f) =>
        f.patientName.toLowerCase().includes(term) ||
        f.originalFileName.toLowerCase().includes(term) ||
        f.category.toLowerCase().includes(term),
    );
  }

  async openFile(fileId: string): Promise<void> {
    console.log('Opening fileId:', fileId);
    try {
      const response = await this._adminservice
        .getPresignedUrl(fileId)
        .toPromise();

      if (response?.success && response.data?.url) {
        console.log('Presigned URL:', response.data.url);
        window.open(response.data.url, '_blank');
      } else {
        alert(response?.message || 'Unable to generate file link.');
      }
    } catch (error) {
      console.error('Error opening file:', error);
      alert('Could not open file.');
    }
  }

  closeDeleteModal(): void {
    this.showDeleteModal.set(false);
    this.patientToDelete.set(null);
  }
  onDeleteAction(patient: any): void {
    this.confirmDelete(patient);
  }
  onMenuDelete(patient: any): void {
    this.confirmDelete(patient);
    this.closeMenu();
  }
  SwitchTabAdd() {
    this.SwitchTab = 'AddPatients';
  }

  getDiagnosis() {
    this._patientService.getDiagnosis().subscribe((res: any) => {
      // console.log("getDiagnosis",res);
      this.DiagnosisArr = res.data;
    });
  }
  syncPatientData(patientData: any): void {
    if (!patientData?.id) {
      this.toastr.error('Invalid patient data');
      return;
    }

    this._patientService.getQuickBookssync(patientData.id).subscribe({
      next: (response: any) => {
        if (!response?.success) {
          this.toastr.error(response?.message || 'Failed to sync patient data');
          return;
        }

        this.toastr.success(response?.message || 'Patient synced successfully');
        this.loadPatientsList();
      },

      error: (err: any) => {
        console.error('Sync failed:', err);

        const errorMessage =
          err?.error?.message || err?.message || 'Failed to sync patient data';

        this.toastr.error(errorMessage);
      },
    });
  }
}
