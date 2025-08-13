import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { AdminService } from '../../../service/admin/admin.service';
import { TosterService } from '../../../service/toaster/tostr.service';
import { AuthService } from '../../../service/auth/auth.service';

@Component({
  selector: 'app-client-menu-access',
  templateUrl: './client-menu-access.component.html',
  styleUrls: ['./client-menu-access.component.scss'],
  standalone:false
})
export class ClientMenuAccessComponent implements OnInit {
  
  clients: any[] = [];
  menus: any[] = [];
  groupedMenus: { parent: any; children: any[] }[] = [];
  roles: any[] = [];
  menuRoleSelections: { [menuId: string]: string[] } = {};
  selectedClientId: string | null = null;
  selectedMenuIds: string[] = [];

  loadingClients = false;
  loadingMenus = false;
  saving = false;

  constructor(
    private adminService: AdminService,
    private cdRef: ChangeDetectorRef,
    private toastr:TosterService,
    private authService:AuthService
  ) {}

  ngOnInit(): void {
    this.loadClients();
    this.loadRoles();
  }

  private loadClients() {
    this.loadingClients = true;
    this.adminService.getClientList().subscribe({
      next: (clients) => {
        this.clients = clients || [];
        this.loadingClients = false;
      },
      error: (error) => {
        console.error('Error loading clients:', error);
        this.loadingClients = false;
      }
    });
  }

    private loadRoles() {
  this.authService.getRoleList().subscribe({
    next: (roles) => {
      this.roles = roles || [];
      console.log('Roles loaded:', this.roles);
    },
    error: (error) => {
      console.error('Error loading roles:', error);
    }
  });
}


  onClientChangeEvent(event: Event) {
    const selectElement = event.target as HTMLSelectElement;
    this.onClientChange(selectElement.value);
  }

  onClientChange(clientId: string) {
    this.selectedClientId = clientId || null;
    this.selectedMenuIds = [];
    this.groupedMenus = [];

    if (this.selectedClientId) {
      this.loadMenusForClient(this.selectedClientId);
    }
  }

  loadMenusForClient(clientId: string) {
  this.loadingMenus = true;

  this.adminService.getMenus().subscribe({
    next: (menusResponse: any[]) => {
      const allMenus = menusResponse.map(m => ({
        Id: m.Id?.toString() ?? m.id?.toString(),
        Name: m.Name ?? m.name,
        ParentMenuId: m.ParentMenuId?.toString() ?? m.parentMenuId?.toString() ?? null
      }));

      this.adminService.getClientMenusWithRoles(clientId).subscribe({
        next: (clientMenusWithRoles: any[]) => {
          // IDs must be strings for matching
          this.selectedMenuIds = clientMenusWithRoles
  .map(m => m?.Id ?? m?.id)
  .filter(id => id != null)
  .map(id => id.toString());

console.log('clientMenusWithRoles:', clientMenusWithRoles);


          this.menuRoleSelections = {};
clientMenusWithRoles.forEach(m => {
  if (m && m.id != null) {
    const roles = Array.isArray(m.roleIds) ? m.roleIds : [];
    this.menuRoleSelections[m.id.toString()] = roles
      .filter((rId: any) => rId != null)
      .map((rId: any) => rId.toString());
  }
});
console.log("menuRoleSelections", this.menuRoleSelections);


          const parentMenus = allMenus.filter(m => !m.ParentMenuId);
          this.groupedMenus = parentMenus.map(parent => ({
            parent,
            children: allMenus.filter(m => m.ParentMenuId === parent.Id)
          }));

          this.loadingMenus = false;
        },
        error: err => {
          console.error('Error fetching client menus with roles:', err);
          this.loadingMenus = false;
        }
      });
    },
    error: err => {
      console.error('Error fetching menus:', err);
      this.loadingMenus = false;
    }
  });
}





  toggleRole(menuId: string, roleId: string, event: any) {
    const checked = event.target.checked;
    const currentRoles = this.menuRoleSelections[menuId] || [];

    if (checked && !currentRoles.includes(roleId)) {
      this.menuRoleSelections[menuId] = [...currentRoles, roleId];
    } else if (!checked) {
      this.menuRoleSelections[menuId] = currentRoles.filter(r => r !== roleId);
    }
    
    this.cdRef.detectChanges();
  }



  toggleMenu(menuId: string, event: any) {
    const isChecked = event.target.checked;
    const stringId = menuId.toString();
    
    if (isChecked && !this.selectedMenuIds.includes(stringId)) {
      this.selectedMenuIds = [...this.selectedMenuIds, stringId];
    } else if (!isChecked) {
      this.selectedMenuIds = this.selectedMenuIds.filter(id => id !== stringId);
    }
    
    this.cdRef.detectChanges();
  }

  toggleParent(group: { parent: any; children: any[] }, event: any) {
    const isChecked = event.target.checked;
    const parentId = group.parent.Id.toString();
    const childIds = group.children.map(c => c.Id.toString());

    if (isChecked) {
      // Add parent and all children
      this.selectedMenuIds = [
        ...new Set([...this.selectedMenuIds, parentId, ...childIds])
      ];
    } else {
      // Remove parent and all children
      this.selectedMenuIds = this.selectedMenuIds.filter(
        id => id !== parentId && !childIds.includes(id)
      );
    }
    
    this.cdRef.detectChanges();
  }

  isParentIndeterminate(group: { parent: any; children: any[] }): boolean {
    const parentId = group.parent.Id.toString();
    const childIds = group.children.map(c => c.Id.toString());
    const selectedChildren = this.selectedMenuIds.filter(id => childIds.includes(id));
    
    return selectedChildren.length > 0 && selectedChildren.length < childIds.length;
  }

  saveAccess() {
  if (!this.selectedClientId) return;

  const dto = {
    clientId: this.selectedClientId,
    menus: this.selectedMenuIds.map(menuId => ({
      menuId: menuId,
      roleIds: this.menuRoleSelections[menuId] || []  // <-- send the selected roles here
    }))
  };

  this.saving = true;
  this.adminService.assignMenusToClient(dto).subscribe({
    next: (res) => {
      this.saving = false;
      this.toastr.success(res.message || 'Menus assigned to client successfully.');
      console.log('Menus assigned:', res);
    },
    error: (err) => {
      this.saving = false;
      this.toastr.error(
        err?.error?.message || 'Failed to assign menus to client.'
      );
      console.error('Error assigning menus:', err);
    }
  });
}

trackByGroupIndex(index: number, item: any) {
  return index;
}

trackByMenuId(index: number, item: any) {
  return item.Id;
}

trackByRoleId(index: number, item: any) {
  return item.id;
}


}