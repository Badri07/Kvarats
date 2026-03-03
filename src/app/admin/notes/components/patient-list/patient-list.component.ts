import { Component, EventEmitter, Input, Output, OnInit, inject } from '@angular/core';
import { ColDef, GridReadyEvent, GridApi } from 'ag-grid-community';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { Patient, PaginatedPatients } from '../../models/patient.model';
import { PatientService } from '../../services/patient.service';
import { AuthService } from '../../../../service/auth/auth.service';
import { AdminService } from '../../../../service/admin/admin.service';
import { BreadcrumbService } from '../../../../shared/breadcrumb/breadcrumb.service';
import { DateFormatService } from '../../../../service/global-date/date-format-service';

// Define interface for patient selection event
interface PatientSelectionEvent {
  patientId: string;
  patientName: string;
}

@Component({
  selector: 'app-patient-list',
  standalone: false,
  templateUrl: './patient-list.component.html',
  styleUrls: ['./patient-list.component.scss']
})
export class PatientListComponent implements OnInit {
  clientId!: any;
  // @Input() noteType: 'soap' | 'dap' | 'assessment' = 'soap'; // Removed as not needed anymore
  @Output() patientSelected = new EventEmitter<PatientSelectionEvent>(); // Changed to emit object

  patients: Patient[] = [];
  allPatients: Patient[] = [];
  filteredPatients: Patient[] = [];
  loading = false;
  error: string | null = null;

  searchTerm: string = '';
  pageNumber: number = 1;
  pageSize: number = 10;
  totalCount: number = 0;
  totalPages: number = 0;

  columnDefs: ColDef[] = [];
  defaultColDef: ColDef = {
    sortable: true,
    filter: true,
    resizable: true,
  };
  private gridApi!: GridApi;
  private searchSubject = new Subject<string>();

  constructor(private patientService: PatientService) {}

  public authservice  = inject(AuthService);
  public _adminservice  = inject(AdminService);
  public breadcrumbService  = inject(BreadcrumbService);
  public dateFormatService = inject(DateFormatService);

  ngOnInit(): void {
    this.breadcrumbService.setBreadcrumbs([
      { label: 'Notes', url: 'notes' },
      { label: '', url: '' },
    ]);
    
    this.initializeColumnDefs();
    this.loadAllPatients();

    window.addEventListener('dateFormatChanged', () => {
      this.refreshDateDisplay();
    });
    
  }

  private initializeColumnDefs(): void {
    this.columnDefs = [
      {
        headerName: 'Patient Name',
        field: 'firstName',
        flex: 1.2,
        filter:false,
        cellRenderer: (params: any) => {
          const fullName = `${params.data.firstName || ''} ${params.data.lastName || ''}`;
          return `
            <div class="text-sm font-medium text-gray-900">
              ${fullName}
            </div>
          `;
        },
      },
      {
        headerName: 'Date of Birth',
        field: 'dateOfBirth',
        flex: 1,
        filter:false,
        valueFormatter: (params) => {
          return params.value ? this.formatDate(params.value) : 'N/A';
        },
        cellRenderer: (params: any) => {
          const formattedDate = params.value ? this.formatDate(params.value) : 'N/A';
          return `<div class="text-sm text-gray-900">${formattedDate}</div>`;
        }
      },
      {
        headerName: 'Contact',
        field: 'phoneNumber',
        flex: 1,
        filter:false,
        cellRenderer: (params: any) => {
          const phone = params.data.phoneNumber || 'N/A';
          return `
            <div class="text-sm text-gray-900">${phone}</div>
          `;
        }
      },
      {
        headerName: 'Email',
        field: 'email',
        flex: 1.5,
        filter:false,
        cellRenderer: (params: any) => {
          const email = params.value || 'N/A';
          return `
            <div class="text-sm text-gray-900 truncate" title="${email}">${email}</div>
          `;
        }
      },
      {
        headerName: 'Status',
        field: 'active',
        flex: 1,
        filter:false,
        cellRenderer: (params: any) => {
          const isActive = params.value;
          const bgClass = isActive ? 'bg-green-100' : 'bg-red-100';
          const textClass = isActive ? 'text-green-800' : 'text-red-800';
          const statusText = isActive ? 'Active' : 'Inactive';
          
          return `
            <span class="px-2 py-1 text-xs font-medium rounded-full ${bgClass} ${textClass}">
              ${statusText}
            </span>
          `;
        }
      },
      {
        headerName: 'Actions',
        field: 'actions',
        flex: 1,
        filter:false,
        cellRenderer: (params: any) => {
          const fullName = `${params.data.firstName || ''} ${params.data.lastName || ''}`;
          return `
            <div class="text-center">
              <button 
                class="px-4 py-2 bg-orange-400 text-white rounded-md hover:bg-orange-600 transition-colors text-sm font-medium view-notes-btn"
                data-patient-id="${params.data.id}"
                data-patient-name="${fullName}">
                Select Patient
              </button>
            </div>
          `;
        }
      }
    ];
  }

  onSearchChange(value: string): void {
    this.searchTerm = value ?? '';
    this.pageNumber = 1;
    this.applyFilter();
  }

  onGridReady(params: GridReadyEvent): void {
    this.gridApi = params.api;
    
    params.api.addEventListener('cellClicked', (event) => {
      if (event.colDef.headerName === 'Actions') {
        const target = event.event?.target as HTMLElement;
        if (target?.classList.contains('view-notes-btn')) {
          const patientId = target.getAttribute('data-patient-id');
          const patientName = target.getAttribute('data-patient-name');
          if (patientId && patientName) {
            this.viewNotes(patientId, patientName);
          }
        }
      }
    });
  }

  public formatDate(dateString: string): string {
    return this.dateFormatService.formatDate(dateString);
  }

  private refreshDateDisplay(): void {
    if (this.gridApi) {
      this.gridApi.refreshCells({ 
        columns: ['dateOfBirth'],
        force: true 
      });
    }
  }

  loadAllPatients(): void {
    this.clientId = this.authservice.getClientId();
    const getUserRole = this.authservice.getUserRole();
    const isSoloProvider = this.authservice.getSoloProvider();
    this.loading = true;
    this.error = null;

    if (getUserRole === 'Therapist' && !isSoloProvider) {
      this._adminservice.getMyPatientsList().subscribe({
        next: (response: any) => {
          const patients = response.data || response;
          this.allPatients = Array.isArray(patients) ? patients : [];
          this.applyFilter();
          this.loading = false;
        },
        error: (err) => {
          this.error = 'Failed to load patients';
          this.loading = false;
          console.error('Error loading therapist patients:', err);
        }
      });
    } else {
      this.fetchAllPatients();
    }
  }

  private fetchAllPatients(): void {
    const largePageSize = 100;
    let allPatients: Patient[] = [];
    let currentPage = 1;
    let totalFetched = 0;
    
    const fetchPage = () => {
      this.patientService.getPatientsByClientId(this.clientId, currentPage, largePageSize, '').subscribe({
        next: (response: PaginatedPatients) => {
          if (response.data && response.data.length > 0) {
            allPatients = [...allPatients, ...response.data];
            totalFetched += response.data.length;
            
            if (response.totalCount > totalFetched) {
              currentPage++;
              fetchPage();
            } else {
              this.allPatients = allPatients;
              this.applyFilter();
              this.loading = false;
            }
          } else {
            this.allPatients = allPatients;
            this.applyFilter();
            this.loading = false;
          }
        },
        error: (err) => {
          this.error = 'Failed to load patients';
          this.loading = false;
          console.error('Error loading patients:', err);
        }
      });
    };
    
    fetchPage();
  }

  private applyFilter(): void {
    if (!this.searchTerm.trim()) {
      this.filteredPatients = [...this.allPatients];
    } else {
      const searchTermLower = this.searchTerm.toLowerCase().trim();
      this.filteredPatients = this.allPatients.filter(patient => {
        const fullName = `${patient.firstName || ''} ${patient.lastName || ''}`.toLowerCase();
        const email = patient.email?.toLowerCase() || '';
        
        return fullName.includes(searchTermLower) || 
               email.includes(searchTermLower) ||
               patient.phoneNumber?.includes(searchTermLower);
      });
    }
    
    this.totalCount = this.filteredPatients.length;
    this.totalPages = Math.ceil(this.totalCount / this.pageSize);
    this.paginateFilteredResults();
  }

  private paginateFilteredResults(): void {
    const startIndex = (this.pageNumber - 1) * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    this.patients = this.filteredPatients.slice(startIndex, endIndex);
  }

  // onSearch(): void {
  //   this.pageNumber = 1;
  //   this.applyFilter();
  // }

  clearSearch(): void {
    this.searchTerm = '';
    this.pageNumber = 1;
    this.applyFilter();
  }

  nextPage(): void {
    if (this.pageNumber < this.totalPages) {
      this.pageNumber++;
      this.paginateFilteredResults();
    }
  }

  previousPage(): void {
    if (this.pageNumber > 1) {
      this.pageNumber--;
      this.paginateFilteredResults();
    }
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.pageNumber = page;
      this.paginateFilteredResults();
    }
  }

  viewNotes(patientId: string, patientName: string): void {
    this.patientSelected.emit({
      patientId: patientId,
      patientName: patientName
    });
  }

  getPageNumbers(): number[] {
    const pages: number[] = [];
    const startPage = Math.max(1, this.pageNumber - 2);
    const endPage = Math.min(this.totalPages, this.pageNumber + 2);

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }

    return pages;
  }

  get Math() {
    return Math;
  }
}