// role-management.component.ts
import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AdminService } from '../../service/admin/admin.service';
import { ToastrService } from 'ngx-toastr';
import { PopupService } from '../../service/popup/popup-service';

interface StatCard {
  icon: string;
  value: string | number;
  label: string;
  trend: string;
  trendType: 'positive' | 'negative';
  color: string;
}

interface Role {
  id: string;
  name: string;
  users: number;
  createdAt: string;
  permissions: { label: string; enabled: boolean }[];
}

@Component({
  selector: 'app-roles-management',
  templateUrl: './roles-management.component.html',
  standalone: false,
  styleUrls: ['./roles-management.component.scss']
})
export class RoleManagementComponent implements OnInit {
  private fb = inject(FormBuilder);
  private toastr = inject(ToastrService);
  public adminService = inject(AdminService);

  stats: StatCard[] = [
    { 
      icon: 'layer-group', 
      value: 0, 
      label: 'Total Roles', 
      trend: '+2 since last month', 
      trendType: 'positive',
      color: 'bg-gradient-to-r from-blue-500 to-blue-600'
    },
    { 
      icon: 'users', 
      value: 1247, 
      label: 'Active Users', 
      trend: '+89 this month', 
      trendType: 'positive',
      color: 'bg-gradient-to-r from-green-500 to-green-600'
    },
    { 
      icon: 'key', 
      value: 156, 
      label: 'Permissions', 
      trend: '+12 this week', 
      trendType: 'positive',
      color: 'bg-gradient-to-r from-purple-500 to-purple-600'
    },
    { 
      icon: 'chart-line', 
      value: '94%', 
      label: 'Admin Activity', 
      trend: '-2% this month', 
      trendType: 'negative',
      color: 'bg-gradient-to-r from-orange-500 to-orange-600'
    },
  ];

  // Roles Data
  roles: Role[] = [];
  public _loader = inject(PopupService);
  
  showAddRoleModal: boolean = false;
  showDeleteModal: boolean = false;
  selectedRole: Role | null = null;
  
  // Forms
  roleForm: FormGroup;
  editRoleForm: FormGroup;

  // Permissions
  availablePermissions = [
    { label: 'User Management', enabled: false },
    { label: 'Role Management', enabled: false },
    { label: 'Content Management', enabled: false },
    { label: 'Analytics Access', enabled: false },
    { label: 'Settings Management', enabled: false },
    { label: 'Report Generation', enabled: false }
  ];

  constructor() {
    this.roleForm = this.fb.group({
      roleName: ['', [Validators.required, Validators.minLength(2)]]
    });

    this.editRoleForm = this.fb.group({
      roleName: ['', [Validators.required, Validators.minLength(2)]]
    });
  }
  getEnabledPermissionsCount(permissions: any[]): number {
  return permissions.filter(p => p.enabled).length;
}

  ngOnInit() {
    this.getAllRoles();
  }

  getAllRoles() {
    this._loader.show();
    this.adminService.getAllRoles().subscribe({
      next: (res: any) => {
        this.roles = res.data.map((role: any) => ({
          id: role.id,
          name: role.roleName,
          createdAt: role.createdAt,
          users: role.userCount ?? 0,
          permissions: this.availablePermissions.map(perm => ({
            ...perm,
            enabled: Math.random() > 0.5 // Random for demo, replace with actual data
          }))
        }));
        this.stats[0].value = this.roles.length;
        this._loader.hide();
      },
      error: (error) => {
        this.toastr.error('Failed to load roles');
                this._loader.hide();
      }
    });
  }

  addRole() {
    if (this.roleForm.valid) {
      this._loader.show();
      const payload = {
        roleName: this.roleForm.value.roleName
      };

      this.adminService.addRole(payload).subscribe({
        next: (res: any) => {
          this.toastr.success('Role added successfully');
          this.roleForm.reset();
          this.showAddRoleModal = false;
          this.getAllRoles();
        },
        error: (error) => {
          this.toastr.error('Failed to add role');
                  this._loader.hide();
        }
      });
    }
  }

editingRole: Role | null = null;
roleToDelete: Role | null = null;
  editRole(role: Role) {
    this.selectedRole = role;
     this.editingRole = role;
  this.roleToDelete = null;
    this.editRoleForm.patchValue({
      roleName: role.name
    });
  }

  updateRole() {
    if (this.editRoleForm.valid && this.selectedRole) {
      this._loader.show();
      const payload = {
        roleName: this.editRoleForm.value.roleName
      };

      this.adminService.updateRole(this.selectedRole.id, payload).subscribe({
        next: (res: any) => {
          this.toastr.success('Role updated successfully');
          this.selectedRole = null;
          this.getAllRoles();
        },
        error: (error) => {
          this.toastr.error('Failed to update role');
                  this._loader.hide();
        }
      });
    }
  }

confirmDelete(role: Role) {
   this.roleToDelete = role;
  this.editingRole = null;
  this.selectedRole = null;
  this.editRoleForm.reset();
  this.selectedRole = role;
  this.showDeleteModal = true;
}
 deleteRole() {
  if (this.roleToDelete) {
    this._loader.show();
    this.adminService.deleteRole(this.roleToDelete.id).subscribe({
      next: (res: any) => {
        this.toastr.success('Role deleted successfully');
        this.showDeleteModal = false;
        this.roleToDelete = null;
        this.getAllRoles();
      },
      error: (error) => {
        this.toastr.error('Failed to delete role');
                this._loader.hide();
      }
    });
  }
 }
  cancelEdit() {
    this.selectedRole = null;
    this.editRoleForm.reset();
  }

  togglePermission(permission: any) {
    permission.enabled = !permission.enabled;
  }

  getRoleIcon(roleName: string): string {
    const icons: { [key: string]: string } = {
      'Admin': 'crown',
      'Manager': 'user-tie',
      'User': 'user',
      'Editor': 'edit',
      'Viewer': 'eye'
    };
    return icons[roleName] || 'user-shield';
  }

  getRoleColor(roleName: string): string {
    const colors: { [key: string]: string } = {
      'Admin': 'bg-gradient-to-r from-red-500 to-pink-600',
      'Manager': 'bg-gradient-to-r from-blue-500 to-blue-600',
      'User': 'bg-gradient-to-r from-green-500 to-green-600',
      'Editor': 'bg-gradient-to-r from-purple-500 to-purple-600',
      'Viewer': 'bg-gradient-to-r from-orange-500 to-orange-600'
    };
    return colors[roleName] || 'bg-gradient-to-r from-gray-500 to-gray-600';
  }
}