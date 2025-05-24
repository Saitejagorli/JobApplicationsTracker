import { Routes } from '@angular/router';
import { ApplicationDetailsComponent } from './application-details/application-details.component';
import { DashboardComponent } from './dashboard/dashboard.component';
import { PageNotFoundComponent } from './page-not-found/page-not-found.component';
export const routes: Routes = [
  {
    path: '',
    component: DashboardComponent,
  },
  {
    path: 'applications/:id',
    component: ApplicationDetailsComponent,
  },
  {
    path: '**',
    component: PageNotFoundComponent,
  },
];
