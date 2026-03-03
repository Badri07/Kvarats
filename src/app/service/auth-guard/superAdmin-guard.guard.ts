import { Injectable } from '@angular/core';
import { CanActivate, Router, UrlTree } from '@angular/router';
import { JwtHelperService } from '@auth0/angular-jwt';

@Injectable({
  providedIn: 'root'
})
export class SuperAdminGuard implements CanActivate {
  private jwtHelper = new JwtHelperService();

  constructor(private router: Router) {}

  canActivate(): boolean | UrlTree {
    const token = localStorage.getItem('tokenSuperAdmin');

    if (token && !this.jwtHelper.isTokenExpired(token)) {
      const decodedToken = this.jwtHelper.decodeToken(token);
      const role = decodedToken?.role?.name || decodedToken?.role;

      if (role === 'Super Admin') {
        return true;
      }
    }
 const adminToken = localStorage.getItem('token');
    if (adminToken) {
      return this.router.parseUrl('/dashboard');
    }

    return this.router.parseUrl('/patient/login');
    }
}
