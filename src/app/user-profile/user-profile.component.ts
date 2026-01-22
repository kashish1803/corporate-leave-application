import { Component, OnInit } from '@angular/core';
import { AttendanceService } from '../services/attendance.service';

@Component({
  selector: 'app-user-profile',
  templateUrl: './user-profile.component.html',
  styleUrls: ['./user-profile.component.css']
})
export class UserProfileComponent implements OnInit {

  // 1. DATA FOR VIEW
  userProfile: any = {};
  history: any[] = [];

  // 2. DATA FOR FORM
  leaveData = {
      type: 'LEAVE', // Default
      date: '',
      reason: ''
  };

  constructor(private service: AttendanceService) { }

  ngOnInit() {
    this.loadProfile();
    this.loadHistory();
    
    // Auto-refresh when data changes
    this.service.dataChanged$.subscribe(() => {
        this.loadHistory();
    });
  }

  loadProfile() {
      this.service.getProfile().subscribe(data => this.userProfile = data);
  }

  loadHistory() {
      // Fetch and Sort History by Date (Newest First)
      this.service.getMyLeaves().subscribe(data => {
          this.history = data.sort((a, b) => 
              new Date(b.attendanceDate).getTime() - new Date(a.attendanceDate).getTime()
          );
      });
  }

  // 3. APPLY LEAVE (Single Day to match Backend)
  submitLeave() {
      if(!this.leaveData.date || !this.leaveData.reason) {
          alert("Please select a date and enter a reason.");
          return;
      }

      // Backend expects: LEAVE, HALF_DAY, etc.
      this.service.applyLeave(
          this.leaveData.date, 
          this.leaveData.type, 
          this.leaveData.reason
      );

      alert("Leave applied successfully!");
      
      // Reset Form
      this.leaveData = { type: 'LEAVE', date: '', reason: '' };
  }

  // 4. ACTIONS
  downloadMyReport() {
      const csvContent = "Date,Status,Reason\n" + 
          this.history.map(e => `${e.attendanceDate},${e.status},${e.reason || '-'}`).join("\n");
      
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'My_Attendance_History.csv';
      a.click();
  }

  withdraw(leave: any) {
      if(confirm('Withdraw this leave?')) {
          this.service.resetAttendance(leave.attendanceDate).subscribe(() => {
              alert('Withdrawn');
              this.loadHistory();
          });
      }
  }

  // Helper to check if leave is in the future
  canWithdraw(dateStr: string): boolean {
      return new Date(dateStr) > new Date();
  }
}