import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AttendanceService } from '../services/attendance.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {

  email: string = '';
  errorMessage: string = ''; 
  isLoading: boolean = false;

  constructor(
    private service: AttendanceService, 
    private router: Router
  ) {}

  login() {
    this.errorMessage = '';

    if (!this.email) {
      this.errorMessage = 'Please enter your project email.';
      return;
    }

    this.isLoading = true;

    this.service.login(this.email).subscribe({
      next: (res) => {
        this.isLoading = false;
        
        /** * CRITICAL FIX: Save the employeeId to localStorage.
         * This is the string (e.g., 'EMP001') that links Managers to Employees.
         * If 'res.employeeId' is missing, ensure your LoginResponse.java DTO includes it.
         */
        if (res.employeeId) {
          localStorage.setItem('employeeId', res.employeeId);
        } else {
          console.warn("Backend login response missing employeeId. Manager filtering may fail.");
        }

        const role = res.role || 'EMPLOYEE';

        // Navigate based on role
        if (role === 'ADMIN') {
          this.router.navigate(['/admin-users']);
        } else if (role === 'MANAGER') {
          this.router.navigate(['/my-team']);
        } else {
          this.router.navigate(['/dashboard']);
        }
      },
      error: (err) => {
        this.isLoading = false;
        console.error('Login error:', err);
        
        if (err.status === 404) {
            this.errorMessage = 'User not found. Contact Admin.';
        } else if (err.status === 401 || err.status === 403) {
            this.errorMessage = 'Access Denied.';
        } else {
            this.errorMessage = err.error?.message || 'Login failed. Check server connection.';
        }
      }
    });
  }
}

