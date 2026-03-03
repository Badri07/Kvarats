import { Component, OnInit, ChangeDetectorRef, inject } from '@angular/core';
import { AdminService } from '../../../service/admin/admin.service';
import { TosterService } from '../../../service/toaster/tostr.service';
import { AuthService } from '../../../service/auth/auth.service';
import { Observable, forkJoin, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { BreadcrumbService } from '../../../shared/breadcrumb/breadcrumb.service';

interface Menu {
  Id: string;
  Name: string;
  ParentMenuId: string | null;
}

interface Role {
  id: string;
  roleName: string;
}

@Component({
  selector: 'app-client-menu-access',
  templateUrl: './client-menu-access.component.html',
  styleUrls: ['./client-menu-access.component.scss'],
  standalone: false
})
export class ClientMenuAccessComponent implements OnInit {
  
  clients: any[] = [];
  menus: Menu[] = [];
  groupedMenus: { parent: Menu; children: Menu[] }[] = [];
  roles: Role[] = [];
  menuRoleSelections: { [menuId: string]: string[] } = {};
  selectedClientId: string | null = null;
  selectedMenuIds: string[] = [];

  loadingClients = false;
  loadingMenus = false;
  saving = false;

  constructor(
    private adminService: AdminService,
    private cdRef: ChangeDetectorRef,
    private toastr: TosterService,
    private authService: AuthService
  ) {}

  public breadcrumbService = inject(BreadcrumbService)

  ngOnInit(): void {
    this.loadClients();
    this.loadAllRoles();
      this.breadcrumbService.setBreadcrumbs([
      {
        label: 'Menu Management',
        url: 'Appointment/list'
      }
    ]);
    this.breadcrumbService.setVisible(true);
  }

  private loadClients(): void {
    this.loadingClients = true;
    this.adminService.getClientList().subscribe({
      next: (clients) => {
        this.clients = clients || [];
        this.loadingClients = false;
      },
      error: (error) => {
        console.error('Error loading clients:', error);
        this.toastr.error('Failed to load clients');
        this.loadingClients = false;
      }
    });
  }

  private loadAllRoles(): void {
    this.authService.getRoleList().subscribe({
      next: (roles) => {
        this.roles = roles || [];
      },
      error: (error) => {
        console.error('Error loading roles:', error);
        this.toastr.error('Failed to load roles');
      }
    });
  }

  onClientChangeEvent(event: Event): void {
    const selectElement = event.target as HTMLSelectElement;
    this.onClientChange(selectElement.value);
  }

  onClientChange(clientId: string): void {
    this.selectedClientId = clientId || null;
    this.selectedMenuIds = [];
    this.groupedMenus = [];
    this.menuRoleSelections = {};

    if (this.selectedClientId) {
      this.loadMenusForClient(this.selectedClientId);
    }
  }

loadMenusForClient(clientId: string): void {
  this.loadingMenus = true;

  forkJoin([
    this.adminService.getMenus(),
    this.adminService.getClientMenusWithRoles(clientId)
  ]).subscribe({
    next: ([menusResponse, clientMenusResponse]) => {
      try {
        // Process all menus
        const allMenusRaw = Array.isArray(menusResponse) ? menusResponse : 
                          (menusResponse?.data || []);
        
        const allMenus = allMenusRaw.map((m: any) => ({
          Id: m.Id?.toString() ?? m.id?.toString(),
          Name: m.Name ?? m.name,
          ParentMenuId: m.ParentMenuId?.toString() ?? m.parentMenuId?.toString() ?? null,
          isParent: !m.ParentMenuId && !m.parentMenuId
        }));

        const clientMenusRaw = Array.isArray(clientMenusResponse) ? clientMenusResponse :
                             (clientMenusResponse?.data || []);
        this.selectedMenuIds = [];
        this.menuRoleSelections = {};
        allMenus.forEach((menu: any) => {
          this.menuRoleSelections[menu.Id] = [];
        });

        clientMenusRaw.forEach((clientMenu: any) => {
          const menuId = (clientMenu.menuId)?.toString();
          
          if (menuId) {
            if (!this.selectedMenuIds.includes(menuId)) {
              this.selectedMenuIds.push(menuId);
            }
            const roleNames = clientMenu.allowedRoles || [];
            const roleIds = roleNames
              .map((roleName: string) => {
                const role = this.roles.find(r => r.roleName === roleName);
                return role?.id;
              })
              .filter((id: string | undefined): id is string => !!id);

            this.menuRoleSelections[menuId] = roleIds;
          }
        });
        const parentMenus = allMenus.filter((m: any) => !m.ParentMenuId);
        this.groupedMenus = parentMenus.map((parent: any) => ({
          parent,
          children: allMenus.filter((m: any) => m.ParentMenuId === parent.Id),
          hasChildren: allMenus.some((m: any) => m.ParentMenuId === parent.Id)
        }));

      } catch (error) {
        console.error('Error processing menu data:', error);
        this.toastr.error('Failed to process menu data');
      } finally {
        this.loadingMenus = false;
        this.cdRef.detectChanges();
      }
    },
    error: (err) => {
      console.error('Error loading menus:', err);
      this.toastr.error('Failed to load menus');
      this.loadingMenus = false;
      this.cdRef.detectChanges();
    }
  });
}

  toggleRole(menuId: string, roleId: string, event: any): void {
    const checked = event.target.checked;
    const currentRoles = this.menuRoleSelections[menuId] || [];

    if (checked && !currentRoles.includes(roleId)) {
      this.menuRoleSelections[menuId] = [...currentRoles, roleId];
    } else if (!checked) {
      this.menuRoleSelections[menuId] = currentRoles.filter(r => r !== roleId);
    }
    
    this.cdRef.detectChanges();
  }

  toggleMenu(menuId: string, event: any): void {
    const isChecked = event.target.checked;
    const stringId = menuId.toString();
    
    if (isChecked && !this.selectedMenuIds.includes(stringId)) {
      this.selectedMenuIds = [...this.selectedMenuIds, stringId];
    } else if (!isChecked) {
      this.selectedMenuIds = this.selectedMenuIds.filter(id => id !== stringId);
    }
    
    this.cdRef.detectChanges();
  }

  toggleParent(group: { parent: Menu; children: Menu[] }, event: any): void {
    const isChecked = event.target.checked;
    const parentId = group.parent.Id.toString();
    const childIds = group.children.map(c => c.Id.toString());

    if (isChecked) {
      this.selectedMenuIds = [
        ...new Set([...this.selectedMenuIds, parentId, ...childIds])
      ];
    } else {
      this.selectedMenuIds = this.selectedMenuIds.filter(
        id => id !== parentId && !childIds.includes(id)
      );
    }
    
    this.cdRef.detectChanges();
  }

  isParentIndeterminate(group: { parent: Menu; children: Menu[] }): boolean {
    const childIds = group.children.map(c => c.Id.toString());
    const selectedChildren = this.selectedMenuIds.filter(id => childIds.includes(id));
    return selectedChildren.length > 0 && selectedChildren.length < childIds.length;
  }

saveAccess(): void {
  if (!this.selectedClientId) {
    this.toastr.warning('Please select a client');
    return;
  }

  const dto = {
    clientId: this.selectedClientId,
    menus: this.selectedMenuIds.map(menuId => ({
      menuId: menuId,
      roleIds: this.menuRoleSelections[menuId] || []
    }))
  };

  console.log('Saving data:', dto);

  this.saving = true;
  this.adminService.assignMenusToClient(dto).subscribe({
    next: (res) => {
      this.saving = false;
      this.toastr.success(res.message || 'Menu assignments saved successfully');
      // Refresh the data after save
      this.loadMenusForClient(this.selectedClientId!);
    },
    error: (err) => {
      this.saving = false;
      this.toastr.error(
        err?.error?.message || 'Failed to save menu assignments'
      );
      console.error('Error saving menu assignments:', err);
    }
  });
}

  trackByGroupIndex(index: number, item: any): number {
    return index;
  }

  trackByMenuId(index: number, item: Menu): string {
    return item.Id;
  }

  trackByRoleId(index: number, item: Role): string {
    return item.id;
  }

getRoleIcon(roleName: string): string {
  const icons: { [key: string]: string } = {
    'Admin': 'fa-user-cog',
    'Therapist': 'fa-user-md', 
    'Master Admin': 'fa-crown',
    'Admin Intern': 'fa-user-graduate'
  };
  return icons[roleName] || 'fa-user';
}

getMenuIcon(menuName: string): string {
  const icons: { [key: string]: string } = {
    'Dashboard': 'fa-tachometer-alt',
    'Users': 'fa-user-friends',
    'Patient': 'fa-user-injured',
    'Appointments': 'fa-calendar-check',
    'Notes': 'fa-sticky-note',
    'Transactions': 'fa-exchange-alt',
    'Billing & Payments': 'fa-file-invoice-dollar',
    'Insurance & Claims': 'fa-file-medical',
    'Superbills': 'fa-receipt',
    'Sliding Scale': 'fa-sliders-h',
    'Quickbooks Connection': 'fa-exchange-alt'
  };
  return icons[menuName] || 'fa-circle';
}
}