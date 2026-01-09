import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

// 1. INTERFACES
export interface Employee {
  id: number;
  empCode: string;
  name: string;
  firstName: string;
  lastName: string;
  role: 'ADMIN' | 'MANAGER' | 'EMPLOYEE'; 
  managerId: number | null;
  projectId: string | number | null;
  projectMailId: string;
  joiningDate: string;
  email: string;
  phone: string;
}

export interface Project {
  id: string | number;
  name: string;
}

export interface LeaveRequest {
  id: number;
  date: string;
  type: string;
  reason: string;
  employeeName: string;
  managerId: number;
  status: 'Pending' | 'Approved' | 'Rejected' | 'Withdrawn';
}

@Injectable({
  providedIn: 'root'
})
export class AttendanceService {
  
  // ============================================================
  // A. VIEW STATE MANAGEMENT
  // ============================================================
  private viewRoleSubject = new BehaviorSubject<string>('admin');
  viewRole$ = this.viewRoleSubject.asObservable();

  public dataChanged$ = new BehaviorSubject<boolean>(true);

  // ============================================================
  // B. MOCK DATA
  // ============================================================
  projects: Project[] = [
    { id: 101, name: 'AI Banking App' },
    { id: 102, name: 'E-Commerce Platform' },
    { id: 103, name: 'Internal HR Tools' }
  ];

  managers = [
    { id: 1, name: 'Mike John', email: 'mike@test.com', dept: 'Engineering', phone: '9998887771' },
    { id: 2, name: 'Andrew Wilson', email: 'andrew@test.com', dept: 'Sales', phone: '9998887772' }
  ];

  employees: Employee[] = [
    // 1. Manager 
    { 
      id: 1, empCode: 'MGR001', firstName: 'Mike', lastName: 'John', name: 'Mike John', 
      role: 'MANAGER', managerId: null, projectId: 101, projectMailId: 'mike@company.com', 
      joiningDate: '2020-01-01', email: 'mike@test.com', phone: '9998887771' 
    },
    // 2. Employees
    { 
      id: 101, empCode: 'EMP001', firstName: 'Dakota', lastName: 'Rice', name: 'Dakota Rice', 
      role: 'EMPLOYEE', managerId: 1, projectId: 101, projectMailId: 'dakota@company.com', 
      joiningDate: '2023-01-15', email: 'dakota@test.com', phone: '1234567890' 
    },
    { 
      id: 102, empCode: 'EMP002', firstName: 'Minerva', lastName: 'Hooper', name: 'Minerva Hooper',
      role: 'EMPLOYEE', managerId: 1, projectId: 101, projectMailId: 'minerva@company.com', 
      joiningDate: '2023-03-10', email: 'minerva@test.com', phone: '1234567891' 
    },
    { 
      id: 103, empCode: 'EMP003', firstName: 'Sage', lastName: 'Rodriguez', name: 'Sage Rodriguez',
      role: 'EMPLOYEE', managerId: 2, projectId: 102, projectMailId: 'sage@company.com', 
      joiningDate: '2023-06-20', email: 'sage@test.com', phone: '1234567892' 
    },
    { 
      id: 104, empCode: 'EMP004', firstName: 'Philip', lastName: 'Chaney', name: 'Philip Chaney',
      role: 'EMPLOYEE', managerId: 1, projectId: 103, projectMailId: 'philip@company.com', 
      joiningDate: '2023-08-01', email: 'philip@test.com', phone: '1122334455' 
    },
    // 3. Admin User
    { 
      id: 999, empCode: 'ADM001', firstName: 'Admin', lastName: 'User', name: 'Admin User',
      role: 'ADMIN', managerId: null, projectId: null, projectMailId: 'admin@company.com', 
      joiningDate: '2019-01-01', email: 'admin@test.com', phone: '0000000000' 
    }
  ];

  adminEvents: any[] = []; 
  private attendanceData: any = {};
  
  private leaveRequests: LeaveRequest[] = [
    { id: 1, date: '2025-12-05', type: 'Full Day', reason: 'Sick Leave', employeeName: 'Dakota Rice', managerId: 1, status: 'Approved' },
    { id: 2, date: '2025-12-05', type: 'Half Day', reason: 'Bank Work', employeeName: 'Minerva Hooper', managerId: 1, status: 'Approved' },
    { id: 3, date: '2025-12-05', type: 'Optional Holiday', reason: 'Personal Festival', employeeName: 'Sage Rodriguez', managerId: 2, status: 'Approved' },
    { id: 4, date: '2025-12-24', type: 'Full Day', reason: 'Christmas Eve Prep', employeeName: 'Dakota Rice', managerId: 1, status: 'Approved' },
    { id: 5, date: '2026-01-14', type: 'Optional Holiday', reason: 'Makar Sankranti', employeeName: 'Dakota Rice', managerId: 1, status: 'Pending' }
  ];

  constructor() { }

  // ============================================================
  // C. CORE METHODS
  // ============================================================
  switchToView(role: string) {
    this.viewRoleSubject.next(role);
  }

  getProjects() { return this.projects; }
  getManagers() { return this.managers; }
  getEmployees() { return this.employees; }
  
  getTeamByManager(managerId: number) { 
    return this.employees.filter(e => e.managerId == managerId); 
  }

  // ============================================================
  // D. LEAVE & HOLIDAY METHODS
  // ============================================================
  getManagerNotifications(managerId: number) {
    return this.leaveRequests.filter(r => r.managerId == managerId && r.status === 'Pending');
  }

  getOptionalHolidayCount(employeeName: string): string {
      const used = this.leaveRequests.filter(r => 
          r.employeeName === employeeName && 
          r.status !== 'Withdrawn' && 
          r.type === 'Optional Holiday'
      ).length;
      return `${used}/3`;
  }

  getUpcomingHolidays() { return this.getMandatoryHolidays(); }
  
  getMandatoryHolidays() {
    return [
      { date: '2025-12-25', name: 'Christmas' },
      { date: '2026-01-26', name: 'Republic Day' },
      { date: '2026-08-15', name: 'Independence Day' }
    ];
  }
  
  getOptionalHolidays() {
    return [
      { date: '2026-03-06', name: 'Holi' },
      { date: '2026-08-27', name: 'Onam' }
    ];
  }

  getTeamLeavesForMonth(managerId: number, year: number, month: number) {
    return this.leaveRequests.filter(req => {
      const d = new Date(req.date);
      return req.managerId == managerId &&
             req.status !== 'Withdrawn' && 
             d.getFullYear() === year && 
             d.getMonth() === month;
    });
  }

  getFutureLeaves(employeeName: string) {
    const today = new Date();
    today.setHours(0,0,0,0);
    return this.leaveRequests.filter(r => {
      const leaveDate = new Date(r.date);
      return r.employeeName === employeeName && 
             r.status !== 'Withdrawn' &&
             leaveDate >= today;
    }).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }

  getAllRequests() { return this.leaveRequests; }

  // ============================================================
  // E. CRUD OPERATIONS
  // ============================================================
  addEmployee(empData: any) {
    const newEmp: Employee = {
      id: Date.now(),
      empCode: empData.empCode,
      firstName: empData.firstName,
      lastName: empData.lastName,
      name: `${empData.firstName} ${empData.lastName}`,
      role: empData.role || 'employee',
      managerId: empData.managerId,
      projectId: empData.projectId,
      projectMailId: empData.projectMailId,
      joiningDate: empData.joiningDate,
      email: empData.projectMailId, 
      phone: '0000000000'
    };
    this.employees.push(newEmp);
    this.dataChanged$.next(true);
  }

  updateEmployee(updatedEmp: any) {
    const idx = this.employees.findIndex(e => e.id === updatedEmp.id);
    if(idx !== -1) {
        if(updatedEmp.firstName && updatedEmp.lastName) {
            updatedEmp.name = `${updatedEmp.firstName} ${updatedEmp.lastName}`;
        }
        this.employees[idx] = { ...this.employees[idx], ...updatedEmp };
        this.dataChanged$.next(true);
    }
  }

  deleteEmployee(id: number) {
    this.employees = this.employees.filter(e => e.id !== id);
    this.dataChanged$.next(true);
  }

  addProject(project: Project) {
      if (this.projects.find(p => p.id == project.id)) {
          alert('Project ID already exists!');
          return;
      }
      this.projects.push(project);
      this.dataChanged$.next(true);
  }

  searchEmployees(query: string) {
    if(!query) return this.employees;
    const q = query.toLowerCase();
    return this.employees.filter(e => 
        e.name.toLowerCase().includes(q) || 
        e.empCode.toLowerCase().includes(q) ||
        e.projectMailId.toLowerCase().includes(q)
    );
  }

  // ============================================================
  // F. ATTENDANCE LOGIC
  // ============================================================
  addAdminEvent(event: any) {
      this.adminEvents.push(event);
      this.dataChanged$.next(true);
  }

  setStatus(dateKey: string, status: string) {
    this.attendanceData[dateKey] = status;
    this.dataChanged$.next(true);
  }

  getLeaveDetails(dateKey: string, employeeName: string = 'Dakota Rice') {
    return this.leaveRequests.find(r => 
        r.date === dateKey && 
        r.status !== 'Withdrawn' && 
        r.employeeName === employeeName
    );
  }

  getStatus(dateKey: string, employeeName: string = 'Dakota Rice'): string {
    const emp = this.employees.find(e => e.name === employeeName);
    if(emp) {
        const adminEvent = this.adminEvents.find(ev => {
            if(ev.date !== dateKey) return false;
            if(ev.scope === 'Global') return true;
            if(ev.scope === 'Manager' && ev.targetId == emp.managerId) return true;
            if(ev.scope === 'Project' && ev.targetId == emp.projectId) return true;
            return false;
        });
        if(adminEvent) return `Holiday: ${adminEvent.title}`;
    }

    const req = this.leaveRequests.find(r => 
        r.date === dateKey && 
        r.status !== 'Withdrawn' && 
        r.employeeName === employeeName
    );
    if (req) return `Leave: ${req.type}`;

    return this.attendanceData[`${employeeName}-${dateKey}`] || this.attendanceData[dateKey] || ''; 
  }

  updateAttendanceStatus(employeeName: string, date: string, status: string, type: string) {
    this.leaveRequests = this.leaveRequests.filter(r => !(r.employeeName === employeeName && r.date === date));

    if (status === 'Present') {
        this.attendanceData[`${employeeName}-${date}`] = 'Present';
    } 
    else if (status === 'Mandatory Holiday') {
        this.attendanceData[`${employeeName}-${date}`] = 'Holiday';
    }
    else if (status === 'Optional Holiday') {
        this.applyLeave(date, 'Optional Holiday', 'Manager Update', employeeName);
    }
    else if (status === 'Leave') {
        this.applyLeave(date, type || 'Full Day', 'Manager Update', employeeName);
    }
    this.dataChanged$.next(true);
  }

  // ============================================================
  // G. HELPER METHODS (User Info)
  // ============================================================
  
  // Gets the email of the currently simulated logged-in user
  getCurrentUserEmail(): string {
    // For this mock app, we assume 'Dakota Rice' is the logged-in user.
    const currentUser = this.employees.find(e => e.name === 'Dakota Rice');
    return currentUser ? currentUser.email : 'dakota@test.com';
  }

  // ============================================================
  // H. STATS & REPORTING
  // ============================================================

  getMonthlyStats(employeeName: string, year: number, month: number) {
    const today = new Date();
    today.setHours(0,0,0,0);
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    let limitDate = daysInMonth;

    if (year === today.getFullYear() && month === today.getMonth()) {
        limitDate = today.getDate(); 
    } else if (new Date(year, month, 1) > today) {
        return { present: 0, absent: 0, leaves: this.countLeavesInMonth(employeeName, year, month) };
    }

    let presentCount = 0;
    for (let i = 1; i <= limitDate; i++) {
        const currentDate = new Date(year, month, i);
        const dayOfWeek = currentDate.getDay();
        if (dayOfWeek === 0 || dayOfWeek === 6) continue;

        const dateKey = `${year}-${month + 1 < 10 ? '0' + (month+1) : month+1}-${i < 10 ? '0' + i : i}`;
        const status = this.getStatus(dateKey, employeeName);

        if (!status.startsWith('Leave') && !status.startsWith('Holiday') && status !== 'Absent') {
            presentCount++;
        }
    }
    const leavesTotal = this.countLeavesInMonth(employeeName, year, month);
    return { present: presentCount, absent: 0, leaves: leavesTotal };
  }

  private countLeavesInMonth(employeeName: string, year: number, month: number): number {
      return this.leaveRequests.filter(r => {
          const d = new Date(r.date);
          return r.employeeName === employeeName && 
                 r.status !== 'Withdrawn' && 
                 d.getFullYear() === year &&
                 d.getMonth() === month;
        }).length;
  }

  // ============================================================
  // I. APPLY / WITHDRAW
  // ============================================================

  applyLeave(dateKey: string, type: string, reason: string, employeeName: string = 'Dakota Rice') {
    const emp = this.employees.find(e => e.name === employeeName);
    const newRequest: LeaveRequest = {
      id: Date.now(),
      date: dateKey,
      type: type,
      reason: reason,
      employeeName: employeeName,
      managerId: emp ? (emp.managerId || 1) : 1, 
      status: 'Approved'
    };
    
    this.leaveRequests = this.leaveRequests.filter(r => !(r.date === dateKey && r.employeeName === employeeName));
    this.leaveRequests.push(newRequest);
    this.dataChanged$.next(true);
  }

  withdrawLeave(dateKey: string) {
    const index = this.leaveRequests.findIndex(r => r.date === dateKey);
    if (index !== -1) {
      this.leaveRequests.splice(index, 1);
      this.dataChanged$.next(true);
    }
  }

  // ============================================================
  // J. CSV REPORT
  // ============================================================
  downloadReport(employeeId: number, employeeName: string, startDate?: string, endDate?: string) {
    let csvContent = "Date,Status,Type,Reason\n";
    let fileName = `Report_${employeeName}_All.csv`;

    if (startDate && endDate) {
        fileName = `Report_${employeeName}_${startDate}_to_${endDate}.csv`;
        let current = new Date(startDate);
        const end = new Date(endDate);
        
        while (current <= end) {
            const year = current.getFullYear();
            const month = current.getMonth() + 1; 
            const day = current.getDate();
            const dateKey = `${year}-${month < 10 ? '0'+month : month}-${day < 10 ? '0'+day : day}`;
            
            let statusStr = this.getStatus(dateKey, employeeName);
            let status = 'Present';
            let type = '-';
            let reason = '-';
            const dayOfWeek = current.getDay();
            
            if(dayOfWeek === 0 || dayOfWeek === 6) {
                status = 'Weekend';
            } else if (statusStr) {
                status = statusStr;
                if(statusStr.startsWith('Leave:')) {
                   const parts = statusStr.split(':');
                   status = 'Leave';
                   type = parts[1].trim();
                   reason = 'Auto-Approved';
                }
            }
            csvContent += `${dateKey},${status},${type},${reason}\n`;
            current.setDate(current.getDate() + 1);
        }
    }
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    a.click();
  }
}