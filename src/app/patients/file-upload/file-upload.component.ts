import { ChangeDetectorRef, Component, inject, Input, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { DropdownDataService } from '../../service/dropdown/dropdown-data-service';
import { CountriesData } from '../../models/dropdown-data-model';
import { Column, GridApi, GridReadyEvent, PaginationChangedEvent } from 'ag-grid-community';
import * as XLSX from 'xlsx';
import * as FileSaver from 'file-saver';
import { ToastrService } from 'ngx-toastr';
import { SuperAdminService } from '../../service/admin/superAdmin.service';
import { PopupService } from '../../service/popup/popup-service';
import { MultipleFileUploadRequest, PatientFileDto, PatientService, UpdatePatientFileRequest } from '../../service/patient/patients-service';
import { AuthService } from '../../service/auth/auth.service';

interface CustomFile extends File {
  sizeError?: boolean;
}

@Component({
  selector: 'app-file-upload',
  standalone: false,
  templateUrl: './file-upload.component.html',
  styleUrl: './file-upload.component.scss'
})
export class FileUploadComponent implements OnInit {
  private authservice = inject(AuthService)
  public _loader = inject(PopupService);
  
  public patientId!: string;
  
  files: PatientFileDto[] = [];
  filteredFiles: PatientFileDto[] = [];
  categories: string[] = [];
  selectedCategory = '';
  searchTerm = '';
  
  showUploadModal = false;
  showEditModal = false;
  editingFile: PatientFileDto | null = null;
  
  selectedFiles: CustomFile[] = [];
  uploadRequest: MultipleFileUploadRequest = {
    patientId: '',
    category: '',
    description: '',
    tags: '',
    isConfidential: false
  };
  
  editRequest: UpdatePatientFileRequest = {
    category: '',
    description: '',
    tags: '',
    isConfidential: false
  };
  
  isLoading = false;
  isUploading = false;
  isDownloading = false;
  dragOver = false;

  // File size validation properties
  hasSizeError = false;
  formSubmitted = false;
  readonly MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB in bytes

  // Delete modal properties
  showDeleteModal = false;
  fileToDelete: PatientFileDto | null = null;
  isDeleting = false;

  constructor(
    private patientService: PatientService,
    private toastr: ToastrService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.uploadRequest.patientId = this.authservice.getPatientId();
    this.loadCategories();
    this.loadFiles();
  }

  loadCategories(): void {
    this.patientService.getFileCategories().subscribe({
      next: (categories) => {
        this.categories = categories;
      },
      error: (error) => {
        console.error('Error loading categories:', error);
        this.toastr.error('Failed to load categories');
        // Fallback categories
        this.categories = ['Medical Records', 'Lab Results', 'Imaging', 'Prescriptions', 'Insurance', 'Other'];
      }
    });
  }

  loadFiles(): void {
    this._loader.show();
    this.patientId = this.authservice.getPatientId();
    this.patientService.getPatientFilesByPatientId(this.patientId).subscribe({
      next: (files) => {
        this.files = files;
        this.filteredFiles = files;
        this._loader.hide();
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Error loading files:', error);
        this._loader.hide();
        this.toastr.error('Failed to load files');
      }
    });
  }

  getFileIcon(fileType: string): string {
    const type = fileType?.toLowerCase() || '';
    if (type.includes('pdf')) return '📄';
    if (type.includes('image') || type.includes('jpg') || type.includes('png') || type.includes('jpeg')) return '🖼️';
    if (type.includes('word') || type.includes('doc')) return '📝';
    if (type.includes('excel') || type.includes('spreadsheet') || type.includes('xls')) return '📊';
    if (type.includes('video')) return '🎥';
    return '📁';
  }

  getFileIconClass(fileType: string): string {
    const type = fileType?.toLowerCase() || '';
    if (type.includes('pdf')) return 'text-2xl text-red-500';
    if (type.includes('image')) return 'text-2xl text-green-500';
    if (type.includes('word') || type.includes('doc')) return 'text-2xl text-blue-500';
    if (type.includes('excel') || type.includes('spreadsheet')) return 'text-2xl text-green-600';
    return 'text-2xl text-gray-500';
  }

  getConfidentialCount(): number {
    return this.files.filter(f => f.isConfidential).length;
  }

  // Calculate total size of selected files
  getTotalFileSize(): string {
    if (this.selectedFiles.length === 0) return '0 B';
    
    const totalBytes = this.selectedFiles.reduce((total, file) => total + file.size, 0);
    return this.getFileSize(totalBytes);
  }

  downloadSampleFile(): void {
    this._loader.show();
    this.isDownloading = true;
    // Implement sample file download logic here
    setTimeout(() => {
      this._loader.hide();
      this.isDownloading = false;
      this.toastr.success('Sample file downloaded successfully');
    }, 2000);
  }

  onFileSelect(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files) {
      this.processFiles(input.files);
    }
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    this.dragOver = true;
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    this.dragOver = false;
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    this.dragOver = false;
    if (event.dataTransfer?.files) {
      this.processFiles(event.dataTransfer.files);
    }
  }

  // Process files with size validation
  processFiles(files: FileList): void {
    const fileArray = Array.from(files);
    
    // Check each file for size limit and mark oversized files
    fileArray.forEach(file => {
      (file as any).sizeError = file.size > this.MAX_FILE_SIZE;
    });
    
    // Add files to selected files list
    this.selectedFiles = [...this.selectedFiles, ...fileArray];
    
    // Update error state
    this.updateSizeErrorState();
    this.cdr.detectChanges();
  }

  // Remove single file
  removeFile(index: number): void {
    this.selectedFiles.splice(index, 1);
    this.updateSizeErrorState();
    this.cdr.detectChanges();
  }

  // Clear all files
  clearAllFiles(): void {
    this.selectedFiles = [];
    this.hasSizeError = false;
    this.cdr.detectChanges();
  }

  // Update size error state
  updateSizeErrorState(): void {
    this.hasSizeError = this.selectedFiles.some(file => (file as any).sizeError);
  }

  getFileSize(bytes: number): string {
    if (bytes === 0) return '0 B';
    
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  // Close modal handler
  closeModal(): void {
    if (!this.isUploading) {
      this.showUploadModal = false;
      this.clearAllFiles();
      this.formSubmitted = false;
      this.resetForm();
    }
  }

  onSubmit(): void {
    this.formSubmitted = true;
    
    // Check validation
    if (this.selectedFiles.length === 0 || !this.uploadRequest.category || this.hasSizeError) {
      if (this.hasSizeError) {
        this.toastr.error('Please remove files larger than 5MB before uploading');
      } else if (!this.uploadRequest.category) {
        this.toastr.error('Please select a category');
      } else {
        this.toastr.error('Please select files to upload');
      }
      return;
    }

    this._loader.show();
    this.isUploading = true;
    
    this.patientService.uploadMultipleFiles(this.selectedFiles, this.uploadRequest).subscribe({
      next: (response) => {
        this._loader.hide();
        this.isUploading = false;
        this.showUploadModal = false;
        this.resetForm();
        this.clearAllFiles();
        this.formSubmitted = false;
        this.loadFiles(); // Reload files to show new uploads
        this.toastr.success(`Successfully uploaded ${response.successCount} files`);
      },
      error: (error) => {
        this._loader.hide();
        this.isUploading = false;
        console.error('Upload error:', error);
        this.toastr.error('Failed to upload files');
      }
    });
  }

  resetForm(): void {
    this.uploadRequest = {
      patientId: this.patientId,
      category: '',
      description: '',
      tags: '',
      isConfidential: false
    };
    this.cdr.detectChanges();
  }

  onCategoryChange(): void {
    this.applyFilters();
  }

  onSearch(): void {
    if (this.searchTerm.trim()) {
      this.patientService.searchPatientFiles(
        this.patientId,
        this.searchTerm,
        this.selectedCategory || undefined
      ).subscribe({
        next: (files) => {
          this.filteredFiles = files;
        },
        error: (error) => {
          console.error('Error searching files:', error);
          this.toastr.error('Failed to search files');
          this.applyFilters(); // Fallback to client-side filtering
        }
      });
    } else {
      this.applyFilters();
    }
  }

  applyFilters(): void {
    this.filteredFiles = this.files;

    if (this.selectedCategory) {
      this.filteredFiles = this.filteredFiles.filter(f => f.category === this.selectedCategory);
    }

    if (this.searchTerm.trim()) {
      const term = this.searchTerm.toLowerCase();
      this.filteredFiles = this.filteredFiles.filter(f =>
        f.originalFileName.toLowerCase().includes(term) ||
        f.description?.toLowerCase().includes(term) ||
        f.tags?.toLowerCase().includes(term)
      );
    }
  }

  clearFilters(): void {
    this.selectedCategory = '';
    this.searchTerm = '';
    this.applyFilters();
  }

  onDownloadFile(fileId: string): void {
    this._loader.show();
    this.patientService.downloadFile(fileId).subscribe({
      next: (blob) => {
        this._loader.hide();
        const file = this.files.find(f => f.id === fileId);
        if (file) {
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = file.originalFileName;
          document.body.appendChild(a);
          a.click();
          window.URL.revokeObjectURL(url);
          document.body.removeChild(a);
          this.toastr.success('File downloaded successfully');
        }
      },
      error: (error) => {
        this._loader.hide();
        console.error('Error downloading file:', error);
        this.toastr.error('Failed to download file');
      }
    });
  }

  onDeleteFile(fileId: string): void {
    const file = this.files.find(f => f.id === fileId);
    if (file) {
      this.fileToDelete = file;
      this.showDeleteModal = true;
    }
  }

  closeDeleteModal(): void {
    this.showDeleteModal = false;
    this.fileToDelete = null;
    this.isDeleting = false;
  }

  deleteFile(): void {
    this._loader.show();
    if (!this.fileToDelete) return;

    this.isDeleting = true;
    this.patientService.deletePatientFile(this.fileToDelete.id).subscribe({
      next: () => {
        this._loader.hide();
        this.loadFiles(); // Reload files to reflect deletion
        this.toastr.success('File deleted successfully');
        this.closeDeleteModal();
      },
      error: (error) => {
        this._loader.hide();
        console.error('Error deleting file:', error);
        this.toastr.error('Failed to delete file');
        this.isDeleting = false;
      }
    });
  }

  onEditFile(file: PatientFileDto): void {
    this.editingFile = file;
    this.editRequest = {
      category: file.category,
      description: file.description || '',
      tags: file.tags || '',
      isConfidential: file.isConfidential
    };
    this.showEditModal = true;
  }

  onViewFile(fileId: string): void {
    this.patientService.getPresignedUrl(fileId, 60).subscribe({
      next: (response) => {
        window.open(response.url, '_blank');
      },
      error: (error) => {
        console.error('Error getting file URL:', error);
        this.toastr.error('Failed to open file');
      }
    });
  }

  saveEdit(): void {
    this._loader.show();
    if (this.editingFile) {
      this.patientService.updatePatientFile(this.editingFile.id, this.editRequest).subscribe({
        next: (res: any) => {
          this._loader.hide();
          const updatedFile = res?.data || res; // fallback if backend doesn't wrap
          if (updatedFile && updatedFile.id) {
            const index = this.files.findIndex(f => f.id === updatedFile.id);
            if (index !== -1) {
              this.files[index] = updatedFile;
              this.applyFilters();
            }
            this.closeEditModal();
            this.toastr.success(res?.message || 'File updated successfully');
          } else {
            this._loader.hide();
            this.toastr.error(res?.message || 'Failed to update file');
          }
        },
        error: (error) => {
          this._loader.hide();
          console.error('Error updating file:', error);
          this.toastr.error('Failed to update file');
        }
      });
    }
  }

  closeEditModal(): void {
    this.showEditModal = false;
    this.editingFile = null;
  }
}