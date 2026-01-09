import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AttendanceService } from '../../services/attendance.service';

declare const $: any;

export interface RouteInfo {
    path: string;
    title: string;
    icon: string;
    class: string;
}

// 1. Employee Routes (View: Employee)
export const ROUTES_EMPLOYEE: RouteInfo[] = [
    { path: '/dashboard', title: 'Dashboard', icon: 'dashboard', class: '' }
];

// 2. Manager Routes (View: Manager)
export const ROUTES_MANAGER: RouteInfo[] = [
    { path: '/dashboard', title: 'Dashboard', icon: 'dashboard', class: '' },
    { path: '/my-team', title: 'My Team', icon: 'people', class: '' }
];

// 3. Admin Routes (View: Admin)
export const ROUTES_ADMIN: RouteInfo[] = [
    { path: '/admin-users', title: 'Users', icon: 'person', class: '' },
    { path: '/admin-view', title: 'Admin View', icon: 'bar_chart', class: '' }
];

// 4. Master List (Used by Navbar to match Titles)
export const ROUTES: RouteInfo[] = [
    ...ROUTES_EMPLOYEE,
    ...ROUTES_MANAGER,
    ...ROUTES_ADMIN
];

@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.css']
})
export class SidebarComponent implements OnInit {
  menuItems: any[];
  
  constructor(private router: Router, private service: AttendanceService) { }

  ngOnInit() {
    const userRole = localStorage.getItem('role') || 'EMPLOYEE';

    if (userRole === 'ADMIN') {
        // Default admin view
        this.menuItems = ROUTES_ADMIN;
        // SCENARIO A: User is Admin
        // We subscribe to the service to switch menus dynamically 
        // based on which top-bar button they clicked.
        this.service.viewRole$.subscribe(viewRole => {
            if (viewRole === 'ADMIN') {
                this.menuItems = ROUTES_ADMIN.filter(menuItem => menuItem);
            } else if (viewRole === 'MANAGER') {
                this.menuItems = ROUTES_MANAGER.filter(menuItem => menuItem);
            } else {
                // Default to Employee View
                this.menuItems = ROUTES_EMPLOYEE.filter(menuItem => menuItem);
            }
        });
    } else {
        // SCENARIO B: User is NOT Admin (Standard Behavior)
        // They only see the menu assigned to their actual role.
        if (userRole === 'MANAGER') {
            this.menuItems = ROUTES_MANAGER.filter(menuItem => menuItem);
        } else {
            this.menuItems = ROUTES_EMPLOYEE.filter(menuItem => menuItem);
        }
    }
  }
  
  isMobileMenu() {
      if ($(window).width() > 991) {
          return false;
      }
      return true;
  }

  logout() {
      localStorage.clear();
      this.router.navigate(['/login']);
  }
}