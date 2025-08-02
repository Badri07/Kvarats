import { Component } from '@angular/core';
import { AdminService } from '../../service/admin/admin.service';
import { environment } from '../../../environments/environments';
import { ActivatedRoute, Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { PopupService } from '../../service/popup/popup-service';
import { ChangeDetectorRef } from '@angular/core';
import { BreadcrumbService } from '../../shared/breadcrumb/breadcrumb.service';


@Component({
  selector: 'app-quicksbooks-connection',
  standalone: false,
  templateUrl: './quicksbooks-connection.component.html',
  styleUrl: './quicksbooks-connection.component.scss'
})
export class QuicksbooksConnectionComponent {

  get_message!:any;
  realmId: string = '';
  statusConnected: boolean = false;
  // logoImg:string = '/images/image 11.png';
  subLogoImg:string ='/images/quickbooks.png';
  logoImg:string ='/images/LogoLatest.png';

  constructor(private route:ActivatedRoute,
    private toastr:ToastrService,
    private router:Router,
    private _loader:PopupService,
    private adminService: AdminService,
    private cdr: ChangeDetectorRef,
    private breadcrumbService: BreadcrumbService,
  ){}




  connectQuickBooks() {
  this._loader.show();

  if (this.statusConnected) {
    // Disconnect logic
    this.adminService.disconnectQuickBooks(this.realmId).subscribe({
      next: () => {
        this.toastr.success("Disconnected from QuickBooks.");
        this.statusConnected = false;
        this._loader.hide();
      },
      error: () => {
        this.toastr.error("Failed to disconnect");
        this._loader.hide();
      }
    });
  } else {
    // Connect logic
    const url = `${environment.apidev}/QuickBooks/authorize`;
    window.location.href = url;
  }
}



  ngOnInit() {
     this.breadcrumbService.setBreadcrumbs([
    { label: 'Quickbooks', url: 'quick-books' },
  ]);
    
  this.route.queryParamMap.subscribe(params => {
    const status = params.get('status');
    this.realmId = params.get('realmId') ?? '';

    console.log("RealmId:", this.realmId);

    if (status === 'connected') {
      this.toastr.success("QuickBooks connected successfully!");
    }
    if (status === 'error') {
      this.toastr.error("Failed to connect to QuickBooks.");
    }

    if (this.realmId) {
      this.checkQuickBooksStatus(this.realmId);
    }
  });
}

checkQuickBooksStatus(realmId: string) {
  this._loader.show();

  this.adminService.getQuickBooksStatus(realmId).subscribe({
    next: (res:any) => {
      console.log("Status API Response:", res);
      this.statusConnected = res.connected;
      console.log("statusConnected value set to:", this.statusConnected);

      this.cdr.detectChanges(); // <-- Force Angular to update view

      this._loader.hide();
    },
    error: () => {
      this.statusConnected = false;
      this._loader.hide();
      this.toastr.error("Failed to check QuickBooks status");
    }
  });
}




}
