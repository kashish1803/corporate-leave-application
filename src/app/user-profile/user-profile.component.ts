import { Component, OnInit } from '@angular/core';
import { AttendanceService } from '../services/attendance.service';

@Component({
  selector: 'app-user-profile',
  templateUrl: './user-profile.component.html',
  styleUrls: ['./user-profile.component.css']
})
export class UserProfileComponent implements OnInit {

  leaveData = {
    type: '',
    singleDate: '',
    fromDate: '',
    toDate: '',
    reason: ''
  };

  myRequests: any[] = [];

  constructor(private attendanceService: AttendanceService) { }

  ngOnInit() {
    this.loadRequests();
  }

  submitLeave() {
    if (!this.leaveData.type) {
      alert("Please select a Leave Type first.");
      return;
    }

    // MOCK USER: In a real app, getting this from your login service
    const currentUser = 'Dakota Rice'; 

    // CASE 1: Single Date (Half Day / Optional)
    if (this.leaveData.type !== 'Full Day') {
      if (!this.leaveData.singleDate) {
        alert("Please select a date.");
        return;
      }
      
      // FIX: Use 'this.leaveData.singleDate' here, NOT 'dateString'
      this.attendanceService.applyLeave(
          this.leaveData.singleDate, 
          this.leaveData.type, 
          this.leaveData.reason,
          currentUser
      );
    } 
    
    // CASE 2: Date Range (Full Day)
    else {
      if (!this.leaveData.fromDate || !this.leaveData.toDate) {
        alert("Please select both From and To dates.");
        return;
      }

      const start = new Date(this.leaveData.fromDate);
      const end = new Date(this.leaveData.toDate);

      if (start > end) {
        alert("'To Date' cannot be before 'From Date'");
        return;
      }

      // Loop through dates
      for (let dt = new Date(start); dt <= end; dt.setDate(dt.getDate() + 1)) {
        // Definition of dateString is ONLY valid inside this loop
        const dateString = dt.toISOString().split('T')[0];
        
        this.attendanceService.applyLeave(
            dateString, 
            'Full Day', 
            this.leaveData.reason,
            currentUser
        );
      }
    }

    // Reset Form
    this.leaveData = { type: '', singleDate: '', fromDate: '', toDate: '', reason: '' };
    alert("Leave Applied (Auto-Approved)!");
    this.loadRequests();
  }

  withdraw(dateKey: string) {
    if(confirm("Withdraw request for " + dateKey + "?")) {
      this.attendanceService.withdrawLeave(dateKey);
      this.loadRequests();
    }
  }

  loadRequests() {
    const allData = this.attendanceService.getAllRequests();
    // Sort by date so they appear in order
    this.myRequests = Object.keys(allData).sort().map(key => {
      return {
        date: key,
        ...allData[key]
      };
    });
  }
}