import { Injectable } from '@angular/core';
import { CanActivate, Router, ActivatedRouteSnapshot, UrlTree } from '@angular/router';
import { JwtHelperService } from '@auth0/angular-jwt';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {
  private jwtHelper = new JwtHelperService();

  constructor(private router: Router) {}

  canActivate(route: ActivatedRouteSnapshot): boolean | UrlTree {
    const token = localStorage.getItem('token');
    
    // First check if this is a patient trying to access admin routes
    const patientToken = localStorage.getItem('tokenPatients');
    if (patientToken && !this.jwtHelper.isTokenExpired(patientToken)) {
      // Patient trying to access admin routes - redirect to patient dashboard
      return this.router.parseUrl('/patient/dashboard');
    }

    if (token && !this.jwtHelper.isTokenExpired(token)) {
      const decodedToken = this.jwtHelper.decodeToken(token);
      const role = decodedToken?.role?.name || decodedToken?.role;
      const allowedRoles = route.data['roles'] as string[];
      
      if (allowedRoles && !allowedRoles.includes(role)) {
        // User doesn't have required role
        if (role === 'SuperAdmin' || role === 'Admin') {
          return this.router.parseUrl('/dashboard');
        } else if (role === 'Patient') {
          return this.router.parseUrl('/patient/dashboard');
        } else {
          return this.router.parseUrl('/login');
        }
      }
      
      // User has required role
      if (role === 'SuperAdmin' || role === 'Admin' || role === 'Therapist' || role === 'Patient') {
        return true;
      }
    }

    // No valid token found
    return this.router.parseUrl('/login');
  }
}