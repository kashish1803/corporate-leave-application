import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {

  email: string = '';

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  login() {
    if (!this.email) {
      alert('Please enter your project email');
      return;
    }

    this.authService.login(this.email).subscribe({
      next: (res) => {
        const role = res.role;

        // 🔁 Redirect based on BACKEND role
        if (role === 'ADMIN') {
          this.router.navigate(['/admin-users']);
        } else if (role === 'MANAGER') {
          this.router.navigate(['/my-team']);
        } else {
          this.router.navigate(['/dashboard']);
        }
      },
      error: (err) => {
        alert(err.error?.message || 'Login failed');
      }
    });
  }
}
