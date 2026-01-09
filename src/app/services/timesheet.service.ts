import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class TimesheetService {

  // Ensure this matches your Spring Boot Controller URL
  private baseUrl = 'http://localhost:8080/api/timesheet';

  constructor(private http: HttpClient) { }

  uploadTimesheet(file: File, employeeName: string): Observable<string> {
    const formData: FormData = new FormData();
    formData.append('file', file);
    formData.append('employeeName', employeeName);

    // We expect a text response ("Success! Detected...")
    return this.http.post(this.baseUrl + '/upload', formData, { responseType: 'text' });
  }
}