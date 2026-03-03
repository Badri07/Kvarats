import { Injectable } from '@angular/core';
import { CanActivate, Router, UrlTree } from '@angular/router';
import { JwtHelperService } from '@auth0/angular-jwt';

@Injectable({
  providedIn: 'root'
})
export class PatientAuthGuard implements CanActivate {
  private jwtHelper = new JwtHelperService();

  constructor(private router: Router) {}

  canActivate(): boolean | UrlTree {
    const patientToken = localStorage.getItem('tokenPatients');

    if (patientToken && !this.jwtHelper.isTokenExpired(patientToken)) {
      const decodedToken = this.jwtHelper.decodeToken(patientToken);
      const role = decodedToken?.role?.name || decodedToken?.role;

      if (role === 'Patient') {
        return true;
      }
    }

    // If no valid patient token, check if admin is logged in
    const adminToken = localStorage.getItem('token');
    if (adminToken && !this.jwtHelper.isTokenExpired(adminToken)) {
      const decodedAdminToken = this.jwtHelper.decodeToken(adminToken);
      const adminRole = decodedAdminToken?.role?.name || decodedAdminToken?.role;
      
      // Only redirect to admin dashboard if user is actually an admin/superadmin
      if (adminRole === 'Admin' || adminRole === 'SuperAdmin') {
        return this.router.parseUrl('/dashboard');
      }
    }

    // Redirect to patient login if no valid tokens
    return this.router.parseUrl('/patient/login');
  }
}