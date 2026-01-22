import { Component, OnInit } from '@angular/core';
import { AttendanceService } from '../services/attendance.service';
import { HttpClient } from '@angular/common/http';


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
  loading: boolean = true;
  currentUser: any;

  // ==========================================
  // 2. DATA CONTAINERS
  // ==========================================
  myTeam: any[] = [];         
  teamLeaves: any[] = [];     

  // ==========================================
  // 3. TEAM CALENDAR VARIABLES
  // ==========================================
  teamCalendarDate: Date = new Date();
  teamCalendarMonthLabel: string = '';
  calendarDays: any[] = []; 
  weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // ==========================================
  // 4. REPORT VARIABLES
  // ==========================================
  reportMonth: number;
  reportYear: number;
  months = [
    { val: 1, name: 'January' }, { val: 2, name: 'February' }, { val: 3, name: 'March' },
    { val: 4, name: 'April' }, { val: 5, name: 'May' }, { val: 6, name: 'June' },
    { val: 7, name: 'July' }, { val: 8, name: 'August' }, { val: 9, name: 'September' },
    { val: 10, name: 'October' }, { val: 11, name: 'November' }, { val: 12, name: 'December' }
  ];

  constructor(
      private service: AttendanceService,
      private http: HttpClient 
  ) { 
      const today = new Date();
      this.reportMonth = today.getMonth() + 1;
      this.reportYear = today.getFullYear();
  }

  ngOnInit() {
    this.currentUser = this.service.getLoggedUser();
    this.updateMonthLabel(); 
    this.loadData();
    
    this.service.dataChanged$.subscribe(() => {
        this.loadData();
    });
  }

  // ==========================================
  // 1. DATA LOADING
  // ==========================================
  loadData() {
    this.loading = true;
    this.service.getEmployees().subscribe({
      next: (allEmp: any[]) => {
        const loggedUser = this.service.getLoggedUser();
        const myId = (loggedUser?.employeeId || localStorage.getItem('employeeId'))?.toString().trim().toUpperCase();

        if (myId) {
          this.myTeam = allEmp.filter(emp => {
            const managerCodeOfEmp = emp.managerEmployeeId?.toString().trim().toUpperCase();
            return managerCodeOfEmp === myId;
          });
        }
        this.loadLeavesForCalendar();
      },
      error: (err) => { this.loading = false; }
    });
  }

  loadLeavesForCalendar() {
    this.service.getAllRequests().subscribe(historyData => {
      this.teamLeaves = [];
      historyData.forEach((dto: any) => {
        this.teamLeaves.push({
          ...dto,
          attendanceDate: this.normalizeDate(dto.startDate || dto.attendanceDate),
          name: dto.employeeName || dto.firstName,
          status: dto.status?.toUpperCase()
        });
      });
      this.generateTeamCalendar();
      this.loading = false;
    });
  }

  // ==========================================
  // 2. CALENDAR LOGIC (FIXED)
  // ==========================================

  /**
   * FIX: Handles switching months and rebuilding the grid
   * @param delta +1 for next, -1 for previous
   */
  changeTeamCalendarMonth(delta: number) {
    // 1. Update the date object (handles year rollover automatically)
    this.teamCalendarDate.setMonth(this.teamCalendarDate.getMonth() + delta);
    
    // 2. Refresh reference for Angular's change detection (especially for pipes)
    this.teamCalendarDate = new Date(this.teamCalendarDate);
    
    // 3. Re-render the labels and the day grid
    this.updateMonthLabel();
    this.generateTeamCalendar();
  }

  generateTeamCalendar() {
    const year = this.teamCalendarDate.getFullYear();
    const month = this.teamCalendarDate.getMonth();
    this.updateMonthLabel();
    
    const firstDay = new Date(year, month, 1).getDay(); 
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    this.calendarDays = [];
    for (let i = 0; i < firstDay; i++) { 
        this.calendarDays.push({ date: null, leaves: [] }); 
    }

    for (let day = 1; day <= daysInMonth; day++) {
        const dateKey = `${year}-${(month + 1).toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
        
        // Filter team leaves including HOLIDAYS
        const dayLeaves = this.teamLeaves.filter(l => {
            return l.attendanceDate === dateKey && l.status !== 'PRESENT';
        }); 

        this.calendarDays.push({ date: day, fullDate: dateKey, leaves: dayLeaves });
    }
}

  checkIfToday(day: number, month: number, year: number): boolean {
    const today = new Date();
    return today.getDate() === day && today.getMonth() === month && today.getFullYear() === year;
  }

  updateMonthLabel() {
      this.teamCalendarMonthLabel = this.teamCalendarDate.toLocaleString('default', { month: 'long', year: 'numeric' });
  }

  normalizeDate(date: any): string {
    if (Array.isArray(date)) {
      return `${date[0]}-${date[1].toString().padStart(2, '0')}-${date[2].toString().padStart(2, '0')}`;
    }
    return date;
  }

  // ==========================================
  // 3. ACTIONS & NAVIGATION
  // ==========================================

  switchTab(tab: string) {
    this.activeTab = tab;
    this.selectedEmployee = null;
  }

  closeView() { this.selectedEmployee = null; }
  
  viewAttendance(employee: any) {
    this.selectedEmployee = employee;
  }
  
  viewAttendanceByName(firstName: string) {
     const emp = this.myTeam.find(e => e.firstName === firstName || e.name?.startsWith(firstName));
     if(emp) this.viewAttendance(emp);
  }

  // Add this method to your existing MyTeamComponent class
  openManagerEdit(employee: any) {
      // 1. Ask for Date
      const todayStr = new Date().toISOString().split('T')[0];
      const dateInput = prompt(`Enter date for ${employee.firstName} (YYYY-MM-DD):`, todayStr);
      
      if (dateInput == null || dateInput === "") return; // User cancelled

      // 2. Ask for Status
      const statusInput = prompt(`Enter status for ${employee.firstName} on ${dateInput}:\n(LEAVE, HALF_DAY, HOLIDAY, PRESENT)`, "LEAVE");
      
      if (statusInput == null || statusInput === "") return; // User cancelled

      const finalStatus = statusInput.toUpperCase().trim().replace(' ', '_');

      // 3. Call Service
      this.service.updateEmployeeAttendance(employee.employeeId, dateInput, finalStatus).subscribe({
          next: () => {
              alert(`Successfully updated attendance for ${employee.firstName} on ${dateInput}`);
              this.loadData(); // Refresh calendar and lists
          },
          error: (err) => {
              alert(err.error?.message || "Error updating attendance. Ensure date format is YYYY-MM-DD.");
          }
      });
  }

  // ==========================================
  // 4. REPORTING
  // ==========================================
  downloadTeamReport() {
    const month = this.reportMonth;
    const year = this.reportYear;
    const token = localStorage.getItem('token'); // Retrieve your saved token

    const url = `http://localhost:9988/api/reports/manager/download?month=${month}&year=${year}`;

    this.http.get(url, {
        responseType: 'blob',
        observe: 'response',
        headers: {
            'Authorization': `Bearer ${token}` // Manually inject the token
        }
    }).subscribe({
        next: (response) => {
            // Check if body is null
            if (!response.body) {
                alert("The report is empty.");
                return;
            }
            const blob = new Blob([response.body], { type: 'text/csv' });
            const downloadURL = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = downloadURL;
            link.download = `Team_Report_${month}_${year}.csv`;
            link.click();
            window.URL.revokeObjectURL(downloadURL);
        },
        error: (err) => {
            console.error("Download failed", err);
            // Enhanced error message
            if (err.status === 403) {
                alert("Security Error (403): Your session may have expired or you lack MANAGER permissions.");
            } else {
                alert("Download failed. Please check your connection.");
            }
        }
    });
  }

  sendReportToEmail() {
    if (!confirm("Email team attendance report?")) return;
  
    this.service.emailManagerReport(
        this.reportMonth,
        this.reportYear
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
  
}