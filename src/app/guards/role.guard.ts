import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, Router } from '@angular/router';

@Injectable({ providedIn: 'root' })
export class RoleGuard implements CanActivate {

  constructor(private router: Router) {}

  canActivate(route: ActivatedRouteSnapshot): boolean {
    const allowedRoles: string[] = route.data['roles'];
    
    // FIX: Use 'userRole' to match AttendanceService
    const userRole = localStorage.getItem('userRole'); 

    if (userRole && allowedRoles.includes(userRole)) {
      return true;
    }

    // Optional: Redirect to unauthorized page instead of login if they are already logged in
    this.router.navigate(['/login']);
    return false;
  }
}