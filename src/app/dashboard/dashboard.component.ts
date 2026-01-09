import { Component, OnInit } from '@angular/core';
import { AttendanceService, Employee, Project } from '../services/attendance.service';
import { TimesheetService } from '../services/timesheet.service'; // <--- Import the new Service

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {

  // =============================================
  // 1. EXISTING DASHBOARD DATA
  // =============================================
  userProfile = {
      name: '',
      projectId: '',
      projectName: '',
      managerName: ''
  };

  myLeaves: any[] = [];
  currentUser: string = 'Dakota Rice'; 

  // =============================================
  // 2. NEW: TIMESHEET SCANNING VARIABLES
  // =============================================
  selectedFile: File | null = null;
  isScanning: boolean = false;
  scanMessage: string = '';

  constructor(
      private service: AttendanceService, 
      private timesheetService: TimesheetService // <--- Inject the Service
  ) { }

  ngOnInit() {
    this.loadDashboardData();
    
    // Subscribe to data changes to refresh leaves after a scan
    this.service.dataChanged$.subscribe(() => {
        this.loadDashboardData();
    });
  }

  loadDashboardData() {
    // 1. Load Leaves
    this.myLeaves = this.service.getFutureLeaves(this.currentUser);

    // 2. Load Profile Info
    const employees: Employee[] = this.service.getEmployees();
    const projects: Project[] = this.service.getProjects();
    const managers: any[] = this.service.getManagers(); 
    
    const emp = employees.find(e => e.name === this.currentUser);
    
    if(emp) {
        const proj = projects.find(p => p.id == emp.projectId);
        const mgr = managers.find(m => m.id == emp.managerId);

        this.userProfile = {
            name: emp.name,
            projectId: emp.projectId ? String(emp.projectId) : 'N/A', 
            projectName: proj ? proj.name : 'Unassigned',
            managerName: mgr ? mgr.name : 'Unassigned'
        };
    }
  }

  // =============================================
  // 3. EXISTING: LEAVE WITHDRAWAL LOGIC
  // =============================================
  withdrawLeave(leave: any) {
    if (this.canWithdraw(leave.date)) {
        if(confirm(`Are you sure you want to withdraw your leave on ${leave.date}?`)) {
            this.service.withdrawLeave(leave.date);
        }
    } else {
        alert('Withdrawal is only allowed 15 days in advance.');
    }
  }

  canWithdraw(dateStr: string): boolean {
    const today = new Date();
    const leaveDate = new Date(dateStr);
    const diffTime = leaveDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 15;
  }

  // =============================================
  // 4. NEW: TIMESHEET UPLOAD LOGIC
  // =============================================
  
  onFileSelected(event: any) {
    if (event.target.files && event.target.files.length > 0) {
        this.selectedFile = event.target.files[0];
        this.scanMessage = ''; // Clear previous messages
    }
  }

  uploadTimesheet() {
    if (!this.selectedFile) return;

    this.isScanning = true;
    this.scanMessage = 'Scanning image with Gemini AI... please wait...';

    // Call the backend via TimesheetService
    this.timesheetService.uploadTimesheet(this.selectedFile, this.currentUser)
      .subscribe(
        (response: string) => {
          this.isScanning = false;
          this.scanMessage = response; // Display success message from Backend
          this.selectedFile = null;    // Reset file input
          
          // Refresh data so the new leaves appear in the list immediately
          this.service.dataChanged$.next(true);
        },
        (error: any) => {
          this.isScanning = false;
          console.error(error);
          this.scanMessage = 'Error: ' + (error.error || 'Failed to connect to server.');
        }
      );
  }
}