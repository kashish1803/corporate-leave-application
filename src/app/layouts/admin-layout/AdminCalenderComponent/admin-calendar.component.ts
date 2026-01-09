import { Component, OnInit } from '@angular/core';
import { AttendanceService } from '../../../services/attendance.service';

@Component({
  selector: 'app-admin-calendar',
  templateUrl: './admin-calendar.component.html',
  styleUrls: ['./admin-calendar.component.css']
})
export class AdminCalendarComponent implements OnInit {

  // Form Inputs
  scope: string = 'Global'; // Default
  targetId: any = null;
  eventDate: string = '';
  eventTitle: string = '';

  // Dropdown Data
  managers: any[] = [];
  projects: any[] = [];

  constructor(public service: AttendanceService) { }

  ngOnInit() {
    this.managers = this.service.getManagers();
    this.projects = this.service.getProjects();
  }

  saveEvent() {
    if(!this.eventDate || !this.eventTitle) {
        alert('Please enter a Date and Title');
        return;
    }

    if(this.scope !== 'Global' && !this.targetId) {
        alert(`Please select a specific ${this.scope}`);
        return;
    }

    const newEvent = {
        date: this.eventDate,
        title: this.eventTitle,
        scope: this.scope,
        targetId: this.targetId
    };

    this.service.addAdminEvent(newEvent);
    
    // Reset Form
    alert('Event added successfully!');
    this.eventDate = '';
    this.eventTitle = '';
    this.targetId = null;
  }
}