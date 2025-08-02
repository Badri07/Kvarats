import { Injectable } from '@angular/core';
import { CanActivate, Router, UrlTree } from '@angular/router';
import { JwtHelperService } from '@auth0/angular-jwt';


@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {

  private jwtHelper = new JwtHelperService();

  constructor(private router: Router) {}

  canActivate(): boolean | UrlTree {
    const token = localStorage.getItem('token');

    if (token && !this.jwtHelper.isTokenExpired(token)) {
      const decodedToken = this.jwtHelper.decodeToken(token);
      const role = decodedToken?.role?.name || decodedToken?.role;

      if (role === 'SuperAdmin' ||role === 'Admin' || role === 'Therapist') {
        return true;
      }
    }

    // redirect to login if token is missing, expired, or role is invalid
    return this.router.parseUrl('/login');
  }
}
