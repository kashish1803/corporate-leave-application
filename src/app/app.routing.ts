import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Routes, RouterModule } from '@angular/router'; // Remove BrowserModule

import { AuthGuard } from './guards/auth.guard';
import { AdminLayoutComponent } from './layouts/admin-layout/admin-layout.component';
import { LoginComponent } from './login/login.component';

const routes: Routes = [
  // 1. Initial Load: Redirect empty path to Login
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full',
  },
  
  // 2. Login Page
  {
    path: 'login',
    component: LoginComponent
  },

  // 3. Admin Panel (Catches all other routes)
  // This loads the Layout, which then handles 'admin-users', 'dashboard', etc.
  {
    path: '',
    component: AdminLayoutComponent,
    canActivate: [AuthGuard],
    children: [{
      path: '',
      loadChildren: () =>
        import('./layouts/admin-layout/admin-layout.module')
          .then(m => m.AdminLayoutModule)
    }]
  }
];

@NgModule({
  imports: [
    CommonModule,
    // FIX 1: Removed BrowserModule (It belongs in app.module.ts only)
    RouterModule.forRoot(routes, {
       useHash: true // Keeps URL stable on refresh
    })
  ],
  exports: [
    RouterModule // <--- FIX 2: REQUIRED to use <router-outlet> in AppComponent
  ],
})
export class AppRoutingModule { }