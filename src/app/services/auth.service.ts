import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private BASE_URL = 'http://localhost:9988/api/auth'; // adjust if needed

  constructor(private http: HttpClient) {}

  login(projectEmailId: string): Observable<any> {
    return this.http.post<any>(`${this.BASE_URL}/login`, {
      projectEmailId
    }).pipe(
      tap(response => {
        // 🔐 Save auth details
        localStorage.setItem('token', response.token);
        localStorage.setItem('role', response.role);
        localStorage.setItem('userId', response.userId);
        localStorage.setItem('email', response.projectEmailId);
        localStorage.setItem('name', response.firstName + ' ' + response.lastName);
      })
    );
  }

  logout() {
    localStorage.clear();
  }

  getRole(): string | null {
    return localStorage.getItem('role');
  }

  isLoggedIn(): boolean {
    return !!localStorage.getItem('token');
  }
}
