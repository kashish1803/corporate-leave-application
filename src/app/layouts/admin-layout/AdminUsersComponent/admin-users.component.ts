import { Component, OnInit } from '@angular/core';
import { AttendanceService } from '../../../services/attendance.service';

@Component({
  selector: 'app-admin-users',
  templateUrl: './admin-users.component.html',
  styleUrls: ['./admin-users.component.css']
})
export class AdminUsersComponent implements OnInit {

  searchText: string = '';
  displayedUsers: any[] = [];
  managers: any[] = [];
  projects: any[] = [];
  
  showModal = false;         
  isEdit = false;            
  showProjectModal = false;  

  // 1. FORM DATA (Added Boolean Flags)
  formData: any = {
    id: null,
    firstName: '',
    lastName: '',
    empCode: '', 
    projectMailId: '',
    joiningDate: '',
    managerId: null,
    projectId: null,
    
    // Checkboxes
    isManager: false,
    isAdmin: false
  };

  projectData = { id: '', name: '' };

  constructor(private service: AttendanceService) {}

  ngOnInit() {
    this.loadData();
    this.service.dataChanged$.subscribe(() => {
        this.loadData();
    });
  }

  loadData() {
    this.displayedUsers = this.service.getEmployees();
    this.managers = this.service.getManagers();
    this.projects = this.service.getProjects();
    
    if (this.searchText) {
        this.onSearch();
    }
  }

  onSearch() {
    this.displayedUsers = this.service.searchEmployees(this.searchText);
  }

  getManagerName(id: number) { 
      const m = this.managers.find(mgr => mgr.id === id);
      return m ? m.name : '-'; 
  }

  getProjectName(id: any) { 
      const p = this.projects.find(proj => proj.id == id);
      return p ? p.name : '-'; 
  }

  openAddModal() {
    this.isEdit = false;
    // Reset Form
    this.formData = {
        firstName: '', lastName: '', empCode: '', projectMailId: '',
        joiningDate: '', managerId: null, projectId: null,
        isManager: false, isAdmin: false
    };
    this.showModal = true;
  }

  editUser(user: any) {
    this.isEdit = true;
    
    // 2. Convert Role String to Checkboxes
    const isManagerRole = user.role === 'Manager';
    const isAdminRole = user.role === 'Admin';

    this.formData = { 
        ...user,
        isManager: isManagerRole,
        isAdmin: isAdminRole
    };
    this.showModal = true;
  }

  saveUser() {
    if(!this.formData.firstName || !this.formData.lastName || !this.formData.empCode) {
        alert('Please fill in required fields: Name and Emp Code.');
        return;
    }

    // 3. Convert Checkboxes to Role String
    let finalRole = 'Employee';
    if (this.formData.isAdmin) {
        finalRole = 'Admin';
    } else if (this.formData.isManager) {
        finalRole = 'Manager';
    }

    const payload = {
        ...this.formData,
        role: finalRole
    };

    // Remove temp flags
    delete payload.isManager;
    delete payload.isAdmin;

    if(this.isEdit) {
        this.service.updateEmployee(payload);
    } else {
        this.service.addEmployee(payload);
    }
    
    this.showModal = false;
  }

  deleteUser(user: any) {
    if(confirm(`Are you sure you want to delete ${user.name}?`)) {
        this.service.deleteEmployee(user.id);
    }
  }

  openProjectModal() {
      this.projectData = { id: '', name: '' };
      this.showProjectModal = true;
  }

  saveProject() {
      if (!this.projectData.id || !this.projectData.name) {
          alert('Please enter both Project ID and Name.');
          return;
      }
      this.service.addProject({
          id: this.projectData.id, 
          name: this.projectData.name
      });
      this.showProjectModal = false;
  }
}