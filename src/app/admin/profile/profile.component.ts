import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ProfileService } from '../../service/profile/profile.service';
import { ToastrService } from 'ngx-toastr';
import { BreadcrumbService } from '../../shared/breadcrumb/breadcrumb.service';
import { AuthService } from '../../service/auth/auth.service';

interface ProfileFormData {
  id: string;
  clientId: string;
  clientName: string;
  firstName: string;
  lastName: string;
  userName: string;
  email: string;
  phoneNumber: string;
  address: string;
  department: string | null;
  specialization: string | null;
  qualifications: string | null;
  isTwoFactorEnabled: boolean;
  roles: string[];
  createdAt: string;
  active: boolean;
  countryDataId: number;
  country: string;
  mobilePrefixCode: string;
  stateName: string;
  stateCode: string;
  cityName: string;
  zipCode: string;
  profilePicture?: string;
  isSoloProvider?: boolean;
  
  // Add the new form control names
  state: string | null;
  city: string | null;
}

@Component({
  selector: 'app-profile',
  standalone: false,
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.scss'
})
export class ProfileComponent implements OnInit {
  
  isLoading = false;
  isEditing = false;
  profileData: any;
  get_id!: number;
  profileForm!: FormGroup;
  
  // File upload variables
  selectedFile: File | null = null;
  selectedFilePreview: string | ArrayBuffer | null = null;
  uploadProgress: number = 0;
  isUploading: boolean = false;
  autoUpload: boolean = true;

  // Location variables
  countryList: any[] = [];
  states: any[] = [];
  cities: any[] = [];
  zipCodes: any[] = [];
  selectedCountry: any = null;
  selectedStateCode: string = '';
  selectedCity: string = '';
  showLocationFields: boolean = false;

  private toastr = inject(ToastrService);
  private breadcrumbService = inject(BreadcrumbService);
  public authService = inject(AuthService);

  constructor(
    private profileService: ProfileService,
    private fb: FormBuilder
  ) {
    this.initForm();
  }

  ngOnInit() {
    this.loadProfileData();
    this.breadcrumbService.setVisible(false);
  }

  initForm() {
    this.profileForm = this.fb.group({
      firstName: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(50)]],
      lastName: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(50)]],
      email: ['', [Validators.required, Validators.email]],
      countryDataId: [0],
      phoneNumber: ['', [Validators.pattern(/^[0-9+\-\s()]*$/)]],
      isTwoFactorEnabled: [true],
      profilePicture: [''],
      userName:[''],
      address:[''],
      // Location fields
      country: [null],
      state: [null],
      city: [null],
      isSoloProvider: [false]
    });
  }

  loadProfileData() {
    this.isLoading = true;
    const userRole = this.authService.getUserRole();
    
    // Check if user is Admin or Therapist to show location fields
    this.showLocationFields = userRole === 'Admin' || userRole === 'Therapist';
    
    const profileObservable = userRole === 'Admin' || userRole === 'Therapist' 
      ? this.profileService.getAdminProfile()
      : this.profileService.getProfile();

    profileObservable.subscribe({
      next: (response: any) => {
        this.profileData = response.data || response;
        this.get_id = this.profileData.id;
        this.isLoading = false;
        
        // Load countries if location fields are shown
        if (this.showLocationFields) {
          this.loadCountries();
        }
        
        console.log('User roles:', this.profileData.roles);
      },
      error: (error) => {
        console.error('Error loading profile:', error);
        this.isLoading = false;
        this.toastr.error('Failed to load profile data', 'Error');
      }
    });
  }

  // File selection handler
  onFileSelected(event: any): void {
    const file = event.target.files[0];
    
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        this.toastr.error('File size must be less than 5MB', 'File Too Large');
        this.resetFileInput(event.target);
        return;
      }

      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        this.toastr.error('Only JPG, PNG, GIF, and WebP images are allowed', 'Invalid File Type');
        this.resetFileInput(event.target);
        return;
      }

      this.selectedFile = file;

      const reader = new FileReader();
      reader.onload = (e) => {
        this.selectedFilePreview = reader.result;
        
        if (this.autoUpload) {
          this.uploadFileAndUpdateProfilePicture();
        }
      };
      reader.onerror = () => {
        this.toastr.error('Error reading file', 'File Error');
        this.resetFileSelection();
      };
      reader.readAsDataURL(file);
    }
  }

  private resetFileInput(inputElement: any): void {
    inputElement.value = '';
    this.resetFileSelection();
  }

  private resetFileSelection(): void {
    this.selectedFile = null;
    this.selectedFilePreview = null;
    this.isUploading = false;
    this.uploadProgress = 0;
  }

  private uploadFileAndUpdateProfilePicture(): void {
    if (!this.selectedFile) return;

    this.isUploading = true;
    this.uploadProgress = 0;

    this.profileService.uploadFile(this.selectedFile).subscribe({
      next: (response: any) => {
        this.isUploading = false;
        this.uploadProgress = 100;
        
        if (response.success && response.data?.url) {
          const uploadedUrl = response.data.url;
          
          this.profileForm.patchValue({
            profilePicture: uploadedUrl
          });

          if (this.profileData) {
            this.profileData.profilePicture = uploadedUrl;
          }

          console.log('File uploaded successfully:', uploadedUrl);
          this.toastr.success('Click "Save Changes" to update your profile.');
          
        } else {
          console.error('Upload response format error:', response);
          this.toastr.error('File upload failed: Invalid response from server', 'Upload Failed');
        }
      },
      error: (error) => {
        this.isUploading = false;
        console.error('File upload error:', error);
        
        let errorMessage = 'File upload failed. Please try again.';
        if (error.status === 413) {
          errorMessage = 'File too large. Please select a smaller file.';
        } else if (error.status === 415) {
          errorMessage = 'Unsupported file type. Please select a valid image.';
        } else if (error.status === 401) {
          errorMessage = 'Authentication failed. Please log in again.';
        }
        
        this.toastr.error(errorMessage, 'Upload Failed');
        this.resetFileSelection();
      }
    });

    const progressInterval = setInterval(() => {
      if (this.uploadProgress < 90) {
        this.uploadProgress += 10;
      } else {
        clearInterval(progressInterval);
      }
    }, 200);
  }

  // Location Methods
  loadCountries() {
    this.authService.getCountries().subscribe({
      next: (res) => {
        this.countryList = res.data || [];
      },
      error: (err) => {
        console.error('Error loading countries:', err);
        this.countryList = [];
      }
    });
  }

  onCountryChange() {
    const selectedCountryObj: any = this.profileForm.value.country;
    if (selectedCountryObj) {
      this.selectedCountry = selectedCountryObj;
      this.getStates();
      this.states = [];
      this.cities = [];
      this.zipCodes = [];
      this.profileForm.patchValue({
        state: null,
        city: null,
        countryDataId: null
      });
    } else {
      this.selectedCountry = null;
      this.states = [];
      this.cities = [];
      this.zipCodes = [];
    }
  }

  onStateChange() {
    this.selectedStateCode = this.profileForm.value.state;
    if (this.selectedStateCode) {
      this.getCities();
      this.cities = [];
      this.zipCodes = [];
      this.profileForm.patchValue({
        city: null,
        countryDataId: null
      });
    } else {
      this.cities = [];
      this.zipCodes = [];
    }
  }

  onCityChange() {
    this.selectedCity = this.profileForm.value.city;
    if (this.selectedCity) {
      this.getZipCodes();
    } else {
      this.zipCodes = [];
    }
  }

  getStates() {
    if (this.selectedCountry?.country) {
      this.authService.getStates(this.selectedCountry.country).subscribe({
        next: (res) => {
          this.states = res.data || [];
        },
        error: (err) => {
          console.error('Error loading states:', err);
          this.states = [];
        }
      });
    } else {
      this.states = [];
    }
  }

  getCities() {
    if (this.selectedCountry?.country && this.selectedStateCode) {
      this.authService.getCities(this.selectedCountry.country, this.selectedStateCode).subscribe({
        next: (res) => {
          this.cities = res.data || [];
        },
        error: (err) => {
          console.error('Error loading cities:', err);
          this.cities = [];
        }
      });
    } else {
      this.cities = [];
    }
  }

  getZipCodes() {
    if (this.selectedCountry?.country && this.selectedStateCode && this.selectedCity) {
      this.authService.getZipCodes(this.selectedCountry.country, this.selectedStateCode, this.selectedCity).subscribe({
        next: (res) => {
          this.zipCodes = res.data || [];
        },
        error: (err) => {
          console.error('Error loading zip codes:', err);
          this.zipCodes = [];
        }
      });
    } else {
      this.zipCodes = [];
    }
  }

  // Type-safe control getter
  getControl(controlName: keyof ProfileFormData) {
    return this.profileForm.get(controlName);
  }

  isControlInvalid(controlName: keyof ProfileFormData): boolean {
    const control = this.getControl(controlName);
    return control ? control.invalid && (control.touched || control.dirty) : false;
  }

  getControlError(controlName: keyof ProfileFormData): string {
    const control = this.getControl(controlName);
    if (!control || !control.errors || (!control.touched && !control.dirty)) return '';
    
    const errors = control.errors;
    
    if (errors['required']) return 'This field is required';
    if (errors['email']) return 'Please enter a valid email address';
    if (errors['minlength']) return `Minimum ${errors['minlength'].requiredLength} characters required`;
    if (errors['maxlength']) return `Maximum ${errors['maxlength'].requiredLength} characters allowed`;
    if (errors['min']) return 'Please select a valid country';
    if (errors['pattern']) return 'Please enter a valid phone number';
    
    return 'Invalid field';
  }

  toggleEdit() {
    this.isEditing = true;
    this.populateForm();
  }

populateForm() {
  if (this.profileData) {
    const formData: any = {
      firstName: this.profileData.firstName || '',
      lastName: this.profileData.lastName || '',
      email: this.profileData.email || '',
      address: this.profileData.address || '',
      userName: this.profileData.userName || '',
      countryDataId: this.profileData.countryDataId || 0,
      phoneNumber: this.profileData.phoneNumber || '',
      isTwoFactorEnabled: this.profileData.isTwoFactorEnabled !== undefined ? this.profileData.isTwoFactorEnabled : true,
      profilePicture: this.profileData.profilePicture || '',
      isSoloProvider: this.profileData.isSoloProvider || false
    };

    // Only populate location fields if they are shown
    if (this.showLocationFields) {
      formData.country = this.profileData.country || null;
      formData.state = this.profileData.stateCode || null;
      formData.city = this.profileData.cityName || null;
    }

    this.profileForm.patchValue(formData);

    // Load location data sequentially
    if (this.showLocationFields) {
      this.loadLocationDataSequentially();
    }
  }
}

private loadLocationDataSequentially() {
  // Step 1: Load countries
  this.authService.getCountries().subscribe({
    next: (res) => {
      this.countryList = res.data || [];
      
      // Set country object if country name exists
      if (this.profileData.country) {
        const countryObj = this.countryList.find(c => c.country === this.profileData.country);
        if (countryObj) {
          this.profileForm.patchValue({ country: countryObj });
          this.selectedCountry = countryObj;
          
          // Step 2: Load states after country is set
          this.loadStatesSequentially();
        }
      }
    },
    error: (err) => {
      console.error('Error loading countries:', err);
    }
  });
}

private loadStatesSequentially() {
  if (!this.selectedCountry?.country) return;

  this.authService.getStates(this.selectedCountry.country).subscribe({
    next: (res) => {
      this.states = res.data || [];
      
      // Set state if stateCode exists
      if (this.profileData.stateCode) {
        this.profileForm.patchValue({ state: this.profileData.stateCode });
        this.selectedStateCode = this.profileData.stateCode;
        
        // Step 3: Load cities after state is set
        this.loadCitiesSequentially();
      }
    },
    error: (err) => {
      console.error('Error loading states:', err);
    }
  });
}

private loadCitiesSequentially() {
  if (!this.selectedCountry?.country || !this.selectedStateCode) return;

  this.authService.getCities(this.selectedCountry.country, this.selectedStateCode).subscribe({
    next: (res) => {
      this.cities = res.data || [];
      
      // Set city if cityName exists
      if (this.profileData.cityName) {
        this.profileForm.patchValue({ city: this.profileData.cityName });
        this.selectedCity = this.profileData.cityName;
        
        // Step 4: Load zip codes after city is set
        this.loadZipCodesSequentially();
      }
    },
    error: (err) => {
      console.error('Error loading cities:', err);
    }
  });
}

private loadZipCodesSequentially() {
  if (!this.selectedCountry?.country || !this.selectedStateCode || !this.selectedCity) return;

  this.authService.getZipCodes(this.selectedCountry.country, this.selectedStateCode, this.selectedCity).subscribe({
    next: (res) => {
      this.zipCodes = res.data || [];
      
      // Set zip code if countryDataId exists
      if (this.profileData.countryDataId) {
        this.profileForm.patchValue({ countryDataId: this.profileData.countryDataId });
      }
    },
    error: (err) => {
      console.error('Error loading zip codes:', err);
    }
  });
}

  updateProfile() {
    if (this.profileForm.valid) {
      this.isLoading = true;
      const profileData: any = {
        firstName: this.profileForm.value.firstName?.trim(),
        lastName: this.profileForm.value.lastName?.trim(),
        email: this.profileForm.value.email?.trim(),
        phoneNumber: this.profileForm.value.phoneNumber?.trim(),
        isTwoFactorEnabled: this.profileForm.value.isTwoFactorEnabled,
        profilePicture: this.profileForm.value.profilePicture,
        countryDataId:this.profileForm.value.countryDataId,
        userName:this.profileForm.value.userName,
        address:this.profileForm.value.address
      };

      // Add location fields only for Admin and Therapist
      if (this.showLocationFields) {
        profileData.countryDataId = this.profileForm.value.countryDataId;
        profileData.isSoloProvider = this.profileForm.value.isSoloProvider;
        // Add other location fields as needed by your API
      }

      const userRole = this.authService.getUserRole();
      const updateObservable = userRole === 'Admin' || userRole === 'Therapist'
        ? this.profileService.updateAdminProfile(this.get_id, profileData)
        : this.profileService.updateProfile(this.get_id, profileData);

      updateObservable.subscribe({
        next: (response: any) => {
          this.profileData = { 
            ...this.profileData, 
            ...profileData 
          };
          
          this.isEditing = false;
          this.isLoading = false;
          this.selectedFile = null;
          this.selectedFilePreview = null;
          this.uploadProgress = 0;
          
          this.toastr.success('Profile updated successfully!', 'Success');
          this.loadProfileData();
        },
        error: (error) => {
          console.error('Error updating profile:', error);
          this.isLoading = false;
          
          let errorMessage = 'Error updating profile. Please try again.';
          if (error.status === 400) {
            errorMessage = 'Invalid data provided. Please check your inputs.';
          } else if (error.status === 401) {
            errorMessage = 'Authentication failed. Please log in again.';
          } else if (error.status === 403) {
            errorMessage = 'You do not have permission to perform this action.';
          } else if (error.status === 404) {
            errorMessage = 'Profile not found.';
          } else if (error.status === 500) {
            errorMessage = 'Server error. Please try again later.';
          }
          
          this.toastr.error(errorMessage, 'Update Failed');
        }
      });
    } else {
      this.markFormGroupTouched();
      this.toastr.warning('Please fill all required fields correctly', 'Validation Error');
    }
  }

  cancelEdit() {
    this.isEditing = false;
    this.selectedFile = null;
    this.selectedFilePreview = null;
    this.uploadProgress = 0;
    this.isUploading = false;
    this.populateForm();
  }

  private markFormGroupTouched() {
    Object.keys(this.profileForm.controls).forEach(key => {
      const control = this.profileForm.get(key);
      control?.markAsTouched();
    });
  }

  onSubmit() {
    if (this.profileForm.valid) {
      this.updateProfile();
    } else {
      this.markFormGroupTouched();
      this.scrollToFirstInvalidControl();
    }
  }

  private scrollToFirstInvalidControl() {
    const firstInvalidControl = document.querySelector('.ng-invalid');
    if (firstInvalidControl) {
      firstInvalidControl.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }

  // Helper methods
  getInitials(): string {
    if (!this.profileData) return '';
    const first = this.profileData.firstName?.charAt(0) || '';
    const last = this.profileData.lastName?.charAt(0) || '';
    return (first + last).toUpperCase();
  }

  getFullName(): string {
    if (!this.profileData) return '';
    return `${this.profileData.firstName || ''} ${this.profileData.lastName || ''}`.trim();
  }

  formatDate(date: string): string {
    if (!date) return 'Not available';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  formatPhoneNumber(phone: string): string {
    if (!phone) return 'Not provided';
    return phone;
  }

  get2FAStatus(): string {
    return this.profileData?.isTwoFactorEnabled ? 'Enabled' : 'Disabled';
  }

  get2FAColor(): string {
    return this.profileData?.isTwoFactorEnabled ? 'text-green-600' : 'text-gray-600';
  }

  getFormattedRoles(): string {
    if (!this.profileData?.roles || this.profileData.roles.length === 0) {
      return 'No roles assigned';
    }
    return this.profileData.roles.join(', ');
  }

  hasRole(role: string): boolean {
    return this.profileData?.roles?.includes(role) || false;
  }

  getRoleBadgeClass(role: string): string {
    const roleColors: { [key: string]: string } = {
      'Admin': 'bg-red-100 text-red-800 border-red-200',
      'Super Admin': 'bg-purple-100 text-purple-800 border-purple-200',
      'Manager': 'bg-blue-100 text-blue-800 border-blue-200',
      'User': 'bg-green-100 text-green-800 border-green-200',
      'Editor': 'bg-orange-100 text-orange-800 border-orange-200',
      'Viewer': 'bg-gray-100 text-gray-800 border-gray-200',
      'Therapist': 'bg-indigo-100 text-indigo-800 border-indigo-200'
    };
    
    return roleColors[role] || 'bg-gray-100 text-gray-800 border-gray-200';
  }

  getRoleIcon(role: string): string {
    const roleIcons: { [key: string]: string } = {
      'Admin': 'fa-user-shield',
      'Super Admin': 'fa-crown',
      'Manager': 'fa-user-tie',
      'User': 'fa-user',
      'Editor': 'fa-edit',
      'Viewer': 'fa-eye',
      'Therapist': 'fa-user-md'
    };
    
    return roleIcons[role] || 'fa-user';
  }
}