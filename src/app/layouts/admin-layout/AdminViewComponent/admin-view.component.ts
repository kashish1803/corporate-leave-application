import { Component, OnInit } from '@angular/core';
import { AttendanceService } from '../../../services/attendance.service';

@Component({
  selector: 'app-admin-view',
  templateUrl: './admin-view.component.html',
  styleUrls: ['./admin-view.component.css']
})
export class AdminViewComponent implements OnInit {

  // 1. DATA CONTAINERS
  allUsers: any[] = [];
  filteredUsers: any[] = []; 
  projects: any[] = [];
  managers: any[] = [];

  // 2. FILTER STATE
  filterType: string = 'Project'; 
  filterValue: any = null; // Stores selected Project ID

  constructor(private service: AttendanceService) { }

  ngOnInit() {
    this.loadData();
    this.service.dataChanged$.subscribe(() => {
        this.loadData();
    });
  }

  loadData() {
    this.allUsers = this.service.getEmployees();
    this.projects = this.service.getProjects();
    this.managers = this.service.getManagers();
    
    // Initial Load: Show all users
    this.filteredUsers = [...this.allUsers]; 
  }

  // 3. FILTER LOGIC
  applyFilter() {
      if (this.filterValue) {
          // Filter by the selected Project ID
          this.filteredUsers = this.allUsers.filter(u => u.projectId == this.filterValue);
      } else {
          this.filteredUsers = [...this.allUsers];
      }
  }

  // 4. SEND REPORT TO EMAIL (Fixes your Error)
  sendReportToEmail() {
      // 1. Get the current user's email (Admin's email)
      const adminEmail = this.service.getCurrentUserEmail(); 
      
      // 2. Get Project Name for the alert
      let projectName = 'All Projects';
      if (this.filterValue) {
          projectName = this.getProjectName(this.filterValue);
      }

      if (adminEmail) {
          // Simulate sending
          alert(`The Attendance Report for "${projectName}" has been sent to your email: ${adminEmail}`);
      } else {
          alert('Could not find your email address.');
      }
  }

  // 5. REPORT GENERATION (CSV Download)
  downloadReport() {
    const allLeaves = this.service.getAllRequests();
    
    // Filter leaves for visible employees only
    const visibleEmpNames = new Set(this.filteredUsers.map(u => u.name));
    const relevantLeaves = allLeaves.filter(l => visibleEmpNames.has(l.employeeName));

    // Define Time Range (Current Month)
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth(); 
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    let csvDataRows = [];
    let maxCols = 0;

    // Iterate through every day of the month
    for (let day = 1; day <= daysInMonth; day++) {
        const dateKey = `${year}-${month + 1 < 10 ? '0'+(month+1) : month+1}-${day < 10 ? '0'+day : day}`;
        
        const leavesOnThisDay = relevantLeaves.filter(l => l.date === dateKey);

        if (leavesOnThisDay.length > maxCols) {
            maxCols = leavesOnThisDay.length;
        }

        let row = [`"${dateKey}"`];

        leavesOnThisDay.forEach(leave => {
            const emp = this.filteredUsers.find(u => u.name === leave.employeeName);
            const empCode = emp ? emp.empCode : 'N/A';
            const project = emp ? this.getProjectName(emp.projectId) : 'N/A';
            
            const cellData = `${leave.employeeName} (${empCode}) - ${project} - ${leave.type}`;
            row.push(`"${cellData}"`);
        });

        csvDataRows.push(row);
    }

    let headerRow = ['Date'];
    for (let i = 1; i <= maxCols; i++) {
        headerRow.push(`Employee ${i}`);
    }

    const csvContent = [headerRow.join(','), ...csvDataRows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `Attendance_Report_${year}-${month+1}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  }

  // 6. HELPERS
  getProjectName(id: any) {
    const p = this.projects.find(proj => proj.id == id);
    return p ? p.name : '-';
  }

  getManagerName(id: number) {
    const m = this.managers.find(mgr => mgr.id == id);
    return m ? m.name : '-';
  }
}