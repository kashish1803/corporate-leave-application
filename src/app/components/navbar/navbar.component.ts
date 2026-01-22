import { Component, OnInit, ElementRef } from '@angular/core';
import { ROUTES } from '../sidebar/sidebar.component';
import { Location } from '@angular/common';
import { Router } from '@angular/router';
import { AttendanceService, UserProfile } from '../../services/attendance.service';

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.css']
})
export class NavbarComponent implements OnInit {
    private listTitles: any[];
    location: Location;
    mobile_menu_visible: any = 0;
    private toggleButton: any;
    private sidebarVisible: boolean;

    // View State
    isUserAdmin: boolean = false; 
    currentView: string = 'ADMIN'; 

    // Dynamic Profile Data
    userProfile: any = {}; 
    currentUser: string = ''; // Will be loaded from Backend

    constructor(
        location: Location, 
        private element: ElementRef, 
        private router: Router,
        private service: AttendanceService
    ) {
      this.location = location;
      this.sidebarVisible = false;
    }

    ngOnInit() {
      // 1. Check Role from LocalStorage (Note: Key is 'userRole' in new service)
      const role = localStorage.getItem('userRole');
      this.isUserAdmin = (role === 'ADMIN');
      this.currentView = role || 'EMPLOYEE';

      // 2. Initialize Default View via Service
      this.service.changeViewRole(this.currentView); 

      this.listTitles = ROUTES.filter(listTitle => listTitle);
      const navbar: HTMLElement = this.element.nativeElement;
      this.toggleButton = navbar.getElementsByClassName('navbar-toggler')[0];
      
      this.router.events.subscribe((event) => {
        this.sidebarClose();
        var $layer: any = document.getElementsByClassName('close-layer')[0];
        if ($layer) { $layer.remove(); this.mobile_menu_visible = 0; }
      });

      // 3. Load Profile from Backend
      this.loadUserProfile();
    }

    // ============================================================
    // 1. VIEW SWITCHING (Admin / Manager / Employee)
    // ============================================================
    switchView(role: string) {
        this.currentView = role;
        this.service.changeViewRole(role); // Updated method name

        // Redirect based on role
        if(role === 'EMPLOYEE') this.router.navigate(['/dashboard']);
        else if(role === 'MANAGER') this.router.navigate(['/my-team']); // Updated route
        else if(role === 'ADMIN') this.router.navigate(['/admin-users']);
    }

    // ============================================================
    // 2. LOAD PROFILE (Optimized /api/users/me call)
    // ============================================================
    loadUserProfile() {
        // Use the dedicated endpoint instead of filtering arrays
        this.service.getProfile().subscribe({
            next: (data: UserProfile) => {
                this.currentUser = data.fullName;
                this.userProfile = {
                    name: data.fullName,
                    empId: data.employeeId,
                    projectId: data.projectId || 'N/A',
                    managerName: data.managerName || 'Unassigned'
                };
            },
            error: (err) => {
                console.error('Failed to load profile', err);
                // If 403, it means the user token is invalid -> logout
                if(err.status === 403) this.logout();
            }
        });
    }

    logout() {
        this.service.logout();
        this.router.navigate(['/login']);
    }
    
    // ============================================================
    // 3. UI HELPERS (Sidebar Toggle)
    // ============================================================
    sidebarOpen() {
        const toggleButton = this.toggleButton;
        const body = document.getElementsByTagName('body')[0];
        setTimeout(function(){
            toggleButton.classList.add('toggled');
        }, 500);

        body.classList.add('nav-open');
        this.sidebarVisible = true;
    };

    sidebarClose() {
        const body = document.getElementsByTagName('body')[0];
        this.toggleButton.classList.remove('toggled');
        this.sidebarVisible = false;
        body.classList.remove('nav-open');
    };

    sidebarToggle() {
        if (this.sidebarVisible === false) {
            this.sidebarOpen();
        } else {
            this.sidebarClose();
        }
    };

    getTitle() {
      var titlee = this.location.prepareExternalUrl(this.location.path());
      if(titlee.charAt(0) === '#'){
          titlee = titlee.slice( 1 );
      }
      // Handle query params in URL title matching
      if(titlee.includes('?')) {
          titlee = titlee.split('?')[0];
      }

      if(this.listTitles) {
          for(var item = 0; item < this.listTitles.length; item++){
              if(this.listTitles[item].path === titlee){
                  return this.listTitles[item].title;
              }
          }
      }
      return 'Dashboard';
    }
}