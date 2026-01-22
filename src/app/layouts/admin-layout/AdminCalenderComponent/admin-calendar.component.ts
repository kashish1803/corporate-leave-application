import { Component, OnInit } from '@angular/core';
import { AttendanceService } from '../../../services/attendance.service';

@Component({
  selector: 'app-admin-calendar',
  templateUrl: './admin-calendar.component.html',
  styleUrls: ['./admin-calendar.component.css']
})
export class AdminCalendarComponent implements OnInit {

  // Data Containers
  managers: any[] = [];
  projects: any[] = [];
  
  // FIX: Define this locally since Service no longer has it
  adminEvents: any[] = []; 
  
  // Form Data
  newEvent: any = { title: '', date: '', scope: 'Global', targetId: null };

  constructor(public service: AttendanceService) { }

  ngOnInit() {
    this.loadData();
  }

  loadData() {
      // FIX: Subscribe to Observables
      this.service.getManagers().subscribe(data => this.managers = data);
      this.service.getProjects().subscribe(data => this.projects = data);
  }

  addEvent() {
      if(!this.newEvent.title || !this.newEvent.date) {
          alert('Please fill required fields');
          return;
      }
      
      // FIX: Push to local array instead of service
      this.adminEvents.push({ ...this.newEvent });
      
      // Clear Form
      this.newEvent = { title: '', date: '', scope: 'Global', targetId: null };
      alert("Event Added (Local Only)");
  }
}