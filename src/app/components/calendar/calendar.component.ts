import { Component, OnInit, Input } from '@angular/core';
import { AttendanceService } from '../../services/attendance.service';

@Component({
  selector: 'app-calendar',
  templateUrl: './calendar.component.html',
  styleUrls: ['./calendar.component.css']
})
export class CalendarComponent implements OnInit {
  @Input() targetEmployee: any = null;
  
  currentDate: Date = new Date();
  monthLabel: string = '';
  calendarDays: any[] = [];
  weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  leavesData: any[] = [];

  constructor(private service: AttendanceService) { }

  ngOnInit() {
    this.refreshData();
    this.service.dataChanged$.subscribe(() => this.refreshData());
  }

  private getSafeTargetId(): string | null {
    if (!this.targetEmployee) return null;
    return (typeof this.targetEmployee === 'object') 
        ? this.targetEmployee.employeeId 
        : this.targetEmployee;
}

refreshData() {
    const empId = this.getSafeTargetId();

    const fetchObservable = empId 
        ? this.service.getEmployeeTimeline(empId) 
        : this.service.getMyTimeline();

    fetchObservable.subscribe({
        next: (data: any[]) => {
            this.leavesData = (data || []).map((item: any) => ({
                ...item,
                attendanceDate: this.normalizeDate(item.attendanceDate || item.startDate || item.date)
            }));
            this.generateCalendar();
        }
    });
}

  private normalizeDate(dateInput: any): string {
    if (!dateInput) return '';
    if (Array.isArray(dateInput)) {
      return `${dateInput[0]}-${String(dateInput[1]).padStart(2, '0')}-${String(dateInput[2]).padStart(2, '0')}`;
    }
    if (typeof dateInput === 'string') {
      return dateInput.split('T')[0];
    }
    return '';
  }

  generateCalendar() {
  const year = this.currentDate.getFullYear();
  const month = this.currentDate.getMonth();
  this.monthLabel = this.currentDate.toLocaleString('default', { month: 'long', year: 'numeric' });

  const today = new Date();
  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();

  // 1. Check if the month being viewed is in the past
  const isPastMonth = (year < currentYear) || (year === currentYear && month < currentMonth);

  // 2. Identify User Role and Perspective
  const userRole = localStorage.getItem('userRole'); // Assuming 'ADMIN', 'MANAGER', or 'EMPLOYEE'
  const isViewingSubordinate = !!this.targetEmployee; // true if Manager/Admin clicked an employee

  // 3. Define the Lock Logic
  let canEditHistory: boolean = false;

  if (userRole === 'ADMIN') {
    // ADMIN: God mode - can edit self and anyone in any month
    canEditHistory = true; 
  } else if (userRole === 'MANAGER' && isViewingSubordinate) {
    // MANAGER: Can edit employees' past months, but NOT their own (isViewingSubordinate must be true)
    canEditHistory = true;
  } else {
    // EMPLOYEE or MANAGER (viewing self): Locked out of past months
    canEditHistory = false;
  }

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  this.calendarDays = [];

  // Fill empty slots
  for (let i = 0; i < firstDay; i++) {
    this.calendarDays.push({ date: null, leaves: [] });
  }

  for (let day = 1; day <= daysInMonth; day++) {
    const monthStr = String(month + 1).padStart(2, '0');
    const dayStr = String(day).padStart(2, '0');
    const dateKey = `${year}-${monthStr}-${dayStr}`;

    const dailyLeaves = this.leavesData.filter(r => {
      const rDate = this.normalizeDate(r.attendanceDate || r.date);
      return rDate === dateKey && !r.isWithdrawn;
    });

    // 4. Final Lock Determination
    // If it's a past month and the user doesn't have history edit rights, it's locked.
    const isLocked = isPastMonth && !canEditHistory;

    this.calendarDays.push({ 
      date: day, 
      fullDate: dateKey, 
      leaves: dailyLeaves, 
      isWeekend: (new Date(year, month, day).getDay() % 6 === 0),
      isLocked: isLocked 
    });
  }
}

  changeMonth(offset: number) {
    this.currentDate.setMonth(this.currentDate.getMonth() + offset);
    this.generateCalendar();
  }

  applyAction(day: any, action: string) {
    if (!day.date || day.isLocked) return;

    const empId = this.getSafeTargetId();

    const statusMap: { [key: string]: string } = {
        'Leave': 'LEAVE',
        'Half Day': 'HALF_DAY',
        'Optional Holiday': 'HOLIDAY',
        'Cancel': 'PRESENT'
    };
    const type = statusMap[action];

    if (empId) {
        // MANAGER MODE: Use the override service
        this.service.applyLeave(day.fullDate, type, 'Manager Override', empId).subscribe();
    } else {
        // PERSONAL MODE: Standard employee dashboard behavior
        if (action === 'Cancel') {
            this.service.withdrawLeave(day.fullDate).subscribe();
        } else {
            this.service.applyLeave(day.fullDate, type, 'Self Applied').subscribe();
        }
    }
}
}