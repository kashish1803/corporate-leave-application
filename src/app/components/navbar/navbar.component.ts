import { Component, OnInit, ElementRef } from '@angular/core';
import { ROUTES } from '../sidebar/sidebar.component';
import { Location } from '@angular/common';
import { Router } from '@angular/router';
import { AttendanceService } from '../../services/attendance.service';

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

    userProfile: any = {}; 
    currentUser: string = 'Dakota Rice';

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
      // 1. Check if the actual logged-in user is Admin
      const role = localStorage.getItem('role');
      this.isUserAdmin = (role === 'ADMIN');

      // 2. Initialize Default View
      if(this.isUserAdmin) {
          this.currentView = 'ADMIN';
          this.service.switchToView('ADMIN'); // Sync service
      }

      this.listTitles = ROUTES.filter(listTitle => listTitle);
      const navbar: HTMLElement = this.element.nativeElement;
      this.toggleButton = navbar.getElementsByClassName('navbar-toggler')[0];
      
      this.router.events.subscribe((event) => {
        this.sidebarClose();
        var $layer: any = document.getElementsByClassName('close-layer')[0];
        if ($layer) { $layer.remove(); this.mobile_menu_visible = 0; }
     });

     this.loadUserProfile();
    }

    // 3. Handle Button Click
    switchView(role: string) {
        this.currentView = role;
        this.service.switchToView(role); // Tell Sidebar to change

        // Optional: Redirect to a safe page for that role
        if(role === 'EMPLOYEE') this.router.navigate(['/dashboard']);
        if(role === 'MANAGER') this.router.navigate(['/my-team']);
        if(role === 'ADMIN') this.router.navigate(['/admin-users']);
    }

    // ... (Keep existing loadUserProfile, sidebarOpen, sidebarClose, getTitle methods)
    loadUserProfile() {
        const employees = this.service.getEmployees();
        const projects = this.service.getProjects();
        const managers = this.service.getManagers();

        const emp = employees.find(e => e.name === this.currentUser);
        if (emp) {
            const proj = projects.find(p => p.id == emp.projectId);
            const mgr = managers.find(m => m.id == emp.managerId);

            this.userProfile = {
                name: emp.name,
                empId: emp.empCode,
                projectId: emp.projectId ? String(emp.projectId) : 'N/A',
                projectName: proj ? proj.name : 'Unassigned',
                managerName: mgr ? mgr.name : 'Unassigned'
            };
        }
    }
    
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