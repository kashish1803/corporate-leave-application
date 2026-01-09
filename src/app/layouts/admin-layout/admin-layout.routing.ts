import { Routes } from '@angular/router';
import { AuthGuard } from '../../guards/auth.guard';
import { RoleGuard } from '../../guards/role.guard';

import { DashboardComponent } from '../../dashboard/dashboard.component';
import { UserProfileComponent } from '../../user-profile/user-profile.component';
import { TableListComponent } from '../../table-list/table-list.component';
import { TypographyComponent } from '../../typography/typography.component';
import { IconsComponent } from '../../icons/icons.component';
import { MapsComponent } from '../../maps/maps.component';
import { NotificationsComponent } from '../../notifications/notifications.component';
import { UpgradeComponent } from '../../upgrade/upgrade.component';
import { MyTeamComponent } from '../../my-team/my-team.component';

// Admin Components
import { AdminViewComponent } from './AdminViewComponent/admin-view.component';
import { AdminUsersComponent } from './AdminUsersComponent/admin-users.component';
import { AdminCalendarComponent } from './AdminCalenderComponent/admin-calendar.component';

export const AdminLayoutRoutes: Routes = [

    // ---------------- ADMIN ONLY ----------------
    {
      path: 'admin-users',
      component: AdminUsersComponent,
      canActivate: [AuthGuard, RoleGuard],
      data: { roles: ['ADMIN'] }
    },
    {
      path: 'admin-view',
      component: AdminViewComponent,
      canActivate: [AuthGuard, RoleGuard],
      data: { roles: ['ADMIN'] }
    },
    {
      path: 'admin-calendar',
      component: AdminCalendarComponent,
      canActivate: [AuthGuard, RoleGuard],
      data: { roles: ['ADMIN'] }
    },

    // ---------------- MANAGER (+ ADMIN) ----------------
    {
      path: 'my-team',
      component: MyTeamComponent,
      canActivate: [AuthGuard, RoleGuard],
      data: { roles: ['MANAGER', 'ADMIN'] }
    },

    // ---------------- COMMON ----------------
    {
      path: 'dashboard',
      component: DashboardComponent,
      canActivate: [AuthGuard]
    },
    {
      path: 'user-profile',
      component: UserProfileComponent,
      canActivate: [AuthGuard]
    },
    {
      path: 'table-list',
      component: TableListComponent,
      canActivate: [AuthGuard]
    }
];
