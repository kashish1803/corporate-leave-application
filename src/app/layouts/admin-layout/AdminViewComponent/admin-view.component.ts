import { Component, OnInit } from '@angular/core';
import { AttendanceService, Employee, Project } from '../../../services/attendance.service';

@Component({
  selector: 'app-admin-view',
  templateUrl: './admin-view.component.html',
  styleUrls: ['./admin-view.component.css']
})
export class AdminViewComponent implements OnInit {

  // 1. DATA CONTAINERS
  allUsers: Employee[] = [];
  filteredUsers: Employee[] = []; 
  projects: Project[] = [];
  managers: Employee[] = [];

  // 2. FILTER & REPORT STATE
  filterValue: string = ''; // Selected Project ID
  
  // New: Month/Year Selection for Reports
  selectedMonth: number;
  selectedYear: number;
  
  // For UI Dropdowns (Months)
  months = [
      { val: 1, name: 'January' }, { val: 2, name: 'February' }, { val: 3, name: 'March' },
      { val: 4, name: 'April' }, { val: 5, name: 'May' }, { val: 6, name: 'June' },
      { val: 7, name: 'July' }, { val: 8, name: 'August' }, { val: 9, name: 'September' },
      { val: 10, name: 'October' }, { val: 11, name: 'November' }, { val: 12, name: 'December' }
  ];

  constructor(private service: AttendanceService) { 
      const today = new Date();
      this.selectedMonth = today.getMonth() + 1; // JS Months are 0-11
      this.selectedYear = today.getFullYear();
  }

  ngOnInit() {
    this.loadData();
    this.service.dataChanged$.subscribe(() => {
        this.loadData();
    });
  }

  // ============================================================
  // 1. LOAD DATA (Async)
  // ============================================================
  loadData() {
    // A. Load Projects
    this.service.getProjects().subscribe(data => {
        this.projects = data;
    });

    // B. Load Employees & Initial Filter
    this.service.getEmployees().subscribe(data => {
        this.allUsers = data;
        this.applyFilter(); // Apply filter once data is loaded
    });

    // C. Load Managers
    this.service.getManagers().subscribe(data => {
        this.managers = data;
    });
  }

  // ============================================================
  // 2. FILTER LOGIC
  // ============================================================
  applyFilter() {
      if (this.filterValue) {
          // Filter by Project ID
          this.filteredUsers = this.allUsers.filter(u => u.projectId === this.filterValue);
      } else {
          // Show All
          this.filteredUsers = [...this.allUsers];
      }
  }

  // ============================================================
  // 3. REPORT GENERATION (Backend Blob Download)
  // ============================================================
  downloadReport() {
    // Backend Requirement: Project ID is mandatory for Admin Report
    if (!this.filterValue) {
        alert("Please select a specific Project filter to download the report.");
        return;
    }

    const projectName = this.getProjectName(this.filterValue);
    
    if(confirm(`Download Attendance Report for project "${projectName}" (${this.selectedMonth}/${this.selectedYear})?`)) {
        
        // Call the Service method that handles Blob response
        this.service.downloadReport(this.filterValue, this.selectedMonth, this.selectedYear)
            .subscribe({
                next: (blob: Blob) => {
                    // Create a link element, hide it, click it, download it
                    const url = window.URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `${projectName}_Report_${this.selectedMonth}_${this.selectedYear}.csv`;
                    a.click();
                    window.URL.revokeObjectURL(url);
                },
                error: (err) => {
                    console.error(err);
                    alert("Failed to download report. Ensure data exists for this month.");
                }
            });
    }
  }

  // ============================================================
  // 4. EMAIL (Placeholder)
  // ============================================================

  sendReportToEmail() {
    if (!this.filterValue) {
      alert("Please select a project first.");
      return;
    }
  
    const projectName = this.getProjectName(this.filterValue);
  
    if (!confirm(`Email attendance report for project "${projectName}"?`)) {
      return;
    }
  
    this.service.emailAdminReport(
        this.filterValue,
        this.selectedMonth,
        this.selectedYear
    ).subscribe({
        next: () => {
          alert("Report emailed successfully");
        },
        error: (err) => {
          console.error(err);
          alert("Email could not be delivered to the recipient domain.");
        }
    });
  }
  
  
  

  // ============================================================
  // 5. HELPERS
  // ============================================================
  getProjectName(id: any) {
    if(!id) return 'All Projects';
    const p = this.projects.find(proj => proj.projectId == id || proj.id == id);
    return p ? p.projectName : id;
  }

  getManagerName(id: any) {
    const m = this.managers.find(mgr => mgr.employeeId == id);
    return m ? m.name : '-';
  }
}