import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { BehaviorSubject, Observable, tap, map } from 'rxjs';

// ============================================================
// 1. INTERFACES
// ============================================================

export interface Employee {
  id: number;
  employeeId: string;       
  empCode: string;          
  firstName: string;
  lastName: string;
  name: string;             
  email: string;
  projectEmailId: string;   
  role: string;             
  joiningDate: string;
  projectId: string | number | null; 
  projectName?: string;
  managerEmployeeId: string | null;
  managerId: string | number | null;
}

export interface Project {
  projectId: string;
  projectName: string;
  id?: string;
  name?: string;
}

export interface LeaveRequest {
  id?: number;
  attendanceDate: string;   
  status: string;           
  reason?: string;
  employeeName?: string;
  isWithdrawn?: boolean;    
}

export interface UserProfile {
  employeeId: string;
  fullName: string;
  projectId: string;
  managerName: string;
}

export interface AuthResponse {
  token: string;
  role: string;
  employeeId: string;
}

/** Interface for AI Extracted Data */
export interface ExtractedAttendance {
  date: string;
  hours: number;
  status: string;
}

@Injectable({
  providedIn: 'root'
})
export class AttendanceService {

  private baseUrl = 'http://localhost:9988/api'; 
  
  public localEmployees: Employee[] = [];
  public localLeaveCache: LeaveRequest[] = [];

  private viewRoleSubject = new BehaviorSubject<string>('EMPLOYEE'); 
  public viewRole$ = this.viewRoleSubject.asObservable();

  public dataChanged$ = new BehaviorSubject<boolean>(true);

  constructor(private http: HttpClient) {
    const savedRole = localStorage.getItem('userRole');
    if (savedRole) this.viewRoleSubject.next(savedRole);
  }

  // ============================================================
  // A. AUTHENTICATION
  // ============================================================

  login(email: string): Observable<AuthResponse> {
    const payload = { projectEmailId: email };
    return this.http.post<AuthResponse>(`${this.baseUrl}/auth/login`, payload).pipe(
      tap(res => {
        localStorage.setItem('token', res.token);
        localStorage.setItem('userRole', res.role); 
        localStorage.setItem('employeeId', res.employeeId);
        localStorage.setItem('user', JSON.stringify(res));
        this.viewRoleSubject.next(res.role);
        this.dataChanged$.next(true);
      })
    );
  }

  logout() {
    localStorage.clear();
    this.viewRoleSubject.next('EMPLOYEE');
    this.dataChanged$.next(true);
  }

  getLoggedUser() {
    const userData = localStorage.getItem('user');
    if (!userData) return null;
    const user = JSON.parse(userData);
    return {
        ...user,
        employeeId: user.employeeId || localStorage.getItem('employeeId')
    };
  }

  // ============================================================
  // B. EMPLOYEE MANAGEMENT
  // ============================================================

  getEmployees(): Observable<Employee[]> {
    return this.http.get<any[]>(`${this.baseUrl}/users`).pipe(
      map(backendUsers => backendUsers.map(u => ({
          ...u,
          empCode: u.employeeId, 
          name: `${u.firstName} ${u.lastName}`,
          email: u.projectEmailId,
          managerId: u.managerEmployeeId || u.managerId
      }))),
      tap(data => this.localEmployees = data)
    );
  }

  getManagers(): Observable<Employee[]> {
    return this.http.get<any[]>(`${this.baseUrl}/users`).pipe
    ( map(users => users .filter(u => u.role === 'MANAGER' || u.role === 'ADMIN') 
    .map(u => ({ ...u, name: `${u.firstName} ${u.lastName}` })) ) );
  }

  getProfile(): Observable<UserProfile> {
    return this.http.get<UserProfile>(`${this.baseUrl}/users/me`);
  }

  private createEmployeePayload(empData: any) {
    return {
        employeeId: empData.employeeId || empData.empCode,
        firstName: empData.firstName,
        lastName: empData.lastName,
        projectEmailId: empData.projectEmailId || empData.email,
        joiningDate: empData.joiningDate,
        role: empData.role ? empData.role.toUpperCase() : 'EMPLOYEE',
        projectId: empData.projectId,
        managerEmployeeId: empData.managerEmployeeId || empData.managerId,
        password: 'Welcome@123'
    };
  }

  addEmployee(empData: any): Observable<any> {
    const payload = this.createEmployeePayload(empData);
    return this.http.post(`${this.baseUrl}/users`, payload).pipe(
        tap(() => this.dataChanged$.next(true))
    );
  }

  updateEmployee(empData: any): Observable<any> {
    const idForUrl = empData.id || empData.employeeId || empData.empCode;
    const payload = this.createEmployeePayload(empData);

    if (!idForUrl) {
      console.error("Update failed: No Employee ID found in payload", empData);
      throw new Error("Employee ID is required for update");
    }

    return this.http.put(`${this.baseUrl}/users/${idForUrl}`, payload).pipe(
        tap(() => this.dataChanged$.next(true))
    );
  }

  deleteEmployee(employeeId: string): Observable<any> {
    return this.http.delete(`${this.baseUrl}/users/${employeeId}`).pipe(
        tap(() => this.dataChanged$.next(true))
    );
  }

  // ============================================================
  // C. PROJECT MANAGEMENT
  // ============================================================

  getProjects(): Observable<Project[]> {
    return this.http.get<Project[]>(`${this.baseUrl}/projects`).pipe(
      map(projects => projects.map(p => ({
        ...p,
        id: p.projectId,
        name: p.projectName
      })))
    );
  }

  addProject(projectData: any): Observable<any> {
    const payload = {
        projectId: projectData.id || projectData.projectId,
        projectName: projectData.name || projectData.projectName
    };
    return this.http.post(`${this.baseUrl}/projects`, payload).pipe(
      tap(() => this.dataChanged$.next(true))
    );
  }

  // ============================================================
  // D. ATTENDANCE & LEAVES (CLEANED OF DATE RESTRICTIONS)
  // ============================================================

  /**
   * Fetches the full history. No filtering by date is done here.
   */
  getMyTimeline(): Observable<LeaveRequest[]> {
    return this.http.get<LeaveRequest[]>(`${this.baseUrl}/attendance/my/timeline`);
  }

  /**
   * Fetches all applied records for the current user. 
   * Updates cache used by 'Upcoming Leaves' table.
   */
  getMyLeaves(): Observable<LeaveRequest[]> {
    return this.http.get<LeaveRequest[]>(`${this.baseUrl}/attendance/my`).pipe(
      tap(data => this.localLeaveCache = data)
    );
  }

  /**
   * Sends leave application to backend. 
   * Date format here must be YYYY-MM-DD.
   */
  applyLeave(date: string, status: string, reason: string, empId?: string): Observable<any> {
    if (empId) {
        // Routes to /api/attendance/manager/edit
        return this.updateEmployeeAttendance(empId, date, status);
    }
    // Routes to /api/attendance/apply
    const payload = { attendanceDate: date, status: status.toUpperCase(), reason: reason };
    return this.http.post(`${this.baseUrl}/attendance/apply`, payload).pipe(
        tap(() => this.dataChanged$.next(true))
    );
}

  /**
   * Sends withdrawal request. 
   * If this fails for dates < 15 days, the error is coming from the Backend.
   */
  withdrawLeave(date: string, empId?: string): Observable<any> {
  if (empId) {
    // If a manager is withdrawing for an employee, treat as 'PRESENT' reset
    return this.updateEmployeeAttendance(empId, date, 'PRESENT');
  }

  const params = new HttpParams().set('date', date);
  return this.http.put(`${this.baseUrl}/attendance/withdraw`, {}, { params }).pipe(
    tap(() => this.dataChanged$.next(true))
  );
}

  resetAttendance(date: string): Observable<any> {
    const params = new HttpParams()
        .set('date', date)
        .set('status', 'PRESENT');

    return this.http.put(`${this.baseUrl}/attendance/my/edit`, {}, { params }).pipe(
        tap(() => this.dataChanged$.next(true))
    );
  }

  getAllRequests(): Observable<LeaveRequest[]> {
    return this.http.get<LeaveRequest[]>(`${this.baseUrl}/attendance/manager/employees/leaves`);
  }

  // ============================================================
  // E. REPORTS
  // ============================================================

  downloadReport(projectId: string, month: number, year: number): Observable<Blob> {
    const params = new HttpParams()
      .set('projectId', projectId || '')
      .set('month', month)
      .set('year', year);

    const userRole = localStorage.getItem('userRole')?.toUpperCase();
    const endpoint = userRole === 'ADMIN' ? 'admin' : 'manager';

    return this.http.get(`${this.baseUrl}/reports/${endpoint}/download`, {
      params: params,
      responseType: 'blob'
    });
}

  // ============================================================
  // F. HELPER METHODS
  // ============================================================

  changeViewRole(role: string) {
    this.viewRoleSubject.next(role);
  }

  searchEmployees(query: string): Employee[] {
    if (!query) return this.localEmployees;
    const q = query.toLowerCase();
    return this.localEmployees.filter(e => 
      e.name.toLowerCase().includes(q) || e.employeeId.toLowerCase().includes(q)
    );
  }

  updateEmployeeAttendance(empId: string, date: string, status: string): Observable<any> {
  const params = new HttpParams()
    .set('employeeId', empId)
    .set('date', date)
    .set('status', status.toUpperCase()); // Critical for Java Enum matching

  return this.http.put(`${this.baseUrl}/attendance/manager/edit`, {}, { params }).pipe(
    tap(() => this.dataChanged$.next(true))
  );
}

getEmployeeTimeline(employeeId: string): Observable<LeaveRequest[]> {
  return this.http.get<LeaveRequest[]>(`${this.baseUrl}/attendance/employee/${employeeId}/timeline`);
}

  /**
   * Removed 'today' comparison. 
   * Returns all active, non-withdrawn leaves from cache.
   */
  getFutureLeaves() {
    return this.localLeaveCache.filter(l => {
        return l.status !== 'PRESENT' && !l.isWithdrawn;
    });
  }

  emailAdminReport(projectId: string, month: number, year: number) {
    return this.http.post(
      `http://localhost:9988/api/reports/admin/email`,
      null,
      { params: { projectId, month, year } }
    );
  }

  emailManagerReport(month: number, year: number) {
    return this.http.post(
      `http://localhost:9988/api/reports/manager/email`,
      null,
      { params: { month, year } }
    );
  }

  // ------------------------------------------------------------
  // G. AI TIMESHEET EXTRACTION (GEMINI)
  // ------------------------------------------------------------

  uploadTimesheet(file: File): Observable<ExtractedAttendance[]> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<ExtractedAttendance[]>(`${this.baseUrl}/timesheets/upload`, formData);
  }

  saveBulkAttendance(entries: ExtractedAttendance[]): Observable<any> {
  // Directly send the array as the JSON body
  return this.http.post(`${this.baseUrl}/attendance/bulk-apply`, entries).pipe(
    tap(() => this.dataChanged$.next(true))
  );
}
  
  
}