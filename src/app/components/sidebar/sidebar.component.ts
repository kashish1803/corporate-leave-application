import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AttendanceService } from '../../services/attendance.service';

declare const $: any;

declare interface RouteInfo {
    path: string;
    title: string;
    icon: string;
    class: string;
    roles: string[];
}

export const ROUTES: RouteInfo[] = [
    // ---------------- ADMIN LINKS ----------------
    { 
        path: '/admin-users', 
        title: 'Manage Users',  
        icon: 'people_alt', 
        class: '',
        roles: ['ADMIN']
    },
    { 
        path: '/admin-view', 
        title: 'View Employees',  
        icon: 'content_paste', 
        class: '',
        roles: ['ADMIN']
    },

    // ---------------- MANAGER LINKS ----------------
    { 
        path: '/my-team', 
        title: 'My Team',  
        icon: 'groups', 
        class: '',
        roles: ['MANAGER']
    },

    // ---------------- DASHBOARD (Employee & Manager) ----------------
    { 
        path: '/dashboard', 
        title: 'Dashboard',  
        icon: 'dashboard', 
        class: '',
        roles: ['EMPLOYEE', 'MANAGER'] 
    }
    
    // "Edit Calendar" and "User Profile" removed as requested.
];

@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.css']
})
export class SidebarComponent implements OnInit {
  
  menuItems: any[];
  userRole: string = 'EMPLOYEE';

  constructor(
      private service: AttendanceService,
      private router: Router
  ) { }

  ngOnInit() {
    const user = this.service.getLoggedUser();
    this.userRole = user.role || 'EMPLOYEE';
    this.filterMenu();

    // Subscribe to Role Changes
    this.service.viewRole$.subscribe(role => {
        this.userRole = role || 'EMPLOYEE';
        this.filterMenu();
    });
  }

  filterMenu() {
      // Filter routes where the current userRole exists in the 'roles' array
      this.menuItems = ROUTES.filter(menuItem => 
          menuItem.roles.includes(this.userRole)
      );
  }

  isMobileMenu() {
      if ($(window).width() > 991) {
          return false;
      }
      return true;
  }

  logout() {
      this.service.logout(); 
      this.router.navigate(['/login']); 
  }
}