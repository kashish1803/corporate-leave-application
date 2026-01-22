import { Component, OnInit } from '@angular/core';
import { AttendanceService, LeaveRequest, ExtractedAttendance } from '../services/attendance.service';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {

  currentUser: any = null;
  myLeaves: LeaveRequest[] = []; 
  calendarTimeline: LeaveRequest[] = []; 

  selectedFile: File | null = null;
  isScanning: boolean = false;
  scanMessage: string = '';
  
  extractedData: ExtractedAttendance[] = [];
  showReviewTable: boolean = false;

  constructor(private service: AttendanceService) { }

  ngOnInit() {
    this.currentUser = this.service.getLoggedUser();
    this.refreshData();

    this.service.dataChanged$.subscribe(() => {
      this.refreshData();
    });
  }

  refreshData() {
    this.loadMyLeaves();
    this.loadTimeline();
  }

  loadMyLeaves() {
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    today.setHours(0, 0, 0, 0);

    this.service.getMyLeaves().subscribe(data => {
      this.myLeaves = (data || [])
        .filter(l => {
          // 🚀 FIX: Filter out withdrawn leaves AND weekends
          const dateStr = this.normalizeDateHelper(l.attendanceDate);
          const dateObj = new Date(dateStr);
          const dayOfWeek = dateObj.getDay(); // 0 = Sunday, 6 = Saturday
          
          return !l.isWithdrawn && dayOfWeek !== 0 && dayOfWeek !== 6;
        })
        .map(l => {
          const normalizedDate = this.normalizeDateHelper(l.attendanceDate);
          const leaveDate = new Date(normalizedDate);
          const isPastDate = new Date(normalizedDate) < today;
          const isPastMonth = 
            (leaveDate.getFullYear() < currentYear) || 
            (leaveDate.getFullYear() === currentYear && leaveDate.getMonth() < currentMonth);

          return {
            ...l,
            attendanceDate: normalizedDate,
            isCompleted: isPastDate,
            isLocked: isPastMonth 
          };
        })
        .sort((a, b) => b.attendanceDate.localeCompare(a.attendanceDate));
    });
  }

  loadTimeline() {
    this.service.getMyTimeline().subscribe(data => {
      this.calendarTimeline = data || [];
    });
  }

  onFileSelected(event: any) {
    if (event.target.files && event.target.files.length > 0) {
      this.selectedFile = event.target.files[0];
      this.scanMessage = '';
      this.showReviewTable = false;
    }
  }

  uploadTimesheet() {
    if (!this.selectedFile) return;

    this.isScanning = true;
    this.scanMessage = 'Gemini AI is analyzing your timesheet...';
    this.extractedData = [];

    this.service.uploadTimesheet(this.selectedFile).subscribe({
      next: (data) => {
        // 🚀 OPTIONAL: You can filter weekends here too if the AI identifies them
        this.extractedData = data.filter(item => {
          const d = new Date(item.date);
          return d.getDay() !== 0 && d.getDay() !== 6;
        });
        
        this.isScanning = false;
        this.showReviewTable = true;
        this.scanMessage = `Analysis complete! Found ${this.extractedData.length} weekday records.`;
      },
      error: (err) => {
        this.isScanning = false;
        this.scanMessage = 'Error: Could not process timesheet.';
        console.error(err);
      }
    });
  }

  
  saveExtractedData() {
    this.service.saveBulkAttendance(this.extractedData).subscribe({
      next: (res) => {
        this.scanMessage = 'Database Sync Successful!';
        this.showReviewTable = false;
        this.selectedFile = null;
        this.service.dataChanged$.next(true); 
      },
      error: (err) => {
        this.scanMessage = 'Sync failed. Check console.';
      }
    });
  }

  getAttendanceClass(dateInput: any): string {
    const dateKey = this.normalizeDateHelper(dateInput);
    
    // 🚀 FIX: Prevent weekend dates from being colored on the calendar
    const dateObj = new Date(dateKey);
    const dayOfWeek = dateObj.getDay();
    if (dayOfWeek === 0 || dayOfWeek === 6) {
        return 'bg-weekend'; // Use a specific weekend class or bg-default
    }

    const record = this.calendarTimeline.find(t => {
        const rDate = this.normalizeDateHelper(t.attendanceDate);
        return rDate === dateKey && (t.isWithdrawn === false || t.isWithdrawn === undefined);
    });
    
    if (!record) return 'bg-default';

    switch (record.status) {
        case 'LEAVE': return 'status-leave';
        case 'HALF_DAY': return 'status-halfday';
        case 'HOLIDAY': return 'status-holiday';
        default: return 'bg-default';
    }
  }

  private normalizeDateHelper(dateInput: any): string {
    if (!dateInput) return '';
    if (Array.isArray(dateInput)) {
        return `${dateInput[0]}-${String(dateInput[1]).padStart(2, '0')}-${String(dateInput[2]).padStart(2, '0')}`;
    }
    if (typeof dateInput === 'string') {
        return dateInput.split('T')[0];
    }
    return '';
  }

  withdrawLeave(leave: LeaveRequest) {
    const dateStr = this.normalizeDateHelper(leave.attendanceDate);
    if (confirm(`Are you sure you want to cancel your leave for ${dateStr}?`)) {
      this.service.withdrawLeave(dateStr).subscribe({
        next: () => this.service.dataChanged$.next(true),
        error: (err) => alert(err.error?.message || 'Failed to withdraw leave')
      });
    }
  }
}