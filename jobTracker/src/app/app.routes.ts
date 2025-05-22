import { Routes } from '@angular/router';
import { ApplicationDetailsComponent } from './application-details/application-details.component';
import { DashboardComponent } from './dashboard/dashboard.component';
export const routes: Routes = [
  {
    path: '',
    component: DashboardComponent,
  },
  {
    path: 'applications/:id',
    component: ApplicationDetailsComponent,
  },
];
