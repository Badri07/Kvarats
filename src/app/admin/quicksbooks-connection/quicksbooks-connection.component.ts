import { AfterViewInit, Component, inject } from '@angular/core';
import { AdminService } from '../../service/admin/admin.service';
import { environment } from '../../../environments/environments';
import { ActivatedRoute, Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { PopupService } from '../../service/popup/popup-service';
import { ChangeDetectorRef } from '@angular/core';
import { BreadcrumbService } from '../../shared/breadcrumb/breadcrumb.service';
import { Observable } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { DropdownService } from '../../service/therapist/dropdown.service';
import { AuthService } from '../../service/auth/auth.service';

interface DropdownItem {
  id: string;
  categoryId?: string;
  value: string;
  label: string;
  description?: string;
  price?: number;
  isActive: boolean;
  isSynced?: boolean; 
  sortOrder?: number;
  metadata?: {
    duration?: string;
    cptCode?: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

@Component({
  selector: 'app-quicksbooks-connection',
  standalone: false,
  templateUrl: './quicksbooks-connection.component.html',
  styleUrl: './quicksbooks-connection.component.scss'
})
export class QuicksbooksConnectionComponent implements AfterViewInit {
  realmId: string = '';
  statusConnected: boolean = false;
  selectedTab: 'connection' | 'products' = 'connection';

  services: DropdownItem[] = [];
  loadingServices = false;

  public authService = inject(AuthService);

  constructor(
    private route: ActivatedRoute,
    private toastr: ToastrService,
    private router: Router,
    private _loader: PopupService,
    private adminService: AdminService,
    private dropdownService: DropdownService,
    private cdr: ChangeDetectorRef,
    private breadcrumbService: BreadcrumbService
  ) {}

  ngOnInit() {
    this.breadcrumbService.setBreadcrumbs([
      { label: 'QuickBooks Connections', url: 'quick-books' },
      { label: '', url: '' }
    ]);

    this.checkConnectionStatus();

    this.route.queryParamMap.subscribe(params => {
      const status = params.get('status');
      const connected = params.get('connected');
      this.realmId = params.get('realmId') ?? '';

      if (status === 'connected' || connected === 'true') {
        this.toastr.success('QuickBooks connected successfully!');
        this.statusConnected = true;
      }

      if (status === 'error') {
        this.toastr.error('Failed to connect to QuickBooks.');
        this.statusConnected = false;
      }

      if (this.realmId) {
        this.checkQuickBooksStatus(this.realmId);
      }
    });
  }

  /* ✅ REQUIRED FIX — THIS IS THE KEY PART */
  ngAfterViewInit() {
    setTimeout(() => {
      this.setTab(this.selectedTab);
    });
  }

  setTab(tab: 'connection' | 'products') {
    this.selectedTab = tab;

    const slider = document.querySelector('.slider') as HTMLElement;
    const tabElements = document.querySelectorAll('.tab');

    const tabIndex: Record<'connection' | 'products', number> = {
      connection: 0,
      products: 1
    };

    if (slider && tabElements[tabIndex[tab]]) {
      const tabEl = tabElements[tabIndex[tab]] as HTMLElement;
      slider.style.left = `${tabEl.offsetLeft}px`;
      slider.style.width = `${tabEl.offsetWidth}px`;
    }

    if (tab === 'products') {
      this.loadServices();
    }
  }

  connectQuickBooks() {
    this._loader.show();

    if (this.statusConnected) {
      this.adminService.disconnectQuickBooks().subscribe({
        next: () => {
          this.toastr.success('Disconnected from QuickBooks.');
          this.statusConnected = false;
          this._loader.hide();
          this.cdr.detectChanges();
        },
        error: () => {
          this.toastr.error('Failed to disconnect');
          this._loader.hide();
        }
      });
    } else {
      this.adminService.getAuthUrl().subscribe({
        next: (res: any) => {
          window.location.href = res.authUrl;
        },
        error: () => {
          this._loader.hide();
          this.toastr.error('Failed to get authentication URL');
        }
      });
    }
  }

  checkQuickBooksStatus(realmId: string) {
    this._loader.show();
    this.adminService.getQuickBooksStatus(realmId).subscribe({
      next: (res: any) => {
        this.statusConnected = res.connected;
        this.cdr.detectChanges();
        this._loader.hide();
      },
      error: () => {
        this.statusConnected = false;
        this._loader.hide();
        this.toastr.error('Failed to check QuickBooks status');
      }
    });
  }

  checkConnectionStatus() {
    this._loader.show();
    this.adminService.getConnectionStatus().subscribe({
      next: (res: any) => {
        this.statusConnected = res.isConnected;
        this._loader.hide();
        this.cdr.detectChanges();
      },
      error: error => {
        this.statusConnected = false;
        this._loader.hide();
        this.toastr.error('Failed to check connection status');
        console.error('Connection status error:', error);
      }
    });
  }

  loadServices() {
    const clientId: any = this.authService.getClientId();
    this.loadingServices = true;

    this.dropdownService.getClientItems(clientId).subscribe({
      next: data => {
        this.services = data.map((item: any) => ({
          ...item,
          isSynced: item.isSynced === true || item.isSynced === 'true'
        }));
        this.loadingServices = false;
      },
      error: () => {
        this.toastr.error('Failed to load services');
        this.loadingServices = false;
      }
    });
  }

  syncService(item: any) {
    this._loader.show();
    this.adminService.AddServicesToQuickBooks(item.serviceId).subscribe({
      next: () => {
        this.toastr.success(`${item.label} synced successfully!`);
        this._loader.hide();
        this.loadServices();
      },
      error: () => {
        this.toastr.error(`Failed to sync ${item.label}`);
        this._loader.hide();
        this.loadServices();
      }
    });
  }

  get totalServices(): number {
    return this.services.length;
  }

  get syncedServices(): number {
    return this.services.filter(s => s.isSynced).length;
  }

  get pendingServices(): number {
    return this.services.filter(s => !s.isSynced).length;
  }
}

