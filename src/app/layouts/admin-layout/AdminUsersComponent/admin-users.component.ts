import { Component, OnInit } from '@angular/core';
import { AttendanceService, Employee, Project } from '../../../services/attendance.service';

@Component({
  selector: 'app-admin-users',
  templateUrl: './admin-users.component.html',
  styleUrls: ['./admin-users.component.css']
})
export class AdminUsersComponent implements OnInit {

  searchText: string = '';
  
  // Data Containers
  displayedUsers: Employee[] = [];
  managers: Employee[] = [];
  projects: Project[] = [];
  
  // UI States
  showModal = false;         
  isEdit = false;            
  showProjectModal = false;  

  // NEW: State for Attendance Oversight
  selectedEmployeeForAttendance: any = null;

  // 1. FORM DATA
  formData: any = {
    id: null,
    firstName: '',
    lastName: '',
    empCode: '',        // Maps to employeeId
    projectMailId: '',  // Maps to projectEmailId
    joiningDate: '',
    managerId: null,    // Captures ID from dropdown
    projectId: null,    
    role: 'EMPLOYEE'    
  };

  projectData = { id: '', name: '' };

  constructor(private service: AttendanceService) {}

  ngOnInit() {
    this.loadData();
    this.service.dataChanged$.subscribe(() => {
        this.loadData();
    });
  }

  // ============================================================
  // 1. LOAD DATA
  // ============================================================
  loadData() {
    this.service.getEmployees().subscribe(data => {
        this.displayedUsers = data;
        this.managers = data.filter(u => u.role === 'ADMIN' || u.role === 'MANAGER');

        if (this.searchText) this.onSearch();
    });

    this.service.getProjects().subscribe(data => {
        this.projects = data;
    });
  }

  onSearch() {
    this.displayedUsers = this.service.searchEmployees(this.searchText);
  }

  getManagerName(id: any) { 
      const m = this.managers.find(mgr => (mgr.employeeId == id || mgr.id == id));
      return m ? m.name : '-'; 
  }

  getProjectName(id: any) { 
      const p = this.projects.find(proj => proj.projectId == id || proj.id == id);
      return p ? p.projectName : '-'; 
  }

  // ============================================================
  // 2. ATTENDANCE OVERSIGHT LOGIC
  // ============================================================
  
  viewUserAttendance(user: any) {
    // This triggers the <app-calendar> in the HTML
    this.selectedEmployeeForAttendance = user;
    
    // Smooth scroll to the calendar section
    setTimeout(() => {
        const element = document.getElementById('attendance-oversight-section');
        element?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  }

  closeAttendanceView() {
    this.selectedEmployeeForAttendance = null;
  }

  // ============================================================
  // 3. MODAL LOGIC
  // ============================================================
  openAddModal() {
    this.isEdit = false;
    this.formData = {
        id: null,
        firstName: '', lastName: '', empCode: '', projectMailId: '',
        joiningDate: '', managerId: null, projectId: null,
        role: 'EMPLOYEE'
    };
    this.showModal = true;
  }

  editUser(user: Employee) {
    this.isEdit = true;
    this.formData = { 
        id: user.employeeId || user.empCode, 
        firstName: user.firstName,
        lastName: user.lastName,
        empCode: user.employeeId || user.empCode, 
        projectMailId: user.projectEmailId,
        joiningDate: user.joiningDate,
        projectId: user.projectId,
        managerId: user.managerEmployeeId,
        role: user.role 
    };
    this.showModal = true;
  }

  // ============================================================
  // 4. SAVE USER (Create / Update)
  // ============================================================
  saveUser() {
    if(!this.formData.firstName || !this.formData.lastName || !this.formData.empCode || !this.formData.projectMailId) {
        alert('Please fill in Name, Emp Code, and Email.');
        return;
    }

    const finalRole = this.formData.role || 'EMPLOYEE';
    let managerToSubmit = this.formData.managerId;

    if (finalRole !== 'ADMIN' && !managerToSubmit) {
        if (finalRole === 'MANAGER') {
            const defaultAdmin = this.managers.find(m => m.role === 'ADMIN');
            if (defaultAdmin) {
                managerToSubmit = defaultAdmin.employeeId;
            } else {
                alert("Error: At least one ADMIN must exist to act as a supervisor for Managers.");
                return;
            }
        } else {
            alert("Error: You must assign a Manager for Employees.");
            return;
        }
    }

    const payload = {
        id: this.formData.id || this.formData.empCode, 
        firstName: this.formData.firstName,
        lastName: this.formData.lastName,
        projectEmailId: this.formData.projectMailId, 
        employeeId: this.formData.empCode,     
        role: finalRole,
        joiningDate: this.formData.joiningDate,
        projectId: this.formData.projectId,
        managerEmployeeId: managerToSubmit 
    };

    const request = this.isEdit ? 
        this.service.updateEmployee(payload) : 
        this.service.addEmployee(payload);

    request.subscribe({
        next: () => {
            alert(`User ${this.isEdit ? 'updated' : 'added'} successfully!`);
            this.showModal = false;
            this.loadData();
        },
        error: (err) => {
            console.error("Save failed", err);
            const errorMsg = err.error?.message || "Server Error";
            alert("Action failed: " + errorMsg);
        }
    });
  }

  // ============================================================
  // 5. DELETE USER
  // ============================================================
  deleteUser(user: Employee) {
    if(confirm(`Are you sure you want to delete ${user.name}?`)) {
        this.service.deleteEmployee(user.employeeId).subscribe({
            next: () => alert("User deleted."),
            error: (err) => alert("Delete failed.")
        });
    }
  }

  // ============================================================
  // 6. PROJECTS
  // ============================================================
  openProjectModal() {
      this.projectData = { id: '', name: '' };
      this.showProjectModal = true;
  }

  saveProject() {
      if (!this.projectData.id || !this.projectData.name) {
          alert('Please enter both Project ID and Name.');
          return;
      }
      
      const projectPayload = {
          id: this.projectData.id,
          name: this.projectData.name
      };

      this.service.addProject(projectPayload).subscribe({
          next: () => {
              alert("Project created!");
              this.showProjectModal = false;
              this.loadData();
          },
          error: (err) => {
              alert("Failed to create project.");
          }
      });
  }
}