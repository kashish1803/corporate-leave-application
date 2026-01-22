import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class TimesheetService {

  // FIX: Port 9988 (Matches application.properties)
  private baseUrl = 'http://localhost:9988/api/timesheets';

  constructor(private http: HttpClient) { }

  uploadTimesheet(file: File, employeeName: string): Observable<string> {
    const formData: FormData = new FormData();
    formData.append('file', file);
    formData.append('employeeName', employeeName);

    // Note: The AuthInterceptor will automatically attach the JWT Token here
    return this.http.post(this.baseUrl + '/upload', formData, { responseType: 'text' });
  }
}