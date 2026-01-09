import { Component, Input, OnInit, OnChanges } from '@angular/core';
import { AttendanceService } from '../../services/attendance.service';

@Component({
  selector: 'app-calendar',
  templateUrl: './calendar.component.html',
  styleUrls: ['./calendar.component.css']
})
export class CalendarComponent implements OnInit, OnChanges {

  @Input() targetEmployee: string = ''; 

  currentDate: Date = new Date();
  displayMonth: string = ''; 
  
  calendarDays: any[] = [];
  weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  constructor(private attendanceService: AttendanceService) { }

  ngOnInit() {
    this.generateCalendar();
    this.attendanceService.dataChanged$.subscribe(() => {
        this.generateCalendar();
    });
  }

  ngOnChanges() {
    this.generateCalendar();
  }

  changeMonth(offset: number) {
    this.currentDate.setMonth(this.currentDate.getMonth() + offset);
    this.generateCalendar();
  }

  // ============================================================
  // 1. HELPER: FORMAT STATUS TEXT (Clean up for Badge)
  // ============================================================
  formatStatus(status: string): string {
    if (!status) return '';
    // Remove "Leave:" prefix if present
    if (status.startsWith('Leave:')) {
        return status.replace('Leave:', '').trim(); 
    }
    // Handle Holiday Text
    if (status.startsWith('Holiday')) {
        return 'Holiday'; 
    }
    return status;
  }

  // ============================================================
  // 2. GENERATE CALENDAR GRID
  // ============================================================
  generateCalendar() {
    const year = this.currentDate.getFullYear();
    const month = this.currentDate.getMonth();
    
    this.displayMonth = this.currentDate.toLocaleString('default', { month: 'long', year: 'numeric' });

    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    this.calendarDays = [];

    // A. Empty cells (before 1st of month)
    for (let i = 0; i < firstDay; i++) {
      this.calendarDays.push({ date: null });
    }

    // B. Days with Data
    const userToCheck = this.targetEmployee || 'Dakota Rice';

    for (let day = 1; day <= daysInMonth; day++) {
      const dateKey = `${year}-${month + 1 < 10 ? '0' + (month+1) : month+1}-${day < 10 ? '0' + day : day}`;
      
      const statusText = this.attendanceService.getStatus(dateKey, userToCheck);
      const details = this.attendanceService.getLeaveDetails(dateKey, userToCheck);

      let statusClass = '';
      if (statusText.includes('Present')) statusClass = 'status-present';
      else if (statusText.includes('Holiday')) statusClass = 'status-holiday';
      else if (statusText.includes('Leave')) statusClass = 'status-leave';
      else if (statusText === 'Weekend') statusClass = 'status-weekend';

      this.calendarDays.push({
        date: day,
        fullDate: dateKey,
        status: statusText,
        cssClass: statusClass,
        details: details
      });
    }

    // C. Fill Remaining cells
    const totalCells = this.calendarDays.length;
    const remaining = 7 - (totalCells % 7);
    if (remaining < 7) {
        for (let i = 0; i < remaining; i++) {
            this.calendarDays.push({ date: null });
        }
    }
  }

  // ============================================================
  // 3. APPLY LEAVE (Current + Next Month Logic)
  // ============================================================
  applyLeaveFromCalendar(dateKey: string, type: string) {
      if(!dateKey) return;

      const userToCheck = this.targetEmployee || 'Dakota Rice';
      const selectedDate = new Date(dateKey);
      
      const today = new Date();
      
      // Start of Current Month
      const startOfCurrentMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      
      // End of Next Month
      const endOfNextMonth = new Date(today.getFullYear(), today.getMonth() + 2, 0);

      // Rule A: Prevent past months
      if(selectedDate < startOfCurrentMonth) {
          alert("Cannot apply leave for past months.");
          return;
      }

      // Rule B: Prevent far future (beyond next month)
      if(selectedDate > endOfNextMonth) {
          alert("You can only apply for leaves in the current or upcoming month.");
          return;
      }

      if(confirm(`Apply ${type} for ${dateKey}?`)) {
          let reason = 'Applied from Calendar';
          
          if(type === 'Optional Holiday') {
             const used = this.attendanceService.getOptionalHolidayCount(userToCheck);
             if(used.startsWith('3')) {
                 alert("You have already used 3/3 Optional Holidays.");
                 return;
             }
             reason = 'Personal Festival';
          }

          this.attendanceService.applyLeave(dateKey, type, reason, userToCheck);
          alert('Leave Request Applied Successfully!');
      }
  }

  // ============================================================
  // 4. RESET / CANCEL LEAVE (Only for Current & Future)
  // ============================================================
  resetLeave(dateKey: string) {
      if(!dateKey) return;

      const selectedDate = new Date(dateKey);
      const today = new Date();
      
      // Start of Current Month
      const startOfCurrentMonth = new Date(today.getFullYear(), today.getMonth(), 1);

      // VALIDATION: Prevent editing past months
      if (selectedDate < startOfCurrentMonth) {
          alert("Cannot edit attendance for past months.");
          return;
      }

      if (confirm(`Are you sure you want to cancel this leave for ${dateKey}?`)) {
          this.attendanceService.withdrawLeave(dateKey);
          alert('Leave cancelled. Status reset to default.');
      }
  }

  stopProp(event: Event) {
      event.stopPropagation();
  }
}