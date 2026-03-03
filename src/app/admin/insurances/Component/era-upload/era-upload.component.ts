import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { InsuranceService } from '../../../../service/patient/insurance.service';
import { ERAProcessingResult } from '../../../../models/insurance.model';
import { ButtonComponent } from '../../../../shared/button/button.component';
import { TosterService } from '../../../../service/toaster/tostr.service';
import { finalize } from 'rxjs';
import { BreadcrumbService } from '../../../../shared/breadcrumb/breadcrumb.service';

@Component({
  selector: 'app-era-upload',
  standalone: false,
  templateUrl: './era-upload.component.html',
  styleUrl: './era-upload.component.scss'
})
export class EraUploadComponent {
  private insuranceService = inject(InsuranceService);
  private router = inject(Router);
  private notificationService = inject(TosterService);

selectedFile = signal<File | null>(null);
  isUploading = signal(false);
  uploadResult = signal<ERAProcessingResult | null>(null);
  dragOver = signal(false);
  
  public breadcrumbService = inject(BreadcrumbService)


ngOnInit(){
       this.breadcrumbService.setBreadcrumbs([
  
  {
    label: 'Claim Dashboard',
    url: 'insurance/claims'
  },
  {
    label: 'Insurance Era Dashboard',
    url: 'insurance/era'
  },
    {
    label: '',
    url: ''
  }
    ]);
    this.breadcrumbService.setVisible(true);
}
  onDragOver(event: DragEvent): void {
    event.preventDefault();
    this.dragOver.set(true);
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    this.dragOver.set(false);
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    this.dragOver.set(false);
    
    if (event.dataTransfer?.files && event.dataTransfer.files.length > 0) {
      const file = event.dataTransfer.files[0];
      // Validate file type
      const validExtensions = ['.835', '.txt', '.edi'];
      const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
      
      if (!validExtensions.includes(fileExtension)) {
        this.notificationService.error(
          
          'Please select a valid ERA file (.835, .txt, .edi)'
        );
        return;
      }
      
      this.selectedFile.set(file);
    }
  }

  removeFile(): void {
    this.selectedFile.set(null);
    this.uploadResult.set(null);
  }
onFileSelected(event: Event): void {
  const input = event.target as HTMLInputElement;
  if (input.files && input.files.length > 0) {
    const file = input.files[0];
    console.log('Selected file:', file); // Debug log
    this.selectedFile.set(file);
  }
}

uploadFile(): void {
  const file = this.selectedFile();
  if (!file) {
    console.error('No file selected');
    this.notificationService.error('Please select a file to upload.');
    return;
  }

  this.isUploading.set(true);
  
  this.insuranceService.processERA(file).pipe(
    finalize(() => this.isUploading.set(false))
  ).subscribe({
    next: (result: any) => {
      this.uploadResult.set(result);
      if (result.success) {
        this.notificationService.success(
          `${result.claimsProcessed} claims processed, ${result.claimsMatched} matched`
        );
      } else {
        this.notificationService.error(
          'ERA file could not be processed. Please check the errors below.'
        );
      }
    },
    error: (error) => {
      console.error('Upload failed:', error);
      this.notificationService.error(
        error.error?.message || 'Failed to upload ERA file. Please try again.'
      );
    }
  });
}  goBack(): void {
    this.router.navigate(['/insurance/era']);
  }

  viewERA(): void {
    const result = this.uploadResult();
    if (result?.eraId) {
      this.router.navigate(['/insurance/era', result.eraId]);
    }
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  }
}