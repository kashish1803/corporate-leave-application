import { Component, OnInit } from '@angular/core';
import { AttendanceService, Employee, Project } from '../services/attendance.service';

@Component({
  selector: 'app-my-team',
  templateUrl: './my-team.component.html',
  styleUrls: ['./my-team.component.css']
})
export class MyTeamComponent implements OnInit {

  // ==========================================
  // 1. VIEW STATE
  // ==========================================
  activeTab: string = 'calendar'; 
  selectedEmployee: any = null;   

  // ==========================================
  // 2. DATA CONTAINERS
  // ==========================================
  myTeam: Employee[] = [];
  projects: Project[] = []; 
  managers: any[] = []; 
  currentManagerId: number = 1; // Mock Logged-in Manager

  // Stats for "Detail View" (Single Employee Calendar)
  attendanceStats: any = { present: 0, absent: 0, leaves: 0 };
  statsDate: Date = new Date();
  statsMonthLabel: string = '';

  // ==========================================
  // 3. TEAM CALENDAR VARIABLES
  // ==========================================
  teamCalendarDate: Date = new Date();
  teamCalendarMonthLabel: string = '';
  calendarDays: any[] = []; 
  weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // ==========================================
  // 4. MODAL STATES & FORMS
  // ==========================================
  showEditEmployeeModal: boolean = false;   
  
  editEmployeeData: any = { 
    id: null, 
    name: '', 
    empCode: '', 
    email: '', 
    projectId: null, 
    managerId: null 
  };

  constructor(private service: AttendanceService) { }

  ngOnInit() {
    this.loadData();
    this.generateTeamCalendar();
    this.updateMonthLabel(); 

    this.service.dataChanged$.subscribe(() => {
        this.loadData();
        this.generateTeamCalendar(); 
        if(this.selectedEmployee) {
            this.refreshStats();
        }
    });
  }

  loadData() {
    this.myTeam = this.service.getTeamByManager(this.currentManagerId);
    this.projects = this.service.getProjects();
    this.managers = this.service.getManagers(); 
  }

  // ==========================================
  // 5. EDIT EMPLOYEE LOGIC
  // ==========================================
  openEditEmployee(emp: Employee) {
      this.editEmployeeData = { 
          id: emp.id,
          name: emp.name,
          empCode: emp.empCode,
          email: emp.email,
          projectId: emp.projectId,
          managerId: emp.managerId
      };
      this.showEditEmployeeModal = true;
  }

  saveEmployeeDetails() {
      // 1. Check for Manager Change (Loss of Access Warning)
      if (this.editEmployeeData.managerId != this.currentManagerId) {
          const confirmed = confirm("Warning: If you change the manager, you will no longer be able to view this employee's details. Do you want to proceed?");
          if (!confirmed) return;
      }

      // 2. Update Data
      const originalEmp = this.service.getEmployees().find(e => e.id === this.editEmployeeData.id);
      
      if(originalEmp) {
          const updatedData = {
              ...originalEmp,
              projectId: this.editEmployeeData.projectId,
              managerId: this.editEmployeeData.managerId
          };

          this.service.updateEmployee(updatedData);
          this.showEditEmployeeModal = false;
      }
  }

  // ==========================================
  // 6. TEAM CALENDAR LOGIC
  // ==========================================
  changeTeamCalendarMonth(offset: number) {
      this.teamCalendarDate.setMonth(this.teamCalendarDate.getMonth() + offset);
      this.generateTeamCalendar();
  }

  generateTeamCalendar() {
      const year = this.teamCalendarDate.getFullYear();
      const month = this.teamCalendarDate.getMonth();
      this.teamCalendarMonthLabel = this.teamCalendarDate.toLocaleString('default', { month: 'long', year: 'numeric' });
      
      const teamLeaves = this.service.getTeamLeavesForMonth(this.currentManagerId, year, month);
      
      const firstDay = new Date(year, month, 1).getDay(); 
      const daysInMonth = new Date(year, month + 1, 0).getDate();

      this.calendarDays = [];
      
      // Empty Cells
      for (let i = 0; i < firstDay; i++) { 
          this.calendarDays.push({ date: null, leaves: [] }); 
      }

      // Actual Days
      for (let day = 1; day <= daysInMonth; day++) {
          const dateKey = `${year}-${month + 1 < 10 ? '0'+(month+1) : month+1}-${day < 10 ? '0'+day : day}`;
          
          const dayLeaves = teamLeaves
            .filter(l => l.date === dateKey)
            .map(l => ({ name: l.employeeName.split(' ')[0], type: l.type })); // Show First Name Only

          this.calendarDays.push({ date: day, fullDate: dateKey, leaves: dayLeaves });
      }
  }

  // ==========================================
  // 7. NAVIGATION & ACTIONS
  // ==========================================
  switchTab(tab: string) {
    this.activeTab = tab;
    this.selectedEmployee = null;
  }

  closeView() { this.selectedEmployee = null; }
  
  viewAttendance(employee: any) {
    this.selectedEmployee = employee;
    this.refreshStats();
  }

  viewAttendanceByName(firstName: string) {
      // Helper to find employee when clicking a name on the calendar
      const emp = this.myTeam.find(e => e.firstName === firstName || e.name.startsWith(firstName));
      if(emp) this.viewAttendance(emp);
  }

  // ==========================================
  // 8. CSV REPORTING
  // ==========================================
  downloadTeamReport() {
    const year = this.teamCalendarDate.getFullYear();
    const month = this.teamCalendarDate.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    const allLeaves = this.service.getTeamLeavesForMonth(this.currentManagerId, year, month);
    const employees = this.service.getEmployees(); 

    let csvRows = [];
    let maxLeavesInADay = 0;

    for (let day = 1; day <= daysInMonth; day++) {
        const dateKey = `${year}-${month + 1 < 10 ? '0'+(month+1) : month+1}-${day < 10 ? '0'+day : day}`;
        const dailyLeaves = allLeaves.filter(l => l.date === dateKey);
        
        if (dailyLeaves.length > maxLeavesInADay) maxLeavesInADay = dailyLeaves.length;

        let row = [dateKey];
        dailyLeaves.forEach(leave => {
            const empDetails = employees.find(e => e.name === leave.employeeName);
            const empCode = empDetails ? empDetails.empCode : 'N/A';
            row.push(`"${leave.employeeName} (${empCode}) - ${leave.type}"`); 
        });
        csvRows.push(row);
    }
    
    // Dynamic Header
    let header = ["Date"];
    for(let i=1; i <= maxLeavesInADay; i++) header.push(`Employee ${i}`);
    
    const csvContent = [header.join(','), ...csvRows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `Team_Leave_Report_${this.teamCalendarMonthLabel}.csv`;
    a.click();
  }

  // ==========================================
  // 9. HELPERS
  // ==========================================
  updateMonthLabel() {
    this.statsMonthLabel = this.statsDate.toLocaleString('default', { month: 'long', year: 'numeric' });
  }

  refreshStats() {
    if (!this.selectedEmployee) return;
    const year = this.statsDate.getFullYear();
    const month = this.statsDate.getMonth();
    this.attendanceStats = this.service.getMonthlyStats(this.selectedEmployee.name, year, month);
  }

  // Inside MyTeamComponent class
  sendReportToEmail() {
      const userEmail = this.service.getCurrentUserEmail(); // You need to implement this in service
      if (userEmail) {
          // Logic to trigger backend email service
          alert(`Report for ${this.teamCalendarMonthLabel} has been sent to ${userEmail}.`);
      } else {
          alert('Could not find your email address.');
      }
  }
}