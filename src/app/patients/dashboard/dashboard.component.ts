import { Component, inject } from '@angular/core';
import { AuthService } from '../../service/auth/auth.service';
import { PatientService } from '../../service/patient/patients-service';
import { PatientVitalsResponseDto, VitalCardConfig } from '../../models/patients.model';
import { TosterService } from '../../service/toaster/tostr.service';
import { PopupService } from '../../service/popup/popup-service';


@Component({
  selector: 'app-dashboard',
  standalone: false,
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class PatientsDashboardComponent {
  public authService = inject(AuthService);
  public vitalsService = inject(PatientService);
  private _toastr = inject(TosterService);
  private _loader = inject(PopupService);

  currentDate: Date = new Date();
  userImage = 'https://randomuser.me/api/portraits/women/31.jpg';
  sidebarOpen = false;

  // Vitals Dashboard State
  latestVitals: PatientVitalsResponseDto | null = null;
  loading = true;
  error: string | null = null;
  selectedVital: VitalCardConfig | null = null;
  showModal = false;

  // Modal State
  vitalHistory: PatientVitalsResponseDto[] = [];
  modalLoading = true;
  saving = false;
  showAddForm = false;
  modalError: string | null = null;

  newVital: any = {
    systolic: null,
    diastolic: null,
    heartRate: null,
    pulse: null,
    respiratoryRate: null,
    temperature: null,
    bloodSugar: null,
    spO2: null,
    weight: null,
    height: null,
    bmi: null
  };

  // Enhanced vital cards with better colors and icons
  vitalCards: VitalCardConfig[] = [
    {
      id: 'blood-pressure',
      title: 'Blood Pressure',
      icon: '💓',
      unit: 'mmHg',
      color: 'from-red-500 to-pink-600',
      field: 'systolic',
      normalRange: '120/80'
    },
    {
      id: 'heart-rate',
      title: 'Heart Rate',
      icon: '❤️',
      unit: 'bpm',
      color: 'from-pink-500 to-rose-600',
      field: 'heartRate',
      normalRange: '60-100'
    },
    {
      id: 'temperature',
      title: 'Temperature',
      icon: '🌡️',
      unit: '°F',
      color: 'from-orange-500 to-red-600',
      field: 'temperature',
      normalRange: '97-99'
    },
    {
      id: 'oxygen',
      title: 'Oxygen Level',
      icon: '🫁',
      unit: '%',
      color: 'from-blue-500 to-cyan-600',
      field: 'spO2',
      normalRange: '95-100'
    },
    {
      id: 'blood-sugar',
      title: 'Blood Sugar',
      icon: '🩸',
      unit: 'mg/dL',
      color: 'from-purple-500 to-indigo-600',
      field: 'bloodSugar',
      normalRange: '70-100'
    },
    {
      id: 'weight',
      title: 'Weight',
      icon: '⚖️',
      unit: 'kg',
      color: 'from-green-500 to-emerald-600',
      field: 'weight',
      normalRange: 'Varies'
    },
    {
      id: 'respiratory',
      title: 'Respiratory Rate',
      icon: '🌬️',
      unit: 'breaths/min',
      color: 'from-teal-500 to-cyan-600',
      field: 'respiratoryRate',
      normalRange: '12-20'
    },
    {
      id: 'bmi',
      title: 'BMI',
      icon: '📊',
      unit: '',
      color: 'from-yellow-500 to-orange-600',
      field: 'bmi',
      normalRange: '18.5-24.9'
    }
  ];

  userName!: string;
  email!: string;
  patientId: any;


  ngOnInit() {
    this.patientId = this.authService.getPatientId();
    this.getUserDetails();
    this.loadLatestVitals();
  }

  getUserDetails() {
    this.userName = this.authService.getPatientUsername();
    this.email = this.authService.getPatientEmail();
  }

  toggleSidebar() {
    this.sidebarOpen = !this.sidebarOpen;
  }

  loadLatestVitals(): void {
    this.loading = true;
    this.error = null;
    const getPatientsId: any = this.authService.getPatientId();
    this.patientId = getPatientsId;

    this.vitalsService.getLatestVitalsByPatientId(getPatientsId).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.latestVitals = response.data;
          // this._toastr.success('Vitals loaded successfully!');
        }
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Failed to load vitals. Please try again.';
        this.loading = false;
        this._toastr.error(err?.error?.message || 'Failed to load vitals. Please try again.');
        console.error('Error loading vitals:', err);
      }
    });
  }

  getVitalValue(field: keyof PatientVitalsResponseDto): string {
    if (!this.latestVitals) return '--';

    const value = this.latestVitals[field];

    if (field === 'systolic' && this.latestVitals.diastolic) {
      return `${this.latestVitals.systolic || '--'}/${this.latestVitals.diastolic || '--'}`;
    }

    return value != null ? value.toString() : '--';
  }

  openVitalModal(vital: VitalCardConfig): void {
    this.selectedVital = vital;
    this.showModal = true;
    this.loadVitalHistory();
  }

  closeModal(): void {
    this.showModal = false;
    this.selectedVital = null;
    this.resetModalState();
  }

  onVitalsUpdated(): void {
    this.loadLatestVitals();
  }

  loadVitalHistory(): void {
    this.modalLoading = true;
    const getPatientsId = this.authService.getPatientId();
    this.vitalsService.getVitalsByPatientId(getPatientsId).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          const data = Array.isArray(response.data) ? response.data : [response.data];
          this.vitalHistory = data.sort((a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
        } else {
          this.vitalHistory = [];
        }
        this.modalLoading = false;
      },
      error: (err) => {
        this.modalError = 'Failed to load vital history.';
        this.modalLoading = false;
        this.vitalHistory = [];
        this._toastr.error(err?.error?.message || 'Failed to load vital history.');
        console.error('Error loading vital history:', err);
      }
    });
  }

  getModalVitalValue(vital: PatientVitalsResponseDto): string {
    if (!this.selectedVital) return '--';
    
    if (this.selectedVital.field === 'systolic' && vital.diastolic) {
      return `${vital.systolic || '--'}/${vital.diastolic || '--'}`;
    }
    const value = vital[this.selectedVital.field as keyof PatientVitalsResponseDto];
    return value != null ? value.toString() : '--';
  }

  toggleAddForm(): void {
    this.showAddForm = !this.showAddForm;
    if (!this.showAddForm) {
      this.resetForm();
    }
  }

  resetForm(): void {
    this.newVital = {
      systolic: null,
      diastolic: null,
      heartRate: null,
      pulse: null,
      respiratoryRate: null,
      temperature: null,
      bloodSugar: null,
      spO2: null,
      weight: null,
      height: null,
      bmi: null
    };
    this.modalError = null;
  }

  resetModalState(): void {
    this.vitalHistory = [];
    this.modalLoading = true;
    this.saving = false;
    this.showAddForm = false;
    this.modalError = null;
    this.resetForm();
  }

  saveVital(): void {
    this.saving = true;
    this.modalError = null;
    this._loader.show();

    const dto = {
      patientId: this.patientId,
      ...this.newVital
    };

    this.vitalsService.addPatientVitals(dto).subscribe({
      next: (response: any) => {
        this._loader.hide();
        if (response.success) {
          this.saving = false;
          this.showAddForm = false;
          this.resetForm();
          this.loadVitalHistory();
          this.onVitalsUpdated();
          this._toastr.success('Vital reading saved successfully!');
          
          // Close the modal automatically after successful save
          setTimeout(() => {
            this.closeModal();
          }, 1000); // Close after 1 second to show success message
        } else {
          this.modalError = response.message || 'Failed to save vital.';
          this.saving = false;
          this._toastr.error(response.message || 'Failed to save vital.');
        }
      },
      error: (err: any) => {
        this._loader.hide();
        this.modalError = 'Failed to save vital. Please try again.';
        this.saving = false;
        this._toastr.error(err?.error?.message || 'Failed to save vital. Please try again.');
        console.error('Error saving vital:', err);
      }
    });
  }

  deleteVital(id: string): void {
    if (!confirm('Are you sure you want to delete this vital record?')) {
      return;
    }

    this._loader.show();
    this.vitalsService.deletePatientVitals(id).subscribe({
      next: (response) => {
        this._loader.hide();
        if (response.success) {
          this.loadVitalHistory();
          this.onVitalsUpdated();
          this._toastr.success('Vital record deleted successfully!');
        } else {
          this.modalError = response.message || 'Failed to delete vital.';
          this._toastr.error(response.message || 'Failed to delete vital.');
        }
      },
      error: (err) => {
        this._loader.hide();
        this.modalError = 'Failed to delete vital. Please try again.';
        this._toastr.error(err?.error?.message || 'Failed to delete vital. Please try again.');
        console.error('Error deleting vital:', err);
      }
    });
  }

  // Helper method to get status color based on value
  getVitalStatus(value: number, vitalType: string): string {
    if (!value) return 'gray';
    
    switch (vitalType) {
      case 'heartRate':
        return value >= 60 && value <= 100 ? 'green' : value >= 50 && value <= 110 ? 'yellow' : 'red';
      case 'temperature':
        return value >= 97 && value <= 99 ? 'green' : value >= 96 && value <= 100 ? 'yellow' : 'red';
      case 'spO2':
        return value >= 95 ? 'green' : value >= 90 ? 'yellow' : 'red';
      case 'bloodSugar':
        return value >= 70 && value <= 100 ? 'green' : value >= 60 && value <= 120 ? 'yellow' : 'red';
      case 'respiratoryRate':
        return value >= 12 && value <= 20 ? 'green' : value >= 10 && value <= 24 ? 'yellow' : 'red';
      case 'bmi':
        return value >= 18.5 && value <= 24.9 ? 'green' : value >= 17 && value <= 27 ? 'yellow' : 'red';
      default:
        return 'green';
    }
  }

  // Add this missing method for placeholder values
  getDefaultPlaceholder(vitalId: string): string {
    switch (vitalId) {
      case 'heart-rate':
        return '72';
      case 'temperature':
        return '98.6';
      case 'oxygen':
        return '98';
      case 'blood-sugar':
        return '90';
      case 'weight':
        return '70';
      case 'respiratory':
        return '16';
      case 'bmi':
        return '22.5';
      default:
        return '';
    }
  }
}